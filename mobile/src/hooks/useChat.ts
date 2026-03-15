import { useEffect, useState, useCallback, useRef } from 'react';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import {
  getSocket,
  joinRoom,
  leaveRoom,
  subscribeToConnect,
} from '@/api/socket';
import {
  generateKeyPair,
  keyPairFromSecretKey,
  deriveSharedSecret,
  encrypt,
  decrypt,
  bytesToBase64,
  base64ToBytes,
  type KeyPair,
} from '@/utils/crypto';

export interface Message {
  id: string;
  content: string;
  senderId: string;
  timestamp: number;
}

interface PendingMessage {
  encryptedPayload: string;
  clientMsgId: string;
  senderId: string;
  timestamp: number;
  msgIndex: number;
}

interface UseChatOptions {
  sessionId: string | undefined;
  userId: string;
}

interface UseChatReturn {
  messages: Message[];
  sendMessage: (content: string) => void;
  isEncryptionReady: boolean;
}

// Secret key is stored under this key prefix in expo-secure-store.
// This allows restoring the key after a hard app kill so the 24h Redis
// message buffer can still be decrypted on restart.
// The key is deleted when the user intentionally leaves the chat screen.
const SK_STORE_KEY = (sessionId: string) => `chat_sk_${sessionId}`;

export function useChat({ sessionId, userId }: UseChatOptions): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isEncryptionReady, setIsEncryptionReady] = useState(false);

  // Bumped each time the socket connects so the setup effect re-runs when
  // the socket wasn't ready on the initial render (child effects run before
  // parent effects, so _layout's connectSocket may not have fired yet).
  const [socketTick, setSocketTick] = useState(0);

  const keyPairRef = useRef<KeyPair | null>(null);
  const sharedSecretRef = useRef<Uint8Array | null>(null);
  const lastMsgIndexRef = useRef<number>(-1);
  const pendingDecryptRef = useRef<PendingMessage[]>([]);

  // Subscribe to socket connect events so the chat setup effect re-runs
  // if the socket wasn't available on the first render.
  useEffect(() => {
    return subscribeToConnect(() => setSocketTick(t => t + 1));
  }, []);

  useEffect(() => {
    if (!sessionId) return;

    const socket = getSocket();
    if (!socket) return;

    // ── Event handlers (registered immediately so no events are dropped
    //   during the async SecureStore read below) ──────────────────────

    const onKeyExchange = (payload: {
      sessionId: string;
      userId: string;
      publicKey: string;
    }) => {
      if (payload.userId === userId) return;
      if (!keyPairRef.current) return; // init hasn't finished yet (extremely unlikely but safe)

      const peerPublicKey = base64ToBytes(payload.publicKey);
      // Store in a local const so TypeScript can narrow out null and the
      // value is stable for the rest of this handler.
      const shared = deriveSharedSecret(
        keyPairRef.current.secretKey,
        peerPublicKey,
      );
      sharedSecretRef.current = shared;
      setIsEncryptionReady(true);

      // Decrypt any messages that arrived before the key exchange completed
      if (pendingDecryptRef.current.length > 0) {
        const decrypted: Message[] = [];
        for (const msg of pendingDecryptRef.current) {
          const content = decrypt(msg.encryptedPayload, shared);
          if (content) {
            decrypted.push({
              id: msg.clientMsgId,
              content,
              senderId: msg.senderId,
              timestamp: msg.timestamp,
            });
          }
        }
        if (decrypted.length > 0) setMessages(prev => [...prev, ...decrypted]);
        pendingDecryptRef.current = [];
      }
    };

    const onMessageReceive = (payload: {
      encryptedPayload: string;
      clientMsgId: string;
      timestamp: number;
      senderId: string;
      msgIndex: number;
    }) => {
      lastMsgIndexRef.current = Math.max(
        lastMsgIndexRef.current,
        payload.msgIndex,
      );

      // Read into a local const so TS can narrow out null and the value
      // is stable between the guard and the decrypt call.
      const shared = sharedSecretRef.current;
      if (!shared) {
        pendingDecryptRef.current.push(payload);
        return;
      }

      const content = decrypt(payload.encryptedPayload, shared);
      if (content === null) {
        console.warn('Failed to decrypt message:', payload.clientMsgId);
        return;
      }

      setMessages(prev => [
        ...prev,
        {
          id: payload.clientMsgId,
          content,
          senderId: payload.senderId,
          timestamp: payload.timestamp,
        },
      ]);
    };

    const onReconnect = () => {
      joinRoom(sessionId);

      if (keyPairRef.current) {
        socket.emit('key:exchange', {
          sessionId,
          publicKey: bytesToBase64(keyPairRef.current.publicKey),
        });
      }

      if (lastMsgIndexRef.current >= 0) {
        socket.emit(
          'message:sync',
          { sessionId, lastMsgIndex: lastMsgIndexRef.current + 1 },
          (response: { messages: Record<string, unknown>[] }) => {
            const shared = sharedSecretRef.current;
            if (!shared || !response?.messages) return;

            const synced: Message[] = [];
            for (const msg of response.messages) {
              const senderId = msg.senderId as string;
              if (senderId === userId) continue;

              const content = decrypt(msg.encryptedPayload as string, shared);
              if (!content) continue;

              const clientMsgId = msg.clientMsgId as string;
              synced.push({
                id: clientMsgId,
                content,
                senderId,
                timestamp: msg.timestamp as number,
              });

              if (typeof msg.msgIndex === 'number') {
                lastMsgIndexRef.current = Math.max(
                  lastMsgIndexRef.current,
                  msg.msgIndex,
                );
              }
            }

            if (synced.length > 0) {
              setMessages(prev => {
                const existingIds = new Set(prev.map(m => m.id));
                const newMsgs = synced.filter(m => !existingIds.has(m.id));
                return newMsgs.length > 0 ? [...prev, ...newMsgs] : prev;
              });
            }
          },
        );
      }
    };

    socket.on('key:exchange', onKeyExchange);
    socket.on('message:receive', onMessageReceive);
    socket.io.on('reconnect', onReconnect);

    // ── Async init: get or generate key pair, then join room ─────────
    // Handlers are already registered above so no events are missed
    // during the SecureStore read (~5ms, well under any network RTT).

    let cancelled = false;

    const init = async () => {
      const stored = await SecureStore.getItemAsync(SK_STORE_KEY(sessionId));
      if (cancelled) return;

      // Store the result in a local const so TypeScript knows it is non-null
      // for the rest of this function, without relying on ref narrowing.
      const keyPair = stored ? keyPairFromSecretKey(stored) : generateKeyPair();
      keyPairRef.current = keyPair;

      if (!stored) {
        await SecureStore.setItemAsync(
          SK_STORE_KEY(sessionId),
          bytesToBase64(keyPair.secretKey),
        );
      }

      if (cancelled) return;

      // Join room (server will emit any stored peer keys back to us)
      joinRoom(sessionId);

      // Send our public key — same key whether new or restored
      socket.emit('key:exchange', {
        sessionId,
        publicKey: bytesToBase64(keyPair.publicKey),
      });
    };

    void init();

    return () => {
      cancelled = true;
      socket.off('key:exchange', onKeyExchange);
      socket.off('message:receive', onMessageReceive);
      socket.io.off('reconnect', onReconnect);
      leaveRoom(sessionId);

      // Delete the stored key — the user intentionally left the chat screen.
      // A hard app kill never reaches here, so the key persists in SecureStore
      // and is available on the next launch for crash recovery.
      void SecureStore.deleteItemAsync(SK_STORE_KEY(sessionId));

      keyPairRef.current = null;
      sharedSecretRef.current = null;
      pendingDecryptRef.current = [];
    };
  }, [sessionId, userId, socketTick]);

  // ── Send Message ──────────────────────────────────────────────────

  const sendMessage = useCallback(
    (content: string) => {
      if (!sessionId || content.trim() === '') return;

      // Read into a local const so TS can narrow out null and the value
      // can't change between the guard and the encrypt call.
      const shared = sharedSecretRef.current;
      if (!shared) return;

      const socket = getSocket();
      if (!socket) return;

      const clientMsgId = Crypto.randomUUID();
      const timestamp = Date.now();
      const encryptedPayload = encrypt(content, shared);

      socket.emit(
        'message:send',
        { sessionId, encryptedPayload, clientMsgId, timestamp },
        (ack: { msgIndex: number }) => {
          if (typeof ack?.msgIndex === 'number') {
            lastMsgIndexRef.current = Math.max(
              lastMsgIndexRef.current,
              ack.msgIndex,
            );
          }
        },
      );

      setMessages(prev => [
        ...prev,
        { id: clientMsgId, content, senderId: userId, timestamp },
      ]);
    },
    [sessionId, userId],
  );

  return { messages, sendMessage, isEncryptionReady };
}

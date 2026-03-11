import { useEffect, useState, useCallback, useRef } from 'react';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { getSocket, joinRoom, leaveRoom } from '@/api/socket';
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

  const keyPairRef = useRef<KeyPair | null>(null);
  const sharedSecretRef = useRef<Uint8Array | null>(null);
  const lastMsgIndexRef = useRef<number>(-1);
  const pendingDecryptRef = useRef<PendingMessage[]>([]);

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
      sharedSecretRef.current = deriveSharedSecret(
        keyPairRef.current.secretKey,
        peerPublicKey,
      );
      setIsEncryptionReady(true);

      // Decrypt any messages that arrived before the key exchange completed
      if (pendingDecryptRef.current.length > 0) {
        const decrypted: Message[] = [];
        for (const msg of pendingDecryptRef.current) {
          const content = decrypt(
            msg.encryptedPayload,
            sharedSecretRef.current,
          );
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

      if (!sharedSecretRef.current) {
        pendingDecryptRef.current.push(payload);
        return;
      }

      const content = decrypt(
        payload.encryptedPayload,
        sharedSecretRef.current,
      );
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
            if (!sharedSecretRef.current || !response?.messages) return;

            const synced: Message[] = [];
            for (const msg of response.messages) {
              const senderId = msg.senderId as string;
              if (senderId === userId) continue;

              const content = decrypt(
                msg.encryptedPayload as string,
                sharedSecretRef.current,
              );
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

      if (stored) {
        // Restore the key pair from the previous session mount.
        // This lets us decrypt the Redis message buffer after a hard app kill.
        keyPairRef.current = keyPairFromSecretKey(stored);
      } else {
        keyPairRef.current = generateKeyPair();
        await SecureStore.setItemAsync(
          SK_STORE_KEY(sessionId),
          bytesToBase64(keyPairRef.current.secretKey),
        );
      }

      if (cancelled) return;

      // Join room (server will emit any stored peer keys back to us)
      joinRoom(sessionId);

      // Send our public key — same key whether new or restored
      socket.emit('key:exchange', {
        sessionId,
        publicKey: bytesToBase64(keyPairRef.current.publicKey),
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
  }, [sessionId, userId]);

  // ── Send Message ──────────────────────────────────────────────────

  const sendMessage = useCallback(
    (content: string) => {
      if (!sessionId || !sharedSecretRef.current || content.trim() === '')
        return;

      const socket = getSocket();
      if (!socket) return;

      const clientMsgId = Crypto.randomUUID();
      const timestamp = Date.now();
      const encryptedPayload = encrypt(content, sharedSecretRef.current);

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

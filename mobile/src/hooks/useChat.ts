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
  endSession: () => void;
  isEncryptionReady: boolean;
  isPeerConnected: boolean;
  isSessionEnded: boolean;
}

// Secret key is stored under this key prefix in expo-secure-store.
// This allows restoring the key after a hard app kill so the 24h Redis
// message buffer can still be decrypted on restart.
// The key is deleted when the user intentionally leaves the chat screen.
const SK_STORE_KEY = (sessionId: string) => `chat_sk_${sessionId}`;

export function useChat({ sessionId, userId }: UseChatOptions): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isEncryptionReady, setIsEncryptionReady] = useState(false);
  const [isPeerConnected, setIsPeerConnected] = useState(true);
  const [isSessionEnded, setIsSessionEnded] = useState(false);

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
      accountId: string; // server field — was incorrectly "userId" in old code
      publicKey: string;
    }) => {
      if (payload.accountId === userId) return; // own key reflected back
      if (!keyPairRef.current) return; // init hasn't finished yet (extremely unlikely but safe)

      const peerPublicKey = base64ToBytes(payload.publicKey);
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

    // Server pushes missed messages after a reconnect (triggered by the
    // lastMsgIndex we pass to room:join — no client-emitted request needed).
    const onMessageSync = (payload: {
      sessionId: string;
      messages: {
        encryptedPayload: string;
        clientMsgId: string;
        senderId: string;
        timestamp: number;
        msgIndex?: number;
      }[];
    }) => {
      if (payload.sessionId !== sessionId) return;

      const shared = sharedSecretRef.current;
      if (!shared || !payload.messages?.length) return;

      const synced: Message[] = [];
      for (const msg of payload.messages) {
        if (msg.senderId === userId) continue; // skip own messages

        const content = decrypt(msg.encryptedPayload, shared);
        if (!content) continue;

        synced.push({
          id: msg.clientMsgId,
          content,
          senderId: msg.senderId,
          timestamp: msg.timestamp,
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
    };

    const onPeerDisconnected = () => setIsPeerConnected(false);
    const onPeerReconnected = () => setIsPeerConnected(true);

    const onSessionEnded = () => {
      setIsSessionEnded(true);
      setIsPeerConnected(false);
    };

    // Socket.IO internal reconnect: re-join room and re-broadcast our key.
    // We pass lastMsgIndex so the server knows which messages to sync.
    const onReconnect = () => {
      const lastIndex =
        lastMsgIndexRef.current >= 0 ? lastMsgIndexRef.current + 1 : undefined;
      joinRoom(sessionId, lastIndex);

      if (keyPairRef.current) {
        socket.emit('key:exchange', {
          sessionId,
          publicKey: bytesToBase64(keyPairRef.current.publicKey),
        });
      }
    };

    socket.on('key:exchange', onKeyExchange);
    socket.on('message:receive', onMessageReceive);
    socket.on('message:sync', onMessageSync);
    socket.on('peer:disconnected', onPeerDisconnected);
    socket.on('peer:reconnected', onPeerReconnected);
    socket.on('session:ended', onSessionEnded);
    socket.io.on('reconnect', onReconnect);

    // ── Async init: get or generate key pair, then join room ─────────

    let cancelled = false;

    const init = async () => {
      const stored = await SecureStore.getItemAsync(SK_STORE_KEY(sessionId));
      if (cancelled) return;

      const keyPair = stored ? keyPairFromSecretKey(stored) : generateKeyPair();
      keyPairRef.current = keyPair;

      if (!stored) {
        await SecureStore.setItemAsync(
          SK_STORE_KEY(sessionId),
          bytesToBase64(keyPair.secretKey),
        );
      }

      if (cancelled) return;

      // Join room — server echoes back any stored peer keys for late joiners
      joinRoom(sessionId);

      // Broadcast our public key so the peer can derive the shared secret
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
      socket.off('message:sync', onMessageSync);
      socket.off('peer:disconnected', onPeerDisconnected);
      socket.off('peer:reconnected', onPeerReconnected);
      socket.off('session:ended', onSessionEnded);
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

  // ── End Session ───────────────────────────────────────────────────

  const endSession = useCallback(() => {
    if (!sessionId) return;
    const socket = getSocket();
    if (!socket) return;
    socket.emit('session:end', { sessionId });
    // Optimistically mark as ended locally — server will confirm via session:ended
    setIsSessionEnded(true);
  }, [sessionId]);

  return {
    messages,
    sendMessage,
    endSession,
    isEncryptionReady,
    isPeerConnected,
    isSessionEnded,
  };
}

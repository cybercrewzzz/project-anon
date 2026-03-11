import { useEffect, useState, useCallback, useRef } from 'react';
import * as Crypto from 'expo-crypto';
import { getSocket, joinRoom, leaveRoom } from '@/api/socket';
import {
  generateKeyPair,
  deriveSharedSecret,
  encrypt,
  decrypt,
  publicKeyToBase64,
  publicKeyFromBase64,
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

export function useChat({ sessionId, userId }: UseChatOptions): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isEncryptionReady, setIsEncryptionReady] = useState(false);

  // Ephemeral keys stored in refs (not state) — no re-render needed,
  // lost on unmount which is correct for forward secrecy.
  const keyPairRef = useRef<KeyPair | null>(null);
  const sharedSecretRef = useRef<Uint8Array | null>(null);
  const lastMsgIndexRef = useRef<number>(-1);

  // Queue for messages received before key exchange completes
  const pendingDecryptRef = useRef<PendingMessage[]>([]);

  useEffect(() => {
    if (!sessionId) return;

    const socket = getSocket();
    if (!socket) return;

    // 1. Generate ephemeral key pair
    keyPairRef.current = generateKeyPair();

    // 2. Join the room
    joinRoom(sessionId);

    // 3. Send our public key to the room
    socket.emit('key:exchange', {
      sessionId,
      publicKey: publicKeyToBase64(keyPairRef.current.publicKey),
    });

    // 4. Listen for peer's public key
    const onKeyExchange = (payload: {
      sessionId: string;
      userId: string;
      publicKey: string;
    }) => {
      if (payload.userId === userId) return;
      if (!keyPairRef.current) return;

      const peerPublicKey = publicKeyFromBase64(payload.publicKey);
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
        if (decrypted.length > 0) {
          setMessages(prev => [...prev, ...decrypted]);
        }
        pendingDecryptRef.current = [];
      }
    };

    // 5. Listen for incoming messages
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
        // Key exchange not complete yet — queue for later decryption
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

    // 6. Handle socket reconnection
    const onReconnect = () => {
      joinRoom(sessionId);

      // Re-send our public key (in case Redis lost it or expired)
      if (keyPairRef.current) {
        socket.emit('key:exchange', {
          sessionId,
          publicKey: publicKeyToBase64(keyPairRef.current.publicKey),
        });
      }

      // Request missed messages
      if (lastMsgIndexRef.current >= 0) {
        socket.emit(
          'message:sync',
          {
            sessionId,
            lastMsgIndex: lastMsgIndexRef.current + 1,
          },
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

    return () => {
      socket.off('key:exchange', onKeyExchange);
      socket.off('message:receive', onMessageReceive);
      socket.io.off('reconnect', onReconnect);
      leaveRoom(sessionId);

      // Clear ephemeral keys
      keyPairRef.current = null;
      sharedSecretRef.current = null;
      pendingDecryptRef.current = [];
    };
  }, [sessionId, userId]);

  // ── Send Message ────────────────────────────────────────────────

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
        {
          sessionId,
          encryptedPayload,
          clientMsgId,
          timestamp,
        },
        (ack: { msgIndex: number }) => {
          if (typeof ack?.msgIndex === 'number') {
            lastMsgIndexRef.current = Math.max(
              lastMsgIndexRef.current,
              ack.msgIndex,
            );
          }
        },
      );

      // Optimistically add plaintext to local messages (we are the sender)
      setMessages(prev => [
        ...prev,
        { id: clientMsgId, content, senderId: userId, timestamp },
      ]);
    },
    [sessionId, userId],
  );

  return { messages, sendMessage, isEncryptionReady };
}

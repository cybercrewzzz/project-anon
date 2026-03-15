import { io, Socket } from 'socket.io-client';

const WS_URL = process.env.EXPO_PUBLIC_WS_URL;

let socket: Socket | null = null;
let currentUserId: string | null = null;
let currentToken: string | null = null;

// Callbacks notified whenever a socket successfully connects.
// useChat subscribes so it can retry setup if the socket wasn't
// ready when the effect first ran.
const connectListeners = new Set<() => void>();

function notifyConnect() {
  for (const cb of connectListeners) cb();
}

export function subscribeToConnect(cb: () => void): () => void {
  if (socket?.connected) cb();
  connectListeners.add(cb);
  return () => connectListeners.delete(cb);
}

/**
 * Open (or reuse) the WebSocket connection.
 *
 * @param userId  - The account UUID, used as fallback identity in development.
 * @param token   - JWT access token. When provided the gateway authenticates
 *                  via `auth: { token: 'Bearer <token>' }`.  When omitted the
 *                  dev-only `query.userId` fallback is used instead.
 */
export function connectSocket(userId: string, token?: string): Socket {
  if (!WS_URL) {
    throw new Error(
      'EXPO_PUBLIC_WS_URL is not set. Add it to mobile/.env (e.g. http://localhost:3000)',
    );
  }

  // Reuse the existing connection when both userId and token are unchanged.
  if (
    socket?.connected &&
    currentUserId === userId &&
    currentToken === (token ?? null)
  ) {
    return socket;
  }

  // Tear down the old connection before opening a new one.
  if (socket) {
    socket.disconnect();
    socket = null;
  }

  currentUserId = userId;
  currentToken = token ?? null;

  socket = io(WS_URL, {
    // Production auth: JWT in the handshake auth object.
    // The gateway's dev fallback accepts query.userId when no token is present.
    auth: token ? { token: `Bearer ${token}` } : undefined,
    query: { userId },
    transports: ['websocket'],
  });

  socket.on('connect', notifyConnect);

  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
    currentUserId = null;
    currentToken = null;
  }
}

/**
 * Join a session room.
 *
 * @param sessionId    - The chat session UUID.
 * @param lastMsgIndex - When reconnecting, pass the last message index the
 *                       client has seen so the server can push a message:sync.
 */
export function joinRoom(sessionId: string, lastMsgIndex?: number): void {
  socket?.emit('room:join', {
    sessionId,
    ...(lastMsgIndex !== undefined && { lastMsgIndex }),
  });
}

export function leaveRoom(sessionId: string): void {
  socket?.emit('room:leave', { sessionId });
}

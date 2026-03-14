import { io, Socket } from 'socket.io-client';

const WS_URL = process.env.EXPO_PUBLIC_WS_URL;

let socket: Socket | null = null;
let currentUserId: string | null = null;

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

export function connectSocket(userId: string): Socket {
  if (!WS_URL) {
    throw new Error(
      'EXPO_PUBLIC_WS_URL is not set. Add it to mobile/.env (e.g. http://localhost:3000)',
    );
  }

  // Reuse the existing connection when the userId hasn't changed.
  if (socket?.connected && currentUserId === userId) {
    return socket;
  }

  // If userId has changed, tear down the old connection first.
  if (socket) {
    socket.disconnect();
    socket = null;
  }

  currentUserId = userId;
  socket = io(WS_URL, {
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
  }
}

export function joinRoom(sessionId: string): void {
  socket?.emit('room:join', { sessionId });
}

export function leaveRoom(sessionId: string): void {
  socket?.emit('room:leave', { sessionId });
}

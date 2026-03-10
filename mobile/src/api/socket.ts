import { io, Socket } from 'socket.io-client';

const WS_URL = process.env.EXPO_PUBLIC_WS_URL;

if (!WS_URL) {
  throw new Error(
    'EXPO_PUBLIC_WS_URL is not set. Add it to mobile/.env (e.g. http://localhost:3000)',
  );
}

let socket: Socket | null = null;

export function connectSocket(userId: string): Socket {
  if (socket?.connected) {
    return socket;
  }

  socket = io(WS_URL, {
    query: { userId },
    transports: ['websocket'],
  });

  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function joinRoom(sessionId: string): void {
  socket?.emit('room:join', { sessionId });
}

export function leaveRoom(sessionId: string): void {
  socket?.emit('room:leave', { sessionId });
}

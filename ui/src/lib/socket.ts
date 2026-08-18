import { io, Socket } from 'socket.io-client';
import { api } from './api';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3000';

let socket: Socket | null = null;
let roomSocket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      auth: { token: api.getAccessToken() },
    });
  }
  return socket;
}

export function connectSocket() {
  const s = getSocket();
  s.auth = { token: api.getAccessToken() };
  if (!s.connected) s.connect();
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}

export function getRoomSocket(room: string): Socket {
  if (!roomSocket) {
    roomSocket = io(SOCKET_URL, {
      autoConnect: false,
      query: { room },
    });
  }
  return roomSocket;
}

export function connectRoomSocket(room: string) {
  const s = getRoomSocket(room);
  if (!s.connected) s.connect();
}

export function disconnectRoomSocket() {
  roomSocket?.disconnect();
  roomSocket = null;
}

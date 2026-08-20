import { io, Socket } from 'socket.io-client';
import { api } from './api';
import { getSocketUrl } from './storefront-context';

let socket: Socket | null = null;
let roomSocket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(getSocketUrl(), {
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
    roomSocket = io(getSocketUrl(), {
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

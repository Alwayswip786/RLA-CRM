import { io, type Socket } from 'socket.io-client';
import { API_BASE_URL, getAdminAccessToken } from './apiClient';
import type { ChatMessage } from '../types/doubt.types';

export interface ServerToClientEvents {
  'chat:connected': (payload: { userId: string; role: string; name: string }) => void;
  'message:new': (message: ChatMessage) => void;
  'message:delivered': (payload: { conversationId: string; messageIds: string[]; deliveredAt: string }) => void;
  'message:read': (payload: { conversationId: string; userId: string; readAt: string }) => void;
  'typing:start': (payload: { conversationId: string; userId: string; userName: string; userRole: string }) => void;
  'typing:stop': (payload: { conversationId: string; userId: string }) => void;
  'conversation:updated': (payload: {
    conversationId: string;
    lastMessageAt: string;
    lastMessagePreview: string;
    senderName: string;
  }) => void;
  'chat:error': (payload: { code: string; message: string; retryAfterMs?: number }) => void;
}

export interface ClientToServerEvents {
  'conversation:join': (
    payload: { conversationId: string },
    callback?: (result: { success: boolean; conversationId?: string; error?: any }) => void
  ) => void;
  'conversation:leave': (payload: { conversationId: string }) => void;
  'message:send': (
    payload: {
      conversationId: string;
      message: string;
      clientMessageId: string;
      attachments?: any[];
    },
    callback?: (result: { success: boolean; message?: ChatMessage; duplicate?: boolean; error?: any }) => void
  ) => void;
  'typing:start': (payload: { conversationId: string }) => void;
  'typing:stop': (payload: { conversationId: string }) => void;
  'message:read': (
    payload: { conversationId: string },
    callback?: (result: { success: boolean; readAt?: string; error?: any }) => void
  ) => void;
}

export type AdminChamberSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: AdminChamberSocket | null = null;

const getSocketOrigin = () => {
  try {
    const parsed = new URL(API_BASE_URL, typeof window === 'undefined' ? 'http://localhost:8000' : window.location.origin);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return 'http://localhost:8000';
  }
};

export const getAdminSocket = (): AdminChamberSocket => {
  if (!socket) {
    const origin = getSocketOrigin();
    socket = io(`${origin}/chamber-chat`, {
      autoConnect: false,
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 700,
      reconnectionDelayMax: 5000,
    });
  }
  return socket;
};

export const connectAdminSocket = async (): Promise<AdminChamberSocket> => {
  const activeSocket = getAdminSocket();
  const token = getAdminAccessToken();

  activeSocket.auth = { token };

  if (!activeSocket.connected) {
    activeSocket.connect();
  }

  return activeSocket;
};

export const disconnectAdminSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const emitTypingStart = (conversationId: string) => {
  if (socket?.connected) {
    socket.emit('typing:start', { conversationId });
  }
};

export const emitTypingStop = (conversationId: string) => {
  if (socket?.connected) {
    socket.emit('typing:stop', { conversationId });
  }
};

export const emitMessageRead = (conversationId: string) => {
  if (socket?.connected) {
    socket.emit('message:read', { conversationId });
  }
};

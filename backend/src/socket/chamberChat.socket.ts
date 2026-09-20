import type { Server as HttpServer } from 'node:http';
import { Server, type Socket } from 'socket.io';
import mongoose from 'mongoose';
import User from '../models/user.model.js';
import ChatConversation from '../models/chatConversation.model.js';
import ChatMessage from '../models/chatMessage.model.js';
import { verifyAccessToken } from '../utils/jwt.js';
import { chatSocketRateLimiter } from './chatRateLimiter.js';
import { CORS_ORIGIN } from '../config/env.js';

type ChatSocketData = {
  userId: string;
  authVersion: number;
  role: string;
  name: string;
  salutation: string;
  rollNo: string;
};

type ChatSocket = Socket<
  Record<string, (...args: any[]) => void>,
  Record<string, (...args: any[]) => void>,
  Record<string, never>,
  ChatSocketData
>;

const room = (conversationId: string) => `chat:conversation:${conversationId}`;
const userRoom = (userId: string) => `chat:user:${userId}`;

const fail = (callback: unknown, code: string, message: string) => {
  if (typeof callback === 'function') {
    callback({ success: false, error: { code, message } });
  }
};

const cleanText = (val: unknown, maxLen = 5000): string => {
  if (typeof val !== 'string') return '';
  return val.trim().slice(0, maxLen);
};

let chatNamespace: ReturnType<Server['of']> | null = null;

const readToken = (socket: ChatSocket): string | null => {
  const authToken = socket.handshake.auth?.token;
  if (typeof authToken === 'string' && authToken.trim()) return authToken.trim();
  const authorization = socket.handshake.headers.authorization;
  return authorization?.startsWith('Bearer ') ? authorization.slice(7).trim() : null;
};

const authenticate = async (socket: ChatSocket, next: (error?: Error) => void) => {
  try {
    const token = readToken(socket);
    if (!token) return next(new Error('CHAT_UNAUTHORIZED'));

    const decoded = verifyAccessToken(token);
    if (!decoded?.id) return next(new Error('CHAT_UNAUTHORIZED'));

    const user = await User.findById(decoded.id)
      .select('_id name salutation rollNo role accountStatus +authVersion')
      .lean();

    if (
      !user ||
      user.accountStatus !== 'active' ||
      (decoded.authVersion ?? 0) !== (user.authVersion ?? 0)
    ) {
      return next(new Error('CHAT_UNAUTHORIZED'));
    }

    socket.data.userId = String(user._id);
    socket.data.authVersion = decoded.authVersion ?? 0;
    socket.data.role = user.role;
    socket.data.name = user.name;
    socket.data.salutation = user.salutation || '';
    socket.data.rollNo = user.rollNo || '';

    next();
  } catch {
    next(new Error('CHAT_UNAUTHORIZED'));
  }
};

const assertConversationAccess = async (userId: string, conversationId: string) => {
  if (!mongoose.Types.ObjectId.isValid(conversationId)) {
    throw new Error('Invalid conversation ID.');
  }

  const conv = await ChatConversation.findOne({
    _id: conversationId,
    participants: new mongoose.Types.ObjectId(userId),
    status: { $ne: 'archived' },
  });

  if (!conv) {
    throw new Error('Conversation unavailable or permission denied.');
  }

  return conv;
};

export const initializeChamberChatSocket = (httpServer: HttpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: CORS_ORIGIN,
      credentials: true,
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 20000,
    pingInterval: 25000,
  });

  const namespace = io.of('/chamber-chat');
  chatNamespace = namespace;

  namespace.use(authenticate as any);

  namespace.on('connection', (socket: ChatSocket) => {
    const userId = socket.data.userId;

    // Join dedicated user room for presence & direct notifications
    void socket.join(userRoom(userId));
    socket.emit('chat:connected', {
      userId,
      role: socket.data.role,
      name: socket.data.name,
    });

    // 1. Join Conversation Room
    socket.on('conversation:join', async (payload: { conversationId?: unknown }, callback?: Function) => {
      try {
        const conversationId = cleanText(payload?.conversationId, 80);
        await assertConversationAccess(userId, conversationId);

        await socket.join(room(conversationId));

        // Mark any messages sent by the other party as delivered
        const now = new Date();
        const pendingDelivery = await ChatMessage.find({
          conversationId,
          senderId: { $ne: new mongoose.Types.ObjectId(userId) },
          deliveryStatus: 'sent',
        }).select('_id');

        if (pendingDelivery.length > 0) {
          await ChatMessage.updateMany(
            { _id: { $in: pendingDelivery.map((m) => m._id) } },
            { $set: { deliveryStatus: 'delivered', deliveredAt: now } }
          );

          namespace.to(room(conversationId)).emit('message:delivered', {
            conversationId,
            messageIds: pendingDelivery.map((m) => String(m._id)),
            deliveredAt: now,
          });
        }

        callback?.({ success: true, conversationId });
      } catch (error: any) {
        fail(callback, 'CHAT_JOIN_FAILED', error?.message || 'Unable to join conversation.');
      }
    });

    // 2. Leave Conversation Room
    socket.on('conversation:leave', async (payload: { conversationId?: unknown }) => {
      const conversationId = cleanText(payload?.conversationId, 80);
      if (conversationId) {
        await socket.leave(room(conversationId));
      }
    });

    // 3. Send Message (with Deduplication & Rate Limiting)
    socket.on(
      'message:send',
      async (
        payload: {
          conversationId?: unknown;
          message?: unknown;
          clientMessageId?: unknown;
          attachments?: any[];
        },
        callback?: Function
      ) => {
        try {
          // A. Rate limiting check (reused from MedMe)
          const rateCheck = chatSocketRateLimiter.consumeMessage(userId);
          if (!rateCheck.allowed) {
            fail(callback, 'CHAT_RATE_LIMITED', rateCheck.message || 'Sending messages too quickly.');
            socket.emit('chat:error', {
              code: 'CHAT_RATE_LIMITED',
              message: rateCheck.message,
              retryAfterMs: rateCheck.retryAfterMs,
            });
            if (rateCheck.forceDisconnect) {
              socket.disconnect(true);
            }
            return;
          }

          const conversationId = cleanText(payload?.conversationId, 80);
          const clientMessageId = cleanText(payload?.clientMessageId, 100);
          const messageContent = cleanText(payload?.message, 5000);

          if (!clientMessageId) {
            return fail(callback, 'CLIENT_MESSAGE_ID_REQUIRED', 'clientMessageId is required for idempotency.');
          }

          if (!messageContent && (!payload?.attachments || payload.attachments.length === 0)) {
            return fail(callback, 'MESSAGE_EMPTY', 'Message content cannot be empty.');
          }

          const conversation = await assertConversationAccess(userId, conversationId);

          // B. Idempotent Deduplication Check
          const existing = await ChatMessage.findOne({
            senderId: new mongoose.Types.ObjectId(userId),
            clientMessageId,
          }).lean();

          if (existing) {
            return callback?.({ success: true, duplicate: true, message: existing });
          }

          // C. Determine recipient and active room status
          const recipientId = conversation.participants
            .map(String)
            .find((id) => id !== userId);

          const conversationRoom = room(conversationId);
          const socketsInRoom = await namespace.in(conversationRoom).fetchSockets();
          const isRecipientInActiveChat = socketsInRoom.some((s) => String(s.data.userId) === recipientId);

          const now = new Date();
          const deliveryStatus = isRecipientInActiveChat ? 'delivered' : 'sent';

          // D. Create message
          const newMsg = await ChatMessage.create({
            conversationId: conversation._id,
            senderId: new mongoose.Types.ObjectId(userId),
            senderRole: socket.data.role as any,
            senderName: socket.data.name,
            message: messageContent,
            clientMessageId,
            deliveryStatus,
            deliveredAt: isRecipientInActiveChat ? now : undefined,
            attachments: Array.isArray(payload.attachments) ? payload.attachments : [],
          });

          // E. Update conversation metadata & unread counters
          const isSenderStudent = socket.data.role === 'student';
          const updateData: Record<string, any> = {
            lastMessageAt: now,
            lastMessagePreview: messageContent.slice(0, 140),
            lastMessageSenderId: new mongoose.Types.ObjectId(userId),
          };

          if (!isRecipientInActiveChat) {
            if (isSenderStudent) {
              updateData.$inc = { unreadCountAdmin: 1 };
            } else {
              updateData.$inc = { unreadCountStudent: 1 };
            }
          }

          await ChatConversation.updateOne({ _id: conversation._id }, updateData);

          const messageDto = newMsg.toObject();

          // F. Broadcast to room
          namespace.to(conversationRoom).emit('message:new', messageDto);

          // G. Emit to recipient's personal user room (for list preview & badges)
          if (recipientId) {
            namespace.to(userRoom(recipientId)).emit('conversation:updated', {
              conversationId,
              lastMessageAt: now.toISOString(),
              lastMessagePreview: messageContent.slice(0, 140),
              senderName: socket.data.name,
            });
          }

          callback?.({ success: true, message: messageDto });
        } catch (error: any) {
          fail(callback, 'CHAT_MESSAGE_FAILED', error?.message || 'Failed to send message.');
        }
      }
    );

    // 4. Typing Indicators
    const handleTyping = async (event: 'typing:start' | 'typing:stop', payload: { conversationId?: unknown }) => {
      try {
        const conversationId = cleanText(payload?.conversationId, 80);
        if (!conversationId) return;

        if (event === 'typing:start' && !chatSocketRateLimiter.consumeTyping(userId, conversationId)) {
          return;
        }

        await assertConversationAccess(userId, conversationId);

        socket.to(room(conversationId)).emit(event, {
          conversationId,
          userId,
          userName: socket.data.name,
          userRole: socket.data.role,
        });
      } catch {
        // Typing events are best-effort
      }
    };

    socket.on('typing:start', (p) => void handleTyping('typing:start', p));
    socket.on('typing:stop', (p) => void handleTyping('typing:stop', p));

    // 5. Read Receipts (Turns ticks Double Gold / Blue)
    socket.on('message:read', async (payload: { conversationId?: unknown }, callback?: Function) => {
      try {
        const readCheck = chatSocketRateLimiter.consumeRead(userId);
        if (!readCheck.allowed) {
          return fail(callback, 'CHAT_RATE_LIMITED', 'Too many read updates.');
        }

        const conversationId = cleanText(payload?.conversationId, 80);
        const conversation = await assertConversationAccess(userId, conversationId);

        const now = new Date();

        // Update all unread messages from other participants
        await ChatMessage.updateMany(
          {
            conversationId: conversation._id,
            senderId: { $ne: new mongoose.Types.ObjectId(userId) },
            deliveryStatus: { $ne: 'read' },
          },
          {
            $set: { deliveryStatus: 'read', readAt: now },
            $push: { readBy: { userId: new mongoose.Types.ObjectId(userId), readAt: now } },
          }
        );

        // Reset unread counter for current reader
        const isStudent = socket.data.role === 'student';
        await ChatConversation.updateOne(
          { _id: conversation._id },
          { $set: isStudent ? { unreadCountStudent: 0 } : { unreadCountAdmin: 0 } }
        );

        // Broadcast to conversation room
        namespace.to(room(conversationId)).emit('message:read', {
          conversationId,
          userId,
          readAt: now,
        });

        callback?.({ success: true, readAt: now });
      } catch (error: any) {
        fail(callback, 'CHAT_READ_FAILED', error?.message || 'Could not update read state.');
      }
    });

    // 6. Disconnection
    socket.on('disconnect', async () => {
      try {
        await User.findByIdAndUpdate(userId, { lastActiveAt: new Date() });
      } catch {
        // Ignore disconnect cleanup errors
      }
    });
  });

  return io;
};

export const getChatNamespace = () => chatNamespace;

/**
 * Broadcasts notice updates to all connected client sockets across portals.
 */
export const broadcastNoticeEvent = (eventName: string, data: any) => {
  if (chatNamespace) {
    chatNamespace.emit(eventName, data);
  }
};

import type { Server as HttpServer } from 'node:http';
import { Server, type Socket } from 'socket.io';
import mongoose from 'mongoose';
import User from '../models/user.model.js';
import LiveClass from '../models/liveClass.model.js';
import LiveClassChatMessage from '../models/liveClassChatMessage.model.js';
import { LiveClassPoll, LiveClassHand } from '../models/liveClassPoll.model.js';
import { verifyAccessToken } from '../utils/jwt.js';
import LiveClassService from '../services/liveClass.service.js';

type LiveSocketData = {
  userId: string;
  role: string;
  name: string;
  rollNo: string;
  currentClassId?: string;
};

type LiveSocket = Socket<
  Record<string, (...args: any[]) => void>,
  Record<string, (...args: any[]) => void>,
  Record<string, never>,
  LiveSocketData
>;

let liveClassNamespace: ReturnType<Server['of']> | null = null;

export const classRoom = (classId: string) => `live_class:${classId}`;

export const initializeLiveClassSocket = (serverOrIo: HttpServer | Server) => {
  const io: Server =
    'of' in serverOrIo
      ? serverOrIo
      : new Server(serverOrIo, {
          cors: {
            origin: '*',
            methods: ['GET', 'POST'],
            credentials: true,
          },
          transports: ['websocket', 'polling'],
        });

  liveClassNamespace = io.of('/live-class');

  // Authenticate socket connection
  liveClassNamespace.use(async (socket: LiveSocket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        (socket.handshake.headers.authorization?.startsWith('Bearer ')
          ? socket.handshake.headers.authorization.slice(7)
          : null);

      if (!token) {
        // Allow guest view if required, or authenticate
        socket.data.userId = 'anonymous';
        socket.data.name = 'Aspirant';
        socket.data.role = 'student';
        return next();
      }

      const decoded = verifyAccessToken(token);
      if (!decoded?.id) {
        return next(new Error('AUTH_INVALID'));
      }

      const user = await User.findById(decoded.id).select('_id name rollNo role accountStatus');
      if (!user || user.accountStatus !== 'active') {
        return next(new Error('AUTH_FORBIDDEN'));
      }

      socket.data.userId = String(user._id);
      socket.data.name = user.name;
      socket.data.role = user.role;
      socket.data.rollNo = user.rollNo || '';

      next();
    } catch {
      next(new Error('AUTH_ERROR'));
    }
  });

  liveClassNamespace.on('connection', (socket: LiveSocket) => {
    // 1. Join Classroom Chamber Room
    socket.on('live_class:join_room', async ({ classId }, ack) => {
      try {
        if (!classId) return ack?.({ success: false, error: 'classId is required' });

        socket.data.currentClassId = classId;
        const roomName = classRoom(classId);
        await socket.join(roomName);

        // Record attendance join if registered student
        if (socket.data.userId && socket.data.userId !== 'anonymous') {
          await LiveClassService.recordStudentJoin(classId, socket.data.userId).catch(() => {});
        }

        // Fetch current active class stats
        const liveClass = await LiveClass.findById(classId);
        const liveCount = liveClass?.currentLiveCount || 1;

        // Broadcast updated attendee count
        liveClassNamespace?.to(roomName).emit('live_class:participant_count', {
          classId,
          count: liveCount,
        });

        // Send active poll and hands
        const activePoll = await LiveClassPoll.findOne({ classId, isActive: true, isClosed: false });
        const handQueue = await LiveClassHand.find({ classId, status: { $in: ['raised', 'speaking'] } });

        ack?.({
          success: true,
          data: {
            liveCount,
            activePoll,
            handQueue,
          },
        });
      } catch (err: any) {
        ack?.({ success: false, error: err.message });
      }
    });

    // 2. Real-Time Chat Message with Faculty Highlighting
    socket.on('live_class:send_chat', async ({ classId, messageText, isDoubt = false }, ack) => {
      try {
        if (!classId || !messageText?.trim()) {
          return ack?.({ success: false, error: 'Message cannot be empty.' });
        }

        const isFaculty = socket.data.role === 'faculty' || socket.data.role === 'admin';
        const now = new Date();
        const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const newMsg = await LiveClassChatMessage.create({
          classId,
          senderId: socket.data.userId !== 'anonymous' ? socket.data.userId : new mongoose.Types.ObjectId(),
          senderName: socket.data.name,
          senderRole: socket.data.role,
          text: messageText.trim(),
          time: timeFormatted,
          isFacultyMessage: isFaculty,
          isPinned: false,
          isDoubt: Boolean(isDoubt),
        });

        const broadcastPayload = {
          id: String(newMsg._id),
          sender: socket.data.name,
          role: socket.data.role,
          text: newMsg.text,
          time: newMsg.time,
          isFacultyMessage: newMsg.isFacultyMessage,
          isPinned: newMsg.isPinned,
          isDoubt: newMsg.isDoubt,
        };

        liveClassNamespace?.to(classRoom(classId)).emit('live_class:new_chat', broadcastPayload);

        ack?.({ success: true, data: broadcastPayload });
      } catch (err: any) {
        ack?.({ success: false, error: err.message });
      }
    });

    // 3. Heartbeat Ping from Student Video/Chat Screen
    socket.on('live_class:heartbeat', async ({ classId }) => {
      if (socket.data.userId && socket.data.userId !== 'anonymous' && classId) {
        await LiveClassService.recordStudentHeartbeat(classId, socket.data.userId).catch(() => {});
      }
    });

    // 4. Raise Hand
    socket.on('live_class:raise_hand', async ({ classId }, ack) => {
      try {
        if (!classId || socket.data.userId === 'anonymous') return;

        let hand = await LiveClassHand.findOne({ classId, studentId: socket.data.userId });
        if (!hand) {
          hand = await LiveClassHand.create({
            classId,
            studentId: socket.data.userId,
            studentName: socket.data.name,
            studentRollNo: socket.data.rollNo,
            status: 'raised',
          });
        } else {
          hand.status = 'raised';
          hand.raisedAt = new Date();
          await hand.save();
        }

        const handQueue = await LiveClassHand.find({ classId, status: { $in: ['raised', 'speaking'] } });
        liveClassNamespace?.to(classRoom(classId)).emit('live_class:hand_queue_updated', handQueue);

        ack?.({ success: true });
      } catch (err: any) {
        ack?.({ success: false, error: err.message });
      }
    });

    // 5. Lower Hand
    socket.on('live_class:lower_hand', async ({ classId }, ack) => {
      try {
        if (!classId || socket.data.userId === 'anonymous') return;

        await LiveClassHand.findOneAndUpdate(
          { classId, studentId: socket.data.userId },
          { status: 'lowered' }
        );

        const handQueue = await LiveClassHand.find({ classId, status: { $in: ['raised', 'speaking'] } });
        liveClassNamespace?.to(classRoom(classId)).emit('live_class:hand_queue_updated', handQueue);

        ack?.({ success: true });
      } catch (err: any) {
        ack?.({ success: false, error: err.message });
      }
    });

    // 6. Leave Room / Disconnect
    socket.on('disconnect', async () => {
      const classId = socket.data.currentClassId;
      if (classId && socket.data.userId && socket.data.userId !== 'anonymous') {
        await LiveClassService.recordStudentLeave(classId, socket.data.userId).catch(() => {});

        const liveClass = await LiveClass.findById(classId);
        liveClassNamespace?.to(classRoom(classId)).emit('live_class:participant_count', {
          classId,
          count: liveClass?.currentLiveCount || 0,
        });
      }
    });
  });

  return liveClassNamespace;
};

export const getLiveClassNamespace = () => liveClassNamespace;

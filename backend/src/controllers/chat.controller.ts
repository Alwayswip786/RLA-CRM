import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import ChatConversation from '../models/chatConversation.model.js';
import ChatMessage from '../models/chatMessage.model.js';
import User from '../models/user.model.js';
import ApiError from '../utils/ApiError.js';
import catchAsync from '../utils/catchAsync.js';

/**
 * 1. Get all active conversations for the authenticated user
 */
export const getMyConversations = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  if (!user) throw new ApiError(401, 'Unauthorized');

  const userId = new mongoose.Types.ObjectId(String(user._id));

  // Find conversations where user is a participant
  const conversations = await ChatConversation.find({
    participants: userId,
    status: { $ne: 'archived' },
  })
    .sort({ lastMessageAt: -1 })
    .populate('participants', 'name rollNo salutation role avatarUrl lastActiveAt')
    .lean();

  res.status(200).json({
    success: true,
    count: conversations.length,
    conversations,
  });
});

/**
 * 2. Get or initialize 1-to-1 conversation between a student and Admin / Faculty
 */
export const initConversation = catchAsync(async (req: Request, res: Response) => {
  const currentUser = req.user;
  if (!currentUser) throw new ApiError(401, 'Unauthorized');

  let studentId: string;
  let adminId: string;

  if (currentUser.role === 'student') {
    studentId = String(currentUser._id);
    // Find director or senior faculty to represent the chamber
    const defaultStaff =
      (await User.findOne({ email: 'director@rajinderlawacademy.com' }).select('_id name').lean()) ||
      (await User.findOne({ role: 'admin' }).select('_id name').lean());

    if (!defaultStaff) {
      throw new ApiError(500, 'Academic faculty chamber is currently unavailable.');
    }
    adminId = String(defaultStaff._id);
  } else {
    // Admin / Faculty is initiating conversation with a student
    studentId = String(req.body.studentId || '');
    if (!studentId) {
      throw new ApiError(400, 'Student ID is required to initiate conversation.');
    }
    adminId = String(currentUser._id);
  }

  const student = await User.findById(studentId).select('_id name rollNo').lean();
  if (!student) {
    throw new ApiError(404, 'Student account not found.');
  }

  // Find or create conversation
  let conversation = await ChatConversation.findOne({
    studentId: new mongoose.Types.ObjectId(studentId),
    adminId: new mongoose.Types.ObjectId(adminId),
  });

  if (!conversation) {
    conversation = await ChatConversation.create({
      participants: [new mongoose.Types.ObjectId(studentId), new mongoose.Types.ObjectId(adminId)],
      studentId: new mongoose.Types.ObjectId(studentId),
      adminId: new mongoose.Types.ObjectId(adminId),
      studentRollNo: student.rollNo,
      studentName: student.name,
      channel: 'mentorship',
      status: 'active',
      lastMessageAt: new Date(),
      lastMessagePreview: 'Chamber mentorship conversation started.',
      lastMessageSenderId: new mongoose.Types.ObjectId(adminId),
    });
  }

  res.status(200).json({
    success: true,
    conversation,
  });
});

/**
 * 3. Get paginated messages for a conversation
 */
export const getConversationMessages = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  if (!user) throw new ApiError(401, 'Unauthorized');

  const conversationId = String(req.params.id || '');
  const { limit = '50', beforeMessageId } = req.query;

  if (!conversationId || !mongoose.Types.ObjectId.isValid(conversationId)) {
    throw new ApiError(400, 'Invalid conversation ID format.');
  }

  const conv = await ChatConversation.findOne({
    _id: conversationId,
    participants: new mongoose.Types.ObjectId(String(user._id)),
  }).lean();

  if (!conv) {
    throw new ApiError(403, 'Conversation not accessible.');
  }

  const query: Record<string, any> = {
    conversationId: new mongoose.Types.ObjectId(conversationId),
    isDeleted: false,
  };

  const cursorId = beforeMessageId ? String(beforeMessageId) : '';
  if (cursorId && mongoose.Types.ObjectId.isValid(cursorId)) {
    const cursorMsg = await ChatMessage.findById(cursorId).select('createdAt').lean();
    if (cursorMsg) {
      query.createdAt = { $lt: cursorMsg.createdAt };
    }
  }

  const parsedLimit = Math.min(Math.max(parseInt(String(limit), 10) || 50, 1), 100);

  const messages = await ChatMessage.find(query)
    .sort({ createdAt: -1 })
    .limit(parsedLimit)
    .lean();

  // Return chronological (oldest to newest)
  messages.reverse();

  res.status(200).json({
    success: true,
    count: messages.length,
    hasMore: messages.length === parsedLimit,
    messages,
  });
});

/**
 * 4. Mark all messages in a conversation as read (HTTP fallback)
 */
export const markConversationRead = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  if (!user) throw new ApiError(401, 'Unauthorized');

  const { id: conversationId } = req.params;
  const userId = new mongoose.Types.ObjectId(String(user._id));

  const conv = await ChatConversation.findOne({
    _id: conversationId,
    participants: userId,
  });

  if (!conv) {
    throw new ApiError(404, 'Conversation not found.');
  }

  const now = new Date();

  await ChatMessage.updateMany(
    {
      conversationId: conv._id,
      senderId: { $ne: userId },
      deliveryStatus: { $ne: 'read' },
    },
    {
      $set: { deliveryStatus: 'read', readAt: now },
      $push: { readBy: { userId, readAt: now } },
    }
  );

  const isStudent = user.role === 'student';
  if (isStudent) {
    conv.unreadCountStudent = 0;
  } else {
    conv.unreadCountAdmin = 0;
  }
  await conv.save();

  res.status(200).json({
    success: true,
    message: 'Conversation marked as read.',
  });
});

/**
 * 5. Get aggregate unread count badge for Navbar/Sidebar
 */
export const getUnreadCounts = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  if (!user) throw new ApiError(401, 'Unauthorized');

  const userId = new mongoose.Types.ObjectId(String(user._id));
  const isStudent = user.role === 'student';

  const conversations = await ChatConversation.find({
    participants: userId,
    status: 'active',
  }).select('unreadCountStudent unreadCountAdmin').lean();

  const totalUnread = conversations.reduce((acc, c) => {
    return acc + (isStudent ? c.unreadCountStudent || 0 : c.unreadCountAdmin || 0);
  }, 0);

  res.status(200).json({
    success: true,
    unreadCount: totalUnread,
  });
});

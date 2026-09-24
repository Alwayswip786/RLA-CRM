import { type Request, type Response } from 'express';
import mongoose from 'mongoose';
import catchAsync from '../utils/catchAsync.js';
import ApiError from '../utils/ApiError.js';
import LiveClass from '../models/liveClass.model.js';
import LiveClassAttendance from '../models/liveClassAttendance.model.js';
import LiveClassChatMessage from '../models/liveClassChatMessage.model.js';
import {
  ArchivedClass,
  ArchivedClassReaction,
  ArchivedClassComment,
  ArchivedClassWatchProgress,
} from '../models/archivedClass.model.js';
import { ClassAlertSubscription } from '../models/timetable.model.js';
import zoomVideoProvider from '../services/video/ZoomVideoSdkProvider.js';
import LiveClassService from '../services/liveClass.service.js';
import { getLiveClassNamespace, classRoom } from '../socket/liveClass.socket.js';

/**
 * GET /api/live-classes/current
 * Returns the currently active Live lecture, or next upcoming lecture
 */
export const getCurrentLiveClass = catchAsync(async (req: Request, res: Response) => {
  // Look for currently live session first
  let liveClass = await LiveClass.findOne({ status: 'live' })
    .populate('faculty', 'name salutation avatarUrl')
    .sort({ actualStartedAt: -1, scheduledStartAt: 1 });

  // If no live session, fetch next upcoming session
  if (!liveClass) {
    liveClass = await LiveClass.findOne({ status: { $in: ['upcoming', 'scheduled'] } })
      .populate('faculty', 'name salutation avatarUrl')
      .sort({ scheduledStartAt: 1 });
  }

  if (!liveClass) {
    return res.status(200).json({
      status: 'success',
      data: null,
      message: 'No active or upcoming live classes scheduled at this time.',
    });
  }

  // Fetch recent messages for this class
  const messages = await LiveClassChatMessage.find({
    classId: liveClass._id,
    isDeleted: false,
  })
    .sort({ createdAt: 1 })
    .limit(50);

  const formattedMessages = messages.map((m) => ({
    id: String(m._id),
    sender: m.senderName,
    role: m.senderRole,
    text: m.text,
    time: m.time,
    isFacultyMessage: m.isFacultyMessage,
    isPinned: m.isPinned,
    isDoubt: m.isDoubt,
  }));

  res.status(200).json({
    status: 'success',
    data: {
      class: liveClass,
      initialMessages: formattedMessages,
      isLiveNow: liveClass.status === 'live',
    },
  });
});

/**
 * GET /api/live-classes/upcoming
 * List of scheduled / upcoming lectures
 */
export const getUpcomingClasses = catchAsync(async (req: Request, res: Response) => {
  const upcoming = await LiveClass.find({
    status: { $in: ['upcoming', 'scheduled'] },
  })
    .sort({ scheduledStartAt: 1 })
    .limit(20);

  res.status(200).json({
    status: 'success',
    data: upcoming,
  });
});

/**
 * GET /api/live-classes/archives
 * List of recorded lectures
 */
export const getArchivedClasses = catchAsync(async (req: Request, res: Response) => {
  const { search, subject } = req.query;

  const query: any = { isPublished: true };
  if (subject && typeof subject === 'string') {
    query.subject = { $regex: subject, $options: 'i' };
  }
  if (search && typeof search === 'string') {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { subject: { $regex: search, $options: 'i' } },
      { faculty: { $regex: search, $options: 'i' } },
    ];
  }

  const archives = await ArchivedClass.find(query).sort({ createdAt: -1 });

  res.status(200).json({
    status: 'success',
    data: archives,
  });
});

/**
 * GET /api/live-classes/archives/:archiveId
 * Detailed view of recorded lecture with user watch progress & reaction
 */
export const getArchivedClassDetails = catchAsync(async (req: Request, res: Response) => {
  const { archiveId } = req.params;
  const userId = req.user?._id;

  const archive = await ArchivedClass.findById(archiveId);
  if (!archive) {
    throw new ApiError(404, 'Archived lecture recording not found.');
  }

  // Increment views
  archive.viewsCount += 1;
  await archive.save();

  let watchProgress = null;
  let userReaction = null;

  if (userId) {
    watchProgress = await ArchivedClassWatchProgress.findOne({ userId, archiveId });
    const rx = await ArchivedClassReaction.findOne({ userId, archiveId });
    userReaction = rx?.reaction || null;
  }

  res.status(200).json({
    status: 'success',
    data: {
      archive,
      watchProgress,
      userReaction,
    },
  });
});

/**
 * POST /api/live-classes/:id/join
 * Mints a student Zoom Video SDK token and records entry
 */
export const joinLiveClass = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = req.user!;

  const liveClass = await LiveClass.findById(id);
  if (!liveClass) {
    throw new ApiError(404, 'Class not found.');
  }

  const roleType = user.role === 'faculty' || user.role === 'admin' ? 1 : 0;

  // Generate real Zoom Video SDK JWT token securely server-side
  const tokenResult = await zoomVideoProvider.generateToken({
    sessionTopic: liveClass.sessionTopic,
    userId: String(user._id),
    userName: user.name,
    roleType,
    durationMinutes: liveClass.durationMinutes || 120,
    cloudRecordingOption: liveClass.autoRecord ? 1 : 0,
  });

  // Record student join in attendance table
  if (roleType === 0) {
    await LiveClassService.recordStudentJoin(liveClass._id, user._id);
  }

  res.status(200).json({
    status: 'success',
    data: {
      token: tokenResult.token,
      sessionTopic: liveClass.sessionTopic,
      sessionPassword: liveClass.sessionPassword || '',
      roleType,
      expiresAt: tokenResult.expiresAt,
      userName: user.name,
    },
  });
});

/**
 * POST /api/live-classes/:id/leave
 * Records student exit
 */
export const leaveLiveClass = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!._id;

  if (id) {
    await LiveClassService.recordStudentLeave(String(id), userId);
  }

  res.status(200).json({
    status: 'success',
    message: 'Class exit logged successfully.',
  });
});

/**
 * POST /api/live-classes/:id/heartbeat
 * Periodic keep-alive ping for accurate attendance percentage computation
 */
export const heartbeatLiveClass = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!._id;

  const attendance = id ? await LiveClassService.recordStudentHeartbeat(String(id), userId) : null;

  res.status(200).json({
    status: 'success',
    data: {
      totalDurationSeconds: attendance?.totalDurationSeconds || 0,
      attendancePercent: attendance?.attendancePercent || 0,
      status: attendance?.status || 'partial',
    },
  });
});

/**
 * POST /api/live-classes/:id/alert-toggle
 * Toggles a student's reminder notification for upcoming class
 */
export const toggleAlertReminder = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!._id;

  const liveClass = await LiveClass.findById(id);
  if (!liveClass) throw new ApiError(404, 'Class not found.');

  // Check existing alert
  const existing = await ClassAlertSubscription.findOne({
    student: userId,
    dateIST: liveClass.scheduledDate,
  });

  if (existing) {
    await ClassAlertSubscription.findByIdAndDelete(existing._id);
    return res.status(200).json({
      status: 'success',
      data: { isSubscribed: false },
      message: 'Class reminder alert cancelled.',
    });
  }

  await ClassAlertSubscription.create({
    student: userId,
    batch: liveClass.batchIds[0] || new mongoose.Types.ObjectId(),
    slot: new mongoose.Types.ObjectId(),
    dateIST: liveClass.scheduledDate,
    reminderMinutesBefore: 15,
    isActive: true,
  });

  res.status(200).json({
    status: 'success',
    data: { isSubscribed: true },
    message: 'Class reminder set for 15 mins prior to start.',
  });
});

/**
 * POST /api/live-classes/archives/:archiveId/react
 * Atomic Like / Dislike reaction
 */
export const reactToArchivedClass = catchAsync(async (req: Request, res: Response) => {
  const { archiveId } = req.params;
  const { reaction } = req.body; // 'like' | 'dislike'
  const userId = req.user!._id;

  if (!['like', 'dislike'].includes(reaction)) {
    throw new ApiError(400, "Reaction must be 'like' or 'dislike'.");
  }

  const existing = await ArchivedClassReaction.findOne({ userId, archiveId });
  const archive = await ArchivedClass.findById(archiveId);
  if (!archive) throw new ApiError(404, 'Archived lecture not found.');

  if (existing) {
    if (existing.reaction === reaction) {
      // Toggle off
      await ArchivedClassReaction.findByIdAndDelete(existing._id);
      if (reaction === 'like') archive.likesCount = Math.max(0, archive.likesCount - 1);
      if (reaction === 'dislike') archive.dislikesCount = Math.max(0, archive.dislikesCount - 1);
      await archive.save();

      return res.status(200).json({
        status: 'success',
        data: { userReaction: null, likesCount: archive.likesCount, dislikesCount: archive.dislikesCount },
      });
    } else {
      // Switch reaction
      if (reaction === 'like') {
        archive.likesCount += 1;
        archive.dislikesCount = Math.max(0, archive.dislikesCount - 1);
      } else {
        archive.dislikesCount += 1;
        archive.likesCount = Math.max(0, archive.likesCount - 1);
      }
      existing.reaction = reaction;
      await existing.save();
      await archive.save();

      return res.status(200).json({
        status: 'success',
        data: { userReaction: reaction, likesCount: archive.likesCount, dislikesCount: archive.dislikesCount },
      });
    }
  }

  // Create reaction
  await ArchivedClassReaction.create({ userId, archiveId, reaction });
  if (reaction === 'like') archive.likesCount += 1;
  if (reaction === 'dislike') archive.dislikesCount += 1;
  await archive.save();

  res.status(200).json({
    status: 'success',
    data: { userReaction: reaction, likesCount: archive.likesCount, dislikesCount: archive.dislikesCount },
  });
});

/**
 * GET /api/live-classes/archives/:archiveId/comments
 */
export const getArchivedClassComments = catchAsync(async (req: Request, res: Response) => {
  const { archiveId } = req.params;

  const comments = await ArchivedClassComment.find({ archiveId }).sort({ createdAt: -1 });

  res.status(200).json({
    status: 'success',
    data: comments,
  });
});

/**
 * POST /api/live-classes/archives/:archiveId/comments
 */
export const addArchivedClassComment = catchAsync(async (req: Request, res: Response) => {
  const { archiveId } = req.params;
  const { text, parentCommentId } = req.body;
  const user = req.user!;

  if (!text?.trim()) throw new ApiError(400, 'Comment text is required.');

  const comment = await ArchivedClassComment.create({
    archiveId,
    userId: user._id,
    userName: user.name,
    userRole: user.role,
    text: text.trim(),
    parentCommentId: parentCommentId || undefined,
  });

  await ArchivedClass.findByIdAndUpdate(archiveId, { $inc: { commentsCount: 1 } });

  res.status(201).json({
    status: 'success',
    data: comment,
  });
});

/**
 * POST /api/live-classes/archives/:archiveId/progress
 */
export const updateArchivedClassProgress = catchAsync(async (req: Request, res: Response) => {
  const { archiveId } = req.params;
  const { lastPositionSeconds, maxPositionSeconds, progressPercent } = req.body;
  const userId = req.user!._id;

  const isCompleted = Number(progressPercent) >= 85;

  const progress = await ArchivedClassWatchProgress.findOneAndUpdate(
    { userId, archiveId },
    {
      $set: {
        lastPositionSeconds: Number(lastPositionSeconds) || 0,
        maxPositionSeconds: Number(maxPositionSeconds) || 0,
        progressPercent: Number(progressPercent) || 0,
        isCompleted,
        lastWatchedAt: new Date(),
      },
    },
    { upsert: true, new: true }
  );

  res.status(200).json({
    status: 'success',
    data: progress,
  });
});

// ============================================================================
// ADMIN / FACULTY CONTROLLER METHODS
// ============================================================================

/**
 * GET /api/live-classes/admin/all
 */
export const adminGetAllClasses = catchAsync(async (req: Request, res: Response) => {
  const classes = await LiveClass.find()
    .populate('faculty', 'name salutation')
    .sort({ scheduledStartAt: -1 });

  res.status(200).json({
    status: 'success',
    data: classes,
  });
});

/**
 * POST /api/live-classes/admin/schedule
 */
export const adminScheduleClass = catchAsync(async (req: Request, res: Response) => {
  const {
    title,
    subject,
    topic,
    description,
    courseId,
    batchIds = [],
    shifts = ['shift-morning', 'shift-evening'],
    facultyId,
    scheduledDate,
    startTime,
    endTime,
    durationMinutes = 120,
    learningFocus = [],
    handoutPdf,
    autoRecord = true,
  } = req.body;

  if (!title || !subject || !scheduledDate || !startTime || !endTime) {
    throw new ApiError(400, 'Title, subject, scheduled date, start time, and end time are required.');
  }

  const facultyUser = facultyId
    ? await mongoose.model('User').findById(facultyId)
    : req.user!;

  const sessionTopic = `rla-class-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

  // Construct absolute UTC timestamps
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  const scheduledStartAt = new Date(`${scheduledDate}T${startTime}:00.000Z`);
  const scheduledEndAt = new Date(`${scheduledDate}T${endTime}:00.000Z`);

  const newClass = await LiveClass.create({
    title: title.trim(),
    subject: subject.trim(),
    topic: topic ? topic.trim() : subject.trim(),
    description: description || '',
    courseId: courseId || undefined,
    batchIds,
    shifts,
    faculty: facultyUser._id,
    facultyName: facultyUser.name || 'Adv. Rajinder Sir',
    facultyTitle: 'Founding Director & Judicial Mentor',
    scheduledDate,
    startTime,
    endTime,
    scheduledStartAt,
    scheduledEndAt,
    durationMinutes: Number(durationMinutes) || 120,
    status: 'scheduled',
    sessionTopic,
    autoRecord: Boolean(autoRecord),
    learningFocus,
    handoutPdf,
  });

  const ns = getLiveClassNamespace();
  ns?.emit('live_class:global_status_changed', {
    classId: String(newClass._id),
    status: 'scheduled',
    title: newClass.title,
    subject: newClass.subject,
    startTime: newClass.startTime,
  });

  res.status(201).json({
    status: 'success',
    data: newClass,
    message: 'Class scheduled successfully.',
  });
});

/**
 * POST /api/live-classes/admin/:id/start
 * Launches live broadcast and notifies students
 */
export const adminStartClass = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = req.user!;

  const liveClass = await LiveClass.findById(id);
  if (!liveClass) throw new ApiError(404, 'Class not found.');

  liveClass.status = 'live';
  liveClass.actualStartedAt = new Date();
  await liveClass.save();

  // Generate host Zoom Video SDK token
  const hostToken = await zoomVideoProvider.generateToken({
    sessionTopic: liveClass.sessionTopic,
    userId: String(user._id),
    userName: user.name,
    roleType: 1, // Host
    durationMinutes: liveClass.durationMinutes,
  });

  // Broadcast to all connected clients
  const ns = getLiveClassNamespace();
  ns?.to(classRoom(String(liveClass._id))).emit('live_class:status_changed', {
    classId: String(liveClass._id),
    status: 'live',
  });
  ns?.emit('live_class:global_status_changed', {
    classId: String(liveClass._id),
    status: 'live',
    title: liveClass.title,
    subject: liveClass.subject,
    startTime: liveClass.startTime,
  });

  res.status(200).json({
    status: 'success',
    data: {
      class: liveClass,
      hostToken: hostToken.token,
      sessionTopic: liveClass.sessionTopic,
    },
    message: 'Live stream launched successfully.',
  });
});

/**
 * POST /api/live-classes/admin/:id/end
 * Stops live stream and begins recording processing
 */
export const adminEndClass = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const liveClass = await LiveClass.findById(id);
  if (!liveClass) throw new ApiError(404, 'Class not found.');

  liveClass.status = 'ended';
  liveClass.actualEndedAt = new Date();
  await liveClass.save();

  // Broadcast to room and global
  const ns = getLiveClassNamespace();
  ns?.to(classRoom(String(liveClass._id))).emit('live_class:status_changed', {
    classId: String(liveClass._id),
    status: 'ended',
  });
  ns?.emit('live_class:global_status_changed', {
    classId: String(liveClass._id),
    status: 'ended',
  });

  res.status(200).json({
    status: 'success',
    data: liveClass,
    message: 'Class ended. Cloud recording processing initiated.',
  });
});

/**
 * GET /api/live-classes/admin/:id/attendance
 */
export const adminGetAttendance = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const roster = await LiveClassAttendance.find({ classId: id })
    .populate('studentId', 'name rollNo email phone')
    .sort({ attendancePercent: -1 });

  res.status(200).json({
    status: 'success',
    data: roster,
  });
});

/**
 * POST /api/live-classes/webhooks/zoom
 * Handles Zoom Video SDK Webhook events and CRC verification
 */
export const handleZoomWebhook = catchAsync(async (req: Request, res: Response) => {
  // 1. Zoom CRC URL Validation
  if (req.body?.event === 'endpoint.url_validation') {
    const plainToken = req.body?.payload?.plainToken;
    const challengeRes = zoomVideoProvider.handleCrcChallenge(plainToken);
    return res.status(200).json(challengeRes);
  }

  // 2. Signature verification
  const verification = zoomVideoProvider.verifyWebhook(req.headers, req.body);
  if (!verification.isValid) {
    throw new ApiError(401, verification.error || 'Unauthorized Zoom Webhook');
  }

  const { event, payload } = verification;

  // 3. Event Processing
  switch (event) {
    case 'session.started': {
      const topic = payload?.session_name || payload?.topic;
      if (topic) {
        await LiveClass.findOneAndUpdate(
          { sessionTopic: topic },
          { $set: { status: 'live', actualStartedAt: new Date() } }
        );
      }
      break;
    }

    case 'session.ended': {
      const topic = payload?.session_name || payload?.topic;
      if (topic) {
        await LiveClass.findOneAndUpdate(
          { sessionTopic: topic },
          { $set: { status: 'ended', actualEndedAt: new Date() } }
        );
      }
      break;
    }

    case 'recording.completed': {
      await LiveClassService.processCompletedRecording(payload);
      break;
    }

    default:
      break;
  }

  res.status(200).json({ status: 'success', received: true });
});

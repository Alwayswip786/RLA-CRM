import type { Request, Response } from 'express';
import Notice from '../models/notice.model.js';
import ApiError from '../utils/ApiError.js';
import catchAsync from '../utils/catchAsync.js';
import { broadcastNoticeEvent } from '../socket/chamberChat.socket.js';

/**
 * 1. Get all published notices (filterable by category, priority, cohort, search)
 */
export const getNotices = catchAsync(async (req: Request, res: Response) => {
  const { category, priority, cohort, search } = req.query;

  const filter: Record<string, any> = { isPublished: true };

  if (category && category !== 'all') {
    filter.category = new RegExp(`^${String(category)}$`, 'i');
  }

  if (priority && (priority === 'urgent' || priority === 'normal')) {
    filter.priority = priority;
  }

  if (cohort && cohort !== 'all') {
    filter.targetCohorts = new RegExp(String(cohort), 'i');
  }

  if (search) {
    const searchRegex = new RegExp(String(search), 'i');
    filter.$or = [{ title: searchRegex }, { content: searchRegex }, { circularNo: searchRegex }];
  }

  // Sort: urgent circulars first, then newest published
  const notices = await Notice.find(filter)
    .sort({ priority: -1, publishedAt: -1 })
    .lean();

  res.status(200).json({
    success: true,
    count: notices.length,
    notices,
  });
});

/**
 * 2. Get single notice by ID or Circular Number
 */
export const getNoticeById = catchAsync(async (req: Request, res: Response) => {
  const id = String(req.params.id || '');
  if (!id) {
    throw new ApiError(400, 'Invalid circular identifier.');
  }

  const isMongoId = /^[0-9a-fA-F]{24}$/.test(id);
  const notice = await Notice.findOne({
    $or: [{ _id: isMongoId ? id : null }, { circularNo: id.toUpperCase() }],
  }).lean();

  if (!notice) {
    throw new ApiError(404, 'Official circular not found.');
  }

  res.status(200).json({
    success: true,
    notice,
  });
});

/**
 * 3. Create a new official notice (Admin & Faculty only)
 */
export const createNotice = catchAsync(async (req: Request, res: Response) => {
  const {
    title,
    content,
    category,
    priority,
    targetCohorts,
    targetExam,
    issuedBy,
    circularNo,
  } = req.body;

  if (!title || typeof title !== 'string' || !title.trim()) {
    throw new ApiError(400, 'Notice title is required.');
  }

  if (!content || typeof content !== 'string' || !content.trim()) {
    throw new ApiError(400, 'Notice body content is required.');
  }

  const currentYear = new Date().getFullYear();

  // Auto-generate official circular number if not custom provided
  let finalCircularNo = circularNo?.trim();
  if (!finalCircularNo) {
    const totalCount = await Notice.countDocuments();
    const nextSeq = String(totalCount + 1).padStart(3, '0');
    finalCircularNo = `RLA/CIR/${currentYear}/${nextSeq}`;
  }

  // Check if circularNo already exists
  const existing = await Notice.findOne({ circularNo: finalCircularNo.toUpperCase() });
  if (existing) {
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    finalCircularNo = `RLA/CIR/${currentYear}/${randomSuffix}`;
  }

  const user = req.user;
  const authorName = user?.name || (user?.role === 'admin' ? 'Adv. Rajinder Sir' : 'Faculty Office');

  const newNotice = await Notice.create({
    circularNo: finalCircularNo.toUpperCase(),
    title: title.trim(),
    content: content.trim(),
    category: category || 'General',
    priority: priority === 'urgent' ? 'urgent' : 'normal',
    targetCohorts: targetCohorts?.trim() || 'All Enrolled Batches',
    targetExam: targetExam?.trim() || 'All Judicial Aspirants',
    issuedBy: issuedBy?.trim() || 'Director Office, Rajinder Law Academy',
    author: user?._id,
    authorName,
    publishedAt: new Date(),
    isPublished: true,
  });

  broadcastNoticeEvent('notice:new', newNotice);

  res.status(201).json({
    success: true,
    message: 'Circular successfully published to student classroom portals.',
    notice: newNotice,
  });
});

/**
 * 4. Update an existing notice (Admin & Faculty only)
 */
export const updateNotice = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, content, category, priority, targetCohorts, targetExam, issuedBy, isPublished } = req.body;

  const notice = await Notice.findById(id);
  if (!notice) {
    throw new ApiError(404, 'Notice circular not found.');
  }

  if (title) notice.title = title.trim();
  if (content) notice.content = content.trim();
  if (category) notice.category = category;
  if (priority && (priority === 'urgent' || priority === 'normal')) notice.priority = priority;
  if (targetCohorts) notice.targetCohorts = targetCohorts.trim();
  if (targetExam) notice.targetExam = targetExam.trim();
  if (issuedBy) notice.issuedBy = issuedBy.trim();
  if (isPublished !== undefined) notice.isPublished = Boolean(isPublished);

  await notice.save();
  broadcastNoticeEvent('notice:updated', notice);

  res.status(200).json({
    success: true,
    message: 'Notice circular updated successfully.',
    notice,
  });
});

/**
 * 5. Delete a notice circular (Admin & Faculty only)
 */
export const deleteNotice = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const notice = await Notice.findByIdAndDelete(id);
  if (!notice) {
    throw new ApiError(404, 'Notice circular not found.');
  }

  broadcastNoticeEvent('notice:deleted', { id, circularNo: notice.circularNo });

  res.status(200).json({
    success: true,
    message: `Circular ${notice.circularNo} has been withdrawn from all student portals.`,
  });
});

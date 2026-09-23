import { type Request, type Response } from 'express';
import mongoose from 'mongoose';
import Bookmark, { type BookmarkItemType } from '../models/bookmark.model.js';
import catchAsync from '../utils/catchAsync.js';
import ApiError from '../utils/ApiError.js';

/**
 * @desc    Get user's personal bookmarks vault with KPI counts, subjects, and search/filters
 * @route   GET /api/bookmarks
 * @access  Private (Authenticated Student)
 */
export const getBookmarks = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, 'Authentication required to view vault bookmarks.');
  }

  const userId = req.user._id;
  const { itemType, subject, search, sort = 'newest' } = req.query;

  const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 50));
  const skip = (page - 1) * limit;

  // Base filter for current user
  const query: Record<string, any> = { user: userId };

  // Filter by item type
  if (itemType && itemType !== 'all') {
    query.itemType = itemType;
  }

  // Filter by subject
  if (subject && subject !== 'all') {
    query.subject = subject;
  }

  // Live keyword search across title, source, annotation, and subject
  if (search && typeof search === 'string' && search.trim() !== '') {
    const s = search.trim();
    const regex = new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    query.$or = [
      { title: regex },
      { source: regex },
      { annotation: regex },
      { subject: regex },
      { tags: regex },
    ];
  }

  // Sorting
  let sortOption: Record<string, 1 | -1> = { createdAt: -1 };
  if (sort === 'oldest') {
    sortOption = { createdAt: 1 };
  } else if (sort === 'title') {
    sortOption = { title: 1 };
  }

  // Concurrent execution: Bookmarks list, total count, KPI counts, distinct subjects
  const [bookmarks, total, kpiAggregation, subjects] = await Promise.all([
    Bookmark.find(query).sort(sortOption).skip(skip).limit(limit).lean(),
    Bookmark.countDocuments(query),
    Bookmark.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId.toString()) } },
      {
        $group: {
          _id: '$itemType',
          count: { $sum: 1 },
        },
      },
    ]),
    Bookmark.distinct('subject', { user: userId }),
  ]);

  // Map KPI counts
  let totalCount = 0;
  let mcqCount = 0;
  let judgmentCount = 0;
  let bareActCount = 0;
  let digestCount = 0;

  for (const item of kpiAggregation) {
    totalCount += item.count;
    if (item._id === 'MCQ') mcqCount = item.count;
    else if (item._id === 'Judgment') judgmentCount = item.count;
    else if (item._id === 'Bare Act Note') bareActCount = item.count;
    else if (item._id === 'Daily Digest') digestCount = item.count;
  }

  res.status(200).json({
    success: true,
    bookmarks,
    counts: {
      totalCount,
      mcqCount,
      judgmentCount,
      bareActCount,
      digestCount,
    },
    subjects: subjects.sort(),
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit) || 1,
    },
  });
});

/**
 * @desc    Get all bookmarked item IDs for instant gold star highlights
 * @route   GET /api/bookmarks/ids
 * @access  Private
 */
export const getBookmarkIds = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, 'Authentication required.');
  }

  const docs = await Bookmark.find({ user: req.user._id })
    .select('itemId itemType -_id')
    .lean();

  const itemIds = docs.map((d) => d.itemId);
  const byType: Record<string, string[]> = {
    MCQ: [],
    Judgment: [],
    'Bare Act Note': [],
    'Daily Digest': [],
  };

  docs.forEach((d) => {
    const list = byType[d.itemType];
    if (list) {
      list.push(d.itemId);
    }
  });

  res.status(200).json({
    success: true,
    itemIds,
    byType,
  });
});

/**
 * @desc    1-Click Star / Unstar toggle for any legal resource or MCQ
 * @route   POST /api/bookmarks/toggle
 * @access  Private
 */
export const toggleBookmark = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, 'Authentication required to star items.');
  }

  const {
    itemType,
    itemId,
    title,
    source,
    subject = 'General Legal Studies',
    annotation = '',
    tags = [],
    metadata = {},
  } = req.body;

  if (!itemType || !itemId) {
    throw new ApiError(400, 'itemType and itemId are required to bookmark.');
  }

  const existing = await Bookmark.findOne({
    user: req.user._id,
    itemType,
    itemId,
  });

  if (existing) {
    await Bookmark.deleteOne({ _id: existing._id });
    res.status(200).json({
      success: true,
      bookmarked: false,
      itemId,
      itemType,
      message: 'Removed from Starred Vault',
    });
    return;
  }

  if (!title) {
    throw new ApiError(400, 'Title is required when bookmarking a new item.');
  }

  const newBookmark = await Bookmark.create({
    user: req.user._id,
    itemType: itemType as BookmarkItemType,
    itemId: itemId.toString(),
    title: title.trim(),
    source: (source || '').trim(),
    subject: (subject || 'General Legal Studies').trim(),
    annotation: (annotation || '').trim(),
    tags: Array.isArray(tags) ? tags : [],
    metadata,
  });

  res.status(201).json({
    success: true,
    bookmarked: true,
    bookmark: newBookmark,
    message: 'Saved to Starred Vault',
  });
});

/**
 * @desc    Update aspirant's personal annotation for a bookmarked item
 * @route   PUT /api/bookmarks/:id/annotation
 * @access  Private
 */
export const updateAnnotation = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, 'Authentication required.');
  }

  const { id } = req.params;
  const { annotation } = req.body;

  if (!id || typeof id !== 'string' || !mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid bookmark identifier.');
  }

  const bookmark = await Bookmark.findOne({
    _id: id,
    user: req.user._id,
  });

  if (!bookmark) {
    throw new ApiError(404, 'Bookmark not found in your vault.');
  }

  bookmark.annotation = (annotation || '').trim();
  await bookmark.save();

  res.status(200).json({
    success: true,
    bookmark,
    message: 'Aspirant annotation updated successfully.',
  });
});

/**
 * @desc    Remove an item from vault by ID
 * @route   DELETE /api/bookmarks/:id
 * @access  Private
 */
export const deleteBookmark = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, 'Authentication required.');
  }

  const { id } = req.params;

  if (!id || typeof id !== 'string' || !mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid bookmark identifier.');
  }

  const result = await Bookmark.deleteOne({
    _id: id,
    user: req.user._id,
  });

  if (result.deletedCount === 0) {
    throw new ApiError(404, 'Bookmark not found in your vault.');
  }

  res.status(200).json({
    success: true,
    message: 'Item removed from Starred Vault.',
  });
});

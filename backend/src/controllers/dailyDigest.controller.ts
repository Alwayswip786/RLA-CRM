import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import fs from 'fs';
import {
  DailyLegalDigestEdition,
  DailyDigestReadStatus,
  DailyDigestStreak,
  type DigestStatus,
  type IDigestItem,
} from '../models/dailyDigest.model.js';
import Bookmark from '../models/bookmark.model.js';
import catchAsync from '../utils/catchAsync.js';
import ApiError from '../utils/ApiError.js';

/**
 * Canonical IST Date calculation ("YYYY-MM-DD")
 */
export const getCurrentDateIST = (): string => {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
};

export const getYesterdayDateIST = (): string => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
};

/**
 * 1. Student: Get "Today's Daily Legal Digest & Case Law Brief" (IST timezone)
 */
export const getTodayDailyDigest = catchAsync(async (req: Request, res: Response) => {
  const todayIST = getCurrentDateIST();
  const userId = req.user?._id;

  // 1. First look for today's published edition
  let edition = await DailyLegalDigestEdition.findOne({
    status: 'published',
    editionDateIST: todayIST,
  })
    .populate('items.relatedJudgementId', 'title citation court benchStrength dateOfJudgement')
    .populate('items.relatedMainsId', 'challengeNumber questionTitle paper marks')
    .lean();

  let isLatestFallback = false;

  // 2. Fallback: If not today, check if there is an edition scheduled for today
  if (!edition) {
    edition = await DailyLegalDigestEdition.findOne({
      status: 'scheduled',
      editionDateIST: todayIST,
    })
      .populate('items.relatedJudgementId', 'title citation court benchStrength dateOfJudgement')
      .populate('items.relatedMainsId', 'challengeNumber questionTitle paper marks')
      .lean();
  }

  // 3. Fallback: Most recent published edition
  if (!edition) {
    edition = await DailyLegalDigestEdition.findOne({ status: 'published' })
      .sort({ editionDateIST: -1 })
      .populate('items.relatedJudgementId', 'title citation court benchStrength dateOfJudgement')
      .populate('items.relatedMainsId', 'challengeNumber questionTitle paper marks')
      .lean();

    if (edition) {
      isLatestFallback = true;
    }
  }

  if (!edition) {
    return res.status(200).json({
      success: true,
      edition: null,
      todayIST,
      isLatestFallback: false,
      bookmarkedItemIds: [],
      readItemIds: [],
      streak: { currentStreak: 0, longestStreak: 0 },
    });
  }

  // Increment total reads counter asynchronously
  DailyLegalDigestEdition.updateOne({ _id: edition._id }, { $inc: { totalReadsCount: 1 } }).exec();

  // If user is authenticated, check bookmark status, read status, and streak
  let bookmarkedItemIds: string[] = [];
  let readItemIds: string[] = [];
  let streak = { currentStreak: 0, longestStreak: 0 };

  if (userId) {
    const [bookmarks, readStatus, userStreak] = await Promise.all([
      Bookmark.find({
        user: userId,
        itemType: 'Daily Digest',
      })
        .select('itemId')
        .lean(),
      DailyDigestReadStatus.findOne({
        user: userId,
        editionId: edition._id,
      }).lean(),
      DailyDigestStreak.findOne({ user: userId }).lean(),
    ]);

    bookmarkedItemIds = bookmarks.map((b) => b.itemId);
    if (readStatus) {
      readItemIds = readStatus.readItemIds || [];
    }
    if (userStreak) {
      streak = {
        currentStreak: userStreak.currentStreak,
        longestStreak: userStreak.longestStreak,
      };
    }
  }

  res.status(200).json({
    success: true,
    edition,
    todayIST,
    isLatestFallback,
    bookmarkedItemIds,
    readItemIds,
    streak,
  });
});

/**
 * 2. Student: Paginated Archive of Previous Daily Legal Digests
 */
export const getDailyDigestArchive = catchAsync(async (req: Request, res: Response) => {
  const {
    page = '1',
    limit = '10',
    search = '',
    month = '',
    year = '',
    subject = '',
    contentType = '',
  } = req.query;

  const filter: Record<string, any> = {
    status: 'published',
  };

  if (year && String(year) !== 'all') {
    filter.editionDateIST = new RegExp(`^${String(year).trim()}-`);
  }

  if (month && String(month) !== 'all') {
    const paddedMonth = String(month).padStart(2, '0');
    filter.editionDateIST = new RegExp(`-\\${paddedMonth}-`);
  }

  if (subject && subject !== 'all') {
    filter['items.subject'] = new RegExp(String(subject).trim(), 'i');
  }

  if (contentType && contentType !== 'all') {
    filter['items.contentType'] = new RegExp(String(contentType).trim(), 'i');
  }

  if (search) {
    const searchRegex = new RegExp(String(search).trim(), 'i');
    filter.$or = [
      { title: searchRegex },
      { 'featuredMaxim.latinText': searchRegex },
      { 'featuredMaxim.englishMeaning': searchRegex },
      { 'items.title': searchRegex },
      { 'items.summary': searchRegex },
      { 'items.examinationTip': searchRegex },
      { 'items.subject': searchRegex },
    ];
  }

  const pageNum = Math.max(parseInt(String(page), 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(String(limit), 10) || 10, 1), 50);
  const skip = (pageNum - 1) * limitNum;

  const [total, editions] = await Promise.all([
    DailyLegalDigestEdition.countDocuments(filter),
    DailyLegalDigestEdition.find(filter)
      .sort({ editionDateIST: -1 })
      .skip(skip)
      .limit(limitNum)
      .select('-compiledPdf.path')
      .lean(),
  ]);

  res.status(200).json({
    success: true,
    count: editions.length,
    total,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum) || 1,
    editions,
  });
});

/**
 * 3. Student: Get Single Edition by Date ("YYYY-MM-DD") or ID
 */
export const getEditionByDateOrId = catchAsync(async (req: Request, res: Response) => {
  const { dateOrId } = req.params;
  const userId = req.user?._id;

  const isObjectId = mongoose.isValidObjectId(dateOrId);
  const filter = isObjectId ? { _id: dateOrId } : { editionDateIST: dateOrId };

  const edition = await DailyLegalDigestEdition.findOne(filter)
    .populate('items.relatedJudgementId', 'title citation court benchStrength dateOfJudgement')
    .populate('items.relatedMainsId', 'challengeNumber questionTitle paper marks')
    .lean();

  if (!edition) {
    throw new ApiError(404, 'Daily Legal Digest edition not found.');
  }

  // Populate bookmark state if user is logged in
  let bookmarkedItemIds: string[] = [];
  let readItemIds: string[] = [];

  if (userId) {
    const [bookmarks, readStatus] = await Promise.all([
      Bookmark.find({
        user: userId,
        itemType: 'Daily Digest',
      })
        .select('itemId')
        .lean(),
      DailyDigestReadStatus.findOne({
        user: userId,
        editionId: edition._id,
      }).lean(),
    ]);

    bookmarkedItemIds = bookmarks.map((b) => b.itemId);
    if (readStatus) {
      readItemIds = readStatus.readItemIds || [];
    }
  }

  res.status(200).json({
    success: true,
    edition,
    bookmarkedItemIds,
    readItemIds,
  });
});

/**
 * 4. Student: Mark Item Read and Update Consistency Streak
 */
export const markItemAsRead = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  if (!user) throw new ApiError(401, 'Authentication required');

  const { editionId, itemId } = req.body;
  if (!editionId || !itemId) {
    throw new ApiError(400, 'editionId and itemId are required');
  }

  const edition = await DailyLegalDigestEdition.findById(editionId);
  if (!edition) {
    throw new ApiError(404, 'Edition not found');
  }

  const todayIST = getCurrentDateIST();
  const yesterdayIST = getYesterdayDateIST();

  // Find or create read status for this user & edition
  let readStatus = await DailyDigestReadStatus.findOne({
    user: user._id,
    editionId: edition._id,
  });

  if (!readStatus) {
    readStatus = new DailyDigestReadStatus({
      user: user._id,
      editionDateIST: edition.editionDateIST,
      editionId: edition._id,
      readItemIds: [itemId],
      isFullyRead: edition.items.length <= 1,
      completedAt: edition.items.length <= 1 ? new Date() : undefined,
    });
  } else {
    if (!readStatus.readItemIds.includes(itemId)) {
      readStatus.readItemIds.push(itemId);
    }
    const allRead = edition.items.every((it) => readStatus!.readItemIds.includes(it.itemId));
    if (allRead && !readStatus.isFullyRead) {
      readStatus.isFullyRead = true;
      readStatus.completedAt = new Date();
    }
  }

  await readStatus.save();

  // Update Student Consistency Streak
  let streak = await DailyDigestStreak.findOne({ user: user._id });
  if (!streak) {
    streak = new DailyDigestStreak({
      user: user._id,
      currentStreak: 1,
      longestStreak: 1,
      lastReadDateIST: todayIST,
      totalEditionsRead: 1,
    });
  } else {
    if (streak.lastReadDateIST !== todayIST) {
      if (streak.lastReadDateIST === yesterdayIST) {
        streak.currentStreak += 1;
      } else {
        streak.currentStreak = 1;
      }
      streak.longestStreak = Math.max(streak.longestStreak, streak.currentStreak);
      streak.lastReadDateIST = todayIST;
      streak.totalEditionsRead += 1;
    }
  }
  await streak.save();

  res.status(200).json({
    success: true,
    message: 'Item marked as read',
    readItemIds: readStatus.readItemIds,
    isFullyRead: readStatus.isFullyRead,
    streak: {
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      totalEditionsRead: streak.totalEditionsRead,
    },
  });
});

/**
 * 5. Student: Get Personal Daily Digest Streak
 */
export const getStudentStreak = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  if (!user) throw new ApiError(401, 'Authentication required');

  let streak = await DailyDigestStreak.findOne({ user: user._id });
  if (!streak) {
    streak = {
      currentStreak: 0,
      longestStreak: 0,
      lastReadDateIST: '',
      totalEditionsRead: 0,
    } as any;
  }

  res.status(200).json({
    success: true,
    streak,
  });
});

// ==========================================
// Admin Controllers
// ==========================================

/**
 * 6. Admin: List All Editions with KPI Statistics
 */
export const getAllEditionsAdmin = catchAsync(async (req: Request, res: Response) => {
  const {
    page = '1',
    limit = '10',
    status = 'all',
    search = '',
    year = '',
    sort = 'newest',
  } = req.query;

  const filter: Record<string, any> = {};

  if (status && status !== 'all') {
    filter.status = status;
  }

  if (year && year !== 'all') {
    filter.editionDateIST = new RegExp(`^${String(year).trim()}-`);
  }

  if (search) {
    const searchRegex = new RegExp(String(search).trim(), 'i');
    filter.$or = [
      { title: searchRegex },
      { 'featuredMaxim.latinText': searchRegex },
      { 'featuredMaxim.englishMeaning': searchRegex },
      { 'items.title': searchRegex },
      { authorName: searchRegex },
    ];
  }

  let sortOption: Record<string, any> = { editionDateIST: -1 };
  if (sort === 'oldest') sortOption = { editionDateIST: 1 };
  if (sort === 'popular') sortOption = { totalReadsCount: -1 };

  const pageNum = Math.max(parseInt(String(page), 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(String(limit), 10) || 10, 1), 50);
  const skip = (pageNum - 1) * limitNum;

  const [total, editions, totalAll, publishedCount, draftCount, scheduledCount, readsAgg] =
    await Promise.all([
      DailyLegalDigestEdition.countDocuments(filter),
      DailyLegalDigestEdition.find(filter)
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum)
        .populate('author', 'name email role')
        .lean(),
      DailyLegalDigestEdition.countDocuments(),
      DailyLegalDigestEdition.countDocuments({ status: 'published' }),
      DailyLegalDigestEdition.countDocuments({ status: 'draft' }),
      DailyLegalDigestEdition.countDocuments({ status: 'scheduled' }),
      DailyLegalDigestEdition.aggregate([
        {
          $group: {
            _id: null,
            totalReads: { $sum: '$totalReadsCount' },
            totalBookmarks: { $sum: '$totalBookmarksCount' },
          },
        },
      ]),
    ]);

  const stats = {
    totalEditions: totalAll,
    publishedCount,
    draftCount,
    scheduledCount,
    totalReads: readsAgg[0]?.totalReads || 0,
    totalBookmarks: readsAgg[0]?.totalBookmarks || 0,
  };

  res.status(200).json({
    success: true,
    stats,
    count: editions.length,
    total,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum) || 1,
    editions,
  });
});

/**
 * 7. Admin: Create & Schedule Daily Legal Digest Edition
 */
export const createEditionAdmin = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  if (!user) throw new ApiError(401, 'Unauthorized');

  const {
    editionDateIST,
    editionNumber,
    title,
    subtitle,
    curatedBy,
    featuredMaxim,
    items,
    status = 'published',
    scheduledPublishAt,
    authorName,
  } = req.body;

  if (!editionDateIST || !editionDateIST.trim()) {
    throw new ApiError(400, 'editionDateIST (YYYY-MM-DD) is required.');
  }

  // Check for duplicate date
  const existing = await DailyLegalDigestEdition.findOne({
    editionDateIST: editionDateIST.trim(),
  });
  if (existing) {
    throw new ApiError(409, `An edition already exists for date ${editionDateIST}`);
  }

  const parsedMaxim = typeof featuredMaxim === 'string' ? JSON.parse(featuredMaxim) : featuredMaxim;
  const parsedItems: IDigestItem[] = typeof items === 'string' ? JSON.parse(items) : items || [];

  if (!parsedMaxim || !parsedMaxim.latinText) {
    throw new ApiError(400, 'featuredMaxim with latinText and englishMeaning is required.');
  }

  const isPub = status === 'published';

  const newEdition = await DailyLegalDigestEdition.create({
    editionDateIST: editionDateIST.trim(),
    editionNumber: Number(editionNumber) || 1,
    title: title?.trim() || 'Daily Legal Digest & Case Law Brief',
    subtitle:
      subtitle?.trim() ||
      'Stay ahead with daily judgments, Bare Act comparative pointers, and Latin maxims.',
    curatedBy: curatedBy?.trim() || 'Curated Daily by Faculty Wing',
    featuredMaxim: parsedMaxim,
    items: parsedItems,
    status: (status as DigestStatus) || 'published',
    isPublished: isPub,
    scheduledPublishAt: scheduledPublishAt ? new Date(scheduledPublishAt) : undefined,
    publishedAt: isPub ? new Date() : undefined,
    author: user._id,
    authorName: authorName?.trim() || user.name || 'Adv. Rajinder Sir',
  });

  res.status(201).json({
    success: true,
    message: `Daily Legal Digest Edition for ${editionDateIST} created successfully.`,
    edition: newEdition,
  });
});

/**
 * 8. Admin: Get Edition Details for Editing
 */
export const getEditionAdmin = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, 'Invalid Edition ID');
  }

  const edition = await DailyLegalDigestEdition.findById(id).lean();
  if (!edition) {
    throw new ApiError(404, 'Edition not found');
  }

  res.status(200).json({
    success: true,
    edition,
  });
});

/**
 * 9. Admin: Update Daily Legal Digest Edition
 */
export const updateEditionAdmin = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, 'Invalid Edition ID');
  }

  const edition = await DailyLegalDigestEdition.findById(id);
  if (!edition) {
    throw new ApiError(404, 'Edition not found');
  }

  const {
    editionDateIST,
    editionNumber,
    title,
    subtitle,
    curatedBy,
    featuredMaxim,
    items,
    status,
    scheduledPublishAt,
    authorName,
  } = req.body;

  if (editionDateIST && editionDateIST.trim() !== edition.editionDateIST) {
    const existing = await DailyLegalDigestEdition.findOne({
      editionDateIST: editionDateIST.trim(),
      _id: { $ne: id },
    });
    if (existing) {
      throw new ApiError(409, `An edition already exists for date ${editionDateIST}`);
    }
    edition.editionDateIST = editionDateIST.trim();
  }

  if (editionNumber !== undefined) edition.editionNumber = Number(editionNumber);
  if (title) edition.title = title.trim();
  if (subtitle) edition.subtitle = subtitle.trim();
  if (curatedBy) edition.curatedBy = curatedBy.trim();
  if (authorName) edition.authorName = authorName.trim();

  if (featuredMaxim) {
    edition.featuredMaxim =
      typeof featuredMaxim === 'string' ? JSON.parse(featuredMaxim) : featuredMaxim;
  }

  if (items) {
    edition.items = typeof items === 'string' ? JSON.parse(items) : items;
  }

  if (status) {
    edition.status = status;
    edition.isPublished = status === 'published';
    if (status === 'published' && !edition.publishedAt) {
      edition.publishedAt = new Date();
    }
  }

  if (scheduledPublishAt) {
    edition.scheduledPublishAt = new Date(scheduledPublishAt);
  }

  await edition.save();

  res.status(200).json({
    success: true,
    message: 'Daily Legal Digest Edition updated successfully.',
    edition,
  });
});

/**
 * 10. Admin: Update Edition Lifecycle Status (draft, scheduled, published, archived)
 */
export const updateEditionStatusAdmin = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, 'Invalid Edition ID');
  }

  if (!['draft', 'scheduled', 'published', 'archived'].includes(status)) {
    throw new ApiError(400, 'Invalid status.');
  }

  const edition = await DailyLegalDigestEdition.findById(id);
  if (!edition) {
    throw new ApiError(404, 'Edition not found');
  }

  edition.status = status;
  edition.isPublished = status === 'published';
  if (status === 'published' && !edition.publishedAt) {
    edition.publishedAt = new Date();
  }

  await edition.save();

  res.status(200).json({
    success: true,
    message: `Edition status updated to ${status}`,
    edition,
  });
});

/**
 * 11. Admin: Delete Daily Edition
 */
export const deleteEditionAdmin = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, 'Invalid Edition ID');
  }

  const edition = await DailyLegalDigestEdition.findById(id);
  if (!edition) {
    throw new ApiError(404, 'Edition not found');
  }

  // Cleanup physical PDF file if present
  if (edition.compiledPdf?.path && fs.existsSync(edition.compiledPdf.path)) {
    await fs.promises.unlink(edition.compiledPdf.path).catch((err) => {
      console.warn(`Failed to unlink compiled digest PDF: ${err.message}`);
    });
  }

  await DailyLegalDigestEdition.findByIdAndDelete(id);

  res.status(200).json({
    success: true,
    message: `Edition for ${edition.editionDateIST} deleted successfully.`,
  });
});

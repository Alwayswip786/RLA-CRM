import type { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import JudgementDigest from '../models/judgementDigest.model.js';
import Bookmark from '../models/bookmark.model.js';
import ApiError from '../utils/ApiError.js';
import catchAsync from '../utils/catchAsync.js';

export const getCurrentDateIST = (): string => {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date()); // Returns "YYYY-MM-DD"
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

/**
 * 1. Get published Landmark Judgements for Student Vault (faceted filters, search & sort)
 */
export const getPublishedJudgements = catchAsync(async (req: Request, res: Response) => {
  const {
    court,
    year,
    subject,
    importance,
    search,
    featured,
    sort = 'date_desc',
    page = '1',
    limit = '9',
  } = req.query;

  const filter: Record<string, any> = { isPublished: true };

  if (court && court !== 'all') {
    filter.court = new RegExp(String(court).trim(), 'i');
  }

  if (year && year !== 'all') {
    const parsedYear = parseInt(String(year), 10);
    if (!Number.isNaN(parsedYear)) {
      filter.year = parsedYear;
    }
  }

  if (subject && subject !== 'all') {
    filter.subject = new RegExp(String(subject).trim(), 'i');
  }

  if (importance && importance !== 'all') {
    filter.importance = new RegExp(`^${String(importance).trim()}$`, 'i');
  }

  if (featured === 'true') {
    filter.isFeatured = true;
  }

  if (search) {
    const searchRegex = new RegExp(String(search).trim(), 'i');
    filter.$or = [
      { title: searchRegex },
      { citation: searchRegex },
      { subject: searchRegex },
      { legalProvisions: searchRegex },
      { summary: searchRegex },
      { ratioDecidendi: searchRegex },
      { tags: searchRegex },
      { judges: searchRegex },
      { mainsUtility: searchRegex },
      { overruledPrecedents: searchRegex },
    ];
  }

  // Sorting Strategy
  let sortOption: Record<string, any> = { dateOfJudgement: -1, createdAt: -1 };
  if (sort === 'date_asc') {
    sortOption = { dateOfJudgement: 1, createdAt: -1 };
  } else if (sort === 'year_desc') {
    sortOption = { year: -1, dateOfJudgement: -1 };
  } else if (sort === 'popular') {
    sortOption = { downloadCount: -1, viewCount: -1 };
  } else if (sort === 'newest') {
    sortOption = { createdAt: -1 };
  } else if (sort === 'title_asc') {
    sortOption = { title: 1 };
  }

  const pageNum = Math.max(parseInt(String(page), 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(String(limit), 10) || 9, 1), 50);
  const skip = (pageNum - 1) * limitNum;

  const [total, judgements] = await Promise.all([
    JudgementDigest.countDocuments(filter),
    JudgementDigest.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum)
      .select('-__v')
      .lean(),
  ]);

  const totalPages = Math.ceil(total / limitNum) || 1;
  const hasNextPage = pageNum < totalPages;
  const hasPrevPage = pageNum > 1;

  res.status(200).json({
    success: true,
    count: judgements.length,
    total,
    page: pageNum,
    currentPage: pageNum,
    limit: limitNum,
    totalPages,
    hasNextPage,
    hasMore: hasNextPage,
    hasPrevPage,
    nextPage: hasNextPage ? pageNum + 1 : null,
    judgements,
  });
});

/**
 * 2. Get distinct metadata for dynamic filter options
 */
export const getFilterMeta = catchAsync(async (_req: Request, res: Response) => {
  const [courts, years, subjects, importances, totalPublished] = await Promise.all([
    JudgementDigest.distinct('court', { isPublished: true }),
    JudgementDigest.distinct('year', { isPublished: true }),
    JudgementDigest.distinct('subject', { isPublished: true }),
    JudgementDigest.distinct('importance', { isPublished: true }),
    JudgementDigest.countDocuments({ isPublished: true }),
  ]);

  const sortedYears = (years as number[]).sort((a, b) => b - a);
  const sortedSubjects = (subjects as string[]).sort();
  const sortedCourts = (courts as string[]).sort();

  res.status(200).json({
    success: true,
    meta: {
      courts: sortedCourts,
      years: sortedYears,
      subjects: sortedSubjects,
      importances: importances.length > 0 ? importances : ['Landmark', 'Leading', 'Recent / Overruling', 'Standard'],
      totalPublished,
    },
  });
});

/**
 * 3. Get featured "Judgement of the Day" / Landmark Spotlight
 */
export const getFeaturedJudgement = catchAsync(async (_req: Request, res: Response) => {
  const todayIST = getCurrentDateIST();
  let featured = await JudgementDigest.findOne({
    status: { $in: ['published', 'scheduled'] },
    dailyDateIST: todayIST,
  })
    .sort({ priority: -1, updatedAt: -1 })
    .lean();

  if (!featured) {
    featured = await JudgementDigest.findOne({ isPublished: true, isFeatured: true })
      .sort({ updatedAt: -1 })
      .lean();
  }

  if (!featured) {
    featured = await JudgementDigest.findOne({ isPublished: true, importance: 'Landmark' })
      .sort({ dateOfJudgement: -1 })
      .lean();
  }

  if (!featured) {
    featured = await JudgementDigest.findOne({ isPublished: true })
      .sort({ dateOfJudgement: -1 })
      .lean();
  }

  res.status(200).json({
    success: true,
    featured,
  });
});

/**
 * 3a. Get dynamic "Landmark Judgment of the Day" scheduled for today (IST)
 */
export const getTodayDailyJudgement = catchAsync(async (req: Request, res: Response) => {
  const todayIST = getCurrentDateIST();
  const userId = req.user?._id;

  // 1. Look for a judgment specifically scheduled for today that is published or scheduled
  let judgment = await JudgementDigest.findOne({
    status: { $in: ['published', 'scheduled'] },
    dailyDateIST: todayIST,
  })
    .sort({ priority: -1, updatedAt: -1 })
    .lean();

  // 2. Fallback: Check for isDailyFeatured: true
  if (!judgment) {
    judgment = await JudgementDigest.findOne({
      status: 'published',
      isDailyFeatured: true,
    })
      .sort({ priority: -1, updatedAt: -1 })
      .lean();
  }

  // 3. Fallback: Landmark importance
  if (!judgment) {
    judgment = await JudgementDigest.findOne({
      status: 'published',
      importance: 'Landmark',
    })
      .sort({ dateOfJudgement: -1 })
      .lean();
  }

  // 4. Ultimate fallback: Any published judgment
  if (!judgment) {
    judgment = await JudgementDigest.findOne({ status: 'published' })
      .sort({ dateOfJudgement: -1 })
      .lean();
  }

  if (!judgment) {
    return res.status(200).json({
      success: true,
      judgment: null,
      isBookmarked: false,
      todayIST,
    });
  }

  // Atomically increment view count
  JudgementDigest.updateOne({ _id: judgment._id }, { $inc: { viewCount: 1 } }).exec();

  // Check if bookmarked by current user
  let isBookmarked = false;
  if (userId) {
    const bm = await Bookmark.findOne({
      user: userId,
      itemType: 'Judgment',
      itemId: String(judgment._id),
    }).select('_id').lean();
    isBookmarked = Boolean(bm);
  }

  res.status(200).json({
    success: true,
    judgment,
    isBookmarked,
    todayIST,
  });
});

/**
 * 3b. Historical Archive of Daily Landmark Judgments
 */
export const getDailyJudgementArchive = catchAsync(async (req: Request, res: Response) => {
  const {
    page = '1',
    limit = '10',
    search,
    subject,
    court,
    year,
  } = req.query;

  const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
  const limitNum = Math.max(1, Math.min(50, parseInt(String(limit), 10) || 10));
  const skip = (pageNum - 1) * limitNum;

  const filter: Record<string, any> = {
    status: 'published',
    $or: [
      { dailyDateIST: { $exists: true, $ne: '' } },
      { isDailyFeatured: true },
      { importance: 'Landmark' },
    ],
  };

  if (search) {
    const searchRegex = new RegExp(String(search).trim(), 'i');
    filter.$and = filter.$and || [];
    filter.$and.push({
      $or: [
        { title: searchRegex },
        { citation: searchRegex },
        { summary: searchRegex },
        { legalProvisions: searchRegex },
        { 'provisions.label': searchRegex },
        { 'keyHoldings.title': searchRegex },
        { 'keyHoldings.text': searchRegex },
      ],
    });
  }

  if (subject && subject !== 'all') {
    filter.subject = new RegExp(String(subject).trim(), 'i');
  }

  if (court && court !== 'all') {
    filter.court = new RegExp(String(court).trim(), 'i');
  }

  if (year && year !== 'all') {
    const parsedYear = parseInt(String(year), 10);
    if (!Number.isNaN(parsedYear)) filter.year = parsedYear;
  }

  const [total, judgements] = await Promise.all([
    JudgementDigest.countDocuments(filter),
    JudgementDigest.find(filter)
      .sort({ dailyDateIST: -1, dateOfJudgement: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
  ]);

  res.status(200).json({
    success: true,
    total,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum) || 1,
    judgements,
  });
});

/**
 * 4. Get single Judgement Digest details by ID (increments view count atomically)
 */
export const getJudgementById = catchAsync(async (req: Request, res: Response) => {
  const id = String(req.params.id || '');
  const user = req.user;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid Judgement Digest ID.');
  }

  const judgement = await JudgementDigest.findById(id).populate('uploadedBy', 'name email role');
  if (!judgement) {
    throw new ApiError(404, 'Judgement Digest not found.');
  }

  const isStaff = user?.role === 'admin' || user?.role === 'faculty';
  if (!judgement.isPublished && !isStaff) {
    throw new ApiError(404, 'Judgement Digest not found or unpublished.');
  }

  // Atomically increment view count (unawaited for optimal responsiveness)
  JudgementDigest.findByIdAndUpdate(id, { $inc: { viewCount: 1 } }).exec();

  res.status(200).json({
    success: true,
    judgement,
  });
});

/**
 * 5. Stream PDF for In-App Viewer (Supports HTTP 206 Partial Content Range Requests)
 */
export const previewJudgementPdf = catchAsync(async (req: Request, res: Response) => {
  const id = String(req.params.id || '');
  const user = req.user;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid Judgement Digest ID.');
  }

  const judgement = await JudgementDigest.findById(id).lean();
  if (!judgement) {
    throw new ApiError(404, 'Judgement Digest not found.');
  }

  const isStaff = user?.role === 'admin' || user?.role === 'faculty';
  if (!judgement.isPublished && !isStaff) {
    throw new ApiError(404, 'Judgement Digest not found.');
  }

  if (!judgement.pdfFile || !judgement.pdfFile.path) {
    throw new ApiError(404, 'No PDF file is attached to this Landmark Judgement.');
  }

  const filePath = judgement.pdfFile.path;
  if (!fs.existsSync(filePath)) {
    throw new ApiError(404, 'Judgement PDF document file is missing from server storage.');
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  const safeOriginalName = judgement.pdfFile.originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${safeOriginalName}"`);
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Support HTTP 206 Partial Content range requests for instant page-flipping
  if (range && typeof range === 'string') {
    const parts = range.replace(/bytes=/, '').split('-');
    const rawStart = parts[0] || '0';
    const rawEnd = parts[1];
    const start = parseInt(rawStart, 10);
    const maxEnd = fileSize - 1;
    const rawEndNum = rawEnd ? parseInt(rawEnd, 10) : maxEnd;
    const end = Math.min(rawEndNum, maxEnd);

    if (start > maxEnd || start < 0 || start > end) {
      res.status(416).setHeader('Content-Range', `bytes */${fileSize}`);
      return res.end();
    }

    const chunksize = end - start + 1;
    const fileStream = fs.createReadStream(filePath, { start, end });

    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Content-Length': chunksize,
    });

    fileStream.pipe(res);
  } else {
    res.writeHead(200, {
      'Content-Length': fileSize,
    });
    fs.createReadStream(filePath).pipe(res);
  }
});

/**
 * 6. Download PDF and atomically increment download counter
 */
export const downloadJudgementPdf = catchAsync(async (req: Request, res: Response) => {
  const id = String(req.params.id || '');
  const user = req.user;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid Judgement Digest ID.');
  }

  const judgement = await JudgementDigest.findById(id);
  if (!judgement) {
    throw new ApiError(404, 'Judgement Digest not found.');
  }

  const isStaff = user?.role === 'admin' || user?.role === 'faculty';
  if (!judgement.isPublished && !isStaff) {
    throw new ApiError(404, 'Judgement Digest not found.');
  }

  if (!judgement.pdfFile || !judgement.pdfFile.path) {
    throw new ApiError(404, 'No PDF document attached to this Landmark Judgement.');
  }

  const filePath = judgement.pdfFile.path;
  if (!fs.existsSync(filePath)) {
    throw new ApiError(404, 'PDF file not found on disk.');
  }

  // Increment download counter
  judgement.downloadCount += 1;
  await judgement.save();

  const safeDownloadName = (judgement.pdfFile.originalName || 'Landmark_Judgement.pdf').replace(/[^a-zA-Z0-9._-]/g, '_');
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${safeDownloadName}"`);

  fs.createReadStream(filePath).pipe(res);
});

/**
 * 7. Stream thumbnail / cover image
 */
export const previewJudgementThumbnail = catchAsync(async (req: Request, res: Response) => {
  const id = String(req.params.id || '');

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid ID.');
  }

  const judgement = await JudgementDigest.findById(id).select('thumbnail').lean();
  if (!judgement || !judgement.thumbnail || !fs.existsSync(judgement.thumbnail.path)) {
    return res.status(404).json({ success: false, message: 'No thumbnail available.' });
  }

  res.setHeader('Content-Type', judgement.thumbnail.mimeType || 'image/jpeg');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  fs.createReadStream(judgement.thumbnail.path).pipe(res);
});

/**
 * 8. Admin: Get all Judgements with comprehensive KPI statistics
 */
export const getAllJudgementsAdmin = catchAsync(async (req: Request, res: Response) => {
  const {
    court,
    year,
    subject,
    importance,
    status,
    search,
    sort = 'newest',
    page = '1',
    limit = '15',
  } = req.query;

  const filter: Record<string, any> = {};

  if (court && court !== 'all') {
    filter.court = new RegExp(String(court).trim(), 'i');
  }

  if (year && year !== 'all') {
    const parsedYear = parseInt(String(year), 10);
    if (!Number.isNaN(parsedYear)) {
      filter.year = parsedYear;
    }
  }

  if (subject && subject !== 'all') {
    filter.subject = new RegExp(String(subject).trim(), 'i');
  }

  if (importance && importance !== 'all') {
    filter.importance = new RegExp(`^${String(importance).trim()}$`, 'i');
  }

  if (status && status !== 'all') {
    if (status === 'published') {
      filter.$or = [{ status: 'published' }, { isPublished: true }];
    } else if (status === 'draft') {
      filter.$or = [{ status: 'draft' }, { isPublished: false }];
    } else if (status === 'scheduled' || status === 'archived') {
      filter.status = status;
    }
  }

  if (search) {
    const searchRegex = new RegExp(String(search).trim(), 'i');
    filter.$or = [
      { title: searchRegex },
      { citation: searchRegex },
      { court: searchRegex },
      { subject: searchRegex },
      { legalProvisions: searchRegex },
      { summary: searchRegex },
      { tags: searchRegex },
      { judges: searchRegex },
    ];
  }

  let sortOption: Record<string, any> = { createdAt: -1 };
  if (sort === 'date_desc') sortOption = { dateOfJudgement: -1, createdAt: -1 };
  if (sort === 'date_asc') sortOption = { dateOfJudgement: 1, createdAt: -1 };
  if (sort === 'year_desc') sortOption = { year: -1, dateOfJudgement: -1 };
  if (sort === 'popular') sortOption = { downloadCount: -1 };
  if (sort === 'title_asc') sortOption = { title: 1 };

  const pageNum = Math.max(parseInt(String(page), 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(String(limit), 10) || 15, 1), 100);
  const skip = (pageNum - 1) * limitNum;

  const [total, judgements, totalAll, publishedCount, draftCount, downloadAggregation] = await Promise.all([
    JudgementDigest.countDocuments(filter),
    JudgementDigest.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum)
      .populate('uploadedBy', 'name email role')
      .lean(),
    JudgementDigest.countDocuments(),
    JudgementDigest.countDocuments({ isPublished: true }),
    JudgementDigest.countDocuments({ isPublished: false }),
    JudgementDigest.aggregate([
      {
        $group: {
          _id: null,
          totalDownloads: { $sum: '$downloadCount' },
          totalViews: { $sum: '$viewCount' },
        },
      },
    ]),
  ]);

  const stats = {
    totalPrecedents: totalAll,
    publishedCount,
    draftCount,
    totalDownloads: downloadAggregation[0]?.totalDownloads || 0,
    totalViews: downloadAggregation[0]?.totalViews || 0,
  };

  res.status(200).json({
    success: true,
    stats,
    count: judgements.length,
    total,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum) || 1,
    judgements,
  });
});

/**
 * 9. Admin: Upload new Landmark Judgement with optional PDF and rich metadata (multipart/form-data)
 */
export const createJudgement = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  if (!user) throw new ApiError(401, 'Unauthorized');

  const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
  const pdfFile = files?.pdf?.[0];
  const thumbnailFile = files?.thumbnail?.[0];

  const {
    title,
    citation,
    court,
    bench,
    benchStrength,
    judges,
    dateOfJudgement,
    year,
    subject,
    category,
    legalProvisions,
    provisions,
    summary,
    ratioDecidendi,
    keyHoldings,
    fullAnalysis,
    sourceReference,
    mainsUtility,
    overruledPrecedents,
    tags,
    importance,
    status,
    dailyDateIST,
    isDailyFeatured,
    priority,
    isPublished,
    isFeatured,
    relatedCases,
    examRelevance,
    overruledStatus,
  } = req.body;

  if (!title || !title.trim()) {
    throw new ApiError(400, 'Judgement case name / title is required.');
  }
  if (!citation || !citation.trim()) {
    throw new ApiError(400, 'Legal citation is required.');
  }
  if (!court || !court.trim()) {
    throw new ApiError(400, 'Court is required.');
  }
  if (!subject || !subject.trim()) {
    throw new ApiError(400, 'Subject area is required.');
  }
  if (!summary || !summary.trim()) {
    throw new ApiError(400, 'Executive case summary is required.');
  }

  // Parse Judgement Date & Year
  const parsedDate = dateOfJudgement ? new Date(dateOfJudgement) : new Date();
  let parsedYear = year ? parseInt(String(year), 10) : parsedDate.getFullYear();
  if (Number.isNaN(parsedYear) || parsedYear < 1950) {
    parsedYear = parsedDate.getFullYear();
  }

  // Helper parser for array or comma-separated string
  const parseList = (input: any): string[] => {
    if (!input) return [];
    if (Array.isArray(input)) return input.map((t) => String(t).trim()).filter(Boolean);
    if (typeof input === 'string') {
      try {
        const parsed = JSON.parse(input);
        if (Array.isArray(parsed)) return parsed.map((t) => String(t).trim()).filter(Boolean);
      } catch {
        return input.split(/[\n,]+/).map((t) => t.trim()).filter(Boolean);
      }
    }
    return [];
  };

  const parseJsonOrArray = (input: any): any[] => {
    if (!input) return [];
    if (Array.isArray(input)) return input;
    if (typeof input === 'string') {
      try {
        const parsed = JSON.parse(input);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        return [];
      }
    }
    return [];
  };

  const parsedJudges = parseList(judges);
  const parsedLegalProvisions = parseList(legalProvisions);
  const parsedRatio = parseList(ratioDecidendi);
  const parsedTags = parseList(tags);

  const parsedKeyHoldings = parseJsonOrArray(keyHoldings);
  const parsedProvisions = parseJsonOrArray(provisions);
  const parsedRelatedCases = parseJsonOrArray(relatedCases);

  const parsedExamRelevance = typeof examRelevance === 'string'
    ? (() => { try { return JSON.parse(examRelevance); } catch { return undefined; } })()
    : examRelevance;

  const parsedOverruledStatus = typeof overruledStatus === 'string'
    ? (() => { try { return JSON.parse(overruledStatus); } catch { return undefined; } })()
    : overruledStatus;

  let pdfMetadata = undefined;
  if (pdfFile) {
    const sizeBytes = pdfFile.size;
    const sizeFormatted = formatFileSize(sizeBytes);
    pdfMetadata = {
      filename: pdfFile.filename,
      originalName: pdfFile.originalname,
      path: pdfFile.path,
      mimeType: pdfFile.mimetype || 'application/pdf',
      sizeBytes,
      sizeFormatted,
    };
  }

  const determinedStatus = status || (isPublished === 'false' || isPublished === false ? 'draft' : 'published');
  const isPub = determinedStatus === 'published' || isPublished === true || isPublished === 'true';

  const newJudgement = await JudgementDigest.create({
    title: title.trim(),
    citation: citation.trim(),
    court: court.trim(),
    bench: bench?.trim() || 'Division Bench (2 Judges)',
    benchStrength: benchStrength?.trim() || bench?.trim() || '3-Judge Bench',
    judges: parsedJudges,
    dateOfJudgement: parsedDate,
    year: parsedYear,
    subject: subject.trim(),
    category: category?.trim() || subject.trim(),
    legalProvisions: parsedLegalProvisions,
    provisions: parsedProvisions.length > 0
      ? parsedProvisions
      : parsedLegalProvisions.map((lp) => ({ label: lp, actOrCode: '' })),
    summary: summary.trim(),
    ratioDecidendi: parsedRatio,
    keyHoldings: parsedKeyHoldings.length > 0
      ? parsedKeyHoldings
      : parsedRatio.map((r, i) => ({ title: `Holding ${i + 1}:`, text: r })),
    fullAnalysis: fullAnalysis?.trim() || '',
    sourceReference: sourceReference?.trim() || '',
    mainsUtility: mainsUtility?.trim() || '',
    overruledPrecedents: overruledPrecedents?.trim() || '',
    tags: parsedTags,
    importance: importance || 'Landmark',
    status: determinedStatus,
    dailyDateIST: dailyDateIST?.trim() || undefined,
    isDailyFeatured: isDailyFeatured === true || isDailyFeatured === 'true',
    priority: Number(priority) || 1,
    pdfFile: pdfMetadata,
    thumbnail: thumbnailFile
      ? {
          filename: thumbnailFile.filename,
          originalName: thumbnailFile.originalname,
          path: thumbnailFile.path,
          mimeType: thumbnailFile.mimetype,
          sizeBytes: thumbnailFile.size,
        }
      : undefined,
    isPublished: isPub,
    publishedAt: isPub ? new Date() : undefined,
    isFeatured: isFeatured === 'true' || isFeatured === true,
    relatedCases: parsedRelatedCases,
    examRelevance: parsedExamRelevance,
    overruledStatus: parsedOverruledStatus,
    uploadedBy: user._id,
  });

  res.status(201).json({
    success: true,
    message: 'Landmark Judgement Digest created successfully.',
    judgement: newJudgement,
  });
});

/**
 * 10. Admin: Update Judgement metadata
 */
export const updateJudgement = catchAsync(async (req: Request, res: Response) => {
  const id = String(req.params.id || '');
  const user = req.user;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid Judgement Digest ID.');
  }

  const judgement = await JudgementDigest.findById(id);
  if (!judgement) {
    throw new ApiError(404, 'Judgement Digest not found.');
  }

  const {
    title,
    citation,
    court,
    bench,
    benchStrength,
    judges,
    dateOfJudgement,
    year,
    subject,
    category,
    legalProvisions,
    provisions,
    summary,
    ratioDecidendi,
    keyHoldings,
    fullAnalysis,
    sourceReference,
    mainsUtility,
    overruledPrecedents,
    tags,
    importance,
    status,
    dailyDateIST,
    isDailyFeatured,
    priority,
    isFeatured,
    relatedCases,
    examRelevance,
    overruledStatus,
  } = req.body;

  const parseList = (input: any): string[] => {
    if (!input) return [];
    if (Array.isArray(input)) return input.map((t) => String(t).trim()).filter(Boolean);
    if (typeof input === 'string') {
      try {
        const parsed = JSON.parse(input);
        if (Array.isArray(parsed)) return parsed.map((t) => String(t).trim()).filter(Boolean);
      } catch {
        return input.split(/[\n,]+/).map((t) => t.trim()).filter(Boolean);
      }
    }
    return [];
  };

  const parseJsonOrArray = (input: any): any[] => {
    if (!input) return [];
    if (Array.isArray(input)) return input;
    if (typeof input === 'string') {
      try {
        const parsed = JSON.parse(input);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        return [];
      }
    }
    return [];
  };

  if (title) judgement.title = title.trim();
  if (citation) judgement.citation = citation.trim();
  if (court) judgement.court = court.trim();
  if (bench !== undefined) judgement.bench = bench.trim();
  if (benchStrength !== undefined) judgement.benchStrength = benchStrength.trim();
  if (judges !== undefined) judgement.judges = parseList(judges);
  if (dateOfJudgement) {
    judgement.dateOfJudgement = new Date(dateOfJudgement);
    if (!year) judgement.year = judgement.dateOfJudgement.getFullYear();
  }
  if (year) judgement.year = parseInt(String(year), 10);
  if (subject) judgement.subject = subject.trim();
  if (category !== undefined) judgement.category = category.trim();
  if (legalProvisions !== undefined) judgement.legalProvisions = parseList(legalProvisions);
  if (provisions !== undefined) judgement.provisions = parseJsonOrArray(provisions);
  if (summary !== undefined) judgement.summary = summary.trim();
  if (ratioDecidendi !== undefined) judgement.ratioDecidendi = parseList(ratioDecidendi);
  if (keyHoldings !== undefined) judgement.keyHoldings = parseJsonOrArray(keyHoldings);
  if (fullAnalysis !== undefined) judgement.fullAnalysis = fullAnalysis.trim();
  if (sourceReference !== undefined) judgement.sourceReference = sourceReference.trim();
  if (mainsUtility !== undefined) judgement.mainsUtility = mainsUtility.trim();
  if (overruledPrecedents !== undefined) judgement.overruledPrecedents = overruledPrecedents.trim();
  if (tags !== undefined) judgement.tags = parseList(tags);
  if (importance) judgement.importance = importance;
  if (status) {
    judgement.status = status;
    judgement.isPublished = status === 'published';
  }
  if (dailyDateIST !== undefined) judgement.dailyDateIST = dailyDateIST.trim();
  if (isDailyFeatured !== undefined) judgement.isDailyFeatured = isDailyFeatured === true || isDailyFeatured === 'true';
  if (priority !== undefined) judgement.priority = Number(priority) || 1;
  if (isFeatured !== undefined) judgement.isFeatured = isFeatured === true || isFeatured === 'true';
  if (relatedCases !== undefined) judgement.relatedCases = parseJsonOrArray(relatedCases);
  if (examRelevance !== undefined) {
    judgement.examRelevance = typeof examRelevance === 'string'
      ? (() => { try { return JSON.parse(examRelevance); } catch { return undefined; } })()
      : examRelevance;
  }
  if (overruledStatus !== undefined) {
    judgement.overruledStatus = typeof overruledStatus === 'string'
      ? (() => { try { return JSON.parse(overruledStatus); } catch { return undefined; } })()
      : overruledStatus;
  }

  judgement.lastEditedBy = user?._id;
  await judgement.save();

  res.status(200).json({
    success: true,
    message: 'Judgement Digest updated successfully.',
    judgement,
  });
});

/**
 * 10a. Admin: Schedule a judgment as Landmark Judgment of the Day
 */
export const scheduleDailyJudgementAdmin = catchAsync(async (req: Request, res: Response) => {
  const id = String(req.params.id || '');
  const { dailyDateIST, priority = 1, isDailyFeatured = true, status = 'published' } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid Judgement ID.');
  }

  const judgement = await JudgementDigest.findById(id);
  if (!judgement) {
    throw new ApiError(404, 'Judgement not found.');
  }

  judgement.dailyDateIST = dailyDateIST || getCurrentDateIST();
  judgement.priority = Number(priority) || 1;
  judgement.isDailyFeatured = Boolean(isDailyFeatured);
  judgement.status = status;
  judgement.isPublished = status === 'published';
  judgement.lastEditedBy = req.user?._id;

  await judgement.save();

  res.status(200).json({
    success: true,
    message: `Judgement scheduled as Landmark Judgment of the Day for ${judgement.dailyDateIST}`,
    judgement,
  });
});

/**
 * 10b. Admin: Update status (draft, scheduled, published, archived)
 */
export const updateJudgementStatusAdmin = catchAsync(async (req: Request, res: Response) => {
  const id = String(req.params.id || '');
  const { status } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid Judgement ID.');
  }

  if (!['draft', 'scheduled', 'published', 'archived'].includes(status)) {
    throw new ApiError(400, 'Invalid status.');
  }

  const judgement = await JudgementDigest.findById(id);
  if (!judgement) {
    throw new ApiError(404, 'Judgement not found.');
  }

  judgement.status = status;
  judgement.isPublished = status === 'published';
  judgement.lastEditedBy = req.user?._id;

  await judgement.save();

  res.status(200).json({
    success: true,
    message: `Judgement status updated to ${status}`,
    judgement,
  });
});

/**
 * 11. Admin: Replace existing PDF file with a revised or expanded document
 */
export const replaceJudgementPdf = catchAsync(async (req: Request, res: Response) => {
  const id = String(req.params.id || '');
  const user = req.user;
  const newPdf = req.file;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid Judgement Digest ID.');
  }

  if (!newPdf) {
    throw new ApiError(400, 'New PDF file is required to replace existing file.');
  }

  const judgement = await JudgementDigest.findById(id);
  if (!judgement) {
    if (fs.existsSync(newPdf.path)) {
      await fs.promises.unlink(newPdf.path).catch(() => {});
    }
    throw new ApiError(404, 'Judgement Digest not found.');
  }

  // Delete previous physical file safely if existed
  const oldPath = judgement.pdfFile?.path;
  if (oldPath && fs.existsSync(oldPath)) {
    await fs.promises.unlink(oldPath).catch((err) => {
      console.warn(`Failed to unlink old Judgement PDF: ${err.message}`);
    });
  }

  const sizeBytes = newPdf.size;
  judgement.pdfFile = {
    filename: newPdf.filename,
    originalName: newPdf.originalname,
    path: newPdf.path,
    mimeType: newPdf.mimetype || 'application/pdf',
    sizeBytes,
    sizeFormatted: formatFileSize(sizeBytes),
  };
  judgement.lastEditedBy = user?._id;

  await judgement.save();

  res.status(200).json({
    success: true,
    message: 'Judgement PDF document replaced successfully.',
    judgement,
  });
});

/**
 * 12. Admin: One-click publish / unpublish toggle
 */
export const togglePublishJudgement = catchAsync(async (req: Request, res: Response) => {
  const id = String(req.params.id || '');

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid Judgement Digest ID.');
  }

  const judgement = await JudgementDigest.findById(id);
  if (!judgement) {
    throw new ApiError(404, 'Judgement Digest not found.');
  }

  judgement.isPublished = !judgement.isPublished;
  if (judgement.isPublished && !judgement.publishedAt) {
    judgement.publishedAt = new Date();
  }

  await judgement.save();

  res.status(200).json({
    success: true,
    message: `Judgement "${judgement.title}" is now ${judgement.isPublished ? 'PUBLISHED' : 'UNPUBLISHED (DRAFT)'}.`,
    isPublished: judgement.isPublished,
    judgement,
  });
});

/**
 * 13. Admin: Permanently delete Judgement record and clean up disk files
 */
export const deleteJudgement = catchAsync(async (req: Request, res: Response) => {
  const id = String(req.params.id || '');

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid Judgement Digest ID.');
  }

  const judgement = await JudgementDigest.findById(id);
  if (!judgement) {
    throw new ApiError(404, 'Judgement Digest not found.');
  }

  // Cleanup PDF file
  if (judgement.pdfFile?.path && fs.existsSync(judgement.pdfFile.path)) {
    await fs.promises.unlink(judgement.pdfFile.path).catch((err) => {
      console.warn(`Failed to unlink Judgement PDF: ${err.message}`);
    });
  }

  // Cleanup thumbnail file if exists
  if (judgement.thumbnail?.path && fs.existsSync(judgement.thumbnail.path)) {
    await fs.promises.unlink(judgement.thumbnail.path).catch((err) => {
      console.warn(`Failed to unlink Judgement thumbnail: ${err.message}`);
    });
  }

  await JudgementDigest.findByIdAndDelete(id);

  res.status(200).json({
    success: true,
    message: `Judgement "${judgement.title}" and associated files deleted permanently.`,
  });
});

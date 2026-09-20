import type { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import JudgementDigest from '../models/judgementDigest.model.js';
import ApiError from '../utils/ApiError.js';
import catchAsync from '../utils/catchAsync.js';

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

  res.status(200).json({
    success: true,
    count: judgements.length,
    total,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum) || 1,
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
  let featured = await JudgementDigest.findOne({ isPublished: true, isFeatured: true })
    .sort({ updatedAt: -1 })
    .lean();

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

  const filePath = judgement.pdfFile.path;
  if (!fs.existsSync(filePath)) {
    throw new ApiError(404, 'PDF file not found on disk.');
  }

  // Increment download counter
  judgement.downloadCount += 1;
  await judgement.save();

  const safeDownloadName = judgement.pdfFile.originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
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

  if (status === 'published') {
    filter.isPublished = true;
  } else if (status === 'draft') {
    filter.isPublished = false;
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
 * 9. Admin: Upload new Landmark Judgement PDF with rich metadata (multipart/form-data)
 */
export const createJudgement = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  if (!user) throw new ApiError(401, 'Unauthorized');

  const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
  const pdfFile = files?.pdf?.[0];
  const thumbnailFile = files?.thumbnail?.[0];

  if (!pdfFile) {
    throw new ApiError(400, 'Judgement Digest PDF document file is required.');
  }

  const {
    title,
    citation,
    court,
    bench,
    judges,
    dateOfJudgement,
    year,
    subject,
    legalProvisions,
    summary,
    ratioDecidendi,
    mainsUtility,
    overruledPrecedents,
    tags,
    importance,
    isPublished,
    isFeatured,
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
        // split by comma or newline
        return input.split(/[\n,]+/).map((t) => t.trim()).filter(Boolean);
      }
    }
    return [];
  };

  const parsedJudges = parseList(judges);
  const parsedLegalProvisions = parseList(legalProvisions);
  const parsedRatio = parseList(ratioDecidendi);
  const parsedTags = parseList(tags);

  const sizeBytes = pdfFile.size;
  const sizeFormatted = formatFileSize(sizeBytes);

  const newJudgement = await JudgementDigest.create({
    title: title.trim(),
    citation: citation.trim(),
    court: court.trim(),
    bench: bench?.trim() || 'Division Bench (2 Judges)',
    judges: parsedJudges,
    dateOfJudgement: parsedDate,
    year: parsedYear,
    subject: subject.trim(),
    legalProvisions: parsedLegalProvisions,
    summary: summary.trim(),
    ratioDecidendi: parsedRatio,
    mainsUtility: mainsUtility?.trim() || '',
    overruledPrecedents: overruledPrecedents?.trim() || '',
    tags: parsedTags,
    importance: importance || 'Landmark',
    pdfFile: {
      filename: pdfFile.filename,
      originalName: pdfFile.originalname,
      path: pdfFile.path,
      mimeType: pdfFile.mimetype || 'application/pdf',
      sizeBytes,
      sizeFormatted,
    },
    thumbnail: thumbnailFile
      ? {
          filename: thumbnailFile.filename,
          originalName: thumbnailFile.originalname,
          path: thumbnailFile.path,
          mimeType: thumbnailFile.mimetype,
          sizeBytes: thumbnailFile.size,
        }
      : undefined,
    isPublished: isPublished === 'true' || isPublished === true,
    publishedAt: isPublished === 'true' || isPublished === true ? new Date() : undefined,
    isFeatured: isFeatured === 'true' || isFeatured === true,
    uploadedBy: user._id,
  });

  res.status(201).json({
    success: true,
    message: 'Landmark Judgement Digest uploaded successfully.',
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
    judges,
    dateOfJudgement,
    year,
    subject,
    legalProvisions,
    summary,
    ratioDecidendi,
    mainsUtility,
    overruledPrecedents,
    tags,
    importance,
    isFeatured,
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

  if (title) judgement.title = title.trim();
  if (citation) judgement.citation = citation.trim();
  if (court) judgement.court = court.trim();
  if (bench !== undefined) judgement.bench = bench.trim();
  if (judges !== undefined) judgement.judges = parseList(judges);
  if (dateOfJudgement) {
    judgement.dateOfJudgement = new Date(dateOfJudgement);
    if (!year) judgement.year = judgement.dateOfJudgement.getFullYear();
  }
  if (year) judgement.year = parseInt(String(year), 10);
  if (subject) judgement.subject = subject.trim();
  if (legalProvisions !== undefined) judgement.legalProvisions = parseList(legalProvisions);
  if (summary !== undefined) judgement.summary = summary.trim();
  if (ratioDecidendi !== undefined) judgement.ratioDecidendi = parseList(ratioDecidendi);
  if (mainsUtility !== undefined) judgement.mainsUtility = mainsUtility.trim();
  if (overruledPrecedents !== undefined) judgement.overruledPrecedents = overruledPrecedents.trim();
  if (tags !== undefined) judgement.tags = parseList(tags);
  if (importance) judgement.importance = importance;
  if (isFeatured !== undefined) judgement.isFeatured = isFeatured === true || isFeatured === 'true';

  judgement.lastEditedBy = user?._id;
  await judgement.save();

  res.status(200).json({
    success: true,
    message: 'Judgement Digest updated successfully.',
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

  // Delete previous physical file safely
  const oldPath = judgement.pdfFile.path;
  if (fs.existsSync(oldPath)) {
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

import type { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import BareActNote from '../models/bareActNote.model.js';
import ApiError from '../utils/ApiError.js';
import catchAsync from '../utils/catchAsync.js';

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const safeJsonParse = <T>(input: any, defaultValue: T): T => {
  if (typeof input !== 'string') return input ?? defaultValue;
  try {
    return JSON.parse(input);
  } catch {
    return defaultValue;
  }
};

/**
 * 1. Get published Bare Act Decoding Notes for Student Library
 */
export const getPublishedNotes = catchAsync(async (req: Request, res: Response) => {
  const {
    category,
    actName,
    chapter,
    difficulty,
    search,
    featured,
    sort = 'newest',
    page = '1',
    limit = '9',
  } = req.query;

  const filter: Record<string, any> = { isPublished: true };

  if (category && category !== 'all') {
    filter.category = new RegExp(`^${String(category).trim()}$`, 'i');
  }

  if (actName && actName !== 'all') {
    filter.actName = new RegExp(String(actName).trim(), 'i');
  }

  if (chapter && chapter !== 'all') {
    filter.chapter = new RegExp(String(chapter).trim(), 'i');
  }

  if (difficulty && difficulty !== 'all') {
    filter.difficulty = new RegExp(`^${String(difficulty).trim()}$`, 'i');
  }

  if (featured === 'true') {
    filter.isFeatured = true;
  }

  if (search) {
    const searchRegex = new RegExp(String(search).trim(), 'i');
    filter.$or = [
      { title: searchRegex },
      { actName: searchRegex },
      { sectionsCovered: searchRegex },
      { chapter: searchRegex },
      { description: searchRegex },
      { highlights: searchRegex },
      { tags: searchRegex },
      { author: searchRegex },
      { 'sectionBreakdown.heading': searchRegex },
      { 'sectionBreakdown.sectionNumber': searchRegex },
    ];
  }

  // Sorting Strategy
  let sortOption: Record<string, any> = { createdAt: -1 };
  if (sort === 'popular') {
    sortOption = { downloadCount: -1, viewCount: -1 };
  } else if (sort === 'act_asc') {
    sortOption = { actName: 1, actYear: -1 };
  } else if (sort === 'act_desc') {
    sortOption = { actName: -1, actYear: -1 };
  } else if (sort === 'year_desc') {
    sortOption = { actYear: -1, createdAt: -1 };
  } else if (sort === 'oldest') {
    sortOption = { createdAt: 1 };
  } else if (sort === 'title_asc') {
    sortOption = { title: 1 };
  }

  const pageNum = Math.max(parseInt(String(page), 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(String(limit), 10) || 9, 1), 50);
  const skip = (pageNum - 1) * limitNum;

  const [total, notes] = await Promise.all([
    BareActNote.countDocuments(filter),
    BareActNote.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum)
      .populate('relatedJudgements', 'title citation court year importance')
      .select('-__v')
      .lean(),
  ]);

  const totalPages = Math.ceil(total / limitNum) || 1;

  res.status(200).json({
    success: true,
    count: notes.length,
    total,
    totalPages,
    page: pageNum,
    notes,
  });
});

/**
 * 2. Get dynamic distinct filter options from published notes
 */
export const getFilterMeta = catchAsync(async (_req: Request, res: Response) => {
  const [acts, categories, chapters, years] = await Promise.all([
    BareActNote.distinct('actName', { isPublished: true }),
    BareActNote.distinct('category', { isPublished: true }),
    BareActNote.distinct('chapter', { isPublished: true, chapter: { $ne: '' } }),
    BareActNote.distinct('actYear', { isPublished: true }),
  ]);

  res.status(200).json({
    success: true,
    acts: acts.filter(Boolean).sort(),
    categories: categories.filter(Boolean).sort(),
    chapters: chapters.filter(Boolean).sort(),
    years: years.filter((y): y is number => typeof y === 'number' && !Number.isNaN(y)).sort((a, b) => b - a),
    difficulties: ['Prelims Booster', 'Mains Analytical', 'Comprehensive Mastery'],
  });
});

/**
 * 3. Get featured "Act of the Week" or Spotlight Decoding Note
 */
export const getFeaturedNote = catchAsync(async (_req: Request, res: Response) => {
  let note = await BareActNote.findOne({ isPublished: true, isFeatured: true })
    .sort({ createdAt: -1 })
    .populate('relatedJudgements', 'title citation court year importance')
    .lean();

  if (!note) {
    note = await BareActNote.findOne({ isPublished: true })
      .sort({ downloadCount: -1, createdAt: -1 })
      .populate('relatedJudgements', 'title citation court year importance')
      .lean();
  }

  res.status(200).json({
    success: true,
    note: note || null,
  });
});

/**
 * 4. Get single Bare Act Note details by ID
 */
export const getNoteById = catchAsync(async (req: Request, res: Response) => {
  const id = String(req.params.id || '');
  const user = req.user;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid Bare Act Note ID.');
  }

  const note = await BareActNote.findById(id)
    .populate('relatedJudgements', 'title citation court year bench importance summary ratioDecidendi')
    .lean();

  if (!note) {
    throw new ApiError(404, 'Bare Act Decoding Note not found.');
  }

  const isStaff = user?.role === 'admin' || user?.role === 'faculty';
  if (!note.isPublished && !isStaff) {
    throw new ApiError(404, 'Bare Act Decoding Note not found.');
  }

  // Atomically increment view count
  await BareActNote.findByIdAndUpdate(id, { $inc: { viewCount: 1 } });

  res.status(200).json({
    success: true,
    note,
  });
});

/**
 * 5. In-App Range-Streamed PDF Preview (HTTP 206 Partial Content)
 */
export const previewNotePdf = catchAsync(async (req: Request, res: Response) => {
  const id = String(req.params.id || '');
  const user = req.user;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid Bare Act Note ID.');
  }

  const note = await BareActNote.findById(id).select('pdfFile isPublished');
  if (!note) {
    throw new ApiError(404, 'Bare Act Decoding Note not found.');
  }

  const isStaff = user?.role === 'admin' || user?.role === 'faculty';
  if (!note.isPublished && !isStaff) {
    throw new ApiError(404, 'Bare Act Decoding Note not found.');
  }

  const filePath = note.pdfFile?.path;
  if (!filePath || !fs.existsSync(filePath)) {
    throw new ApiError(404, 'Note PDF document file is missing from server storage.');
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  const safeOriginalName = note.pdfFile.originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${safeOriginalName}"`);
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('X-Content-Type-Options', 'nosniff');

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
export const downloadNotePdf = catchAsync(async (req: Request, res: Response) => {
  const id = String(req.params.id || '');
  const user = req.user;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid Bare Act Note ID.');
  }

  const note = await BareActNote.findById(id);
  if (!note) {
    throw new ApiError(404, 'Bare Act Decoding Note not found.');
  }

  const isStaff = user?.role === 'admin' || user?.role === 'faculty';
  if (!note.isPublished && !isStaff) {
    throw new ApiError(404, 'Bare Act Decoding Note not found.');
  }

  const filePath = note.pdfFile?.path;
  if (!filePath || !fs.existsSync(filePath)) {
    throw new ApiError(404, 'PDF file not found on disk.');
  }

  // Atomically increment download counter
  await BareActNote.findByIdAndUpdate(id, { $inc: { downloadCount: 1 } });

  const safeDownloadName = note.pdfFile.originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${safeDownloadName}"`);

  fs.createReadStream(filePath).pipe(res);
});

/**
 * 7. Stream thumbnail / cover image
 */
export const previewNoteThumbnail = catchAsync(async (req: Request, res: Response) => {
  const id = String(req.params.id || '');

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid ID.');
  }

  const note = await BareActNote.findById(id).select('thumbnail').lean();
  if (!note || !note.thumbnail || !fs.existsSync(note.thumbnail.path)) {
    return res.status(404).json({ success: false, message: 'No thumbnail available.' });
  }

  res.setHeader('Content-Type', note.thumbnail.mimeType || 'image/jpeg');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  fs.createReadStream(note.thumbnail.path).pipe(res);
});

/**
 * 8. Admin Management Queue with Live 5 KPIs
 */
export const getAllNotesAdmin = catchAsync(async (req: Request, res: Response) => {
  const {
    category,
    actName,
    status = 'all',
    search,
    sort = 'newest',
    page = '1',
    limit = '10',
  } = req.query;

  const filter: Record<string, any> = {};

  if (status === 'published') filter.isPublished = true;
  else if (status === 'draft') filter.isPublished = false;

  if (category && category !== 'all') {
    filter.category = new RegExp(`^${String(category).trim()}$`, 'i');
  }

  if (actName && actName !== 'all') {
    filter.actName = new RegExp(String(actName).trim(), 'i');
  }

  if (search) {
    const searchRegex = new RegExp(String(search).trim(), 'i');
    filter.$or = [
      { title: searchRegex },
      { actName: searchRegex },
      { sectionsCovered: searchRegex },
      { chapter: searchRegex },
      { description: searchRegex },
      { author: searchRegex },
      { tags: searchRegex },
    ];
  }

  let sortOption: Record<string, any> = { createdAt: -1 };
  if (sort === 'oldest') sortOption = { createdAt: 1 };
  else if (sort === 'popular') sortOption = { downloadCount: -1 };
  else if (sort === 'act_asc') sortOption = { actName: 1, actYear: -1 };
  else if (sort === 'act_desc') sortOption = { actName: -1, actYear: -1 };

  const pageNum = Math.max(parseInt(String(page), 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(String(limit), 10) || 10, 1), 50);
  const skip = (pageNum - 1) * limitNum;

  const [total, notes, statsAgg, totalNotes, publishedCount, draftCount, distinctActs] = await Promise.all([
    BareActNote.countDocuments(filter),
    BareActNote.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum)
      .populate('uploadedBy', 'name email rollNo')
      .populate('lastEditedBy', 'name email')
      .lean(),
    BareActNote.aggregate([
      {
        $group: {
          _id: null,
          totalDownloads: { $sum: '$downloadCount' },
          totalViews: { $sum: '$viewCount' },
        },
      },
    ]),
    BareActNote.countDocuments({}),
    BareActNote.countDocuments({ isPublished: true }),
    BareActNote.countDocuments({ isPublished: false }),
    BareActNote.distinct('actName'),
  ]);

  const totalDownloads = statsAgg[0]?.totalDownloads || 0;
  const totalViews = statsAgg[0]?.totalViews || 0;
  const uniqueActs = distinctActs.filter(Boolean).length;
  const totalPages = Math.ceil(total / limitNum) || 1;

  res.status(200).json({
    success: true,
    stats: {
      totalNotes,
      publishedCount,
      draftCount,
      totalDownloads,
      totalViews,
      uniqueActs,
    },
    total,
    totalPages,
    page: pageNum,
    notes,
  });
});

/**
 * 9. Upload new Bare Act Decoding Note (Admin / Faculty)
 */
export const createNote = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  if (!user) {
    throw new ApiError(401, 'Authentication required.');
  }

  const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
  const pdfFileItem = files?.pdf?.[0];
  const thumbFileItem = files?.thumbnail?.[0];

  if (!pdfFileItem) {
    throw new ApiError(400, 'Statutory PDF document is required.');
  }

  const {
    actName,
    actYear,
    actNumber,
    category,
    chapter,
    sectionsCovered,
    title,
    description,
    highlights,
    sectionBreakdown,
    difficulty,
    author,
    tags,
    relatedJudgements,
    isPublished,
    isFeatured,
    pageCount,
  } = req.body;

  if (!actName || !actYear || !category || !sectionsCovered || !title || !description) {
    throw new ApiError(
      400,
      'Missing required fields: actName, actYear, category, sectionsCovered, title, and description are required.'
    );
  }

  const parsedActYear = parseInt(String(actYear), 10);
  if (Number.isNaN(parsedActYear) || parsedActYear < 1800 || parsedActYear > 2035) {
    throw new ApiError(400, 'Invalid year. Must be between 1800 and 2035.');
  }

  const parsedHighlights = Array.isArray(highlights) ? highlights : safeJsonParse<string[]>(highlights, []);
  const parsedBreakdown = Array.isArray(sectionBreakdown)
    ? sectionBreakdown
    : safeJsonParse<any[]>(sectionBreakdown, []);
  const parsedTags = Array.isArray(tags) ? tags : safeJsonParse<string[]>(tags, []);
  const parsedJudgements = Array.isArray(relatedJudgements)
    ? relatedJudgements
    : safeJsonParse<string[]>(relatedJudgements, []);

  const sizeFormatted = formatFileSize(pdfFileItem.size);

  const pdfMetadata = {
    filename: pdfFileItem.filename,
    originalName: pdfFileItem.originalname,
    path: pdfFileItem.path,
    mimeType: pdfFileItem.mimetype || 'application/pdf',
    sizeBytes: pdfFileItem.size,
    sizeFormatted,
    pageCount: parseInt(String(pageCount), 10) || 0,
  };

  let thumbMetadata;
  if (thumbFileItem) {
    thumbMetadata = {
      filename: thumbFileItem.filename,
      originalName: thumbFileItem.originalname,
      path: thumbFileItem.path,
      mimeType: thumbFileItem.mimetype || 'image/jpeg',
      sizeBytes: thumbFileItem.size,
    };
  }

  const note = await BareActNote.create({
    actName: String(actName).trim(),
    actYear: parsedActYear,
    actNumber: actNumber ? String(actNumber).trim() : '',
    category: String(category).trim(),
    chapter: chapter ? String(chapter).trim() : '',
    sectionsCovered: String(sectionsCovered).trim(),
    title: String(title).trim(),
    description: String(description).trim(),
    highlights: parsedHighlights.filter((h) => typeof h === 'string' && h.trim().length > 0),
    sectionBreakdown: parsedBreakdown,
    difficulty: difficulty || 'Mains Analytical',
    author: author ? String(author).trim() : 'Adv. Rajinder Sir & Judicial Faculty',
    tags: parsedTags.filter((t) => typeof t === 'string' && t.trim().length > 0),
    relatedJudgements: parsedJudgements.filter((j) => mongoose.Types.ObjectId.isValid(j)),
    pdfFile: pdfMetadata,
    thumbnail: thumbMetadata,
    isPublished: isPublished === 'true' || isPublished === true,
    isFeatured: isFeatured === 'true' || isFeatured === true,
    uploadedBy: user._id,
  });

  res.status(201).json({
    success: true,
    message: 'Bare Act Decoding Note published to Statutory Knowledge Vault.',
    note,
  });
});

/**
 * 10. Update Bare Act Note Metadata (Admin / Faculty)
 */
export const updateNote = catchAsync(async (req: Request, res: Response) => {
  const id = String(req.params.id || '');
  const user = req.user;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid Bare Act Note ID.');
  }

  const note = await BareActNote.findById(id);
  if (!note) {
    throw new ApiError(404, 'Bare Act Decoding Note not found.');
  }

  const {
    actName,
    actYear,
    actNumber,
    category,
    chapter,
    sectionsCovered,
    title,
    description,
    highlights,
    sectionBreakdown,
    difficulty,
    author,
    tags,
    relatedJudgements,
    isPublished,
    isFeatured,
    pageCount,
  } = req.body;

  if (actName !== undefined) note.actName = String(actName).trim();
  if (actYear !== undefined) {
    const yr = parseInt(String(actYear), 10);
    if (!Number.isNaN(yr)) note.actYear = yr;
  }
  if (actNumber !== undefined) note.actNumber = String(actNumber).trim();
  if (category !== undefined) note.category = String(category).trim() as any;
  if (chapter !== undefined) note.chapter = String(chapter).trim();
  if (sectionsCovered !== undefined) note.sectionsCovered = String(sectionsCovered).trim();
  if (title !== undefined) note.title = String(title).trim();
  if (description !== undefined) note.description = String(description).trim();
  if (difficulty !== undefined) note.difficulty = String(difficulty).trim() as any;
  if (author !== undefined) note.author = String(author).trim();

  if (highlights !== undefined) {
    const hl = Array.isArray(highlights) ? highlights : safeJsonParse<string[]>(highlights, []);
    note.highlights = hl.filter((h) => typeof h === 'string' && h.trim().length > 0);
  }

  if (sectionBreakdown !== undefined) {
    note.sectionBreakdown = Array.isArray(sectionBreakdown)
      ? sectionBreakdown
      : safeJsonParse<any[]>(sectionBreakdown, []);
  }

  if (tags !== undefined) {
    const tg = Array.isArray(tags) ? tags : safeJsonParse<string[]>(tags, []);
    note.tags = tg.filter((t) => typeof t === 'string' && t.trim().length > 0);
  }

  if (relatedJudgements !== undefined) {
    const rj = Array.isArray(relatedJudgements)
      ? relatedJudgements
      : safeJsonParse<string[]>(relatedJudgements, []);
    note.relatedJudgements = rj.filter((j) => mongoose.Types.ObjectId.isValid(j)) as any;
  }

  if (isPublished !== undefined) {
    const pub = isPublished === 'true' || isPublished === true;
    if (pub && !note.isPublished) note.publishedAt = new Date();
    note.isPublished = pub;
  }

  if (isFeatured !== undefined) {
    note.isFeatured = isFeatured === 'true' || isFeatured === true;
  }

  if (pageCount !== undefined && note.pdfFile) {
    note.pdfFile.pageCount = parseInt(String(pageCount), 10) || note.pdfFile.pageCount;
  }

  if (user?._id) {
    note.lastEditedBy = user._id;
  }

  await note.save();

  res.status(200).json({
    success: true,
    message: 'Bare Act Decoding Note updated successfully.',
    note,
  });
});

/**
 * 11. Replace PDF file for an existing note
 */
export const replaceNotePdf = catchAsync(async (req: Request, res: Response) => {
  const id = String(req.params.id || '');
  const user = req.user;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid Bare Act Note ID.');
  }

  const note = await BareActNote.findById(id);
  if (!note) {
    throw new ApiError(404, 'Bare Act Decoding Note not found.');
  }

  if (!req.file) {
    throw new ApiError(400, 'New PDF file is required.');
  }

  // Delete old physical file if exists
  if (note.pdfFile?.path && fs.existsSync(note.pdfFile.path)) {
    try {
      fs.unlinkSync(note.pdfFile.path);
    } catch (err) {
      console.warn('Could not unlink old PDF file:', err);
    }
  }

  const sizeFormatted = formatFileSize(req.file.size);
  note.pdfFile = {
    filename: req.file.filename,
    originalName: req.file.originalname,
    path: req.file.path,
    mimeType: req.file.mimetype || 'application/pdf',
    sizeBytes: req.file.size,
    sizeFormatted,
    pageCount: note.pdfFile?.pageCount || 0,
  };

  if (user?._id) {
    note.lastEditedBy = user._id;
  }

  await note.save();

  res.status(200).json({
    success: true,
    message: 'PDF document replaced successfully.',
    note,
  });
});

/**
 * 12. Toggle Published status (1-click)
 */
export const togglePublish = catchAsync(async (req: Request, res: Response) => {
  const id = String(req.params.id || '');
  const user = req.user;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid Bare Act Note ID.');
  }

  const note = await BareActNote.findById(id);
  if (!note) {
    throw new ApiError(404, 'Bare Act Decoding Note not found.');
  }

  note.isPublished = !note.isPublished;
  if (note.isPublished) {
    note.publishedAt = new Date();
  }
  if (user?._id) {
    note.lastEditedBy = user._id;
  }

  await note.save();

  res.status(200).json({
    success: true,
    isPublished: note.isPublished,
    message: `Note is now ${note.isPublished ? 'Published' : 'saved as Draft'}.`,
    note,
  });
});

/**
 * 13. Delete Bare Act Note and remove physical files
 */
export const deleteNote = catchAsync(async (req: Request, res: Response) => {
  const id = String(req.params.id || '');

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid Bare Act Note ID.');
  }

  const note = await BareActNote.findById(id);
  if (!note) {
    throw new ApiError(404, 'Bare Act Decoding Note not found.');
  }

  // Delete physical files
  if (note.pdfFile?.path && fs.existsSync(note.pdfFile.path)) {
    try {
      fs.unlinkSync(note.pdfFile.path);
    } catch (err) {
      console.warn('Could not unlink PDF file during delete:', err);
    }
  }

  if (note.thumbnail?.path && fs.existsSync(note.thumbnail.path)) {
    try {
      fs.unlinkSync(note.thumbnail.path);
    } catch (err) {
      console.warn('Could not unlink thumbnail file during delete:', err);
    }
  }

  await BareActNote.findByIdAndDelete(id);

  res.status(200).json({
    success: true,
    message: 'Bare Act Decoding Note permanently deleted from Knowledge Vault.',
  });
});

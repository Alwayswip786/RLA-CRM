import type { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import PyqPaper from '../models/pyqPaper.model.js';
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
 * 1. Get published PYQs for Student Library (with faceted filtering, search & sorting)
 */
export const getPublishedPyqs = catchAsync(async (req: Request, res: Response) => {
  const {
    exam,
    year,
    stage,
    subject,
    search,
    featured,
    sort = 'year_desc',
    page = '1',
    limit = '9',
  } = req.query;

  const filter: Record<string, any> = { isPublished: true };

  if (exam && exam !== 'all') {
    filter.exam = new RegExp(String(exam).trim(), 'i');
  }

  if (year && year !== 'all') {
    const parsedYear = parseInt(String(year), 10);
    if (!Number.isNaN(parsedYear)) {
      filter.year = parsedYear;
    }
  }

  if (stage && stage !== 'all') {
    filter.stage = new RegExp(`^${String(stage).trim()}$`, 'i');
  }

  if (subject && subject !== 'all') {
    filter.subject = new RegExp(String(subject).trim(), 'i');
  }

  if (featured === 'true') {
    filter.isFeatured = true;
  }

  if (search) {
    const searchRegex = new RegExp(String(search).trim(), 'i');
    filter.$or = [
      { title: searchRegex },
      { subject: searchRegex },
      { exam: searchRegex },
      { topics: searchRegex },
      { description: searchRegex },
    ];
  }

  // Sorting Strategy
  let sortOption: Record<string, any> = { year: -1, createdAt: -1 };
  if (sort === 'year_asc') {
    sortOption = { year: 1, createdAt: -1 };
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

  const [total, pyqs] = await Promise.all([
    PyqPaper.countDocuments(filter),
    PyqPaper.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum)
      .select('-__v')
      .lean(),
  ]);

  res.status(200).json({
    success: true,
    count: pyqs.length,
    total,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum) || 1,
    pyqs,
  });
});

/**
 * 2. Get distinct filter options (exams, years, stages, subjects) dynamically
 */
export const getFilterMeta = catchAsync(async (_req: Request, res: Response) => {
  const [exams, years, stages, subjects] = await Promise.all([
    PyqPaper.distinct('exam', { isPublished: true }),
    PyqPaper.distinct('year', { isPublished: true }),
    PyqPaper.distinct('stage', { isPublished: true }),
    PyqPaper.distinct('subject', { isPublished: true }),
  ]);

  res.status(200).json({
    success: true,
    meta: {
      exams: exams.sort(),
      years: years.sort((a, b) => b - a),
      stages: stages.sort(),
      subjects: subjects.sort(),
    },
  });
});

/**
 * 3. Get single PYQ by ID with related papers
 */
export const getPyqById = catchAsync(async (req: Request, res: Response) => {
  const id = String(req.params.id || '');
  const user = req.user;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid PYQ paper ID format.');
  }

  const pyq = await PyqPaper.findById(id).lean();
  if (!pyq) {
    throw new ApiError(404, 'Solved PYQ paper not found.');
  }

  // RBAC Access: non-staff cannot view unpublished drafts
  const isStaff = user?.role === 'admin' || user?.role === 'faculty';
  if (!pyq.isPublished && !isStaff) {
    throw new ApiError(404, 'Solved PYQ paper not found.');
  }

  // Increment view counter asynchronously
  void PyqPaper.findByIdAndUpdate(id, { $inc: { viewCount: 1 } });

  // Fetch up to 3 related papers (same exam or subject)
  const related = await PyqPaper.find({
    _id: { $ne: pyq._id },
    isPublished: true,
    $or: [{ exam: pyq.exam }, { subject: pyq.subject }],
  })
    .sort({ year: -1 })
    .limit(3)
    .select('title exam year stage subject totalMarks pdfFile.sizeFormatted downloadCount')
    .lean();

  res.status(200).json({
    success: true,
    pyq,
    related,
  });
});

/**
 * 4. Stream PDF for In-App Viewer (Supports HTTP 206 Partial Content Range Requests)
 */
export const previewPyqPdf = catchAsync(async (req: Request, res: Response) => {
  const id = String(req.params.id || '');
  const user = req.user;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid PYQ paper ID.');
  }

  const pyq = await PyqPaper.findById(id).lean();
  if (!pyq) {
    throw new ApiError(404, 'PYQ paper not found.');
  }

  const isStaff = user?.role === 'admin' || user?.role === 'faculty';
  if (!pyq.isPublished && !isStaff) {
    throw new ApiError(404, 'PYQ paper not found.');
  }

  const filePath = pyq.pdfFile.path;
  if (!fs.existsSync(filePath)) {
    throw new ApiError(404, 'PDF document file is missing from server storage.');
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  // Set standard security and inline view headers
  const safeOriginalName = pyq.pdfFile.originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${safeOriginalName}"`);
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Support HTTP 206 Partial Content range requests for fast page streaming
  if (range && typeof range === 'string') {
    const parts = range.replace(/bytes=/, '').split('-');
    const rawStart = parts[0] || '0';
    const rawEnd = parts[1];
    const start = parseInt(rawStart, 10);
    const end = rawEnd ? parseInt(rawEnd, 10) : fileSize - 1;

    if (start >= fileSize || end >= fileSize) {
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
 * 5. Download PDF and atomically increment download count
 */
export const downloadPyqPdf = catchAsync(async (req: Request, res: Response) => {
  const id = String(req.params.id || '');
  const user = req.user;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid PYQ paper ID.');
  }

  const pyq = await PyqPaper.findById(id);
  if (!pyq) {
    throw new ApiError(404, 'PYQ paper not found.');
  }

  const isStaff = user?.role === 'admin' || user?.role === 'faculty';
  if (!pyq.isPublished && !isStaff) {
    throw new ApiError(404, 'PYQ paper not found.');
  }

  const filePath = pyq.pdfFile.path;
  if (!fs.existsSync(filePath)) {
    throw new ApiError(404, 'PDF file not found on disk.');
  }

  // Increment download counter
  pyq.downloadCount += 1;
  await pyq.save();

  const safeDownloadName = pyq.pdfFile.originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${safeDownloadName}"`);

  fs.createReadStream(filePath).pipe(res);
});

/**
 * 6. Stream thumbnail / cover image
 */
export const previewPyqThumbnail = catchAsync(async (req: Request, res: Response) => {
  const id = String(req.params.id || '');

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid ID.');
  }

  const pyq = await PyqPaper.findById(id).select('thumbnail').lean();
  if (!pyq || !pyq.thumbnail || !fs.existsSync(pyq.thumbnail.path)) {
    // Return transparent 1x1 or 404
    return res.status(404).json({ success: false, message: 'No thumbnail available.' });
  }

  res.setHeader('Content-Type', pyq.thumbnail.mimeType || 'image/jpeg');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  fs.createReadStream(pyq.thumbnail.path).pipe(res);
});

/**
 * 7. Admin: Get all PYQs with comprehensive KPI statistics
 */
export const getAllPyqsAdmin = catchAsync(async (req: Request, res: Response) => {
  const {
    exam,
    year,
    stage,
    status,
    search,
    sort = 'newest',
    page = '1',
    limit = '15',
  } = req.query;

  const filter: Record<string, any> = {};

  if (exam && exam !== 'all') {
    filter.exam = new RegExp(String(exam).trim(), 'i');
  }

  if (year && year !== 'all') {
    const parsedYear = parseInt(String(year), 10);
    if (!Number.isNaN(parsedYear)) {
      filter.year = parsedYear;
    }
  }

  if (stage && stage !== 'all') {
    filter.stage = new RegExp(`^${String(stage).trim()}$`, 'i');
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
      { subject: searchRegex },
      { exam: searchRegex },
      { paperCode: searchRegex },
      { topics: searchRegex },
    ];
  }

  let sortOption: Record<string, any> = { createdAt: -1 };
  if (sort === 'year_desc') sortOption = { year: -1, createdAt: -1 };
  if (sort === 'year_asc') sortOption = { year: 1, createdAt: -1 };
  if (sort === 'popular') sortOption = { downloadCount: -1 };
  if (sort === 'title_asc') sortOption = { title: 1 };

  const pageNum = Math.max(parseInt(String(page), 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(String(limit), 10) || 15, 1), 100);
  const skip = (pageNum - 1) * limitNum;

  const [total, pyqs, totalAll, publishedCount, draftCount, downloadAggregation] = await Promise.all([
    PyqPaper.countDocuments(filter),
    PyqPaper.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum)
      .populate('uploadedBy', 'name email role')
      .lean(),
    PyqPaper.countDocuments(),
    PyqPaper.countDocuments({ isPublished: true }),
    PyqPaper.countDocuments({ isPublished: false }),
    PyqPaper.aggregate([
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
    totalPapers: totalAll,
    publishedCount,
    draftCount,
    totalDownloads: downloadAggregation[0]?.totalDownloads || 0,
    totalViews: downloadAggregation[0]?.totalViews || 0,
  };

  res.status(200).json({
    success: true,
    stats,
    count: pyqs.length,
    total,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum) || 1,
    pyqs,
  });
});

/**
 * 8. Admin: Upload new Solved PYQ PDF with metadata (multipart/form-data)
 */
export const createPyq = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  if (!user) throw new ApiError(401, 'Unauthorized');

  const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
  const pdfFile = files?.pdf?.[0];
  const thumbnailFile = files?.thumbnail?.[0];

  if (!pdfFile) {
    throw new ApiError(400, 'Solved Question Paper PDF file is required.');
  }

  const {
    title,
    exam,
    year,
    stage,
    subject,
    paperCode,
    totalMarks,
    durationMinutes,
    description,
    topics,
    solvedByFaculty,
    isPublished,
    isFeatured,
  } = req.body;

  if (!title || !title.trim()) {
    throw new ApiError(400, 'Paper title is required.');
  }
  if (!exam || !exam.trim()) {
    throw new ApiError(400, 'Judicial exam category is required.');
  }
  if (!year) {
    throw new ApiError(400, 'Examination year is required.');
  }
  if (!subject || !subject.trim()) {
    throw new ApiError(400, 'Subject is required.');
  }

  // Parse topics
  let parsedTopics: string[] = [];
  if (Array.isArray(topics)) {
    parsedTopics = topics.map((t) => String(t).trim()).filter(Boolean);
  } else if (typeof topics === 'string' && topics.trim()) {
    parsedTopics = topics.split(',').map((t) => t.trim()).filter(Boolean);
  }

  const sizeBytes = pdfFile.size;
  const sizeFormatted = formatFileSize(sizeBytes);

  const newPaper = await PyqPaper.create({
    title: title.trim(),
    exam: exam.trim(),
    year: parseInt(String(year), 10),
    stage: stage || 'Mains',
    subject: subject.trim(),
    paperCode: paperCode?.trim() || undefined,
    totalMarks: totalMarks ? parseInt(String(totalMarks), 10) : 200,
    durationMinutes: durationMinutes ? parseInt(String(durationMinutes), 10) : 180,
    description: description?.trim() || '',
    topics: parsedTopics,
    solvedByFaculty: solvedByFaculty?.trim() || 'Adv. Rajinder Sir & Faculty Board',
    modelAnswersIncluded: true,
    solutionsProvided: true,
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
    message: 'Solved PYQ paper uploaded successfully.',
    pyq: newPaper,
  });
});

/**
 * 9. Admin: Update PYQ metadata
 */
export const updatePyqMetadata = catchAsync(async (req: Request, res: Response) => {
  const id = String(req.params.id || '');
  const user = req.user;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid PYQ paper ID.');
  }

  const paper = await PyqPaper.findById(id);
  if (!paper) {
    throw new ApiError(404, 'PYQ paper not found.');
  }

  const {
    title,
    exam,
    year,
    stage,
    subject,
    paperCode,
    totalMarks,
    durationMinutes,
    description,
    topics,
    solvedByFaculty,
    isFeatured,
  } = req.body;

  if (title) paper.title = title.trim();
  if (exam) paper.exam = exam.trim();
  if (year) paper.year = parseInt(String(year), 10);
  if (stage) paper.stage = stage;
  if (subject) paper.subject = subject.trim();
  if (paperCode !== undefined) paper.paperCode = paperCode.trim();
  if (totalMarks !== undefined) paper.totalMarks = parseInt(String(totalMarks), 10);
  if (durationMinutes !== undefined) paper.durationMinutes = parseInt(String(durationMinutes), 10);
  if (description !== undefined) paper.description = description.trim();
  if (solvedByFaculty !== undefined) paper.solvedByFaculty = solvedByFaculty.trim();
  if (isFeatured !== undefined) paper.isFeatured = isFeatured === true || isFeatured === 'true';

  if (topics !== undefined) {
    if (Array.isArray(topics)) {
      paper.topics = topics.map((t) => String(t).trim()).filter(Boolean);
    } else if (typeof topics === 'string') {
      paper.topics = topics.split(',').map((t) => t.trim()).filter(Boolean);
    }
  }

  paper.lastEditedBy = user?._id;
  await paper.save();

  res.status(200).json({
    success: true,
    message: 'PYQ paper metadata updated successfully.',
    pyq: paper,
  });
});

/**
 * 10. Admin: Replace existing PDF file with a revised solution script
 */
export const replacePyqFile = catchAsync(async (req: Request, res: Response) => {
  const id = String(req.params.id || '');
  const user = req.user;
  const newPdf = req.file;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid PYQ paper ID.');
  }

  if (!newPdf) {
    throw new ApiError(400, 'New PDF file is required to replace existing file.');
  }

  const paper = await PyqPaper.findById(id);
  if (!paper) {
    // Delete newly uploaded file since target paper doesn't exist
    if (fs.existsSync(newPdf.path)) {
      await fs.promises.unlink(newPdf.path).catch(() => {});
    }
    throw new ApiError(404, 'PYQ paper not found.');
  }

  // Delete previous physical file safely
  const oldPath = paper.pdfFile.path;
  if (fs.existsSync(oldPath)) {
    await fs.promises.unlink(oldPath).catch((err) => {
      console.warn(`Failed to unlink old PDF: ${err.message}`);
    });
  }

  const sizeBytes = newPdf.size;
  paper.pdfFile = {
    filename: newPdf.filename,
    originalName: newPdf.originalname,
    path: newPdf.path,
    mimeType: newPdf.mimetype || 'application/pdf',
    sizeBytes,
    sizeFormatted: formatFileSize(sizeBytes),
  };
  paper.lastEditedBy = user?._id;

  await paper.save();

  res.status(200).json({
    success: true,
    message: 'PDF file replaced successfully.',
    pyq: paper,
  });
});

/**
 * 11. Admin: One-click publish / unpublish toggle
 */
export const togglePublishPyq = catchAsync(async (req: Request, res: Response) => {
  const id = String(req.params.id || '');

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid PYQ paper ID.');
  }

  const paper = await PyqPaper.findById(id);
  if (!paper) {
    throw new ApiError(404, 'PYQ paper not found.');
  }

  paper.isPublished = !paper.isPublished;
  if (paper.isPublished && !paper.publishedAt) {
    paper.publishedAt = new Date();
  }

  await paper.save();

  res.status(200).json({
    success: true,
    message: `Paper "${paper.title}" is now ${paper.isPublished ? 'PUBLISHED' : 'UNPUBLISHED (DRAFT)'}.`,
    isPublished: paper.isPublished,
    pyq: paper,
  });
});

/**
 * 12. Admin: Permanently delete PYQ record and clean up disk files
 */
export const deletePyq = catchAsync(async (req: Request, res: Response) => {
  const id = String(req.params.id || '');

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid PYQ paper ID.');
  }

  const paper = await PyqPaper.findById(id);
  if (!paper) {
    throw new ApiError(404, 'PYQ paper not found.');
  }

  // Cleanup PDF file
  if (paper.pdfFile?.path && fs.existsSync(paper.pdfFile.path)) {
    await fs.promises.unlink(paper.pdfFile.path).catch((err) => {
      console.warn(`Failed to unlink PDF: ${err.message}`);
    });
  }

  // Cleanup thumbnail file if exists
  if (paper.thumbnail?.path && fs.existsSync(paper.thumbnail.path)) {
    await fs.promises.unlink(paper.thumbnail.path).catch((err) => {
      console.warn(`Failed to unlink thumbnail: ${err.message}`);
    });
  }

  await PyqPaper.findByIdAndDelete(id);

  res.status(200).json({
    success: true,
    message: `PYQ paper "${paper.title}" and associated files deleted permanently.`,
  });
});

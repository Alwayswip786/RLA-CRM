import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import multer, { type FileFilterCallback } from 'multer';
import type { Request } from 'express';
import ApiError from '../utils/ApiError.js';

// Resolve project root uploads directory
const UPLOADS_BASE_DIR = path.resolve(process.cwd(), 'uploads');
const PYQ_BASE_DIR = path.join(UPLOADS_BASE_DIR, 'pyqs');
const PDFS_DIR = path.join(PYQ_BASE_DIR, 'pdfs');
const THUMBNAILS_DIR = path.join(PYQ_BASE_DIR, 'thumbnails');

// Landmark Judgement Digest Upload Directories
const JUDGEMENTS_BASE_DIR = path.join(UPLOADS_BASE_DIR, 'judgements');
const JUDGEMENTS_PDFS_DIR = path.join(JUDGEMENTS_BASE_DIR, 'pdfs');
const JUDGEMENTS_THUMBNAILS_DIR = path.join(JUDGEMENTS_BASE_DIR, 'thumbnails');

// Ensure all upload directories exist at initialization
[
  UPLOADS_BASE_DIR,
  PYQ_BASE_DIR,
  PDFS_DIR,
  THUMBNAILS_DIR,
  JUDGEMENTS_BASE_DIR,
  JUDGEMENTS_PDFS_DIR,
  JUDGEMENTS_THUMBNAILS_DIR,
].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/**
 * Custom Multer DiskStorage for PYQs
 */
const storage = multer.diskStorage({
  destination: (_req: Request, file: Express.Multer.File, cb) => {
    if (file.fieldname === 'pdf') {
      cb(null, PDFS_DIR);
    } else if (file.fieldname === 'thumbnail') {
      cb(null, THUMBNAILS_DIR);
    } else {
      cb(null, PYQ_BASE_DIR);
    }
  },
  filename: (_req: Request, file: Express.Multer.File, cb) => {
    const rawExt = path.extname(file.originalname).toLowerCase();
    const safeExt = rawExt === '.pdf' || rawExt === '.jpg' || rawExt === '.jpeg' || rawExt === '.png' || rawExt === '.webp'
      ? rawExt
      : '';

    const randomSuffix = crypto.randomBytes(8).toString('hex');
    const timestamp = Date.now();
    const prefix = file.fieldname === 'thumbnail' ? 'thumb' : 'pyq';
    cb(null, `${prefix}-${timestamp}-${randomSuffix}${safeExt}`);
  },
});

/**
 * Custom Multer DiskStorage for Landmark Judgements
 */
const judgementStorage = multer.diskStorage({
  destination: (_req: Request, file: Express.Multer.File, cb) => {
    if (file.fieldname === 'pdf') {
      cb(null, JUDGEMENTS_PDFS_DIR);
    } else if (file.fieldname === 'thumbnail') {
      cb(null, JUDGEMENTS_THUMBNAILS_DIR);
    } else {
      cb(null, JUDGEMENTS_BASE_DIR);
    }
  },
  filename: (_req: Request, file: Express.Multer.File, cb) => {
    const rawExt = path.extname(file.originalname).toLowerCase();
    const safeExt = rawExt === '.pdf' || rawExt === '.jpg' || rawExt === '.jpeg' || rawExt === '.png' || rawExt === '.webp'
      ? rawExt
      : '';

    const randomSuffix = crypto.randomBytes(8).toString('hex');
    const timestamp = Date.now();
    const prefix = file.fieldname === 'thumbnail' ? 'j-thumb' : 'judgement';
    cb(null, `${prefix}-${timestamp}-${randomSuffix}${safeExt}`);
  },
});

/**
 * Strict MIME Type and Extension Validator
 */
const fileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  const allowedPdfMime = ['application/pdf'];
  const allowedThumbMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

  if (file.fieldname === 'pdf') {
    if (allowedPdfMime.includes(file.mimetype.toLowerCase())) {
      cb(null, true);
    } else {
      cb(new ApiError(400, 'Invalid file type. Only PDF documents (.pdf) are permitted.'));
    }
  } else if (file.fieldname === 'thumbnail') {
    if (allowedThumbMimes.includes(file.mimetype.toLowerCase())) {
      cb(null, true);
    } else {
      cb(new ApiError(400, 'Invalid thumbnail type. Only JPEG, PNG, or WebP images are allowed.'));
    }
  } else {
    cb(new ApiError(400, `Unexpected field name: ${file.fieldname}`));
  }
};

/**
 * Multer Instance with 50MB PDF and 5MB Thumbnail Limits (PYQ)
 */
export const pyqUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
    files: 2,
  },
});

export const uploadPyqFiles = pyqUpload.fields([
  { name: 'pdf', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 },
]);

export const uploadPdfOnly = pyqUpload.single('pdf');

/**
 * Multer Instance with 50MB PDF and 5MB Thumbnail Limits (Judgements)
 */
export const judgementUpload = multer({
  storage: judgementStorage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
    files: 2,
  },
});

export const uploadJudgementFiles = judgementUpload.fields([
  { name: 'pdf', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 },
]);

export const uploadJudgementPdfOnly = judgementUpload.single('pdf');

/**
 * Memory Storage Configuration for Direct Streaming to Cloudinary
 */
const memoryStorage = multer.memoryStorage();

const memoryImageFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/gif', 'image/svg+xml'];
  if (allowed.includes(file.mimetype.toLowerCase())) {
    cb(null, true);
  } else {
    cb(new ApiError(400, 'Invalid image type. Only JPEG, PNG, WebP, GIF, and SVG are allowed.'));
  }
};

const memoryPdfFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  if (file.mimetype.toLowerCase() === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new ApiError(400, 'Invalid document type. Only PDF files are allowed.'));
  }
};

export const uploadMemorySingleImage = multer({
  storage: memoryStorage,
  fileFilter: memoryImageFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
}).single('image');

export const uploadMemoryImages = multer({
  storage: memoryStorage,
  fileFilter: memoryImageFilter,
  limits: { fileSize: 10 * 1024 * 1024, files: 10 },
}).array('images', 10);

export const uploadMemoryPdf = multer({
  storage: memoryStorage,
  fileFilter: memoryPdfFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
}).single('pdf');

export const uploadMemoryFiles = multer({
  storage: memoryStorage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024, files: 2 },
}).fields([
  { name: 'pdf', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 },
]);

export const uploadMediaFile = multer({
  storage: memoryStorage,
  limits: { fileSize: 50 * 1024 * 1024 },
}).single('file');

export {
  UPLOADS_BASE_DIR,
  PYQ_BASE_DIR,
  PDFS_DIR,
  THUMBNAILS_DIR,
  JUDGEMENTS_BASE_DIR,
  JUDGEMENTS_PDFS_DIR,
  JUDGEMENTS_THUMBNAILS_DIR,
};


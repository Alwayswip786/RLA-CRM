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

// Bare Act Decoding Notes Upload Directories
const BARE_ACTS_BASE_DIR = path.join(UPLOADS_BASE_DIR, 'bareacts');
const BARE_ACTS_PDFS_DIR = path.join(BARE_ACTS_BASE_DIR, 'pdfs');
const BARE_ACTS_THUMBNAILS_DIR = path.join(BARE_ACTS_BASE_DIR, 'thumbnails');

// Mains Answer Writing Upload Directories
const MAINS_BASE_DIR = path.join(UPLOADS_BASE_DIR, 'mains');
const MAINS_SUBMISSIONS_DIR = path.join(MAINS_BASE_DIR, 'submissions');
const MAINS_EVALUATIONS_DIR = path.join(MAINS_BASE_DIR, 'evaluations');
const MAINS_MODEL_ANSWERS_DIR = path.join(MAINS_BASE_DIR, 'model_answers');

// Ensure all upload directories exist at initialization
[
  UPLOADS_BASE_DIR,
  PYQ_BASE_DIR,
  PDFS_DIR,
  THUMBNAILS_DIR,
  JUDGEMENTS_BASE_DIR,
  JUDGEMENTS_PDFS_DIR,
  JUDGEMENTS_THUMBNAILS_DIR,
  BARE_ACTS_BASE_DIR,
  BARE_ACTS_PDFS_DIR,
  BARE_ACTS_THUMBNAILS_DIR,
  MAINS_BASE_DIR,
  MAINS_SUBMISSIONS_DIR,
  MAINS_EVALUATIONS_DIR,
  MAINS_MODEL_ANSWERS_DIR,
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
 * Custom Multer DiskStorage for Bare Act Decoding Notes
 */
const bareActStorage = multer.diskStorage({
  destination: (_req: Request, file: Express.Multer.File, cb) => {
    if (file.fieldname === 'pdf') {
      cb(null, BARE_ACTS_PDFS_DIR);
    } else if (file.fieldname === 'thumbnail') {
      cb(null, BARE_ACTS_THUMBNAILS_DIR);
    } else {
      cb(null, BARE_ACTS_BASE_DIR);
    }
  },
  filename: (_req: Request, file: Express.Multer.File, cb) => {
    const rawExt = path.extname(file.originalname).toLowerCase();
    const safeExt = rawExt === '.pdf' || rawExt === '.jpg' || rawExt === '.jpeg' || rawExt === '.png' || rawExt === '.webp'
      ? rawExt
      : '';

    const randomSuffix = crypto.randomBytes(8).toString('hex');
    const timestamp = Date.now();
    const prefix = file.fieldname === 'thumbnail' ? 'ba-thumb' : 'bareact';
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
 * Multer Instance with 60MB PDF and 5MB Thumbnail Limits (Bare Act Decoding Notes)
 */
export const bareActUpload = multer({
  storage: bareActStorage,
  fileFilter,
  limits: {
    fileSize: 60 * 1024 * 1024, // 60MB max file size
    files: 2,
  },
});

export const uploadBareActFiles = bareActUpload.fields([
  { name: 'pdf', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 },
]);

export const uploadBareActPdfOnly = bareActUpload.single('pdf');

/**
 * Custom Multer DiskStorage for Mains Answer Sheets (Student Submissions - PDF & Images)
 */
const mainsSubmissionStorage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb) => {
    cb(null, MAINS_SUBMISSIONS_DIR);
  },
  filename: (_req: Request, file: Express.Multer.File, cb) => {
    const rawExt = path.extname(file.originalname).toLowerCase();
    const safeExt =
      rawExt === '.pdf' ||
      rawExt === '.jpg' ||
      rawExt === '.jpeg' ||
      rawExt === '.png' ||
      rawExt === '.webp'
        ? rawExt
        : '.pdf';
    const timestamp = Date.now();
    const randomSuffix = crypto.randomBytes(6).toString('hex');
    const baseName = path
      .basename(file.originalname, rawExt)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 40);
    cb(null, `mains_sub_${baseName}_${timestamp}_${randomSuffix}${safeExt}`);
  },
});

const mainsSubmissionFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  const allowedMimes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/jpg',
  ];
  if (allowedMimes.includes(file.mimetype.toLowerCase())) {
    cb(null, true);
  } else {
    cb(
      new ApiError(
        400,
        'Invalid file type. Only PDF documents and image scans (JPEG, PNG, WebP) are accepted.'
      )
    );
  }
};

export const uploadMainsAnswerBundle = multer({
  storage: mainsSubmissionStorage,
  fileFilter: mainsSubmissionFilter,
  limits: {
    fileSize: 35 * 1024 * 1024, // 35MB per file
    files: 10,
  },
}).fields([
  { name: 'pdf', maxCount: 1 },
  { name: 'images', maxCount: 10 },
  { name: 'files', maxCount: 10 },
]);

export const uploadMainsAnswerPdf = multer({
  storage: mainsSubmissionStorage,
  fileFilter: mainsSubmissionFilter,
  limits: {
    fileSize: 35 * 1024 * 1024, // 35MB
    files: 1,
  },
}).single('pdf');

/**
 * Custom Multer DiskStorage for Faculty Evaluated Marked Copies
 */
const mainsEvaluationStorage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb) => {
    cb(null, MAINS_EVALUATIONS_DIR);
  },
  filename: (_req: Request, file: Express.Multer.File, cb) => {
    const rawExt = path.extname(file.originalname).toLowerCase();
    const safeExt = rawExt === '.pdf' ? rawExt : '.pdf';
    const timestamp = Date.now();
    const randomSuffix = crypto.randomBytes(6).toString('hex');
    const baseName = path
      .basename(file.originalname, rawExt)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 40);
    cb(null, `mains_eval_${baseName}_${timestamp}_${randomSuffix}${safeExt}`);
  },
});

export const uploadMainsEvaluatedPdf = multer({
  storage: mainsEvaluationStorage,
  fileFilter: (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    if (file.mimetype.toLowerCase() === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new ApiError(400, 'Invalid file type. Only PDF marked copies are accepted.'));
    }
  },
  limits: {
    fileSize: 35 * 1024 * 1024, // 35MB
    files: 1,
  },
}).single('pdf');

/**
 * Custom Multer DiskStorage for Admin Model Answers
 */
const mainsModelAnswerStorage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb) => {
    cb(null, MAINS_MODEL_ANSWERS_DIR);
  },
  filename: (_req: Request, file: Express.Multer.File, cb) => {
    const rawExt = path.extname(file.originalname).toLowerCase();
    const safeExt = rawExt === '.pdf' ? rawExt : '.pdf';
    const timestamp = Date.now();
    const randomSuffix = crypto.randomBytes(6).toString('hex');
    const baseName = path
      .basename(file.originalname, rawExt)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 40);
    cb(null, `mains_model_${baseName}_${timestamp}_${randomSuffix}${safeExt}`);
  },
});

export const uploadMainsModelAnswerPdf = multer({
  storage: mainsModelAnswerStorage,
  fileFilter: (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    if (file.mimetype.toLowerCase() === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new ApiError(400, 'Invalid file type. Only PDF documents are accepted for model answers.'));
    }
  },
  limits: {
    fileSize: 35 * 1024 * 1024, // 35MB
    files: 1,
  },
}).single('modelAnswerPdf');

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
  BARE_ACTS_BASE_DIR,
  BARE_ACTS_PDFS_DIR,
  BARE_ACTS_THUMBNAILS_DIR,
  MAINS_BASE_DIR,
  MAINS_SUBMISSIONS_DIR,
  MAINS_EVALUATIONS_DIR,
  MAINS_MODEL_ANSWERS_DIR,
};


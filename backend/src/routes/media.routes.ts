import { Router } from 'express';
import {
  getMediaLibrary,
  uploadDirectMedia,
  deleteMedia,
} from '../controllers/media.controller.js';
import { protect, restrictTo } from '../middlewares/auth.middleware.js';
import { uploadMediaFile } from '../middlewares/upload.middleware.js';

const router = Router();

router.use(protect);
router.use(restrictTo('admin', 'faculty'));

// 1. Search and list media assets in Cloudinary
router.get('/', getMediaLibrary);

// 2. Direct upload single media file to Cloudinary
router.post('/upload', uploadMediaFile, uploadDirectMedia);

// 3. Delete media asset by wildcard publicId path (e.g. DELETE /api/media/rla/pyqs/thumb-123)
router.delete('/*', restrictTo('admin'), deleteMedia);

export default router;

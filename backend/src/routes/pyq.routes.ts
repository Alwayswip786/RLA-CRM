import { Router } from 'express';
import {
  getPublishedPyqs,
  getFilterMeta,
  getPyqById,
  previewPyqPdf,
  downloadPyqPdf,
  previewPyqThumbnail,
  getAllPyqsAdmin,
  createPyq,
  updatePyqMetadata,
  replacePyqFile,
  togglePublishPyq,
  deletePyq,
} from '../controllers/pyq.controller.js';
import { protect, restrictTo } from '../middlewares/auth.middleware.js';
import { uploadPyqFiles, uploadPdfOnly } from '../middlewares/upload.middleware.js';

const router = Router();

// ============================================================================
// STUDENT & PUBLIC ENDPOINTS (Protected with JWT Auth)
// ============================================================================

// 1. Filter distinct metadata options (must be before :id)
router.get('/meta/filters', protect, getFilterMeta);

// 2. Admin management queue with stats (must be before :id)
router.get('/admin/all', protect, restrictTo('admin', 'faculty'), getAllPyqsAdmin);

// 3. List published PYQ papers
router.get('/', protect, getPublishedPyqs);

// 4. Preview PDF stream (Range requests supported)
router.get('/:id/preview', protect, previewPyqPdf);

// 5. Download solved PDF (increments download counter)
router.get('/:id/download', protect, downloadPyqPdf);

// 6. Preview cover thumbnail
router.get('/:id/thumbnail', previewPyqThumbnail);

// 7. Get single PYQ record details
router.get('/:id', protect, getPyqById);

// ============================================================================
// ADMIN & FACULTY OPERATIONS (Restricted to 'admin' | 'faculty')
// ============================================================================

// 8. Upload new solved paper with multipart files
router.post(
  '/',
  protect,
  restrictTo('admin', 'faculty'),
  uploadPyqFiles,
  createPyq
);

// 9. Update paper metadata
router.put(
  '/:id',
  protect,
  restrictTo('admin', 'faculty'),
  updatePyqMetadata
);

// 10. Replace existing PDF document
router.patch(
  '/:id/file',
  protect,
  restrictTo('admin', 'faculty'),
  uploadPdfOnly,
  replacePyqFile
);

// 11. One-click publish / unpublish toggle
router.patch(
  '/:id/publish',
  protect,
  restrictTo('admin', 'faculty'),
  togglePublishPyq
);

// 12. Delete paper record and physical files
router.delete(
  '/:id',
  protect,
  restrictTo('admin'),
  deletePyq
);

export default router;

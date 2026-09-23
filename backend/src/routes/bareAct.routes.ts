import { Router } from 'express';
import {
  getPublishedNotes,
  getFilterMeta,
  getFeaturedNote,
  getNoteById,
  previewNotePdf,
  downloadNotePdf,
  previewNoteThumbnail,
  getAllNotesAdmin,
  createNote,
  updateNote,
  replaceNotePdf,
  togglePublish,
  deleteNote,
} from '../controllers/bareAct.controller.js';
import { protect, restrictTo } from '../middlewares/auth.middleware.js';
import { uploadBareActFiles, uploadBareActPdfOnly } from '../middlewares/upload.middleware.js';

const router = Router();

// ============================================================================
// STUDENT & PUBLIC REPOSITORY ENDPOINTS (Protected with JWT Auth)
// ============================================================================

// 1. Dynamic distinct filter options (placed before :id route)
router.get('/meta/filters', protect, getFilterMeta);

// 2. Featured "Act of the Week" / Spotlight Decoding Note
router.get('/featured', protect, getFeaturedNote);

// 3. Admin management queue with 5 live KPI metrics (placed before :id route)
router.get('/admin/all', protect, restrictTo('admin', 'faculty'), getAllNotesAdmin);

// 4. List published bare act decoding notes with filtering, search & pagination
router.get('/', protect, getPublishedNotes);

// 5. In-App range-streamed PDF preview (supports HTTP 206 Partial Content)
router.get('/:id/preview', protect, previewNotePdf);

// 6. Download note PDF (atomically increments download count)
router.get('/:id/download', protect, downloadNotePdf);

// 7. Cover thumbnail preview
router.get('/:id/thumbnail', previewNoteThumbnail);

// 8. Get single bare act decoding note details by ID
router.get('/:id', protect, getNoteById);

// ============================================================================
// ADMIN & FACULTY OPERATIONS (Restricted to 'admin' | 'faculty')
// ============================================================================

// 9. Upload new Bare Act Decoding Note with PDF & thumbnail multipart files
router.post(
  '/',
  protect,
  restrictTo('admin', 'faculty'),
  uploadBareActFiles,
  createNote
);

// 10. Update note metadata
router.put(
  '/:id',
  protect,
  restrictTo('admin', 'faculty'),
  updateNote
);

// 11. Replace PDF document
router.patch(
  '/:id/file',
  protect,
  restrictTo('admin', 'faculty'),
  uploadBareActPdfOnly,
  replaceNotePdf
);

// 12. One-click publish / unpublish toggle
router.patch(
  '/:id/publish',
  protect,
  restrictTo('admin', 'faculty'),
  togglePublish
);

// 13. Delete note record & physical files (Super-admin only)
router.delete(
  '/:id',
  protect,
  restrictTo('admin'),
  deleteNote
);

export default router;

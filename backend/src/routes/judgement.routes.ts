import { Router } from 'express';
import {
  getPublishedJudgements,
  getFilterMeta,
  getFeaturedJudgement,
  getJudgementById,
  previewJudgementPdf,
  downloadJudgementPdf,
  previewJudgementThumbnail,
  getAllJudgementsAdmin,
  createJudgement,
  updateJudgement,
  replaceJudgementPdf,
  togglePublishJudgement,
  deleteJudgement,
} from '../controllers/judgement.controller.js';
import { protect, restrictTo } from '../middlewares/auth.middleware.js';
import { uploadJudgementFiles, uploadJudgementPdfOnly } from '../middlewares/upload.middleware.js';

const router = Router();

// ============================================================================
// STUDENT & PUBLIC REPOSITORY ENDPOINTS (Protected with JWT Auth)
// ============================================================================

// 1. Dynamic distinct filter options (placed before :id route)
router.get('/meta/filters', protect, getFilterMeta);

// 2. Featured "Judgement of the Day" / Landmark Spotlight
router.get('/featured', protect, getFeaturedJudgement);

// 3. Admin management queue with 4 live KPI metrics (placed before :id route)
router.get('/admin/all', protect, restrictTo('admin', 'faculty'), getAllJudgementsAdmin);

// 4. List published judgements with filtering, search & pagination
router.get('/', protect, getPublishedJudgements);

// 5. In-App range-streamed PDF preview (supports HTTP 206 Partial Content)
router.get('/:id/preview', protect, previewJudgementPdf);

// 6. Download judgement PDF (atomically increments download count)
router.get('/:id/download', protect, downloadJudgementPdf);

// 7. Cover thumbnail preview
router.get('/:id/thumbnail', previewJudgementThumbnail);

// 8. Get single judgement details by ID
router.get('/:id', protect, getJudgementById);

// ============================================================================
// ADMIN & FACULTY OPERATIONS (Restricted to 'admin' | 'faculty')
// ============================================================================

// 9. Upload new Landmark Judgement with PDF & thumbnail multipart files
router.post(
  '/',
  protect,
  restrictTo('admin', 'faculty'),
  uploadJudgementFiles,
  createJudgement
);

// 10. Update judgement metadata
router.put(
  '/:id',
  protect,
  restrictTo('admin', 'faculty'),
  updateJudgement
);

// 11. Replace PDF document
router.patch(
  '/:id/file',
  protect,
  restrictTo('admin', 'faculty'),
  uploadJudgementPdfOnly,
  replaceJudgementPdf
);

// 12. One-click publish / unpublish toggle
router.patch(
  '/:id/publish',
  protect,
  restrictTo('admin', 'faculty'),
  togglePublishJudgement
);

// 13. Delete judgement record & physical files (Super-admin only)
router.delete(
  '/:id',
  protect,
  restrictTo('admin'),
  deleteJudgement
);

export default router;

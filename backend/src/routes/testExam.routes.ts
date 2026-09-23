import { Router } from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import {
  getBareActCatalogue,
  getMockSeriesList,
  startTestSession,
  getActiveSession,
  updateSessionProgress,
  submitTestSession,
  getTestAutopsyReview,
  resetBareActProgress,
} from '../controllers/testExam.controller.js';

const router = Router();

// All exam engine endpoints require authenticated student session
router.use(protect);

// Catalog routes
router.get('/practice/bare-acts', getBareActCatalogue);
router.post('/practice/bare-acts/:actId/reset', resetBareActProgress);
router.get('/mock-series', getMockSeriesList);

// Test session lifecycle routes
router.post('/session/start', startTestSession);
router.get('/session/active', getActiveSession);
router.patch('/session/:sessionId/progress', updateSessionProgress);
router.post('/session/:sessionId/submit', submitTestSession);
router.get('/session/:sessionId/review', getTestAutopsyReview);

export default router;

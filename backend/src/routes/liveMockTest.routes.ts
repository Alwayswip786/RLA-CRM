import { Router } from 'express';
import {
  getLiveTestCatalog,
  startLiveTestSession,
  updateLiveAnswerProgress,
  heartbeatLiveSession,
  recordAntiCheatEvent,
  submitLiveTestSession,
  getLiveTestLeaderboard,
  getLiveTestHistory,
  getLiveTestAutopsyReview,
} from '../controllers/liveMockTest.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = Router();

// Protect all live test engine routes
router.use(protect);

// Student Catalog & Examination Room Routes
router.get('/catalog', getLiveTestCatalog);
router.get('/history', getLiveTestHistory);

router.post('/tests/:testId/start', startLiveTestSession);
router.get('/tests/:testId/leaderboard', getLiveTestLeaderboard);

router.patch('/attempts/:attemptId/answer', updateLiveAnswerProgress);
router.patch('/attempts/:attemptId/heartbeat', heartbeatLiveSession);
router.post('/attempts/:attemptId/event', recordAntiCheatEvent);
router.post('/attempts/:attemptId/submit', submitLiveTestSession);
router.get('/attempts/:attemptId/review', getLiveTestAutopsyReview);

export default router;

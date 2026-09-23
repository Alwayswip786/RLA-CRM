import { Router } from 'express';
import { protect, restrictTo } from '../middlewares/auth.middleware.js';
import {
  getDashboardOverview,
  quickEvaluateSubmission,
  quickReplyDoubt,
  broadcastNotice,
  startLiveStream,
  getBatchShiftsOverview,
  getSubmissionScorecard,
} from '../controllers/adminDashboard.controller.js';

const router = Router();

// Protect all admin dashboard routes (Admin & Faculty clearance)
router.use(protect);
router.use(restrictTo('admin', 'faculty'));

// 1. Unified Dashboard Aggregation
router.get('/overview', getDashboardOverview);
router.get('/batch-shifts', getBatchShiftsOverview);
router.get('/submission/:submissionId', getSubmissionScorecard);

// 2. Quick Operations from Dashboard
router.post('/quick-evaluate/:submissionId', quickEvaluateSubmission);
router.post('/quick-reply-doubt/:doubtId', quickReplyDoubt);
router.post('/broadcast-notice', broadcastNotice);
router.post('/start-live-stream/:classId', startLiveStream);

export default router;

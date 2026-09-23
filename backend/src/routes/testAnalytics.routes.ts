import { Router } from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import { getMyTestAnalytics, recordTestAttempt } from '../controllers/testAnalytics.controller.js';

const router = Router();

// Protect all test analytics routes
router.use(protect);

// GET /api/tests/analytics/my - Get student test attempts & latest score metrics
router.get('/my', getMyTestAnalytics);

// POST /api/tests/analytics/attempts - Record a new test attempt
router.post('/attempts', recordTestAttempt);

export default router;

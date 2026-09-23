import { Router } from 'express';
import {
  getAdminLiveTests,
  createAdminLiveTest,
  updateAdminLiveTest,
  togglePublishAdminLiveTest,
  freezeLeaderboardAdminLiveTest,
  getAdminLiveTestAttempts,
} from '../controllers/adminLiveTest.controller.js';
import { protect, restrictTo } from '../middlewares/auth.middleware.js';

const router = Router();

// Protect all admin live test routes
router.use(protect);
router.use(restrictTo('admin', 'faculty'));

router.get('/', getAdminLiveTests);
router.post('/', createAdminLiveTest);
router.put('/:id', updateAdminLiveTest);
router.post('/:id/publish', togglePublishAdminLiveTest);
router.post('/:id/freeze', freezeLeaderboardAdminLiveTest);
router.get('/:id/attempts', getAdminLiveTestAttempts);

export default router;

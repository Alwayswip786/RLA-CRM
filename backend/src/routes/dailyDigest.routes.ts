import { Router } from 'express';
import {
  getTodayDailyDigest,
  getDailyDigestArchive,
  getEditionByDateOrId,
  markItemAsRead,
  getStudentStreak,
  getAllEditionsAdmin,
  createEditionAdmin,
  getEditionAdmin,
  updateEditionAdmin,
  updateEditionStatusAdmin,
  deleteEditionAdmin,
} from '../controllers/dailyDigest.controller.js';
import { protect, restrictTo } from '../middlewares/auth.middleware.js';

const router = Router();

// ==========================================
// Student & Public Portal Endpoints
// ==========================================

// 1. Get today's featured edition (IST timezone) with personal bookmark & streak status
router.get('/today', protect, getTodayDailyDigest);

// 2. Paginated historical archive of previous daily digests
router.get('/archive', protect, getDailyDigestArchive);

// 3. Get student's current reading streak and stats
router.get('/streak', protect, getStudentStreak);

// 4. Mark an item as read to track completion & consistency streak
router.post('/read-item', protect, markItemAsRead);

// 5. Get single edition by Date ("YYYY-MM-DD") or ID
router.get('/edition/:dateOrId', protect, getEditionByDateOrId);

// ==========================================
// Admin & Faculty CMS Endpoints
// ==========================================

// 6. Admin: List all editions with 4 KPI metrics & filter options
router.get('/admin/all', protect, restrictTo('admin', 'faculty'), getAllEditionsAdmin);

// 7. Admin: Create new scheduled or published edition
router.post('/admin/editions', protect, restrictTo('admin', 'faculty'), createEditionAdmin);

// 8. Admin: Get single edition for editing
router.get('/admin/editions/:id', protect, restrictTo('admin', 'faculty'), getEditionAdmin);

// 9. Admin: Update edition metadata & items
router.put('/admin/editions/:id', protect, restrictTo('admin', 'faculty'), updateEditionAdmin);

// 10. Admin: Update status (draft, scheduled, published, archived)
router.patch('/admin/editions/:id/status', protect, restrictTo('admin', 'faculty'), updateEditionStatusAdmin);

// 11. Admin: Delete edition
router.delete('/admin/editions/:id', protect, restrictTo('admin', 'faculty'), deleteEditionAdmin);

export default router;

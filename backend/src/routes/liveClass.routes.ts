import { Router } from 'express';
import { protect, restrictTo } from '../middlewares/auth.middleware.js';
import {
  getCurrentLiveClass,
  getUpcomingClasses,
  getArchivedClasses,
  getArchivedClassDetails,
  joinLiveClass,
  leaveLiveClass,
  heartbeatLiveClass,
  toggleAlertReminder,
  reactToArchivedClass,
  getArchivedClassComments,
  addArchivedClassComment,
  updateArchivedClassProgress,
  adminGetAllClasses,
  adminScheduleClass,
  adminStartClass,
  adminEndClass,
  adminGetAttendance,
  handleZoomWebhook,
} from '../controllers/liveClass.controller.js';

const router = Router();

// ============================================================================
// Public / Webhook Routes
// ============================================================================
router.post('/webhooks/zoom', handleZoomWebhook);

// ============================================================================
// Student Protected Routes
// ============================================================================
router.use(protect);

router.get('/current', getCurrentLiveClass);
router.get('/upcoming', getUpcomingClasses);
router.get('/archives', getArchivedClasses);
router.get('/archives/:archiveId', getArchivedClassDetails);
router.post('/archives/:archiveId/react', reactToArchivedClass);
router.get('/archives/:archiveId/comments', getArchivedClassComments);
router.post('/archives/:archiveId/comments', addArchivedClassComment);
router.post('/archives/:archiveId/progress', updateArchivedClassProgress);

router.post('/:id/join', joinLiveClass);
router.post('/:id/leave', leaveLiveClass);
router.post('/:id/heartbeat', heartbeatLiveClass);
router.post('/:id/alert-toggle', toggleAlertReminder);

// ============================================================================
// Admin & Faculty Protected Routes
// ============================================================================
router.use(restrictTo('admin', 'faculty'));

router.get('/admin/all', adminGetAllClasses);
router.post('/admin/schedule', adminScheduleClass);
router.post('/admin/:id/start', adminStartClass);
router.post('/admin/:id/end', adminEndClass);
router.get('/admin/:id/attendance', adminGetAttendance);

export default router;

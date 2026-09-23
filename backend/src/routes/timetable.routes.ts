import { Router } from 'express';
import {
  getMySchedule,
  switchActiveShift,
  toggleClassAlert,
  getUpcomingClass,
  exportIcalSchedule,
  getAllBatchesAdmin,
  createBatchAdmin,
  getAllRoomsAdmin,
  createRoomAdmin,
  getWeeklyGridAdmin,
  checkConflictsAdmin,
  createSlotAdmin,
  updateSlotAdmin,
  deleteSlotAdmin,
  createOverrideAdmin,
  deleteOverrideAdmin,
} from '../controllers/timetable.controller.js';
import { protect, restrictTo } from '../middlewares/auth.middleware.js';

const router = Router();

// ==========================================
// Student Timetable & Shift Endpoints
// ==========================================

// 1. Get resolved schedule for student's assigned batch and chosen day/shift
router.get('/my-schedule', protect, getMySchedule);

// 2. Switch student's preferred active shift
router.post('/switch-shift', protect, switchActiveShift);

// 3. Toggle class alert subscription
router.post('/alerts/toggle', protect, toggleClassAlert);

// 4. Get upcoming class today with live countdown
router.get('/upcoming', protect, getUpcomingClass);

// 5. Export weekly schedule as RFC-5545 iCalendar (.ics)
router.get('/export/ical', protect, exportIcalSchedule);

// ==========================================
// Admin & Faculty Timetable CMS Endpoints
// ==========================================

// 6. Manage Batches
router.get('/admin/batches', protect, restrictTo('admin', 'faculty'), getAllBatchesAdmin);
router.post('/admin/batches', protect, restrictTo('admin'), createBatchAdmin);

// 7. Manage Rooms & Chambers
router.get('/admin/rooms', protect, restrictTo('admin', 'faculty'), getAllRoomsAdmin);
router.post('/admin/rooms', protect, restrictTo('admin'), createRoomAdmin);

// 8. Weekly Matrix Grid View
router.get('/admin/grid', protect, restrictTo('admin', 'faculty'), getWeeklyGridAdmin);

// 9. Real-time Conflict Checker
router.post(
  '/admin/check-conflicts',
  protect,
  restrictTo('admin', 'faculty'),
  checkConflictsAdmin
);

// 10. Manage Recurring Weekly Slots
router.post('/admin/slots', protect, restrictTo('admin', 'faculty'), createSlotAdmin);
router.put('/admin/slots/:id', protect, restrictTo('admin', 'faculty'), updateSlotAdmin);
router.delete('/admin/slots/:id', protect, restrictTo('admin'), deleteSlotAdmin);

// 11. Manage Schedule Overrides (Reschedule, Cancel, Holiday)
router.post('/admin/overrides', protect, restrictTo('admin', 'faculty'), createOverrideAdmin);
router.delete('/admin/overrides/:id', protect, restrictTo('admin'), deleteOverrideAdmin);

export default router;

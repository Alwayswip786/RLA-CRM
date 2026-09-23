import { Router } from 'express';
import { protect, restrictTo } from '../middlewares/auth.middleware.js';
import {
  getAcademySummaryMetrics,
  getCourseMetricsSummary,
  getStudentRoster,
  getStudentDossier,
  revokeStudentDeviceSessions,
  getVideoTelemetryKpis,
  getVideoTelemetryLogs,
  exportStudentRosterCsv,
  exportVideoTelemetryCsv,
} from '../controllers/adminStudent.controller.js';

const router = Router();

// Protect all admin student routes (admin and faculty only)
router.use(protect);
router.use(restrictTo('admin', 'faculty'));

// 1. Academy-Level Summary KPIs
router.get('/metrics/summary', getAcademySummaryMetrics);

// 2. Course-Wise Metrics Summary (for cohort tabs and grouped view)
router.get('/metrics/courses', getCourseMetricsSummary);

// 3. Student Roster (Unified & Grouped)
router.get('/roster', getStudentRoster);

// 4. CSV Exports
router.get('/export/csv', exportStudentRosterCsv);
router.get('/video-telemetry/export/csv', exportVideoTelemetryCsv);

// 5. Video Telemetry KPIs & Logs
router.get('/video-telemetry/kpis', getVideoTelemetryKpis);
router.get('/video-telemetry/logs', getVideoTelemetryLogs);

// 6. Student Dossier & Session Management
router.get('/:id/dossier', getStudentDossier);
router.post('/:id/revoke-sessions', revokeStudentDeviceSessions);

export default router;

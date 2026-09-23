import { Router } from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import { getDashboardKpiMetrics } from '../controllers/dashboard.controller.js';

const router = Router();

// Protect all dashboard metrics routes
router.use(protect);

// GET /api/dashboard/kpi-metrics - Get student 4-card ribbon performance metrics
router.get('/kpi-metrics', getDashboardKpiMetrics);

export default router;

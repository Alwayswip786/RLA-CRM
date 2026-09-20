import { Router } from 'express';
import {
  getMyQueries,
  getQueryById,
  createDoubtQuery,
  addThreadReply,
  resolveDoubtQuery,
  getAllQueriesAdmin,
  assignFaculty,
  updateQueryStatus,
} from '../controllers/doubt.controller.js';
import { protect, restrictTo } from '../middlewares/auth.middleware.js';

const router = Router();

// All doubt routes require authentication
router.use(protect);

// 1. Student-Accessible Routes
router.get('/my-queries', getMyQueries);
router.post('/', createDoubtQuery);
router.get('/:id', getQueryById);
router.post('/:id/reply', addThreadReply);
router.patch('/:id/resolve', resolveDoubtQuery);

// 2. Admin / Faculty Management Routes
router.get('/admin/all', restrictTo('admin', 'faculty'), getAllQueriesAdmin);
router.patch('/admin/:id/assign', restrictTo('admin'), assignFaculty);
router.patch('/admin/:id/status', restrictTo('admin', 'faculty'), updateQueryStatus);

export default router;

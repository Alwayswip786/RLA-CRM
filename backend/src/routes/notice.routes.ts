import { Router } from 'express';
import {
  getNotices,
  getNoticeById,
  createNotice,
  updateNotice,
  deleteNotice,
} from '../controllers/notice.controller.js';
import { protect, restrictTo } from '../middlewares/auth.middleware.js';

const router = Router();

// Public / Student Routes
router.get('/', getNotices);
router.get('/:id', getNoticeById);

// Admin / Faculty Protected Management Routes
router.post('/', protect, restrictTo('admin', 'faculty'), createNotice);
router.patch('/:id', protect, restrictTo('admin', 'faculty'), updateNotice);
router.delete('/:id', protect, restrictTo('admin', 'faculty'), deleteNotice);

export default router;

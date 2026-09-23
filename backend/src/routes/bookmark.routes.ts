import { Router } from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import {
  getBookmarks,
  getBookmarkIds,
  toggleBookmark,
  updateAnnotation,
  deleteBookmark,
} from '../controllers/bookmark.controller.js';

const router = Router();

// All bookmark vault operations are strictly private to the authenticated user
router.use(protect);

router.route('/').get(getBookmarks);
router.route('/ids').get(getBookmarkIds);
router.route('/toggle').post(toggleBookmark);
router.route('/:id/annotation').put(updateAnnotation);
router.route('/:id').delete(deleteBookmark);

export default router;

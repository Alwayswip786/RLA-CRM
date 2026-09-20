import { Router } from 'express';
import {
  getMyConversations,
  initConversation,
  getConversationMessages,
  markConversationRead,
  getUnreadCounts,
} from '../controllers/chat.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = Router();

// All chat routes require authentication
router.use(protect);

router.get('/conversations', getMyConversations);
router.post('/init', initConversation);
router.get('/conversations/:id/messages', getConversationMessages);
router.post('/conversations/:id/read', markConversationRead);
router.get('/unread-counts', getUnreadCounts);

export default router;

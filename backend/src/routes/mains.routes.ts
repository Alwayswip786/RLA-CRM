import { Router } from 'express';
import { protect, restrictTo } from '../middlewares/auth.middleware.js';
import {
  uploadMainsAnswerBundle,
  uploadMainsEvaluatedPdf,
  uploadMainsModelAnswerPdf,
} from '../middlewares/upload.middleware.js';
import {
  getActiveQuestion,
  getChallengeArchive,
  getQuestionById,
  submitAnswerCopy,
  getMySubmissions,
  getSubmissionAutopsy,
  streamSubmissionPdf,
  getPendingSubmissionsAdmin,
  claimSubmissionAdmin,
  evaluateSubmissionAdmin,
  getGradedSubmissionsAdmin,
  getAllQuestionsAdmin,
  createQuestionAdmin,
  updateQuestionAdmin,
  deleteQuestionAdmin,
} from '../controllers/mains.controller.js';

const router = Router();

// All mains routes require authentication
router.use(protect);

// --- Student Endpoints ---
router.get('/questions/active', getActiveQuestion);
router.get('/questions/today', getActiveQuestion);
router.get('/questions/archive', getChallengeArchive);
router.get('/questions/:id', getQuestionById);

router.post('/submissions', uploadMainsAnswerBundle, submitAnswerCopy);
router.get('/submissions/my', getMySubmissions);
router.get('/submissions/:id/autopsy', getSubmissionAutopsy);
router.get('/submissions/:id/pdf', streamSubmissionPdf);
router.get('/submissions/:id/file', streamSubmissionPdf);

// --- Faculty & Admin Endpoints ---
router.get(
  '/admin/submissions/pending',
  restrictTo('admin', 'faculty'),
  getPendingSubmissionsAdmin
);
router.post(
  '/admin/submissions/:id/claim',
  restrictTo('admin', 'faculty'),
  claimSubmissionAdmin
);
router.post(
  '/admin/submissions/:id/evaluate',
  restrictTo('admin', 'faculty'),
  uploadMainsEvaluatedPdf,
  evaluateSubmissionAdmin
);
router.get(
  '/admin/submissions/graded',
  restrictTo('admin', 'faculty'),
  getGradedSubmissionsAdmin
);
router.get(
  '/admin/questions',
  restrictTo('admin', 'faculty'),
  getAllQuestionsAdmin
);
router.post(
  '/admin/questions',
  restrictTo('admin', 'faculty'),
  uploadMainsModelAnswerPdf,
  createQuestionAdmin
);
router.put(
  '/admin/questions/:id',
  restrictTo('admin', 'faculty'),
  uploadMainsModelAnswerPdf,
  updateQuestionAdmin
);
router.delete(
  '/admin/questions/:id',
  restrictTo('admin', 'faculty'),
  deleteQuestionAdmin
);

export default router;


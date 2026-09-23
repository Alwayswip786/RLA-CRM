import { Router } from 'express';
import { protect, restrictTo } from '../middlewares/auth.middleware.js';
import {
  getEnrolledCourses,
  getCourseDetails,
  getCourseLeaderboard,
  getLessonDetails,
  updateLessonProgress,
  recordVideoTelemetry,
  submitQuizAnswers,
  toggleLessonReaction,
  getLessonComments,
  addLessonComment,
  toggleCommentLike,
  toggleLessonBookmark,
  claimCourseCertificate,
  getAdminCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  addCourseModule,
  updateCourseModule,
  deleteCourseModule,
  addCourseLesson,
  updateCourseLesson,
  deleteCourseLesson,
  postCourseAnnouncement,
  scheduleLiveSession,
  getCourseAnalytics,
  enrollBatchToCourse,
  getAdminRecordings,
  addAdminRecording,
} from '../controllers/course.controller.js';

const router = Router();

// ============================================================================
// STUDENT COURSES & LMS ROUTES (Requires Authentication)
// ============================================================================
router.use(protect);

// 1. Enrolled Courses Hub
router.get('/enrolled', getEnrolledCourses);

// 2. Admin Course Management (Restricted to Admin / Faculty)
router.get('/admin/all', restrictTo('admin', 'faculty'), getAdminCourses);
router.post('/admin', restrictTo('admin', 'faculty'), createCourse);
router.put('/admin/:courseId', restrictTo('admin', 'faculty'), updateCourse);
router.delete('/admin/:courseId', restrictTo('admin', 'faculty'), deleteCourse);

// Admin Digital Recordings Vault
router.get('/admin/recordings', restrictTo('admin', 'faculty'), getAdminRecordings);
router.post('/admin/recordings', restrictTo('admin', 'faculty'), addAdminRecording);

// Admin Modules
router.post('/admin/:courseId/modules', restrictTo('admin', 'faculty'), addCourseModule);
router.put('/admin/:courseId/modules/:moduleId', restrictTo('admin', 'faculty'), updateCourseModule);
router.delete('/admin/:courseId/modules/:moduleId', restrictTo('admin', 'faculty'), deleteCourseModule);

// Admin Lessons
router.post('/admin/:courseId/modules/:moduleId/lessons', restrictTo('admin', 'faculty'), addCourseLesson);
router.put('/admin/:courseId/lessons/:lessonId', restrictTo('admin', 'faculty'), updateCourseLesson);
router.delete('/admin/:courseId/lessons/:lessonId', restrictTo('admin', 'faculty'), deleteCourseLesson);

// Admin Course Enhancements
router.post('/admin/:courseId/announcements', restrictTo('admin', 'faculty'), postCourseAnnouncement);
router.post('/admin/:courseId/live-sessions', restrictTo('admin', 'faculty'), scheduleLiveSession);
router.get('/admin/:courseId/analytics', restrictTo('admin', 'faculty'), getCourseAnalytics);
router.post('/admin/:courseId/enroll-batch', restrictTo('admin', 'faculty'), enrollBatchToCourse);

// 3. Course Details, Modules & Leaderboard
router.get('/:courseId', getCourseDetails);
router.get('/:courseId/leaderboard', getCourseLeaderboard);
router.post('/:courseId/claim-certificate', claimCourseCertificate);

// 4. Lesson Player & Interactive Actions
router.get('/:courseId/lessons/:lessonId', getLessonDetails);
router.post('/:courseId/lessons/:lessonId/progress', updateLessonProgress);
router.post('/:courseId/lessons/:lessonId/telemetry', recordVideoTelemetry);
router.post('/:courseId/lessons/:lessonId/quiz-submit', submitQuizAnswers);
router.post('/:courseId/lessons/:lessonId/reaction', toggleLessonReaction);
router.post('/:courseId/lessons/:lessonId/bookmark', toggleLessonBookmark);

// 5. Threaded Comments & Discussion
router.get('/:courseId/lessons/:lessonId/comments', getLessonComments);
router.post('/:courseId/lessons/:lessonId/comments', addLessonComment);
router.post('/:courseId/lessons/:lessonId/comments/:commentId/like', toggleCommentLike);

export default router;

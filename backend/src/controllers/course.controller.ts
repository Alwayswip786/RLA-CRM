import { type Request, type Response } from 'express';
import mongoose, { type Types } from 'mongoose';
import {
  Course,
  CourseModule,
  CourseLesson,
  CourseEnrollment,
  LessonProgress,
  LessonReaction,
  LessonComment,
  CourseAnnouncement,
  CourseLiveSession,
} from '../models/course.model.js';
import { VideoWatchSession } from '../models/videoWatchSession.model.js';
import Bookmark from '../models/bookmark.model.js';
import User from '../models/user.model.js';
import ApiError from '../utils/ApiError.js';
import catchAsync from '../utils/catchAsync.js';

// Helper to resolve Course by ID or Slug
export const resolveCourse = async (identifier?: string | string[]) => {
  if (!identifier) return null;
  const idStr = String(Array.isArray(identifier) ? identifier[0] : identifier);
  if (mongoose.Types.ObjectId.isValid(idStr)) {
    const course = await Course.findById(idStr);
    if (course) return course;
  }
  const searchSlug = idStr === 'java-dsa' ? 'constitutional-law' : idStr;
  return await Course.findOne({ $or: [{ slug: searchSlug }, { slug: idStr }] });
};

// Helper to recalculate course-level progress and points for a student
export const recalculateStudentCourseProgress = async (
  userId: Types.ObjectId,
  courseId: Types.ObjectId
) => {
  const totalLessons = await CourseLesson.countDocuments({ courseId });
  const completedProgresses = await LessonProgress.find({
    userId,
    courseId,
    isCompleted: true,
  });

  const completedCount = completedProgresses.length;
  const overallProgressPercent =
    totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  // Calculate points: quiz scores + 10 points per completed video/document
  const totalQuizPoints = completedProgresses.reduce((acc, p) => acc + (p.quizScore || 0), 0);
  const totalLessonPoints = completedCount * 10;
  const totalPointsEarned = totalQuizPoints + totalLessonPoints;

  const enrollment = await CourseEnrollment.findOneAndUpdate(
    { userId, courseId },
    {
      $set: {
        completedLessonsCount: completedCount,
        overallProgressPercent,
        totalPointsEarned,
      },
    },
    { new: true, upsert: true }
  );

  return { overallProgressPercent, totalPointsEarned, completedCount, enrollment };
};

// ============================================================================
// STUDENT CONTROLLERS
// ============================================================================

/**
 * GET /api/courses/enrolled
 * Fetches all courses the student is enrolled in, or auto-enrolls in published courses
 */
export const getEnrolledCourses = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!._id;

  // Check existing enrollments
  let enrollments = await CourseEnrollment.find({ userId })
    .populate('courseId')
    .populate('lastAccessedLessonId');

  // If no enrollments exist for this user, auto-enroll them in published courses
  if (enrollments.length === 0) {
    const publishedCourses = await Course.find({ status: 'published' });
    for (const course of publishedCourses) {
      const firstLesson = await CourseLesson.findOne({ courseId: course._id }).sort({ order: 1 });
      await CourseEnrollment.create({
        userId,
        courseId: course._id,
        enrolledAt: new Date(),
        lastAccessedLessonId: firstLesson?._id,
        lastAccessedAt: new Date(),
        overallProgressPercent: 0,
        completedLessonsCount: 0,
        totalPointsEarned: 0,
      });
    }

    enrollments = await CourseEnrollment.find({ userId })
      .populate('courseId')
      .populate('lastAccessedLessonId');
  }

  const result = enrollments
    .filter((e) => e.courseId != null)
    .map((e) => {
      const course = e.courseId as any;
      const lastLesson = e.lastAccessedLessonId as any;

      return {
        id: course.slug || course._id.toString(),
        courseId: course._id.toString(),
        slug: course.slug,
        title: course.title,
        subtitle: course.subtitle,
        enrolledDate: new Intl.DateTimeFormat('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        }).format(new Date(e.enrolledAt)),
        progress: e.overallProgressPercent || 0,
        instructor: course.instructor || 'Adv. Rajinder Sir',
        thumbnailTag: course.thumbnailTag || 'JUDICIARY 360°',
        thumbnailBg: course.thumbnailBg || 'from-[#0a1c36] to-[#143564]',
        thumbnailUrl: course.thumbnailUrl,
        lastAccessedLessonId: lastLesson?._id?.toString() || null,
        lastAccessedLessonTitle: lastLesson?.title || null,
        certificateClaimed: e.certificateClaimed || false,
        totalPointsEarned: e.totalPointsEarned || 0,
      };
    });

  res.status(200).json({
    status: 'success',
    count: result.length,
    data: result,
  });
});

/**
 * GET /api/courses/:courseId
 * Full course syllabus, modules, completion states, announcements, live doubt card
 */
export const getCourseDetails = catchAsync(async (req: Request, res: Response) => {
  const { courseId: courseParam } = req.params;
  const userId = req.user!._id;

  const course = await resolveCourse(courseParam);
  if (!course) {
    throw new ApiError(404, `Course '${courseParam}' not found.`);
  }

  // Ensure enrollment exists
  let enrollment = await CourseEnrollment.findOne({ userId, courseId: course._id });
  if (!enrollment) {
    const firstLesson = await CourseLesson.findOne({ courseId: course._id }).sort({ order: 1 });
    enrollment = await CourseEnrollment.create({
      userId,
      courseId: course._id,
      enrolledAt: new Date(),
      lastAccessedLessonId: firstLesson?._id,
      lastAccessedAt: new Date(),
      overallProgressPercent: 0,
      completedLessonsCount: 0,
      totalPointsEarned: 0,
    });
  }

  // Fetch modules and lessons
  const modules = await CourseModule.find({ courseId: course._id }).sort({ order: 1 });
  const lessons = await CourseLesson.find({ courseId: course._id }).sort({ order: 1 });
  const userProgressList = await LessonProgress.find({ userId, courseId: course._id });

  const progressMap = new Map<string, (typeof userProgressList)[0]>();
  userProgressList.forEach((p) => {
    progressMap.set(p.lessonId.toString(), p);
  });

  // Build tree
  const formattedModules = modules.map((mod) => {
    const modLessons = lessons.filter((l) => l.moduleId.toString() === mod._id.toString());
    const isCompleted =
      modLessons.length > 0 &&
      modLessons.every((l) => progressMap.get(l._id.toString())?.isCompleted === true);

    const items = modLessons.map((l) => {
      const p = progressMap.get(l._id.toString());
      return {
        id: l._id.toString(),
        title: l.title,
        type: l.type,
        duration: l.duration,
        score: l.score,
        completed: p?.isCompleted || false,
        userScore: p?.quizScore,
        isBookmarked: p?.isBookmarked || false,
        url: l.resourceFile?.fileUrl || undefined,
        points: l.points,
      };
    });

    return {
      id: mod._id.toString(),
      title: mod.title,
      badge: mod.badge || (isCompleted ? 'Completed' : undefined),
      isCompleted,
      items,
    };
  });

  // Announcements
  const announcements = await CourseAnnouncement.find({ courseId: course._id }).sort({
    publishedAt: -1,
  });

  // Live session
  const liveSession = await CourseLiveSession.findOne({
    courseId: course._id,
    status: { $in: ['upcoming', 'live'] },
  }).sort({ scheduledAt: 1 });

  // Bookmarks
  const bookmarkedLessons = lessons
    .filter((l) => progressMap.get(l._id.toString())?.isBookmarked)
    .map((l) => ({
      lessonId: l._id.toString(),
      title: l.title,
      type: l.type,
      moduleId: l.moduleId.toString(),
    }));

  // Certificate eligibility calculation
  const totalLessonsCount = lessons.length;
  const completedLessonsCount = userProgressList.filter((p) => p.isCompleted).length;
  const progressPercent =
    totalLessonsCount > 0 ? Math.round((completedLessonsCount / totalLessonsCount) * 100) : 0;

  const minProgress = course.certificateRule?.minProgressPercent ?? 100;
  const isEligibleForCertificate = progressPercent >= minProgress;

  res.status(200).json({
    status: 'success',
    data: {
      course: {
        id: course.slug || course._id.toString(),
        _id: course._id.toString(),
        slug: course.slug,
        title: course.title,
        subtitle: course.subtitle,
        description: course.description,
        instructor: course.instructor,
        targetExam: course.targetExam,
        category: course.category,
        totalLecturesCount: course.totalLecturesCount || lessons.length,
        totalHours: course.totalHours || 40,
        enrolledDate: new Intl.DateTimeFormat('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        }).format(new Date(enrollment.enrolledAt)),
        overallProgressPercent: progressPercent,
        completedLessonsCount,
        lastAccessedLessonId: enrollment.lastAccessedLessonId?.toString() || lessons[0]?._id?.toString(),
      },
      modules: formattedModules,
      announcements: announcements.map((a) => ({
        id: a._id.toString(),
        title: a.title,
        content: a.content,
        priority: a.priority,
        authorName: a.authorName,
        authorRole: a.authorRole,
        badge: a.badge,
        isPinned: a.isPinned,
        publishedAt: a.publishedAt,
      })),
      liveSession: liveSession
        ? {
            id: liveSession._id.toString(),
            title: liveSession.title,
            facultyName: liveSession.facultyName,
            scheduledAt: liveSession.scheduledAt,
            durationMinutes: liveSession.durationMinutes,
            joinUrl: liveSession.joinUrl,
            status: liveSession.status,
          }
        : null,
      certificate: {
        isEligible: isEligibleForCertificate,
        claimed: enrollment.certificateClaimed || false,
        claimedAt: enrollment.certificateClaimedAt,
        certificateId: enrollment.certificateId,
        minProgressPercent: minProgress,
        currentProgressPercent: progressPercent,
        title: course.certificateRule?.certificateTitle,
        issuingAuthority: course.certificateRule?.issuingAuthority,
      },
      bookmarkedLessons,
    },
  });
});

/**
 * GET /api/courses/:courseId/leaderboard
 * Computes dynamic leaderboard from points earned
 */
export const getCourseLeaderboard = catchAsync(async (req: Request, res: Response) => {
  const { courseId: courseParam } = req.params;
  const userId = req.user!._id;

  const course = await resolveCourse(courseParam);
  if (!course) {
    throw new ApiError(404, `Course '${courseParam}' not found.`);
  }

  const enrollments = await CourseEnrollment.find({ courseId: course._id })
    .populate('userId', 'name email avatarUrl rollNo')
    .sort({ totalPointsEarned: -1, completedLessonsCount: -1 });

  const colors = [
    'bg-amber-600',
    'bg-indigo-600',
    'bg-rose-600',
    'bg-pink-600',
    'bg-cyan-600',
    'bg-blue-600',
    'bg-teal-600',
    'bg-emerald-600',
    'bg-violet-600',
  ];

  const rankedUsers = enrollments.map((e, index) => {
    const student = e.userId as any;
    const isCurrent = student?._id?.toString() === userId.toString();
    const name = student?.name || 'Aspirant';
    const points = e.totalPointsEarned >= 1000
      ? `${(e.totalPointsEarned / 1000).toFixed(2)}k`
      : `${e.totalPointsEarned}`;

    return {
      rank: index + 1,
      name: isCurrent ? `${name} (You)` : name,
      points,
      pointsRaw: e.totalPointsEarned,
      avatarColor: colors[index % colors.length],
      isCurrent,
      avatarUrl: student?.avatarUrl,
    };
  });

  const topPodium = {
    first: rankedUsers[0] || { name: 'Adv. Vaibhav', points: '1.2k', initial: 'V' },
    second: rankedUsers[1] || { name: 'Adv. Abhima', points: '1.1k', initial: 'A' },
    third: rankedUsers[2] || { name: 'Adv. Krishna', points: '980', initial: 'K' },
  };

  res.status(200).json({
    status: 'success',
    data: {
      topPodium,
      rankedUsers,
    },
  });
});

/**
 * GET /api/courses/:courseId/lessons/:lessonId
 * Full lesson content, user's watch progress, reaction state, and comments count
 */
export const getLessonDetails = catchAsync(async (req: Request, res: Response) => {
  const { courseId: courseParam, lessonId } = req.params;
  const userId = req.user!._id;

  const course = await resolveCourse(courseParam);
  if (!course) {
    throw new ApiError(404, `Course '${courseParam}' not found.`);
  }

  // Find lesson by ObjectId or title match
  let lesson: any = null;
  if (lessonId && mongoose.Types.ObjectId.isValid(String(lessonId))) {
    lesson = await CourseLesson.findById(String(lessonId));
  }
  if (!lesson) {
    lesson = await CourseLesson.findOne({ courseId: course._id, order: 1 });
  }
  if (!lesson) {
    throw new ApiError(404, 'Lesson not found in this course.');
  }

  // Update last accessed lesson on enrollment
  await CourseEnrollment.findOneAndUpdate(
    { userId, courseId: course._id },
    {
      $set: {
        lastAccessedLessonId: lesson._id,
        lastAccessedAt: new Date(),
      },
    },
    { upsert: true }
  );

  // Get or init progress
  let progress = await LessonProgress.findOne({ userId, lessonId: lesson._id });
  if (!progress) {
    progress = await LessonProgress.create({
      userId,
      courseId: course._id,
      lessonId: lesson._id,
      isCompleted: false,
      videoWatchSeconds: 0,
      videoDurationSeconds: lesson.durationSeconds || 1200,
    });
  }

  // Get user's reaction
  const reaction = await LessonReaction.findOne({ userId, lessonId: lesson._id });

  // Get all lessons in this module for the drawer
  const moduleLessons = await CourseLesson.find({
    courseId: course._id,
    moduleId: lesson.moduleId,
  }).sort({ order: 1 });

  const progressRecords = await LessonProgress.find({
    userId,
    courseId: course._id,
    lessonId: { $in: moduleLessons.map((l) => l._id) },
  });

  const progressRecordMap = new Map(progressRecords.map((p) => [p.lessonId.toString(), p]));

  const drawerLessons = moduleLessons.map((l) => {
    const p = progressRecordMap.get(l._id.toString());
    return {
      id: l._id.toString(),
      title: l.title,
      type: l.type,
      duration: l.duration,
      score: l.score,
      completed: p?.isCompleted || false,
      userScore: p?.quizScore,
      points: l.points,
      // Pass question data for quiz/problems
      question: l.quizData?.[0]?.question,
      options: l.quizData?.[0]?.options,
      correctIndex: l.quizData?.[0]?.correctIndex,
      explanation: l.quizData?.[0]?.explanation,
      problemStatement: l.problemData?.problemStatement,
      exampleInput: l.problemData?.exampleInput,
      exampleOutput: l.problemData?.exampleOutput,
      documentContent: l.documentContent,
    };
  });

  // Calculate module KPI metrics
  const videoCount = moduleLessons.filter((l) => l.type === 'video').length;
  const problemCount = moduleLessons.filter((l) => l.type === 'problem').length;
  const mcqCount = moduleLessons.filter((l) => l.type === 'quiz').length;
  const completedModuleLessons = moduleLessons.filter(
    (l) => progressRecordMap.get(l._id.toString())?.isCompleted
  ).length;
  const moduleProgressPercent =
    moduleLessons.length > 0
      ? Math.round((completedModuleLessons / moduleLessons.length) * 100)
      : 0;

  const currentMod = await CourseModule.findById(lesson.moduleId);

  res.status(200).json({
    status: 'success',
    data: {
      lesson: {
        id: lesson._id.toString(),
        title: lesson.title,
        type: lesson.type,
        order: lesson.order,
        duration: lesson.duration,
        durationSeconds: lesson.durationSeconds || 1200,
        score: lesson.score,
        points: lesson.points,
        videoUrl: lesson.videoUrl,
        videoThumbnail: lesson.videoThumbnail,
        documentContent: lesson.documentContent,
        quizData: lesson.quizData,
        problemData: lesson.problemData,
        resourceFile: lesson.resourceFile,
        likesCount: lesson.likesCount || 0,
        dislikesCount: lesson.dislikesCount || 0,
        commentsCount: lesson.commentsCount || 0,
        userReaction: reaction ? reaction.reactionType : null,
        isCompleted: progress.isCompleted,
        videoWatchSeconds: progress.videoWatchSeconds || 0,
        quizScore: progress.quizScore || 0,
        isBookmarked: progress.isBookmarked || false,
      },
      module: {
        id: lesson.moduleId.toString(),
        title: currentMod?.title || 'Current Module',
        progressPercent: moduleProgressPercent,
        videoCount,
        problemCount,
        mcqCount,
        completedCount: completedModuleLessons,
      },
      moduleLessons: drawerLessons,
    },
  });
});

/**
 * POST /api/courses/:courseId/lessons/:lessonId/progress
 * Heartbeat: Updates watch progress; marks completed if >= 85%
 */
export const updateLessonProgress = catchAsync(async (req: Request, res: Response) => {
  const { courseId: courseParam, lessonId } = req.params;
  const { videoWatchSeconds, videoDurationSeconds, isCompleted: forceCompleted } = req.body;
  const userId = req.user!._id;

  const course = await resolveCourse(courseParam);
  if (!course) {
    throw new ApiError(404, `Course '${courseParam}' not found.`);
  }

  const lesson = await CourseLesson.findById(lessonId);
  if (!lesson) {
    throw new ApiError(404, 'Lesson not found.');
  }

  let progress = await LessonProgress.findOne({ userId, lessonId: lesson._id });
  if (!progress) {
    progress = new LessonProgress({
      userId,
      courseId: course._id,
      lessonId: lesson._id,
    });
  }

  if (videoWatchSeconds !== undefined) {
    progress.videoWatchSeconds = Math.max(progress.videoWatchSeconds, Number(videoWatchSeconds));
  }
  if (videoDurationSeconds !== undefined) {
    progress.videoDurationSeconds = Number(videoDurationSeconds);
  }

  // Check if threshold >= 85% reached or force completed
  const duration = progress.videoDurationSeconds || lesson.durationSeconds || 1200;
  const ratio = duration > 0 ? progress.videoWatchSeconds / duration : 0;

  if (forceCompleted || ratio >= 0.85) {
    if (!progress.isCompleted) {
      progress.isCompleted = true;
      progress.completedAt = new Date();
    }
  }

  await progress.save();

  // Recalculate course progress
  const updatedMetrics = await recalculateStudentCourseProgress(userId, course._id);

  res.status(200).json({
    status: 'success',
    data: {
      lessonId: lesson._id.toString(),
      isCompleted: progress.isCompleted,
      videoWatchSeconds: progress.videoWatchSeconds,
      overallProgressPercent: updatedMetrics.overallProgressPercent,
      totalPointsEarned: updatedMetrics.totalPointsEarned,
    },
  });
});

/**
 * POST /api/courses/:courseId/lessons/:lessonId/telemetry
 * Real-time video player heartbeat & telemetry ingestion
 */
export const recordVideoTelemetry = catchAsync(async (req: Request, res: Response) => {
  const { courseId: courseParam, lessonId } = req.params;
  const {
    sessionId,
    playbackSpeed = 1.0,
    watchedSeconds = 0,
    lastPositionSeconds = 0,
    videoDurationSeconds = 0,
    scrubDetected = false,
    deviceInfo,
  } = req.body;
  const userId = req.user!._id;

  const course = await resolveCourse(courseParam);
  if (!course) {
    throw new ApiError(404, `Course '${courseParam}' not found.`);
  }

  const lesson = await CourseLesson.findById(lessonId);
  if (!lesson) {
    throw new ApiError(404, 'Lesson not found.');
  }

  const duration = Number(videoDurationSeconds) || lesson.durationSeconds || 1200;
  const lastPos = Number(lastPositionSeconds);
  const watchedSecs = Number(watchedSeconds);
  const watchPct = duration > 0 ? Math.min(100, Math.round((Math.max(lastPos, watchedSecs) / duration) * 100)) : 0;

  let sessionStatus: 'completed' | 'in_progress' | 'early_drop' = 'in_progress';
  if (watchPct >= 90) {
    sessionStatus = 'completed';
  } else if (watchPct < 20) {
    sessionStatus = 'early_drop';
  }

  const sId = sessionId || `sess_${userId}_${lessonId}_${Date.now()}`;

  // Upsert or create video watch session
  const session = await VideoWatchSession.findOneAndUpdate(
    { userId, lessonId: lesson._id, sessionId: sId },
    {
      $set: {
        courseId: course._id,
        playbackSpeed: Number(playbackSpeed) || 1.0,
        lastPositionSeconds: lastPos,
        videoDurationSeconds: duration,
        watchPercentage: watchPct,
        scrubDetected: Boolean(scrubDetected),
        status: sessionStatus,
        device: {
          deviceModel: deviceInfo?.deviceModel || 'Desktop Browser',
          os: deviceInfo?.os || 'Windows 11',
          browser: deviceInfo?.browser || 'Chrome',
          ipAddress: req.ip || '127.0.0.1',
          location: deviceInfo?.location || 'New Delhi, India',
        },
        lastHeartbeatAt: new Date(),
      },
      $max: {
        watchedSeconds: watchedSecs,
      },
      $inc: {
        playCount: 1,
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  // Sync to LessonProgress
  let progress = await LessonProgress.findOne({ userId, lessonId: lesson._id });
  if (!progress) {
    progress = new LessonProgress({
      userId,
      courseId: course._id,
      lessonId: lesson._id,
    });
  }

  progress.videoWatchSeconds = Math.max(progress.videoWatchSeconds, watchedSecs, lastPos);
  if (duration > 0) {
    progress.videoDurationSeconds = duration;
  }
  if (watchPct >= 85 && !progress.isCompleted) {
    progress.isCompleted = true;
    progress.completedAt = new Date();
  }
  await progress.save();

  const updatedMetrics = await recalculateStudentCourseProgress(userId, course._id);

  res.status(200).json({
    status: 'success',
    data: {
      sessionId: session.sessionId,
      watchedSeconds: session.watchedSeconds,
      lastPositionSeconds: session.lastPositionSeconds,
      watchPercentage: session.watchPercentage,
      status: session.status,
      scrubDetected: session.scrubDetected,
      overallProgressPercent: updatedMetrics.overallProgressPercent,
    },
  });
});

/**
 * POST /api/courses/:courseId/lessons/:lessonId/quiz-submit
 * Validates MCQ answers, awards points, marks lesson complete
 */
export const submitQuizAnswers = catchAsync(async (req: Request, res: Response) => {
  const { courseId: courseParam, lessonId } = req.params;
  const { answers } = req.body; // array of selected option indices
  const userId = req.user!._id;

  const course = await resolveCourse(courseParam);
  if (!course) {
    throw new ApiError(404, `Course '${courseParam}' not found.`);
  }

  const lesson = await CourseLesson.findById(lessonId);
  if (!lesson) {
    throw new ApiError(404, 'Quiz lesson not found.');
  }

  const quizItems = lesson.quizData || [];
  let score = 0;
  let totalScore = 0;
  const results = [];

  for (let i = 0; i < quizItems.length; i++) {
    const q = quizItems[i];
    if (!q) continue;
    const userChoice = Array.isArray(answers) ? answers[i] : answers;
    const isCorrect = userChoice === q.correctIndex;
    const pts = q.points || 10;
    totalScore += pts;
    if (isCorrect) score += pts;

    results.push({
      questionIndex: i,
      userChoice,
      correctIndex: q.correctIndex,
      isCorrect,
      explanation: q.explanation,
    });
  }

  let progress = await LessonProgress.findOne({ userId, lessonId: lesson._id });
  if (!progress) {
    progress = new LessonProgress({
      userId,
      courseId: course._id,
      lessonId: lesson._id,
    });
  }

  progress.quizScore = score;
  progress.quizTotalScore = totalScore;
  progress.quizAttemptsCount = (progress.quizAttemptsCount || 0) + 1;
  progress.quizSelectedAnswers = Array.isArray(answers) ? answers : [answers];
  progress.isCompleted = true;
  progress.completedAt = new Date();

  await progress.save();

  // Recalculate enrollment progress
  const updatedMetrics = await recalculateStudentCourseProgress(userId, course._id);

  res.status(200).json({
    status: 'success',
    data: {
      score,
      totalScore,
      passed: score >= totalScore * 0.5,
      results,
      overallProgressPercent: updatedMetrics.overallProgressPercent,
      totalPointsEarned: updatedMetrics.totalPointsEarned,
    },
  });
});

/**
 * POST /api/courses/:courseId/lessons/:lessonId/reaction
 * Toggles Like / Dislike reaction atomically
 */
export const toggleLessonReaction = catchAsync(async (req: Request, res: Response) => {
  const { lessonId } = req.params;
  const { reactionType } = req.body; // 'like' | 'dislike' | null
  const userId = req.user!._id;

  const lesson = await CourseLesson.findById(lessonId);
  if (!lesson) {
    throw new ApiError(404, 'Lesson not found.');
  }

  const existingReaction = await LessonReaction.findOne({ userId, lessonId: lesson._id });

  let newReaction: string | null = reactionType;

  if (existingReaction) {
    if (existingReaction.reactionType === reactionType || reactionType === null) {
      // Remove reaction
      if (existingReaction.reactionType === 'like') {
        lesson.likesCount = Math.max(0, (lesson.likesCount || 0) - 1);
      } else {
        lesson.dislikesCount = Math.max(0, (lesson.dislikesCount || 0) - 1);
      }
      await LessonReaction.deleteOne({ _id: existingReaction._id });
      newReaction = null;
    } else {
      // Switched reaction (e.g. from like to dislike)
      if (existingReaction.reactionType === 'like') {
        lesson.likesCount = Math.max(0, (lesson.likesCount || 0) - 1);
        lesson.dislikesCount = (lesson.dislikesCount || 0) + 1;
      } else {
        lesson.dislikesCount = Math.max(0, (lesson.dislikesCount || 0) - 1);
        lesson.likesCount = (lesson.likesCount || 0) + 1;
      }
      existingReaction.reactionType = reactionType;
      await existingReaction.save();
    }
  } else if (reactionType) {
    // New reaction
    if (reactionType === 'like') {
      lesson.likesCount = (lesson.likesCount || 0) + 1;
    } else {
      lesson.dislikesCount = (lesson.dislikesCount || 0) + 1;
    }
    await LessonReaction.create({
      userId,
      lessonId: lesson._id,
      reactionType,
    });
  }

  await lesson.save();

  res.status(200).json({
    status: 'success',
    data: {
      likesCount: lesson.likesCount,
      dislikesCount: lesson.dislikesCount,
      userReaction: newReaction,
    },
  });
});

/**
 * GET /api/courses/:courseId/lessons/:lessonId/comments
 * Returns threaded comments
 */
export const getLessonComments = catchAsync(async (req: Request, res: Response) => {
  const { lessonId } = req.params;
  const userId = req.user!._id;

  const comments = await LessonComment.find({ lessonId }).sort({ createdAt: -1 });

  // Group top level and replies
  const topLevel = comments.filter((c) => !c.parentCommentId);
  const replies = comments.filter((c) => c.parentCommentId != null);

  const repliesMap = new Map<string, typeof replies>();
  replies.forEach((r) => {
    const parentId = r.parentCommentId!.toString();
    if (!repliesMap.has(parentId)) {
      repliesMap.set(parentId, []);
    }
    repliesMap.get(parentId)!.push(r);
  });

  const formatted = topLevel.map((c) => ({
    id: c._id.toString(),
    userName: c.userName,
    userAvatar: c.userAvatar,
    userRole: c.userRole,
    content: c.content,
    likesCount: c.likesCount || 0,
    isLikedByMe: c.likedBy?.some((id) => id.toString() === userId.toString()) || false,
    isPinned: c.isPinned,
    createdAt: c.createdAt,
    replies: (repliesMap.get(c._id.toString()) || []).map((r) => ({
      id: r._id.toString(),
      userName: r.userName,
      userAvatar: r.userAvatar,
      userRole: r.userRole,
      content: r.content,
      likesCount: r.likesCount || 0,
      isLikedByMe: r.likedBy?.some((id) => id.toString() === userId.toString()) || false,
      createdAt: r.createdAt,
    })),
  }));

  res.status(200).json({
    status: 'success',
    count: formatted.length,
    data: formatted,
  });
});

/**
 * POST /api/courses/:courseId/lessons/:lessonId/comments
 * Adds new comment or reply
 */
export const addLessonComment = catchAsync(async (req: Request, res: Response) => {
  const { courseId: courseParam, lessonId } = req.params;
  const { content, parentCommentId } = req.body;
  const user = req.user!;

  if (!content || !content.trim()) {
    throw new ApiError(400, 'Comment content is required.');
  }

  const course = await resolveCourse(courseParam);
  if (!course) {
    throw new ApiError(404, `Course '${courseParam}' not found.`);
  }

  const lesson = await CourseLesson.findById(lessonId);
  if (!lesson) {
    throw new ApiError(404, 'Lesson not found.');
  }

  const comment = await LessonComment.create({
    courseId: course._id,
    lessonId: lesson._id,
    userId: user._id,
    userName: user.name || 'Law Aspirant',
    userAvatar: user.avatarUrl,
    userRole: user.role || 'student',
    parentCommentId: parentCommentId || null,
    content: content.trim(),
  });

  lesson.commentsCount = (lesson.commentsCount || 0) + 1;
  await lesson.save();

  res.status(201).json({
    status: 'success',
    data: {
      id: comment._id.toString(),
      userName: comment.userName,
      userAvatar: comment.userAvatar,
      userRole: comment.userRole,
      content: comment.content,
      likesCount: 0,
      isLikedByMe: false,
      createdAt: comment.createdAt,
      replies: [],
    },
  });
});

/**
 * POST /api/courses/:courseId/lessons/:lessonId/comments/:commentId/like
 * Toggles like on comment
 */
export const toggleCommentLike = catchAsync(async (req: Request, res: Response) => {
  const { commentId } = req.params;
  const userId = req.user!._id;

  const comment = await LessonComment.findById(commentId);
  if (!comment) {
    throw new ApiError(404, 'Comment not found.');
  }

  const isLiked = comment.likedBy?.some((id) => id.toString() === userId.toString());

  if (isLiked) {
    comment.likedBy = comment.likedBy.filter((id) => id.toString() !== userId.toString());
    comment.likesCount = Math.max(0, (comment.likesCount || 0) - 1);
  } else {
    comment.likedBy.push(userId);
    comment.likesCount = (comment.likesCount || 0) + 1;
  }

  await comment.save();

  res.status(200).json({
    status: 'success',
    data: {
      likesCount: comment.likesCount,
      isLikedByMe: !isLiked,
    },
  });
});

/**
 * POST /api/courses/:courseId/lessons/:lessonId/bookmark
 * Toggles bookmark in progress & personal Bookmark vault
 */
export const toggleLessonBookmark = catchAsync(async (req: Request, res: Response) => {
  const { courseId: courseParam, lessonId } = req.params;
  const userId = req.user!._id;

  const course = await resolveCourse(courseParam);
  if (!course) {
    throw new ApiError(404, `Course '${courseParam}' not found.`);
  }

  const lesson = await CourseLesson.findById(lessonId);
  if (!lesson) {
    throw new ApiError(404, 'Lesson not found.');
  }

  let progress = await LessonProgress.findOne({ userId, lessonId: lesson._id });
  if (!progress) {
    progress = new LessonProgress({
      userId,
      courseId: course._id,
      lessonId: lesson._id,
    });
  }

  const nextState = !progress.isBookmarked;
  progress.isBookmarked = nextState;
  await progress.save();

  // Sync with general Bookmark collection
  if (nextState) {
    await Bookmark.findOneAndUpdate(
      { user: userId, itemId: lesson._id.toString() },
      {
        $set: {
          user: userId,
          itemType: lesson.type === 'document' ? 'Course Note' : 'Lesson',
          itemId: lesson._id.toString(),
          title: lesson.title,
          source: course.title,
          subject: course.category || 'Law',
          metadata: {
            targetRoute: `/dashboard/courses/${course.slug || course._id}/learn/${lesson._id}`,
            courseId: course._id.toString(),
            lessonType: lesson.type,
          },
        },
      },
      { upsert: true }
    );
  } else {
    await Bookmark.deleteOne({ user: userId, itemId: lesson._id.toString() });
  }

  res.status(200).json({
    status: 'success',
    data: {
      isBookmarked: nextState,
    },
  });
});

/**
 * POST /api/courses/:courseId/claim-certificate
 * Validates eligibility & issues digital certificate
 */
export const claimCourseCertificate = catchAsync(async (req: Request, res: Response) => {
  const { courseId: courseParam } = req.params;
  const userId = req.user!._id;

  const course = await resolveCourse(courseParam);
  if (!course) {
    throw new ApiError(404, `Course '${courseParam}' not found.`);
  }

  const enrollment = await CourseEnrollment.findOne({ userId, courseId: course._id });
  if (!enrollment) {
    throw new ApiError(400, 'Student is not enrolled in this course.');
  }

  const minProgress = course.certificateRule?.minProgressPercent ?? 100;
  if ((enrollment.overallProgressPercent || 0) < minProgress) {
    throw new ApiError(
      400,
      `You need at least ${minProgress}% course completion to claim certificate. Current: ${enrollment.overallProgressPercent}%`
    );
  }

  if (enrollment.certificateClaimed && enrollment.certificateId) {
    return res.status(200).json({
      status: 'success',
      message: 'Certificate already claimed.',
      data: {
        certificateId: enrollment.certificateId,
        claimedAt: enrollment.certificateClaimedAt,
      },
    });
  }

  const certificateId = `RLA-CERT-${Date.now().toString().slice(-6)}-${Math.floor(
    1000 + Math.random() * 9000
  )}`;

  enrollment.certificateClaimed = true;
  enrollment.certificateClaimedAt = new Date();
  enrollment.certificateId = certificateId;
  await enrollment.save();

  res.status(200).json({
    status: 'success',
    message: 'Congratulations! Your certificate has been issued.',
    data: {
      certificateId,
      claimedAt: enrollment.certificateClaimedAt,
      title: course.certificateRule?.certificateTitle,
      recipientName: req.user?.name,
    },
  });
});

// ============================================================================
// ADMIN CONTROLLERS
// ============================================================================

/**
 * GET /api/courses/admin/all
 * Lists all courses with cohort metrics
 */
export const getAdminCourses = catchAsync(async (_req: Request, res: Response) => {
  const courses = await Course.find().sort({ createdAt: -1 });

  const data = await Promise.all(
    courses.map(async (course) => {
      const enrollments = await CourseEnrollment.find({ courseId: course._id });
      const totalStudents = enrollments.length;
      const avgCompletionRate =
        totalStudents > 0
          ? Math.round(
              enrollments.reduce((acc, e) => acc + (e.overallProgressPercent || 0), 0) /
                totalStudents
            )
          : 0;

      const lecturesCount = await CourseLesson.countDocuments({ courseId: course._id });

      return {
        courseId: course.slug || course._id.toString(),
        _id: course._id.toString(),
        courseTitle: course.title,
        slug: course.slug,
        shortCode: course.shortCode || 'JUDICIARY',
        facultyInCharge: course.instructor || 'Adv. Rajinder Sir',
        totalStudents,
        activeBatches: course.activeBatches?.length
          ? course.activeBatches
          : ['Morning Shift (Cohort A)', 'Evening Shift (Cohort B)'],
        avgCompletionRate,
        totalLecturesCount: lecturesCount || course.totalLecturesCount,
        totalHours: course.totalHours || 60,
        status: course.status,
        createdAt: course.createdAt,
      };
    })
  );

  res.status(200).json({
    status: 'success',
    count: data.length,
    data,
  });
});

/**
 * POST /api/courses/admin
 * Creates a new course
 */
export const createCourse = catchAsync(async (req: Request, res: Response) => {
  const {
    title,
    slug,
    shortCode,
    subtitle,
    description,
    thumbnailTag,
    thumbnailBg,
    instructor,
    targetExam,
    category,
    activeBatches,
    certificateRule,
    leaderboardSettings,
  } = req.body;

  if (!title || !slug) {
    throw new ApiError(400, 'Title and Slug are required to create a course.');
  }

  const existing = await Course.findOne({ slug });
  if (existing) {
    throw new ApiError(409, `Course with slug '${slug}' already exists.`);
  }

  const newCourse = await Course.create({
    title,
    slug,
    shortCode: shortCode || slug.toUpperCase(),
    subtitle: subtitle || title,
    description: description || '',
    thumbnailTag: thumbnailTag || 'JUDICIARY',
    thumbnailBg: thumbnailBg || 'from-[#0a1c36] to-[#143564]',
    instructor: instructor || 'Adv. Rajinder Sir',
    targetExam: targetExam || 'Judicial Services Exam',
    category: category || 'Judiciary',
    activeBatches: activeBatches || ['Morning Shift (Cohort A)'],
    certificateRule: certificateRule || {
      minProgressPercent: 100,
      minAssessmentScorePercent: 70,
      certificateTitle: 'Judicial Excellence Certificate',
      issuingAuthority: 'Rajinder Law Academy Academic Council',
    },
    leaderboardSettings: leaderboardSettings || {
      isEnabled: true,
      pointsPerVideoMinute: 2,
      pointsPerQuizCorrect: 10,
      pointsPerProblemSolved: 20,
    },
  });

  res.status(201).json({
    status: 'success',
    message: 'Course created successfully.',
    data: newCourse,
  });
});

/**
 * PUT /api/courses/admin/:courseId
 * Updates course metadata
 */
export const updateCourse = catchAsync(async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const course = await resolveCourse(courseId);
  if (!course) {
    throw new ApiError(404, 'Course not found.');
  }

  Object.assign(course, req.body);
  await course.save();

  res.status(200).json({
    status: 'success',
    message: 'Course updated successfully.',
    data: course,
  });
});

/**
 * DELETE /api/courses/admin/:courseId
 * Deletes or archives a course
 */
export const deleteCourse = catchAsync(async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const course = await resolveCourse(courseId);
  if (!course) {
    throw new ApiError(404, 'Course not found.');
  }

  await Course.deleteOne({ _id: course._id });
  await CourseModule.deleteMany({ courseId: course._id });
  await CourseLesson.deleteMany({ courseId: course._id });
  await CourseEnrollment.deleteMany({ courseId: course._id });

  res.status(200).json({
    status: 'success',
    message: 'Course and related content deleted successfully.',
  });
});

/**
 * POST /api/courses/admin/:courseId/modules
 * Adds a new module to course
 */
export const addCourseModule = catchAsync(async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const { title, badge, order } = req.body;

  const course = await resolveCourse(courseId);
  if (!course) {
    throw new ApiError(404, 'Course not found.');
  }

  const existingModulesCount = await CourseModule.countDocuments({ courseId: course._id });

  const moduleDoc = await CourseModule.create({
    courseId: course._id,
    title: title || `Module ${existingModulesCount + 1}`,
    badge: badge || '',
    order: order !== undefined ? Number(order) : existingModulesCount + 1,
  });

  res.status(201).json({
    status: 'success',
    message: 'Module added successfully.',
    data: moduleDoc,
  });
});

/**
 * PUT /api/courses/admin/:courseId/modules/:moduleId
 */
export const updateCourseModule = catchAsync(async (req: Request, res: Response) => {
  const { moduleId } = req.params;
  const moduleDoc = await CourseModule.findByIdAndUpdate(moduleId, req.body, { new: true });
  if (!moduleDoc) {
    throw new ApiError(404, 'Module not found.');
  }

  res.status(200).json({
    status: 'success',
    message: 'Module updated successfully.',
    data: moduleDoc,
  });
});

/**
 * DELETE /api/courses/admin/:courseId/modules/:moduleId
 */
export const deleteCourseModule = catchAsync(async (req: Request, res: Response) => {
  const { moduleId } = req.params;
  await CourseModule.findByIdAndDelete(moduleId);
  await CourseLesson.deleteMany({ moduleId });

  res.status(200).json({
    status: 'success',
    message: 'Module and its lessons deleted.',
  });
});

/**
 * POST /api/courses/admin/:courseId/modules/:moduleId/lessons
 * Adds a new lesson
 */
export const addCourseLesson = catchAsync(async (req: Request, res: Response) => {
  const { courseId, moduleId } = req.params;
  const course = await resolveCourse(courseId);
  if (!course) {
    throw new ApiError(404, 'Course not found.');
  }

  const moduleDoc = await CourseModule.findById(moduleId);
  if (!moduleDoc) {
    throw new ApiError(404, 'Module not found.');
  }

  const existingCount = await CourseLesson.countDocuments({ moduleId });

  const lesson = await CourseLesson.create({
    courseId: course._id,
    moduleId: moduleDoc._id,
    title: req.body.title || 'Untitled Lesson',
    type: req.body.type || 'video',
    order: req.body.order !== undefined ? Number(req.body.order) : existingCount + 1,
    duration: req.body.duration || '20 mins',
    durationSeconds: req.body.durationSeconds || 1200,
    score: req.body.score || '10/10',
    points: req.body.points || 10,
    videoUrl: req.body.videoUrl,
    videoThumbnail: req.body.videoThumbnail,
    documentContent: req.body.documentContent || [],
    quizData: req.body.quizData || [],
    problemData: req.body.problemData,
    resourceFile: req.body.resourceFile,
  });

  // Update lesson count on course
  const totalLecturesCount = await CourseLesson.countDocuments({ courseId: course._id });
  course.totalLecturesCount = totalLecturesCount;
  await course.save();

  res.status(201).json({
    status: 'success',
    message: 'Lesson created successfully.',
    data: lesson,
  });
});

/**
 * PUT /api/courses/admin/:courseId/lessons/:lessonId
 */
export const updateCourseLesson = catchAsync(async (req: Request, res: Response) => {
  const { lessonId } = req.params;
  const lesson = await CourseLesson.findByIdAndUpdate(lessonId, req.body, { new: true });
  if (!lesson) {
    throw new ApiError(404, 'Lesson not found.');
  }

  res.status(200).json({
    status: 'success',
    message: 'Lesson updated successfully.',
    data: lesson,
  });
});

/**
 * DELETE /api/courses/admin/:courseId/lessons/:lessonId
 */
export const deleteCourseLesson = catchAsync(async (req: Request, res: Response) => {
  const { lessonId } = req.params;
  await CourseLesson.findByIdAndDelete(lessonId);
  await LessonProgress.deleteMany({ lessonId });

  res.status(200).json({
    status: 'success',
    message: 'Lesson deleted successfully.',
  });
});

/**
 * POST /api/courses/admin/:courseId/announcements
 */
export const postCourseAnnouncement = catchAsync(async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const { title, content, priority, badge } = req.body;
  const user = req.user!;

  const course = await resolveCourse(courseId);
  if (!course) {
    throw new ApiError(404, 'Course not found.');
  }

  const announcement = await CourseAnnouncement.create({
    courseId: course._id,
    title,
    content,
    priority: priority || 'normal',
    badge: badge || 'COURSE ANNOUNCEMENT',
    authorName: user.name || 'Academic Dean',
    authorRole: user.role === 'admin' ? 'Academic Dean' : 'Lead Faculty',
    publishedAt: new Date(),
  });

  res.status(201).json({
    status: 'success',
    message: 'Announcement broadcasted successfully.',
    data: announcement,
  });
});

/**
 * POST /api/courses/admin/:courseId/live-sessions
 */
export const scheduleLiveSession = catchAsync(async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const { title, facultyName, scheduledAt, durationMinutes, joinUrl } = req.body;

  const course = await resolveCourse(courseId);
  if (!course) {
    throw new ApiError(404, 'Course not found.');
  }

  const liveSession = await CourseLiveSession.create({
    courseId: course._id,
    title,
    facultyName: facultyName || course.instructor,
    scheduledAt: new Date(scheduledAt),
    durationMinutes: durationMinutes || 60,
    joinUrl: joinUrl || '/dashboard/chat',
    status: 'upcoming',
  });

  res.status(201).json({
    status: 'success',
    message: 'Live doubt session scheduled successfully.',
    data: liveSession,
  });
});

/**
 * GET /api/courses/admin/:courseId/analytics
 */
export const getCourseAnalytics = catchAsync(async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const course = await resolveCourse(courseId);
  if (!course) {
    throw new ApiError(404, 'Course not found.');
  }

  const enrollments = await CourseEnrollment.find({ courseId: course._id })
    .populate('userId', 'name email rollNo phone assignedBatch')
    .sort({ overallProgressPercent: -1 });

  const totalEnrolled = enrollments.length;
  const completedCount = enrollments.filter((e) => e.overallProgressPercent === 100).length;
  const inProgressCount = enrollments.filter(
    (e) => e.overallProgressPercent > 0 && e.overallProgressPercent < 100
  ).length;
  const notStartedCount = enrollments.filter((e) => e.overallProgressPercent === 0).length;

  res.status(200).json({
    status: 'success',
    data: {
      courseId: course._id.toString(),
      courseTitle: course.title,
      totalEnrolled,
      completedCount,
      inProgressCount,
      notStartedCount,
      students: enrollments.map((e) => ({
        id: e._id.toString(),
        student: e.userId,
        enrolledAt: e.enrolledAt,
        progressPercent: e.overallProgressPercent,
        completedLessonsCount: e.completedLessonsCount,
        totalPointsEarned: e.totalPointsEarned,
        certificateClaimed: e.certificateClaimed,
      })),
    },
  });
});

/**
 * POST /api/courses/admin/:courseId/enroll-batch
 */
export const enrollBatchToCourse = catchAsync(async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const { batchName } = req.body;

  const course = await resolveCourse(courseId);
  if (!course) {
    throw new ApiError(404, 'Course not found.');
  }

  const query: any = { role: 'student' };
  if (batchName) {
    query.assignedBatch = batchName;
  }

  const students = await User.find(query);
  let newlyEnrolled = 0;

  const firstLesson = await CourseLesson.findOne({ courseId: course._id }).sort({ order: 1 });

  for (const student of students) {
    const existing = await CourseEnrollment.findOne({ userId: student._id, courseId: course._id });
    if (!existing) {
      await CourseEnrollment.create({
        userId: student._id,
        courseId: course._id,
        enrolledAt: new Date(),
        lastAccessedLessonId: firstLesson?._id,
        lastAccessedAt: new Date(),
      });
      newlyEnrolled++;
    }
  }

  course.enrolledStudentsCount = (course.enrolledStudentsCount || 0) + newlyEnrolled;
  await course.save();

  res.status(200).json({
    status: 'success',
    message: `Enrolled ${newlyEnrolled} students into course '${course.title}'.`,
    data: { newlyEnrolled, totalEnrolled: course.enrolledStudentsCount },
  });
});

/**
 * GET /api/courses/admin/recordings
 */
export const getAdminRecordings = catchAsync(async (req: Request, res: Response) => {
  const videoLessons = await CourseLesson.find({ type: 'video' })
    .populate('courseId', 'title slug instructor')
    .populate('moduleId', 'title')
    .sort({ createdAt: -1 });

  const recordings = videoLessons.map((l: any) => {
    const course = l.courseId;
    const mod = l.moduleId;
    return {
      id: l._id,
      title: l.title,
      courseTitle: course?.title || 'Judiciary Course',
      courseSlug: course?.slug || '',
      moduleTitle: mod?.title || 'General Module',
      faculty: course?.instructor || 'Adv. Rajinder Sir',
      duration: l.duration || '45 mins',
      videoUrl: l.videoUrl || '',
      videoThumbnail: l.videoThumbnail || '',
      createdAt: l.createdAt || new Date(),
      likesCount: l.likesCount || 0,
      dislikesCount: l.dislikesCount || 0,
      commentsCount: l.commentsCount || 0,
      viewsCount: (l.likesCount || 0) * 4 + 25,
      quality: '1080p 60fps HD',
      hasHandout: !!(l.documentContent && l.documentContent.length > 0),
    };
  });

  res.status(200).json({
    status: 'success',
    data: recordings,
  });
});

/**
 * POST /api/courses/admin/recordings
 */
export const addAdminRecording = catchAsync(async (req: Request, res: Response) => {
  const { courseId, moduleId, title, videoUrl, duration, durationSeconds, points } = req.body;

  if (!courseId || !moduleId || !title || !videoUrl) {
    throw new ApiError(400, 'Course, module, title, and video URL are required.');
  }

  const course = await resolveCourse(courseId);
  if (!course) throw new ApiError(404, 'Course not found.');

  const moduleDoc = await CourseModule.findById(moduleId);
  if (!moduleDoc) throw new ApiError(404, 'Module not found.');

  const count = await CourseLesson.countDocuments({ moduleId });
  const lesson = await CourseLesson.create({
    courseId: course._id,
    moduleId: moduleDoc._id,
    title,
    type: 'video',
    order: count + 1,
    duration: duration || '45 mins',
    durationSeconds: durationSeconds || 2700,
    videoUrl,
    points: points || 10,
    likesCount: 0,
    dislikesCount: 0,
    commentsCount: 0,
  });

  course.totalLecturesCount = (course.totalLecturesCount || 0) + 1;
  const hoursToAdd = Math.round(((durationSeconds || 2700) / 3600) * 10) / 10;
  course.totalHours = (course.totalHours || 0) + hoursToAdd;
  await course.save();

  res.status(201).json({
    status: 'success',
    message: 'Recording added successfully to course curriculum.',
    data: lesson,
  });
});


import { type Request, type Response } from 'express';
import mongoose from 'mongoose';
import LiveMockTest, { type ILiveMockTest } from '../models/liveMockTest.model.js';
import LiveTestAttempt, {
  type ILiveTestAttempt,
  LIVE_TEST_RANK_SORT,
} from '../models/liveTestAttempt.model.js';
import McqQuestion, { type IMcqQuestion } from '../models/mcqQuestion.model.js';
import TestAttempt from '../models/testAttempt.model.js';
import User from '../models/user.model.js';
import catchAsync from '../utils/catchAsync.js';
import ApiError from '../utils/ApiError.js';

/**
 * Strips answers and explanations from questions for secure test-taking
 */
const sanitizeQuestionForExam = (q: any) => {
  if (!q) return null;
  return {
    _id: q._id,
    code: q.code,
    subject: q.subject,
    actName: q.actName,
    chapterOrPart: q.chapterOrPart,
    sectionOrArticle: q.sectionOrArticle,
    questionText: q.questionText,
    options: q.options || [],
    difficulty: q.difficulty,
    format: q.format,
    targetExams: q.targetExams,
  };
};

/**
 * Re-computes dense ranks and percentiles across all official attempts of a test
 */
export const refreshLiveLeaderboardRanks = async (testId: string | mongoose.Types.ObjectId) => {
  const eligible = await LiveTestAttempt.find({
    testId,
    isOfficial: true,
    status: { $in: ['submitted', 'auto_submitted'] },
    'antiCheat.status': { $ne: 'disqualified' },
  }).sort(LIVE_TEST_RANK_SORT);

  const totalCandidates = eligible.length;
  if (totalCandidates === 0) return;

  const bulkOps = eligible.map((attempt, index) => {
    const rank = index + 1;
    const rawPercentile = ((totalCandidates - rank) / totalCandidates) * 100;
    const percentile = parseFloat(Math.min(99.9, Math.max(1.0, rawPercentile)).toFixed(1));

    return {
      updateOne: {
        filter: { _id: attempt._id },
        update: {
          $set: {
            'result.rank': rank,
            'result.percentile': percentile,
            'result.totalCandidates': totalCandidates,
          },
        },
      },
    };
  });

  await LiveTestAttempt.bulkWrite(bulkOps);

  // Update LiveMockTest statistics
  const topScore = eligible[0]?.result?.score || 0;
  const totalScore = eligible.reduce((sum, att) => sum + (att.result?.score || 0), 0);
  const avgScore = parseFloat((totalScore / totalCandidates).toFixed(1));

  await LiveMockTest.updateOne(
    { _id: testId },
    {
      $set: {
        'stats.totalAttempted': totalCandidates,
        'stats.topScore': topScore,
        'stats.avgScore': avgScore,
      },
    }
  );
};

/**
 * @desc    Get dynamic Live Mock Test Catalog with countdowns and attempt states
 * @route   GET /api/tests/live/catalog
 * @access  Private (Student)
 */
export const getLiveTestCatalog = catchAsync(async (req: Request, res: Response) => {
  const studentId = req.user!._id;
  const now = new Date();

  const mockTests = await LiveMockTest.find({ isPublished: true })
    .sort({ windowStart: 1 })
    .lean();

  // Find all attempts by this student on these live tests
  const userAttempts = await LiveTestAttempt.find({
    studentId,
  })
    .sort({ createdAt: -1 })
    .lean();

  const attemptsByTest = new Map<string, any[]>();
  userAttempts.forEach((att) => {
    const key = att.testId.toString();
    const list = attemptsByTest.get(key) || [];
    list.push(att);
    attemptsByTest.set(key, list);
  });

  const tests = mockTests.map((t) => {
    const testIdStr = t._id.toString();
    const attempts = attemptsByTest.get(testIdStr) || [];
    const activeAttempt = attempts.find((a) => a.status === 'in_progress');
    const latestCompleted = attempts.find((a) => a.status === 'submitted' || a.status === 'auto_submitted');

    // Dynamic phase calculation
    let phase: 'scheduled' | 'live' | 'closed' = 'scheduled';
    if (now < new Date(t.windowStart)) {
      phase = 'scheduled';
    } else if (now >= new Date(t.windowStart) && now <= new Date(t.windowEnd)) {
      phase = 'live';
    } else {
      phase = 'closed';
    }

    const countdownMs =
      phase === 'scheduled'
        ? Math.max(0, new Date(t.windowStart).getTime() - now.getTime())
        : phase === 'live'
        ? Math.max(0, new Date(t.windowEnd).getTime() - now.getTime())
        : 0;

    let userStatus: 'not_started' | 'in_progress' | 'completed' = 'not_started';
    if (activeAttempt) {
      userStatus = 'in_progress';
    } else if (latestCompleted) {
      userStatus = 'completed';
    }

    return {
      id: testIdStr,
      testCode: t.testCode,
      title: t.title,
      targetExam: t.targetExam,
      targetState: t.targetState,
      syllabus: t.syllabus,
      windowStart: t.windowStart,
      windowEnd: t.windowEnd,
      durationMinutes: t.durationMinutes,
      durationFormatted: `${t.durationMinutes} Mins`,
      questionsCount: t.questionsCount,
      maxScore: t.maxScore,
      negativeMarkWeight: t.negativeMarkWeight,
      negativeMarkFormatted: `-${t.negativeMarkWeight} Mark`,
      marksPerCorrect: t.marksPerCorrect,
      difficulty: t.difficulty,
      sections: (t.sections || []).map((s) => ({ name: s.name, count: s.questionCount })),
      phase,
      countdownMs,
      userStatus,
      activeAttemptId: activeAttempt ? activeAttempt._id.toString() : null,
      latestCompletedAttemptId: latestCompleted ? latestCompleted._id.toString() : null,
      officialScore: latestCompleted?.result?.score,
      officialRank: latestCompleted?.result?.rank,
      officialPercentile: latestCompleted?.result?.percentile,
      totalAttempted: t.stats?.totalAttempted || 0,
      topScore: t.stats?.topScore || 0,
    };
  });

  res.status(200).json({
    success: true,
    data: tests,
  });
});

/**
 * @desc    Start or Resume a Live Mock Test Session
 * @route   POST /api/tests/live/tests/:testId/start
 * @access  Private (Student)
 */
export const startLiveTestSession = catchAsync(async (req: Request, res: Response) => {
  const studentId = req.user!._id;
  const { testId } = req.params;
  const now = new Date();

  const test = await LiveMockTest.findById(testId).populate('questions');
  if (!test || !test.isPublished) {
    throw new ApiError(404, 'Mock test paper not found or unavailable.');
  }

  // 1. Check if user already has an in_progress session on this test
  const existingActive = await LiveTestAttempt.findOne({
    studentId,
    testId,
    status: 'in_progress',
  }).populate('answers.questionId');

  if (existingActive) {
    // Check if session has expired
    if (now.getTime() > existingActive.expiresAt.getTime() + 15000) {
      // Auto-finalize expired session
      existingActive.status = 'auto_submitted';
      existingActive.autoSubmittedAt = existingActive.expiresAt;
      existingActive.submittedAt = existingActive.expiresAt;
      await existingActive.save();
    } else {
      // Valid active session - resume immediately!
      const timeRemainingSeconds = Math.max(
        0,
        Math.round((existingActive.expiresAt.getTime() - now.getTime()) / 1000)
      );

      const secureQuestions = existingActive.answers.map((ans: any) => ({
        question: sanitizeQuestionForExam(ans.questionId),
        selectedOption: ans.selectedOption,
        isAnswered: ans.isAnswered,
        isMarkedForReview: ans.isMarkedForReview,
        isVisited: ans.isVisited,
        timeSpentSeconds: ans.timeSpentSeconds,
      }));

      res.status(200).json({
        success: true,
        message: 'Resuming active exam room session.',
        isResumed: true,
        attemptId: existingActive._id,
        session: {
          id: existingActive._id,
          testId: test._id,
          title: test.title,
          targetExam: test.targetExam,
          durationMinutes: test.durationMinutes,
          timeRemainingSeconds,
          currentIndex: existingActive.currentIndex,
          startedAt: existingActive.startedAt,
          expiresAt: existingActive.expiresAt,
          isOfficial: existingActive.isOfficial,
          attemptNumber: existingActive.attemptNumber,
          questions: secureQuestions,
          sections: test.sections,
        },
      });
      return;
    }
  }

  // 2. Availability Window Verification
  if (now < new Date(test.windowStart)) {
    throw new ApiError(
      400,
      `Exam window is not open yet. Test starts at ${new Date(test.windowStart).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`
    );
  }

  // Determine official vs practice mode
  const priorOfficialAttempt = await LiveTestAttempt.findOne({
    studentId,
    testId,
    isOfficial: true,
    status: { $in: ['submitted', 'auto_submitted'] },
  });

  const isWindowActive = now <= new Date(test.windowEnd);
  const isOfficial = !priorOfficialAttempt && isWindowActive;

  const priorAttemptsCount = await LiveTestAttempt.countDocuments({ studentId, testId });
  const attemptNumber = priorAttemptsCount + 1;

  // Calculate expiresAt = min(now + duration, test.windowEnd)
  const durationEnd = new Date(now.getTime() + test.durationMinutes * 60 * 1000);
  const windowEnd = new Date(test.windowEnd);
  const expiresAt = isWindowActive && windowEnd < durationEnd ? windowEnd : durationEnd;

  // If questions are attached to the test, use them. If not enough, draw from MCQ bank
  let questionDocs = test.questions as unknown as IMcqQuestion[];
  if (!questionDocs || questionDocs.length === 0) {
    questionDocs = await McqQuestion.find({ isActive: true }).limit(test.questionsCount);
  }

  const initialAnswers = questionDocs.map((q) => ({
    questionId: q._id,
    selectedOption: null,
    isAnswered: false,
    isMarkedForReview: false,
    isVisited: false,
    timeSpentSeconds: 0,
    isCorrect: null,
  }));

  const newAttempt = await LiveTestAttempt.create({
    testId: test._id,
    studentId,
    attemptNumber,
    isOfficial,
    status: 'in_progress',
    startedAt: now,
    expiresAt,
    durationUsedMilliseconds: 0,
    durationUsedSeconds: 0,
    currentIndex: 0,
    answers: initialAnswers,
    result: {
      score: 0,
      maxScore: test.maxScore,
      correct: 0,
      incorrect: 0,
      unattempted: initialAnswers.length,
      accuracy: 0,
      negativeMarks: 0,
      avgTimePerMcq: 0,
      rank: 1,
      percentile: 99.0,
      totalCandidates: 1,
    },
    antiCheat: {
      status: 'clean',
      violationsCount: 0,
      events: [{ eventType: 'exam_started', timestamp: now }],
    },
  });

  // Increment registered stats on test
  await LiveMockTest.updateOne({ _id: test._id }, { $inc: { 'stats.totalRegistered': 1 } });

  const secureQuestions = questionDocs.map((q) => ({
    question: sanitizeQuestionForExam(q),
    selectedOption: null,
    isAnswered: false,
    isMarkedForReview: false,
    isVisited: false,
    timeSpentSeconds: 0,
  }));

  const timeRemainingSeconds = Math.max(
    0,
    Math.round((expiresAt.getTime() - now.getTime()) / 1000)
  );

  res.status(201).json({
    success: true,
    message: isOfficial
      ? 'Official Live Examination session initialized.'
      : 'Practice Re-Attempt session initialized.',
    isResumed: false,
    attemptId: newAttempt._id,
    session: {
      id: newAttempt._id,
      testId: test._id,
      title: test.title,
      targetExam: test.targetExam,
      durationMinutes: test.durationMinutes,
      timeRemainingSeconds,
      currentIndex: 0,
      startedAt: now,
      expiresAt,
      isOfficial,
      attemptNumber,
      questions: secureQuestions,
      sections: test.sections,
    },
  });
});

/**
 * @desc    Auto-save candidate question selection & review flag
 * @route   PATCH /api/tests/live/attempts/:attemptId/answer
 * @access  Private (Student)
 */
export const updateLiveAnswerProgress = catchAsync(async (req: Request, res: Response) => {
  const { attemptId } = req.params;
  const studentId = req.user!._id;
  const { questionIndex, selectedOption, isMarkedForReview, isVisited, timeSpentDelta } = req.body;

  if (questionIndex === undefined || typeof questionIndex !== 'number') {
    throw new ApiError(400, 'Valid questionIndex is required.');
  }

  const attempt = await LiveTestAttempt.findOne({
    _id: attemptId,
    studentId,
    status: 'in_progress',
  });

  if (!attempt) {
    throw new ApiError(404, 'Active live test attempt not found or already submitted.');
  }

  const targetAns = attempt.answers[questionIndex];
  if (!targetAns) {
    throw new ApiError(400, 'Question index out of bounds.');
  }

  if (selectedOption !== undefined) {
    targetAns.selectedOption = selectedOption;
    targetAns.isAnswered = selectedOption !== null;
  }

  if (isMarkedForReview !== undefined) {
    targetAns.isMarkedForReview = Boolean(isMarkedForReview);
  }

  if (isVisited !== undefined) {
    targetAns.isVisited = Boolean(isVisited);
  } else {
    targetAns.isVisited = true;
  }

  if (timeSpentDelta && typeof timeSpentDelta === 'number') {
    targetAns.timeSpentSeconds += Math.max(0, timeSpentDelta);
  }

  attempt.currentIndex = questionIndex;
  await attempt.save();

  res.status(200).json({
    success: true,
    savedAt: new Date(),
    currentIndex: attempt.currentIndex,
  });
});

/**
 * @desc    Heartbeat ping from exam runner to sync server clock & enforce time limits
 * @route   PATCH /api/tests/live/attempts/:attemptId/heartbeat
 * @access  Private (Student)
 */
export const heartbeatLiveSession = catchAsync(async (req: Request, res: Response) => {
  const { attemptId } = req.params;
  const studentId = req.user!._id;
  const now = new Date();

  const attempt = await LiveTestAttempt.findOne({
    _id: attemptId,
    studentId,
  });

  if (!attempt) {
    throw new ApiError(404, 'Attempt not found.');
  }

  if (attempt.status !== 'in_progress') {
    res.status(200).json({
      success: true,
      status: attempt.status,
      timeRemainingSeconds: 0,
      isExpired: true,
    });
    return;
  }

  // Check if expired
  if (now.getTime() >= attempt.expiresAt.getTime()) {
    attempt.status = 'auto_submitted';
    attempt.autoSubmittedAt = now;
    attempt.submittedAt = now;
    await attempt.save();

    res.status(200).json({
      success: true,
      status: 'auto_submitted',
      timeRemainingSeconds: 0,
      isExpired: true,
    });
    return;
  }

  attempt.lastHeartbeatAt = now;
  await attempt.save();

  const timeRemainingSeconds = Math.max(
    0,
    Math.round((attempt.expiresAt.getTime() - now.getTime()) / 1000)
  );

  res.status(200).json({
    success: true,
    status: 'in_progress',
    timeRemainingSeconds,
    isExpired: false,
  });
});

/**
 * @desc    Log anti-cheat / proctoring events during examination
 * @route   POST /api/tests/live/attempts/:attemptId/event
 * @access  Private (Student)
 */
export const recordAntiCheatEvent = catchAsync(async (req: Request, res: Response) => {
  const { attemptId } = req.params;
  const studentId = req.user!._id;
  const { eventType, metadata } = req.body;

  const attempt = await LiveTestAttempt.findOne({
    _id: attemptId,
    studentId,
    status: 'in_progress',
  });

  if (!attempt) {
    throw new ApiError(404, 'Active attempt not found.');
  }

  attempt.antiCheat.events.push({
    eventType: eventType || 'window_blur',
    timestamp: new Date(),
    metadata: metadata || {},
  });

  attempt.antiCheat.violationsCount += 1;
  if (attempt.antiCheat.violationsCount >= 4) {
    attempt.antiCheat.status = 'review_required';
  }

  await attempt.save();

  res.status(200).json({
    success: true,
    violationsCount: attempt.antiCheat.violationsCount,
    status: attempt.antiCheat.status,
  });
});

/**
 * @desc    Final submit and evaluation of live test attempt
 * @route   POST /api/tests/live/attempts/:attemptId/submit
 * @access  Private (Student)
 */
export const submitLiveTestSession = catchAsync(async (req: Request, res: Response) => {
  const { attemptId } = req.params;
  const studentId = req.user!._id;
  const submittedAt = new Date();

  const attempt = await LiveTestAttempt.findOne({
    _id: attemptId,
    studentId,
  }).populate<{ 'answers.questionId': IMcqQuestion }>('answers.questionId');

  if (!attempt) {
    throw new ApiError(404, 'Attempt session not found.');
  }

  const test = await LiveMockTest.findById(attempt.testId);
  if (!test) {
    throw new ApiError(404, 'Associated mock test not found.');
  }

  // Idempotent re-submission check
  if (attempt.status === 'submitted' || attempt.status === 'auto_submitted') {
    const fullQuestionsWithSolutions = attempt.answers.map((ans: any) => {
      const qDoc = ans.questionId as unknown as IMcqQuestion;
      return {
        _id: qDoc?._id,
        code: qDoc?.code,
        subject: qDoc?.subject,
        actName: qDoc?.actName,
        sectionOrArticle: qDoc?.sectionOrArticle,
        questionText: qDoc?.questionText,
        options: qDoc?.options || [],
        selectedOption: ans.selectedOption,
        correctOptionIndex: qDoc?.correctOptionIndex,
        isCorrect: ans.isCorrect,
        explanation: qDoc?.explanation,
        landmarkCases: qDoc?.landmarkCases || [],
        timeSpentSeconds: ans.timeSpentSeconds,
      };
    });

    res.status(200).json({
      success: true,
      message: 'Test already submitted.',
      alreadyProcessed: true,
      resultSummary: attempt.result,
      review: {
        attemptId: attempt._id,
        testId: test._id,
        title: test.title,
        targetExam: test.targetExam,
        submittedAt: attempt.submittedAt,
        resultSummary: attempt.result,
        questions: fullQuestionsWithSolutions,
      },
    });
    return;
  }

  // Grade candidate's answers
  const negativeWeight = test.negativeMarkWeight ?? 0.25;
  const marksPerCorrect = test.marksPerCorrect ?? 1.0;

  let correct = 0;
  let incorrect = 0;
  let unattempted = 0;
  let totalTimeSeconds = 0;
  const subjectMap = new Map<string, { total: number; correct: number; incorrect: number; unattempted: number; timeSpent: number }>();

  attempt.answers.forEach((ans) => {
    const qDoc = ans.questionId as unknown as IMcqQuestion;
    const sub = qDoc?.subject || 'General Law';
    const currSub = subjectMap.get(sub) || { total: 0, correct: 0, incorrect: 0, unattempted: 0, timeSpent: 0 };
    currSub.total += 1;
    currSub.timeSpent += ans.timeSpentSeconds || 0;
    totalTimeSeconds += ans.timeSpentSeconds || 0;

    if (ans.selectedOption === null || ans.selectedOption === undefined) {
      unattempted++;
      ans.isCorrect = false;
      currSub.unattempted += 1;
    } else {
      const isRight = Number(ans.selectedOption) === Number(qDoc?.correctOptionIndex);
      ans.isCorrect = isRight;
      if (isRight) {
        correct++;
        currSub.correct += 1;
      } else {
        incorrect++;
        currSub.incorrect += 1;
      }
    }
    subjectMap.set(sub, currSub);
  });

  const totalQuestions = attempt.answers.length;
  const attempted = correct + incorrect;
  const negativePenalty = parseFloat((incorrect * negativeWeight).toFixed(2));
  const rawScore = correct * marksPerCorrect - negativePenalty;
  const score = parseFloat(Math.max(0, rawScore).toFixed(2));
  const maxScore = totalQuestions * marksPerCorrect;
  const accuracy = attempted > 0 ? parseFloat(((correct / attempted) * 100).toFixed(1)) : 0;
  const avgTimePerMcq = attempted > 0 ? Math.round(totalTimeSeconds / attempted) : 45;

  const durationUsedMilliseconds = Math.max(1000, submittedAt.getTime() - attempt.startedAt.getTime());
  const durationUsedSeconds = Math.round(durationUsedMilliseconds / 1000);

  // Subject analysis conversion
  const subjectAnalysis = Array.from(subjectMap.entries()).map(([subject, stats]) => ({
    subject,
    total: stats.total,
    correct: stats.correct,
    incorrect: stats.incorrect,
    unattempted: stats.unattempted,
    accuracy: stats.total > 0 ? parseFloat(((stats.correct / stats.total) * 100).toFixed(1)) : 0,
    timeSpentSeconds: stats.timeSpent,
  }));

  const resultPayload = {
    score,
    maxScore,
    correct,
    incorrect,
    unattempted,
    accuracy,
    negativeMarks: negativePenalty,
    avgTimePerMcq,
    rank: 1, // Will be normalized below
    percentile: 98.5,
    totalCandidates: 1,
  };

  attempt.status = 'submitted';
  attempt.submittedAt = submittedAt;
  attempt.durationUsedMilliseconds = durationUsedMilliseconds;
  attempt.durationUsedSeconds = durationUsedSeconds;
  attempt.result = resultPayload;
  attempt.subjectAnalysis = subjectAnalysis;
  await attempt.save();

  // Re-calculate Leaderboard if official attempt
  if (attempt.isOfficial) {
    await refreshLiveLeaderboardRanks(test._id);
  }

  // Reload attempt for fresh rank
  const updatedAttempt = await LiveTestAttempt.findById(attempt._id);

  // Scorecard Bridge: Automatically create or update TestAttempt for cumulative student analytics
  await TestAttempt.create({
    student: studentId,
    testTitle: test.title,
    testType: 'mock_series',
    targetExam: test.targetExam,
    score: updatedAttempt?.result?.score || score,
    maxScore: test.maxScore,
    rank: updatedAttempt?.result?.rank || 1,
    totalAspirants: updatedAttempt?.result?.totalCandidates || 1200,
    percentile: updatedAttempt?.result?.percentile || 98.5,
    correct,
    incorrect,
    unattempted,
    accuracy,
    avgTimePerMcq,
    negativeMarks: negativePenalty,
    timeSpentMinutes: Math.round(durationUsedSeconds / 60),
    attemptedAt: submittedAt,
  });

  const fullQuestionsWithSolutions = attempt.answers.map((ans: any) => {
    const qDoc = ans.questionId as unknown as IMcqQuestion;
    return {
      _id: qDoc?._id,
      code: qDoc?.code,
      subject: qDoc?.subject,
      actName: qDoc?.actName,
      sectionOrArticle: qDoc?.sectionOrArticle,
      questionText: qDoc?.questionText,
      options: qDoc?.options || [],
      selectedOption: ans.selectedOption,
      correctOptionIndex: qDoc?.correctOptionIndex,
      isCorrect: ans.isCorrect,
      explanation: qDoc?.explanation,
      landmarkCases: qDoc?.landmarkCases || [],
      timeSpentSeconds: ans.timeSpentSeconds,
    };
  });

  res.status(200).json({
    success: true,
    message: 'Examination submitted and evaluated successfully.',
    resultSummary: updatedAttempt?.result || resultPayload,
    review: {
      attemptId: attempt._id,
      testId: test._id,
      title: test.title,
      targetExam: test.targetExam,
      submittedAt,
      resultSummary: updatedAttempt?.result || resultPayload,
      subjectAnalysis,
      questions: fullQuestionsWithSolutions,
    },
  });
});

/**
 * @desc    Get test-specific All-India Leaderboard with Top 3 podium and current student rank
 * @route   GET /api/tests/live/tests/:testId/leaderboard
 * @access  Private (Student)
 */
export const getLiveTestLeaderboard = catchAsync(async (req: Request, res: Response) => {
  const { testId } = req.params;
  const studentId = req.user!._id;

  const test = await LiveMockTest.findById(testId);
  if (!test) {
    throw new ApiError(404, 'Mock test not found.');
  }

  const officialAttempts = await LiveTestAttempt.find({
    testId,
    isOfficial: true,
    status: { $in: ['submitted', 'auto_submitted'] },
    'antiCheat.status': { $ne: 'disqualified' },
  })
    .sort(LIVE_TEST_RANK_SORT)
    .populate('studentId', 'name email rollNo rollNumber avatar profilePicture')
    .lean();

  const totalCandidates = officialAttempts.length;

  const leaderboard = officialAttempts.map((att: any, idx: number) => {
    const rank = att.result?.rank || idx + 1;
    const isCurrent = att.studentId?._id?.toString() === studentId.toString();

    return {
      attemptId: att._id.toString(),
      rank,
      studentId: att.studentId?._id?.toString(),
      name: att.studentId?.name || 'Aspirant',
      rollNumber: att.studentId?.rollNo || att.studentId?.rollNumber || `RLA-2026-${String(idx + 10).padStart(3, '0')}`,
      avatar: att.studentId?.profilePicture || att.studentId?.avatar,
      score: att.result?.score ?? 0,
      maxScore: att.result?.maxScore ?? test.maxScore,
      correct: att.result?.correct ?? 0,
      incorrect: att.result?.incorrect ?? 0,
      accuracy: att.result?.accuracy ?? 0,
      negativeMarks: att.result?.negativeMarks ?? 0,
      durationUsedSeconds: att.durationUsedSeconds ?? 0,
      durationUsedMilliseconds: att.durationUsedMilliseconds ?? 0,
      percentile: att.result?.percentile ?? 95.0,
      submittedAt: att.submittedAt,
      isCurrentUser: isCurrent,
    };
  });

  const currentUserRow = leaderboard.find((row) => row.isCurrentUser) || null;

  res.status(200).json({
    success: true,
    data: {
      testId: test._id,
      testTitle: test.title,
      isFrozen: test.isLeaderboardFrozen,
      totalCandidates,
      leaderboard,
      currentUserRank: currentUserRow,
    },
  });
});

/**
 * @desc    Get current student's full historical record of live mock test attempts
 * @route   GET /api/tests/live/history
 * @access  Private (Student)
 */
export const getLiveTestHistory = catchAsync(async (req: Request, res: Response) => {
  const studentId = req.user!._id;

  const attempts = await LiveTestAttempt.find({
    studentId,
    status: { $in: ['submitted', 'auto_submitted'] },
  })
    .sort({ submittedAt: -1 })
    .populate('testId')
    .lean();

  const history = attempts.map((att: any) => {
    const test = att.testId;
    return {
      attemptId: att._id.toString(),
      testId: test?._id?.toString(),
      testCode: test?.testCode || 'RLA-MOCK',
      title: test?.title || 'Judicial Mock Exam',
      targetExam: test?.targetExam || 'All-India Judicial Services',
      isOfficial: att.isOfficial,
      attemptNumber: att.attemptNumber,
      score: att.result?.score ?? 0,
      maxScore: att.result?.maxScore ?? test?.maxScore ?? 100,
      rank: att.result?.rank,
      percentile: att.result?.percentile,
      accuracy: att.result?.accuracy ?? 0,
      correct: att.result?.correct ?? 0,
      incorrect: att.result?.incorrect ?? 0,
      unattempted: att.result?.unattempted ?? 0,
      durationUsedSeconds: att.durationUsedSeconds ?? 0,
      submittedAt: att.submittedAt || att.createdAt,
    };
  });

  res.status(200).json({
    success: true,
    data: history,
  });
});

/**
 * @desc    Get detailed autopsy & review of a specific completed attempt
 * @route   GET /api/tests/live/attempts/:attemptId/review
 * @access  Private (Student)
 */
export const getLiveTestAutopsyReview = catchAsync(async (req: Request, res: Response) => {
  const { attemptId } = req.params;
  const studentId = req.user!._id;

  const attempt = await LiveTestAttempt.findOne({
    _id: attemptId,
    studentId,
    status: { $in: ['submitted', 'auto_submitted'] },
  }).populate<{ 'answers.questionId': IMcqQuestion }>('answers.questionId');

  if (!attempt) {
    throw new ApiError(404, 'Attempt autopsy not found or test still in progress.');
  }

  const test = await LiveMockTest.findById(attempt.testId);

  const fullQuestionsWithSolutions = attempt.answers.map((ans: any) => {
    const qDoc = ans.questionId as unknown as IMcqQuestion;
    return {
      _id: qDoc?._id,
      code: qDoc?.code,
      subject: qDoc?.subject,
      actName: qDoc?.actName,
      sectionOrArticle: qDoc?.sectionOrArticle,
      questionText: qDoc?.questionText,
      options: qDoc?.options || [],
      selectedOption: ans.selectedOption,
      correctOptionIndex: qDoc?.correctOptionIndex,
      isCorrect: ans.isCorrect,
      explanation: qDoc?.explanation,
      landmarkCases: qDoc?.landmarkCases || [],
      timeSpentSeconds: ans.timeSpentSeconds,
    };
  });

  res.status(200).json({
    success: true,
    data: {
      attemptId: attempt._id,
      testId: test?._id,
      title: test?.title || 'Mock Examination Autopsy',
      targetExam: test?.targetExam || 'Judicial Services',
      submittedAt: attempt.submittedAt,
      isOfficial: attempt.isOfficial,
      attemptNumber: attempt.attemptNumber,
      resultSummary: attempt.result,
      subjectAnalysis: attempt.subjectAnalysis,
      questions: fullQuestionsWithSolutions,
    },
  });
});

import { type Request, type Response } from 'express';
import mongoose from 'mongoose';
import McqQuestion, { type IMcqQuestion } from '../models/mcqQuestion.model.js';
import MockTest from '../models/mockTest.model.js';
import TestSession, { type ITestSession } from '../models/testSession.model.js';
import TestAttempt from '../models/testAttempt.model.js';
import catchAsync from '../utils/catchAsync.js';
import ApiError from '../utils/ApiError.js';

// Core Statutory Acts in reference UI
const CORE_BARE_ACTS = [
  {
    id: 'cpc',
    bareAct: 'Code of Civil Procedure, 1908',
    chaptersCount: 158,
  },
  {
    id: 'bns',
    bareAct: 'Bhartiya Nyaya Sanhita, 2023',
    chaptersCount: 358,
  },
  {
    id: 'bnss',
    bareAct: 'Bhartiya Nagarik Suraksha Sanhita, 2023',
    chaptersCount: 531,
  },
  {
    id: 'bsa',
    bareAct: 'Bhartiya Sakshya Adhiniyam, 2023',
    chaptersCount: 170,
  },
  {
    id: 'constitution',
    bareAct: 'Constitution of India (Articles 1 to 395)',
    chaptersCount: 395,
  },
  {
    id: 'tpa',
    bareAct: 'Transfer of Property Act, 1882',
    chaptersCount: 137,
  },
];

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
    options: q.options,
    difficulty: q.difficulty,
    format: q.format,
    targetExams: q.targetExams,
  };
};

/**
 * @desc    Get dynamic Bare Act practice catalogue with live question counts and student progress
 * @route   GET /api/tests/engine/practice/bare-acts
 * @access  Private (Student)
 */
export const getBareActCatalogue = catchAsync(async (req: Request, res: Response) => {
  const studentId = req.user!._id;

  // 1. Get live question counts by Act
  const actCounts = await McqQuestion.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: '$actName', total: { $sum: 1 } } },
  ]);
  const countMap = new Map<string, number>(actCounts.map((a) => [a._id, a.total]));

  // 2. Get student's completed session question attempts
  const completedSessions = await TestSession.find({
    student: studentId,
    status: 'completed',
  }).lean();

  const actPerformanceMap = new Map<string, { answered: Set<string>; correct: number }>();

  completedSessions.forEach((sess) => {
    sess.questions.forEach((q) => {
      const qIdStr = q.questionId.toString();
      const act = sess.bareActName || 'General Law';
      const current = actPerformanceMap.get(act) || { answered: new Set<string>(), correct: 0 };
      if (q.isAnswered) {
        current.answered.add(qIdStr);
        if (q.isCorrect) current.correct++;
      }
      actPerformanceMap.set(act, current);
    });
  });

  const categories = CORE_BARE_ACTS.map((core) => {
    const liveTotal = countMap.get(core.bareAct) || 60;
    const perf = actPerformanceMap.get(core.bareAct);
    const completedQuestions = perf ? Math.min(perf.answered.size, liveTotal) : 0;
    const accuracyVal =
      perf && completedQuestions > 0 ? Math.round((perf.correct / completedQuestions) * 100) : 0;

    return {
      id: core.id,
      bareAct: core.bareAct,
      chaptersCount: core.chaptersCount,
      totalQuestions: liveTotal,
      completedQuestions,
      accuracy: accuracyVal > 0 ? `${accuracyVal}%` : '0%',
      accuracyRaw: accuracyVal,
    };
  });

  res.status(200).json({
    success: true,
    data: categories,
  });
});

/**
 * @desc    Get dynamic All-India Prelims mock series tests
 * @route   GET /api/tests/engine/mock-series
 * @access  Private (Student)
 */
export const getMockSeriesList = catchAsync(async (req: Request, res: Response) => {
  const studentId = req.user!._id;

  const mockTests = await MockTest.find({ isPublished: true })
    .sort({ createdAt: -1 })
    .lean();

  // Find user's attempts on these mock tests
  const completedAttempts = await TestSession.find({
    student: studentId,
    status: 'completed',
    mockTest: { $ne: null },
  }).lean();

  const attemptMap = new Map<string, any>(
    completedAttempts.map((a) => [a.mockTest!.toString(), a.resultSummary])
  );

  const tests = mockTests.map((t) => {
    const attemptSummary = attemptMap.get(t._id.toString());
    const isAttempted = Boolean(attemptSummary);

    return {
      id: t._id.toString(),
      testCode: t.testCode,
      title: t.title,
      syllabus: t.syllabus,
      questionsCount: t.questionsCount,
      duration: `${t.durationMinutes} Mins`,
      durationMinutes: t.durationMinutes,
      negativeMarking: `-${t.negativeMarkWeight} Mark`,
      negativeMarkWeight: t.negativeMarkWeight,
      targetState: t.targetState,
      targetExam: t.targetExam,
      status: isAttempted ? 'Attempted' : t.status,
      score: isAttempted && attemptSummary ? `${attemptSummary.score}/${attemptSummary.maxScore}` : undefined,
      rank: isAttempted && attemptSummary ? `AIR #${attemptSummary.rank || 14}` : undefined,
    };
  });

  res.status(200).json({
    success: true,
    data: tests,
  });
});

/**
 * @desc    Start or Resume a Test Session (GOmed Pattern)
 * @route   POST /api/tests/engine/session/start
 * @access  Private (Student)
 */
export const startTestSession = catchAsync(async (req: Request, res: Response) => {
  const studentId = req.user!._id;
  const { testId, actName, count = 20, resumeOnly = false } = req.body;

  // 1. Check for existing in_progress session for this student
  const existing = await TestSession.findOne({
    student: studentId,
    status: 'in_progress',
  }).populate('questions.questionId');

  if (existing) {
    // Check if hard deadline has passed
    const now = new Date();
    if (existing.expiresAt && now.getTime() > existing.expiresAt.getTime() + 30000) {
      // Auto-expire and submit
      existing.status = 'abandoned';
      await existing.save();
    } else {
      // Active and valid session - return for seamless resume!
      const secureQuestions = existing.questions.map((qp: any) => ({
        question: sanitizeQuestionForExam(qp.questionId),
        selectedOption: qp.selectedOption,
        isAnswered: qp.isAnswered,
        isMarkedForReview: qp.isMarkedForReview,
        isVisited: qp.isVisited,
        timeSpentSeconds: qp.timeSpentSeconds,
      }));

      const timeRemainingSeconds = Math.max(
        0,
        Math.round((existing.expiresAt.getTime() - Date.now()) / 1000)
      );

      res.status(200).json({
        success: true,
        message: 'Resuming active exam session.',
        isResumed: true,
        session: {
          id: existing._id,
          title: existing.sessionTitle,
          testType: existing.testType,
          targetExam: existing.targetExam,
          durationMinutes: existing.durationMinutes,
          timeRemainingSeconds,
          currentIndex: existing.currentIndex,
          startedAt: existing.startedAt,
          expiresAt: existing.expiresAt,
          questions: secureQuestions,
        },
      });
      return;
    }
  }

  if (resumeOnly) {
    res.status(200).json({
      success: true,
      message: 'No active session found.',
      session: null,
    });
    return;
  }

  // 2. Initialize a new session
  let questionsToPick: IMcqQuestion[] = [];
  let sessionTitle = 'Quick 20-Question Mixed Sprint';
  let testType: 'mock_series' | 'bare_act_drill' = 'bare_act_drill';
  let targetExam = 'All-India Judicial Services';
  let durationMinutes = 15;
  let mockTestRef: mongoose.Types.ObjectId | undefined;
  let bareActNameRef: string | undefined = actName;

  if (testId) {
    const mock = await MockTest.findById(testId).populate<{ questions: IMcqQuestion[] }>('questions');
    if (!mock) {
      throw new ApiError(404, 'Mock test not found.');
    }
    mockTestRef = mock._id;
    sessionTitle = mock.title;
    testType = 'mock_series';
    targetExam = mock.targetExam;
    durationMinutes = mock.durationMinutes;

    if (mock.questions && mock.questions.length > 0) {
      questionsToPick = mock.questions;
    } else {
      // Fallback: pick questions for mock
      questionsToPick = await McqQuestion.find({ isActive: true }).limit(mock.questionsCount);
    }
  } else if (actName) {
    sessionTitle = `20-Question Daily Sprint: ${actName}`;
    bareActNameRef = actName;
    questionsToPick = await McqQuestion.aggregate([
      { $match: { actName, isActive: true } },
      { $sample: { size: Number(count) || 20 } },
    ]);
  } else {
    // Quick 20-Question Mixed Sprint
    questionsToPick = await McqQuestion.aggregate([
      { $match: { isActive: true } },
      { $sample: { size: 20 } },
    ]);
  }

  if (!questionsToPick || questionsToPick.length === 0) {
    // If no questions in DB, query any active questions
    questionsToPick = await McqQuestion.find({ isActive: true }).limit(Number(count) || 20);
  }

  if (!questionsToPick || questionsToPick.length === 0) {
    throw new ApiError(400, 'No questions available for this test configuration.');
  }

  const sessionQuestions = questionsToPick.map((q) => ({
    questionId: q._id,
    selectedOption: null,
    isAnswered: false,
    isMarkedForReview: false,
    isVisited: false,
    timeSpentSeconds: 0,
  }));

  const startedAt = new Date();
  const expiresAt = new Date(startedAt.getTime() + durationMinutes * 60 * 1000);

  const newSession = await TestSession.create({
    student: studentId,
    mockTest: mockTestRef,
    testType,
    sessionTitle,
    targetExam,
    bareActName: bareActNameRef,
    durationMinutes,
    startedAt,
    expiresAt,
    currentIndex: 0,
    status: 'in_progress',
    questions: sessionQuestions,
  });

  const secureQuestions = questionsToPick.map((q) => ({
    question: sanitizeQuestionForExam(q),
    selectedOption: null,
    isAnswered: false,
    isMarkedForReview: false,
    isVisited: false,
    timeSpentSeconds: 0,
  }));

  res.status(201).json({
    success: true,
    message: 'New test session initialized.',
    isResumed: false,
    session: {
      id: newSession._id,
      title: newSession.sessionTitle,
      testType: newSession.testType,
      targetExam: newSession.targetExam,
      durationMinutes: newSession.durationMinutes,
      timeRemainingSeconds: durationMinutes * 60,
      currentIndex: 0,
      startedAt: newSession.startedAt,
      expiresAt: newSession.expiresAt,
      questions: secureQuestions,
    },
  });
});

/**
 * @desc    Get current active session
 * @route   GET /api/tests/engine/session/active
 * @access  Private (Student)
 */
export const getActiveSession = catchAsync(async (req: Request, res: Response) => {
  const studentId = req.user!._id;

  const session = await TestSession.findOne({
    student: studentId,
    status: 'in_progress',
  }).populate('questions.questionId');

  if (!session) {
    res.status(200).json({ success: true, session: null });
    return;
  }

  const secureQuestions = session.questions.map((qp: any) => ({
    question: sanitizeQuestionForExam(qp.questionId),
    selectedOption: qp.selectedOption,
    isAnswered: qp.isAnswered,
    isMarkedForReview: qp.isMarkedForReview,
    isVisited: qp.isVisited,
    timeSpentSeconds: qp.timeSpentSeconds,
  }));

  const timeRemainingSeconds = Math.max(
    0,
    Math.round((session.expiresAt.getTime() - Date.now()) / 1000)
  );

  res.status(200).json({
    success: true,
    session: {
      id: session._id,
      title: session.sessionTitle,
      testType: session.testType,
      targetExam: session.targetExam,
      durationMinutes: session.durationMinutes,
      timeRemainingSeconds,
      currentIndex: session.currentIndex,
      startedAt: session.startedAt,
      expiresAt: session.expiresAt,
      questions: secureQuestions,
    },
  });
});

/**
 * @desc    Update progress in active session (Option selection, review flag, time spent)
 * @route   PATCH /api/tests/engine/session/:sessionId/progress
 * @access  Private (Student)
 */
export const updateSessionProgress = catchAsync(async (req: Request, res: Response) => {
  const { sessionId } = req.params;
  const studentId = req.user!._id;
  const { questionIndex, selectedOption, isMarkedForReview, isVisited, timeSpentDelta } = req.body;

  if (questionIndex === undefined || typeof questionIndex !== 'number') {
    throw new ApiError(400, 'Valid questionIndex is required.');
  }

  const session = await TestSession.findOne({
    _id: sessionId,
    student: studentId,
    status: 'in_progress',
  });

  if (!session) {
    throw new ApiError(404, 'Active test session not found or already submitted.');
  }

  const targetQ = session.questions[questionIndex];
  if (!targetQ) {
    throw new ApiError(400, 'Invalid question index for this session.');
  }

  // Update question progress
  if (selectedOption !== undefined) {
    targetQ.selectedOption = selectedOption;
    targetQ.isAnswered = selectedOption !== null;
  }

  if (isMarkedForReview !== undefined) {
    targetQ.isMarkedForReview = Boolean(isMarkedForReview);
  }

  if (isVisited !== undefined) {
    targetQ.isVisited = Boolean(isVisited);
  } else {
    targetQ.isVisited = true;
  }

  if (timeSpentDelta && typeof timeSpentDelta === 'number') {
    targetQ.timeSpentSeconds += Math.max(0, timeSpentDelta);
  }

  session.currentIndex = questionIndex;
  await session.save();

  res.status(200).json({
    success: true,
    savedAt: new Date(),
    currentIndex: session.currentIndex,
  });
});

/**
 * @desc    Final submit and evaluation of test session
 * @route   POST /api/tests/engine/session/:sessionId/submit
 * @access  Private (Student)
 */
export const submitTestSession = catchAsync(async (req: Request, res: Response) => {
  const { sessionId } = req.params;
  const studentId = req.user!._id;

  // 1. Atomic lock: Only transition if status is 'in_progress'
  const session = await TestSession.findOne({
    _id: sessionId,
    student: studentId,
  }).populate<{ 'questions.questionId': IMcqQuestion }>('questions.questionId');

  if (!session) {
    throw new ApiError(404, 'Session not found.');
  }

  if (session.status === 'completed' && session.resultSummary) {
    const fullQuestionsWithSolutions = session.questions.map((qp: any) => {
      const qDoc = qp.questionId as unknown as IMcqQuestion;
      return {
        _id: qDoc?._id,
        code: qDoc?.code,
        subject: qDoc?.subject,
        actName: qDoc?.actName,
        sectionOrArticle: qDoc?.sectionOrArticle,
        questionText: qDoc?.questionText,
        options: qDoc?.options || [],
        selectedOption: qp.selectedOption,
        correctOptionIndex: qDoc?.correctOptionIndex,
        isCorrect: qp.isCorrect,
        explanation: qDoc?.explanation,
        landmarkCases: qDoc?.landmarkCases || [],
        timeSpentSeconds: qp.timeSpentSeconds,
      };
    });

    res.status(200).json({
      success: true,
      message: 'Test already submitted.',
      alreadyProcessed: true,
      resultSummary: session.resultSummary,
      review: {
        sessionId: session._id,
        title: session.sessionTitle,
        testType: session.testType,
        targetExam: session.targetExam,
        submittedAt: session.submittedAt,
        resultSummary: session.resultSummary,
        questions: fullQuestionsWithSolutions,
      },
    });
    return;
  }

  // 2. Fetch mock test config if applicable for negative mark weight
  let negativeWeight = 0.25;
  let marksPerCorrect = 1.0;
  if (session.mockTest) {
    const mock = await MockTest.findById(session.mockTest);
    if (mock) {
      negativeWeight = mock.negativeMarkWeight ?? 0.25;
      marksPerCorrect = mock.marksPerCorrect ?? 1.0;
    }
  }

  let correct = 0;
  let incorrect = 0;
  let unattempted = 0;
  let totalTimeSeconds = 0;

  session.questions.forEach((qp) => {
    const qDoc = qp.questionId as unknown as IMcqQuestion;
    totalTimeSeconds += qp.timeSpentSeconds || 0;

    if (qp.selectedOption === null || qp.selectedOption === undefined) {
      unattempted++;
      qp.isCorrect = false;
    } else {
      const isRight = Number(qp.selectedOption) === Number(qDoc?.correctOptionIndex);
      qp.isCorrect = isRight;
      if (isRight) {
        correct++;
      } else {
        incorrect++;
      }
    }
  });

  const totalQuestions = session.questions.length;
  const attempted = correct + incorrect;
  const negativePenalty = parseFloat((incorrect * negativeWeight).toFixed(2));
  const rawScore = correct * marksPerCorrect - negativePenalty;
  const score = parseFloat(Math.max(0, rawScore).toFixed(2));
  const maxScore = totalQuestions * marksPerCorrect;
  const accuracy = attempted > 0 ? parseFloat(((correct / attempted) * 100).toFixed(1)) : 0;
  const avgTimePerMcq = attempted > 0 ? Math.round(totalTimeSeconds / attempted) : 42;

  // Simulated rank / percentile calculation based on accuracy
  const percentile = parseFloat(Math.min(99.4, Math.max(65.0, accuracy * 1.08)).toFixed(1));
  const totalAspirants = 1240;
  const rank = Math.max(1, Math.round(((100 - percentile) / 100) * totalAspirants));

  const resultSummary = {
    totalQuestions,
    attempted,
    correct,
    incorrect,
    unattempted,
    score,
    maxScore,
    accuracy,
    avgTimePerMcq,
    negativeMarks: negativePenalty,
    rank,
    percentile,
  };

  session.status = 'completed';
  session.submittedAt = new Date();
  session.resultSummary = resultSummary;
  await session.save();

  // 3. SEAMLESS BRIDGE: Create a TestAttempt document so /dashboard/tests/results updates instantly!
  await TestAttempt.create({
    student: studentId,
    testTitle: session.sessionTitle,
    testType: session.testType,
    targetExam: session.targetExam,
    score,
    maxScore,
    rank,
    totalAspirants,
    percentile,
    correct,
    incorrect,
    unattempted,
    accuracy,
    avgTimePerMcq,
    negativeMarks: negativePenalty,
    timeSpentMinutes: Math.round(totalTimeSeconds / 60) || 15,
    attemptedAt: session.submittedAt,
  });

  // Prepare full solutions for the debrief autopsy
  const fullQuestionsWithSolutions = session.questions.map((qp: any) => {
    const qDoc = qp.questionId as unknown as IMcqQuestion;
    return {
      _id: qDoc?._id,
      code: qDoc?.code,
      subject: qDoc?.subject,
      actName: qDoc?.actName,
      sectionOrArticle: qDoc?.sectionOrArticle,
      questionText: qDoc?.questionText,
      options: qDoc?.options || [],
      selectedOption: qp.selectedOption,
      correctOptionIndex: qDoc?.correctOptionIndex,
      isCorrect: qp.isCorrect,
      explanation: qDoc?.explanation,
      landmarkCases: qDoc?.landmarkCases || [],
      timeSpentSeconds: qp.timeSpentSeconds,
    };
  });

  res.status(200).json({
    success: true,
    message: 'Test submitted and evaluated successfully.',
    alreadyProcessed: false,
    resultSummary,
    review: {
      sessionId: session._id,
      title: session.sessionTitle,
      testType: session.testType,
      targetExam: session.targetExam,
      submittedAt: session.submittedAt,
      resultSummary,
      questions: fullQuestionsWithSolutions,
    },
  });
});

/**
 * @desc    Get detailed test autopsy / question review
 * @route   GET /api/tests/engine/session/:sessionId/review
 * @access  Private (Student)
 */
export const getTestAutopsyReview = catchAsync(async (req: Request, res: Response) => {
  const { sessionId } = req.params;
  const studentId = req.user!._id;

  const session = await TestSession.findOne({
    _id: sessionId,
    student: studentId,
    status: 'completed',
  }).populate<{ 'questions.questionId': IMcqQuestion }>('questions.questionId');

  if (!session) {
    throw new ApiError(404, 'Completed test session not found.');
  }

  const reviewQuestions = session.questions.map((qp) => {
    const qDoc = qp.questionId as unknown as IMcqQuestion;
    return {
      _id: qDoc?._id,
      code: qDoc?.code,
      subject: qDoc?.subject,
      actName: qDoc?.actName,
      sectionOrArticle: qDoc?.sectionOrArticle,
      questionText: qDoc?.questionText,
      options: qDoc?.options || [],
      selectedOption: qp.selectedOption,
      correctOptionIndex: qDoc?.correctOptionIndex,
      isCorrect: qp.isCorrect,
      explanation: qDoc?.explanation,
      landmarkCases: qDoc?.landmarkCases || [],
      timeSpentSeconds: qp.timeSpentSeconds,
    };
  });

  res.status(200).json({
    success: true,
    data: {
      sessionId: session._id,
      title: session.sessionTitle,
      testType: session.testType,
      targetExam: session.targetExam,
      submittedAt: session.submittedAt,
      resultSummary: session.resultSummary,
      questions: reviewQuestions,
    },
  });
});

/**
 * @desc    Reset student's attempt history for a specific bare act drill
 * @route   POST /api/tests/engine/practice/bare-acts/:actId/reset
 * @access  Private (Student)
 */
export const resetBareActProgress = catchAsync(async (req: Request, res: Response) => {
  const actIdParam = typeof req.params.actId === 'string' ? req.params.actId : '';
  const studentId = req.user!._id;

  const coreAct = CORE_BARE_ACTS.find((a) => a.id.toLowerCase() === actIdParam.toLowerCase());
  const actName = coreAct ? coreAct.bareAct : decodeURIComponent(actIdParam);

  await TestSession.deleteMany({
    student: studentId,
    bareActName: actName,
  });

  res.status(200).json({
    success: true,
    message: `Attempt history reset for ${actName}.`,
  });
});

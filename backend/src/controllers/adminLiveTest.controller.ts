import { type Request, type Response } from 'express';
import LiveMockTest from '../models/liveMockTest.model.js';
import LiveTestAttempt from '../models/liveTestAttempt.model.js';
import McqQuestion from '../models/mcqQuestion.model.js';
import { refreshLiveLeaderboardRanks } from './liveMockTest.controller.js';
import catchAsync from '../utils/catchAsync.js';
import ApiError from '../utils/ApiError.js';

/**
 * @desc    Get all mock tests for admin management
 * @route   GET /api/tests/admin/live-tests
 * @access  Private (Admin)
 */
export const getAdminLiveTests = catchAsync(async (req: Request, res: Response) => {
  const tests = await LiveMockTest.find()
    .sort({ createdAt: -1 })
    .lean();

  const testIds = tests.map((t) => t._id);
  const attemptsCount = await LiveTestAttempt.aggregate([
    { $match: { testId: { $in: testIds }, status: { $in: ['submitted', 'auto_submitted'] } } },
    { $group: { _id: '$testId', totalAttempts: { $sum: 1 }, avgScore: { $avg: '$result.score' } } },
  ]);

  const countMap = new Map(attemptsCount.map((c) => [c._id.toString(), c]));

  const data = tests.map((t) => {
    const stats = countMap.get(t._id.toString());
    return {
      ...t,
      stats: {
        totalRegistered: t.stats?.totalRegistered || 0,
        totalAttempted: stats?.totalAttempts || t.stats?.totalAttempted || 0,
        avgScore: stats ? parseFloat(stats.avgScore.toFixed(1)) : t.stats?.avgScore || 0,
        topScore: t.stats?.topScore || 0,
      },
    };
  });

  res.status(200).json({
    success: true,
    data,
  });
});

/**
 * @desc    Create and schedule a new live mock test
 * @route   POST /api/tests/admin/live-tests
 * @access  Private (Admin)
 */
export const createAdminLiveTest = catchAsync(async (req: Request, res: Response) => {
  const adminId = req.user!._id;
  const {
    testCode,
    title,
    targetExam,
    targetState,
    syllabus,
    windowStart,
    windowEnd,
    durationMinutes = 120,
    questionsCount = 100,
    maxScore = 100,
    marksPerCorrect = 1.0,
    negativeMarkWeight = 0.25,
    difficulty = 'medium',
    questionIds = [],
    sections = [],
  } = req.body;

  if (!testCode || !title || !windowStart || !windowEnd) {
    throw new ApiError(400, 'testCode, title, windowStart, and windowEnd are required.');
  }

  // Validate dates
  const start = new Date(windowStart);
  const end = new Date(windowEnd);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
    throw new ApiError(400, 'windowEnd must be strictly after windowStart.');
  }

  // If questionIds not provided, randomly pick from McqQuestion
  let finalQuestionIds = questionIds;
  if (!finalQuestionIds || finalQuestionIds.length === 0) {
    const mcqs = await McqQuestion.find({ isActive: true }).limit(Number(questionsCount)).select('_id');
    finalQuestionIds = mcqs.map((m) => m._id);
  }

  const newTest = await LiveMockTest.create({
    testCode: testCode.trim(),
    title: title.trim(),
    targetExam: targetExam?.trim() || 'All-India Judicial Services',
    targetState: targetState?.trim() || 'All-India',
    syllabus: syllabus?.trim() || 'Core Substantive and Procedural Laws',
    windowStart: start,
    windowEnd: end,
    durationMinutes: Number(durationMinutes),
    questionsCount: finalQuestionIds.length,
    maxScore: Number(maxScore),
    marksPerCorrect: Number(marksPerCorrect),
    negativeMarkWeight: Number(negativeMarkWeight),
    difficulty,
    questions: finalQuestionIds,
    sections,
    status: new Date() >= start && new Date() <= end ? 'live' : new Date() < start ? 'scheduled' : 'closed',
    isPublished: true,
    createdBy: adminId,
  });

  res.status(201).json({
    success: true,
    message: 'Live Mock Test scheduled successfully.',
    data: newTest,
  });
});

/**
 * @desc    Update an existing live mock test
 * @route   PUT /api/tests/admin/live-tests/:id
 * @access  Private (Admin)
 */
export const updateAdminLiveTest = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;

  const test = await LiveMockTest.findById(id);
  if (!test) {
    throw new ApiError(404, 'Live mock test not found.');
  }

  Object.assign(test, updates);
  await test.save();

  res.status(200).json({
    success: true,
    message: 'Live mock test updated successfully.',
    data: test,
  });
});

/**
 * @desc    Toggle publication state
 * @route   POST /api/tests/admin/live-tests/:id/publish
 * @access  Private (Admin)
 */
export const togglePublishAdminLiveTest = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const test = await LiveMockTest.findById(id);
  if (!test) {
    throw new ApiError(404, 'Live mock test not found.');
  }

  test.isPublished = !test.isPublished;
  await test.save();

  res.status(200).json({
    success: true,
    message: `Test is now ${test.isPublished ? 'Published' : 'Unpublished'}.`,
    isPublished: test.isPublished,
  });
});

/**
 * @desc    Freeze leaderboard and finalize ranks
 * @route   POST /api/tests/admin/live-tests/:id/freeze
 * @access  Private (Admin)
 */
export const freezeLeaderboardAdminLiveTest = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const test = await LiveMockTest.findById(id);
  if (!test) {
    throw new ApiError(404, 'Live mock test not found.');
  }

  test.isLeaderboardFrozen = !test.isLeaderboardFrozen;
  await test.save();

  // Re-compute final ranks if frozen
  if (test.isLeaderboardFrozen) {
    await refreshLiveLeaderboardRanks(test._id);
  }

  res.status(200).json({
    success: true,
    message: test.isLeaderboardFrozen ? 'Leaderboard frozen and ranks finalized.' : 'Leaderboard unfrozen.',
    isLeaderboardFrozen: test.isLeaderboardFrozen,
  });
});

/**
 * @desc    Get candidate attempts for a specific test (Admin monitoring)
 * @route   GET /api/tests/admin/live-tests/:id/attempts
 * @access  Private (Admin)
 */
export const getAdminLiveTestAttempts = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const attempts = await LiveTestAttempt.find({ testId: id })
    .sort({ 'result.score': -1, submittedAt: 1 })
    .populate('studentId', 'name email rollNumber batch shift phone')
    .lean();

  res.status(200).json({
    success: true,
    count: attempts.length,
    data: attempts,
  });
});

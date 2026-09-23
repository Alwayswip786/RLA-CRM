import { type Request, type Response } from 'express';
import TestAttempt from '../models/testAttempt.model.js';
import catchAsync from '../utils/catchAsync.js';
import ApiError from '../utils/ApiError.js';

/**
 * @desc    Get student's test scorecards & latest test analytics
 * @route   GET /api/tests/analytics/my
 * @access  Private (Student)
 */
export const getMyTestAnalytics = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, 'Authentication required to view test analytics.');
  }

  const attempts = await TestAttempt.find({ student: req.user._id })
    .sort({ attemptedAt: -1 })
    .lean();

  const [latest] = attempts;

  if (!latest) {
    res.status(200).json({
      success: true,
      hasAttempts: false,
      totalAttempts: 0,
      latestTest: null,
      reports: [],
      message: 'New student account: Zero mock tests attempted yet.',
    });
    return;
  }

  const topPercent = (100 - latest.percentile).toFixed(1);
  const percentileBand =
    latest.percentile >= 98
      ? `Top 1.5% of ${latest.totalAspirants}+ aspirants`
      : `Top ${topPercent}% of ${latest.totalAspirants}+ aspirants`;

  const latestTest = {
    id: latest._id,
    title: latest.testTitle,
    targetExam: latest.targetExam,
    attemptedAt: latest.attemptedAt,
    rank: latest.rank,
    totalAspirants: latest.totalAspirants,
    percentile: latest.percentile,
    percentileBand,
    score: latest.score,
    maxScore: latest.maxScore,
    scoreFormatted: `${latest.score} / ${latest.maxScore}`,
    accuracy: latest.accuracy,
    accuracyFormatted: `${latest.accuracy}%`,
    avgTimePerMcq: latest.avgTimePerMcq,
    negativeMarks: latest.negativeMarks,
    negativeMarksFormatted: `-${latest.negativeMarks} Pts`,
    correct: latest.correct,
    incorrect: latest.incorrect,
    unattempted: latest.unattempted,
  };

  const reports = attempts.map((t) => ({
    id: t._id,
    title: t.testTitle,
    targetExam: t.targetExam,
    attemptedAt: t.attemptedAt,
    dateFormatted: new Date(t.attemptedAt).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }),
    score: `${t.score} / ${t.maxScore}`,
    scoreRaw: t.score,
    maxScoreRaw: t.maxScore,
    rank: `AIR #${t.rank}`,
    rankRaw: t.rank,
    percentile: `${t.percentile}th`,
    percentileRaw: t.percentile,
    correct: t.correct,
    incorrect: t.incorrect,
    unattempted: t.unattempted,
    accuracy: `${t.accuracy}%`,
    accuracyRaw: t.accuracy,
    avgTimePerMcq: t.avgTimePerMcq,
    negativeMarks: t.negativeMarks,
    negativeMarksFormatted: `-${t.negativeMarks} Pts`,
    timeSpentMinutes: t.timeSpentMinutes,
  }));

  res.status(200).json({
    success: true,
    hasAttempts: true,
    totalAttempts: attempts.length,
    latestTest,
    reports,
  });
});

/**
 * @desc    Record a completed mock test attempt
 * @route   POST /api/tests/analytics/attempts
 * @access  Private (Student)
 */
export const recordTestAttempt = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, 'Authentication required.');
  }

  const {
    testTitle,
    testType = 'mock_series',
    targetExam = 'All-India Judicial Services',
    totalQuestions = 200,
    maxScore = 200,
    correct,
    incorrect,
    unattempted = 0,
    negativeMarkWeight = 0.25,
    avgTimePerMcq = 42,
    timeSpentMinutes = 120,
    attemptedAt,
  } = req.body;

  if (!testTitle || correct === undefined || incorrect === undefined) {
    throw new ApiError(400, 'Test title, correct count, and incorrect count are required.');
  }

  const numCorrect = Number(correct);
  const numIncorrect = Number(incorrect);
  const numUnattempted = Number(unattempted);
  const totalAttempted = numCorrect + numIncorrect;

  // Calculate score
  const negativePenalty = parseFloat((numIncorrect * Number(negativeMarkWeight)).toFixed(2));
  const marksPerQuestion = Number(maxScore) / Number(totalQuestions || 200);
  const rawScore = numCorrect * marksPerQuestion - negativePenalty;
  const score = parseFloat(rawScore.toFixed(2));

  // Calculate accuracy
  const accuracy = totalAttempted > 0 ? parseFloat(((numCorrect / totalAttempted) * 100).toFixed(1)) : 0;

  // Simulated rank / percentile calculation based on accuracy
  const percentile = parseFloat(Math.min(99.4, Math.max(60.0, accuracy * 1.08)).toFixed(1));
  const totalAspirants = 1240;
  const rank = Math.max(1, Math.round(((100 - percentile) / 100) * totalAspirants));

  const attempt = await TestAttempt.create({
    student: req.user._id,
    testTitle: testTitle.trim(),
    testType,
    targetExam,
    score,
    maxScore: Number(maxScore),
    rank,
    totalAspirants,
    percentile,
    correct: numCorrect,
    incorrect: numIncorrect,
    unattempted: numUnattempted,
    accuracy,
    avgTimePerMcq: Number(avgTimePerMcq),
    negativeMarks: negativePenalty,
    timeSpentMinutes: Number(timeSpentMinutes),
    attemptedAt: attemptedAt ? new Date(attemptedAt) : new Date(),
  });

  res.status(201).json({
    success: true,
    attempt,
    message: 'Test attempt recorded successfully.',
  });
});

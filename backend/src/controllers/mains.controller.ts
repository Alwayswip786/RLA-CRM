import { type Request, type Response } from 'express';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import MainsQuestion, { type IMainsFileMetadata } from '../models/mainsQuestion.model.js';
import MainsSubmission, { type IRubricScore } from '../models/mainsSubmission.model.js';
import MainsStreak from '../models/mainsStreak.model.js';
import catchAsync from '../utils/catchAsync.js';
import ApiError from '../utils/ApiError.js';

function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Helper to record and update student Daily Answer Writing streak
 */
async function recordStudentSubmissionStreak(studentId: mongoose.Types.ObjectId): Promise<void> {
  let streakDoc = await MainsStreak.findOne({ student: studentId });
  const now = new Date();

  if (!streakDoc) {
    await MainsStreak.create({
      student: studentId,
      currentStreak: 1,
      longestStreak: 1,
      lastSubmissionDate: now,
      totalSubmissions: 1,
    });
    return;
  }

  const last = streakDoc.lastSubmissionDate ? new Date(streakDoc.lastSubmissionDate) : null;
  if (last) {
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfLast = new Date(last.getFullYear(), last.getMonth(), last.getDate());
    const diffDays = Math.floor((startOfToday.getTime() - startOfLast.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      streakDoc.totalSubmissions += 1;
    } else if (diffDays === 1) {
      streakDoc.currentStreak += 1;
      streakDoc.totalSubmissions += 1;
      if (streakDoc.currentStreak > streakDoc.longestStreak) {
        streakDoc.longestStreak = streakDoc.currentStreak;
      }
    } else {
      streakDoc.currentStreak = 1;
      streakDoc.totalSubmissions += 1;
    }
  } else {
    streakDoc.currentStreak = 1;
    streakDoc.longestStreak = Math.max(streakDoc.longestStreak, 1);
    streakDoc.totalSubmissions += 1;
  }

  streakDoc.lastSubmissionDate = now;
  await streakDoc.save();
}

/**
 * Format deadline countdown string (e.g. "Due in 3h 45m (11:59 PM)")
 */
function formatDeadlineCountdown(deadline?: Date): {
  isPassed: boolean;
  formattedText: string;
  timeString: string;
} {
  if (!deadline) {
    return {
      isPassed: false,
      formattedText: 'No deadline set',
      timeString: 'Ongoing',
    };
  }

  const dl = new Date(deadline);
  const now = new Date();
  const diffMs = dl.getTime() - now.getTime();
  const timeString = dl.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  if (diffMs <= 0) {
    return {
      isPassed: true,
      formattedText: `Deadline Closed (${timeString})`,
      timeString,
    };
  }

  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  let countdownStr = '';
  if (hours > 0) {
    countdownStr = `Due in ${hours}h ${minutes}m (${timeString})`;
  } else {
    countdownStr = `Due in ${minutes}m (${timeString})`;
  }

  return {
    isPassed: false,
    formattedText: countdownStr,
    timeString,
  };
}

// -------------------------------------------------------------
// STUDENT ACTIONS
// -------------------------------------------------------------

/**
 * @desc    Get today's active Mains Question, student's submission & streak
 * @route   GET /api/mains/questions/active or /api/mains/questions/today
 * @access  Private (Student)
 */
export const getActiveQuestion = catchAsync(async (req: Request, res: Response) => {
  // Look for active question or latest scheduled
  let activeQuestion = await MainsQuestion.findOne({
    status: { $in: ['active', 'scheduled'] },
    isActive: true,
  })
    .sort({ challengeDate: -1, createdAt: -1 })
    .lean();

  if (!activeQuestion) {
    activeQuestion = await MainsQuestion.findOne().sort({ challengeDate: -1, createdAt: -1 }).lean();
  }

  if (!activeQuestion) {
    res.status(200).json({
      success: true,
      question: null,
      submission: null,
      streak: null,
      deadlineInfo: null,
      message: 'No active Daily Mains question available at the moment.',
    });
    return;
  }

  // Populate student submission if user is logged in
  let studentSubmission = null;
  let streakDoc = null;

  if (req.user) {
    const [sub, streak] = await Promise.all([
      MainsSubmission.findOne({
        student: req.user._id,
        question: activeQuestion._id,
      })
        .populate('evaluatedBy', 'name salutation')
        .lean(),
      MainsStreak.findOne({ student: req.user._id }).lean(),
    ]);

    studentSubmission = sub;
    streakDoc = streak;
  }

  // Model answer visibility: hide model answer unless published or student evaluated
  const isEvaluated = studentSubmission?.status === 'evaluated';
  const deadlinePassed = activeQuestion.submissionDeadline
    ? new Date() > new Date(activeQuestion.submissionDeadline)
    : false;

  const showModelAnswer =
    activeQuestion.isModelAnswerPublished || isEvaluated || deadlinePassed;

  const sanitizedQuestion = {
    ...activeQuestion,
    modelAnswer: showModelAnswer ? activeQuestion.modelAnswer : undefined,
    modelAnswerPdf: showModelAnswer ? activeQuestion.modelAnswerPdf : undefined,
    isModelAnswerRevealed: showModelAnswer,
  };

  const deadlineInfo = formatDeadlineCountdown(activeQuestion.submissionDeadline);

  res.status(200).json({
    success: true,
    question: sanitizedQuestion,
    submission: studentSubmission,
    streak: streakDoc || { currentStreak: 0, longestStreak: 0, totalSubmissions: 0 },
    deadlineInfo,
  });
});

/**
 * @desc    Get archive of past Daily Mains Challenges
 * @route   GET /api/mains/questions/archive
 * @access  Private (Student)
 */
export const getChallengeArchive = catchAsync(async (req: Request, res: Response) => {
  const { paper, subject, search, page = '1', limit = '12' } = req.query;
  const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 12));
  const skip = (pageNum - 1) * limitNum;

  const filter: Record<string, any> = {
    status: { $in: ['active', 'archived', 'scheduled'] },
  };

  if (paper && paper !== 'all') {
    filter.paper = paper;
  }
  if (subject && subject !== 'all') {
    filter.subject = subject;
  }
  if (search && typeof search === 'string' && search.trim()) {
    const s = search.trim();
    filter.$or = [
      { questionCode: { $regex: s, $options: 'i' } },
      { title: { $regex: s, $options: 'i' } },
      { subject: { $regex: s, $options: 'i' } },
    ];
  }

  const [questions, totalCount] = await Promise.all([
    MainsQuestion.find(filter)
      .sort({ challengeDate: -1, challengeNumber: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    MainsQuestion.countDocuments(filter),
  ]);

  // If user is authenticated, attach their submission status for each challenge
  let questionsWithStatus = questions;
  if (req.user && questions.length > 0) {
    const questionIds = questions.map((q) => q._id);
    const userSubmissions = await MainsSubmission.find({
      student: req.user._id,
      question: { $in: questionIds },
    })
      .select('question status score maxScore submittedAt isLate')
      .lean();

    const submissionMap = new Map<string, any>();
    userSubmissions.forEach((sub) => {
      submissionMap.set(sub.question.toString(), sub);
    });

    questionsWithStatus = questions.map((q) => {
      const sub = submissionMap.get(q._id.toString());
      const deadlinePassed = q.submissionDeadline ? new Date() > new Date(q.submissionDeadline) : false;
      const showModel = q.isModelAnswerPublished || sub?.status === 'evaluated' || deadlinePassed;

      return {
        ...q,
        modelAnswer: showModel ? q.modelAnswer : undefined,
        modelAnswerPdf: showModel ? q.modelAnswerPdf : undefined,
        isModelAnswerRevealed: showModel,
        studentSubmission: sub
          ? {
              status: sub.status,
              score: sub.score,
              maxScore: sub.maxScore,
              submittedAt: sub.submittedAt,
              isLate: sub.isLate,
            }
          : null,
      };
    });
  }

  res.status(200).json({
    success: true,
    totalCount,
    currentPage: pageNum,
    totalPages: Math.ceil(totalCount / limitNum),
    questions: questionsWithStatus,
  });
});

/**
 * @desc    Get single challenge details
 * @route   GET /api/mains/questions/:id
 * @access  Private (Student)
 */
export const getQuestionById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id || typeof id !== 'string' || !mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid question identifier.');
  }

  const question = await MainsQuestion.findById(id).lean();
  if (!question) {
    throw new ApiError(404, 'Mains Question not found.');
  }

  let studentSubmission = null;
  if (req.user) {
    studentSubmission = await MainsSubmission.findOne({
      student: req.user._id,
      question: question._id,
    })
      .populate('evaluatedBy', 'name salutation')
      .lean();
  }

  const isEvaluated = studentSubmission?.status === 'evaluated';
  const deadlinePassed = question.submissionDeadline
    ? new Date() > new Date(question.submissionDeadline)
    : false;
  const showModelAnswer = question.isModelAnswerPublished || isEvaluated || deadlinePassed;

  res.status(200).json({
    success: true,
    question: {
      ...question,
      modelAnswer: showModelAnswer ? question.modelAnswer : undefined,
      modelAnswerPdf: showModelAnswer ? question.modelAnswerPdf : undefined,
      isModelAnswerRevealed: showModelAnswer,
    },
    submission: studentSubmission,
    deadlineInfo: formatDeadlineCountdown(question.submissionDeadline),
  });
});

/**
 * @desc    Submit or Replace student answer copy (PDF or image scans)
 * @route   POST /api/mains/submissions
 * @access  Private (Student)
 */
export const submitAnswerCopy = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, 'Authentication required to submit answer copy.');
  }

  // Collect uploaded files from req.file or req.files
  let uploadedFiles: Express.Multer.File[] = [];
  if (req.file) {
    uploadedFiles.push(req.file);
  } else if (req.files) {
    if (Array.isArray(req.files)) {
      uploadedFiles = req.files;
    } else {
      if (req.files['pdf']) uploadedFiles.push(...req.files['pdf']);
      if (req.files['images']) uploadedFiles.push(...req.files['images']);
      if (req.files['files']) uploadedFiles.push(...req.files['files']);
    }
  }

  if (uploadedFiles.length === 0) {
    throw new ApiError(400, 'Answer copy file is required (scanned PDF or page images).');
  }

  const { questionId, notes } = req.body;
  let targetQuestionId = questionId;

  if (!targetQuestionId) {
    const active = await MainsQuestion.findOne({
      status: { $in: ['active', 'scheduled'] },
      isActive: true,
    }).sort({ challengeDate: -1, createdAt: -1 });

    if (!active) {
      throw new ApiError(400, 'No active Daily Mains question found to submit against.');
    }
    targetQuestionId = active._id;
  }

  const question = await MainsQuestion.findById(targetQuestionId);
  if (!question) {
    throw new ApiError(404, 'Mains Question not found.');
  }

  // Determine file type
  const isPdf = uploadedFiles.some((f) => f.mimetype.toLowerCase() === 'application/pdf');
  const fileType: 'pdf' | 'images' = isPdf ? 'pdf' : 'images';

  const fileMetadataList: IMainsFileMetadata[] = uploadedFiles.map((file) => ({
    filename: file.filename,
    originalName: file.originalname,
    path: file.path,
    mimeType: file.mimetype,
    sizeBytes: file.size,
    sizeFormatted: formatBytes(file.size),
  }));

  const primaryFile = fileMetadataList[0]!;
  const now = new Date();
  const isLate = Boolean(question.submissionDeadline && now > new Date(question.submissionDeadline));

  // Check if student already has a submission
  let existingSubmission = await MainsSubmission.findOne({
    student: req.user._id,
    question: question._id,
  });

  let savedSubmission;
  let isReplacement = false;

  if (existingSubmission) {
    if (existingSubmission.status === 'evaluated') {
      throw new ApiError(
        400,
        'Your answer copy has already been evaluated by faculty and cannot be replaced.'
      );
    }

    // Versioned Resubmission / Replacement
    isReplacement = true;
    existingSubmission.revisionHistory.push({
      version: existingSubmission.version,
      fileType: existingSubmission.fileType,
      files: existingSubmission.files,
      notes: existingSubmission.notes,
      submittedAt: existingSubmission.submittedAt,
    });

    existingSubmission.version += 1;
    existingSubmission.fileType = fileType;
    existingSubmission.files = fileMetadataList;
    existingSubmission.studentPdf = primaryFile;
    existingSubmission.notes = (notes || '').trim();
    existingSubmission.submittedAt = now;
    existingSubmission.isLate = isLate;
    existingSubmission.status = 'pending';

    savedSubmission = await existingSubmission.save();
  } else {
    // Brand new initial submission
    savedSubmission = await MainsSubmission.create({
      student: req.user._id,
      question: question._id,
      version: 1,
      fileType,
      files: fileMetadataList,
      studentPdf: primaryFile,
      notes: (notes || '').trim(),
      status: 'pending',
      submittedAt: now,
      isLate,
    });

    // Increment question total submission counter
    await MainsQuestion.findByIdAndUpdate(question._id, {
      $inc: { totalSubmissionsCount: 1 },
    });

    // Update student streak
    await recordStudentSubmissionStreak(req.user._id);
  }

  const populated = await MainsSubmission.findById(savedSubmission._id)
    .populate('question', 'challengeNumber questionCode title subject paper marks wordLimit')
    .lean();

  const successMessage = isReplacement
    ? `Answer copy v${savedSubmission.version} replaced successfully! Previous copy saved to revision history.`
    : 'Mains Answer Copy uploaded successfully! Assigned to Adv. Rajinder Sir for evaluation.';

  res.status(isReplacement ? 200 : 201).json({
    success: true,
    submission: populated,
    isReplacement,
    version: savedSubmission.version,
    isLate,
    message: successMessage,
  });
});

/**
 * @desc    Get student's own submissions with streak and scorecard
 * @route   GET /api/mains/submissions/my
 * @access  Private (Student)
 */
export const getMySubmissions = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, 'Authentication required.');
  }

  const { status } = req.query;
  const filter: Record<string, any> = { student: req.user._id };

  if (status && status !== 'all') {
    filter.status = status;
  }

  const [submissions, counts, streak] = await Promise.all([
    MainsSubmission.find(filter)
      .populate('question', 'challengeNumber questionCode title subject paper marks wordLimit submissionDeadline')
      .populate('evaluatedBy', 'name salutation')
      .sort({ evaluatedAt: -1, submittedAt: -1 })
      .lean(),
    MainsSubmission.aggregate([
      { $match: { student: new mongoose.Types.ObjectId(req.user._id.toString()) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]),
    MainsStreak.findOne({ student: req.user._id }).lean(),
  ]);

  let totalCount = 0;
  let pendingCount = 0;
  let evaluatedCount = 0;

  counts.forEach((c) => {
    totalCount += c.count;
    if (c._id === 'pending' || c._id === 'under_review') pendingCount += c.count;
    if (c._id === 'evaluated') evaluatedCount += c.count;
  });

  res.status(200).json({
    success: true,
    submissions,
    counts: {
      total: totalCount,
      pending: pendingCount,
      evaluated: evaluatedCount,
    },
    streak: streak || { currentStreak: 0, longestStreak: 0, totalSubmissions: 0 },
  });
});

/**
 * @desc    Get comparative evaluation autopsy: student copy vs model answer
 * @route   GET /api/mains/submissions/:id/autopsy
 * @access  Private (Student/Faculty)
 */
export const getSubmissionAutopsy = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id || typeof id !== 'string' || !mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid submission identifier.');
  }

  const submission = await MainsSubmission.findById(id)
    .populate('question')
    .populate('student', 'name rollNo email targetExam')
    .populate('evaluatedBy', 'name salutation')
    .lean();

  if (!submission) {
    throw new ApiError(404, 'Mains submission not found.');
  }

  // Security check: owner or admin/faculty
  const isOwner = req.user && req.user._id.toString() === (submission.student as any)?._id?.toString();
  const isStaff = req.user && (req.user.role === 'admin' || req.user.role === 'faculty');

  if (!isOwner && !isStaff) {
    throw new ApiError(403, 'Access denied to this evaluation autopsy.');
  }

  res.status(200).json({
    success: true,
    submission,
  });
});

/**
 * @desc    Stream or download student answer sheet or evaluated copy file
 * @route   GET /api/mains/submissions/:id/pdf or /file
 * @access  Private
 */
export const streamSubmissionPdf = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { type = 'student', fileIndex = '0' } = req.query; // 'student', 'evaluated', or 'model'

  if (!id || typeof id !== 'string' || !mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid submission identifier.');
  }

  const submission = await MainsSubmission.findById(id);
  if (!submission) {
    throw new ApiError(404, 'Mains submission copy not found.');
  }

  // Security check: only student owner or faculty/admin
  const isOwner = req.user && req.user._id.toString() === submission.student.toString();
  const isStaff = req.user && (req.user.role === 'admin' || req.user.role === 'faculty');

  if (!isOwner && !isStaff) {
    throw new ApiError(403, 'Access denied to this answer copy.');
  }

  let targetFile: IMainsFileMetadata | undefined;

  if (type === 'evaluated') {
    targetFile = submission.evaluatedPdf;
  } else {
    // Student file: check files array or default to studentPdf
    const index = parseInt(fileIndex as string, 10) || 0;
    if (submission.files && submission.files.length > index) {
      targetFile = submission.files[index];
    } else {
      targetFile = submission.studentPdf;
    }
  }

  if (!targetFile || !targetFile.path || !fs.existsSync(targetFile.path)) {
    throw new ApiError(404, 'Requested file not found on academy storage server.');
  }

  const safeFilename = encodeURIComponent(targetFile.originalName);
  res.setHeader('Content-Type', targetFile.mimeType || 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${safeFilename}"`);

  const readStream = fs.createReadStream(targetFile.path);
  readStream.pipe(res);
});

// -------------------------------------------------------------
// FACULTY & ADMIN ACTIONS
// -------------------------------------------------------------

/**
 * @desc    Get pending answer copies waiting for faculty evaluation
 * @route   GET /api/mains/admin/submissions/pending
 * @access  Private (Faculty/Admin)
 */
export const getPendingSubmissionsAdmin = catchAsync(async (req: Request, res: Response) => {
  const { questionId, search } = req.query;
  const filter: Record<string, any> = {
    status: { $in: ['pending', 'under_review'] },
  };

  if (questionId && mongoose.Types.ObjectId.isValid(questionId as string)) {
    filter.question = questionId;
  }

  const submissions = await MainsSubmission.find(filter)
    .populate('student', 'name rollNo email phone targetExam targetState')
    .populate('question', 'challengeNumber questionCode title subject paper marks wordLimit submissionDeadline')
    .sort({ submittedAt: 1 }) // First in, first out
    .lean();

  let filtered = submissions;
  if (search && typeof search === 'string' && search.trim()) {
    const s = search.toLowerCase().trim();
    filtered = submissions.filter((item: any) => {
      return (
        item.student?.name?.toLowerCase().includes(s) ||
        item.student?.rollNo?.toLowerCase().includes(s) ||
        item.question?.questionCode?.toLowerCase().includes(s) ||
        item.question?.title?.toLowerCase().includes(s)
      );
    });
  }

  res.status(200).json({
    success: true,
    count: filtered.length,
    submissions: filtered,
  });
});

/**
 * @desc    Claim submission for evaluation (concurrency lock)
 * @route   POST /api/mains/admin/submissions/:id/claim
 * @access  Private (Faculty/Admin)
 */
export const claimSubmissionAdmin = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id || typeof id !== 'string' || !mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid submission ID.');
  }

  const submission = await MainsSubmission.findById(id);
  if (!submission) {
    throw new ApiError(404, 'Mains submission not found.');
  }

  const now = new Date();
  const lockThreshold = 30 * 60 * 1000; // 30 minutes lock
  const isClaimedByOther =
    submission.claimedBy &&
    submission.claimedBy.toString() !== req.user!._id.toString() &&
    submission.claimedAt &&
    now.getTime() - new Date(submission.claimedAt).getTime() < lockThreshold;

  if (isClaimedByOther) {
    throw new ApiError(409, 'This copy is currently being evaluated by another faculty member.');
  }

  submission.claimedBy = req.user!._id;
  submission.claimedAt = now;
  submission.status = 'under_review';
  await submission.save();

  res.status(200).json({
    success: true,
    message: 'Submission locked for evaluation.',
    submission,
  });
});

/**
 * @desc    Submit evaluation marks, rubric scores, feedback & annotated copy
 * @route   POST /api/mains/admin/submissions/:id/evaluate
 * @access  Private (Faculty/Admin)
 */
export const evaluateSubmissionAdmin = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    score,
    rubricBreakdown,
    remarks,
    strengths,
    mistakes,
    improvementPoints,
    needsWork,
  } = req.body;

  if (!id || typeof id !== 'string' || !mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid submission ID.');
  }

  const submission = await MainsSubmission.findById(id).populate('question');
  if (!submission) {
    throw new ApiError(404, 'Mains submission not found.');
  }

  const numericScore = parseFloat(score);
  if (isNaN(numericScore) || numericScore < 0) {
    throw new ApiError(400, 'Valid numeric score is required.');
  }

  // Parse rubric breakdown if provided
  let parsedRubrics: IRubricScore[] = [];
  if (rubricBreakdown) {
    if (typeof rubricBreakdown === 'string') {
      try {
        parsedRubrics = JSON.parse(rubricBreakdown);
      } catch {
        parsedRubrics = [];
      }
    } else if (Array.isArray(rubricBreakdown)) {
      parsedRubrics = rubricBreakdown;
    }
  }

  submission.score = numericScore;
  submission.maxScore = (submission.question as any)?.marks || 15;
  submission.rubricBreakdown = parsedRubrics;
  submission.remarks = (remarks || '').trim();
  submission.strengths = (strengths || '').trim();
  submission.mistakes = (mistakes || '').trim();
  submission.improvementPoints = (improvementPoints || '').trim();
  submission.needsWork = (needsWork || '').trim();
  submission.status = 'evaluated';
  submission.evaluatedAt = new Date();
  submission.evaluatedBy = req.user?._id;
  submission.claimedBy = undefined;
  submission.claimedAt = undefined;

  // If faculty uploaded an annotated/marked PDF
  if (req.file) {
    submission.evaluatedPdf = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: req.file.path,
      mimeType: req.file.mimetype,
      sizeBytes: req.file.size,
      sizeFormatted: formatBytes(req.file.size),
    };
  }

  await submission.save();

  // Increment question evaluated count
  if (submission.question) {
    const totalEval = await MainsSubmission.countDocuments({
      question: (submission.question as any)._id,
      status: 'evaluated',
    });
    await MainsQuestion.findByIdAndUpdate((submission.question as any)._id, {
      evaluatedCount: totalEval,
    });
  }

  const populated = await MainsSubmission.findById(submission._id)
    .populate('student', 'name rollNo email')
    .populate('question', 'challengeNumber questionCode title subject paper marks')
    .populate('evaluatedBy', 'name salutation')
    .lean();

  res.status(200).json({
    success: true,
    submission: populated,
    message: 'Evaluated copy returned and synchronized with Student Portal.',
  });
});

/**
 * @desc    Get graded archive of evaluated student answer copies
 * @route   GET /api/mains/admin/submissions/graded
 * @access  Private (Faculty/Admin)
 */
export const getGradedSubmissionsAdmin = catchAsync(async (req: Request, res: Response) => {
  const { search, questionId } = req.query;
  const query: Record<string, any> = { status: 'evaluated' };

  if (questionId && mongoose.Types.ObjectId.isValid(questionId as string)) {
    query.question = questionId;
  }

  const submissions = await MainsSubmission.find(query)
    .populate('student', 'name rollNo email phone targetExam')
    .populate('question', 'challengeNumber questionCode title subject paper marks')
    .populate('evaluatedBy', 'name salutation')
    .sort({ evaluatedAt: -1 })
    .lean();

  let filtered = submissions;
  if (search && typeof search === 'string' && search.trim()) {
    const s = search.toLowerCase().trim();
    filtered = submissions.filter((item: any) => {
      return (
        item.student?.name?.toLowerCase().includes(s) ||
        item.student?.rollNo?.toLowerCase().includes(s) ||
        item.question?.questionCode?.toLowerCase().includes(s) ||
        item.question?.title?.toLowerCase().includes(s)
      );
    });
  }

  res.status(200).json({
    success: true,
    count: filtered.length,
    submissions: filtered,
  });
});

/**
 * @desc    Create a new Daily Mains question / challenge
 * @route   POST /api/mains/admin/questions
 * @access  Private (Faculty/Admin)
 */
export const createQuestionAdmin = catchAsync(async (req: Request, res: Response) => {
  const {
    challengeNumber,
    questionCode,
    paper = 'Criminal Law & Procedure (Mains)',
    title,
    subject,
    targetExam = 'All-India Judicial Services',
    challengeDate,
    submissionDeadline,
    marks = 15,
    wordLimit = 250,
    turnaroundHours = 24,
    evaluatorName = 'Adv. Rajinder Sir',
    guidelines,
    modelAnswer = '',
    isModelAnswerPublished = false,
    status = 'active',
    isActive = true,
  } = req.body;

  if (!title || !subject) {
    throw new ApiError(400, 'Title problem statement and subject are required.');
  }

  // Auto-generate challenge number if omitted
  let cNum = parseInt(challengeNumber as string, 10);
  if (isNaN(cNum) || cNum <= 0) {
    const highest = await MainsQuestion.findOne().sort({ challengeNumber: -1 }).select('challengeNumber');
    cNum = highest && highest.challengeNumber ? highest.challengeNumber + 1 : 48;
  }

  // Auto-generate question code if omitted
  let qCode = questionCode ? questionCode.trim().toUpperCase() : `DAW-2026-${String(cNum).padStart(3, '0')}`;

  // If new question is active, unflag older active questions
  if (status === 'active' || isActive) {
    await MainsQuestion.updateMany({ isActive: true }, { $set: { isActive: false } });
  }

  // Parse guidelines
  let parsedGuidelines: string[] = [];
  if (guidelines) {
    if (Array.isArray(guidelines)) {
      parsedGuidelines = guidelines;
    } else if (typeof guidelines === 'string') {
      try {
        parsedGuidelines = JSON.parse(guidelines);
      } catch {
        parsedGuidelines = guidelines.split('\n').map((g) => g.trim()).filter(Boolean);
      }
    }
  }

  // Handle optional modelAnswerPdf file
  let modelAnswerPdf: IMainsFileMetadata | undefined;
  if (req.file) {
    modelAnswerPdf = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: req.file.path,
      mimeType: req.file.mimetype,
      sizeBytes: req.file.size,
      sizeFormatted: formatBytes(req.file.size),
    };
  }

  const question = await MainsQuestion.create({
    challengeNumber: cNum,
    questionCode: qCode,
    paper: paper.trim(),
    title: title.trim(),
    subject: subject.trim(),
    targetExam: targetExam.trim(),
    challengeDate: challengeDate ? new Date(challengeDate) : new Date(),
    submissionDeadline: submissionDeadline ? new Date(submissionDeadline) : undefined,
    marks: Number(marks),
    wordLimit: Number(wordLimit),
    turnaroundHours: Number(turnaroundHours),
    evaluatorName: evaluatorName.trim(),
    guidelines: parsedGuidelines,
    modelAnswer,
    modelAnswerPdf,
    isModelAnswerPublished: Boolean(isModelAnswerPublished === true || isModelAnswerPublished === 'true'),
    status: status || 'active',
    isActive: Boolean(isActive === true || isActive === 'true'),
    publishedAt: new Date(),
    createdBy: req.user?._id,
  });

  res.status(201).json({
    success: true,
    question,
    message: `Daily Mains Challenge #${cNum} created successfully.`,
  });
});

/**
 * @desc    Update Daily Mains question / challenge
 * @route   PUT /api/mains/admin/questions/:id
 * @access  Private (Faculty/Admin)
 */
export const updateQuestionAdmin = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id || typeof id !== 'string' || !mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid question ID.');
  }

  const question = await MainsQuestion.findById(id);
  if (!question) {
    throw new ApiError(404, 'Mains Question not found.');
  }

  const {
    challengeNumber,
    questionCode,
    paper,
    title,
    subject,
    targetExam,
    challengeDate,
    submissionDeadline,
    marks,
    wordLimit,
    turnaroundHours,
    evaluatorName,
    guidelines,
    modelAnswer,
    isModelAnswerPublished,
    status,
    isActive,
  } = req.body;

  if (challengeNumber !== undefined) question.challengeNumber = Number(challengeNumber);
  if (questionCode !== undefined) question.questionCode = questionCode.trim().toUpperCase();
  if (paper !== undefined) question.paper = paper.trim();
  if (title !== undefined) question.title = title.trim();
  if (subject !== undefined) question.subject = subject.trim();
  if (targetExam !== undefined) question.targetExam = targetExam.trim();
  if (challengeDate !== undefined) question.challengeDate = new Date(challengeDate);
  if (submissionDeadline !== undefined) question.submissionDeadline = submissionDeadline ? new Date(submissionDeadline) : undefined;
  if (marks !== undefined) question.marks = Number(marks);
  if (wordLimit !== undefined) question.wordLimit = Number(wordLimit);
  if (turnaroundHours !== undefined) question.turnaroundHours = Number(turnaroundHours);
  if (evaluatorName !== undefined) question.evaluatorName = evaluatorName.trim();
  if (modelAnswer !== undefined) question.modelAnswer = modelAnswer;
  if (isModelAnswerPublished !== undefined) {
    question.isModelAnswerPublished = Boolean(isModelAnswerPublished === true || isModelAnswerPublished === 'true');
  }
  if (status !== undefined) question.status = status;
  if (isActive !== undefined) question.isActive = Boolean(isActive === true || isActive === 'true');

  if (guidelines !== undefined) {
    if (Array.isArray(guidelines)) {
      question.guidelines = guidelines;
    } else if (typeof guidelines === 'string') {
      try {
        question.guidelines = JSON.parse(guidelines);
      } catch {
        question.guidelines = guidelines.split('\n').map((g) => g.trim()).filter(Boolean);
      }
    }
  }

  if (req.file) {
    question.modelAnswerPdf = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: req.file.path,
      mimeType: req.file.mimetype,
      sizeBytes: req.file.size,
      sizeFormatted: formatBytes(req.file.size),
    };
  }

  await question.save();

  res.status(200).json({
    success: true,
    question,
    message: 'Question updated successfully.',
  });
});

/**
 * @desc    Delete or Archive Daily Mains question
 * @route   DELETE /api/mains/admin/questions/:id
 * @access  Private (Faculty/Admin)
 */
export const deleteQuestionAdmin = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id || typeof id !== 'string' || !mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid question ID.');
  }

  const question = await MainsQuestion.findById(id);
  if (!question) {
    throw new ApiError(404, 'Mains Question not found.');
  }

  // Soft archive to protect student submission history
  question.status = 'archived';
  question.isActive = false;
  await question.save();

  res.status(200).json({
    success: true,
    message: 'Daily Mains Question archived successfully.',
  });
});

/**
 * @desc    Get all questions in Question Bank
 * @route   GET /api/mains/admin/questions
 * @access  Private (Faculty/Admin)
 */
export const getAllQuestionsAdmin = catchAsync(async (_req: Request, res: Response) => {
  const questions = await MainsQuestion.find()
    .sort({ challengeDate: -1, challengeNumber: -1, createdAt: -1 })
    .lean();

  res.status(200).json({
    success: true,
    count: questions.length,
    questions,
  });
});

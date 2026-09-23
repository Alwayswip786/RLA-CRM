import { type Request, type Response } from 'express';
import mongoose from 'mongoose';
import User from '../models/user.model.js';
import { Course } from '../models/course.model.js';
import MainsSubmission from '../models/mainsSubmission.model.js';
import MainsQuestion from '../models/mainsQuestion.model.js';
import DoubtQuery from '../models/doubtQuery.model.js';
import { LiveClass } from '../models/liveClass.model.js';
import Notice from '../models/notice.model.js';
import AdmissionLead from '../models/admissionLead.model.js';
import StudentFee from '../models/studentFee.model.js';
import { Batch, ClassroomRoom, RecurringScheduleSlot } from '../models/timetable.model.js';
import catchAsync from '../utils/catchAsync.js';
import ApiError from '../utils/ApiError.js';

// Helper: Relative time formatting
const formatRelativeTime = (date?: Date | null): string => {
  if (!date) return 'Just now';
  const now = Date.now();
  const diffMs = now - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} mins ago`;
  if (diffHours === 1) return '1 hour ago';
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays} days ago`;
};

// Helper: Format amount to Lakhs / Crores / Thousands (e.g. 340000 -> ₹3.4L)
const formatAmountInLakhs = (amount: number): string => {
  if (!amount || amount === 0) return '₹0';
  if (amount >= 10000000) {
    const inCr = (amount / 10000000).toFixed(1);
    return `₹${inCr.endsWith('.0') ? inCr.slice(0, -2) : inCr}Cr`;
  }
  if (amount >= 100000) {
    const inLakhs = (amount / 100000).toFixed(1);
    return `₹${inLakhs.endsWith('.0') ? inLakhs.slice(0, -2) : inLakhs}L`;
  }
  return `₹${amount.toLocaleString('en-IN')}`;
};

// Helper: IST (UTC+5:30) date boundaries & timeframe computation
export const getISTDateBoundaries = (timeframe: string = '7d') => {
  const now = new Date();
  const nowUtc = now.getTime();
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const nowIst = new Date(nowUtc + istOffsetMs);

  const todayYear = nowIst.getUTCFullYear();
  const todayMonth = nowIst.getUTCMonth();
  const todayDate = nowIst.getUTCDate();

  // IST Midnight and End of Day translated to UTC
  const todayStart = new Date(Date.UTC(todayYear, todayMonth, todayDate) - istOffsetMs);
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000 - 1);
  const todayDateStr = `${todayYear}-${String(todayMonth + 1).padStart(2, '0')}-${String(todayDate).padStart(2, '0')}`;

  let currentStart: Date;
  const currentEnd: Date = now;
  let previousStart: Date;
  let previousEnd: Date;
  let growthLabel: string;

  if (timeframe === 'today') {
    currentStart = todayStart;
    previousStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
    previousEnd = new Date(todayStart.getTime() - 1);
    growthLabel = 'today';
  } else if (timeframe === '30d') {
    currentStart = new Date(nowUtc - 30 * 24 * 60 * 60 * 1000);
    previousStart = new Date(nowUtc - 60 * 24 * 60 * 60 * 1000);
    previousEnd = currentStart;
    growthLabel = 'this month';
  } else if (timeframe === 'all') {
    currentStart = new Date(0);
    previousStart = new Date(0);
    previousEnd = new Date(0);
    growthLabel = 'total';
  } else {
    // Default: 7 days
    currentStart = new Date(nowUtc - 7 * 24 * 60 * 60 * 1000);
    previousStart = new Date(nowUtc - 14 * 24 * 60 * 60 * 1000);
    previousEnd = currentStart;
    growthLabel = 'this week';
  }

  const twentyFourHoursAgo = new Date(nowUtc - 24 * 60 * 60 * 1000);

  return {
    now,
    todayStart,
    todayEnd,
    todayDateStr,
    currentStart,
    currentEnd,
    previousStart,
    previousEnd,
    growthLabel,
    twentyFourHoursAgo,
  };
};

// In-Memory KPI Cache with TTL
interface DashboardCacheEntry {
  data: any;
  cachedAt: number;
}
const dashboardCache = new Map<string, DashboardCacheEntry>();
const DASHBOARD_CACHE_TTL_MS = 60 * 1000; // 60 seconds

export const invalidateDashboardCache = () => {
  dashboardCache.clear();
};

/**
 * 1. GET /api/admin/dashboard/overview
 * Dynamic unified aggregation for the Admin Executive Dashboard Header & KPI Cards
 */
export const getDashboardOverview = catchAsync(async (req: Request, res: Response) => {
  const adminUser = req.user!;
  const timeframe = (req.query.timeframe as string) || '7d';
  const forceRefresh = req.query.refresh === 'true' || req.query.forceRefresh === 'true';

  const cacheKey = `${adminUser._id?.toString() || 'admin'}_${adminUser.role || 'director'}_${timeframe}`;

  // Return cached result if valid and not a forced refresh
  if (!forceRefresh) {
    const cached = dashboardCache.get(cacheKey);
    if (cached && Date.now() - cached.cachedAt < DASHBOARD_CACHE_TTL_MS) {
      return res.status(200).json({
        status: 'success',
        cached: true,
        data: cached.data,
      });
    }
  }

  // Date boundaries
  const {
    todayStart,
    todayEnd,
    todayDateStr,
    currentStart,
    currentEnd,
    previousStart,
    previousEnd,
    growthLabel,
    twentyFourHoursAgo,
  } = getISTDateBoundaries(timeframe);

  // Parallel Database Lookups
  const [
    totalStudentsCount,
    currentPeriodEnrolledCount,
    previousPeriodEnrolledCount,
    topCourseRecord,
    pendingMainsCount,
    overdueMainsCount,
    activeChallengeRecord,
    leadsCount,
    demosTodayCount,
    hotPipelineCount,
    feeAggregation,
    recentMainsSubmissions,
    unresolvedDoubtsCount,
    recentDoubts,
    todayClasses,
    noticesCount,
    recentNotices,
  ] = await Promise.all([
    // 1. Total Enrolled Students (Active)
    User.countDocuments({ role: 'student', accountStatus: { $ne: 'deactivated' } }),
    // Enrolled in current timeframe
    User.countDocuments({
      role: 'student',
      accountStatus: { $ne: 'deactivated' },
      createdAt: { $gte: currentStart, $lte: currentEnd },
    }),
    // Enrolled in previous timeframe (for trend comparison)
    User.countDocuments({
      role: 'student',
      accountStatus: { $ne: 'deactivated' },
      createdAt: { $gte: previousStart, $lte: previousEnd },
    }),
    // Top primary flagship course
    Course.findOne({ status: 'published' }).sort({ enrolledStudentsCount: -1 }).select('title shortCode'),
    // 2. Pending Mains Copies
    MainsSubmission.countDocuments({ status: { $in: ['pending', 'under_review'] } }),
    // Overdue copies past 24h SLA
    MainsSubmission.countDocuments({
      status: { $in: ['pending', 'under_review'] },
      submittedAt: { $lt: twentyFourHoursAgo },
    }),
    // Active challenge
    MainsQuestion.findOne({ isActive: true })
      .sort({ createdAt: -1 })
      .select('challengeNumber title totalMarks turnaroundHours'),
    // 3. Admissions Inquiries
    AdmissionLead.countDocuments({ stage: { $nin: ['enrolled', 'lost'] } }),
    AdmissionLead.countDocuments({ demoScheduledAt: { $gte: todayStart, $lte: todayEnd } }),
    AdmissionLead.countDocuments({ priority: 'high', stage: { $nin: ['enrolled', 'lost'] } }),
    // 4. Fee Installments Due
    StudentFee.aggregate([
      { $match: { status: { $in: ['Installment Due', 'Overdue'] } } },
      {
        $group: {
          _id: null,
          totalPending: { $sum: '$pendingAmount' },
          overdueCount: {
            $sum: { $cond: [{ $eq: ['$status', 'Overdue'] }, 1, 0] },
          },
          remindersCount: {
            $sum: { $cond: [{ $ifNull: ['$lastReminderSentAt', false] }, 1, 0] },
          },
        },
      },
    ]),
    // 5. Recent Mains Submissions (Top 3)
    MainsSubmission.find({})
      .sort({ submittedAt: -1, createdAt: -1 })
      .limit(3)
      .populate('student', 'name rollNo email phone avatarUrl')
      .populate('question', 'challengeNumber title subject totalMarks')
      .populate('evaluatedBy', 'name salutation')
      .lean(),
    // 6. Faculty Doubts (Unresolved Count & Top 2)
    DoubtQuery.countDocuments({ status: { $in: ['pending', 'under_review'] } }),
    DoubtQuery.find({ status: { $in: ['pending', 'under_review'] } })
      .sort({ createdAt: -1 })
      .limit(2)
      .lean(),
    // 7. Today's Classes (LiveClass)
    LiveClass.find({
      $or: [
        { scheduledDate: todayDateStr },
        { scheduledStartAt: { $gte: todayStart, $lte: todayEnd } },
      ],
    })
      .sort({ startTime: 1 })
      .limit(4)
      .lean(),
    // 8. Notices Count & Recent Notices
    Notice.countDocuments({ isPublished: true }),
    Notice.find({ isPublished: true })
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(3)
      .lean(),
  ]);

  // Secondary metrics & Trend computations
  const enrolledCount = totalStudentsCount;
  const growthCount = currentPeriodEnrolledCount;
  const enrolledGrowth = `+${growthCount} ${growthLabel}`;

  const studentDelta = currentPeriodEnrolledCount - previousPeriodEnrolledCount;
  const studentTrendPercent =
    previousPeriodEnrolledCount > 0
      ? Math.round((Math.abs(studentDelta) / previousPeriodEnrolledCount) * 100)
      : currentPeriodEnrolledCount > 0
      ? 100
      : 0;
  const studentTrendDir: 'up' | 'down' | 'neutral' =
    studentDelta > 0 ? 'up' : studentDelta < 0 ? 'down' : 'neutral';

  const primaryCohort = topCourseRecord?.shortCode || topCourseRecord?.title || 'PCS-J Foundation';

  const pendingCopies = pendingMainsCount;
  const challengeLabel = activeChallengeRecord
    ? `Challenge #${activeChallengeRecord.challengeNumber}`
    : 'Challenge #48';
  const statusLabel = overdueMainsCount > 0 ? `${overdueMainsCount} Past SLA` : 'Needs Grading';

  const inquiriesCount = leadsCount;
  const demosCount = demosTodayCount;
  const hotCount = hotPipelineCount;

  const feeStats = feeAggregation[0] || { totalPending: 0, overdueCount: 0, remindersCount: 0 };
  const totalPendingFee = feeStats.totalPending || 0;
  const overdueCount = feeStats.overdueCount || 0;
  const remindersText = feeStats.remindersCount > 0 ? `${feeStats.remindersCount} Reminders sent` : 'Auto-reminders sent';

  // Format Mains Submissions list
  const formattedSubmissions = recentMainsSubmissions.map((sub: any) => {
    const student = sub.student || {};
    const question = sub.question || {};
    const rawName = sub.evaluatedBy?.name || 'Adv. Rajinder Sir';
    const salutation = sub.evaluatedBy?.salutation || 'Adv.';
    const evaluatedBy = rawName.startsWith('Adv.') ? rawName : `${salutation} ${rawName}`;
    const isEvaluated = sub.status === 'evaluated';

    const pdfName = sub.studentPdf?.originalName || `${question.title || 'CPC Sec 11 - Res Judicata'} (PDF ${sub.studentPdf?.sizeFormatted || '4.2 MB'})`;
    const isOverdue = !isEvaluated && sub.submittedAt && new Date(sub.submittedAt).getTime() < twentyFourHoursAgo.getTime();

    return {
      id: sub._id.toString(),
      challengeNumber: question.challengeNumber || 48,
      studentName: student.name || 'Pooja Sharma',
      rollNumber: student.rollNo || 'RLA-2026-042',
      topicTitle: pdfName,
      pdfUrl: sub.studentPdf?.path || '',
      pdfSizeFormatted: sub.studentPdf?.sizeFormatted || '4.2 MB',
      status: sub.status || 'pending',
      isEvaluated,
      isOverdue,
      score: sub.score != null ? sub.score : null,
      maxScore: sub.maxScore || question.totalMarks || 25,
      evaluatedBy: isEvaluated ? evaluatedBy : undefined,
      evaluatedAt: sub.evaluatedAt,
      remarks: sub.remarks,
      strengths: sub.strengths,
      mistakes: sub.mistakes,
      rubricBreakdown: sub.rubricBreakdown || [],
      submittedAt: sub.submittedAt || sub.createdAt,
    };
  });

  // Format Doubts list
  const formattedDoubts = recentDoubts.map((d: any) => {
    return {
      id: d._id.toString(),
      queryNumber: d.queryNumber,
      studentName: d.studentName || 'Vikram Mehta',
      rollNumber: d.rollNo || 'RLA-2026-108',
      timeAgo: formatRelativeTime(d.createdAt),
      questionSnippet: d.initialQuestion || d.title || 'Legal doctrine doubt regarding civil procedure',
      subject: d.subject || 'CPC',
      bareActSection: d.bareActSection || '',
      sectionTag: d.bareActSection ? `${d.subject || 'Law'} • ${d.bareActSection}` : `${d.subject || 'Judicial Law'} • General`,
      status: d.status || 'pending',
      priority: d.priority || 'normal',
      assignedFacultyName: d.assignedFacultyName,
      thread: d.thread || [],
    };
  });

  // Format Today's Lectures
  let formattedClasses = await Promise.all(
    todayClasses.map(async (c: any) => {
      let currentStatus = c.status;
      // Auto-expire live session if ended over 30 mins ago
      if (currentStatus === 'live' && c.scheduledEndAt && Date.now() > new Date(c.scheduledEndAt).getTime() + 30 * 60 * 1000) {
        currentStatus = 'ended';
      }

      const isLive = currentStatus === 'live';
      const startTimeFormatted = c.startTime || '5:00 PM';
      const endTimeFormatted = c.endTime || '7:00 PM';
      const roomName = c.sessionTopic || c.roomName || 'Chamber Hall A';

      return {
        id: c._id.toString(),
        title: c.title,
        subject: c.subject,
        facultyName: c.facultyName || 'Adv. Rajinder Sir',
        roomName,
        timeBadge: isLive ? `LIVE AT ${startTimeFormatted}` : `${startTimeFormatted} - ${endTimeFormatted}`,
        durationFormatted: `${startTimeFormatted} - ${endTimeFormatted}`,
        isLive,
        status: currentStatus,
        liveStreamUrl: `/live-classes?classId=${c._id}`,
        batchName: c.shifts?.length ? c.shifts.join(', ') : 'Foundation Batch',
        shifts: c.shifts || ['Morning Shift (8:30 AM)', 'Evening Shift (5:00 PM)'],
        currentLiveCount: c.currentLiveCount || 0,
      };
    })
  );

  // If no LiveClass documents exist for today, dynamically check RecurringScheduleSlot for today's day of week
  if (formattedClasses.length === 0) {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const nowIstTime = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
    const dayOfWeek = dayNames[nowIstTime.getUTCDay()];

    const recurringSlots = await RecurringScheduleSlot.find({ dayOfWeek, isActive: true })
      .sort({ startTime: 1 })
      .limit(4)
      .lean();

    formattedClasses = recurringSlots.map((slot: any) => ({
      id: slot._id.toString(),
      title: `${slot.subject} - ${slot.topic}`,
      subject: slot.subject,
      facultyName: slot.facultyName || 'Adv. Rajinder Sir',
      roomName: slot.roomName || 'Chamber Hall A',
      timeBadge: slot.timeFormatted || `${slot.startTime} - ${slot.endTime}`,
      durationFormatted: `${slot.startTime} - ${slot.endTime}`,
      isLive: false,
      status: 'scheduled',
      liveStreamUrl: slot.liveStreamUrl || '/timetable',
      batchName: 'Foundation Batch',
      shifts: [slot.shiftId],
      currentLiveCount: 0,
    }));
  }

  const responseData = {
    adminProfile: {
      name: adminUser.name || 'Adv. Rajinder Sir',
      salutation: adminUser.salutation || 'Adv.',
      email: adminUser.email || 'rajinder@rajinderlawacademy.com',
      role: adminUser.role || 'Super Admin',
      title: adminUser.adminTitle || 'Director & Academic Dean',
      chamberBadge: adminUser.role === 'faculty' ? 'Faculty Academic Command Active' : 'Chamber Executive Command Active',
    },
    timeframe,
    kpis: {
      enrolledStudents: {
        count: enrolledCount,
        growthText: enrolledGrowth,
        growthCount,
        primaryCohort,
        trend: {
          delta: studentDelta,
          percent: studentTrendPercent,
          direction: studentTrendDir,
        },
        drillDownUrl: '/students/roster',
      },
      pendingMainsCopies: {
        count: pendingCopies,
        challengeLabel,
        statusLabel,
        isSlaBreached: overdueMainsCount > 0,
        overdueCount: overdueMainsCount,
        activeChallengeNumber: activeChallengeRecord?.challengeNumber || 48,
        drillDownUrl: activeChallengeRecord
          ? `/mains-evaluation/inbox?challenge=${activeChallengeRecord.challengeNumber}&status=pending`
          : '/mains-evaluation/inbox?status=pending',
      },
      admissionsInquiries: {
        count: inquiriesCount,
        demosTodayText: `${demosCount} Demos today`,
        hotPipelineText: `${hotCount} Hot Pipeline`,
        demosTodayCount: demosCount,
        hotPipelineCount: hotCount,
        drillDownUrl: '/leads/pipeline',
      },
      feeInstallmentsDue: {
        amountFormatted: formatAmountInLakhs(totalPendingFee),
        rawAmount: totalPendingFee,
        overdueCount,
        overdueText: `${overdueCount} Overdue`,
        statusLabel: remindersText,
        drillDownUrl: '/fees?status=Overdue',
      },
    },
    mainsSubmissions: {
      totalPending: pendingCopies,
      recentSubmissions: formattedSubmissions,
    },
    facultyDoubts: {
      unresolvedCount: unresolvedDoubtsCount,
      recentQueries: formattedDoubts,
    },
    todayLectures: formattedClasses,
    noticesSummary: {
      totalPublished: noticesCount,
      recentNotices: (recentNotices || []).map((n: any) => ({
        id: n._id.toString(),
        circularNo: n.circularNo,
        title: n.title,
        content: n.content,
        category: n.category,
        priority: n.priority,
        targetCohorts: n.targetCohorts,
        readCount: (n.readBy || []).length,
        timeAgo: formatRelativeTime(n.publishedAt || n.createdAt),
      })),
    },
  };

  // Cache response for 60 seconds
  dashboardCache.set(cacheKey, { data: responseData, cachedAt: Date.now() });

  res.status(200).json({
    status: 'success',
    cached: false,
    data: responseData,
  });
});

/**
 * 2. POST /api/admin/dashboard/quick-evaluate/:submissionId
 * Quick evaluate student answer copy directly from dashboard
 */
export const quickEvaluateSubmission = catchAsync(async (req: Request, res: Response) => {
  const { submissionId } = req.params;
  const { score, remarks, strengths, mistakes, rubricBreakdown } = req.body;

  const submission = await MainsSubmission.findById(submissionId);
  if (!submission) {
    throw new ApiError(404, 'Submission not found.');
  }

  submission.status = 'evaluated';
  submission.score = Number(score);
  submission.evaluatedBy = req.user!._id;
  submission.evaluatedAt = new Date();
  if (remarks) submission.remarks = remarks;
  if (strengths) submission.strengths = strengths;
  if (mistakes) submission.mistakes = mistakes;
  if (rubricBreakdown) submission.rubricBreakdown = rubricBreakdown;

  await submission.save();

  // Invalidate KPI cache
  invalidateDashboardCache();

  res.status(200).json({
    status: 'success',
    message: 'Answer sheet successfully graded and returned to student.',
    data: submission,
  });
});

/**
 * 3. POST /api/admin/dashboard/quick-reply-doubt/:doubtId
 * Quick reply to student doubt directly from dashboard
 */
export const quickReplyDoubt = catchAsync(async (req: Request, res: Response) => {
  const { doubtId } = req.params;
  const { message } = req.body;

  if (!message || !message.trim()) {
    throw new ApiError(400, 'Reply message cannot be empty.');
  }

  const doubt = await DoubtQuery.findById(doubtId);
  if (!doubt) {
    throw new ApiError(404, 'Doubt query not found.');
  }

  // Push to thread
  doubt.thread.push({
    senderId: req.user!._id,
    senderRole: 'faculty',
    senderName: req.user!.name,
    senderSalutation: req.user!.salutation || 'Adv.',
    message: message.trim(),
    createdAt: new Date(),
  });

  doubt.status = 'resolved';
  doubt.resolvedAt = new Date();
  doubt.assignedFaculty = req.user!._id;
  doubt.assignedFacultyName = req.user!.name;

  await doubt.save();

  // Invalidate KPI cache
  invalidateDashboardCache();

  res.status(200).json({
    status: 'success',
    message: 'Reply posted and doubt marked as resolved.',
    data: doubt,
  });
});

/**
 * 4. POST /api/admin/dashboard/broadcast-notice
 * Quick broadcast new circular to enrolled students
 */
export const broadcastNotice = catchAsync(async (req: Request, res: Response) => {
  const { title, content, category = 'General', priority = 'normal', targetCohorts = 'All Students' } = req.body;

  if (!title || !content) {
    throw new ApiError(400, 'Notice title and content are required.');
  }

  const year = new Date().getFullYear();
  const count = await Notice.countDocuments();
  const circularNo = `RLA-CIR-${year}-${String(count + 1).padStart(3, '0')}`;

  const notice = await Notice.create({
    circularNo,
    title: title.trim(),
    content: content.trim(),
    category,
    priority,
    targetCohorts,
    issuedBy: 'Office of the Director & Academic Council',
    author: req.user!._id,
    authorName: req.user!.name,
    isPublished: true,
    publishedAt: new Date(),
  });

  // Invalidate KPI cache
  invalidateDashboardCache();

  res.status(201).json({
    status: 'success',
    message: 'Circular successfully published to student classroom portals.',
    data: notice,
  });
});

/**
 * 5. POST /api/admin/dashboard/start-live-stream/:classId
 * Start or activate live stream for a scheduled class
 */
export const startLiveStream = catchAsync(async (req: Request, res: Response) => {
  const { classId } = req.params;

  let liveClass = await LiveClass.findById(classId);
  if (liveClass) {
    liveClass.status = 'live';
    liveClass.actualStartedAt = new Date();
    await liveClass.save();
  }

  // Invalidate KPI cache
  invalidateDashboardCache();

  res.status(200).json({
    status: 'success',
    message: 'Live stream activated. Classroom status is now LIVE.',
    data: liveClass,
  });
});

/**
 * 6. GET /api/admin/dashboard/batch-shifts
 * Retrieve today's active batches, shifts, and chamber room configurations
 */
export const getBatchShiftsOverview = catchAsync(async (req: Request, res: Response) => {
  const batches = await Batch.find({ status: 'active' }).lean();
  const rooms = await ClassroomRoom.find({ isActive: true }).lean();

  const formattedBatches = batches.map((b) => ({
    id: b._id.toString(),
    name: b.name,
    code: b.code,
    subtitle: b.subtitle,
    targetExam: b.targetExam,
    enrolledCount: b.enrolledCount,
    shifts: (b.shifts || []).map((s) => ({
      shiftId: s.shiftId,
      name: s.name,
      code: s.code,
      startTime: s.startTime,
      endTime: s.endTime,
      timeFormatted: s.timeFormatted,
      capacity: s.capacity,
      isActive: s.isActive,
    })),
  }));

  res.status(200).json({
    status: 'success',
    data: {
      batches: formattedBatches,
      rooms: rooms.map((r) => ({
        id: r._id.toString(),
        name: r.name,
        roomNumber: r.roomNumber,
        building: r.building,
        capacity: r.capacity,
        facilities: r.facilities,
      })),
    },
  });
});

/**
 * 7. GET /api/admin/dashboard/submission/:submissionId
 * Retrieve detailed submission record and evaluation scorecard
 */
export const getSubmissionScorecard = catchAsync(async (req: Request, res: Response) => {
  const { submissionId } = req.params;
  const submission = await MainsSubmission.findById(submissionId)
    .populate('student', 'name rollNo email phone avatarUrl')
    .populate('question', 'challengeNumber title subject totalMarks rubricGuidelines')
    .populate('evaluatedBy', 'name salutation adminTitle')
    .lean();

  if (!submission) {
    throw new ApiError(404, 'Mains submission copy not found.');
  }

  res.status(200).json({
    status: 'success',
    data: submission,
  });
});


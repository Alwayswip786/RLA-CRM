import { apiClient } from './apiClient';

export interface DashboardAdminProfile {
  name: string;
  salutation?: string;
  email: string;
  role: string;
  title: string;
  chamberBadge: string;
}

export interface DashboardKpiTrend {
  delta: number;
  percent: number;
  direction: 'up' | 'down' | 'neutral';
}

export interface DashboardKpis {
  enrolledStudents: {
    count: number;
    growthText: string;
    growthCount?: number;
    primaryCohort: string;
    trend?: DashboardKpiTrend;
    drillDownUrl?: string;
  };
  pendingMainsCopies: {
    count: number;
    challengeLabel: string;
    statusLabel: string;
    isSlaBreached?: boolean;
    overdueCount?: number;
    activeChallengeNumber?: number;
    drillDownUrl?: string;
  };
  admissionsInquiries: {
    count: number;
    demosTodayText: string;
    hotPipelineText: string;
    demosTodayCount?: number;
    hotPipelineCount?: number;
    drillDownUrl?: string;
  };
  feeInstallmentsDue: {
    amountFormatted: string;
    rawAmount: number;
    overdueCount: number;
    overdueText: string;
    statusLabel: string;
    drillDownUrl?: string;
  };
}

export interface DashboardMainsSubmission {
  id: string;
  challengeNumber: number;
  studentName: string;
  rollNumber: string;
  topicTitle: string;
  pdfUrl: string;
  pdfSizeFormatted: string;
  status: string;
  isEvaluated: boolean;
  isOverdue?: boolean;
  score?: number | null;
  maxScore?: number;
  evaluatedBy?: string;
  evaluatedAt?: string;
  remarks?: string;
  strengths?: string;
  mistakes?: string;
  rubricBreakdown?: Array<{
    criterion: string;
    label: string;
    score: number;
    maxScore: number;
  }>;
  submittedAt: string;
}

export interface DashboardFacultyDoubt {
  id: string;
  queryNumber?: string;
  studentName: string;
  rollNumber: string;
  timeAgo: string;
  questionSnippet: string;
  subject: string;
  bareActSection?: string;
  sectionTag: string;
  status: string;
  priority: string;
  assignedFacultyName?: string;
  thread?: Array<{
    senderRole: string;
    senderName: string;
    senderSalutation?: string;
    message: string;
    createdAt: string;
  }>;
}

export interface DashboardTodayLecture {
  id: string;
  title: string;
  subject: string;
  facultyName: string;
  roomName: string;
  timeBadge: string;
  durationFormatted: string;
  isLive: boolean;
  status: string;
  liveStreamUrl: string;
  batchName: string;
  shifts?: string[];
  currentLiveCount?: number;
}

export interface DashboardNoticeSummary {
  totalPublished: number;
  recentNotices: Array<{
    id: string;
    circularNo: string;
    title: string;
    content?: string;
    category: string;
    priority: string;
    targetCohorts: string;
    readCount?: number;
    timeAgo: string;
  }>;
}

export interface DashboardOverviewData {
  adminProfile: DashboardAdminProfile;
  timeframe?: string;
  kpis: DashboardKpis;
  mainsSubmissions: {
    totalPending: number;
    recentSubmissions: DashboardMainsSubmission[];
  };
  facultyDoubts: {
    unresolvedCount: number;
    recentQueries: DashboardFacultyDoubt[];
  };
  todayLectures: DashboardTodayLecture[];
  noticesSummary: DashboardNoticeSummary;
}

export interface BatchShiftInfo {
  batches: Array<{
    id: string;
    name: string;
    code: string;
    subtitle: string;
    targetExam: string;
    enrolledCount: number;
    shifts: Array<{
      shiftId: string;
      name: string;
      code: string;
      startTime: string;
      endTime: string;
      timeFormatted: string;
      capacity: number;
      isActive: boolean;
    }>;
  }>;
  rooms: Array<{
    id: string;
    name: string;
    roomNumber: string;
    building: string;
    capacity: number;
    facilities: string[];
  }>;
}

export const adminDashboardApi = {
  getOverview: async (params?: { timeframe?: string; refresh?: boolean }): Promise<DashboardOverviewData> => {
    const response = await apiClient.get('/admin/dashboard/overview', { params });
    return response.data.data;
  },

  getBatchShifts: async (): Promise<BatchShiftInfo> => {
    const response = await apiClient.get('/admin/dashboard/batch-shifts');
    return response.data.data;
  },

  getSubmissionScorecard: async (submissionId: string): Promise<any> => {
    const response = await apiClient.get(`/admin/dashboard/submission/${submissionId}`);
    return response.data.data;
  },

  quickEvaluateSubmission: async (
    submissionId: string,
    payload: { score: number; remarks: string; strengths?: string; mistakes?: string }
  ) => {
    const response = await apiClient.post(`/admin/dashboard/quick-evaluate/${submissionId}`, payload);
    return response.data;
  },

  quickReplyDoubt: async (doubtId: string, payload: { message: string }) => {
    const response = await apiClient.post(`/admin/dashboard/quick-reply-doubt/${doubtId}`, payload);
    return response.data;
  },

  broadcastNotice: async (payload: {
    title: string;
    content: string;
    category?: string;
    priority?: string;
    targetCohorts?: string;
  }) => {
    const response = await apiClient.post('/admin/dashboard/broadcast-notice', payload);
    return response.data;
  },

  startLiveStream: async (classId: string) => {
    const response = await apiClient.post(`/admin/dashboard/start-live-stream/${classId}`);
    return response.data;
  },
};

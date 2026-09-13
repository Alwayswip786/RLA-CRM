export interface VideoWatchLog {
  lectureId: string;
  lectureTitle: string;
  subject: string;
  faculty: string;
  totalDuration: string; // e.g. "01:15:00"
  totalSeconds: number;
  watchedSeconds: number;
  watchedTimestamp: string; // e.g. "01:02:15 / 01:15:00"
  watchPercentage: number; // 0 to 100
  status: 'completed' | 'in_progress' | 'not_started';
  lastWatchedAt: string; // e.g. "Today at 03:20 PM"
  watchCount: number;
  playbackSpeedAvg: string;
  skipAlert?: boolean; // detected video scrubbing/skipping
}

export interface GateAccessLog {
  timestamp: string;
  gate: string;
  direction: 'ENTRY' | 'EXIT';
  method: 'QR Code Pass' | 'RFID Biometric';
}

export interface StudentRecord {
  id: string;
  name: string;
  rollNumber: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  enrolledCourseId: string;
  enrolledCourseTitle: string;
  batch: string; // e.g. "Morning Shift (Cohort A)"
  admissionDate: string;
  status: 'active' | 'suspended' | 'needs_attention';
  overallCourseProgress: number; // 0 to 100%
  completedModulesCount: number;
  totalModulesCount: number;
  totalLecturesWatched: number;
  totalLecturesCount: number;
  totalWatchTimeHours: number;
  lastActive: string;
  rfidTurnstileId: string;
  
  // Academic Metrics
  mainsDawSubmitted: number;
  mainsDawTotal: number;
  prelimsAverageScore: number;
  feeStatus: 'Paid in Full' | 'Installment Due' | 'Overdue';
  pendingFeeAmount?: string;

  // Granular video timestamp breakdown
  videoLogs: VideoWatchLog[];

  // Gate access history
  gateLogs: GateAccessLog[];

  // Device telemetry
  activeDevice: {
    deviceModel: string;
    os: string;
    browser: string;
    ipAddress: string;
    location: string;
    concurrentSessions: number;
  };
}

export interface CourseSubjectProgress {
  subjectName: string;
  completedLectures: number;
  totalLectures: number;
  percentage: number;
  faculty: string;
}

export interface CourseMetricSummary {
  courseId: string;
  courseTitle: string;
  shortCode: string;
  facultyInCharge: string;
  totalStudents: number;
  activeBatches: string[];
  avgCompletionRate: number;
  totalLecturesCount: number;
  totalHours: number;
  activeWatchersToday: number;
  mainsDawSubmissionRate: number;
  atRiskStudentsCount: number;
  subjectBreakdown: CourseSubjectProgress[];
}


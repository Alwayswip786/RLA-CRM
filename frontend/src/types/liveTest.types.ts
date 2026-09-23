export type LiveTestPhase = 'scheduled' | 'live' | 'closed';
export type LiveTestUserStatus = 'not_started' | 'in_progress' | 'completed';

export interface LiveTestSection {
  name: string;
  count: number;
}

export interface LiveMockTestItem {
  id: string;
  testCode: string;
  title: string;
  targetExam: string;
  targetState: string;
  syllabus: string;
  windowStart: string;
  windowEnd: string;
  durationMinutes: number;
  durationFormatted: string;
  questionsCount: number;
  maxScore: number;
  negativeMarkWeight: number;
  negativeMarkFormatted: string;
  marksPerCorrect: number;
  difficulty: string;
  sections: LiveTestSection[];
  phase: LiveTestPhase;
  countdownMs: number;
  userStatus: LiveTestUserStatus;
  activeAttemptId: string | null;
  latestCompletedAttemptId: string | null;
  officialScore?: number;
  officialRank?: number;
  officialPercentile?: number;
  totalAttempted: number;
  topScore: number;
}

export interface LiveLeaderboardRow {
  attemptId: string;
  rank: number;
  studentId: string;
  name: string;
  rollNumber: string;
  avatar?: string;
  score: number;
  maxScore: number;
  correct: number;
  incorrect: number;
  accuracy: number;
  negativeMarks: number;
  durationUsedSeconds: number;
  durationUsedMilliseconds: number;
  percentile: number;
  submittedAt: string;
  isCurrentUser: boolean;
}

export interface LiveLeaderboardData {
  testId: string;
  testTitle: string;
  isFrozen: boolean;
  totalCandidates: number;
  leaderboard: LiveLeaderboardRow[];
  currentUserRank: LiveLeaderboardRow | null;
}

export interface LiveTestHistoryItem {
  attemptId: string;
  testId: string;
  testCode: string;
  title: string;
  targetExam: string;
  isOfficial: boolean;
  attemptNumber: number;
  score: number;
  maxScore: number;
  rank?: number;
  percentile?: number;
  accuracy: number;
  correct: number;
  incorrect: number;
  unattempted: number;
  durationUsedSeconds: number;
  submittedAt: string;
}

export interface LiveSubjectAnalysis {
  subject: string;
  total: number;
  correct: number;
  incorrect: number;
  unattempted: number;
  accuracy: number;
  timeSpentSeconds: number;
}

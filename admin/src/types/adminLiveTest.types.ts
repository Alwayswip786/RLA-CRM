export interface AdminLiveMockTest {
  _id: string;
  testCode: string;
  title: string;
  targetExam: string;
  targetState: string;
  syllabus: string;
  windowStart: string;
  windowEnd: string;
  durationMinutes: number;
  questionsCount: number;
  maxScore: number;
  marksPerCorrect: number;
  negativeMarkWeight: number;
  difficulty: string;
  status: 'draft' | 'scheduled' | 'live' | 'closed' | 'archived';
  isPublished: boolean;
  isLeaderboardFrozen: boolean;
  stats: {
    totalRegistered: number;
    totalAttempted: number;
    avgScore: number;
    topScore: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AdminCreateLiveTestPayload {
  testCode: string;
  title: string;
  targetExam: string;
  targetState: string;
  syllabus: string;
  windowStart: string;
  windowEnd: string;
  durationMinutes: number;
  questionsCount: number;
  maxScore: number;
  marksPerCorrect: number;
  negativeMarkWeight: number;
  difficulty: string;
}

export interface AdminCandidateAttempt {
  _id: string;
  studentId: {
    _id: string;
    name: string;
    email: string;
    rollNo?: string;
    rollNumber?: string;
    batch?: string;
    shift?: string;
    phone?: string;
  };
  isOfficial: boolean;
  attemptNumber: number;
  status: string;
  startedAt: string;
  submittedAt: string;
  durationUsedSeconds: number;
  result: {
    score: number;
    maxScore: number;
    correct: number;
    incorrect: number;
    unattempted: number;
    accuracy: number;
    negativeMarks: number;
    avgTimePerMcq: number;
    rank: number;
    percentile: number;
  };
  antiCheat: {
    status: string;
    violationsCount: number;
  };
}

export interface MainsFileMetadata {
  filename: string;
  originalName: string;
  path?: string;
  mimeType: string;
  sizeBytes: number;
  sizeFormatted: string;
  pageCount?: number;
}

export interface RubricScore {
  criterion: string;
  label: string;
  score: number;
  maxScore: number;
}

export interface SubmissionRevision {
  version: number;
  fileType: 'pdf' | 'images';
  files: MainsFileMetadata[];
  notes?: string;
  submittedAt: string;
}

export interface MainsQuestion {
  _id: string;
  challengeNumber?: number;
  questionCode: string;
  paper: string;
  title: string;
  subject: string;
  targetExam?: string;
  challengeDate?: string;
  submissionDeadline?: string;
  marks: number;
  wordLimit: number;
  turnaroundHours?: number;
  evaluatorName?: string;
  guidelines: string[];
  modelAnswer?: string;
  modelAnswerPdf?: MainsFileMetadata;
  isModelAnswerPublished?: boolean;
  isModelAnswerRevealed?: boolean;
  status?: 'draft' | 'scheduled' | 'active' | 'archived';
  totalSubmissionsCount?: number;
  evaluatedCount?: number;
  isActive: boolean;
  publishedAt: string;
  studentSubmission?: {
    status: SubmissionStatus;
    score?: number;
    maxScore?: number;
    submittedAt: string;
    isLate?: boolean;
  } | null;
}

export type SubmissionStatus = 'pending' | 'under_review' | 'evaluated';

export interface EvaluatorInfo {
  _id: string;
  name: string;
  salutation?: string;
}

export interface MainsSubmission {
  _id: string;
  student: string | { _id: string; name: string; rollNo: string; email: string };
  question: MainsQuestion;
  version?: number;
  fileType?: 'pdf' | 'images';
  files?: MainsFileMetadata[];
  studentPdf: MainsFileMetadata;
  notes?: string;
  isLate?: boolean;
  revisionHistory?: SubmissionRevision[];
  status: SubmissionStatus;
  submittedAt: string;
  evaluatedBy?: EvaluatorInfo;
  score?: number;
  maxScore?: number;
  rubricBreakdown?: RubricScore[];
  remarks?: string;
  strengths?: string;
  mistakes?: string;
  improvementPoints?: string;
  needsWork?: string;
  evaluatedPdf?: MainsFileMetadata;
  evaluatedAt?: string;
}

export interface MainsStreakInfo {
  currentStreak: number;
  longestStreak: number;
  totalSubmissions: number;
  lastSubmissionDate?: string;
}

export interface DeadlineInfo {
  isPassed: boolean;
  formattedText: string;
  timeString: string;
}

export interface MainsActiveQuestionResponse {
  success: boolean;
  question: MainsQuestion | null;
  submission: MainsSubmission | null;
  streak?: MainsStreakInfo;
  deadlineInfo?: DeadlineInfo;
  message?: string;
}

export interface MySubmissionsResponse {
  success: boolean;
  submissions: MainsSubmission[];
  counts: {
    total: number;
    pending: number;
    evaluated: number;
  };
  streak?: MainsStreakInfo;
}

export interface ChallengeArchiveResponse {
  success: boolean;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  questions: MainsQuestion[];
}

export interface MainsAutopsyResponse {
  success: boolean;
  submission: MainsSubmission;
}

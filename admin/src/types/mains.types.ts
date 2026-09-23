export interface MainsFileMetadata {
  filename: string;
  originalName: string;
  path?: string;
  mimeType: string;
  sizeBytes: number;
  sizeFormatted: string;
  pageCount?: number;
}

export interface RubricScoreAdmin {
  criterion: string;
  label: string;
  score: number;
  maxScore: number;
}

export interface MainsQuestionAdmin {
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
  status: 'draft' | 'scheduled' | 'active' | 'archived';
  totalSubmissionsCount: number;
  evaluatedCount: number;
  isActive: boolean;
  publishedAt: string;
  createdAt?: string;
}

export interface StudentBrief {
  _id: string;
  name: string;
  rollNo: string;
  email: string;
  phone?: string;
  targetExam?: string;
  targetState?: string;
}

export interface MainsSubmissionAdmin {
  _id: string;
  student: StudentBrief;
  question: MainsQuestionAdmin;
  version?: number;
  fileType?: 'pdf' | 'images';
  files?: MainsFileMetadata[];
  studentPdf: MainsFileMetadata;
  notes?: string;
  isLate?: boolean;
  status: 'pending' | 'under_review' | 'evaluated';
  submittedAt: string;
  claimedBy?: { _id: string; name: string };
  claimedAt?: string;
  evaluatedBy?: { _id: string; name: string; salutation?: string };
  score?: number;
  maxScore?: number;
  rubricBreakdown?: RubricScoreAdmin[];
  remarks?: string;
  strengths?: string;
  mistakes?: string;
  improvementPoints?: string;
  needsWork?: string;
  evaluatedPdf?: MainsFileMetadata;
  evaluatedAt?: string;
}

export interface PendingSubmissionsResponse {
  success: boolean;
  count: number;
  submissions: MainsSubmissionAdmin[];
}

export interface GradedSubmissionsResponse {
  success: boolean;
  count: number;
  submissions: MainsSubmissionAdmin[];
}

export interface AllQuestionsResponse {
  success: boolean;
  count: number;
  questions: MainsQuestionAdmin[];
}

export interface EvaluatePayload {
  score: number | string;
  rubricBreakdown?: RubricScoreAdmin[];
  remarks: string;
  strengths?: string;
  mistakes?: string;
  improvementPoints?: string;
  needsWork?: string;
}

export interface ScheduleQuestionPayload {
  challengeNumber?: number;
  questionCode?: string;
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
  guidelines?: string[];
  modelAnswer?: string;
  isModelAnswerPublished?: boolean;
  status?: 'draft' | 'scheduled' | 'active' | 'archived';
  isActive?: boolean;
}

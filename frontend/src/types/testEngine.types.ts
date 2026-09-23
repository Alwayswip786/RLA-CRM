export interface BareActCategory {
  id: string;
  bareAct: string;
  chaptersCount: number;
  totalQuestions: number;
  completedQuestions: number;
  accuracy: string;
  accuracyRaw?: number;
}

export interface MockTestItem {
  id: string;
  testCode: string;
  title: string;
  syllabus: string;
  questionsCount: number;
  duration: string;
  durationMinutes: number;
  negativeMarking: string;
  negativeMarkWeight: number;
  targetState: string;
  targetExam: string;
  status: 'Live Now' | 'Scheduled' | 'Attempted' | 'Archived';
  score?: string;
  rank?: string;
}

export interface EngineQuestion {
  _id: string;
  code: string;
  subject: string;
  actName: string;
  chapterOrPart?: string;
  sectionOrArticle?: string;
  questionText: string;
  options: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  format: string;
  targetExams: string[];
}

export interface SessionQuestionItem {
  question: EngineQuestion;
  selectedOption: number | null;
  isAnswered: boolean;
  isMarkedForReview: boolean;
  isVisited: boolean;
  timeSpentSeconds: number;
}

export interface ActiveTestSession {
  id: string;
  title: string;
  testType: 'mock_series' | 'bare_act_drill' | 'sectional_test';
  targetExam: string;
  durationMinutes: number;
  timeRemainingSeconds: number;
  currentIndex: number;
  startedAt: string;
  expiresAt: string;
  isLive?: boolean;
  isOfficial?: boolean;
  attemptNumber?: number;
  sections?: Array<{ name: string; questionCount?: number; count?: number }>;
  questions: SessionQuestionItem[];
}

export interface TestResultSummary {
  totalQuestions: number;
  attempted: number;
  correct: number;
  incorrect: number;
  unattempted: number;
  score: number;
  maxScore: number;
  accuracy: number;
  avgTimePerMcq: number;
  negativeMarks: number;
  rank?: number;
  percentile?: number;
}

export interface AutopsyQuestion {
  _id: string;
  code: string;
  subject: string;
  actName: string;
  sectionOrArticle?: string;
  questionText: string;
  options: string[];
  selectedOption: number | null;
  correctOptionIndex: number;
  isCorrect: boolean;
  explanation: string;
  landmarkCases?: string[];
  timeSpentSeconds: number;
}

export interface AutopsyReviewData {
  sessionId: string;
  title: string;
  testType: string;
  targetExam: string;
  submittedAt: string;
  resultSummary: TestResultSummary;
  questions: AutopsyQuestion[];
}

export type QuestionPaletteStatus =
  | 'answered'
  | 'unanswered'
  | 'marked_for_review'
  | 'answered_and_marked'
  | 'not_visited';

export interface LatestTestMetric {
  id: string;
  title: string;
  targetExam?: string;
  attemptedAt: string;
  rank: number;
  totalAspirants: number;
  percentile: number;
  percentileBand: string;
  score: number;
  maxScore: number;
  scoreFormatted: string;
  accuracy: number;
  accuracyFormatted: string;
  avgTimePerMcq: number;
  negativeMarks: number;
  negativeMarksFormatted: string;
  correct: number;
  incorrect: number;
  unattempted: number;
}

export interface TestReportItem {
  id: string;
  title: string;
  targetExam?: string;
  attemptedAt: string;
  dateFormatted: string;
  score: string;
  scoreRaw: number;
  maxScoreRaw: number;
  rank: string;
  rankRaw: number;
  percentile: string;
  percentileRaw: number;
  correct: number;
  incorrect: number;
  unattempted: number;
  accuracy: string;
  accuracyRaw: number;
  avgTimePerMcq: number;
  negativeMarks: number;
  negativeMarksFormatted: string;
  timeSpentMinutes: number;
}

export interface TestAnalyticsResponse {
  success: boolean;
  hasAttempts: boolean;
  totalAttempts: number;
  latestTest: LatestTestMetric | null;
  reports: TestReportItem[];
  message?: string;
}

export type AnalysisTabId =
  | 'mock-tests'
  | 'sectional'
  | 'subject-wise'
  | 'time'
  | 'rank-trend'
  | 'topics';

export type ExamFilterOption =
  | 'All India Judicial Services'
  | 'Delhi Judicial Services (DJS 2026)'
  | 'Haryana ADA / Judicial Services'
  | 'UP PCS-J Foundation'
  | 'All Exams';

export type TimeframeFilterOption =
  | 'Last 30 Days'
  | 'Last 3 Months'
  | 'Last 6 Months'
  | 'Last 1 Year'
  | 'All Time';

export interface AggregateAnalyticsSummary {
  currentAir: number;
  totalAspirants: number;
  percentile: number;
  rankDelta: number; // positive = ranks improved
  overallAccuracy: number;
  targetAccuracy: number;
  avgTimePerMcq: number;
  timeImprovementPct: number;
  negativeMarksPenalty: number;
  incorrectQuestions: number;
  penaltyReductionPct: number;
  paceSparkline: number[];
  penaltyBars: number[];
}


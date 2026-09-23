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

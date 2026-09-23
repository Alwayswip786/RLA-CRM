import { apiClient } from '../lib/apiClient';
import type {
  LiveMockTestItem,
  LiveLeaderboardData,
  LiveTestHistoryItem,
} from '../types/liveTest.types';
import type { ActiveTestSession, AutopsyReviewData } from '../types/testEngine.types';

/**
 * Fetch all scheduled, live, and completed mock tests
 */
export const fetchLiveTestCatalog = async (): Promise<LiveMockTestItem[]> => {
  const res = await apiClient.get<{ success: boolean; data: LiveMockTestItem[] }>(
    '/tests/live/catalog'
  );
  return res.data.data;
};

/**
 * Start or resume a competitive live mock test session
 */
export const startLiveTestSession = async (
  testId: string
): Promise<{ isResumed: boolean; attemptId: string; session: ActiveTestSession }> => {
  const res = await apiClient.post<{
    success: boolean;
    isResumed: boolean;
    attemptId: string;
    session: ActiveTestSession;
  }>(`/tests/live/tests/${testId}/start`);
  return res.data;
};

/**
 * Auto-save answer selection and review flag
 */
export const updateLiveAnswerProgress = async (
  attemptId: string,
  payload: {
    questionIndex: number;
    selectedOption?: number | null;
    isMarkedForReview?: boolean;
    isVisited?: boolean;
    timeSpentDelta?: number;
  }
) => {
  const res = await apiClient.patch<{ success: boolean; savedAt: string }>(
    `/tests/live/attempts/${attemptId}/answer`,
    payload
  );
  return res.data;
};

/**
 * Send heartbeat ping to sync timer and prevent auto-submit
 */
export const heartbeatLiveSession = async (attemptId: string) => {
  const res = await apiClient.patch<{
    success: boolean;
    status: string;
    timeRemainingSeconds: number;
    isExpired: boolean;
  }>(`/tests/live/attempts/${attemptId}/heartbeat`);
  return res.data;
};

/**
 * Log focus / anti-cheat integrity event
 */
export const recordAntiCheatEvent = async (
  attemptId: string,
  eventType: string,
  metadata?: Record<string, unknown>
) => {
  const res = await apiClient.post<{ success: boolean; violationsCount: number; status: string }>(
    `/tests/live/attempts/${attemptId}/event`,
    { eventType, metadata }
  );
  return res.data;
};

/**
 * Submit examination and calculate All-India score
 */
export const submitLiveTestSession = async (
  attemptId: string
): Promise<{
  success: boolean;
  alreadyProcessed?: boolean;
  resultSummary: any;
  review: AutopsyReviewData;
}> => {
  const res = await apiClient.post<{
    success: boolean;
    alreadyProcessed?: boolean;
    resultSummary: any;
    review: AutopsyReviewData;
  }>(`/tests/live/attempts/${attemptId}/submit`);
  return res.data;
};

/**
 * Fetch test-specific All-India Leaderboard
 */
export const fetchLiveTestLeaderboard = async (
  testId: string
): Promise<LiveLeaderboardData> => {
  const res = await apiClient.get<{ success: boolean; data: LiveLeaderboardData }>(
    `/tests/live/tests/${testId}/leaderboard`
  );
  return res.data.data;
};

/**
 * Fetch student's live test attempt history archive
 */
export const fetchLiveTestHistory = async (): Promise<LiveTestHistoryItem[]> => {
  const res = await apiClient.get<{ success: boolean; data: LiveTestHistoryItem[] }>(
    '/tests/live/history'
  );
  return res.data.data;
};

/**
 * Fetch full question-by-question autopsy review
 */
export const fetchLiveTestAutopsy = async (
  attemptId: string
): Promise<AutopsyReviewData> => {
  const res = await apiClient.get<{ success: boolean; data: AutopsyReviewData }>(
    `/tests/live/attempts/${attemptId}/review`
  );
  return res.data.data;
};

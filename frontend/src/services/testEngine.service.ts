import { apiClient } from '../lib/apiClient';
import type {
  BareActCategory,
  MockTestItem,
  ActiveTestSession,
  AutopsyReviewData,
} from '../types/testEngine.types';

export const fetchBareActCatalogue = async (): Promise<BareActCategory[]> => {
  const res = await apiClient.get<{ success: boolean; data: BareActCategory[] }>(
    '/tests/engine/practice/bare-acts'
  );
  return res.data.data;
};

export const fetchMockSeriesList = async (): Promise<MockTestItem[]> => {
  const res = await apiClient.get<{ success: boolean; data: MockTestItem[] }>(
    '/tests/engine/mock-series'
  );
  return res.data.data;
};

export const startTestSession = async (payload: {
  testId?: string;
  actName?: string;
  count?: number;
  resumeOnly?: boolean;
}): Promise<{ isResumed: boolean; session: ActiveTestSession | null }> => {
  const res = await apiClient.post<{
    success: boolean;
    isResumed: boolean;
    session: ActiveTestSession | null;
  }>('/tests/engine/session/start', payload);
  return res.data;
};

export const fetchActiveSession = async (): Promise<ActiveTestSession | null> => {
  const res = await apiClient.get<{ success: boolean; session: ActiveTestSession | null }>(
    '/tests/engine/session/active'
  );
  return res.data.session;
};

export const updateSessionProgress = async (
  sessionId: string,
  payload: {
    questionIndex: number;
    selectedOption?: number | null;
    isMarkedForReview?: boolean;
    isVisited?: boolean;
    timeSpentDelta?: number;
  }
) => {
  const res = await apiClient.patch<{ success: boolean; savedAt: string }>(
    `/tests/engine/session/${sessionId}/progress`,
    payload
  );
  return res.data;
};

export const submitTestSession = async (
  sessionId: string
): Promise<{
  success: boolean;
  resultSummary: any;
  review: any;
}> => {
  const res = await apiClient.post(`/tests/engine/session/${sessionId}/submit`);
  return res.data;
};

export const fetchAutopsyReview = async (sessionId: string): Promise<AutopsyReviewData> => {
  const res = await apiClient.get<{ success: boolean; data: AutopsyReviewData }>(
    `/tests/engine/session/${sessionId}/review`
  );
  return res.data.data;
};

export const resetBareActHistory = async (actId: string) => {
  const res = await apiClient.post(`/tests/engine/practice/bare-acts/${actId}/reset`);
  return res.data;
};

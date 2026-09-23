import apiClient from '../lib/apiClient';
import type {
  AdminLiveMockTest,
  AdminCreateLiveTestPayload,
  AdminCandidateAttempt,
} from '../types/adminLiveTest.types';

/**
 * Fetch all live mock tests for admin management
 */
export const fetchAdminLiveTests = async (): Promise<AdminLiveMockTest[]> => {
  const res = await apiClient.get<{ success: boolean; data: AdminLiveMockTest[] }>(
    '/tests/admin/live-tests'
  );
  return res.data.data;
};

/**
 * Create and schedule a new live mock test
 */
export const createAdminLiveTest = async (
  payload: AdminCreateLiveTestPayload
): Promise<AdminLiveMockTest> => {
  const res = await apiClient.post<{ success: boolean; data: AdminLiveMockTest; message: string }>(
    '/tests/admin/live-tests',
    payload
  );
  return res.data.data;
};

/**
 * Update an existing mock test
 */
export const updateAdminLiveTest = async (
  id: string,
  payload: Partial<AdminCreateLiveTestPayload>
): Promise<AdminLiveMockTest> => {
  const res = await apiClient.put<{ success: boolean; data: AdminLiveMockTest }>(
    `/tests/admin/live-tests/${id}`,
    payload
  );
  return res.data.data;
};

/**
 * Toggle publication state
 */
export const togglePublishAdminLiveTest = async (
  id: string
): Promise<{ isPublished: boolean; message: string }> => {
  const res = await apiClient.post<{ success: boolean; isPublished: boolean; message: string }>(
    `/tests/admin/live-tests/${id}/publish`
  );
  return res.data;
};

/**
 * Freeze or unfreeze leaderboard
 */
export const freezeLeaderboardAdminLiveTest = async (
  id: string
): Promise<{ isLeaderboardFrozen: boolean; message: string }> => {
  const res = await apiClient.post<{ success: boolean; isLeaderboardFrozen: boolean; message: string }>(
    `/tests/admin/live-tests/${id}/freeze`
  );
  return res.data;
};

/**
 * Fetch candidate attempts for a specific test
 */
export const fetchAdminLiveTestAttempts = async (
  id: string
): Promise<AdminCandidateAttempt[]> => {
  const res = await apiClient.get<{ success: boolean; data: AdminCandidateAttempt[] }>(
    `/tests/admin/live-tests/${id}/attempts`
  );
  return res.data.data;
};

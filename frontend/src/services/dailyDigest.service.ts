import apiClient from '../lib/apiClient';
import type {
  TodayDailyDigestResponse,
  DailyDigestArchiveResponse,
  DigestArchiveFilterParams,
  DigestStreakResponse,
  DailyLegalDigestEdition,
} from '../types/dailyDigest.types';

/**
 * Fetch today's featured Daily Legal Digest & Case Law Brief
 */
export const fetchTodayDailyDigest = async (): Promise<TodayDailyDigestResponse> => {
  const res = await apiClient.get<TodayDailyDigestResponse>('/daily-digest/today');
  return res.data;
};

/**
 * Fetch paginated archive of previous daily digest editions
 */
export const fetchDailyDigestArchive = async (
  params: DigestArchiveFilterParams = {}
): Promise<DailyDigestArchiveResponse> => {
  const query = new URLSearchParams();
  if (params.page) query.append('page', String(params.page));
  if (params.limit) query.append('limit', String(params.limit));
  if (params.search && params.search.trim()) query.append('search', params.search.trim());
  if (params.month) query.append('month', String(params.month));
  if (params.year) query.append('year', String(params.year));
  if (params.subject && params.subject !== 'all') query.append('subject', params.subject);
  if (params.contentType && params.contentType !== 'all') query.append('contentType', params.contentType);

  const res = await apiClient.get<DailyDigestArchiveResponse>(
    `/daily-digest/archive?${query.toString()}`
  );
  return res.data;
};

/**
 * Fetch a specific daily edition by canonical date ("YYYY-MM-DD") or ID
 */
export const fetchEditionByDateOrId = async (
  dateOrId: string
): Promise<{
  success: boolean;
  edition: DailyLegalDigestEdition;
  bookmarkedItemIds: string[];
  readItemIds: string[];
}> => {
  const res = await apiClient.get(`/daily-digest/edition/${dateOrId}`);
  return res.data;
};

/**
 * Mark a digest item as read to track completion & increment daily streak
 */
export const markDigestItemRead = async (
  editionId: string,
  itemId: string
): Promise<{
  success: boolean;
  message: string;
  readItemIds: string[];
  isFullyRead: boolean;
  streak: {
    currentStreak: number;
    longestStreak: number;
    totalEditionsRead: number;
  };
}> => {
  const res = await apiClient.post('/daily-digest/read-item', {
    editionId,
    itemId,
  });
  return res.data;
};

/**
 * Fetch current student reading streak statistics
 */
export const fetchDigestStreak = async (): Promise<DigestStreakResponse> => {
  const res = await apiClient.get<DigestStreakResponse>('/daily-digest/streak');
  return res.data;
};

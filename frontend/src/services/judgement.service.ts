import { apiClient, getAccessToken } from '../lib/apiClient';
import type {
  JudgementFilterParams,
  JudgementsResponse,
  JudgementFilterMetaResponse,
  FeaturedJudgementResponse,
  TodayDailyJudgementResponse,
  JudgementDigest,
} from '../types/judgement.types';

/**
 * Fetch paginated list of published Landmark Judgements with faceted filters
 */
export const fetchPublishedJudgements = async (
  params: JudgementFilterParams = {}
): Promise<JudgementsResponse> => {
  const query = new URLSearchParams();

  if (params.court && params.court !== 'all') query.append('court', params.court);
  if (params.year && params.year !== 'all') query.append('year', String(params.year));
  if (params.subject && params.subject !== 'all') query.append('subject', params.subject);
  if (params.importance && params.importance !== 'all') query.append('importance', params.importance);
  if (params.search && params.search.trim()) query.append('search', params.search.trim());
  if (params.featured) query.append('featured', 'true');
  if (params.sort) query.append('sort', params.sort);
  if (params.page) query.append('page', String(params.page));
  if (params.limit) query.append('limit', String(params.limit));

  const res = await apiClient.get<JudgementsResponse>(`/judgements?${query.toString()}`);
  return res.data;
};

/**
 * Fetch distinct filter values (courts, years, subjects, importances) dynamically
 */
export const fetchJudgementFilterMeta = async (): Promise<JudgementFilterMetaResponse> => {
  const res = await apiClient.get<JudgementFilterMetaResponse>('/judgements/meta/filters');
  return res.data;
};

/**
 * Fetch "Judgement of the Day" / Featured Landmark Precedent
 */
export const fetchFeaturedJudgement = async (): Promise<FeaturedJudgementResponse> => {
  const res = await apiClient.get<FeaturedJudgementResponse>('/judgements/featured');
  return res.data;
};

/**
 * Fetch dynamic "Landmark Judgment of the Day" scheduled for today (IST)
 */
export const fetchTodayDailyJudgement = async (): Promise<TodayDailyJudgementResponse> => {
  const res = await apiClient.get<TodayDailyJudgementResponse>('/judgements/daily/today');
  return res.data;
};

/**
 * Fetch historical archive of Daily Landmark Judgments
 */
export const fetchDailyJudgementArchive = async (
  params: JudgementFilterParams = {}
): Promise<JudgementsResponse> => {
  const query = new URLSearchParams();
  if (params.court && params.court !== 'all') query.append('court', params.court);
  if (params.year && params.year !== 'all') query.append('year', String(params.year));
  if (params.subject && params.subject !== 'all') query.append('subject', params.subject);
  if (params.search && params.search.trim()) query.append('search', params.search.trim());
  if (params.page) query.append('page', String(params.page));
  if (params.limit) query.append('limit', String(params.limit));

  const res = await apiClient.get<JudgementsResponse>(`/judgements/daily/archive?${query.toString()}`);
  return res.data;
};

/**
 * Fetch single Judgement Digest details by ID
 */
export const fetchJudgementById = async (
  id: string
): Promise<{ success: boolean; judgement: JudgementDigest }> => {
  const res = await apiClient.get<{ success: boolean; judgement: JudgementDigest }>(
    `/judgements/${id}`
  );
  return res.data;
};

/**
 * Fetch PDF as Blob for in-app viewer rendering
 */
export const fetchJudgementPdfBlob = async (id: string): Promise<Blob> => {
  const res = await apiClient.get(`/judgements/${id}/preview`, {
    responseType: 'blob',
  });
  return res.data;
};

/**
 * Get direct streaming URL with token parameter for iframe fallback
 */
export const getJudgementDirectStreamUrl = (id: string): string => {
  const token = getAccessToken();
  const baseUrl = apiClient.defaults.baseURL || '';
  return `${baseUrl}/judgements/${id}/preview${token ? `?token=${encodeURIComponent(token)}` : ''}`;
};

/**
 * Download Judgement PDF and trigger browser file save with clean filename
 */
export const downloadJudgementPdf = async (id: string, filename: string): Promise<void> => {
  const res = await apiClient.get(`/judgements/${id}/download`, {
    responseType: 'blob',
  });

  const blob = new Blob([res.data], { type: 'application/pdf' });
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = filename || 'Landmark_Judgement_Digest.pdf';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);
};

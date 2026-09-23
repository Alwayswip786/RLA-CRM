import apiClient from '../lib/apiClient';
import type {
  DailyDigestAdminFilterParams,
  DailyDigestAdminResponse,
  DailyLegalDigestEdition,
  CreateEditionPayload,
  UpdateEditionPayload,
  DigestStatus,
} from '../types/dailyDigest.types';

/**
 * Fetch all editions with 4 KPI metrics & filter options
 */
export const fetchAllEditionsAdmin = async (
  params: DailyDigestAdminFilterParams = {}
): Promise<DailyDigestAdminResponse> => {
  const query = new URLSearchParams();
  if (params.page) query.append('page', String(params.page));
  if (params.limit) query.append('limit', String(params.limit));
  if (params.status && params.status !== 'all') query.append('status', params.status);
  if (params.search && params.search.trim()) query.append('search', params.search.trim());
  if (params.year && params.year !== 'all') query.append('year', params.year);
  if (params.sort) query.append('sort', params.sort);

  const res = await apiClient.get<DailyDigestAdminResponse>(
    `/daily-digest/admin/all?${query.toString()}`
  );
  return res.data;
};

/**
 * Create & schedule new Daily Legal Digest Edition
 */
export const createEditionAdmin = async (
  payload: CreateEditionPayload
): Promise<{ success: boolean; message: string; edition: DailyLegalDigestEdition }> => {
  const res = await apiClient.post<{
    success: boolean;
    message: string;
    edition: DailyLegalDigestEdition;
  }>('/daily-digest/admin/editions', payload);
  return res.data;
};

/**
 * Get single edition for editing
 */
export const getEditionAdmin = async (
  id: string
): Promise<{ success: boolean; edition: DailyLegalDigestEdition }> => {
  const res = await apiClient.get<{ success: boolean; edition: DailyLegalDigestEdition }>(
    `/daily-digest/admin/editions/${id}`
  );
  return res.data;
};

/**
 * Update edition metadata & content blocks
 */
export const updateEditionAdmin = async (
  id: string,
  payload: UpdateEditionPayload
): Promise<{ success: boolean; message: string; edition: DailyLegalDigestEdition }> => {
  const res = await apiClient.put<{
    success: boolean;
    message: string;
    edition: DailyLegalDigestEdition;
  }>(`/daily-digest/admin/editions/${id}`, payload);
  return res.data;
};

/**
 * Update status (draft, scheduled, published, archived)
 */
export const updateEditionStatusAdmin = async (
  id: string,
  status: DigestStatus
): Promise<{ success: boolean; message: string; edition: DailyLegalDigestEdition }> => {
  const res = await apiClient.patch<{
    success: boolean;
    message: string;
    edition: DailyLegalDigestEdition;
  }>(`/daily-digest/admin/editions/${id}/status`, { status });
  return res.data;
};

/**
 * Permanently delete edition
 */
export const deleteEditionAdmin = async (
  id: string
): Promise<{ success: boolean; message: string }> => {
  const res = await apiClient.delete<{ success: boolean; message: string }>(
    `/daily-digest/admin/editions/${id}`
  );
  return res.data;
};

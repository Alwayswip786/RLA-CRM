import apiClient, { getAdminAccessToken } from '../lib/apiClient';
import type {
  JudgementAdminFilterParams,
  JudgementAdminResponse,
  JudgementDigest,
  UpdateJudgementPayload,
} from '../types/judgement.types';

/**
 * Fetch all landmark judgements (published & drafts) with KPI statistics
 */
export const fetchAllJudgementsAdmin = async (
  params: JudgementAdminFilterParams = {}
): Promise<JudgementAdminResponse> => {
  const query = new URLSearchParams();

  if (params.court && params.court !== 'all') query.append('court', params.court);
  if (params.year && params.year !== 'all') query.append('year', String(params.year));
  if (params.subject && params.subject !== 'all') query.append('subject', params.subject);
  if (params.importance && params.importance !== 'all') query.append('importance', params.importance);
  if (params.status && params.status !== 'all') query.append('status', params.status);
  if (params.search && params.search.trim()) query.append('search', params.search.trim());
  if (params.sort) query.append('sort', params.sort);
  if (params.page) query.append('page', String(params.page));
  if (params.limit) query.append('limit', String(params.limit));

  const res = await apiClient.get<JudgementAdminResponse>(
    `/judgements/admin/all?${query.toString()}`
  );
  return res.data;
};

/**
 * Upload new Landmark Judgement with PDF file, cover, and rich metadata
 */
export const uploadJudgement = async (
  formData: FormData,
  onProgress?: (progressPercent: number) => void
): Promise<{ success: boolean; judgement: JudgementDigest; message: string }> => {
  const res = await apiClient.post<{ success: boolean; judgement: JudgementDigest; message: string }>(
    '/judgements',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    }
  );
  return res.data;
};

/**
 * Update judgement metadata
 */
export const updateJudgement = async (
  id: string,
  payload: UpdateJudgementPayload
): Promise<{ success: boolean; judgement: JudgementDigest; message: string }> => {
  const res = await apiClient.put<{ success: boolean; judgement: JudgementDigest; message: string }>(
    `/judgements/${id}`,
    payload
  );
  return res.data;
};

/**
 * Replace existing PDF file with revised or expanded judgement text
 */
export const replaceJudgementPdf = async (
  id: string,
  file: File,
  onProgress?: (progressPercent: number) => void
): Promise<{ success: boolean; judgement: JudgementDigest; message: string }> => {
  const formData = new FormData();
  formData.append('pdf', file);

  const res = await apiClient.patch<{
    success: boolean;
    judgement: JudgementDigest;
    message: string;
  }>(`/judgements/${id}/file`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total && onProgress) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percent);
      }
    },
  });
  return res.data;
};

/**
 * Toggle publish / draft status
 */
export const togglePublishJudgement = async (
  id: string
): Promise<{
  success: boolean;
  isPublished: boolean;
  message: string;
  judgement: JudgementDigest;
}> => {
  const res = await apiClient.patch<{
    success: boolean;
    isPublished: boolean;
    message: string;
    judgement: JudgementDigest;
  }>(`/judgements/${id}/publish`);
  return res.data;
};

/**
 * Delete judgement record and physical storage files
 */
export const deleteJudgement = async (
  id: string
): Promise<{ success: boolean; message: string }> => {
  const res = await apiClient.delete<{ success: boolean; message: string }>(
    `/judgements/${id}`
  );
  return res.data;
};

/**
 * Trigger file download
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

/**
 * Get direct stream URL with admin token
 */
export const getDirectStreamUrl = (id: string): string => {
  const token = getAdminAccessToken();
  const baseUrl = apiClient.defaults.baseURL || '';
  return `${baseUrl}/judgements/${id}/preview${token ? `?token=${encodeURIComponent(token)}` : ''}`;
};

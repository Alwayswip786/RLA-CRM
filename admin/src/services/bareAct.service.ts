import apiClient, { getAdminAccessToken } from '../lib/apiClient';
import type {
  BareActAdminFilterParams,
  BareActAdminResponse,
  BareActNote,
  UpdateBareActPayload,
} from '../types/bareAct.types';

/**
 * Fetch all Bare Act Decoding Notes (published & drafts) with KPI statistics
 */
export const fetchAllNotesAdmin = async (
  params: BareActAdminFilterParams = {}
): Promise<BareActAdminResponse> => {
  const query = new URLSearchParams();

  if (params.category && params.category !== 'all') query.append('category', params.category);
  if (params.actName && params.actName !== 'all') query.append('actName', params.actName);
  if (params.status && params.status !== 'all') query.append('status', params.status);
  if (params.search && params.search.trim()) query.append('search', params.search.trim());
  if (params.sort) query.append('sort', params.sort);
  if (params.page) query.append('page', String(params.page));
  if (params.limit) query.append('limit', String(params.limit));

  const res = await apiClient.get<BareActAdminResponse>(
    `/bare-acts/admin/all?${query.toString()}`
  );
  return res.data;
};

/**
 * Upload new Bare Act Decoding Note with PDF file and rich metadata
 */
export const uploadNote = async (
  formData: FormData,
  onProgress?: (progressPercent: number) => void
): Promise<{ success: boolean; note: BareActNote; message: string }> => {
  const res = await apiClient.post<{ success: boolean; note: BareActNote; message: string }>(
    '/bare-acts',
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
 * Update note metadata
 */
export const updateNote = async (
  id: string,
  payload: UpdateBareActPayload
): Promise<{ success: boolean; note: BareActNote; message: string }> => {
  const res = await apiClient.put<{ success: boolean; note: BareActNote; message: string }>(
    `/bare-acts/${id}`,
    payload
  );
  return res.data;
};

/**
 * Replace existing PDF file with updated statutory document
 */
export const replaceNotePdf = async (
  id: string,
  file: File,
  onProgress?: (progressPercent: number) => void
): Promise<{ success: boolean; note: BareActNote; message: string }> => {
  const formData = new FormData();
  formData.append('pdf', file);

  const res = await apiClient.patch<{
    success: boolean;
    note: BareActNote;
    message: string;
  }>(`/bare-acts/${id}/file`, formData, {
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
 * Toggle publish/draft status
 */
export const togglePublishNote = async (
  id: string
): Promise<{ success: boolean; isPublished: boolean; message: string; note: BareActNote }> => {
  const res = await apiClient.patch<{
    success: boolean;
    isPublished: boolean;
    message: string;
    note: BareActNote;
  }>(`/bare-acts/${id}/publish`);
  return res.data;
};

/**
 * Delete Bare Act Note
 */
export const deleteNote = async (
  id: string
): Promise<{ success: boolean; message: string }> => {
  const res = await apiClient.delete<{ success: boolean; message: string }>(`/bare-acts/${id}`);
  return res.data;
};

/**
 * Get direct streaming URL with token parameter for iframe / preview
 */
export const getNoteDirectStreamUrl = (id: string): string => {
  const token = getAdminAccessToken();
  const baseUrl = apiClient.defaults.baseURL || '';
  return `${baseUrl}/bare-acts/${id}/preview${token ? `?token=${encodeURIComponent(token)}` : ''}`;
};

/**
 * Trigger download of Bare Act Note PDF
 */
export const downloadNotePdf = async (id: string, filename: string): Promise<void> => {
  const res = await apiClient.get(`/bare-acts/${id}/download`, {
    responseType: 'blob',
  });

  const blob = new Blob([res.data], { type: 'application/pdf' });
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = filename || 'Bare_Act_Decoding_Note.pdf';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);
};

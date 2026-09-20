import apiClient, { getAdminAccessToken } from '../lib/apiClient';
import type {
  PyqAdminFilterParams,
  PyqAdminResponse,
  PyqPaper,
  UpdatePyqPayload,
} from '../types/pyq.types';

/**
 * Fetch all papers (published & drafts) with KPI statistics
 */
export const fetchAllPyqsAdmin = async (
  params: PyqAdminFilterParams = {}
): Promise<PyqAdminResponse> => {
  const query = new URLSearchParams();

  if (params.exam && params.exam !== 'all') query.append('exam', params.exam);
  if (params.year && params.year !== 'all') query.append('year', String(params.year));
  if (params.stage && params.stage !== 'all') query.append('stage', params.stage);
  if (params.status && params.status !== 'all') query.append('status', params.status);
  if (params.search && params.search.trim()) query.append('search', params.search.trim());
  if (params.sort) query.append('sort', params.sort);
  if (params.page) query.append('page', String(params.page));
  if (params.limit) query.append('limit', String(params.limit));

  const res = await apiClient.get<PyqAdminResponse>(`/pyqs/admin/all?${query.toString()}`);
  return res.data;
};

/**
 * Upload new Solved PYQ with PDF file and metadata with upload progress tracking
 */
export const uploadPyq = async (
  formData: FormData,
  onProgress?: (progressPercent: number) => void
): Promise<{ success: boolean; pyq: PyqPaper; message: string }> => {
  const res = await apiClient.post<{ success: boolean; pyq: PyqPaper; message: string }>(
    '/pyqs',
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
 * Update paper metadata
 */
export const updatePyq = async (
  id: string,
  payload: UpdatePyqPayload
): Promise<{ success: boolean; pyq: PyqPaper; message: string }> => {
  const res = await apiClient.put<{ success: boolean; pyq: PyqPaper; message: string }>(
    `/pyqs/${id}`,
    payload
  );
  return res.data;
};

/**
 * Replace existing PDF file with revised solution
 */
export const replacePyqPdf = async (
  id: string,
  file: File,
  onProgress?: (progressPercent: number) => void
): Promise<{ success: boolean; pyq: PyqPaper; message: string }> => {
  const formData = new FormData();
  formData.append('pdf', file);

  const res = await apiClient.patch<{ success: boolean; pyq: PyqPaper; message: string }>(
    `/pyqs/${id}/file`,
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
 * Toggle publish / draft status
 */
export const togglePublish = async (
  id: string
): Promise<{ success: boolean; isPublished: boolean; message: string; pyq: PyqPaper }> => {
  const res = await apiClient.patch<{
    success: boolean;
    isPublished: boolean;
    message: string;
    pyq: PyqPaper;
  }>(`/pyqs/${id}/publish`);
  return res.data;
};

/**
 * Delete paper record and physical files
 */
export const deletePyq = async (id: string): Promise<{ success: boolean; message: string }> => {
  const res = await apiClient.delete<{ success: boolean; message: string }>(`/pyqs/${id}`);
  return res.data;
};

/**
 * Trigger file download
 */
export const downloadPyqPdf = async (id: string, filename: string): Promise<void> => {
  const res = await apiClient.get(`/pyqs/${id}/download`, {
    responseType: 'blob',
  });

  const blob = new Blob([res.data], { type: 'application/pdf' });
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = filename || 'Solved_PYQ_Paper.pdf';
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
  return `${baseUrl}/pyqs/${id}/preview${token ? `?token=${encodeURIComponent(token)}` : ''}`;
};

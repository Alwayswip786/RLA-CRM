import { apiClient, getAccessToken } from '../lib/apiClient';
import type {
  PyqFilterParams,
  PyqsResponse,
  PyqFilterMetaResponse,
  PyqPaper,
} from '../types/pyq.types';

/**
 * Fetch paginated list of published PYQ papers with faceted filters
 */
export const fetchPublishedPyqs = async (params: PyqFilterParams = {}): Promise<PyqsResponse> => {
  const query = new URLSearchParams();

  if (params.exam && params.exam !== 'all') query.append('exam', params.exam);
  if (params.year && params.year !== 'all') query.append('year', String(params.year));
  if (params.stage && params.stage !== 'all') query.append('stage', params.stage);
  if (params.subject && params.subject !== 'all') query.append('subject', params.subject);
  if (params.search && params.search.trim()) query.append('search', params.search.trim());
  if (params.featured) query.append('featured', 'true');
  if (params.sort) query.append('sort', params.sort);
  if (params.page) query.append('page', String(params.page));
  if (params.limit) query.append('limit', String(params.limit));

  const res = await apiClient.get<PyqsResponse>(`/pyqs?${query.toString()}`);
  return res.data;
};

/**
 * Fetch distinct filter values (exams, years, stages, subjects) dynamically
 */
export const fetchPyqFilterMeta = async (): Promise<PyqFilterMetaResponse> => {
  const res = await apiClient.get<PyqFilterMetaResponse>('/pyqs/meta/filters');
  return res.data;
};

/**
 * Fetch single PYQ record details with related papers
 */
export const fetchPyqById = async (
  id: string
): Promise<{ success: boolean; pyq: PyqPaper; related: any[] }> => {
  const res = await apiClient.get<{ success: boolean; pyq: PyqPaper; related: any[] }>(
    `/pyqs/${id}`
  );
  return res.data;
};

/**
 * Fetch PDF as Blob for high-fidelity in-app viewer rendering
 */
export const fetchPdfBlob = async (id: string): Promise<Blob> => {
  const res = await apiClient.get(`/pyqs/${id}/preview`, {
    responseType: 'blob',
  });
  return res.data;
};

/**
 * Get direct streaming URL with token parameter for iframe / new tab fallback
 */
export const getDirectStreamUrl = (id: string): string => {
  const token = getAccessToken();
  const baseUrl = apiClient.defaults.baseURL || '';
  return `${baseUrl}/pyqs/${id}/preview${token ? `?token=${encodeURIComponent(token)}` : ''}`;
};

/**
 * Download Solved PDF and trigger browser file save with clean filename
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

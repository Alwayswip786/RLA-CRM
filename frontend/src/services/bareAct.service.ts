import { apiClient, getAccessToken } from '../lib/apiClient';
import type {
  BareActFilterParams,
  BareActsResponse,
  BareActFilterMetaResponse,
  FeaturedBareActResponse,
  BareActNote,
} from '../types/bareAct.types';

/**
 * Fetch paginated list of published Bare Act Decoding Notes with faceted filters
 */
export const fetchPublishedNotes = async (
  params: BareActFilterParams = {}
): Promise<BareActsResponse> => {
  const query = new URLSearchParams();

  if (params.category && params.category !== 'all') query.append('category', params.category);
  if (params.actName && params.actName !== 'all') query.append('actName', params.actName);
  if (params.chapter && params.chapter !== 'all') query.append('chapter', params.chapter);
  if (params.difficulty && params.difficulty !== 'all') query.append('difficulty', params.difficulty);
  if (params.search && params.search.trim()) query.append('search', params.search.trim());
  if (params.featured) query.append('featured', 'true');
  if (params.sort) query.append('sort', params.sort);
  if (params.page) query.append('page', String(params.page));
  if (params.limit) query.append('limit', String(params.limit));

  const res = await apiClient.get<BareActsResponse>(`/bare-acts?${query.toString()}`);
  return res.data;
};

/**
 * Fetch distinct filter values (Acts, Categories, Chapters, Years) dynamically
 */
export const fetchBareActFilterMeta = async (): Promise<BareActFilterMetaResponse> => {
  const res = await apiClient.get<BareActFilterMetaResponse>('/bare-acts/meta/filters');
  return res.data;
};

/**
 * Fetch "Act of the Week" / Featured Spotlight Decoding Note
 */
export const fetchFeaturedBareAct = async (): Promise<FeaturedBareActResponse> => {
  const res = await apiClient.get<FeaturedBareActResponse>('/bare-acts/featured');
  return res.data;
};

/**
 * Fetch single Bare Act Note details by ID
 */
export const fetchNoteById = async (
  id: string
): Promise<{ success: boolean; note: BareActNote }> => {
  const res = await apiClient.get<{ success: boolean; note: BareActNote }>(`/bare-acts/${id}`);
  return res.data;
};

/**
 * Fetch PDF as Blob for in-app viewer rendering
 */
export const fetchNotePdfBlob = async (id: string): Promise<Blob> => {
  const res = await apiClient.get(`/bare-acts/${id}/preview`, {
    responseType: 'blob',
  });
  return res.data;
};

/**
 * Get direct streaming URL with token parameter for iframe / embedded viewer
 */
export const getNoteDirectStreamUrl = (id: string): string => {
  const token = getAccessToken();
  const baseUrl = apiClient.defaults.baseURL || '';
  return `${baseUrl}/bare-acts/${id}/preview${token ? `?token=${encodeURIComponent(token)}` : ''}`;
};

/**
 * Download Bare Act PDF and trigger browser file save with clean filename
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

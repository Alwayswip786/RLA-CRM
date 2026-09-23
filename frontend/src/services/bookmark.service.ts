import { apiClient } from '../lib/apiClient';
import type {
  BookmarkListResponse,
  BookmarkIdsResponse,
  BookmarkTogglePayload,
  BookmarkToggleResponse,
  BookmarkItem,
} from '../types/bookmark.types';

export interface BookmarkFilterParams {
  itemType?: string;
  subject?: string;
  search?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

/**
 * Fetch student's personal vault items with KPI counts, subjects, and filters
 */
export const fetchBookmarks = async (
  params: BookmarkFilterParams = {}
): Promise<BookmarkListResponse> => {
  const query = new URLSearchParams();

  if (params.itemType && params.itemType !== 'all') query.append('itemType', params.itemType);
  if (params.subject && params.subject !== 'all') query.append('subject', params.subject);
  if (params.search && params.search.trim()) query.append('search', params.search.trim());
  if (params.sort) query.append('sort', params.sort);
  if (params.page) query.append('page', String(params.page));
  if (params.limit) query.append('limit', String(params.limit));

  const res = await apiClient.get<BookmarkListResponse>(`/bookmarks?${query.toString()}`);
  return res.data;
};

/**
 * Fetch all starred item IDs for instant gold star styling
 */
export const fetchBookmarkIds = async (): Promise<BookmarkIdsResponse> => {
  const res = await apiClient.get<BookmarkIdsResponse>('/bookmarks/ids');
  return res.data;
};

/**
 * 1-Click Star / Unstar toggle
 */
export const toggleBookmarkApi = async (
  payload: BookmarkTogglePayload
): Promise<BookmarkToggleResponse> => {
  const res = await apiClient.post<BookmarkToggleResponse>('/bookmarks/toggle', payload);
  return res.data;
};

/**
 * Update student's personal annotation for a bookmarked item
 */
export const updateBookmarkAnnotation = async (
  id: string,
  annotation: string
): Promise<{ success: boolean; bookmark: BookmarkItem; message: string }> => {
  const res = await apiClient.put<{ success: boolean; bookmark: BookmarkItem; message: string }>(
    `/bookmarks/${id}/annotation`,
    { annotation }
  );
  return res.data;
};

/**
 * Delete bookmark by ID
 */
export const deleteBookmarkApi = async (
  id: string
): Promise<{ success: boolean; message: string }> => {
  const res = await apiClient.delete<{ success: boolean; message: string }>(`/bookmarks/${id}`);
  return res.data;
};

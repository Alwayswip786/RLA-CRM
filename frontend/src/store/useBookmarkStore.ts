import { create } from 'zustand';
import {
  fetchBookmarkIds,
  toggleBookmarkApi,
  deleteBookmarkApi,
} from '../services/bookmark.service';
import type {
  BookmarkCounts,
  BookmarkTogglePayload,
} from '../types/bookmark.types';
import { toast } from '../lib/toast';

interface BookmarkStoreState {
  bookmarkedIds: Set<string>;
  isLoaded: boolean;
  isLoading: boolean;
  counts: BookmarkCounts;
  fetchBookmarkIds: () => Promise<void>;
  isBookmarked: (itemId: string) => boolean;
  toggleBookmark: (payload: BookmarkTogglePayload) => Promise<boolean>;
  removeBookmark: (bookmarkId: string, itemId: string) => Promise<boolean>;
  setCounts: (counts: BookmarkCounts) => void;
}

export const useBookmarkStore = create<BookmarkStoreState>((set, get) => ({
  bookmarkedIds: new Set<string>(),
  isLoaded: false,
  isLoading: false,
  counts: {
    totalCount: 0,
    mcqCount: 0,
    judgmentCount: 0,
    bareActCount: 0,
    digestCount: 0,
  },

  setCounts: (counts) => set({ counts }),

  fetchBookmarkIds: async () => {
    try {
      set({ isLoading: true });
      const res = await fetchBookmarkIds();
      if (res.success && Array.isArray(res.itemIds)) {
        set({
          bookmarkedIds: new Set(res.itemIds),
          isLoaded: true,
        });
      }
    } catch {
      // Keep silent on initial background load
    } finally {
      set({ isLoading: false });
    }
  },

  isBookmarked: (itemId: string) => {
    return get().bookmarkedIds.has(itemId);
  },

  toggleBookmark: async (payload: BookmarkTogglePayload): Promise<boolean> => {
    const { bookmarkedIds, counts } = get();
    const isCurrentlyBookmarked = bookmarkedIds.has(payload.itemId);
    const nextSet = new Set(bookmarkedIds);

    // Optimistic toggle
    if (isCurrentlyBookmarked) {
      nextSet.delete(payload.itemId);
    } else {
      nextSet.add(payload.itemId);
    }
    set({ bookmarkedIds: nextSet });

    try {
      const res = await toggleBookmarkApi(payload);
      if (res.success) {
        toast.success(
          res.bookmarked
            ? `Saved "${payload.title || 'Item'}" to Starred Vault`
            : `Removed "${payload.title || 'Item'}" from Starred Vault`
        );

        // Update local count estimate
        const delta = res.bookmarked ? 1 : -1;
        set({
          counts: {
            ...counts,
            totalCount: Math.max(0, counts.totalCount + delta),
          },
        });
        return res.bookmarked;
      }
      return !isCurrentlyBookmarked;
    } catch (err: any) {
      // Revert on failure
      set({ bookmarkedIds });
      toast.error(err?.response?.data?.message || 'Failed to update bookmark');
      return isCurrentlyBookmarked;
    }
  },

  removeBookmark: async (bookmarkId: string, itemId: string): Promise<boolean> => {
    const { bookmarkedIds, counts } = get();
    const nextSet = new Set(bookmarkedIds);
    nextSet.delete(itemId);
    set({ bookmarkedIds: nextSet });

    try {
      const res = await deleteBookmarkApi(bookmarkId);
      if (res.success) {
        toast.info('Item removed from Starred Vault');
        set({
          counts: {
            ...counts,
            totalCount: Math.max(0, counts.totalCount - 1),
          },
        });
        return true;
      }
      return false;
    } catch (err: any) {
      // Revert
      set({ bookmarkedIds });
      toast.error(err?.response?.data?.message || 'Failed to remove from vault');
      return false;
    }
  },
}));

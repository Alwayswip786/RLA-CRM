import { create } from 'zustand';
import { apiClient } from '../lib/apiClient';
import { getChamberSocket, connectChamberSocket } from '../lib/socket';
import { AUTH_STORAGE_KEY } from './useAuthStore';

export interface NoticeItem {
  _id: string;
  circularNo: string;
  title: string;
  category: string;
  priority: 'urgent' | 'normal';
  targetCohorts?: string;
  publishedAt: string;
  content: string;
  issuedBy?: string;
  authorName?: string;
  isPublished?: boolean;
}

interface NoticeStoreState {
  notices: NoticeItem[];
  totalCount: number;
  unreadCount: number;
  unreadUrgentCount: number;
  isLoading: boolean;
  lastCheckedAt: number | null;
  fetchNotices: () => Promise<void>;
  markAllAsRead: () => void;
  markAsRead: (noticeId: string) => void;
  isNoticeRead: (noticeId: string) => boolean;
  initRealtimeListener: () => () => void;
}

const getStorageKey = (): string => {
  if (typeof window === 'undefined') return 'rla_read_notices_default';
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (raw) {
      const user = JSON.parse(raw);
      const identifier = user?.rollNo || user?._id || user?.email;
      if (identifier) return `rla_read_notices_${identifier}`;
    }
  } catch {
    // fallback
  }
  return 'rla_read_notices_default';
};

const loadReadIdsFromStorage = (): Set<string> => {
  if (typeof window === 'undefined') return new Set();
  try {
    const key = getStorageKey();
    const raw = localStorage.getItem(key);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return new Set(arr);
    }
  } catch {
    // ignore
  }
  return new Set();
};

const saveReadIdsToStorage = (ids: Set<string>) => {
  if (typeof window === 'undefined') return;
  try {
    const key = getStorageKey();
    localStorage.setItem(key, JSON.stringify(Array.from(ids)));
  } catch {
    // ignore
  }
};

export const useNoticeStore = create<NoticeStoreState>((set, get) => ({
  notices: [],
  totalCount: 0,
  unreadCount: 0,
  unreadUrgentCount: 0,
  isLoading: false,
  lastCheckedAt: null,

  fetchNotices: async () => {
    try {
      set({ isLoading: true });
      const res = await apiClient.get<{ success: boolean; count: number; notices: NoticeItem[] }>('/notices');
      if (res.data?.notices) {
        const rawNotices = res.data.notices;
        const readIds = loadReadIdsFromStorage();

        const unreadList = rawNotices.filter((n) => !readIds.has(n._id));
        const urgentUnread = unreadList.filter((n) => n.priority === 'urgent');

        set({
          notices: rawNotices,
          totalCount: rawNotices.length,
          unreadCount: unreadList.length,
          unreadUrgentCount: urgentUnread.length,
          lastCheckedAt: Date.now(),
        });
      }
    } catch (err) {
      console.warn('Failed to load notices for store:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  markAllAsRead: () => {
    const { notices } = get();
    if (notices.length === 0) return;

    const readIds = loadReadIdsFromStorage();
    notices.forEach((n) => readIds.add(n._id));
    saveReadIdsToStorage(readIds);

    set({
      unreadCount: 0,
      unreadUrgentCount: 0,
    });
  },

  markAsRead: (noticeId: string) => {
    const readIds = loadReadIdsFromStorage();
    if (readIds.has(noticeId)) return;

    readIds.add(noticeId);
    saveReadIdsToStorage(readIds);

    const { notices } = get();
    const unreadList = notices.filter((n) => !readIds.has(n._id));
    const urgentUnread = unreadList.filter((n) => n.priority === 'urgent');

    set({
      unreadCount: unreadList.length,
      unreadUrgentCount: urgentUnread.length,
    });
  },

  isNoticeRead: (noticeId: string) => {
    const readIds = loadReadIdsFromStorage();
    return readIds.has(noticeId);
  },

  initRealtimeListener: () => {
    // Initial fetch
    get().fetchNotices();

    let isMounted = true;
    let socketInstance: ReturnType<typeof getChamberSocket> | null = null;

    // Connect to WebSocket namespace
    connectChamberSocket()
      .then((socket) => {
        if (!isMounted) return;
        socketInstance = socket;

        const handleNoticeNew = (newNotice: NoticeItem) => {
          if (!isMounted) return;
          const current = get().notices;
          // Avoid duplicate insertion
          const exists = current.some((n) => n._id === newNotice._id);
          const updatedList = exists
            ? current.map((n) => (n._id === newNotice._id ? newNotice : n))
            : [newNotice, ...current];

          const readIds = loadReadIdsFromStorage();
          const unreadList = updatedList.filter((n) => !readIds.has(n._id));
          const urgentUnread = unreadList.filter((n) => n.priority === 'urgent');

          set({
            notices: updatedList,
            totalCount: updatedList.length,
            unreadCount: unreadList.length,
            unreadUrgentCount: urgentUnread.length,
          });
        };

        const handleNoticeUpdated = (updatedNotice: NoticeItem) => {
          if (!isMounted) return;
          const current = get().notices;
          const updatedList = current.map((n) =>
            n._id === updatedNotice._id ? { ...n, ...updatedNotice } : n
          );
          const readIds = loadReadIdsFromStorage();
          const unreadList = updatedList.filter((n) => !readIds.has(n._id));
          const urgentUnread = unreadList.filter((n) => n.priority === 'urgent');

          set({
            notices: updatedList,
            totalCount: updatedList.length,
            unreadCount: unreadList.length,
            unreadUrgentCount: urgentUnread.length,
          });
        };

        const handleNoticeDeleted = ({ id }: { id: string }) => {
          if (!isMounted) return;
          const current = get().notices;
          const updatedList = current.filter((n) => n._id !== id);
          const readIds = loadReadIdsFromStorage();
          const unreadList = updatedList.filter((n) => !readIds.has(n._id));
          const urgentUnread = unreadList.filter((n) => n.priority === 'urgent');

          set({
            notices: updatedList,
            totalCount: updatedList.length,
            unreadCount: unreadList.length,
            unreadUrgentCount: urgentUnread.length,
          });
        };

        socket.on('notice:new', handleNoticeNew);
        socket.on('notice:updated', handleNoticeUpdated);
        socket.on('notice:deleted', handleNoticeDeleted);
      })
      .catch((err) => console.warn('Socket notice listener connect error:', err));

    // Polling fallback every 45s & on window focus
    const interval = setInterval(() => {
      if (isMounted) get().fetchNotices();
    }, 45_000);

    const onFocus = () => {
      if (isMounted) get().fetchNotices();
    };
    window.addEventListener('focus', onFocus);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      if (socketInstance) {
        socketInstance.off('notice:new');
        socketInstance.off('notice:updated');
        socketInstance.off('notice:deleted');
      }
    };
  },
}));

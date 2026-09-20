import { create } from 'zustand';
import apiClient, { setAdminAccessToken } from '../lib/apiClient';

export interface AdminUser {
  _id?: string;
  name: string;
  salutation?: string;
  email: string;
  rollNo?: string;
  role: 'admin' | 'faculty';
  title: string;
  isLoggedIn: boolean;
}

interface AdminAuthState {
  admin: AdminUser | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  login: (userData: Partial<AdminUser>, accessToken?: string) => void;
  logout: () => Promise<void>;
  initSession: () => Promise<void>;
}

export const ADMIN_STORAGE_KEY = 'rla_admin_session';

const resolveTitle = (role: string, email = ''): string => {
  if (role === 'admin') {
    if (email.toLowerCase().includes('director') || email.toLowerCase().includes('rajinder')) {
      return 'Director & Academic Dean';
    }
    return 'Executive Administrator';
  }
  if (role === 'faculty') {
    return 'Senior Faculty & Mains Evaluator';
  }
  return 'Institutional Officer';
};

const getInitialSession = (): AdminUser | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(ADMIN_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && (parsed.role === 'admin' || parsed.role === 'faculty')) {
      return {
        ...parsed,
        title: parsed.title || resolveTitle(parsed.role, parsed.email),
        isLoggedIn: true,
      };
    }
  } catch (err) {
    console.error('Failed to parse admin session:', err);
  }
  return null;
};

const initialSession = getInitialSession();

export const useAdminAuthStore = create<AdminAuthState>((set, get) => ({
  admin: initialSession,
  isAuthenticated: !!initialSession,
  isInitialized: false,

  login: (userData, accessToken) => {
    if (accessToken) {
      setAdminAccessToken(accessToken);
    }

    const prev = get().admin;
    const role = (userData.role === 'faculty' ? 'faculty' : 'admin') as 'admin' | 'faculty';
    const email = userData.email || prev?.email || '';

    const newAdmin: AdminUser = {
      _id: userData._id || prev?._id,
      name: userData.name || prev?.name || 'Adv. Rajinder Sir',
      salutation: userData.salutation || prev?.salutation || 'Adv.',
      email,
      rollNo: userData.rollNo || prev?.rollNo || 'RLA-ADMIN',
      role,
      title: userData.title || prev?.title || resolveTitle(role, email),
      isLoggedIn: true,
      ...(prev || {}),
      ...userData,
    };

    try {
      localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(newAdmin));
    } catch (e) {
      console.error('Failed to persist admin session:', e);
    }

    set({ admin: newAdmin, isAuthenticated: true });
  },

  logout: async () => {
    try {
      await apiClient.post('/auth/logout').catch(() => undefined);
    } catch {
      // Ignore network errors
    }

    setAdminAccessToken(null);
    try {
      localStorage.removeItem(ADMIN_STORAGE_KEY);
    } catch (e) {
      console.error('Failed to clear admin session:', e);
    }

    set({ admin: null, isAuthenticated: false });
  },

  initSession: async () => {
    const existing = localStorage.getItem(ADMIN_STORAGE_KEY);
    if (!existing) {
      set({ isInitialized: true, isAuthenticated: false, admin: null });
      return;
    }

    try {
      const response = await apiClient.get('/auth/me');
      const u = response.data?.user;

      if (u && (u.role === 'admin' || u.role === 'faculty')) {
        get().login({
          _id: u._id,
          name: u.name,
          salutation: u.salutation,
          email: u.email,
          rollNo: u.rollNo,
          role: u.role,
          title: resolveTitle(u.role, u.email),
          isLoggedIn: true,
        });
      } else {
        // Not an admin or faculty -> clear unauthorized session
        setAdminAccessToken(null);
        localStorage.removeItem(ADMIN_STORAGE_KEY);
        set({ admin: null, isAuthenticated: false });
      }
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        setAdminAccessToken(null);
        try {
          localStorage.removeItem(ADMIN_STORAGE_KEY);
        } catch {
          // ignore
        }
        set({ admin: null, isAuthenticated: false });
      }
    } finally {
      set({ isInitialized: true });
    }
  },
}));

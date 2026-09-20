import { create } from 'zustand';
import { apiClient, setAccessToken, setFallbackRefreshToken } from '../lib/apiClient';
import { useThemeStore, type ThemeMode } from './useThemeStore';

export interface StudentUser {
  _id?: string;
  name: string;
  salutation?: 'Adv.' | 'Mr.' | 'Ms.' | 'Dr.';
  rollNo: string;
  email?: string;
  phone?: string;
  identifier?: string;
  targetExam?: string;
  targetState?: string;
  targetYear?: string;
  academicStatus?: string;
  themePreference?: ThemeMode;
  role?: string;
  isLoggedIn: boolean;
  needsOnboarding?: boolean;
  hasPassword?: boolean;
  loginTime?: string;
}

interface AuthState {
  user: StudentUser | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  login: (userData: Partial<StudentUser>, accessToken?: string) => void;
  logout: () => Promise<void>;
  updateProfile: (updatedData: Partial<StudentUser>) => void;
  completeOnboarding: (data: Partial<StudentUser>) => void;
  initSession: () => Promise<void>;
}

export const AUTH_STORAGE_KEY = 'rla_student_session';

const getInitialSession = (): StudentUser | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && (parsed.isLoggedIn || parsed.rollNo || parsed.name)) {
      return {
        isLoggedIn: true,
        ...parsed,
      };
    }
  } catch (err) {
    console.error('Failed to parse existing auth session:', err);
  }
  return null;
};

const initialUser = getInitialSession();

export const useAuthStore = create<AuthState>((set, get) => ({
  user: initialUser,
  isAuthenticated: !!initialUser && initialUser.isLoggedIn,
  isInitialized: false,

  login: (userData, accessToken) => {
    if (accessToken) {
      setAccessToken(accessToken);
    }

    const prev = get().user;
    const newUser: StudentUser = {
      name: userData.name || 'Adv. Rohit Verma',
      rollNo: userData.rollNo || 'RLA2026001',
      email: userData.email || '',
      phone: userData.phone || '',
      identifier: userData.identifier || '',
      targetExam: userData.targetExam || 'Delhi Judicial Service (DJS)',
      targetState: userData.targetState || 'Delhi / NCR',
      targetYear: userData.targetYear || '2025-2026',
      academicStatus: userData.academicStatus || 'Full-Time Aspirant',
      themePreference: userData.themePreference || 'light',
      isLoggedIn: true,
      needsOnboarding: userData.needsOnboarding ?? false,
      hasPassword: userData.hasPassword ?? prev?.hasPassword,
      loginTime: userData.loginTime || new Date().toISOString(),
      ...(prev || {}),
      ...userData,
    };

    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser));
    } catch (e) {
      console.error('Failed to persist student session:', e);
    }

    // If theme preference exists from backend, apply it
    if (newUser.themePreference) {
      useThemeStore.getState().setTheme(newUser.themePreference);
    }

    set({ user: newUser, isAuthenticated: true });
  },

  logout: async () => {
    try {
      await apiClient.post('/auth/logout').catch(() => undefined);
    } catch {
      // Ignore network errors on logout
    }

    setAccessToken(null);
    setFallbackRefreshToken(null);

    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      sessionStorage.removeItem('rla_pending_mobile');
      sessionStorage.removeItem('rla_pending_email');
    } catch (e) {
      console.error('Failed to clear student session:', e);
    }

    set({ user: null, isAuthenticated: false });
  },

  updateProfile: (updatedData) => {
    const current = get().user;
    if (!current) return;

    const mergedUser: StudentUser = {
      ...current,
      ...updatedData,
    };

    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(mergedUser));
    } catch (e) {
      console.error('Failed to update student session:', e);
    }

    set({ user: mergedUser });
  },

  completeOnboarding: (data) => {
    const current = get().user;
    if (!current) return;

    const updated: StudentUser = {
      ...current,
      ...data,
      needsOnboarding: false,
    };

    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to complete student onboarding session:', e);
    }

    set({ user: updated });
  },

  initSession: async () => {
    const existingSession = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!existingSession) {
      set({ isInitialized: true, isAuthenticated: false, user: null });
      return;
    }

    try {
      const response = await apiClient.get('/auth/me');
      if (response.data?.user) {
        const u = response.data.user;
        get().login({
          _id: u._id,
          name: u.name,
          salutation: u.salutation,
          rollNo: u.rollNo,
          email: u.email,
          phone: u.phone,
          targetExam: u.targetExam,
          targetState: u.targetState,
          targetYear: u.targetYear,
          academicStatus: u.academicStatus,
          themePreference: u.themePreference,
          needsOnboarding: u.needsOnboarding,
          hasPassword: u.hasPassword,
          isLoggedIn: true,
        });

        if (u.themePreference) {
          useThemeStore.getState().setTheme(u.themePreference);
        }
      }
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        setAccessToken(null);
        setFallbackRefreshToken(null);
        try {
          localStorage.removeItem(AUTH_STORAGE_KEY);
        } catch {
          // ignore
        }
        set({ user: null, isAuthenticated: false });
      }
    } finally {
      set({ isInitialized: true });
    }
  },
}));

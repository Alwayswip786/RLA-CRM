import { create } from 'zustand';
import { apiClient } from '../lib/apiClient';
import type { PublicSystemSettings, PublicAnnouncementBanner } from '../types/settings.types';

interface SettingsStoreState {
  settings: PublicSystemSettings | null;
  banner: PublicAnnouncementBanner | null;
  isLoading: boolean;
  error: string | null;
  fetchPublicSettings: () => Promise<void>;
}

const DEFAULT_BANNER: PublicAnnouncementBanner = {
  enabled: true,
  badgeText: 'ADMISSIONS 2025–26',
  message:
    'Comprehensive Judicial Foundation Batch Open • Daily Mains Answer Writing (DAW) Starts Monday',
  actionLink: '/signup',
  actionText: 'Enroll Now',
  theme: 'gold',
  displayLocations: ['landing', 'student_dashboard'],
};

const DEFAULT_SETTINGS: PublicSystemSettings = {
  appName: 'Rajinder Law Academy',
  tagline: 'Pioneering Judicial Services Examination & Higher Legal Studies',
  appVersion: '2.4.0',
  supportEmail: 'admissions@rajinderlawacademy.com',
  contactPhone: '+91 98111 00001',
  campusAddress: 'Chamber Block, High Court & Sector 34-A, Chandigarh',
  currentAcademicYear: '2025–2026',
  announcementBanner: DEFAULT_BANNER,
  supportedExams: ['DJS', 'UP PCS-J', 'HCS', 'RJS', 'HJS', 'BJS', 'MP Judiciary', 'CLAT PG'],
  maintenanceMode: false,
  maintenanceMessage:
    'Rajinder Law Academy portal is undergoing scheduled maintenance. Please check back shortly.',
  featureFlags: {
    enableLiveChat: true,
    enableMockRankings: true,
    enableBareActSearch: true,
    enableOnlineFeePayment: true,
  },
};

export const useSettingsStore = create<SettingsStoreState>((set) => ({
  settings: DEFAULT_SETTINGS,
  banner: DEFAULT_BANNER,
  isLoading: false,
  error: null,

  fetchPublicSettings: async () => {
    try {
      set({ isLoading: true, error: null });
      const response = await apiClient.get<{ success: boolean; data: PublicSystemSettings }>(
        '/settings/public'
      );
      if (response.data?.success && response.data.data) {
        set({
          settings: response.data.data,
          banner: response.data.data.announcementBanner,
          isLoading: false,
        });
      }
    } catch (err: any) {
      // Gracefully fall back to defaults without breaking the UI
      set({
        isLoading: false,
        error: err.message || 'Failed to fetch public settings',
      });
    }
  },
}));

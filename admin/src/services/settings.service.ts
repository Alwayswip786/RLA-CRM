import apiClient from '../lib/apiClient';
import type { SystemSettingsData } from '../types/settings.types';

export const settingsService = {
  getSystemSettings: async (): Promise<SystemSettingsData> => {
    const response = await apiClient.get<{ success: boolean; data: SystemSettingsData }>(
      '/admin/settings'
    );
    return response.data.data;
  },

  updateSystemSettings: async (
    updates: Partial<SystemSettingsData>
  ): Promise<SystemSettingsData> => {
    const response = await apiClient.put<{ success: boolean; data: SystemSettingsData }>(
      '/admin/settings',
      updates
    );
    return response.data.data;
  },
};

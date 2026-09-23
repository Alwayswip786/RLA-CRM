export interface AnnouncementBannerSettings {
  enabled: boolean;
  badgeText: string;
  message: string;
  actionLink?: string;
  actionText?: string;
  theme: 'gold' | 'urgent' | 'blue' | 'emerald';
  displayLocations: string[];
}

export interface MainsEvaluationSettings {
  dailyCutoffTime: string;
  maxDailySubmissionsPerStudent: number;
  evaluationSlaHours: number;
  maxFileSizeMB: number;
}

export interface SecuritySettings {
  enableWatermarking: boolean;
  maxConcurrentDevices: number;
  adminSessionTimeoutMinutes: number;
  whatsappVerificationRequired: boolean;
  maxUploadSizeMB: number;
}

export interface SystemSettingsData {
  _id?: string;
  appName: string;
  tagline: string;
  appVersion: string;
  supportEmail: string;
  contactPhone: string;
  campusAddress: string;
  currentAcademicYear: string;
  announcementBanner: AnnouncementBannerSettings;
  supportedExams: string[];
  mainsEvaluation: MainsEvaluationSettings;
  security: SecuritySettings;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  featureFlags: Record<string, boolean>;
  updatedAt?: string;
}

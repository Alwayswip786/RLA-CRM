export interface PublicAnnouncementBanner {
  enabled: boolean;
  badgeText: string;
  message: string;
  actionLink?: string;
  actionText?: string;
  theme: 'gold' | 'urgent' | 'blue' | 'emerald';
  displayLocations: string[];
}

export interface PublicSystemSettings {
  appName: string;
  tagline: string;
  appVersion: string;
  supportEmail: string;
  contactPhone: string;
  campusAddress: string;
  currentAcademicYear: string;
  announcementBanner: PublicAnnouncementBanner;
  supportedExams: string[];
  maintenanceMode: boolean;
  maintenanceMessage: string;
  featureFlags: Record<string, boolean>;
}

import mongoose, { Schema, Document } from 'mongoose';

export interface IAnnouncementBanner {
  enabled: boolean;
  badgeText: string;
  message: string;
  actionLink?: string;
  actionText?: string;
  theme: 'gold' | 'urgent' | 'blue' | 'emerald';
  displayLocations: string[];
}

export interface IMainsEvaluationSettings {
  dailyCutoffTime: string; // e.g. "18:00"
  maxDailySubmissionsPerStudent: number;
  evaluationSlaHours: number;
  maxFileSizeMB: number;
}

export interface ISecuritySettings {
  enableWatermarking: boolean;
  maxConcurrentDevices: number;
  adminSessionTimeoutMinutes: number;
  whatsappVerificationRequired: boolean;
  maxUploadSizeMB: number;
}

export interface ISystemSetting extends Document {
  appName: string;
  tagline: string;
  appVersion: string;
  supportEmail: string;
  contactPhone: string;
  campusAddress: string;
  currentAcademicYear: string;
  announcementBanner: IAnnouncementBanner;
  supportedExams: string[];
  mainsEvaluation: IMainsEvaluationSettings;
  security: ISecuritySettings;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  featureFlags: Record<string, boolean>;
  createdAt: Date;
  updatedAt: Date;
}

const systemSettingSchema = new Schema<ISystemSetting>(
  {
    appName: {
      type: String,
      default: 'Rajinder Law Academy',
      required: true,
      trim: true,
    },
    tagline: {
      type: String,
      default: 'Pioneering Judicial Services Examination & Higher Legal Studies',
      trim: true,
    },
    appVersion: {
      type: String,
      default: '2.4.0',
      required: true,
      trim: true,
    },
    supportEmail: {
      type: String,
      default: 'admissions@rajinderlawacademy.com',
      trim: true,
      lowercase: true,
    },
    contactPhone: {
      type: String,
      default: '+91 98111 00001',
      trim: true,
    },
    campusAddress: {
      type: String,
      default: 'Chamber Block, High Court & Sector 34-A, Chandigarh',
      trim: true,
    },
    currentAcademicYear: {
      type: String,
      default: '2025–2026',
      trim: true,
    },
    announcementBanner: {
      enabled: { type: Boolean, default: true },
      badgeText: { type: String, default: 'ADMISSIONS 2025–26' },
      message: {
        type: String,
        default:
          'Comprehensive Judicial Foundation Batch Open • Daily Mains Answer Writing (DAW) Starts Monday',
      },
      actionLink: { type: String, default: '/signup' },
      actionText: { type: String, default: 'Enroll Now' },
      theme: {
        type: String,
        enum: ['gold', 'urgent', 'blue', 'emerald'],
        default: 'gold',
      },
      displayLocations: {
        type: [String],
        default: ['landing', 'student_dashboard'],
      },
    },
    supportedExams: {
      type: [String],
      default: [
        'DJS',
        'UP PCS-J',
        'HCS',
        'RJS',
        'HJS',
        'BJS',
        'MP Judiciary',
        'CLAT PG',
      ],
    },
    mainsEvaluation: {
      dailyCutoffTime: { type: String, default: '18:00' },
      maxDailySubmissionsPerStudent: { type: Number, default: 2, min: 1, max: 10 },
      evaluationSlaHours: { type: Number, default: 48, min: 12, max: 168 },
      maxFileSizeMB: { type: Number, default: 25, min: 5, max: 100 },
    },
    security: {
      enableWatermarking: { type: Boolean, default: true },
      maxConcurrentDevices: { type: Number, default: 2, min: 1, max: 5 },
      adminSessionTimeoutMinutes: { type: Number, default: 120, min: 15, max: 1440 },
      whatsappVerificationRequired: { type: Boolean, default: true },
      maxUploadSizeMB: { type: Number, default: 50, min: 5, max: 200 },
    },
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
    maintenanceMessage: {
      type: String,
      default:
        'Rajinder Law Academy portal is undergoing scheduled maintenance. Please check back shortly.',
    },
    featureFlags: {
      type: Map,
      of: Boolean,
      default: {
        enableLiveChat: true,
        enableMockRankings: true,
        enableBareActSearch: true,
        enableOnlineFeePayment: true,
        enableMainsPeerDiscussion: false,
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const SystemSetting = mongoose.model<ISystemSetting>(
  'SystemSetting',
  systemSettingSchema
);

export default SystemSetting;

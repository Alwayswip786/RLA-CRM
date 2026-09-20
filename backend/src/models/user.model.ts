import mongoose, { Schema, type Document } from 'mongoose';

export type UserRole = 'student' | 'faculty' | 'admin';
export type UserSalutation = 'Adv.' | 'Mr.' | 'Ms.' | 'Dr.';
export type AcademicStatus =
  | 'Full-Time Aspirant'
  | 'Class 11 Student'
  | 'Class 12 Student';
export type ThemeMode = 'light' | 'dark' | 'system';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  rollNo: string;
  salutation: UserSalutation;
  name: string;
  email?: string;
  phone?: string;
  password?: string;
  googleId?: string;
  avatarUrl?: string;
  role: UserRole;
  authVersion: number;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  needsOnboarding: boolean;
  targetExam: string;
  targetState: string;
  targetYear: string;
  academicStatus: AcademicStatus;
  themePreference: ThemeMode;
  accountStatus: 'active' | 'suspended' | 'deactivated';
  refreshTokens: string[];
  lastActiveAt: Date;
  lastLoginAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    rollNo: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    salutation: {
      type: String,
      enum: ['Adv.', 'Mr.', 'Ms.', 'Dr.'],
      default: 'Adv.',
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      sparse: true,
      index: true,
    },
    phone: {
      type: String,
      trim: true,
      sparse: true,
      index: true,
    },
    password: {
      type: String,
      select: false,
    },
    googleId: {
      type: String,
      sparse: true,
      unique: true,
      index: true,
    },
    avatarUrl: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ['student', 'faculty', 'admin'],
      default: 'student',
      index: true,
    },
    authVersion: {
      type: Number,
      default: 1,
      select: false,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
    needsOnboarding: {
      type: Boolean,
      default: true,
      index: true,
    },
    targetExam: {
      type: String,
      default: 'Delhi Judicial Service (DJS)',
    },
    targetState: {
      type: String,
      default: 'Delhi / NCR',
    },
    targetYear: {
      type: String,
      default: '2025-2026',
    },
    academicStatus: {
      type: String,
      enum: ['Full-Time Aspirant', 'Class 11 Student', 'Class 12 Student'],
      default: 'Full-Time Aspirant',
    },
    themePreference: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'light',
    },
    accountStatus: {
      type: String,
      enum: ['active', 'suspended', 'deactivated'],
      default: 'active',
      index: true,
    },
    refreshTokens: {
      type: [String],
      select: false,
      default: [],
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
    lastLoginAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// High-speed compound indexes for multi-identifier authentication lookups
UserSchema.index({ email: 1, rollNo: 1 });

const User = mongoose.model<IUser>('User', UserSchema);
export default User;

import mongoose, { Schema, type Document, type Types } from 'mongoose';

export type VideoWatchStatus = 'completed' | 'in_progress' | 'early_drop';

export interface IDeviceInfo {
  deviceModel: string;
  os: string;
  browser: string;
  ipAddress: string;
  location: string;
  concurrentSessions?: number;
}

export interface IVideoWatchSession extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  courseId: Types.ObjectId;
  lessonId: Types.ObjectId;
  sessionId: string;
  playbackSpeed: number;
  watchedSeconds: number;
  lastPositionSeconds: number;
  videoDurationSeconds: number;
  watchPercentage: number;
  playCount: number;
  scrubDetected: boolean;
  status: VideoWatchStatus;
  device: IDeviceInfo;
  lastHeartbeatAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DeviceInfoSchema = new Schema<IDeviceInfo>(
  {
    deviceModel: { type: String, default: 'Desktop Chrome (Mac / Windows)' },
    os: { type: String, default: 'Windows 11' },
    browser: { type: String, default: 'Chrome 124.0' },
    ipAddress: { type: String, default: '103.211.54.18' },
    location: { type: String, default: 'New Delhi, India' },
    concurrentSessions: { type: Number, default: 1 },
  },
  { _id: false }
);

const VideoWatchSessionSchema = new Schema<IVideoWatchSession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    lessonId: { type: Schema.Types.ObjectId, ref: 'CourseLesson', required: true, index: true },
    sessionId: { type: String, required: true, index: true },
    playbackSpeed: { type: Number, default: 1.0 },
    watchedSeconds: { type: Number, default: 0 },
    lastPositionSeconds: { type: Number, default: 0 },
    videoDurationSeconds: { type: Number, default: 0 },
    watchPercentage: { type: Number, default: 0 },
    playCount: { type: Number, default: 1 },
    scrubDetected: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['completed', 'in_progress', 'early_drop'],
      default: 'in_progress',
      index: true,
    },
    device: { type: DeviceInfoSchema, default: () => ({}) },
    lastHeartbeatAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

// Compound indexes for optimal telemetry querying & aggregations
VideoWatchSessionSchema.index({ userId: 1, lessonId: 1 });
VideoWatchSessionSchema.index({ courseId: 1, status: 1 });
VideoWatchSessionSchema.index({ createdAt: -1 });
VideoWatchSessionSchema.index({ lastHeartbeatAt: -1 });

export const VideoWatchSession = mongoose.model<IVideoWatchSession>(
  'VideoWatchSession',
  VideoWatchSessionSchema
);

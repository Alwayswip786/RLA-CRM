import mongoose, { Schema, type Document, type Types } from 'mongoose';

export type AttendanceStatus = 'present' | 'partial' | 'absent';

export interface IAttendanceInterval {
  joinedAt: Date;
  leftAt?: Date;
  durationSeconds?: number;
}

export interface ILiveClassAttendance extends Document {
  _id: Types.ObjectId;
  classId: Types.ObjectId;
  studentId: Types.ObjectId;
  studentName: string;
  studentRollNo: string;
  batchId?: Types.ObjectId;
  joinedAt: Date;
  leftAt?: Date;
  totalDurationSeconds: number;
  attendancePercent: number;
  status: AttendanceStatus;
  isLate: boolean;
  intervals: IAttendanceInterval[];
  lastHeartbeatAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceIntervalSchema = new Schema<IAttendanceInterval>(
  {
    joinedAt: { type: Date, required: true },
    leftAt: { type: Date },
    durationSeconds: { type: Number, default: 0 },
  },
  { _id: false }
);

const LiveClassAttendanceSchema = new Schema<ILiveClassAttendance>(
  {
    classId: {
      type: Schema.Types.ObjectId,
      ref: 'LiveClass',
      required: true,
      index: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    studentName: {
      type: String,
      required: true,
      trim: true,
    },
    studentRollNo: {
      type: String,
      required: true,
      trim: true,
    },
    batchId: {
      type: Schema.Types.ObjectId,
      ref: 'Batch',
      index: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    leftAt: {
      type: Date,
    },
    totalDurationSeconds: {
      type: Number,
      default: 0,
    },
    attendancePercent: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['present', 'partial', 'absent'],
      default: 'partial',
      index: true,
    },
    isLate: {
      type: Boolean,
      default: false,
    },
    intervals: {
      type: [AttendanceIntervalSchema],
      default: [],
    },
    lastHeartbeatAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

LiveClassAttendanceSchema.index({ classId: 1, studentId: 1 }, { unique: true });
LiveClassAttendanceSchema.index({ studentId: 1, createdAt: -1 });

export const LiveClassAttendance = mongoose.model<ILiveClassAttendance>(
  'LiveClassAttendance',
  LiveClassAttendanceSchema
);
export default LiveClassAttendance;

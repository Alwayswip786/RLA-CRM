import mongoose, { Schema, type Document, type Types } from 'mongoose';

export type LiveClassStatus =
  | 'scheduled'
  | 'upcoming'
  | 'live'
  | 'ended'
  | 'recording_processing'
  | 'archived'
  | 'cancelled';

export interface ILearningFocusItem {
  title: string;
  description: string;
}

export interface IClassHandoutPdf {
  fileName: string;
  fileUrl: string;
  fileSize: string;
}

export interface ILiveClass extends Document {
  _id: Types.ObjectId;
  title: string;
  subject: string;
  topic: string;
  description: string;
  courseId?: Types.ObjectId;
  batchIds: Types.ObjectId[];
  shifts: string[];
  faculty: Types.ObjectId;
  facultyName: string;
  facultyTitle: string;
  roomName?: string;

  // Schedule Timings
  scheduledDate: string; // 'YYYY-MM-DD'
  startTime: string; // '17:00'
  endTime: string; // '19:00'
  scheduledStartAt: Date;
  scheduledEndAt: Date;
  durationMinutes: number;
  actualStartedAt?: Date;
  actualEndedAt?: Date;

  // Lifecycle Status
  status: LiveClassStatus;
  cancelReason?: string;

  // Zoom Video SDK
  sessionTopic: string;
  sessionPassword?: string;
  autoRecord: boolean;

  // Syllabus outline & Handout
  learningFocus: ILearningFocusItem[];
  handoutPdf?: IClassHandoutPdf;

  // Attendance rules & Metrics
  attendanceRules: {
    minDurationPercent: number; // e.g. 75
    lateThresholdMinutes: number; // e.g. 15
  };
  currentLiveCount: number;
  peakLiveCount: number;
  totalAttendeesCount: number;

  // Associated Archive record once processed
  archivedClassId?: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

const LearningFocusItemSchema = new Schema<ILearningFocusItem>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const ClassHandoutPdfSchema = new Schema<IClassHandoutPdf>(
  {
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileSize: { type: String, default: '3.5 MB PDF' },
  },
  { _id: false }
);

const LiveClassSchema = new Schema<ILiveClass>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    topic: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      index: true,
    },
    batchIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Batch',
        index: true,
      },
    ],
    shifts: {
      type: [String],
      default: ['shift-morning', 'shift-evening'],
    },
    faculty: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    facultyName: {
      type: String,
      required: true,
      default: 'Adv. Rajinder Sir',
    },
    facultyTitle: {
      type: String,
      default: 'Founding Director & Judicial Mentor',
    },
    roomName: {
      type: String,
      default: 'Chamber Hall A',
      trim: true,
    },

    scheduledDate: {
      type: String,
      required: true,
      index: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    scheduledStartAt: {
      type: Date,
      required: true,
      index: true,
    },
    scheduledEndAt: {
      type: Date,
      required: true,
    },
    durationMinutes: {
      type: Number,
      default: 120,
    },
    actualStartedAt: {
      type: Date,
    },
    actualEndedAt: {
      type: Date,
    },

    status: {
      type: String,
      enum: ['scheduled', 'upcoming', 'live', 'ended', 'recording_processing', 'archived', 'cancelled'],
      default: 'scheduled',
      index: true,
    },
    cancelReason: {
      type: String,
      default: '',
    },

    sessionTopic: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    sessionPassword: {
      type: String,
      default: '',
    },
    autoRecord: {
      type: Boolean,
      default: true,
    },

    learningFocus: {
      type: [LearningFocusItemSchema],
      default: [],
    },
    handoutPdf: {
      type: ClassHandoutPdfSchema,
    },

    attendanceRules: {
      minDurationPercent: { type: Number, default: 75 },
      lateThresholdMinutes: { type: Number, default: 15 },
    },
    currentLiveCount: {
      type: Number,
      default: 0,
    },
    peakLiveCount: {
      type: Number,
      default: 0,
    },
    totalAttendeesCount: {
      type: Number,
      default: 0,
    },

    archivedClassId: {
      type: Schema.Types.ObjectId,
      ref: 'ArchivedClass',
    },
  },
  { timestamps: true }
);

LiveClassSchema.index({ status: 1, scheduledStartAt: 1 });
LiveClassSchema.index({ batchIds: 1, status: 1 });
LiveClassSchema.index({ faculty: 1, scheduledDate: 1 });

export const LiveClass = mongoose.model<ILiveClass>('LiveClass', LiveClassSchema);
export default LiveClass;

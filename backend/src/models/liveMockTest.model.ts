import mongoose, { Schema, type Document } from 'mongoose';

export type LiveTestStatus = 'draft' | 'scheduled' | 'live' | 'closed' | 'archived';

export interface ILiveMockTestSection {
  name: string;
  questionCount: number;
  questionIds: mongoose.Types.ObjectId[];
}

export interface ILiveMockTestStats {
  totalRegistered: number;
  totalAttempted: number;
  avgScore: number;
  topScore: number;
}

export interface ILiveMockTest extends Document {
  _id: mongoose.Types.ObjectId;
  testCode: string;
  title: string;
  targetExam: string;
  targetState: string;
  syllabus: string;
  windowStart: Date;
  windowEnd: Date;
  durationMinutes: number;
  questionsCount: number;
  maxScore: number;
  marksPerCorrect: number;
  negativeMarkWeight: number; // e.g. 0.25, 0.33
  difficulty: string;
  questions: mongoose.Types.ObjectId[];
  sections: ILiveMockTestSection[];
  status: LiveTestStatus;
  isPublished: boolean;
  isLeaderboardFrozen: boolean;
  allowReviewBeforeWindowClose: boolean;
  stats: ILiveMockTestStats;
  isSeeded: boolean;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const liveMockTestSectionSchema = new Schema<ILiveMockTestSection>(
  {
    name: { type: String, required: true, trim: true },
    questionCount: { type: Number, required: true, default: 0 },
    questionIds: [{ type: Schema.Types.ObjectId, ref: 'McqQuestion' }],
  },
  { _id: false }
);

const liveMockTestSchema = new Schema<ILiveMockTest>(
  {
    testCode: {
      type: String,
      required: [true, 'Test code is required.'],
      unique: true,
      trim: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Live mock test title is required.'],
      trim: true,
    },
    targetExam: {
      type: String,
      required: true,
      default: 'All-India Judicial Services',
      trim: true,
    },
    targetState: {
      type: String,
      required: true,
      default: 'All-India',
      trim: true,
      index: true,
    },
    syllabus: {
      type: String,
      required: true,
      trim: true,
    },
    windowStart: {
      type: Date,
      required: true,
      index: true,
    },
    windowEnd: {
      type: Date,
      required: true,
      index: true,
    },
    durationMinutes: {
      type: Number,
      required: true,
      default: 120,
    },
    questionsCount: {
      type: Number,
      required: true,
      default: 100,
    },
    maxScore: {
      type: Number,
      required: true,
      default: 100,
    },
    marksPerCorrect: {
      type: Number,
      default: 1.0,
    },
    negativeMarkWeight: {
      type: Number,
      default: 0.25,
    },
    difficulty: {
      type: String,
      default: 'medium',
    },
    questions: [
      {
        type: Schema.Types.ObjectId,
        ref: 'McqQuestion',
      },
    ],
    sections: {
      type: [liveMockTestSectionSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'live', 'closed', 'archived'],
      default: 'scheduled',
      index: true,
    },
    isPublished: {
      type: Boolean,
      default: true,
      index: true,
    },
    isLeaderboardFrozen: {
      type: Boolean,
      default: false,
    },
    allowReviewBeforeWindowClose: {
      type: Boolean,
      default: false,
    },
    stats: {
      totalRegistered: { type: Number, default: 0 },
      totalAttempted: { type: Number, default: 0 },
      avgScore: { type: Number, default: 0 },
      topScore: { type: Number, default: 0 },
    },
    isSeeded: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

liveMockTestSchema.index({ isPublished: 1, status: 1, windowStart: 1 });
liveMockTestSchema.index({ isPublished: 1, targetState: 1 });

const LiveMockTest = mongoose.model<ILiveMockTest>('LiveMockTest', liveMockTestSchema);

export default LiveMockTest;

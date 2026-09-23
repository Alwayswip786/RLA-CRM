import mongoose, { Schema, type Document } from 'mongoose';

export type MockTestStatus = 'Live Now' | 'Scheduled' | 'Archived';
export type MockTestType = 'mock_series' | 'bare_act_drill' | 'sectional_test';

export interface IMockTest extends Document {
  _id: mongoose.Types.ObjectId;
  testCode: string;
  title: string;
  testType: MockTestType;
  targetExam: string;
  targetState: string;
  syllabus: string;
  questionsCount: number;
  durationMinutes: number;
  maxScore: number;
  marksPerCorrect: number;
  negativeMarkWeight: number; // e.g. 0.25, 0.33
  difficulty: string;
  questions: mongoose.Types.ObjectId[];
  status: MockTestStatus;
  isPublished: boolean;
  totalAttempts: number;
  averageScore: number;
  isSeeded: boolean;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const MockTestSchema = new Schema<IMockTest>(
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
      required: [true, 'Mock test title is required.'],
      trim: true,
    },
    testType: {
      type: String,
      enum: ['mock_series', 'bare_act_drill', 'sectional_test'],
      default: 'mock_series',
      index: true,
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
    questionsCount: {
      type: Number,
      required: true,
      default: 100,
    },
    durationMinutes: {
      type: Number,
      required: true,
      default: 90,
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
    status: {
      type: String,
      enum: ['Live Now', 'Scheduled', 'Archived'],
      default: 'Live Now',
      index: true,
    },
    isPublished: {
      type: Boolean,
      default: true,
      index: true,
    },
    totalAttempts: {
      type: Number,
      default: 0,
    },
    averageScore: {
      type: Number,
      default: 0,
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

MockTestSchema.index({ isPublished: 1, targetState: 1 });

const MockTest = mongoose.model<IMockTest>('MockTest', MockTestSchema);

export default MockTest;

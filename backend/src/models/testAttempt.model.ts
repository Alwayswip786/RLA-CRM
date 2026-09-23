import mongoose, { Schema, type Document } from 'mongoose';

export type TestType = 'mock_series' | 'practice_quiz' | 'sectional_test' | 'bare_act_drill';

export interface ITestAttempt extends Document {
  _id: mongoose.Types.ObjectId;
  student: mongoose.Types.ObjectId;
  testTitle: string;
  testType: TestType;
  targetExam?: string;
  score: number;
  maxScore: number;
  rank: number;
  totalAspirants: number;
  percentile: number;
  correct: number;
  incorrect: number;
  unattempted: number;
  accuracy: number;
  avgTimePerMcq: number; // in seconds
  negativeMarks: number; // marks lost to negative marking
  timeSpentMinutes: number;
  attemptedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TestAttemptSchema = new Schema<ITestAttempt>(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student ID reference is required.'],
      index: true,
    },
    testTitle: {
      type: String,
      required: [true, 'Test title is required.'],
      trim: true,
    },
    testType: {
      type: String,
      enum: ['mock_series', 'practice_quiz', 'sectional_test', 'bare_act_drill'],
      default: 'mock_series',
    },
    targetExam: {
      type: String,
      default: 'All-India Judicial Services',
      trim: true,
    },
    score: {
      type: Number,
      required: true,
    },
    maxScore: {
      type: Number,
      required: true,
      default: 200,
    },
    rank: {
      type: Number,
      required: true,
      default: 1,
    },
    totalAspirants: {
      type: Number,
      default: 1200,
    },
    percentile: {
      type: Number,
      default: 95.0,
    },
    correct: {
      type: Number,
      required: true,
    },
    incorrect: {
      type: Number,
      required: true,
    },
    unattempted: {
      type: Number,
      default: 0,
    },
    accuracy: {
      type: Number,
      required: true, // percentage 0-100
    },
    avgTimePerMcq: {
      type: Number,
      default: 45, // seconds
    },
    negativeMarks: {
      type: Number,
      default: 0,
    },
    timeSpentMinutes: {
      type: Number,
      default: 120,
    },
    attemptedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

TestAttemptSchema.index({ student: 1, attemptedAt: -1 });

const TestAttempt = mongoose.model<ITestAttempt>('TestAttempt', TestAttemptSchema);

export default TestAttempt;

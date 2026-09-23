import mongoose, { Schema, type Document, type Types } from 'mongoose';

export type LiveAttemptStatus = 'in_progress' | 'submitted' | 'auto_submitted' | 'disqualified';
export type AntiCheatStatus = 'clean' | 'review_required' | 'disqualified';

export interface ILiveAnswerProgress {
  questionId: Types.ObjectId;
  selectedOption: number | null; // 0, 1, 2, 3, or null
  isAnswered: boolean;
  isMarkedForReview: boolean;
  isVisited: boolean;
  timeSpentSeconds: number;
  isCorrect?: boolean | null;
}

export interface ILiveSubjectAnalysis {
  subject: string;
  total: number;
  correct: number;
  incorrect: number;
  unattempted: number;
  accuracy: number;
  timeSpentSeconds: number;
}

export interface ILiveAttemptResult {
  score: number;
  maxScore: number;
  correct: number;
  incorrect: number;
  unattempted: number;
  accuracy: number;
  negativeMarks: number;
  avgTimePerMcq: number;
  rank: number;
  percentile: number;
  totalCandidates: number;
}

export interface IAntiCheatEvent {
  eventType: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface ILiveTestAttempt extends Document {
  _id: mongoose.Types.ObjectId;
  testId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  attemptNumber: number;
  isOfficial: boolean; // Only official attempts count on the live All-India leaderboard
  status: LiveAttemptStatus;
  startedAt: Date;
  expiresAt: Date;
  submittedAt?: Date;
  autoSubmittedAt?: Date;
  lastHeartbeatAt?: Date;
  durationUsedMilliseconds: number;
  durationUsedSeconds: number;
  currentIndex: number;
  answers: ILiveAnswerProgress[];
  result?: ILiveAttemptResult;
  subjectAnalysis: ILiveSubjectAnalysis[];
  antiCheat: {
    status: AntiCheatStatus;
    violationsCount: number;
    events: IAntiCheatEvent[];
  };
  isSeeded: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const liveAnswerProgressSchema = new Schema<ILiveAnswerProgress>(
  {
    questionId: {
      type: Schema.Types.ObjectId,
      ref: 'McqQuestion',
      required: true,
    },
    selectedOption: {
      type: Number,
      default: null,
    },
    isAnswered: {
      type: Boolean,
      default: false,
    },
    isMarkedForReview: {
      type: Boolean,
      default: false,
    },
    isVisited: {
      type: Boolean,
      default: false,
    },
    timeSpentSeconds: {
      type: Number,
      default: 0,
    },
    isCorrect: {
      type: Boolean,
      default: null,
    },
  },
  { _id: false }
);

const liveSubjectAnalysisSchema = new Schema<ILiveSubjectAnalysis>(
  {
    subject: { type: String, required: true },
    total: { type: Number, default: 0 },
    correct: { type: Number, default: 0 },
    incorrect: { type: Number, default: 0 },
    unattempted: { type: Number, default: 0 },
    accuracy: { type: Number, default: 0 },
    timeSpentSeconds: { type: Number, default: 0 },
  },
  { _id: false }
);

const liveTestAttemptSchema = new Schema<ILiveTestAttempt>(
  {
    testId: {
      type: Schema.Types.ObjectId,
      ref: 'LiveMockTest',
      required: true,
      index: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    attemptNumber: {
      type: Number,
      default: 1,
    },
    isOfficial: {
      type: Boolean,
      default: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['in_progress', 'submitted', 'auto_submitted', 'disqualified'],
      default: 'in_progress',
      index: true,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    submittedAt: {
      type: Date,
    },
    autoSubmittedAt: {
      type: Date,
    },
    lastHeartbeatAt: {
      type: Date,
      default: Date.now,
    },
    durationUsedMilliseconds: {
      type: Number,
      default: 0,
    },
    durationUsedSeconds: {
      type: Number,
      default: 0,
    },
    currentIndex: {
      type: Number,
      default: 0,
    },
    answers: {
      type: [liveAnswerProgressSchema],
      required: true,
    },
    result: {
      score: { type: Number, default: 0 },
      maxScore: { type: Number, default: 100 },
      correct: { type: Number, default: 0 },
      incorrect: { type: Number, default: 0 },
      unattempted: { type: Number, default: 0 },
      accuracy: { type: Number, default: 0 },
      negativeMarks: { type: Number, default: 0 },
      avgTimePerMcq: { type: Number, default: 0 },
      rank: { type: Number, default: 1 },
      percentile: { type: Number, default: 99.0 },
      totalCandidates: { type: Number, default: 1 },
    },
    subjectAnalysis: {
      type: [liveSubjectAnalysisSchema],
      default: [],
    },
    antiCheat: {
      status: {
        type: String,
        enum: ['clean', 'review_required', 'disqualified'],
        default: 'clean',
      },
      violationsCount: {
        type: Number,
        default: 0,
      },
      events: [
        {
          eventType: { type: String, required: true },
          timestamp: { type: Date, default: Date.now },
          metadata: { type: Schema.Types.Mixed },
        },
      ],
    },
    isSeeded: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Deterministic GOmed Tie-breaking sort key:
// 1. Higher Net Score (-1)
// 2. Fewer Negative Marks (1)
// 3. Shorter Duration Used (1)
// 4. Earlier Submission (1)
export const LIVE_TEST_RANK_SORT = {
  'result.score': -1,
  'result.negativeMarks': 1,
  durationUsedMilliseconds: 1,
  submittedAt: 1,
  _id: 1,
} as const;

// Partial unique index: at most ONE active attempt per student across active live test
liveTestAttemptSchema.index(
  { studentId: 1, status: 1 },
  {
    name: 'unique_active_live_attempt_per_student',
    unique: true,
    partialFilterExpression: { status: 'in_progress' },
  }
);

liveTestAttemptSchema.index({ testId: 1, isOfficial: 1, status: 1, 'result.score': -1 });
liveTestAttemptSchema.index({ studentId: 1, testId: 1, createdAt: -1 });

const LiveTestAttempt = mongoose.model<ILiveTestAttempt>('LiveTestAttempt', liveTestAttemptSchema);

export default LiveTestAttempt;

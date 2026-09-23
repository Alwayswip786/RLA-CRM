import mongoose, { Schema, type Document, type Types } from 'mongoose';

export type TestSessionStatus = 'in_progress' | 'completed' | 'abandoned';
export type TestSessionType = 'mock_series' | 'bare_act_drill' | 'sectional_test';

export interface ISessionQuestionProgress {
  questionId: Types.ObjectId;
  selectedOption: number | null; // 0, 1, 2, 3, or null
  isAnswered: boolean;
  isMarkedForReview: boolean;
  isVisited: boolean;
  timeSpentSeconds: number;
  isCorrect?: boolean | null;
}

export interface ITestResultSummary {
  totalQuestions: number;
  attempted: number;
  correct: number;
  incorrect: number;
  unattempted: number;
  score: number;
  maxScore: number;
  accuracy: number;
  avgTimePerMcq: number;
  negativeMarks: number;
  rank?: number;
  percentile?: number;
}

export interface ITestSession extends Document {
  _id: mongoose.Types.ObjectId;
  student: mongoose.Types.ObjectId;
  mockTest?: mongoose.Types.ObjectId;
  testType: TestSessionType;
  sessionTitle: string;
  targetExam: string;
  bareActName?: string;
  durationMinutes: number;
  startedAt: Date;
  expiresAt: Date;
  submittedAt?: Date;
  currentIndex: number;
  status: TestSessionStatus;
  questions: ISessionQuestionProgress[];
  resultSummary?: ITestResultSummary;
  createdAt: Date;
  updatedAt: Date;
}

const sessionQuestionProgressSchema = new Schema<ISessionQuestionProgress>(
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

const testSessionSchema = new Schema<ITestSession>(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    mockTest: {
      type: Schema.Types.ObjectId,
      ref: 'MockTest',
    },
    testType: {
      type: String,
      enum: ['mock_series', 'bare_act_drill', 'sectional_test'],
      default: 'mock_series',
      index: true,
    },
    sessionTitle: {
      type: String,
      required: true,
      trim: true,
    },
    targetExam: {
      type: String,
      default: 'All-India Judicial Services',
    },
    bareActName: {
      type: String,
      trim: true,
    },
    durationMinutes: {
      type: Number,
      required: true,
      default: 90,
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
    currentIndex: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['in_progress', 'completed', 'abandoned'],
      default: 'in_progress',
      index: true,
    },
    questions: {
      type: [sessionQuestionProgressSchema],
      required: true,
    },
    resultSummary: {
      totalQuestions: Number,
      attempted: Number,
      correct: Number,
      incorrect: Number,
      unattempted: Number,
      score: Number,
      maxScore: Number,
      accuracy: Number,
      avgTimePerMcq: Number,
      negativeMarks: Number,
      rank: Number,
      percentile: Number,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// GOmed Pattern: Partial unique index to guarantee at most ONE active session per student
testSessionSchema.index(
  { student: 1, status: 1 },
  {
    name: 'unique_active_session_per_student',
    unique: true,
    partialFilterExpression: { status: 'in_progress' },
  }
);

export const closeDuplicateActiveTestSessions = async (): Promise<number> => {
  const duplicateGroups = await TestSession.aggregate<{
    ids: Types.ObjectId[];
    count: number;
  }>([
    { $match: { status: 'in_progress' } },
    { $sort: { updatedAt: -1, _id: -1 } },
    {
      $group: {
        _id: '$student',
        ids: { $push: '$_id' },
        count: { $sum: 1 },
      },
    },
    { $match: { count: { $gt: 1 } } },
  ]);

  const staleSessionIds = duplicateGroups.flatMap((group) => group.ids.slice(1));
  if (staleSessionIds.length === 0) return 0;

  await TestSession.updateMany(
    { _id: { $in: staleSessionIds }, status: 'in_progress' },
    { $set: { status: 'abandoned' } }
  );
  return staleSessionIds.length;
};

const TestSession = mongoose.model<ITestSession>('TestSession', testSessionSchema);

export default TestSession;

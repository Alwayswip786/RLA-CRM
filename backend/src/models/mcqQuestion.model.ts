import mongoose, { Schema, type Document } from 'mongoose';

export type QuestionDifficulty = 'easy' | 'medium' | 'hard';
export type QuestionFormat =
  | 'bare_act_textual'
  | 'case_law_based'
  | 'assertion_reason'
  | 'illustration';

export interface IMcqQuestion extends Document {
  _id: mongoose.Types.ObjectId;
  code: string;
  subject: string;
  actName: string;
  chapterOrPart?: string;
  sectionOrArticle?: string;
  questionText: string;
  options: string[];
  correctOptionIndex: number; // 0 for A, 1 for B, 2 for C, 3 for D
  explanation: string;
  landmarkCases: string[];
  difficulty: QuestionDifficulty;
  format: QuestionFormat;
  targetExams: string[];
  isActive: boolean;
  isArchived: boolean;
  isSeeded: boolean;
  datasetTag?: string;
  totalAttempts: number;
  correctAttempts: number;
  createdAt: Date;
  updatedAt: Date;
}

const McqQuestionSchema = new Schema<IMcqQuestion>(
  {
    code: {
      type: String,
      required: [true, 'Question code is required.'],
      unique: true,
      trim: true,
      index: true,
    },
    subject: {
      type: String,
      required: [true, 'Subject is required.'],
      trim: true,
      index: true,
    },
    actName: {
      type: String,
      required: [true, 'Bare Act name is required.'],
      trim: true,
      index: true,
    },
    chapterOrPart: {
      type: String,
      trim: true,
    },
    sectionOrArticle: {
      type: String,
      trim: true,
      index: true,
    },
    questionText: {
      type: String,
      required: [true, 'Question text is required.'],
      trim: true,
    },
    options: {
      type: [String],
      required: [true, 'Options array is required.'],
      validate: [(v: string[]) => v.length === 4, 'Must provide exactly 4 options (A, B, C, D)'],
    },
    correctOptionIndex: {
      type: Number,
      required: [true, 'Correct option index is required.'],
      min: 0,
      max: 3,
    },
    explanation: {
      type: String,
      required: [true, 'Legal explanation is required.'],
      trim: true,
    },
    landmarkCases: {
      type: [String],
      default: [],
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
      index: true,
    },
    format: {
      type: String,
      enum: ['bare_act_textual', 'case_law_based', 'assertion_reason', 'illustration'],
      default: 'bare_act_textual',
    },
    targetExams: {
      type: [String],
      default: ['All-India Judicial Services'],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    isSeeded: {
      type: Boolean,
      default: false,
      index: true,
    },
    datasetTag: {
      type: String,
      default: 'production',
    },
    totalAttempts: {
      type: Number,
      default: 0,
    },
    correctAttempts: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

McqQuestionSchema.index({ actName: 1, isActive: 1 });
McqQuestionSchema.index({ subject: 1, difficulty: 1 });

const McqQuestion = mongoose.model<IMcqQuestion>('McqQuestion', McqQuestionSchema);

export default McqQuestion;

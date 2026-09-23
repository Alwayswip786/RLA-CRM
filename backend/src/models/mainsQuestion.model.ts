import mongoose, { Schema, type Document } from 'mongoose';

export interface IMainsFileMetadata {
  filename: string;
  originalName: string;
  path: string;
  mimeType: string;
  sizeBytes: number;
  sizeFormatted: string;
  pageCount?: number;
}

export interface IMainsQuestion extends Document {
  _id: mongoose.Types.ObjectId;
  challengeNumber: number;
  questionCode: string;
  paper: string;
  title: string;
  subject: string;
  targetExam?: string;
  challengeDate: Date;
  submissionDeadline?: Date;
  marks: number;
  wordLimit: number;
  turnaroundHours: number;
  evaluatorName: string;
  guidelines: string[];
  modelAnswer?: string;
  modelAnswerPdf?: IMainsFileMetadata;
  isModelAnswerPublished: boolean;
  status: 'draft' | 'scheduled' | 'active' | 'archived';
  totalSubmissionsCount: number;
  evaluatedCount: number;
  isActive: boolean;
  publishedAt: Date;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const MainsFileMetadataSchema = new Schema<IMainsFileMetadata>(
  {
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    path: { type: String, required: true },
    mimeType: { type: String, default: 'application/pdf' },
    sizeBytes: { type: Number, required: true },
    sizeFormatted: { type: String, required: true },
    pageCount: { type: Number },
  },
  { _id: false }
);

const MainsQuestionSchema = new Schema<IMainsQuestion>(
  {
    challengeNumber: {
      type: Number,
      index: true,
    },
    questionCode: {
      type: String,
      required: [true, 'Question code identifier is required.'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    paper: {
      type: String,
      required: [true, 'Paper classification is required.'],
      default: 'Criminal Law & Procedure (Mains)',
      trim: true,
    },
    title: {
      type: String,
      required: [true, 'Mains problem statement is required.'],
      trim: true,
      maxlength: [3000, 'Question statement cannot exceed 3000 characters.'],
    },
    subject: {
      type: String,
      required: [true, 'Subject category is required.'],
      trim: true,
      index: true,
    },
    targetExam: {
      type: String,
      default: 'All-India Judicial Services',
      trim: true,
    },
    challengeDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    submissionDeadline: {
      type: Date,
      index: true,
    },
    marks: {
      type: Number,
      required: [true, 'Marks allocation is required.'],
      default: 15,
      min: 1,
    },
    wordLimit: {
      type: Number,
      required: [true, 'Word limit guideline is required.'],
      default: 250,
      min: 50,
    },
    turnaroundHours: {
      type: Number,
      default: 24,
      min: 1,
    },
    evaluatorName: {
      type: String,
      default: 'Adv. Rajinder Sir',
      trim: true,
    },
    guidelines: {
      type: [String],
      default: [],
    },
    modelAnswer: {
      type: String,
      default: '',
    },
    modelAnswerPdf: {
      type: MainsFileMetadataSchema,
    },
    isModelAnswerPublished: {
      type: Boolean,
      default: false,
      index: true,
    },
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'active', 'archived'],
      default: 'active',
      index: true,
    },
    totalSubmissionsCount: {
      type: Number,
      default: 0,
    },
    evaluatedCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    publishedAt: {
      type: Date,
      default: Date.now,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

MainsQuestionSchema.index({ challengeDate: -1, status: 1 });
MainsQuestionSchema.index({ isActive: 1, createdAt: -1 });

const MainsQuestion = mongoose.model<IMainsQuestion>('MainsQuestion', MainsQuestionSchema);

export default MainsQuestion;

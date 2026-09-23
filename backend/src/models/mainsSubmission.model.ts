import mongoose, { Schema, type Document } from 'mongoose';

export type SubmissionStatus = 'pending' | 'under_review' | 'evaluated';

export interface IMainsFileMetadata {
  filename: string;
  originalName: string;
  path: string;
  mimeType: string;
  sizeBytes: number;
  sizeFormatted: string;
  pageCount?: number;
}

export interface IRubricScore {
  criterion: string;
  label: string;
  score: number;
  maxScore: number;
}

export interface ISubmissionRevision {
  version: number;
  fileType: 'pdf' | 'images';
  files: IMainsFileMetadata[];
  notes?: string;
  submittedAt: Date;
}

export interface IMainsSubmission extends Document {
  _id: mongoose.Types.ObjectId;
  student: mongoose.Types.ObjectId;
  question: mongoose.Types.ObjectId;
  version: number;
  fileType: 'pdf' | 'images';
  files: IMainsFileMetadata[];
  studentPdf: IMainsFileMetadata;
  notes?: string;
  isLate: boolean;
  revisionHistory: ISubmissionRevision[];
  status: SubmissionStatus;
  submittedAt: Date;
  claimedBy?: mongoose.Types.ObjectId;
  claimedAt?: Date;
  evaluatedBy?: mongoose.Types.ObjectId;
  score?: number;
  maxScore?: number;
  rubricBreakdown?: IRubricScore[];
  remarks?: string;
  strengths?: string;
  mistakes?: string;
  improvementPoints?: string;
  needsWork?: string;
  evaluatedPdf?: IMainsFileMetadata;
  evaluatedAt?: Date;
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

const RubricScoreSchema = new Schema<IRubricScore>(
  {
    criterion: { type: String, required: true },
    label: { type: String, required: true },
    score: { type: Number, required: true, min: 0 },
    maxScore: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const SubmissionRevisionSchema = new Schema<ISubmissionRevision>(
  {
    version: { type: Number, required: true },
    fileType: { type: String, enum: ['pdf', 'images'], default: 'pdf' },
    files: [MainsFileMetadataSchema],
    notes: { type: String, default: '' },
    submittedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const MainsSubmissionSchema = new Schema<IMainsSubmission>(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student reference is required.'],
      index: true,
    },
    question: {
      type: Schema.Types.ObjectId,
      ref: 'MainsQuestion',
      required: [true, 'Question reference is required.'],
      index: true,
    },
    version: {
      type: Number,
      default: 1,
    },
    fileType: {
      type: String,
      enum: ['pdf', 'images'],
      default: 'pdf',
    },
    files: {
      type: [MainsFileMetadataSchema],
      default: [],
    },
    studentPdf: {
      type: MainsFileMetadataSchema,
      required: [true, 'Student answer copy file is required.'],
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
    isLate: {
      type: Boolean,
      default: false,
    },
    revisionHistory: {
      type: [SubmissionRevisionSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ['pending', 'under_review', 'evaluated'],
      default: 'pending',
      index: true,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    claimedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    claimedAt: {
      type: Date,
    },
    evaluatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    score: {
      type: Number,
      min: 0,
    },
    maxScore: {
      type: Number,
      min: 1,
    },
    rubricBreakdown: {
      type: [RubricScoreSchema],
      default: [],
    },
    remarks: {
      type: String,
      default: '',
      trim: true,
    },
    strengths: {
      type: String,
      default: '',
      trim: true,
    },
    mistakes: {
      type: String,
      default: '',
      trim: true,
    },
    improvementPoints: {
      type: String,
      default: '',
      trim: true,
    },
    needsWork: {
      type: String,
      default: '',
      trim: true,
    },
    evaluatedPdf: {
      type: MainsFileMetadataSchema,
    },
    evaluatedAt: {
      type: Date,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound index: unique per student per question
MainsSubmissionSchema.index({ student: 1, question: 1 }, { unique: true });
MainsSubmissionSchema.index({ status: 1, submittedAt: 1 });
MainsSubmissionSchema.index({ question: 1, status: 1, submittedAt: 1 });
MainsSubmissionSchema.index({ student: 1, status: 1, evaluatedAt: -1 });

const MainsSubmission = mongoose.model<IMainsSubmission>('MainsSubmission', MainsSubmissionSchema);

export default MainsSubmission;

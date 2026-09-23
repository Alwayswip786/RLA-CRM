import mongoose, { Schema, type Document } from 'mongoose';

export type CourtCategory =
  | 'Supreme Court of India'
  | 'Delhi High Court'
  | 'Bombay High Court'
  | 'Allahabad High Court'
  | 'Punjab & Haryana High Court'
  | 'Calcutta High Court'
  | 'Madras High Court'
  | 'Other High Courts';

export type JudgementImportance =
  | 'Landmark'
  | 'Leading'
  | 'Recent / Overruling'
  | 'Standard';

export interface IPdfFileMetadata {
  filename: string;
  originalName: string;
  path: string;
  mimeType: string;
  sizeBytes: number;
  sizeFormatted: string;
  pageCount?: number;
}

export interface IThumbnailMetadata {
  filename: string;
  originalName: string;
  path: string;
  mimeType: string;
  sizeBytes: number;
}

export type JudgementStatus = 'draft' | 'scheduled' | 'published' | 'archived';

export interface IKeyHolding {
  title: string;
  text: string;
}

export interface ILegalProvisionRef {
  label: string;
  actOrCode?: string;
  badgeColor?: 'amber' | 'blue' | 'emerald' | 'purple' | 'slate';
}

export interface IRelatedCaseRef {
  title: string;
  citation: string;
  relationship?: 'Affirmed' | 'Overruled' | 'Distinguished' | 'Followed';
}

export interface IExamRelevance {
  prelimsFactoids: string[];
  mainsPerspective: string;
  pyqReferences: string[];
}

export interface IJudgementDigest extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  citation: string;
  court: CourtCategory;
  bench: string;
  benchStrength?: string;
  judges: string[];
  dateOfJudgement: Date;
  year: number;
  subject: string;
  category?: string;
  legalProvisions: string[];
  provisions?: ILegalProvisionRef[];
  summary: string;
  ratioDecidendi: string[];
  keyHoldings?: IKeyHolding[];
  fullAnalysis?: string;
  sourceReference?: string;
  mainsUtility?: string;
  overruledPrecedents?: string;
  tags: string[];
  importance: JudgementImportance;
  status: JudgementStatus;
  dailyDateIST?: string;
  isDailyFeatured: boolean;
  priority: number;
  pdfFile?: IPdfFileMetadata;
  thumbnail?: IThumbnailMetadata;
  isPublished: boolean;
  publishedAt?: Date;
  downloadCount: number;
  viewCount: number;
  bookmarkCount: number;
  isFeatured: boolean;
  relatedCases?: IRelatedCaseRef[];
  examRelevance?: IExamRelevance;
  overruledStatus?: {
    status: string;
    byCase?: string;
    byYear?: number;
  };
  uploadedBy: mongoose.Types.ObjectId;
  lastEditedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PdfFileSchema = new Schema<IPdfFileMetadata>(
  {
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    path: { type: String, required: true },
    mimeType: { type: String, default: 'application/pdf' },
    sizeBytes: { type: Number, required: true },
    sizeFormatted: { type: String, required: true },
    pageCount: { type: Number, default: 0 },
  },
  { _id: false }
);

const ThumbnailSchema = new Schema<IThumbnailMetadata>(
  {
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    path: { type: String, required: true },
    mimeType: { type: String, default: 'image/jpeg' },
    sizeBytes: { type: Number, required: true },
  },
  { _id: false }
);

const KeyHoldingSchema = new Schema<IKeyHolding>(
  {
    title: { type: String, required: true, trim: true },
    text: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const ProvisionSchema = new Schema<ILegalProvisionRef>(
  {
    label: { type: String, required: true, trim: true },
    actOrCode: { type: String, default: '', trim: true },
    badgeColor: {
      type: String,
      enum: ['amber', 'blue', 'emerald', 'purple', 'slate'],
      default: 'amber',
    },
  },
  { _id: false }
);

const RelatedCaseSchema = new Schema<IRelatedCaseRef>(
  {
    title: { type: String, required: true, trim: true },
    citation: { type: String, required: true, trim: true },
    relationship: {
      type: String,
      enum: ['Affirmed', 'Overruled', 'Distinguished', 'Followed'],
      default: 'Followed',
    },
  },
  { _id: false }
);

const ExamRelevanceSchema = new Schema<IExamRelevance>(
  {
    prelimsFactoids: { type: [String], default: [] },
    mainsPerspective: { type: String, default: '' },
    pyqReferences: { type: [String], default: [] },
  },
  { _id: false }
);

const JudgementDigestSchema = new Schema<IJudgementDigest>(
  {
    title: {
      type: String,
      required: [true, 'Case title is required.'],
      trim: true,
      maxlength: [400, 'Title cannot exceed 400 characters.'],
      index: true,
    },
    citation: {
      type: String,
      required: [true, 'Official or neutral legal citation is required.'],
      trim: true,
      index: true,
    },
    court: {
      type: String,
      required: [true, 'Court category is required.'],
      trim: true,
      default: 'Supreme Court of India',
      index: true,
    },
    bench: {
      type: String,
      trim: true,
      default: 'Division Bench (2 Judges)',
    },
    benchStrength: {
      type: String,
      trim: true,
      default: '3-Judge Bench',
    },
    judges: {
      type: [String],
      default: [],
    },
    dateOfJudgement: {
      type: Date,
      required: [true, 'Date of judgement is required.'],
      index: true,
    },
    year: {
      type: Number,
      required: [true, 'Decision year is required.'],
      min: [1950, 'Year must be 1950 or later.'],
      max: [2035, 'Year cannot exceed 2035.'],
      index: true,
    },
    subject: {
      type: String,
      required: [true, 'Primary legal subject is required.'],
      trim: true,
      index: true,
    },
    category: {
      type: String,
      trim: true,
      default: '',
    },
    legalProvisions: {
      type: [String],
      default: [],
    },
    provisions: {
      type: [ProvisionSchema],
      default: [],
    },
    summary: {
      type: String,
      required: [true, 'Executive case summary is required.'],
      trim: true,
    },
    ratioDecidendi: {
      type: [String],
      default: [],
    },
    keyHoldings: {
      type: [KeyHoldingSchema],
      default: [],
    },
    fullAnalysis: {
      type: String,
      trim: true,
      default: '',
    },
    sourceReference: {
      type: String,
      trim: true,
      default: '',
    },
    mainsUtility: {
      type: String,
      trim: true,
      default: '',
    },
    overruledPrecedents: {
      type: String,
      trim: true,
      default: '',
    },
    tags: {
      type: [String],
      default: [],
    },
    importance: {
      type: String,
      enum: ['Landmark', 'Leading', 'Recent / Overruling', 'Standard'],
      default: 'Landmark',
      index: true,
    },
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'published', 'archived'],
      default: 'published',
      index: true,
    },
    dailyDateIST: {
      type: String,
      trim: true,
      index: true,
    },
    isDailyFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    priority: {
      type: Number,
      default: 1,
    },
    pdfFile: {
      type: PdfFileSchema,
      required: false,
    },
    thumbnail: {
      type: ThumbnailSchema,
      required: false,
    },
    isPublished: {
      type: Boolean,
      default: true,
      index: true,
    },
    publishedAt: {
      type: Date,
      default: Date.now,
    },
    downloadCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    viewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    bookmarkCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    relatedCases: {
      type: [RelatedCaseSchema],
      default: [],
    },
    examRelevance: {
      type: ExamRelevanceSchema,
      required: false,
    },
    overruledStatus: {
      status: { type: String, default: 'Good Law' },
      byCase: { type: String, default: '' },
      byYear: { type: Number },
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    lastEditedBy: {
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

// High-performance compound indexes for filtering, facets & sorting
JudgementDigestSchema.index({ isPublished: 1, court: 1, year: -1, subject: 1 });
JudgementDigestSchema.index({ isPublished: 1, importance: 1, dateOfJudgement: -1 });
JudgementDigestSchema.index({ isPublished: 1, downloadCount: -1 });
JudgementDigestSchema.index({ isPublished: 1, createdAt: -1 });
JudgementDigestSchema.index({ status: 1, dailyDateIST: 1 });
JudgementDigestSchema.index({ isDailyFeatured: 1, dailyDateIST: 1 });
JudgementDigestSchema.index({ dailyDateIST: 1, priority: -1 });

// Full-text search index across case name, citation, legal provisions, summary & tags
JudgementDigestSchema.index(
  {
    title: 'text',
    citation: 'text',
    subject: 'text',
    legalProvisions: 'text',
    summary: 'text',
    tags: 'text',
    overruledPrecedents: 'text',
  },
  {
    weights: {
      title: 10,
      citation: 8,
      legalProvisions: 6,
      subject: 5,
      tags: 4,
      summary: 2,
      overruledPrecedents: 1,
    },
    name: 'JudgementTextIndex',
  }
);

const JudgementDigest = mongoose.model<IJudgementDigest>('JudgementDigest', JudgementDigestSchema);

export default JudgementDigest;

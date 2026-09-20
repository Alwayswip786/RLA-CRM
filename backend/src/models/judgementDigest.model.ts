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

export interface IJudgementDigest extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  citation: string;
  court: CourtCategory;
  bench: string;
  judges: string[];
  dateOfJudgement: Date;
  year: number;
  subject: string;
  legalProvisions: string[];
  summary: string;
  ratioDecidendi: string[];
  mainsUtility?: string;
  overruledPrecedents?: string;
  tags: string[];
  importance: JudgementImportance;
  pdfFile: IPdfFileMetadata;
  thumbnail?: IThumbnailMetadata;
  isPublished: boolean;
  publishedAt?: Date;
  downloadCount: number;
  viewCount: number;
  isFeatured: boolean;
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
    legalProvisions: {
      type: [String],
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
    pdfFile: {
      type: PdfFileSchema,
      required: [true, 'PDF file metadata is required.'],
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
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
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

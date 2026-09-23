import mongoose, { Schema, type Document } from 'mongoose';

export type ActCategory =
  | 'New Criminal Laws'
  | 'Major Procedural Act'
  | 'Major Substantive Act'
  | 'Civil & Property Law'
  | 'Commercial & Corporate Law'
  | 'Local & Special Acts';

export type NoteDifficulty = 'Prelims Booster' | 'Mains Analytical' | 'Comprehensive Mastery';

export interface ISectionBreakdown {
  sectionNumber: string;
  heading: string;
  keyTakeaway: string;
  pageNumber?: number;
}

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
  secureUrl?: string;
}

export interface IBareActNote extends Document {
  _id: mongoose.Types.ObjectId;
  actName: string;
  actYear: number;
  actNumber?: string;
  category: ActCategory;
  chapter?: string;
  sectionsCovered: string;
  title: string;
  description: string;
  highlights: string[];
  sectionBreakdown: ISectionBreakdown[];
  difficulty: NoteDifficulty;
  author: string;
  tags: string[];
  relatedJudgements: mongoose.Types.ObjectId[];
  pdfFile: IPdfFileMetadata;
  thumbnail?: IThumbnailMetadata;
  isPublished: boolean;
  publishedAt?: Date;
  isFeatured: boolean;
  downloadCount: number;
  viewCount: number;
  uploadedBy: mongoose.Types.ObjectId;
  lastEditedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SectionBreakdownSchema = new Schema<ISectionBreakdown>(
  {
    sectionNumber: { type: String, required: true, trim: true },
    heading: { type: String, required: true, trim: true },
    keyTakeaway: { type: String, required: true, trim: true },
    pageNumber: { type: Number, default: 1 },
  },
  { _id: false }
);

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
    secureUrl: { type: String, required: false },
  },
  { _id: false }
);

const BareActNoteSchema = new Schema<IBareActNote>(
  {
    actName: {
      type: String,
      required: [true, 'Act name is required (e.g. Bharatiya Nyaya Sanhita, 2023).'],
      trim: true,
      maxlength: [200, 'Act name cannot exceed 200 characters.'],
      index: true,
    },
    actYear: {
      type: Number,
      required: [true, 'Enactment / amendment year is required.'],
      min: [1800, 'Year must be 1800 or later.'],
      max: [2035, 'Year cannot exceed 2035.'],
      index: true,
    },
    actNumber: {
      type: String,
      trim: true,
      default: '',
    },
    category: {
      type: String,
      enum: [
        'New Criminal Laws',
        'Major Procedural Act',
        'Major Substantive Act',
        'Civil & Property Law',
        'Commercial & Corporate Law',
        'Local & Special Acts',
      ],
      required: [true, 'Act statutory category is required.'],
      trim: true,
      index: true,
    },
    chapter: {
      type: String,
      trim: true,
      default: '',
      index: true,
    },
    sectionsCovered: {
      type: String,
      required: [true, 'Sections or Orders covered is required (e.g. Sections 100 to 146).'],
      trim: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Decoding note title is required.'],
      trim: true,
      maxlength: [300, 'Title cannot exceed 300 characters.'],
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Academic description and overview is required.'],
      trim: true,
    },
    highlights: {
      type: [String],
      default: [],
    },
    sectionBreakdown: {
      type: [SectionBreakdownSchema],
      default: [],
    },
    difficulty: {
      type: String,
      enum: ['Prelims Booster', 'Mains Analytical', 'Comprehensive Mastery'],
      default: 'Mains Analytical',
    },
    author: {
      type: String,
      default: 'Adv. Rajinder Sir & Judicial Faculty',
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    relatedJudgements: [
      {
        type: Schema.Types.ObjectId,
        ref: 'JudgementDigest',
      },
    ],
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
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
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
BareActNoteSchema.index({ isPublished: 1, category: 1, actName: 1, actYear: -1 });
BareActNoteSchema.index({ isPublished: 1, isFeatured: 1, createdAt: -1 });
BareActNoteSchema.index({ isPublished: 1, downloadCount: -1 });
BareActNoteSchema.index({ isPublished: 1, createdAt: -1 });

// Full-text search index across key statutory identifiers
BareActNoteSchema.index(
  {
    title: 'text',
    actName: 'text',
    sectionsCovered: 'text',
    chapter: 'text',
    description: 'text',
    tags: 'text',
    'sectionBreakdown.heading': 'text',
    'sectionBreakdown.sectionNumber': 'text',
  },
  {
    weights: {
      actName: 10,
      sectionsCovered: 9,
      title: 8,
      'sectionBreakdown.sectionNumber': 7,
      chapter: 6,
      tags: 5,
      description: 2,
    },
    name: 'BareActTextIndex',
  }
);

const BareActNote = mongoose.model<IBareActNote>('BareActNote', BareActNoteSchema);

export default BareActNote;

import mongoose, { Schema, type Document } from 'mongoose';

export type DigestContentType =
  | 'Supreme Court Ruling'
  | 'High Court Ruling'
  | 'Legal Maxim'
  | 'Legislative Amendment'
  | 'Bare Act Update'
  | 'Exam Insight';

export type DigestStatus = 'draft' | 'scheduled' | 'published' | 'archived';

export interface IDigestItem {
  itemId: string;
  contentType: DigestContentType;
  categoryBadge: string;
  badgeColor?: 'amber' | 'blue' | 'emerald' | 'purple' | 'rose' | 'slate';
  subject: string;
  title: string;
  citation?: string;
  bench?: string;
  court?: string;
  date?: string;
  summary: string;
  fullText?: string;
  examinationTip: string;
  legalProvisions?: Array<{
    sectionOrArticle: string;
    actOrCode?: string;
  }>;
  tags?: string[];
  sourceReference?: string;
  sourceUrl?: string;
  pdfFile?: {
    filename: string;
    originalName: string;
    path: string;
    mimeType: string;
    sizeBytes: number;
    sizeFormatted: string;
  };
  relatedJudgementId?: mongoose.Types.ObjectId;
  relatedPyqId?: mongoose.Types.ObjectId;
  relatedMainsId?: mongoose.Types.ObjectId;
  order: number;
}

export interface IFeaturedMaxim {
  latinText: string;
  englishMeaning: string;
  jurisprudenceContext: string;
  relevantProvisions?: string[];
  subject?: string;
}

export interface IDailyLegalDigestEdition extends Document {
  _id: mongoose.Types.ObjectId;
  editionDateIST: string; // "YYYY-MM-DD" canonical IST date
  editionNumber: number;
  title: string;
  subtitle: string;
  curatedBy: string;
  featuredMaxim: IFeaturedMaxim;
  items: IDigestItem[];
  status: DigestStatus;
  isPublished: boolean;
  scheduledPublishAt?: Date;
  publishedAt?: Date;
  compiledPdf?: {
    filename: string;
    originalName: string;
    path: string;
    mimeType: string;
    sizeBytes: number;
    sizeFormatted: string;
  };
  totalReadsCount: number;
  totalBookmarksCount: number;
  author?: mongoose.Types.ObjectId;
  authorName: string;
  createdAt: Date;
  updatedAt: Date;
}

const DigestItemSchema = new Schema<IDigestItem>(
  {
    itemId: {
      type: String,
      required: true,
      trim: true,
    },
    contentType: {
      type: String,
      required: true,
      enum: [
        'Supreme Court Ruling',
        'High Court Ruling',
        'Legal Maxim',
        'Legislative Amendment',
        'Bare Act Update',
        'Exam Insight',
      ],
      default: 'Supreme Court Ruling',
    },
    categoryBadge: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    badgeColor: {
      type: String,
      enum: ['amber', 'blue', 'emerald', 'purple', 'rose', 'slate'],
      default: 'amber',
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    citation: {
      type: String,
      default: '',
      trim: true,
    },
    bench: {
      type: String,
      default: '',
      trim: true,
    },
    court: {
      type: String,
      default: '',
      trim: true,
    },
    date: {
      type: String,
      default: '',
      trim: true,
    },
    summary: {
      type: String,
      required: true,
      trim: true,
    },
    fullText: {
      type: String,
      default: '',
      trim: true,
    },
    examinationTip: {
      type: String,
      required: true,
      trim: true,
    },
    legalProvisions: [
      {
        sectionOrArticle: { type: String, required: true, trim: true },
        actOrCode: { type: String, default: '', trim: true },
      },
    ],
    tags: {
      type: [String],
      default: [],
    },
    sourceReference: {
      type: String,
      default: '',
      trim: true,
    },
    sourceUrl: {
      type: String,
      default: '',
      trim: true,
    },
    pdfFile: {
      filename: String,
      originalName: String,
      path: String,
      mimeType: String,
      sizeBytes: Number,
      sizeFormatted: String,
    },
    relatedJudgementId: {
      type: Schema.Types.ObjectId,
      ref: 'JudgementDigest',
    },
    relatedPyqId: {
      type: Schema.Types.ObjectId,
      ref: 'PyqQuestion',
    },
    relatedMainsId: {
      type: Schema.Types.ObjectId,
      ref: 'MainsQuestion',
    },
    order: {
      type: Number,
      default: 1,
    },
  },
  { _id: false }
);

const FeaturedMaximSchema = new Schema<IFeaturedMaxim>(
  {
    latinText: {
      type: String,
      required: true,
      trim: true,
    },
    englishMeaning: {
      type: String,
      required: true,
      trim: true,
    },
    jurisprudenceContext: {
      type: String,
      required: true,
      trim: true,
    },
    relevantProvisions: {
      type: [String],
      default: [],
    },
    subject: {
      type: String,
      default: 'Penal Jurisprudence',
      trim: true,
    },
  },
  { _id: false }
);

const DailyLegalDigestEditionSchema = new Schema<IDailyLegalDigestEdition>(
  {
    editionDateIST: {
      type: String,
      required: [true, 'Canonical IST edition date (YYYY-MM-DD) is required.'],
      unique: true,
      trim: true,
      index: true,
    },
    editionNumber: {
      type: Number,
      default: 1,
      index: true,
    },
    title: {
      type: String,
      required: true,
      default: 'Daily Legal Digest & Case Law Brief',
      trim: true,
    },
    subtitle: {
      type: String,
      default: 'Stay ahead with daily judgments, Bare Act comparative pointers, and Latin maxims.',
      trim: true,
    },
    curatedBy: {
      type: String,
      default: 'Curated Daily by Faculty Wing',
      trim: true,
    },
    featuredMaxim: {
      type: FeaturedMaximSchema,
      required: true,
    },
    items: {
      type: [DigestItemSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'published', 'archived'],
      default: 'published',
      index: true,
    },
    isPublished: {
      type: Boolean,
      default: true,
      index: true,
    },
    scheduledPublishAt: {
      type: Date,
    },
    publishedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    compiledPdf: {
      filename: String,
      originalName: String,
      path: String,
      mimeType: String,
      sizeBytes: Number,
      sizeFormatted: String,
    },
    totalReadsCount: {
      type: Number,
      default: 0,
    },
    totalBookmarksCount: {
      type: Number,
      default: 0,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    authorName: {
      type: String,
      default: 'Adv. Rajinder Sir',
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// High performance compound indexes
DailyLegalDigestEditionSchema.index({ status: 1, editionDateIST: -1 });
DailyLegalDigestEditionSchema.index({ isPublished: 1, editionDateIST: -1 });
DailyLegalDigestEditionSchema.index({ 'items.subject': 1, isPublished: 1 });
DailyLegalDigestEditionSchema.index({ 'items.contentType': 1, isPublished: 1 });

export const DailyLegalDigestEdition = mongoose.model<IDailyLegalDigestEdition>(
  'DailyLegalDigestEdition',
  DailyLegalDigestEditionSchema
);

// ==========================================
// Student Read Progress Tracking Schema
// ==========================================
export interface IDailyDigestReadStatus extends Document {
  user: mongoose.Types.ObjectId;
  editionDateIST: string;
  editionId: mongoose.Types.ObjectId;
  readItemIds: string[];
  isFullyRead: boolean;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DailyDigestReadStatusSchema = new Schema<IDailyDigestReadStatus>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    editionDateIST: {
      type: String,
      required: true,
      index: true,
    },
    editionId: {
      type: Schema.Types.ObjectId,
      ref: 'DailyLegalDigestEdition',
      required: true,
    },
    readItemIds: {
      type: [String],
      default: [],
    },
    isFullyRead: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

DailyDigestReadStatusSchema.index({ user: 1, editionDateIST: 1 }, { unique: true });

export const DailyDigestReadStatus = mongoose.model<IDailyDigestReadStatus>(
  'DailyDigestReadStatus',
  DailyDigestReadStatusSchema
);

// ==========================================
// Student Consistency Streak Schema
// ==========================================
export interface IDailyDigestStreak extends Document {
  user: mongoose.Types.ObjectId;
  currentStreak: number;
  longestStreak: number;
  lastReadDateIST?: string;
  totalEditionsRead: number;
  createdAt: Date;
  updatedAt: Date;
}

const DailyDigestStreakSchema = new Schema<IDailyDigestStreak>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    currentStreak: {
      type: Number,
      default: 0,
    },
    longestStreak: {
      type: Number,
      default: 0,
    },
    lastReadDateIST: {
      type: String,
      default: '',
    },
    totalEditionsRead: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export const DailyDigestStreak = mongoose.model<IDailyDigestStreak>(
  'DailyDigestStreak',
  DailyDigestStreakSchema
);

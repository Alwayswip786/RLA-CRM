import mongoose, { Schema, type Document } from 'mongoose';

export type BookmarkItemType = 'MCQ' | 'Judgment' | 'Bare Act Note' | 'Daily Digest' | 'Course Note' | 'Lesson';

export interface IBookmarkMetadata {
  options?: Array<{ key: string; text: string }>;
  correctOption?: string;
  explanation?: string;
  citation?: string;
  court?: string;
  year?: number | string;
  bench?: string;
  sectionsCovered?: string;
  actName?: string;
  pdfUrl?: string;
  targetRoute?: string;
  [key: string]: any;
}

export interface IBookmark extends Document {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  itemType: BookmarkItemType;
  itemId: string;
  title: string;
  source: string;
  subject: string;
  annotation?: string;
  tags: string[];
  metadata?: IBookmarkMetadata;
  createdAt: Date;
  updatedAt: Date;
}

const BookmarkSchema = new Schema<IBookmark>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required for a vault bookmark.'],
      index: true,
    },
    itemType: {
      type: String,
      required: [true, 'Item type is required (MCQ, Judgment, Bare Act Note, Daily Digest).'],
      enum: {
        values: ['MCQ', 'Judgment', 'Bare Act Note', 'Daily Digest', 'Course Note', 'Lesson'],
        message: '{VALUE} is not a valid bookmark type.',
      },
      index: true,
    },
    itemId: {
      type: String,
      required: [true, 'Target item identifier is required.'],
      trim: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Bookmark title or question heading is required.'],
      trim: true,
      maxlength: [1000, 'Title cannot exceed 1000 characters.'],
    },
    source: {
      type: String,
      default: '',
      trim: true,
      maxlength: [500, 'Source reference cannot exceed 500 characters.'],
    },
    subject: {
      type: String,
      required: [true, 'Subject category is required.'],
      trim: true,
      default: 'General Legal Studies',
      index: true,
    },
    annotation: {
      type: String,
      default: '',
      trim: true,
      maxlength: [5000, 'Aspirant annotation cannot exceed 5000 characters.'],
    },
    tags: {
      type: [String],
      default: [],
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound Unique Index: prevents duplicate starring of identical item per user
BookmarkSchema.index({ user: 1, itemType: 1, itemId: 1 }, { unique: true });

// High-speed sorting & filtering indexes
BookmarkSchema.index({ user: 1, itemType: 1, createdAt: -1 });
BookmarkSchema.index({ user: 1, subject: 1, createdAt: -1 });
BookmarkSchema.index({ user: 1, createdAt: -1 });

// Full-text search index for keyword lookup in personal vault
BookmarkSchema.index(
  {
    title: 'text',
    source: 'text',
    annotation: 'text',
    tags: 'text',
    subject: 'text',
  },
  {
    weights: {
      title: 10,
      annotation: 8,
      source: 6,
      subject: 4,
      tags: 2,
    },
    name: 'BookmarkVaultTextIndex',
  }
);

const Bookmark = mongoose.model<IBookmark>('Bookmark', BookmarkSchema);

export default Bookmark;

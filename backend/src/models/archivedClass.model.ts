import mongoose, { Schema, type Document, type Types } from 'mongoose';

export interface IArchivedChapter {
  timestampSeconds: number;
  title: string;
}

export interface IArchivedNotesFile {
  fileName: string;
  fileUrl: string;
  fileSize: string;
}

export interface IArchivedClass extends Document {
  _id: Types.ObjectId;
  originalClassId?: Types.ObjectId;
  courseId?: Types.ObjectId;
  batchIds: Types.ObjectId[];
  subject: string;
  title: string;
  date: string;
  duration: string;
  durationSeconds: number;
  faculty: string;
  facultyTitle?: string;
  videoUrl: string;
  videoThumbnail?: string;
  notesFile?: IArchivedNotesFile;
  chapters: IArchivedChapter[];
  viewsCount: number;
  likesCount: number;
  dislikesCount: number;
  commentsCount: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ChapterSchema = new Schema<IArchivedChapter>(
  {
    timestampSeconds: { type: Number, required: true },
    title: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const NotesFileSchema = new Schema<IArchivedNotesFile>(
  {
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileSize: { type: String, default: '3.5 MB PDF' },
  },
  { _id: false }
);

const ArchivedClassSchema = new Schema<IArchivedClass>(
  {
    originalClassId: {
      type: Schema.Types.ObjectId,
      ref: 'LiveClass',
      index: true,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      index: true,
    },
    batchIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Batch',
        index: true,
      },
    ],
    subject: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: String,
      required: true,
    },
    duration: {
      type: String,
      required: true,
      default: '1h 30m',
    },
    durationSeconds: {
      type: Number,
      default: 5400,
    },
    faculty: {
      type: String,
      required: true,
      default: 'Adv. Rajinder Sir',
    },
    facultyTitle: {
      type: String,
      default: 'Founding Director & Judicial Mentor',
    },
    videoUrl: {
      type: String,
      required: true,
    },
    videoThumbnail: {
      type: String,
      default: '',
    },
    notesFile: {
      type: NotesFileSchema,
    },
    chapters: {
      type: [ChapterSchema],
      default: [],
    },
    viewsCount: {
      type: Number,
      default: 0,
    },
    likesCount: {
      type: Number,
      default: 0,
    },
    dislikesCount: {
      type: Number,
      default: 0,
    },
    commentsCount: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

ArchivedClassSchema.index({ isPublished: 1, createdAt: -1 });
ArchivedClassSchema.index({ subject: 1, isPublished: 1 });

export const ArchivedClass = mongoose.model<IArchivedClass>('ArchivedClass', ArchivedClassSchema);

// ============================================================================
// Archived Class Reaction Schema
// ============================================================================
export interface IArchivedClassReaction extends Document {
  userId: Types.ObjectId;
  archiveId: Types.ObjectId;
  reaction: 'like' | 'dislike';
  createdAt: Date;
}

const ArchivedClassReactionSchema = new Schema<IArchivedClassReaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    archiveId: { type: Schema.Types.ObjectId, ref: 'ArchivedClass', required: true, index: true },
    reaction: { type: String, enum: ['like', 'dislike'], required: true },
  },
  { timestamps: true }
);

ArchivedClassReactionSchema.index({ userId: 1, archiveId: 1 }, { unique: true });
export const ArchivedClassReaction = mongoose.model<IArchivedClassReaction>(
  'ArchivedClassReaction',
  ArchivedClassReactionSchema
);

// ============================================================================
// Archived Class Comment Schema
// ============================================================================
export interface IArchivedClassComment extends Document {
  archiveId: Types.ObjectId;
  userId: Types.ObjectId;
  userName: string;
  userRole: string;
  text: string;
  parentCommentId?: Types.ObjectId;
  likesCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const ArchivedClassCommentSchema = new Schema<IArchivedClassComment>(
  {
    archiveId: { type: Schema.Types.ObjectId, ref: 'ArchivedClass', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    userRole: { type: String, default: 'student' },
    text: { type: String, required: true, trim: true, maxlength: 2000 },
    parentCommentId: { type: Schema.Types.ObjectId, ref: 'ArchivedClassComment' },
    likesCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

ArchivedClassCommentSchema.index({ archiveId: 1, createdAt: -1 });
export const ArchivedClassComment = mongoose.model<IArchivedClassComment>(
  'ArchivedClassComment',
  ArchivedClassCommentSchema
);

// ============================================================================
// Archived Class Watch Progress Schema
// ============================================================================
export interface IArchivedClassWatchProgress extends Document {
  userId: Types.ObjectId;
  archiveId: Types.ObjectId;
  lastPositionSeconds: number;
  maxPositionSeconds: number;
  isCompleted: boolean;
  progressPercent: number;
  lastWatchedAt: Date;
}

const ArchivedClassWatchProgressSchema = new Schema<IArchivedClassWatchProgress>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    archiveId: { type: Schema.Types.ObjectId, ref: 'ArchivedClass', required: true, index: true },
    lastPositionSeconds: { type: Number, default: 0 },
    maxPositionSeconds: { type: Number, default: 0 },
    isCompleted: { type: Boolean, default: false },
    progressPercent: { type: Number, default: 0 },
    lastWatchedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

ArchivedClassWatchProgressSchema.index({ userId: 1, archiveId: 1 }, { unique: true });
export const ArchivedClassWatchProgress = mongoose.model<IArchivedClassWatchProgress>(
  'ArchivedClassWatchProgress',
  ArchivedClassWatchProgressSchema
);

export default ArchivedClass;

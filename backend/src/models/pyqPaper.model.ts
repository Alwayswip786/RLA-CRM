import mongoose, { Schema, type Document } from 'mongoose';

export type JudicialExam =
  | 'Delhi Judicial Service (DJS)'
  | 'Delhi Higher Judicial Service (DHJS)'
  | 'Haryana Civil Services (Judicial)'
  | 'UP PCS-J Judicial Examination'
  | 'UP Higher Judicial Service (UP HJS)'
  | 'MP Civil Judge (MP CJ)'
  | 'Rajasthan Judicial Service (RJS)'
  | 'Himachal Pradesh Judicial Service (HPJS)'
  | 'Punjab Superior Judicial Services (PJS)';

export type ExamStage = 'Prelims' | 'Mains' | 'Interview';

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

export interface IPyqPaper extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  exam: JudicialExam;
  year: number;
  stage: ExamStage;
  subject: string;
  paperCode?: string;
  totalMarks: number;
  durationMinutes?: number;
  description: string;
  topics: string[];
  solvedByFaculty: string;
  modelAnswersIncluded: boolean;
  solutionsProvided: boolean;
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

const PyqPaperSchema = new Schema<IPyqPaper>(
  {
    title: {
      type: String,
      required: [true, 'Paper title is required.'],
      trim: true,
      maxlength: [300, 'Title cannot exceed 300 characters.'],
    },
    exam: {
      type: String,
      required: [true, 'Judicial exam category is required.'],
      trim: true,
      index: true,
    },
    year: {
      type: Number,
      required: [true, 'Examination year is required.'],
      min: [2010, 'Year must be 2010 or later.'],
      max: [2035, 'Year cannot exceed 2035.'],
      index: true,
    },
    stage: {
      type: String,
      enum: ['Prelims', 'Mains', 'Interview'],
      required: [true, 'Exam stage (Prelims, Mains, or Interview) is required.'],
      default: 'Mains',
      index: true,
    },
    subject: {
      type: String,
      required: [true, 'Subject name / paper title is required.'],
      trim: true,
      index: true,
    },
    paperCode: {
      type: String,
      trim: true,
      uppercase: true,
    },
    totalMarks: {
      type: Number,
      default: 200,
      min: 0,
    },
    durationMinutes: {
      type: Number,
      default: 180,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    topics: {
      type: [String],
      default: [],
    },
    solvedByFaculty: {
      type: String,
      default: 'Adv. Rajinder Sir & Faculty Board',
      trim: true,
    },
    modelAnswersIncluded: {
      type: Boolean,
      default: true,
    },
    solutionsProvided: {
      type: Boolean,
      default: true,
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

// Compound indexes for high-performance library browsing & sorting
PyqPaperSchema.index({ isPublished: 1, exam: 1, year: -1, stage: 1 });
PyqPaperSchema.index({ isPublished: 1, downloadCount: -1 });
PyqPaperSchema.index({ isPublished: 1, createdAt: -1 });

// Full-text search index across titles, descriptions, subjects, and topics
PyqPaperSchema.index(
  {
    title: 'text',
    subject: 'text',
    description: 'text',
    topics: 'text',
    exam: 'text',
  },
  {
    weights: {
      title: 10,
      subject: 5,
      topics: 3,
      exam: 2,
      description: 1,
    },
    name: 'PyqTextIndex',
  }
);

const PyqPaper = mongoose.model<IPyqPaper>('PyqPaper', PyqPaperSchema);

export default PyqPaper;

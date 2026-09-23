import mongoose, { Schema, type Document } from 'mongoose';

export type NoticeCategory =
  | 'Examination'
  | 'Classroom Timetable'
  | 'Mains Test Series'
  | 'Admissions'
  | 'Holiday'
  | 'General';

export type NoticePriority = 'normal' | 'urgent';

export interface INoticeReadReceipt {
  student: mongoose.Types.ObjectId;
  readAt: Date;
}

export interface INotice extends Document {
  _id: mongoose.Types.ObjectId;
  circularNo: string;
  title: string;
  content: string;
  category: NoticeCategory;
  priority: NoticePriority;
  targetCohorts: string;
  targetExam?: string;
  issuedBy: string;
  author?: mongoose.Types.ObjectId;
  authorName: string;
  isPublished: boolean;
  publishedAt: Date;
  validUntil?: Date;
  readBy?: INoticeReadReceipt[];
  createdAt: Date;
  updatedAt: Date;
}

const NoticeSchema = new Schema<INotice>(
  {
    circularNo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: [
        'Examination',
        'Classroom Timetable',
        'Mains Test Series',
        'Admissions',
        'Holiday',
        'General',
      ],
      default: 'General',
      index: true,
    },
    priority: {
      type: String,
      enum: ['normal', 'urgent'],
      default: 'normal',
      index: true,
    },
    targetCohorts: {
      type: String,
      default: 'All Enrolled Batches',
    },
    targetExam: {
      type: String,
      default: 'All Judicial Aspirants',
    },
    issuedBy: {
      type: String,
      default: 'Director Office, Rajinder Law Academy',
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    authorName: {
      type: String,
      default: 'Adv. Rajinder Sir',
    },
    isPublished: {
      type: Boolean,
      default: true,
      index: true,
    },
    publishedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    validUntil: {
      type: Date,
    },
    readBy: [
      {
        student: {
          type: Schema.Types.ObjectId,
          ref: 'User',
        },
        readAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

NoticeSchema.index({ priority: -1, publishedAt: -1 });

const Notice = mongoose.model<INotice>('Notice', NoticeSchema);

export default Notice;

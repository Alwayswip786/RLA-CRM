import mongoose, { Schema, type Document, type Types } from 'mongoose';

export type DoubtStatus = 'pending' | 'under_review' | 'resolved' | 'closed';
export type DoubtPriority = 'normal' | 'urgent';
export type DoubtCategory =
  | 'Bare Act Interpretation'
  | 'Mains Answer Drafting'
  | 'Case Law & Precedent'
  | 'Procedural Practice'
  | 'General Legal Doubt';

export interface IDoubtThreadMessage {
  _id?: Types.ObjectId;
  senderId: Types.ObjectId;
  senderRole: 'student' | 'faculty' | 'admin';
  senderName: string;
  senderSalutation?: string;
  message: string;
  attachments?: Array<{
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
  }>;
  createdAt: Date;
}

export interface IDoubtQuery extends Document {
  _id: Types.ObjectId;
  queryNumber: string;
  student: Types.ObjectId;
  studentName: string;
  rollNo: string;
  subject: string;
  bareActSection?: string;
  title: string;
  initialQuestion: string;
  category: DoubtCategory;
  priority: DoubtPriority;
  status: DoubtStatus;
  assignedFaculty?: Types.ObjectId;
  assignedFacultyName?: string;
  thread: IDoubtThreadMessage[];
  tags: string[];
  resolvedAt?: Date;
  escalatedToLiveChat: boolean;
  liveChatConversationId?: Types.ObjectId;
  courseId?: string;
  moduleId?: string;
  lessonId?: string;
  lessonTitle?: string;
  videoTimestamp?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DoubtThreadMessageSchema = new Schema<IDoubtThreadMessage>(
  {
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    senderRole: {
      type: String,
      enum: ['student', 'faculty', 'admin'],
      required: true,
    },
    senderName: {
      type: String,
      required: true,
      trim: true,
    },
    senderSalutation: {
      type: String,
      trim: true,
      default: '',
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
    attachments: [
      {
        fileName: { type: String, trim: true },
        fileUrl: { type: String, trim: true },
        fileType: { type: String, trim: true },
        fileSize: { type: Number, default: 0 },
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const DoubtQuerySchema = new Schema<IDoubtQuery>(
  {
    queryNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    student: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    studentName: {
      type: String,
      required: true,
      trim: true,
    },
    rollNo: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    bareActSection: {
      type: String,
      trim: true,
      default: '',
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },
    initialQuestion: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
    category: {
      type: String,
      enum: [
        'Bare Act Interpretation',
        'Mains Answer Drafting',
        'Case Law & Precedent',
        'Procedural Practice',
        'General Legal Doubt',
      ],
      default: 'Bare Act Interpretation',
      index: true,
    },
    priority: {
      type: String,
      enum: ['normal', 'urgent'],
      default: 'normal',
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'under_review', 'resolved', 'closed'],
      default: 'pending',
      index: true,
    },
    assignedFaculty: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    assignedFacultyName: {
      type: String,
      trim: true,
      default: '',
    },
    thread: [DoubtThreadMessageSchema],
    tags: [{ type: String, trim: true }],
    resolvedAt: {
      type: Date,
    },
    escalatedToLiveChat: {
      type: Boolean,
      default: false,
      index: true,
    },
    liveChatConversationId: {
      type: Schema.Types.ObjectId,
      ref: 'ChatConversation',
    },
    courseId: {
      type: String,
      trim: true,
      index: true,
    },
    moduleId: {
      type: String,
      trim: true,
    },
    lessonId: {
      type: String,
      trim: true,
      index: true,
    },
    lessonTitle: {
      type: String,
      trim: true,
    },
    videoTimestamp: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Performance compound indexes
DoubtQuerySchema.index({ student: 1, status: 1, createdAt: -1 });
DoubtQuerySchema.index({ status: 1, subject: 1, priority: -1, createdAt: 1 });

const DoubtQuery = mongoose.model<IDoubtQuery>('DoubtQuery', DoubtQuerySchema);

export default DoubtQuery;

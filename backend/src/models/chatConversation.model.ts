import mongoose, { Schema, type Document, type Types } from 'mongoose';

export interface IChatConversation extends Document {
  _id: Types.ObjectId;
  participants: Types.ObjectId[];
  studentId: Types.ObjectId;
  adminId: Types.ObjectId;
  studentRollNo: string;
  studentName: string;
  channel: 'mentorship' | 'admissions' | 'general';
  status: 'active' | 'archived' | 'muted';
  lastMessageAt: Date;
  lastMessagePreview: string;
  lastMessageSenderId?: Types.ObjectId;
  unreadCountStudent: number;
  unreadCountAdmin: number;
  queryRefId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ChatConversationSchema = new Schema<IChatConversation>(
  {
    participants: {
      type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      required: true,
      validate: [(val: unknown[]) => val.length >= 2, 'Conversation requires at least two participants.'],
      index: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    adminId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    studentRollNo: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    studentName: {
      type: String,
      required: true,
      trim: true,
    },
    channel: {
      type: String,
      enum: ['mentorship', 'admissions', 'general'],
      default: 'mentorship',
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'archived', 'muted'],
      default: 'active',
      index: true,
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    lastMessagePreview: {
      type: String,
      trim: true,
      maxlength: 200,
      default: '',
    },
    lastMessageSenderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    unreadCountStudent: {
      type: Number,
      default: 0,
      min: 0,
    },
    unreadCountAdmin: {
      type: Number,
      default: 0,
      min: 0,
    },
    queryRefId: {
      type: Schema.Types.ObjectId,
      ref: 'DoubtQuery',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

ChatConversationSchema.index({ participants: 1, status: 1, lastMessageAt: -1 });
ChatConversationSchema.index({ studentId: 1, adminId: 1 }, { unique: true });

const ChatConversation = mongoose.model<IChatConversation>('ChatConversation', ChatConversationSchema);

export default ChatConversation;

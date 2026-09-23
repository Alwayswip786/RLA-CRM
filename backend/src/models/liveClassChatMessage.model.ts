import mongoose, { Schema, type Document, type Types } from 'mongoose';

export interface ILiveClassChatMessage extends Document {
  _id: Types.ObjectId;
  classId: Types.ObjectId;
  senderId: Types.ObjectId;
  senderName: string;
  senderRole: 'faculty' | 'admin' | 'student';
  text: string;
  time: string; // e.g. "5:01 PM"
  isFacultyMessage: boolean;
  isPinned: boolean;
  isDoubt: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LiveClassChatMessageSchema = new Schema<ILiveClassChatMessage>(
  {
    classId: {
      type: Schema.Types.ObjectId,
      ref: 'LiveClass',
      required: true,
      index: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    senderName: {
      type: String,
      required: true,
      trim: true,
    },
    senderRole: {
      type: String,
      enum: ['faculty', 'admin', 'student'],
      default: 'student',
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 3000,
    },
    time: {
      type: String,
      required: true,
    },
    isFacultyMessage: {
      type: Boolean,
      default: false,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    isDoubt: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

LiveClassChatMessageSchema.index({ classId: 1, createdAt: 1 });

export const LiveClassChatMessage = mongoose.model<ILiveClassChatMessage>(
  'LiveClassChatMessage',
  LiveClassChatMessageSchema
);
export default LiveClassChatMessage;

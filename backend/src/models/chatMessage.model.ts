import mongoose, { Schema, type Document, type Types } from 'mongoose';

export type MessageDeliveryStatus = 'sent' | 'delivered' | 'read';

export interface IChatMessage extends Document {
  _id: Types.ObjectId;
  conversationId: Types.ObjectId;
  senderId: Types.ObjectId;
  senderRole: 'student' | 'faculty' | 'admin' | 'system';
  senderName: string;
  message: string;
  clientMessageId: string;
  deliveryStatus: MessageDeliveryStatus;
  deliveredAt?: Date;
  readAt?: Date;
  readBy: Array<{
    userId: Types.ObjectId;
    readAt: Date;
  }>;
  attachments: Array<{
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
  }>;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'ChatConversation',
      required: true,
      index: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    senderRole: {
      type: String,
      enum: ['student', 'faculty', 'admin', 'system'],
      required: true,
      index: true,
    },
    senderName: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 5000,
    },
    clientMessageId: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    deliveryStatus: {
      type: String,
      enum: ['sent', 'delivered', 'read'],
      default: 'sent',
      index: true,
    },
    deliveredAt: {
      type: Date,
    },
    readAt: {
      type: Date,
    },
    readBy: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        readAt: { type: Date, default: Date.now },
        _id: false,
      },
    ],
    attachments: [
      {
        fileName: { type: String, trim: true },
        fileUrl: { type: String, trim: true },
        fileType: { type: String, trim: true },
        fileSize: { type: Number, default: 0 },
        _id: false,
      },
    ],
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Performance & Idempotency compound indexes
ChatMessageSchema.index({ conversationId: 1, createdAt: -1 });
ChatMessageSchema.index({ senderId: 1, clientMessageId: 1 }, { unique: true });
ChatMessageSchema.index({ conversationId: 1, 'readBy.userId': 1 });

const ChatMessage = mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);

export default ChatMessage;

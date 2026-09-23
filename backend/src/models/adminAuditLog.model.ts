import mongoose, { Schema, type Document, type Types } from 'mongoose';

export interface IAdminAuditLog extends Document {
  _id: Types.ObjectId;
  actorId: Types.ObjectId;
  actorName: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  targetResource: string;
  targetResourceId?: string;
  targetName?: string;
  description: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

const AdminAuditLogSchema = new Schema<IAdminAuditLog>(
  {
    actorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    actorName: {
      type: String,
      required: true,
      trim: true,
    },
    actorEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    actorRole: {
      type: String,
      required: true,
      trim: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    targetResource: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    targetResourceId: {
      type: String,
      trim: true,
    },
    targetName: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    details: {
      type: Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      default: '',
      trim: true,
    },
    userAgent: {
      type: String,
      default: '',
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

AdminAuditLogSchema.index({ timestamp: -1 });
AdminAuditLogSchema.index({ action: 1, timestamp: -1 });
AdminAuditLogSchema.index({ actorId: 1, timestamp: -1 });

const AdminAuditLog = mongoose.model<IAdminAuditLog>('AdminAuditLog', AdminAuditLogSchema);
export default AdminAuditLog;

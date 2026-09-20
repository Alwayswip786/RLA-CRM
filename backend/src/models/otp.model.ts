import mongoose, { Schema, type Document } from 'mongoose';

export type OtpPurpose = 'email_verification' | 'password_reset';

export interface IOtpRecord extends Document {
  email: string;
  purpose: OtpPurpose;
  otpHash: string;
  attempts: number;
  consumed: boolean;
  lastSentAt: Date;
  expiresAt: Date;
  resetTokenHash?: string;
  resetTokenExpiresAt?: Date;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OtpRecordSchema = new Schema<IOtpRecord>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    purpose: {
      type: String,
      enum: ['email_verification', 'password_reset'],
      required: true,
      index: true,
    },
    otpHash: {
      type: String,
      required: true,
      select: false,
    },
    attempts: {
      type: Number,
      default: 0,
      min: 0,
    },
    consumed: {
      type: Boolean,
      default: false,
      index: true,
    },
    lastSentAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // Native MongoDB TTL index: auto-deletes 10 minutes after generation
    },
    resetTokenHash: {
      type: String,
      select: false,
    },
    resetTokenExpiresAt: {
      type: Date,
    },
    verifiedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// High-speed index for active OTP lookups
OtpRecordSchema.index({ email: 1, purpose: 1, consumed: 1 });
OtpRecordSchema.index({ resetTokenHash: 1 }, { unique: true, sparse: true });

const OtpRecord = mongoose.model<IOtpRecord>('OtpRecord', OtpRecordSchema);
export default OtpRecord;

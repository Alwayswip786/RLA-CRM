import mongoose, { Schema, type Document } from 'mongoose';

export interface IPendingRegistration extends Document {
  email: string;
  passwordHash: string;
  expiresAt: Date;
  createdAt: Date;
}

const PendingRegistrationSchema = new Schema<IPendingRegistration>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // Native MongoDB TTL index: automatically deletes 24 hours after creation
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const PendingRegistration = mongoose.model<IPendingRegistration>(
  'PendingRegistration',
  PendingRegistrationSchema
);
export default PendingRegistration;

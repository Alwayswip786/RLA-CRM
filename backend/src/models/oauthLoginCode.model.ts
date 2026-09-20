import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IOAuthLoginCode extends Document {
  codeHash: string;
  userId: Types.ObjectId;
  redirectTo: string;
  expiresAt: Date;
  consumedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const oauthLoginCodeSchema = new Schema<IOAuthLoginCode>(
  {
    codeHash: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    redirectTo: { type: String, default: '/onboarding' },
    expiresAt: { type: Date, required: true, expires: 0 },
    consumedAt: { type: Date },
  },
  { timestamps: true, versionKey: false }
);

export default mongoose.model<IOAuthLoginCode>('OAuthLoginCode', oauthLoginCodeSchema);

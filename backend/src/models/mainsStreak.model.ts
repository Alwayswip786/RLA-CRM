import mongoose, { Schema, type Document } from 'mongoose';

export interface IMainsStreak extends Document {
  _id: mongoose.Types.ObjectId;
  student: mongoose.Types.ObjectId;
  currentStreak: number;
  longestStreak: number;
  lastSubmissionDate?: Date;
  totalSubmissions: number;
  createdAt: Date;
  updatedAt: Date;
}

const MainsStreakSchema = new Schema<IMainsStreak>(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    currentStreak: {
      type: Number,
      default: 0,
      min: 0,
    },
    longestStreak: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastSubmissionDate: {
      type: Date,
    },
    totalSubmissions: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

const MainsStreak = mongoose.model<IMainsStreak>('MainsStreak', MainsStreakSchema);

export default MainsStreak;

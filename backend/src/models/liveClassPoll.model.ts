import mongoose, { Schema, type Document, type Types } from 'mongoose';

export interface IPollOption {
  text: string;
  votesCount: number;
}

export interface IStudentVote {
  studentId: Types.ObjectId;
  optionIndex: number;
}

export interface ILiveClassPoll extends Document {
  _id: Types.ObjectId;
  classId: Types.ObjectId;
  question: string;
  options: IPollOption[];
  correctOptionIndex?: number;
  isActive: boolean;
  isClosed: boolean;
  totalVotes: number;
  studentVotes: IStudentVote[];
  createdAt: Date;
  updatedAt: Date;
}

const PollOptionSchema = new Schema<IPollOption>(
  {
    text: { type: String, required: true, trim: true },
    votesCount: { type: Number, default: 0 },
  },
  { _id: false }
);

const StudentVoteSchema = new Schema<IStudentVote>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    optionIndex: { type: Number, required: true },
  },
  { _id: false }
);

const LiveClassPollSchema = new Schema<ILiveClassPoll>(
  {
    classId: {
      type: Schema.Types.ObjectId,
      ref: 'LiveClass',
      required: true,
      index: true,
    },
    question: {
      type: String,
      required: true,
      trim: true,
    },
    options: {
      type: [PollOptionSchema],
      required: true,
    },
    correctOptionIndex: {
      type: Number,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isClosed: {
      type: Boolean,
      default: false,
    },
    totalVotes: {
      type: Number,
      default: 0,
    },
    studentVotes: {
      type: [StudentVoteSchema],
      default: [],
    },
  },
  { timestamps: true }
);

LiveClassPollSchema.index({ classId: 1, isActive: 1 });
export const LiveClassPoll = mongoose.model<ILiveClassPoll>('LiveClassPoll', LiveClassPollSchema);

// ============================================================================
// Raise Hand Model
// ============================================================================
export type HandStatus = 'raised' | 'speaking' | 'lowered';

export interface ILiveClassHand extends Document {
  _id: Types.ObjectId;
  classId: Types.ObjectId;
  studentId: Types.ObjectId;
  studentName: string;
  studentRollNo: string;
  status: HandStatus;
  raisedAt: Date;
  updatedAt: Date;
}

const LiveClassHandSchema = new Schema<ILiveClassHand>(
  {
    classId: {
      type: Schema.Types.ObjectId,
      ref: 'LiveClass',
      required: true,
      index: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    studentName: {
      type: String,
      required: true,
      trim: true,
    },
    studentRollNo: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['raised', 'speaking', 'lowered'],
      default: 'raised',
    },
    raisedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

LiveClassHandSchema.index({ classId: 1, studentId: 1, status: 1 });
export const LiveClassHand = mongoose.model<ILiveClassHand>('LiveClassHand', LiveClassHandSchema);

export default LiveClassPoll;

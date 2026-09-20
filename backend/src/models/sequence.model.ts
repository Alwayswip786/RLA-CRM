import mongoose, { Schema, type Document } from 'mongoose';

export interface ISequenceCounter {
  _id: string; // e.g. 'student_roll_no_2026'
  seq: number;
}

const SequenceCounterSchema = new Schema<ISequenceCounter>(
  {
    _id: {
      type: String,
      required: true,
    },
    seq: {
      type: Number,
      default: 0,
    },
  },
  {
    versionKey: false,
  }
);

/**
 * Atomically increments and returns the next sequential student roll number.
 * Format: RLA20260001
 */
export const getNextRollNumber = async (year: number = new Date().getFullYear()): Promise<string> => {
  const sequenceId = `student_roll_no_${year}`;
  const counter = await SequenceCounter.findOneAndUpdate(
    { _id: sequenceId },
    { $inc: { seq: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  const padded = String(counter.seq).padStart(4, '0');
  return `RLA${year}${padded}`;
};

const SequenceCounter = mongoose.model<ISequenceCounter>('SequenceCounter', SequenceCounterSchema);
export default SequenceCounter;

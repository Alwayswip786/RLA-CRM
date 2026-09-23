import mongoose, { Schema, type Document, type Types } from 'mongoose';

export type FeeStatus = 'Paid in Full' | 'Installment Due' | 'Overdue';

export interface IFeeInstallmentItem {
  installmentNo: string;
  amount: number;
  dueDate: Date;
  paidDate?: Date;
  status: 'Paid' | 'Upcoming' | 'Overdue';
  receiptNo?: string;
  paymentMode?: string;
}

export interface IStudentFee extends Document {
  _id: Types.ObjectId;
  student: Types.ObjectId;
  course: Types.ObjectId;
  totalFee: number;
  paidAmount: number;
  pendingAmount: number;
  nextDueDate?: Date;
  status: FeeStatus;
  installments: IFeeInstallmentItem[];
  lastReminderSentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const FeeInstallmentItemSchema = new Schema<IFeeInstallmentItem>(
  {
    installmentNo: { type: String, required: true, trim: true },
    amount: { type: Number, required: true },
    dueDate: { type: Date, required: true },
    paidDate: { type: Date },
    status: {
      type: String,
      enum: ['Paid', 'Upcoming', 'Overdue'],
      default: 'Upcoming',
    },
    receiptNo: { type: String, trim: true },
    paymentMode: { type: String, trim: true },
  },
  { _id: false }
);

const StudentFeeSchema = new Schema<IStudentFee>(
  {
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    totalFee: { type: Number, required: true, default: 150000 },
    paidAmount: { type: Number, default: 0 },
    pendingAmount: { type: Number, default: 0 },
    nextDueDate: { type: Date, index: true },
    status: {
      type: String,
      enum: ['Paid in Full', 'Installment Due', 'Overdue'],
      default: 'Paid in Full',
      index: true,
    },
    installments: { type: [FeeInstallmentItemSchema], default: [] },
    lastReminderSentAt: { type: Date },
  },
  { timestamps: true }
);

StudentFeeSchema.index({ status: 1, nextDueDate: 1 });
StudentFeeSchema.index({ student: 1, course: 1 }, { unique: true });

export const StudentFee = mongoose.model<IStudentFee>('StudentFee', StudentFeeSchema);
export default StudentFee;

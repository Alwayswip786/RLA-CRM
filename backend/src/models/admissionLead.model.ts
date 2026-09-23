import mongoose, { Schema, type Document, type Types } from 'mongoose';

export type LeadStage = 'new' | 'contacted' | 'demo' | 'fee_discussion' | 'enrolled' | 'lost';
export type LeadPriority = 'high' | 'medium' | 'normal';
export type LeadSource = 'Website Form' | 'Walk-in Inquiry' | 'WhatsApp Hotline' | 'Referral' | 'Instagram / Ad';

export interface IAdmissionLead extends Document {
  _id: Types.ObjectId;
  name: string;
  phone: string;
  email?: string;
  targetExam: string;
  stage: LeadStage;
  source: LeadSource;
  priority: LeadPriority;
  demoScheduledAt?: Date;
  counselorNotes?: string;
  assignedCounselor?: Types.ObjectId;
  enrolledUserId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AdmissionLeadSchema = new Schema<IAdmissionLead>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true, index: true },
    email: { type: String, lowercase: true, trim: true },
    targetExam: { type: String, required: true, trim: true, default: 'Delhi Judicial Services (DJS 2026)' },
    stage: {
      type: String,
      enum: ['new', 'contacted', 'demo', 'fee_discussion', 'enrolled', 'lost'],
      default: 'new',
      index: true,
    },
    source: {
      type: String,
      enum: ['Website Form', 'Walk-in Inquiry', 'WhatsApp Hotline', 'Referral', 'Instagram / Ad'],
      default: 'Website Form',
    },
    priority: {
      type: String,
      enum: ['high', 'medium', 'normal'],
      default: 'normal',
      index: true,
    },
    demoScheduledAt: { type: Date, index: true },
    counselorNotes: { type: String, default: '' },
    assignedCounselor: { type: Schema.Types.ObjectId, ref: 'User' },
    enrolledUserId: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

AdmissionLeadSchema.index({ stage: 1, priority: 1 });
AdmissionLeadSchema.index({ createdAt: -1 });

export const AdmissionLead = mongoose.model<IAdmissionLead>('AdmissionLead', AdmissionLeadSchema);
export default AdmissionLead;

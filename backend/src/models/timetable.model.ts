import mongoose, { Schema, type Document, type Types } from 'mongoose';

// ============================================================================
// 1. ACADEMIC SESSION
// ============================================================================
export interface IAcademicSession extends Document {
  _id: Types.ObjectId;
  name: string;
  code: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AcademicSessionSchema = new Schema<IAcademicSession>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      default: 'Academic Schedule 2025–26',
    },
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

// ============================================================================
// 2. CLASSROOM / CHAMBER ROOM
// ============================================================================
export type RoomType = 'chamber' | 'lecture_hall' | 'computer_lab' | 'virtual' | 'discussion_pod';

export interface IClassroomRoom extends Document {
  _id: Types.ObjectId;
  name: string;
  roomNumber: string;
  building: string;
  capacity: number;
  roomType: RoomType;
  facilities: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ClassroomRoomSchema = new Schema<IClassroomRoom>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true,
    },
    roomNumber: {
      type: String,
      trim: true,
    },
    building: {
      type: String,
      default: 'Main Judicial Chamber Wing',
    },
    capacity: {
      type: Number,
      default: 60,
    },
    roomType: {
      type: String,
      enum: ['chamber', 'lecture_hall', 'computer_lab', 'virtual', 'discussion_pod'],
      default: 'chamber',
    },
    facilities: {
      type: [String],
      default: ['Smart Display', 'Air Conditioned', 'Microphone System'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// ============================================================================
// 3. BATCH & SHIFTS
// ============================================================================
export interface IBatchShift {
  shiftId: string;
  name: string;
  code: string;
  startTime: string;
  endTime: string;
  timeFormatted: string;
  capacity?: number;
  isActive: boolean;
}

export interface IBatch extends Document {
  _id: Types.ObjectId;
  name: string;
  code: string;
  academicSession?: Types.ObjectId;
  sessionName: string;
  subtitle: string;
  shifts: IBatchShift[];
  defaultShiftId: string;
  allowShiftSwitch: boolean;
  targetExam: string;
  status: 'active' | 'completed' | 'upcoming';
  enrolledCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const BatchShiftSchema = new Schema<IBatchShift>(
  {
    shiftId: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      trim: true,
    },
    startTime: {
      type: String,
      required: true,
      trim: true,
    },
    endTime: {
      type: String,
      required: true,
      trim: true,
    },
    timeFormatted: {
      type: String,
      required: true,
      trim: true,
    },
    capacity: {
      type: Number,
      default: 120,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false }
);

const BatchSchema = new Schema<IBatch>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    academicSession: {
      type: Schema.Types.ObjectId,
      ref: 'AcademicSession',
    },
    sessionName: {
      type: String,
      default: 'Academic Schedule 2025–26',
    },
    subtitle: {
      type: String,
      default: 'Foundation Judicial Services Batch (Morning 8:30 AM & Evening 5:00 PM Shifts)',
    },
    shifts: {
      type: [BatchShiftSchema],
      default: [
        {
          shiftId: 'shift-morning',
          name: 'Morning Shift (8:30 AM)',
          code: 'MORNING',
          startTime: '08:30',
          endTime: '13:30',
          timeFormatted: 'Morning Shift (8:30 AM)',
          capacity: 120,
          isActive: true,
        },
        {
          shiftId: 'shift-evening',
          name: 'Evening Shift (5:00 PM)',
          code: 'EVENING',
          startTime: '17:00',
          endTime: '20:30',
          timeFormatted: 'Evening Shift (5:00 PM)',
          capacity: 100,
          isActive: true,
        },
      ],
    },
    defaultShiftId: {
      type: String,
      default: 'shift-morning',
    },
    allowShiftSwitch: {
      type: Boolean,
      default: true,
    },
    targetExam: {
      type: String,
      default: 'Delhi Judicial Service (DJS) & PCS-J',
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'upcoming'],
      default: 'active',
      index: true,
    },
    enrolledCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// ============================================================================
// 4. RECURRING SCHEDULE SLOT (Master Weekly Template)
// ============================================================================
export type DayOfWeek =
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday'
  | 'Sunday';

export type SessionType =
  | 'Major Act'
  | 'Minor Act'
  | 'Test Series'
  | 'Doubt Session'
  | 'Special Lecture';

export interface IRecurringScheduleSlot extends Document {
  _id: Types.ObjectId;
  batch: Types.ObjectId;
  shiftId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  timeFormatted: string;
  sessionType: SessionType;
  subject: string;
  topic: string;
  faculty?: Types.ObjectId;
  facultyName: string;
  room?: Types.ObjectId;
  roomName: string;
  liveStreamUrl?: string;
  notesUrl?: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RecurringScheduleSlotSchema = new Schema<IRecurringScheduleSlot>(
  {
    batch: {
      type: Schema.Types.ObjectId,
      ref: 'Batch',
      required: true,
      index: true,
    },
    shiftId: {
      type: String,
      required: true,
      index: true,
    },
    dayOfWeek: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      required: true,
      index: true,
    },
    startTime: {
      type: String,
      required: true,
      trim: true,
    },
    endTime: {
      type: String,
      required: true,
      trim: true,
    },
    timeFormatted: {
      type: String,
      required: true,
      trim: true,
    },
    sessionType: {
      type: String,
      enum: ['Major Act', 'Minor Act', 'Test Series', 'Doubt Session', 'Special Lecture'],
      default: 'Major Act',
      index: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    topic: {
      type: String,
      required: true,
      trim: true,
    },
    faculty: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    facultyName: {
      type: String,
      required: true,
      trim: true,
      default: 'Adv. Rajinder Sir',
    },
    room: {
      type: Schema.Types.ObjectId,
      ref: 'ClassroomRoom',
      index: true,
    },
    roomName: {
      type: String,
      required: true,
      trim: true,
      default: 'Chamber 101',
    },
    liveStreamUrl: {
      type: String,
      trim: true,
    },
    notesUrl: {
      type: String,
      trim: true,
    },
    order: {
      type: Number,
      default: 1,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Compound indexes for fast lookup and collision prevention
RecurringScheduleSlotSchema.index({ batch: 1, shiftId: 1, dayOfWeek: 1, startTime: 1 });
RecurringScheduleSlotSchema.index({ faculty: 1, dayOfWeek: 1, startTime: 1 });
RecurringScheduleSlotSchema.index({ room: 1, dayOfWeek: 1, startTime: 1 });

// ============================================================================
// 5. SCHEDULE OVERRIDE (Date-Specific Exceptions)
// ============================================================================
export type OverrideType =
  | 'cancelled'
  | 'rescheduled'
  | 'substitute_faculty'
  | 'room_change'
  | 'special_session'
  | 'holiday';

export interface IScheduleOverride extends Document {
  _id: Types.ObjectId;
  dateIST: string;
  batch: Types.ObjectId;
  shiftId?: string;
  slot?: Types.ObjectId;
  overrideType: OverrideType;
  originalStartTime?: string;
  originalEndTime?: string;
  newStartTime?: string;
  newEndTime?: string;
  newTimeFormatted?: string;
  newFaculty?: Types.ObjectId;
  newFacultyName?: string;
  newRoom?: Types.ObjectId;
  newRoomName?: string;
  newSubject?: string;
  newTopic?: string;
  reason?: string;
  announcementTitle?: string;
  notifyStudents: boolean;
  noticeGeneratedId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ScheduleOverrideSchema = new Schema<IScheduleOverride>(
  {
    dateIST: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    batch: {
      type: Schema.Types.ObjectId,
      ref: 'Batch',
      required: true,
      index: true,
    },
    shiftId: {
      type: String,
      trim: true,
    },
    slot: {
      type: Schema.Types.ObjectId,
      ref: 'RecurringScheduleSlot',
      index: true,
    },
    overrideType: {
      type: String,
      enum: ['cancelled', 'rescheduled', 'substitute_faculty', 'room_change', 'special_session', 'holiday'],
      required: true,
      index: true,
    },
    originalStartTime: {
      type: String,
      trim: true,
    },
    originalEndTime: {
      type: String,
      trim: true,
    },
    newStartTime: {
      type: String,
      trim: true,
    },
    newEndTime: {
      type: String,
      trim: true,
    },
    newTimeFormatted: {
      type: String,
      trim: true,
    },
    newFaculty: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    newFacultyName: {
      type: String,
      trim: true,
    },
    newRoom: {
      type: Schema.Types.ObjectId,
      ref: 'ClassroomRoom',
    },
    newRoomName: {
      type: String,
      trim: true,
    },
    newSubject: {
      type: String,
      trim: true,
    },
    newTopic: {
      type: String,
      trim: true,
    },
    reason: {
      type: String,
      trim: true,
      default: '',
    },
    announcementTitle: {
      type: String,
      trim: true,
    },
    notifyStudents: {
      type: Boolean,
      default: false,
    },
    noticeGeneratedId: {
      type: Schema.Types.ObjectId,
      ref: 'Notice',
    },
  },
  { timestamps: true }
);

ScheduleOverrideSchema.index({ batch: 1, dateIST: 1, slot: 1 });

// ============================================================================
// 6. CLASS ALERT SUBSCRIPTION
// ============================================================================
export interface IClassAlertSubscription extends Document {
  _id: Types.ObjectId;
  student: Types.ObjectId;
  batch: Types.ObjectId;
  slot: Types.ObjectId;
  dateIST?: string;
  reminderMinutesBefore: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ClassAlertSubscriptionSchema = new Schema<IClassAlertSubscription>(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    batch: {
      type: Schema.Types.ObjectId,
      ref: 'Batch',
      required: true,
    },
    slot: {
      type: Schema.Types.ObjectId,
      ref: 'RecurringScheduleSlot',
      required: true,
      index: true,
    },
    dateIST: {
      type: String,
      trim: true,
    },
    reminderMinutesBefore: {
      type: Number,
      default: 15,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

ClassAlertSubscriptionSchema.index({ student: 1, slot: 1, isActive: 1 });

// ============================================================================
// MODELS EXPORT
// ============================================================================
export const AcademicSession = mongoose.model<IAcademicSession>('AcademicSession', AcademicSessionSchema);
export const ClassroomRoom = mongoose.model<IClassroomRoom>('ClassroomRoom', ClassroomRoomSchema);
export const Batch = mongoose.model<IBatch>('Batch', BatchSchema);
export const RecurringScheduleSlot = mongoose.model<IRecurringScheduleSlot>(
  'RecurringScheduleSlot',
  RecurringScheduleSlotSchema
);
export const ScheduleOverride = mongoose.model<IScheduleOverride>(
  'ScheduleOverride',
  ScheduleOverrideSchema
);
export const ClassAlertSubscription = mongoose.model<IClassAlertSubscription>(
  'ClassAlertSubscription',
  ClassAlertSubscriptionSchema
);

export type DayOfWeek =
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday';

export type SessionType =
  | 'Major Act'
  | 'Minor Act'
  | 'Test Series'
  | 'Doubt Session'
  | 'Special Lecture';

export interface AdminShift {
  shiftId: string;
  name: string;
  code?: string;
  startTime: string;
  endTime: string;
  timeFormatted: string;
  capacity?: number;
  isActive: boolean;
}

export interface AdminBatch {
  _id: string;
  name: string;
  code: string;
  sessionName: string;
  subtitle: string;
  shifts: AdminShift[];
  defaultShiftId: string;
  allowShiftSwitch: boolean;
  targetExam: string;
  status: 'active' | 'completed' | 'upcoming';
  enrolledCount: number;
}

export interface AdminRoom {
  _id: string;
  name: string;
  roomNumber?: string;
  building: string;
  capacity: number;
  roomType: string;
  facilities: string[];
  isActive: boolean;
}

export interface AdminFaculty {
  _id: string;
  name: string;
  salutation?: string;
  email?: string;
}

export interface AdminSlot {
  _id: string;
  batch: string | AdminBatch;
  shiftId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  timeFormatted: string;
  sessionType: SessionType;
  subject: string;
  topic: string;
  faculty?: string;
  facultyName: string;
  room?: string;
  roomName: string;
  order: number;
  isActive: boolean;
}

export interface AdminWeeklyGridResponse {
  success: boolean;
  batch: AdminBatch;
  shiftId: string;
  rooms: AdminRoom[];
  facultyList: AdminFaculty[];
  stats: {
    totalWeeklySlots: number;
    activeChambers: number;
    facultyCount: number;
    overridesCount: number;
  };
  weeklySlots: Record<string, AdminSlot[]>;
}

export interface ConflictCheckItem {
  type: 'faculty' | 'room' | 'batch' | 'holiday';
  title: string;
  message: string;
  conflictingEntity?: string;
}

export interface ConflictCheckResult {
  hasConflict: boolean;
  canProceedWithWarning: boolean;
  conflicts: ConflictCheckItem[];
}

export interface CreateSlotPayload {
  batchId: string;
  shiftId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  timeFormatted?: string;
  sessionType: SessionType;
  subject: string;
  topic: string;
  facultyId?: string;
  facultyName: string;
  roomId?: string;
  roomName: string;
  order?: number;
  overrideConflict?: boolean;
}

export interface CreateOverridePayload {
  dateIST: string;
  batchId: string;
  shiftId?: string;
  slotId?: string;
  overrideType: 'rescheduled' | 'cancelled' | 'substitute_faculty' | 'room_change' | 'special_session' | 'holiday';
  newStartTime?: string;
  newEndTime?: string;
  newTimeFormatted?: string;
  newFacultyName?: string;
  newRoomName?: string;
  newTopic?: string;
  reason: string;
  notifyStudents: boolean;
}

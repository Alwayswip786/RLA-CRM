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

export interface ResolvedSlot {
  slotId: string;
  time: string;
  startTime: string;
  endTime: string;
  subject: string;
  topic: string;
  faculty: string;
  room: string;
  type: SessionType;
  isAlertSet: boolean;
  alertId?: string;
  status: 'ongoing' | 'upcoming' | 'completed';
  isCancelled?: boolean;
  cancellationReason?: string;
  isRescheduled?: boolean;
  originalTime?: string;
  rescheduleReason?: string;
  liveStreamUrl?: string;
  notesUrl?: string;
  order: number;
}

export interface DaySchedule {
  dayOfWeek: DayOfWeek;
  dateIST: string;
  isToday: boolean;
  isHoliday: boolean;
  holidayReason?: string;
  slots: ResolvedSlot[];
}

export interface BatchShift {
  shiftId: string;
  name: string;
  code?: string;
  startTime: string;
  endTime: string;
  timeFormatted: string;
  capacity?: number;
  isActive: boolean;
}

export interface TimetableHeader {
  sessionName: string;
  batchId: string;
  batchName: string;
  subtitle: string;
  shifts: BatchShift[];
  activeShiftId: string;
  allowShiftSwitch: boolean;
}

export interface TimetableApiResponse {
  success: boolean;
  header: TimetableHeader;
  schedule: DaySchedule;
}

export interface UpcomingClassResponse {
  success: boolean;
  todayIST: string;
  dayOfWeek: string;
  upcomingClass: ResolvedSlot | null;
  totalRemainingToday: number;
}

import {
  RecurringScheduleSlot,
  ScheduleOverride,
  ClassAlertSubscription,
  type DayOfWeek,
  type SessionType,
} from '../models/timetable.model.js';
import mongoose from 'mongoose';

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

export interface DayScheduleResult {
  dayOfWeek: DayOfWeek;
  dateIST: string;
  isToday: boolean;
  isHoliday: boolean;
  holidayReason?: string;
  slots: ResolvedSlot[];
}

/**
 * Returns current date in Indian Standard Time (YYYY-MM-DD)
 */
export const getTodayDateIST = (): string => {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
};

/**
 * Returns current time in Indian Standard Time (HH:mm)
 */
export const getCurrentTimeIST = (): string => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date());

  const hour = parts.find((p) => p.type === 'hour')?.value || '00';
  const minute = parts.find((p) => p.type === 'minute')?.value || '00';
  return `${hour}:${minute}`;
};

/**
 * Resolves a full day's schedule combining recurring weekly templates with date overrides
 */
export const resolveDaySchedule = async (params: {
  batchId: string | mongoose.Types.ObjectId;
  shiftId: string;
  dayOfWeek: DayOfWeek;
  dateIST?: string;
  studentId?: string | mongoose.Types.ObjectId;
}): Promise<DayScheduleResult> => {
  const todayIST = getTodayDateIST();
  const dateIST = params.dateIST || todayIST;
  const isToday = dateIST === todayIST;
  const currentTime = getCurrentTimeIST();

  // 1. Check for Holiday Override
  const holidayOverride = await ScheduleOverride.findOne({
    batch: params.batchId,
    dateIST,
    overrideType: 'holiday',
  });

  if (holidayOverride) {
    return {
      dayOfWeek: params.dayOfWeek,
      dateIST,
      isToday,
      isHoliday: true,
      holidayReason: holidayOverride.reason || 'Academy Holiday / Court Recess',
      slots: [],
    };
  }

  // 2. Fetch Recurring Slots
  const recurringSlots = await RecurringScheduleSlot.find({
    batch: params.batchId,
    shiftId: params.shiftId,
    dayOfWeek: params.dayOfWeek,
    isActive: true,
  })
    .sort({ order: 1, startTime: 1 })
    .lean();

  // 3. Fetch Date-Specific Overrides
  const overrides = await ScheduleOverride.find({
    batch: params.batchId,
    dateIST,
  }).lean();

  const overrideBySlotId = new Map<string, any>();
  const specialSessions: any[] = [];

  for (const ov of overrides) {
    if (ov.slot) {
      overrideBySlotId.set(String(ov.slot), ov);
    } else if (ov.overrideType === 'special_session') {
      if (!ov.shiftId || ov.shiftId === params.shiftId) {
        specialSessions.push(ov);
      }
    }
  }

  // 4. Fetch Active Alert Subscriptions for Student
  const alertSlotIds = new Set<string>();
  const alertIdBySlotId = new Map<string, string>();

  if (params.studentId) {
    const alerts = await ClassAlertSubscription.find({
      student: params.studentId,
      batch: params.batchId,
      isActive: true,
    }).lean();

    for (const al of alerts) {
      alertSlotIds.add(String(al.slot));
      alertIdBySlotId.set(String(al.slot), String(al._id));
    }
  }

  // 5. Merge Recurring Slots with Overrides
  const resolvedSlots: ResolvedSlot[] = [];

  for (const slot of recurringSlots) {
    const slotId = String(slot._id);
    const ov = overrideBySlotId.get(slotId);

    let time = slot.timeFormatted;
    let startTime = slot.startTime;
    let endTime = slot.endTime;
    let subject = slot.subject;
    let topic = slot.topic;
    let faculty = slot.facultyName;
    let room = slot.roomName;
    let isCancelled = false;
    let cancellationReason: string | undefined = undefined;
    let isRescheduled = false;
    let originalTime: string | undefined = undefined;
    let rescheduleReason: string | undefined = undefined;

    if (ov) {
      if (ov.overrideType === 'cancelled') {
        isCancelled = true;
        cancellationReason = ov.reason || 'Class cancelled by faculty.';
      } else if (ov.overrideType === 'rescheduled') {
        isRescheduled = true;
        originalTime = slot.timeFormatted;
        time = ov.newTimeFormatted || ov.newStartTime ? `${ov.newStartTime} - ${ov.newEndTime}` : slot.timeFormatted;
        startTime = ov.newStartTime || slot.startTime;
        endTime = ov.newEndTime || slot.endTime;
        if (ov.newFacultyName) faculty = ov.newFacultyName;
        if (ov.newRoomName) room = ov.newRoomName;
        if (ov.newSubject) subject = ov.newSubject;
        if (ov.newTopic) topic = ov.newTopic;
        rescheduleReason = ov.reason;
      } else if (ov.overrideType === 'substitute_faculty') {
        if (ov.newFacultyName) faculty = ov.newFacultyName;
      } else if (ov.overrideType === 'room_change') {
        if (ov.newRoomName) room = ov.newRoomName;
      }
    }

    // Determine lecture status
    let status: 'ongoing' | 'upcoming' | 'completed' = 'upcoming';
    if (isToday) {
      if (currentTime >= startTime && currentTime <= endTime) {
        status = 'ongoing';
      } else if (currentTime > endTime) {
        status = 'completed';
      } else {
        status = 'upcoming';
      }
    } else if (dateIST < todayIST) {
      status = 'completed';
    } else {
      status = 'upcoming';
    }

    resolvedSlots.push({
      slotId,
      time,
      startTime,
      endTime,
      subject,
      topic,
      faculty,
      room,
      type: slot.sessionType,
      isAlertSet: alertSlotIds.has(slotId),
      alertId: alertIdBySlotId.get(slotId),
      status,
      isCancelled,
      cancellationReason,
      isRescheduled,
      originalTime,
      rescheduleReason,
      liveStreamUrl: slot.liveStreamUrl,
      notesUrl: slot.notesUrl,
      order: slot.order,
    });
  }

  // 6. Append Special Sessions
  for (const sp of specialSessions) {
    const slotId = `special-${sp._id}`;
    let status: 'ongoing' | 'upcoming' | 'completed' = 'upcoming';
    const startTime = sp.newStartTime || '14:00';
    const endTime = sp.newEndTime || '16:00';

    if (isToday) {
      if (currentTime >= startTime && currentTime <= endTime) status = 'ongoing';
      else if (currentTime > endTime) status = 'completed';
      else status = 'upcoming';
    } else if (dateIST < todayIST) {
      status = 'completed';
    }

    resolvedSlots.push({
      slotId,
      time: sp.newTimeFormatted || `${startTime} - ${endTime}`,
      startTime,
      endTime,
      subject: sp.newSubject || 'Special Masterclass',
      topic: sp.newTopic || sp.reason || 'Special Judicial Lecture',
      faculty: sp.newFacultyName || 'Guest Faculty',
      room: sp.newRoomName || 'Main Examination Hall',
      type: 'Special Lecture',
      isAlertSet: false,
      status,
      isRescheduled: false,
      order: 99,
    });
  }

  // 7. Sort by startTime
  resolvedSlots.sort((a, b) => a.startTime.localeCompare(b.startTime));

  return {
    dayOfWeek: params.dayOfWeek,
    dateIST,
    isToday,
    isHoliday: false,
    slots: resolvedSlots,
  };
};

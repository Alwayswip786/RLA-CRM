import {
  RecurringScheduleSlot,
  ScheduleOverride,
  type DayOfWeek,
} from '../models/timetable.model.js';
import mongoose from 'mongoose';

export interface ConflictCheckItem {
  type: 'faculty' | 'room' | 'batch' | 'holiday';
  title: string;
  message: string;
  conflictingEntity?: string;
  existingSlot?: {
    slotId: string;
    subject: string;
    topic: string;
    timeFormatted: string;
    dayOfWeek: string;
    facultyName?: string;
    roomName?: string;
    batchName?: string;
  };
}

export interface ConflictCheckResult {
  hasConflict: boolean;
  canProceedWithWarning: boolean;
  conflicts: ConflictCheckItem[];
}

/**
 * Returns true if two time intervals [startA, endA) and [startB, endB) overlap.
 * Expected formats: "HH:mm" (e.g. "08:30", "10:30")
 */
export const timesOverlap = (
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean => {
  return startA < endB && endA > startB;
};

/**
 * Validates whether adding or modifying a recurring weekly slot creates conflicts
 */
export const checkSlotConflicts = async (params: {
  batchId: string | mongoose.Types.ObjectId;
  shiftId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  facultyId?: string | mongoose.Types.ObjectId;
  facultyName?: string;
  roomId?: string | mongoose.Types.ObjectId;
  roomName?: string;
  excludeSlotId?: string | mongoose.Types.ObjectId;
}): Promise<ConflictCheckResult> => {
  const conflicts: ConflictCheckItem[] = [];

  // Query all active recurring slots for this day of week
  const filter: Record<string, any> = {
    dayOfWeek: params.dayOfWeek,
    isActive: true,
  };

  if (params.excludeSlotId) {
    filter._id = { $ne: new mongoose.Types.ObjectId(String(params.excludeSlotId)) };
  }

  const existingSlots = await RecurringScheduleSlot.find(filter)
    .populate('batch', 'name code')
    .lean();

  for (const slot of existingSlots) {
    if (!timesOverlap(params.startTime, params.endTime, slot.startTime, slot.endTime)) {
      continue;
    }

    const batchObj = slot.batch as any;
    const batchName = batchObj?.name || 'Another Batch';

    // 1. Faculty Double-Booking Check
    if (
      params.facultyId &&
      slot.faculty &&
      String(slot.faculty) === String(params.facultyId)
    ) {
      conflicts.push({
        type: 'faculty',
        title: 'Faculty Double-Booking Clash',
        message: `${params.facultyName || 'Faculty'} is already scheduled to teach "${slot.subject}" for ${batchName} on ${params.dayOfWeek} (${slot.timeFormatted}).`,
        conflictingEntity: params.facultyName || 'Faculty',
        existingSlot: {
          slotId: String(slot._id),
          subject: slot.subject,
          topic: slot.topic,
          timeFormatted: slot.timeFormatted,
          dayOfWeek: slot.dayOfWeek,
          facultyName: slot.facultyName,
          roomName: slot.roomName,
          batchName,
        },
      });
    }

    // 2. Room Collision Check
    if (params.roomId && slot.room && String(slot.room) === String(params.roomId)) {
      conflicts.push({
        type: 'room',
        title: 'Classroom / Chamber Allocation Collision',
        message: `${params.roomName || 'Room'} is already reserved for "${slot.subject}" (${batchName}) on ${params.dayOfWeek} (${slot.timeFormatted}).`,
        conflictingEntity: params.roomName || 'Room',
        existingSlot: {
          slotId: String(slot._id),
          subject: slot.subject,
          topic: slot.topic,
          timeFormatted: slot.timeFormatted,
          dayOfWeek: slot.dayOfWeek,
          facultyName: slot.facultyName,
          roomName: slot.roomName,
          batchName,
        },
      });
    }

    // 3. Same Batch in Same Shift Overlap Check
    if (
      String(slot.batch?._id || slot.batch) === String(params.batchId) &&
      slot.shiftId === params.shiftId
    ) {
      conflicts.push({
        type: 'batch',
        title: 'Concurrent Lecture Overlap in Same Batch',
        message: `This batch already has a concurrent lecture "${slot.subject}" scheduled in ${slot.shiftId} on ${params.dayOfWeek} (${slot.timeFormatted}).`,
        conflictingEntity: batchName,
        existingSlot: {
          slotId: String(slot._id),
          subject: slot.subject,
          topic: slot.topic,
          timeFormatted: slot.timeFormatted,
          dayOfWeek: slot.dayOfWeek,
          facultyName: slot.facultyName,
          roomName: slot.roomName,
          batchName,
        },
      });
    }
  }

  return {
    hasConflict: conflicts.length > 0,
    canProceedWithWarning: conflicts.every((c) => c.type === 'faculty' || c.type === 'batch'),
    conflicts,
  };
};

/**
 * Validates date-specific overrides (rescheduled/extra sessions) against holiday closures
 */
export const checkDateOverrideConflicts = async (params: {
  batchId: string | mongoose.Types.ObjectId;
  dateIST: string;
  startTime: string;
  endTime: string;
  facultyId?: string | mongoose.Types.ObjectId;
  roomId?: string | mongoose.Types.ObjectId;
}): Promise<ConflictCheckResult> => {
  const conflicts: ConflictCheckItem[] = [];

  // 1. Holiday Check
  const holidayOverride = await ScheduleOverride.findOne({
    batch: params.batchId,
    dateIST: params.dateIST,
    overrideType: 'holiday',
  });

  if (holidayOverride) {
    conflicts.push({
      type: 'holiday',
      title: 'Academy / Judicial Vacation Holiday',
      message: `Date ${params.dateIST} is marked as a Holiday: "${holidayOverride.reason || 'Academy Closed'}".`,
    });
  }

  return {
    hasConflict: conflicts.length > 0,
    canProceedWithWarning: true,
    conflicts,
  };
};

import { type Request, type Response } from 'express';
import mongoose from 'mongoose';
import {
  AcademicSession,
  ClassroomRoom,
  Batch,
  RecurringScheduleSlot,
  ScheduleOverride,
  ClassAlertSubscription,
  type DayOfWeek,
} from '../models/timetable.model.js';
import User from '../models/user.model.js';
import Notice from '../models/notice.model.js';
import {
  resolveDaySchedule,
  getTodayDateIST,
  getCurrentTimeIST,
} from '../utils/timetableResolver.js';
import {
  checkSlotConflicts,
  checkDateOverrideConflicts,
} from '../utils/timetableConflictEngine.js';

const DAYS_ORDER: DayOfWeek[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const getDayOfWeekFromDate = (dateIST: string): DayOfWeek => {
  const date = new Date(`${dateIST}T12:00:00+05:30`);
  const days: DayOfWeek[] = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];
  return days[date.getDay()] || 'Monday';
};

// ============================================================================
// STUDENT CONTROLLERS
// ============================================================================

/**
 * Get student's assigned batch and resolved day-wise schedule
 * GET /api/timetable/my-schedule
 */
export const getMySchedule = async (req: Request, res: Response): Promise<void> => {
  try {
    const student = req.user;
    const requestedDay = req.query.dayOfWeek as DayOfWeek | undefined;
    const requestedShift = req.query.shiftId as string | undefined;
    const requestedDate = req.query.dateIST as string | undefined;

    const todayIST = getTodayDateIST();
    const targetDateIST = requestedDate || todayIST;
    const dayOfWeek = requestedDay || getDayOfWeekFromDate(targetDateIST);

    // 1. Resolve Student's Batch
    let batch = null;
    if (student?.assignedBatch) {
      batch = await Batch.findById(student.assignedBatch).lean();
    }
    if (!batch) {
      // Fallback to active Foundation batch or first active batch
      batch = await Batch.findOne({ status: 'active' }).sort({ createdAt: -1 }).lean();
    }
    if (!batch) {
      res.status(404).json({
        success: false,
        message: 'No active academic batch found.',
      });
      return;
    }

    // 2. Resolve Active Shift
    const activeShiftId =
      requestedShift ||
      student?.preferredShiftId ||
      batch.defaultShiftId ||
      batch.shifts[0]?.shiftId ||
      'shift-morning';

    // 3. Resolve Day Schedule
    const schedule = await resolveDaySchedule({
      batchId: batch._id,
      shiftId: activeShiftId,
      dayOfWeek,
      dateIST: targetDateIST,
      studentId: student?._id,
    });

    res.status(200).json({
      success: true,
      header: {
        sessionName: batch.sessionName || 'Academic Schedule 2025–26',
        batchId: String(batch._id),
        batchName: batch.name,
        subtitle: batch.subtitle,
        shifts: batch.shifts.filter((s) => s.isActive),
        activeShiftId,
        allowShiftSwitch: batch.allowShiftSwitch,
      },
      schedule,
    });
  } catch (error: any) {
    console.error('Error fetching student schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve batch timetable.',
      error: error?.message,
    });
  }
};

/**
 * Switch student's preferred/active shift
 * POST /api/timetable/switch-shift
 */
export const switchActiveShift = async (req: Request, res: Response): Promise<void> => {
  try {
    const { shiftId } = req.body;
    if (!shiftId) {
      res.status(400).json({ success: false, message: 'shiftId is required.' });
      return;
    }

    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, { preferredShiftId: shiftId });
    }

    res.status(200).json({
      success: true,
      message: `Active shift switched successfully to ${shiftId}`,
      activeShiftId: shiftId,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to switch shift.', error: error?.message });
  }
};

/**
 * Toggle alert subscription for a class slot
 * POST /api/timetable/alerts/toggle
 */
export const toggleClassAlert = async (req: Request, res: Response): Promise<void> => {
  try {
    const student = req.user;
    if (!student) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    const { slotId, batchId } = req.body;
    if (!slotId) {
      res.status(400).json({ success: false, message: 'slotId is required.' });
      return;
    }

    const slot = await RecurringScheduleSlot.findById(slotId);
    if (!slot) {
      res.status(404).json({ success: false, message: 'Class slot not found.' });
      return;
    }

    const resolvedBatchId = batchId || slot.batch;

    const existing = await ClassAlertSubscription.findOne({
      student: student._id,
      slot: slot._id,
    });

    if (existing) {
      if (existing.isActive) {
        existing.isActive = false;
        await existing.save();
        res.status(200).json({
          success: true,
          isAlertSet: false,
          message: `Class alert removed for ${slot.subject}`,
        });
      } else {
        existing.isActive = true;
        await existing.save();
        res.status(200).json({
          success: true,
          isAlertSet: true,
          message: `Lecture reminder set for ${slot.subject} (${slot.dayOfWeek})`,
        });
      }
    } else {
      await ClassAlertSubscription.create({
        student: student._id,
        batch: resolvedBatchId,
        slot: slot._id,
        isActive: true,
        reminderMinutesBefore: 15,
      });

      res.status(201).json({
        success: true,
        isAlertSet: true,
        message: `Lecture reminder set for ${slot.subject} (${slot.dayOfWeek})`,
      });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to toggle alert.', error: error?.message });
  }
};

/**
 * Get next upcoming class today
 * GET /api/timetable/upcoming
 */
export const getUpcomingClass = async (req: Request, res: Response): Promise<void> => {
  try {
    const student = req.user;
    const todayIST = getTodayDateIST();
    const dayOfWeek = getDayOfWeekFromDate(todayIST);

    let batch = null;
    if (student?.assignedBatch) {
      batch = await Batch.findById(student.assignedBatch).lean();
    }
    if (!batch) {
      batch = await Batch.findOne({ status: 'active' }).sort({ createdAt: -1 }).lean();
    }
    if (!batch) {
      res.status(200).json({ success: true, upcomingClass: null });
      return;
    }

    const activeShiftId = student?.preferredShiftId || batch.defaultShiftId || 'shift-morning';

    const daySchedule = await resolveDaySchedule({
      batchId: batch._id,
      shiftId: activeShiftId,
      dayOfWeek,
      dateIST: todayIST,
      studentId: student?._id,
    });

    const upcomingSlots = daySchedule.slots.filter(
      (s) => !s.isCancelled && (s.status === 'ongoing' || s.status === 'upcoming')
    );

    const nextClass = upcomingSlots.length > 0 ? upcomingSlots[0] : null;

    res.status(200).json({
      success: true,
      todayIST,
      dayOfWeek,
      upcomingClass: nextClass,
      totalRemainingToday: upcomingSlots.length,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to get upcoming class.', error: error?.message });
  }
};

/**
 * Export weekly schedule as RFC-5545 iCalendar (.ics)
 * GET /api/timetable/export/ical
 */
export const exportIcalSchedule = async (req: Request, res: Response): Promise<void> => {
  try {
    const student = req.user;
    let batch = null;
    if (student?.assignedBatch) {
      batch = await Batch.findById(student.assignedBatch).lean();
    }
    if (!batch) {
      batch = await Batch.findOne({ status: 'active' }).lean();
    }

    const shiftId = (req.query.shiftId as string) || student?.preferredShiftId || 'shift-morning';

    const slots = await RecurringScheduleSlot.find({
      batch: batch?._id,
      shiftId,
      isActive: true,
    }).lean();

    let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Rajinder Law Academy//Timetable 1.0//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      `X-WR-CALNAME:RLA ${batch?.name || 'Judiciary'} Schedule`,
      'X-WR-TIMEZONE:Asia/Kolkata',
    ];

    for (const slot of slots) {
      icsContent.push('BEGIN:VEVENT');
      icsContent.push(`UID:rla-slot-${slot._id}@rajinderlawacademy.com`);
      icsContent.push(`SUMMARY:${slot.subject} (${slot.sessionType})`);
      icsContent.push(`DESCRIPTION:${slot.topic} - Faculty: ${slot.facultyName}`);
      icsContent.push(`LOCATION:${slot.roomName}`);
      icsContent.push(`STATUS:CONFIRMED`);
      icsContent.push('END:VEVENT');
    }

    icsContent.push('END:VCALENDAR');

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="rla-academic-schedule-${shiftId}.ics"`
    );
    res.send(icsContent.join('\r\n'));
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to export calendar.', error: error?.message });
  }
};

// ============================================================================
// ADMIN CONTROLLERS
// ============================================================================

/**
 * Fetch all batches for administration
 * GET /api/timetable/admin/batches
 */
export const getAllBatchesAdmin = async (_req: Request, res: Response): Promise<void> => {
  try {
    const batches = await Batch.find().sort({ createdAt: -1 }).lean();
    const stats = {
      totalBatches: batches.length,
      activeBatches: batches.filter((b) => b.status === 'active').length,
    };
    res.status(200).json({ success: true, stats, batches });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch batches.', error: error?.message });
  }
};

/**
 * Create new batch with shifts
 * POST /api/timetable/admin/batches
 */
export const createBatchAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const batch = await Batch.create(req.body);
    res.status(201).json({
      success: true,
      message: `Batch "${batch.name}" created successfully.`,
      batch,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: 'Failed to create batch.', error: error?.message });
  }
};

/**
 * Fetch all classroom/chamber rooms
 * GET /api/timetable/admin/rooms
 */
export const getAllRoomsAdmin = async (_req: Request, res: Response): Promise<void> => {
  try {
    const rooms = await ClassroomRoom.find({ isActive: true }).sort({ name: 1 }).lean();
    res.status(200).json({ success: true, count: rooms.length, rooms });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch rooms.', error: error?.message });
  }
};

/**
 * Create new classroom/chamber room
 * POST /api/timetable/admin/rooms
 */
export const createRoomAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const room = await ClassroomRoom.create(req.body);
    res.status(201).json({
      success: true,
      message: `Classroom "${room.name}" created successfully.`,
      room,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: 'Failed to create room.', error: error?.message });
  }
};

/**
 * Fetch weekly matrix grid for a specific batch and shift
 * GET /api/timetable/admin/grid
 */
export const getWeeklyGridAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const batchId = req.query.batchId as string;
    const shiftId = (req.query.shiftId as string) || 'shift-morning';

    let resolvedBatchId = batchId;
    if (!resolvedBatchId) {
      const activeBatch = await Batch.findOne({ status: 'active' }).sort({ createdAt: -1 }).lean();
      if (activeBatch) resolvedBatchId = String(activeBatch._id);
    }

    if (!resolvedBatchId) {
      res.status(404).json({ success: false, message: 'No batch available.' });
      return;
    }

    const batch = await Batch.findById(resolvedBatchId).lean();
    const rooms = await ClassroomRoom.find({ isActive: true }).lean();
    const facultyList = await User.find({ role: { $in: ['faculty', 'admin'] } })
      .select('_id name salutation email')
      .lean();

    const weeklySlots: Record<string, any[]> = {};
    for (const d of DAYS_ORDER) {
      weeklySlots[d] = [];
    }

    const slots = await RecurringScheduleSlot.find({
      batch: resolvedBatchId,
      shiftId,
      isActive: true,
    })
      .sort({ order: 1, startTime: 1 })
      .lean();

    for (const slot of slots) {
      if (weeklySlots[slot.dayOfWeek]) {
        weeklySlots[slot.dayOfWeek]!.push(slot);
      }
    }

    // Overrides count
    const overridesCount = await ScheduleOverride.countDocuments({
      batch: resolvedBatchId,
    });

    res.status(200).json({
      success: true,
      batch,
      shiftId,
      rooms,
      facultyList,
      stats: {
        totalWeeklySlots: slots.length,
        activeChambers: rooms.length,
        facultyCount: facultyList.length,
        overridesCount,
      },
      weeklySlots,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to load timetable grid.', error: error?.message });
  }
};

/**
 * Conflict check endpoint for UI modal validation
 * POST /api/timetable/admin/check-conflicts
 */
export const checkConflictsAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { batchId, shiftId, dayOfWeek, startTime, endTime, facultyId, roomId, excludeSlotId } =
      req.body;

    const result = await checkSlotConflicts({
      batchId,
      shiftId,
      dayOfWeek,
      startTime,
      endTime,
      facultyId,
      roomId,
      excludeSlotId,
    });

    res.status(200).json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Conflict check failed.', error: error?.message });
  }
};

/**
 * Create recurring schedule slot
 * POST /api/timetable/admin/slots
 */
export const createSlotAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      batchId,
      shiftId,
      dayOfWeek,
      startTime,
      endTime,
      timeFormatted,
      sessionType,
      subject,
      topic,
      facultyId,
      facultyName,
      roomId,
      roomName,
      liveStreamUrl,
      notesUrl,
      order,
    } = req.body;

    // Check conflicts
    const conflictCheck = await checkSlotConflicts({
      batchId,
      shiftId,
      dayOfWeek,
      startTime,
      endTime,
      facultyId,
      facultyName,
      roomId,
      roomName,
    });

    if (conflictCheck.hasConflict && !req.body.overrideConflict) {
      res.status(409).json({
        success: false,
        message: 'Conflict detected with existing schedule.',
        conflicts: conflictCheck.conflicts,
      });
      return;
    }

    const slot = await RecurringScheduleSlot.create({
      batch: batchId,
      shiftId,
      dayOfWeek,
      startTime,
      endTime,
      timeFormatted: timeFormatted || `${startTime} - ${endTime}`,
      sessionType: sessionType || 'Major Act',
      subject,
      topic,
      faculty: facultyId,
      facultyName: facultyName || 'Adv. Rajinder Sir',
      room: roomId,
      roomName: roomName || 'Chamber 101',
      liveStreamUrl,
      notesUrl,
      order: order || 1,
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: `Lecture slot "${subject}" created successfully for ${dayOfWeek}.`,
      slot,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: 'Failed to create slot.', error: error?.message });
  }
};

/**
 * Update recurring schedule slot
 * PUT /api/timetable/admin/slots/:id
 */
export const updateSlotAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const slot = await RecurringScheduleSlot.findByIdAndUpdate(id, req.body, { new: true });
    if (!slot) {
      res.status(404).json({ success: false, message: 'Slot not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Slot updated successfully.',
      slot,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: 'Failed to update slot.', error: error?.message });
  }
};

/**
 * Delete recurring schedule slot
 * DELETE /api/timetable/admin/slots/:id
 */
export const deleteSlotAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const slot = await RecurringScheduleSlot.findByIdAndDelete(id);
    if (!slot) {
      res.status(404).json({ success: false, message: 'Slot not found.' });
      return;
    }

    // Also clean up alerts and overrides pointing to this slot
    await ClassAlertSubscription.deleteMany({ slot: id });
    await ScheduleOverride.deleteMany({ slot: id });

    res.status(200).json({
      success: true,
      message: `Slot "${slot.subject}" deleted permanently.`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to delete slot.', error: error?.message });
  }
};

/**
 * Create date-specific schedule override (rescheduled, cancelled, holiday)
 * POST /api/timetable/admin/overrides
 */
export const createOverrideAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      dateIST,
      batchId,
      shiftId,
      slotId,
      overrideType,
      newStartTime,
      newEndTime,
      newTimeFormatted,
      newFacultyName,
      newRoomName,
      newTopic,
      reason,
      notifyStudents,
    } = req.body;

    const override = await ScheduleOverride.create({
      dateIST,
      batch: batchId,
      shiftId,
      slot: slotId,
      overrideType,
      newStartTime,
      newEndTime,
      newTimeFormatted,
      newFacultyName,
      newRoomName,
      newTopic,
      reason: reason || 'Class schedule update.',
      notifyStudents: !!notifyStudents,
    });

    // If notifyStudents is checked, automatically create an official Notice in Notice collection
    if (notifyStudents) {
      const batch = await Batch.findById(batchId).lean();
      const circularNo = `CIR-${Date.now().toString().slice(-6)}`;
      const title =
        overrideType === 'cancelled'
          ? `Timetable Alert: Lecture Cancelled on ${dateIST}`
          : overrideType === 'rescheduled'
          ? `Timetable Alert: Lecture Rescheduled on ${dateIST}`
          : `Academic Notice: Schedule Update for ${dateIST}`;

      await Notice.create({
        circularNo,
        title,
        content: `Attention Students (${batch?.name || 'All Cohorts'}): ${reason || 'Schedule update on ' + dateIST}. Please check your Timetable & Shift Schedule page for updated chamber allocations.`,
        category: 'Classroom Timetable',
        priority: 'urgent',
        targetCohorts: batch?.name || 'All Enrolled Batches',
        issuedBy: 'Academic Registrar & Dean Office',
        authorName: req.user?.name || 'Academic Dean',
        isPublished: true,
        publishedAt: new Date(),
      });
    }

    res.status(201).json({
      success: true,
      message: `Schedule override (${overrideType}) saved successfully.`,
      override,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: 'Failed to create override.', error: error?.message });
  }
};

/**
 * Delete schedule override
 * DELETE /api/timetable/admin/overrides/:id
 */
export const deleteOverrideAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await ScheduleOverride.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: 'Override removed.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to remove override.', error: error?.message });
  }
};

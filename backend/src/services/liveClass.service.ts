import mongoose, { type Types } from 'mongoose';
import LiveClass, { type ILiveClass } from '../models/liveClass.model.js';
import LiveClassAttendance from '../models/liveClassAttendance.model.js';
import LiveClassChatMessage from '../models/liveClassChatMessage.model.js';
import ArchivedClass, { type IArchivedClass } from '../models/archivedClass.model.js';
import User from '../models/user.model.js';
import zoomVideoProvider from './video/ZoomVideoSdkProvider.js';

export class LiveClassService {
  /**
   * Register or update student attendance on join
   */
  public static async recordStudentJoin(classId: string | Types.ObjectId, userId: string | Types.ObjectId) {
    const user = await User.findById(userId).select('name rollNo assignedBatch');
    if (!user) throw new Error('User not found.');

    const liveClass = await LiveClass.findById(classId);
    if (!liveClass) throw new Error('Class not found.');

    const now = new Date();
    let attendance = await LiveClassAttendance.findOne({ classId, studentId: userId });

    if (!attendance) {
      const isLate = liveClass.actualStartedAt
        ? (now.getTime() - liveClass.actualStartedAt.getTime()) > (liveClass.attendanceRules.lateThresholdMinutes * 60 * 1000)
        : false;

      attendance = await LiveClassAttendance.create({
        classId,
        studentId: userId,
        studentName: user.name,
        studentRollNo: user.rollNo || 'STU-001',
        batchId: user.assignedBatch,
        joinedAt: now,
        isLate,
        status: 'partial',
        intervals: [{ joinedAt: now }],
        lastHeartbeatAt: now,
      });

      // Increment active attendee counter
      await LiveClass.findByIdAndUpdate(classId, {
        $inc: { currentLiveCount: 1, totalAttendeesCount: 1 },
      });
    } else {
      // Re-joining an ongoing session
      attendance.intervals.push({ joinedAt: now });
      attendance.lastHeartbeatAt = now;
      attendance.leftAt = undefined;
      await attendance.save();

      await LiveClass.findByIdAndUpdate(classId, {
        $inc: { currentLiveCount: 1 },
      });
    }

    return attendance;
  }

  /**
   * Record periodic attendance heartbeat from active student client
   */
  public static async recordStudentHeartbeat(classId: string | Types.ObjectId, userId: string | Types.ObjectId) {
    const attendance = await LiveClassAttendance.findOne({ classId, studentId: userId });
    if (!attendance) return null;

    const now = new Date();
    const liveClass = await LiveClass.findById(classId);
    const scheduledDurationSeconds = (liveClass?.durationMinutes || 120) * 60;

    // Calculate added duration since last interval start or heartbeat
    const lastInterval = attendance.intervals[attendance.intervals.length - 1];
    if (lastInterval && !lastInterval.leftAt) {
      const elapsedSeconds = Math.max(1, Math.round((now.getTime() - lastInterval.joinedAt.getTime()) / 1000));
      lastInterval.durationSeconds = elapsedSeconds;
    }

    // Recompute total duration across all intervals
    let totalSeconds = 0;
    for (const inv of attendance.intervals) {
      totalSeconds += inv.durationSeconds || 0;
    }
    attendance.totalDurationSeconds = totalSeconds;
    attendance.lastHeartbeatAt = now;

    // Recompute percentage
    const percent = Math.min(100, Math.round((totalSeconds / scheduledDurationSeconds) * 100));
    attendance.attendancePercent = percent;

    const minRequired = liveClass?.attendanceRules?.minDurationPercent || 75;
    if (percent >= minRequired) {
      attendance.status = 'present';
    } else if (percent >= 30) {
      attendance.status = 'partial';
    } else {
      attendance.status = 'absent';
    }

    await attendance.save();
    return attendance;
  }

  /**
   * Record student leaving class
   */
  public static async recordStudentLeave(classId: string | Types.ObjectId, userId: string | Types.ObjectId) {
    const attendance = await LiveClassAttendance.findOne({ classId, studentId: userId });
    if (!attendance) return null;

    const now = new Date();
    attendance.leftAt = now;
    const lastInterval = attendance.intervals[attendance.intervals.length - 1];
    if (lastInterval && !lastInterval.leftAt) {
      lastInterval.leftAt = now;
      lastInterval.durationSeconds = Math.max(
        1,
        Math.round((now.getTime() - lastInterval.joinedAt.getTime()) / 1000)
      );
    }

    // Recompute total duration
    let totalSeconds = 0;
    for (const inv of attendance.intervals) {
      totalSeconds += inv.durationSeconds || 0;
    }
    attendance.totalDurationSeconds = totalSeconds;

    const liveClass = await LiveClass.findById(classId);
    const scheduledDurationSeconds = (liveClass?.durationMinutes || 120) * 60;
    const percent = Math.min(100, Math.round((totalSeconds / scheduledDurationSeconds) * 100));
    attendance.attendancePercent = percent;

    const minRequired = liveClass?.attendanceRules?.minDurationPercent || 75;
    attendance.status = percent >= minRequired ? 'present' : percent >= 30 ? 'partial' : 'absent';

    await attendance.save();

    // Decrement live count
    await LiveClass.findByIdAndUpdate(classId, {
      $set: { currentLiveCount: Math.max(0, (liveClass?.currentLiveCount || 1) - 1) },
    });

    return attendance;
  }

  /**
   * Automatically process cloud recording payload and generate ArchivedClass
   */
  public static async processCompletedRecording(payload: any) {
    const sessionTopic = payload?.session_name || payload?.topic || payload?.session_topic;
    if (!sessionTopic) return null;

    const liveClass = await LiveClass.findOne({ sessionTopic });
    if (!liveClass) return null;

    // Find MP4 video file from files array
    const files = payload?.recording_files || [];
    const videoFile = files.find((f: any) => f.file_type === 'MP4' || f.file_extension === 'MP4') || files[0];
    const videoUrl = videoFile?.download_url || videoFile?.play_url || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

    const durationSeconds = payload?.duration ? payload.duration * 60 : (liveClass.durationMinutes || 90) * 60;
    const hours = Math.floor(durationSeconds / 3600);
    const mins = Math.floor((durationSeconds % 3600) / 60);
    const durationFormatted = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

    const dateFormatted = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    // Create or update ArchivedClass
    const archived = await ArchivedClass.create({
      originalClassId: liveClass._id,
      courseId: liveClass.courseId,
      batchIds: liveClass.batchIds,
      subject: liveClass.subject,
      title: liveClass.title,
      date: dateFormatted,
      duration: durationFormatted,
      durationSeconds,
      faculty: liveClass.facultyName,
      facultyTitle: liveClass.facultyTitle,
      videoUrl,
      notesFile: liveClass.handoutPdf
        ? {
            fileName: liveClass.handoutPdf.fileName,
            fileUrl: liveClass.handoutPdf.fileUrl,
            fileSize: liveClass.handoutPdf.fileSize,
          }
        : undefined,
      chapters: liveClass.learningFocus.map((f, idx) => ({
        timestampSeconds: idx * 900,
        title: f.title,
      })),
      isPublished: true,
    });

    // Mark live class as archived
    liveClass.status = 'archived';
    liveClass.archivedClassId = archived._id;
    await liveClass.save();

    return archived;
  }
}

export default LiveClassService;

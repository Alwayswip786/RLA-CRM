import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../models/user.model.js';
import {
  Course,
  CourseModule,
  CourseLesson,
  CourseEnrollment,
  LessonProgress,
} from '../models/course.model.js';
import { VideoWatchSession } from '../models/videoWatchSession.model.js';
import MainsSubmission from '../models/mainsSubmission.model.js';
import { MONGODB_URI } from '../config/env.js';

dotenv.config();

export async function seedStudentTelemetry() {
  console.log('--- Starting Student Telemetry & Directory Seeder ---');
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(MONGODB_URI);
  }

  const hashedPassword = await bcrypt.hash('Password@123', 10);

  // 1. Ensure Law Courses exist
  const coursesData = [
    {
      slug: 'djs-foundation',
      title: 'Judicial Services (PCS-J) Comprehensive Foundation 2025-26',
      shortCode: 'PCS-J FOUNDATION',
      subtitle: 'Complete 360° Syllabus Coverage for State Judicial Services',
      description: 'Foundational training covering CPC, CrPC/BNSS, IPC/BNS, Evidence Act/BSA, and Constitution.',
      instructor: 'Adv. Rajinder Sir (Dean)',
      targetExam: 'State Judicial Services (PCS-J)',
      category: 'Foundation',
      status: 'published' as const,
      enrolledStudentsCount: 264,
      totalLecturesCount: 78,
      totalHours: 145.5,
      activeBatches: ['Morning Shift (Cohort A)', 'Evening Shift (Cohort B)'],
    },
    {
      slug: 'cpc-pleadings-mastery',
      title: 'Civil Procedure Code (CPC) & Pleadings Drafting Mastery',
      shortCode: 'CPC MASTERY',
      subtitle: 'Procedural mastery from Inherent Powers to Execution of Decrees',
      description: 'Exhaustive exploration of Section 9 to 151 and practical drafting of Plainting and Written Statements.',
      instructor: 'Adv. Rajinder Sir',
      targetExam: 'State Judicial Services (PCS-J)',
      category: 'Procedural Law',
      status: 'published' as const,
      enrolledStudentsCount: 86,
      totalLecturesCount: 38,
      totalHours: 68,
      activeBatches: ['Morning Shift (Cohort A)', 'Evening Shift (Cohort B)'],
    },
    {
      slug: 'bns-criminal-trial',
      title: 'Bharatiya Nyaya Sanhita (BNS) & Criminal Trial Specialization',
      shortCode: 'BNS CRIMINAL',
      subtitle: 'Modern Indian Criminal Jurisprudence & Cross-Examination Practice',
      description: 'In-depth comparative study between Indian Penal Code (IPC) and Bharatiya Nyaya Sanhita (BNS).',
      instructor: 'Adv. Sharma',
      targetExam: 'State Judicial Services (PCS-J)',
      category: 'Substantive Law',
      status: 'published' as const,
      enrolledStudentsCount: 52,
      totalLecturesCount: 34,
      totalHours: 58.5,
      activeBatches: ['Weekend Fastrack (Cohort C)'],
    },
    {
      slug: 'constitution-bench',
      title: 'Constitution Law & Landmark Constitutional Benches',
      shortCode: 'CONSTITUTION',
      subtitle: 'Fundamental Rights, Federal Structure & Nine-Judge Bench Rulings',
      description: 'Analytical study of Parts III, IV, and the evolution of the Basic Structure Doctrine.',
      instructor: 'Adv. Rajinder Sir',
      targetExam: 'State Judicial Services (PCS-J)',
      category: 'Constitutional Law',
      status: 'published' as const,
      enrolledStudentsCount: 26,
      totalLecturesCount: 28,
      totalHours: 52,
      activeBatches: ['Weekend Fastrack (Cohort C)'],
    },
  ];

  const courseMap = new Map<string, any>();
  for (const cData of coursesData) {
    let course = await Course.findOne({ slug: cData.slug });
    if (!course) {
      course = await Course.create(cData);
      console.log(`Created course: ${course.title}`);
    } else {
      course.shortCode = cData.shortCode;
      course.instructor = cData.instructor;
      course.totalLecturesCount = cData.totalLecturesCount;
      course.totalHours = cData.totalHours;
      course.enrolledStudentsCount = cData.enrolledStudentsCount;
      course.activeBatches = cData.activeBatches;
      await course.save();
    }
    courseMap.set(cData.slug, course);
  }

  // 2. Ensure Modules & Lessons for djs-foundation
  const foundationCourse = courseMap.get('djs-foundation')!;
  let cpcModule = await CourseModule.findOne({
    courseId: foundationCourse._id,
    title: 'Civil Procedure Code, 1908 (CPC)',
  });
  if (!cpcModule) {
    cpcModule = await CourseModule.create({
      courseId: foundationCourse._id,
      title: 'Civil Procedure Code, 1908 (CPC)',
      order: 1,
      itemsCount: 16,
    });
  }

  let criminalModule = await CourseModule.findOne({
    courseId: foundationCourse._id,
    title: 'BNSS & Criminal Trial Procedure',
  });
  if (!criminalModule) {
    criminalModule = await CourseModule.create({
      courseId: foundationCourse._id,
      title: 'BNSS & Criminal Trial Procedure',
      order: 2,
      itemsCount: 14,
    });
  }

  // Ensure specific key lessons exist
  const keyLessons = [
    {
      courseId: foundationCourse._id,
      moduleId: cpcModule._id,
      title: 'CPC Sec 11: Res Judicata & Constructive Res Judicata (Part II)',
      duration: '01:15:00',
      durationSeconds: 4500,
      order: 16,
      type: 'video' as const,
    },
    {
      courseId: foundationCourse._id,
      moduleId: cpcModule._id,
      title: 'CPC Sec 10: Res Sub Judice & Stay of Suit Principles',
      duration: '01:05:00',
      durationSeconds: 3900,
      order: 15,
      type: 'video' as const,
    },
    {
      courseId: foundationCourse._id,
      moduleId: cpcModule._id,
      title: 'CPC Sec 9: Inherent Jurisdiction & Express/Implied Bars',
      duration: '01:25:00',
      durationSeconds: 5100,
      order: 9,
      type: 'video' as const,
    },
    {
      courseId: foundationCourse._id,
      moduleId: criminalModule._id,
      title: 'BNSS Sec 35 & Sec 482: Mandatory Notice & Anticipatory Bail',
      duration: '01:30:00',
      durationSeconds: 5400,
      order: 8,
      type: 'video' as const,
    },
    {
      courseId: foundationCourse._id,
      moduleId: criminalModule._id,
      title: 'BNS Sec 100 vs 101: Murder vs Culpable Homicide Distinction',
      duration: '01:20:00',
      durationSeconds: 4800,
      order: 12,
      type: 'video' as const,
    },
    {
      courseId: foundationCourse._id,
      moduleId: criminalModule._id,
      title: 'BSA Sec 22–27: Relevancy of Confessions to Police Officers',
      duration: '00:58:00',
      durationSeconds: 3480,
      order: 6,
      type: 'video' as const,
    },
  ];

  const lessonMap = new Map<string, any>();
  for (const lData of keyLessons) {
    let lesson = await CourseLesson.findOne({
      courseId: lData.courseId,
      title: lData.title,
    });
    if (!lesson) {
      lesson = await CourseLesson.create(lData);
      console.log(`Created lesson: ${lesson.title}`);
    }
    lessonMap.set(lData.title, lesson);
  }

  // 3. Ensure Students with full metrics and telemetry
  const studentsToSeed = [
    {
      name: 'Pooja Sharma',
      rollNo: 'RLA-2026-042',
      email: 'pooja.sharma@delhilaw.in',
      phone: '+91 98112 43210',
      shift: 'shift-morning',
      courseSlug: 'djs-foundation',
      progressPct: 88,
      completedLessons: 68,
      totalHours: 114.5,
      rfid: 'GATE-A-042',
      prelimsScore: 89.2,
      mainsDaw: { submitted: 45, total: 48 },
      feeStatus: 'Paid in Full' as const,
      accountStatus: 'active' as const,
      sessions: [
        {
          lessonTitle: 'CPC Sec 11: Res Judicata & Constructive Res Judicata (Part II)',
          watchedSecs: 4380,
          lastPos: 4380,
          durationSecs: 4500,
          pct: 97,
          status: 'completed' as const,
          speed: 1.25,
          plays: 2,
          scrub: false,
          timeOffsetHours: 2, // Today 2:45 PM
        },
        {
          lessonTitle: 'CPC Sec 10: Res Sub Judice & Stay of Suit Principles',
          watchedSecs: 3900,
          lastPos: 3900,
          durationSecs: 3900,
          pct: 100,
          status: 'completed' as const,
          speed: 1.0,
          plays: 1,
          scrub: false,
          timeOffsetHours: 22, // Yesterday
        },
        {
          lessonTitle: 'BNSS Sec 35 & Sec 482: Mandatory Notice & Anticipatory Bail',
          watchedSecs: 4420,
          lastPos: 4420,
          durationSecs: 5400,
          pct: 82,
          status: 'in_progress' as const,
          speed: 1.25,
          plays: 1,
          scrub: false,
          timeOffsetHours: 24,
        },
        {
          lessonTitle: 'BNS Sec 100 vs 101: Murder vs Culpable Homicide Distinction',
          watchedSecs: 4800,
          lastPos: 4800,
          durationSecs: 4800,
          pct: 100,
          status: 'completed' as const,
          speed: 1.5,
          plays: 3,
          scrub: false,
          timeOffsetHours: 72,
        },
        {
          lessonTitle: 'BSA Sec 22–27: Relevancy of Confessions to Police Officers',
          watchedSecs: 3480,
          lastPos: 3480,
          durationSecs: 3480,
          pct: 100,
          status: 'completed' as const,
          speed: 1.0,
          plays: 1,
          scrub: false,
          timeOffsetHours: 96,
        },
      ],
    },
    {
      name: 'Rohan Verma',
      rollNo: 'RLA-2026-089',
      email: 'rohan.verma@delhilaw.in',
      phone: '+91 98734 56789',
      shift: 'shift-morning',
      courseSlug: 'djs-foundation',
      progressPct: 64,
      completedLessons: 50,
      totalHours: 79.2,
      rfid: 'GATE-B-089',
      prelimsScore: 76.5,
      mainsDaw: { submitted: 38, total: 48 },
      feeStatus: 'Paid in Full' as const,
      accountStatus: 'active' as const,
      sessions: [
        {
          lessonTitle: 'CPC Sec 11: Res Judicata & Constructive Res Judicata (Part II)',
          watchedSecs: 2250,
          lastPos: 2250,
          durationSecs: 4500,
          pct: 50,
          status: 'in_progress' as const,
          speed: 1.0,
          plays: 1,
          scrub: false,
          timeOffsetHours: 1, // 1 hour ago
        },
      ],
    },
    {
      name: 'Siddharth Joshi',
      rollNo: 'RLA-2026-104',
      email: 'siddharth.joshi@delhilaw.in',
      phone: '+91 97110 98765',
      shift: 'shift-evening',
      courseSlug: 'djs-foundation',
      progressPct: 24,
      completedLessons: 19,
      totalHours: 28.5,
      rfid: 'GATE-C-104',
      prelimsScore: 61.0,
      mainsDaw: { submitted: 12, total: 48 },
      feeStatus: 'Installment Due' as const,
      pendingFeeAmount: '₹18,000 Due 30 Sep',
      accountStatus: 'active' as const, // will compute to needs_attention due to <35%
      sessions: [
        {
          lessonTitle: 'CPC Sec 11: Res Judicata & Constructive Res Judicata (Part II)',
          watchedSecs: 600,
          lastPos: 600,
          durationSecs: 4500,
          pct: 13,
          status: 'early_drop' as const,
          speed: 1.5,
          plays: 1,
          scrub: true, // Scrubbing / fast-forward detected
          timeOffsetHours: 96, // 4 days ago
        },
      ],
    },
    {
      name: 'Harsh Vardhan Singh',
      rollNo: 'RLA-2026-150',
      email: 'harsh.singh@delhilaw.in',
      phone: '+91 99990 12345',
      shift: 'shift-morning',
      courseSlug: 'djs-foundation',
      progressPct: 18,
      completedLessons: 14,
      totalHours: 16.4,
      rfid: 'GATE-A-150',
      prelimsScore: 54.0,
      mainsDaw: { submitted: 9, total: 48 },
      feeStatus: 'Overdue' as const,
      pendingFeeAmount: '₹24,500 Overdue (12 Days)',
      accountStatus: 'active' as const, // will compute to needs_attention due to <35%
      sessions: [
        {
          lessonTitle: 'CPC Sec 9: Inherent Jurisdiction & Express/Implied Bars',
          watchedSecs: 1530,
          lastPos: 1530,
          durationSecs: 5100,
          pct: 30,
          status: 'in_progress' as const,
          speed: 2.0,
          plays: 1,
          scrub: true, // Scrubbing / fast-forward detected
          timeOffsetHours: 216, // 9 days ago
        },
      ],
    },
    {
      name: 'Ananya Sen',
      rollNo: 'RLA-2026-061',
      email: 'ananya.sen@delhilaw.in',
      phone: '+91 98101 23456',
      shift: 'shift-evening',
      courseSlug: 'cpc-pleadings-mastery',
      progressPct: 84,
      completedLessons: 32,
      totalHours: 42.0,
      rfid: 'GATE-A-061',
      prelimsScore: 88.0,
      mainsDaw: { submitted: 40, total: 48 },
      feeStatus: 'Paid in Full' as const,
      accountStatus: 'active' as const,
      sessions: [
        {
          lessonTitle: 'CPC Sec 11: Res Judicata & Constructive Res Judicata (Part II)',
          watchedSecs: 4200,
          lastPos: 4200,
          durationSecs: 4500,
          pct: 93,
          status: 'completed' as const,
          speed: 1.0,
          plays: 1,
          scrub: false,
          timeOffsetHours: 5,
        },
      ],
    },
    {
      name: 'Vikramaditya Rathore',
      rollNo: 'RLA-2026-205',
      email: 'vikram.rathore@delhilaw.in',
      phone: '+91 98188 77665',
      shift: 'shift-weekend',
      courseSlug: 'bns-criminal-trial',
      progressPct: 15,
      completedLessons: 5,
      totalHours: 8.5,
      rfid: 'GATE-D-205',
      prelimsScore: 42.0,
      mainsDaw: { submitted: 4, total: 48 },
      feeStatus: 'Overdue' as const,
      pendingFeeAmount: '₹32,000 Overdue (30 Days)',
      accountStatus: 'suspended' as const,
      sessions: [
        {
          lessonTitle: 'BNS Sec 100 vs 101: Murder vs Culpable Homicide Distinction',
          watchedSecs: 720,
          lastPos: 720,
          durationSecs: 4800,
          pct: 15,
          status: 'early_drop' as const,
          speed: 1.0,
          plays: 1,
          scrub: false,
          timeOffsetHours: 350,
        },
      ],
    },
  ];

  for (const sData of studentsToSeed) {
    let student = await User.findOne({ rollNo: sData.rollNo });
    const targetCourse = courseMap.get(sData.courseSlug)!;

    if (!student) {
      student = await User.create({
        name: sData.name,
        rollNo: sData.rollNo,
        email: sData.email,
        phone: sData.phone,
        password: hashedPassword,
        role: 'student',
        preferredShiftId: sData.shift,
        accountStatus: sData.accountStatus,
        rfidTurnstileId: sData.rfid,
        prelimsAverageScore: sData.prelimsScore,
        feeDetails: {
          feeStatus: sData.feeStatus,
          pendingFeeAmount: sData.pendingFeeAmount,
        },
        admissionDate: new Date('2026-01-08'),
        activeDevice: {
          deviceModel: 'MacBook Pro 16" (M3 Max)',
          os: 'macOS Sonoma 14.4',
          browser: 'Chrome 124.0.6367.91',
          ipAddress: '103.211.54.18',
          location: 'New Delhi, India',
          concurrentSessions: 1,
        },
        gateLogs: [
          {
            timestamp: new Date(Date.now() - 3600 * 1000 * 4),
            gate: 'Main Arch Turnstile A',
            direction: 'ENTRY',
            method: 'RFID Biometric',
          },
          {
            timestamp: new Date(Date.now() - 3600 * 1000 * 28),
            gate: 'South Gate Turnstile B',
            direction: 'EXIT',
            method: 'QR Code Pass',
          },
        ],
      });
      console.log(`Created student: ${student.name} (${student.rollNo})`);
    } else {
      student.name = sData.name;
      student.email = sData.email;
      student.phone = sData.phone;
      student.preferredShiftId = sData.shift;
      student.accountStatus = sData.accountStatus;
      student.rfidTurnstileId = sData.rfid;
      student.prelimsAverageScore = sData.prelimsScore;
      student.feeDetails = {
        feeStatus: sData.feeStatus,
        pendingFeeAmount: sData.pendingFeeAmount,
      };
      await student.save();
    }

    // Enrollment
    let enrollment = await CourseEnrollment.findOne({
      userId: student._id,
      courseId: targetCourse._id,
    });
    if (!enrollment) {
      const firstOffset = sData.sessions[0]?.timeOffsetHours ?? 1;
      enrollment = await CourseEnrollment.create({
        userId: student._id,
        courseId: targetCourse._id,
        overallProgressPercent: sData.progressPct,
        completedLessonsCount: sData.completedLessons,
        lastAccessedAt: new Date(Date.now() - firstOffset * 3600 * 1000),
      });
    } else {
      const firstOffset = sData.sessions[0]?.timeOffsetHours ?? 1;
      enrollment.overallProgressPercent = sData.progressPct;
      enrollment.completedLessonsCount = sData.completedLessons;
      enrollment.lastAccessedAt = new Date(Date.now() - firstOffset * 3600 * 1000);
      await enrollment.save();
    }

    // Video sessions & progress
    for (const sess of sData.sessions) {
      const lesson = lessonMap.get(sess.lessonTitle);
      if (!lesson) continue;

      const sessionDate = new Date(Date.now() - sess.timeOffsetHours * 3600 * 1000);

      await VideoWatchSession.findOneAndUpdate(
        { userId: student._id, lessonId: lesson._id },
        {
          $set: {
            courseId: targetCourse._id,
            sessionId: `sess_${student._id}_${lesson._id}`,
            playbackSpeed: sess.speed,
            watchedSeconds: sess.watchedSecs,
            lastPositionSeconds: sess.lastPos,
            videoDurationSeconds: sess.durationSecs,
            watchPercentage: sess.pct,
            playCount: sess.plays,
            scrubDetected: sess.scrub,
            status: sess.status,
            device: {
              deviceModel: 'MacBook Pro 16" (M3 Max)',
              os: 'macOS Sonoma 14.4',
              browser: 'Chrome 124.0.6367.91',
              ipAddress: '103.211.54.18',
              location: 'New Delhi, India',
            },
            lastHeartbeatAt: sessionDate,
            createdAt: sessionDate,
            updatedAt: sessionDate,
          },
        },
        { upsert: true, new: true }
      );

      // Upsert LessonProgress
      await LessonProgress.findOneAndUpdate(
        { userId: student._id, lessonId: lesson._id },
        {
          $set: {
            courseId: targetCourse._id,
            videoWatchSeconds: sess.watchedSecs,
            videoDurationSeconds: sess.durationSecs,
            isCompleted: sess.pct >= 85,
            completedAt: sess.pct >= 85 ? sessionDate : undefined,
          },
        },
        { upsert: true, new: true }
      );
    }
  }

  console.log('✅ Student Telemetry & Course Metrics successfully seeded!');
}

// Run directly if called from command line
if (process.argv[1]?.endsWith('seedStudentTelemetry.ts') || process.argv[1]?.endsWith('seedStudentTelemetry.js')) {
  seedStudentTelemetry()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seeding failed:', err);
      process.exit(1);
    });
}

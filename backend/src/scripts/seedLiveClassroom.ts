import mongoose from 'mongoose';
import connectDB, { disconnectDB } from '../config/db.js';
import User from '../models/user.model.js';
import { Batch } from '../models/timetable.model.js';
import { Course } from '../models/course.model.js';
import LiveClass from '../models/liveClass.model.js';
import LiveClassChatMessage from '../models/liveClassChatMessage.model.js';
import {
  ArchivedClass,
  ArchivedClassComment,
  ArchivedClassReaction,
} from '../models/archivedClass.model.js';

export const seedLiveClassroom = async () => {
  console.log('=== Seeding Dynamic Live Classroom & Zoom Video SDK Data ===');
  await connectDB();

  // 1. Ensure faculty users
  let facultyRajinder = await User.findOne({ name: /Rajinder/i, role: { $in: ['faculty', 'admin'] } });
  if (!facultyRajinder) {
    facultyRajinder = await User.create({
      rollNo: 'FAC-RAJINDER-01',
      salutation: 'Adv.',
      name: 'Adv. Rajinder Sir',
      email: 'rajinder@rajinderlawacademy.com',
      role: 'faculty',
      accountStatus: 'active',
      targetExam: 'Delhi Judicial Service (DJS)',
    });
  }

  let facultyNeha = await User.findOne({ name: /Neha Sharma/i });
  if (!facultyNeha) {
    facultyNeha = await User.create({
      rollNo: 'FAC-NEHA-02',
      salutation: 'Adv.',
      name: 'Adv. Neha Sharma',
      email: 'neha@rajinderlawacademy.com',
      role: 'faculty',
      accountStatus: 'active',
      targetExam: 'Delhi Judicial Service (DJS)',
    });
  }

  // 2. Ensure student user
  let studentRohit = await User.findOne({ name: /Rohit Verma/i });
  if (!studentRohit) {
    studentRohit = await User.create({
      rollNo: 'STU-ROHIT-01',
      salutation: 'Adv.',
      name: 'Adv. Rohit Verma',
      email: 'rohit@rajinderlawacademy.com',
      role: 'student',
      accountStatus: 'active',
      targetExam: 'Delhi Judicial Service (DJS)',
    });
  }

  // 3. Ensure batch and course
  let batch = await Batch.findOne();
  let course = await Course.findOne();

  // 4. Clean existing live classes and messages idempotently
  await LiveClass.deleteMany({ sessionTopic: { $in: ['cpc-res-sub-judice-live-2026', 'bns-homicide-live-2026'] } });
  await ArchivedClass.deleteMany({
    title: {
      $in: [
        'Pleadings & Plaint (Order 6 & 7) - Rejection of Plaint Grounds',
        'General Exceptions: Private Defence (Sec 34 to 44)',
        'Relevancy of Facts forming part of same transaction (Res Gestae)',
      ],
    },
  });

  const today = new Date().toISOString().split('T')[0];
  const startAt = new Date();
  startAt.setHours(17, 0, 0, 0); // 5:00 PM
  const endAt = new Date();
  endAt.setHours(19, 0, 0, 0); // 7:00 PM

  // 5. Create ACTIVE LIVE CLASS (100% matches reference screenshot)
  const activeLiveClass = await LiveClass.create({
    title: 'CPC Section 9 to 14: Res Sub Judice & Jurisdiction',
    subject: 'Code of Civil Procedure (CPC)',
    topic: 'Res Sub Judice & Jurisdiction',
    description: 'Bare Act line-by-line decoding with direct 2-way doubt resolution.',
    courseId: course?._id,
    batchIds: batch ? [batch._id] : [],
    shifts: ['shift-morning', 'shift-evening'],
    faculty: facultyRajinder._id,
    facultyName: 'Adv. Rajinder Sir',
    facultyTitle: 'Founding Director & Judicial Mentor',
    scheduledDate: today,
    startTime: '17:00',
    endTime: '19:00',
    scheduledStartAt: startAt,
    scheduledEndAt: endAt,
    actualStartedAt: startAt,
    durationMinutes: 120,
    status: 'live',
    sessionTopic: 'cpc-res-sub-judice-live-2026',
    sessionPassword: 'rla-cpc-live-pass',
    autoRecord: true,
    currentLiveCount: 184,
    peakLiveCount: 196,
    totalAttendeesCount: 210,
    attendanceRules: {
      minDurationPercent: 75,
      lateThresholdMinutes: 15,
    },
    learningFocus: [
      {
        title: 'Section 9 Analysis',
        description: 'Suits of civil nature & express/implied bars.',
      },
      {
        title: 'Section 10 & 11',
        description: 'Res Sub Judice vs Res Judicata distinction.',
      },
      {
        title: '7 Case Precedents',
        description: 'Supreme Court ratio on stay of civil proceedings.',
      },
    ],
    handoutPdf: {
      fileName: 'CPC_Section_9_to_14_Handout.pdf',
      fileUrl: 'https://res.cloudinary.com/demo/image/upload/sample.pdf',
      fileSize: '3.8 MB PDF',
    },
  });

  // 6. Populate Chat Messages (Matching reference screenshot exactly)
  await LiveClassChatMessage.deleteMany({ classId: activeLiveClass._id });
  await LiveClassChatMessage.create([
    {
      classId: activeLiveClass._id,
      senderId: facultyRajinder._id,
      senderName: 'Faculty Desk',
      senderRole: 'faculty',
      text: 'Welcome aspirants! Please keep your CPC Bare Acts open to Section 9 (Courts to try all civil suits unless barred).',
      time: '4:55 PM',
      isFacultyMessage: true,
      isPinned: true,
      isDoubt: false,
    },
    {
      classId: activeLiveClass._id,
      senderId: studentRohit._id,
      senderName: 'Adv. Rohit Verma',
      senderRole: 'student',
      text: 'Sir, will we also cover the Dhulabhai 7-point test on implied bar of jurisdiction today?',
      time: '4:58 PM',
      isFacultyMessage: false,
      isPinned: false,
      isDoubt: true,
    },
    {
      classId: activeLiveClass._id,
      senderId: facultyRajinder._id,
      senderName: 'Adv. Rajinder Sir',
      senderRole: 'faculty',
      text: 'Yes Rohit! Dhulabhai v. State of MP is essential for both Prelims and Mains. We will analyze all 7 principles in detail.',
      time: '5:01 PM',
      isFacultyMessage: true,
      isPinned: false,
      isDoubt: false,
    },
  ]);

  // 7. Create UPCOMING CLASS
  const tomorrow = new Date(Date.now() + 86400000);
  const tomorrowDateStr = tomorrow.toISOString().split('T')[0];
  const tomorrowStart = new Date(tomorrow);
  tomorrowStart.setHours(17, 0, 0, 0);
  const tomorrowEnd = new Date(tomorrow);
  tomorrowEnd.setHours(19, 0, 0, 0);

  await LiveClass.create({
    title: 'Bharatiya Nyaya Sanhita (BNS) Sec 100-115: Homicide vs Murder Deep Dive',
    subject: 'Bhartiya Nyaya Sanhita (BNS)',
    topic: 'Culpable Homicide vs Murder (Sec 100-105)',
    description: 'Statutory exceptions, bodily injury intended, and leading 5-judge Supreme Court constitution bench rulings.',
    courseId: course?._id,
    batchIds: batch ? [batch._id] : [],
    shifts: ['shift-morning', 'shift-evening'],
    faculty: facultyRajinder._id,
    facultyName: 'Adv. Rajinder Sir',
    facultyTitle: 'Founding Director & Judicial Mentor',
    scheduledDate: tomorrowDateStr,
    startTime: '17:00',
    endTime: '19:00',
    scheduledStartAt: tomorrowStart,
    scheduledEndAt: tomorrowEnd,
    durationMinutes: 120,
    status: 'upcoming',
    sessionTopic: 'bns-homicide-live-2026',
    autoRecord: true,
    currentLiveCount: 0,
    learningFocus: [
      {
        title: 'Ingredient Matrix',
        description: 'Comparison of Clause 1 through 4 of Sec 101 BNS.',
      },
      {
        title: 'Exception 1 Provocation',
        description: 'Grave and sudden test under K.M. Nanavati precedent.',
      },
      {
        title: 'Mains Drafting Question',
        description: 'Judicial framing of charges for Trial Court.',
      },
    ],
    handoutPdf: {
      fileName: 'BNS_Sec_100_115_Homicide_Study_Guide.pdf',
      fileUrl: 'https://res.cloudinary.com/demo/image/upload/sample.pdf',
      fileSize: '4.2 MB PDF',
    },
  });

  // 8. Create ARCHIVED CLASSES (Matching reference screenshot exactly)
  const arc1 = await ArchivedClass.create({
    subject: 'Code of Civil Procedure (CPC)',
    title: 'Pleadings & Plaint (Order 6 & 7) - Rejection of Plaint Grounds',
    date: 'Yesterday',
    duration: '1h 45m',
    durationSeconds: 6300,
    faculty: 'Adv. Rajinder Sir',
    facultyTitle: 'Founding Director & Judicial Mentor',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    notesFile: {
      fileName: 'CPC_Order_6_7_Pleadings.pdf',
      fileUrl: 'https://res.cloudinary.com/demo/image/upload/sample.pdf',
      fileSize: '3.8 MB PDF',
    },
    chapters: [
      { timestampSeconds: 0, title: 'Order 6 Rule 1: Fundamentals of Pleadings' },
      { timestampSeconds: 1200, title: 'Order 6 Rule 17: Amendment Principles' },
      { timestampSeconds: 3200, title: 'Order 7 Rule 11: Mandatory 6 Rejection Grounds' },
    ],
    viewsCount: 342,
    likesCount: 89,
    dislikesCount: 1,
    commentsCount: 2,
    isPublished: true,
  });

  await ArchivedClassComment.create([
    {
      archiveId: arc1._id,
      userId: studentRohit._id,
      userName: studentRohit.name,
      userRole: 'student',
      text: 'The explanation of Saleem Bhai v. State of Maharashtra on reading only plaint averments for Order 7 Rule 11 was exceptionally lucid! Thank you Sir.',
      likesCount: 12,
    },
    {
      archiveId: arc1._id,
      userId: facultyRajinder._id,
      userName: facultyRajinder.name,
      userRole: 'faculty',
      text: 'Keep reviewing the 6 mandatory grounds Rohit. Saleem Bhai is a guaranteed 10-marker in Delhi Judicial Service mains.',
      likesCount: 24,
    },
  ]);

  await ArchivedClass.create({
    subject: 'Bhartiya Nyaya Sanhita (BNS)',
    title: 'General Exceptions: Private Defence (Sec 34 to 44)',
    date: '10 Sep 2025',
    duration: '2h 10m',
    durationSeconds: 7800,
    faculty: 'Adv. Rajinder Sir',
    facultyTitle: 'Founding Director & Judicial Mentor',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    notesFile: {
      fileName: 'BNS_Private_Defence_Comprehensive.pdf',
      fileUrl: 'https://res.cloudinary.com/demo/image/upload/sample.pdf',
      fileSize: '4.5 MB PDF',
    },
    chapters: [
      { timestampSeconds: 0, title: 'Sec 34-37: Right of Private Defence of Body' },
      { timestampSeconds: 2400, title: 'Sec 38: When Right Extends to Causing Death' },
      { timestampSeconds: 4800, title: 'Sec 41-44: Private Defence of Property' },
    ],
    viewsCount: 512,
    likesCount: 145,
    dislikesCount: 2,
    commentsCount: 18,
    isPublished: true,
  });

  await ArchivedClass.create({
    subject: 'Indian Evidence Act (BSA)',
    title: 'Relevancy of Facts forming part of same transaction (Res Gestae)',
    date: '08 Sep 2025',
    duration: '1h 35m',
    durationSeconds: 5700,
    faculty: 'Adv. Neha Sharma',
    facultyTitle: 'Senior Faculty & Judicial Research Fellow',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    notesFile: {
      fileName: 'BSA_Res_Gestae_Case_Briefs.pdf',
      fileUrl: 'https://res.cloudinary.com/demo/image/upload/sample.pdf',
      fileSize: '2.9 MB PDF',
    },
    chapters: [
      { timestampSeconds: 0, title: 'Section 4 BSA: Res Gestae Doctrine' },
      { timestampSeconds: 1800, title: 'Ratten v. R & Sukhar v. State of UP' },
      { timestampSeconds: 3600, title: 'Spontaneity & Contemporaneity Test' },
    ],
    viewsCount: 428,
    likesCount: 118,
    dislikesCount: 0,
    commentsCount: 11,
    isPublished: true,
  });

  console.log('✅ Live classroom seeded successfully!');
  console.log(`   - Active Live Class: "${activeLiveClass.title}" (184 Aspirants, 3 focus cards, 3 chats)`);
  console.log('   - 1 Upcoming Class & 3 Recorded Lecture Archives');
};

// Execute if run directly
if (process.argv[1]?.includes('seedLiveClassroom')) {
  seedLiveClassroom()
    .then(async () => {
      await disconnectDB();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('Seed error:', err);
      await disconnectDB();
      process.exit(1);
    });
}

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import {
  AcademicSession,
  ClassroomRoom,
  Batch,
  RecurringScheduleSlot,
  ScheduleOverride,
  type DayOfWeek,
} from '../models/timetable.model.js';
import User from '../models/user.model.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rla_crm';

async function seedTimetable() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected successfully.');

    // 1. Academic Session
    let session = await AcademicSession.findOne({ code: '2025-26' });
    if (!session) {
      session = await AcademicSession.create({
        name: 'Academic Schedule 2025–26',
        code: '2025-26',
        startDate: new Date('2025-07-01'),
        endDate: new Date('2026-06-30'),
        isActive: true,
      });
      console.log('Created Academic Session: 2025–26');
    }

    // 2. Classroom Rooms / Chambers
    const roomsData = [
      { name: 'Chamber 101', roomNumber: '101', building: 'Chamber Wing', capacity: 60, roomType: 'chamber' as const },
      { name: 'Chamber 102', roomNumber: '102', building: 'Chamber Wing', capacity: 45, roomType: 'chamber' as const },
      { name: 'Chamber 103', roomNumber: '103', building: 'Chamber Wing', capacity: 30, roomType: 'discussion_pod' as const },
      { name: 'Chamber 104', roomNumber: '104', building: 'Chamber Wing', capacity: 35, roomType: 'chamber' as const },
      { name: 'Computer Lab B', roomNumber: 'LAB-B', building: 'IT Block', capacity: 80, roomType: 'computer_lab' as const },
      { name: 'Main Examination Hall', roomNumber: 'MEH', building: 'Central Block', capacity: 150, roomType: 'lecture_hall' as const },
      { name: 'Director Chamber', roomNumber: 'DIR', building: 'Administration', capacity: 12, roomType: 'chamber' as const },
    ];

    const roomMap = new Map<string, mongoose.Types.ObjectId>();
    for (const r of roomsData) {
      let room = await ClassroomRoom.findOne({ name: r.name });
      if (!room) {
        room = await ClassroomRoom.create(r);
      }
      roomMap.set(r.name, room._id);
    }
    console.log(`Verified ${roomMap.size} classroom chambers.`);

    // 3. Faculty Users
    const facultyData = [
      { name: 'Adv. Rajinder Sir', rollNo: 'FAC001', role: 'faculty' as const, email: 'rajinder@rla.com' },
      { name: 'Adv. Vikramjit Singh', rollNo: 'FAC002', role: 'faculty' as const, email: 'vikramjit@rla.com' },
      { name: 'Adv. Neha Sharma', rollNo: 'FAC003', role: 'faculty' as const, email: 'neha@rla.com' },
      { name: 'Exam Cell', rollNo: 'FAC004', role: 'faculty' as const, email: 'examcell@rla.com' },
    ];

    const facultyMap = new Map<string, mongoose.Types.ObjectId>();
    for (const f of facultyData) {
      let user = await User.findOne({ name: f.name });
      if (!user) {
        user = await User.create({
          name: f.name,
          rollNo: f.rollNo,
          role: f.role,
          email: f.email,
          salutation: 'Adv.',
          targetExam: 'Faculty',
          isEmailVerified: true,
          accountStatus: 'active',
        });
      }
      facultyMap.set(f.name, user._id);
    }
    console.log(`Verified ${facultyMap.size} faculty accounts.`);

    // 4. Batch: Foundation Judicial Services Batch 2025-26
    let batch = await Batch.findOne({ code: 'FJS-2025' });
    if (!batch) {
      batch = await Batch.create({
        name: 'Foundation Judicial Services Batch 2025-26',
        code: 'FJS-2025',
        academicSession: session._id,
        sessionName: 'Academic Schedule 2025–26',
        subtitle: 'Foundation Judicial Services Batch (Morning 8:30 AM & Evening 5:00 PM Shifts)',
        shifts: [
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
        defaultShiftId: 'shift-morning',
        allowShiftSwitch: true,
        targetExam: 'Delhi Judicial Service (DJS) & PCS-J',
        status: 'active',
        enrolledCount: 184,
      });
      console.log('Created Foundation Batch: FJS-2025');
    } else {
      batch.sessionName = 'Academic Schedule 2025–26';
      batch.subtitle = 'Foundation Judicial Services Batch (Morning 8:30 AM & Evening 5:00 PM Shifts)';
      await batch.save();
    }

    // 5. Clean existing recurring slots for FJS-2025 to re-seed cleanly
    await RecurringScheduleSlot.deleteMany({ batch: batch._id });

    // 6. Master Weekly Schedule Data (Matching Screenshot & Curriculum)
    const slotsToSeed: Array<{
      dayOfWeek: DayOfWeek;
      shiftId: string;
      startTime: string;
      endTime: string;
      timeFormatted: string;
      subject: string;
      topic: string;
      facultyName: string;
      roomName: string;
      sessionType: 'Major Act' | 'Minor Act' | 'Test Series' | 'Doubt Session' | 'Special Lecture';
      order: number;
    }> = [
      // ==================== MONDAY ====================
      // Morning Shift (Matches reference image!)
      {
        dayOfWeek: 'Monday',
        shiftId: 'shift-morning',
        startTime: '08:30',
        endTime: '10:30',
        timeFormatted: '08:30 AM - 10:30 AM',
        subject: 'Code of Civil Procedure (CPC)',
        topic: 'Pleadings, Plaint & Written Statement (Order 6 & 8)',
        facultyName: 'Adv. Rajinder Sir',
        roomName: 'Chamber 101',
        sessionType: 'Major Act',
        order: 1,
      },
      {
        dayOfWeek: 'Monday',
        shiftId: 'shift-morning',
        startTime: '11:00',
        endTime: '13:00',
        timeFormatted: '11:00 AM - 01:00 PM',
        subject: 'Bhartiya Nyaya Sanhita (BNS)',
        topic: 'Homicide, Murder & Culpable Homicide (Sec 100 to 105)',
        facultyName: 'Adv. Rajinder Sir',
        roomName: 'Chamber 101',
        sessionType: 'Major Act',
        order: 2,
      },
      {
        dayOfWeek: 'Monday',
        shiftId: 'shift-morning',
        startTime: '14:00',
        endTime: '15:30',
        timeFormatted: '02:00 PM - 03:30 PM',
        subject: 'Weekly Prelims Speed Test',
        topic: '100 MCQs - IPC vs BNS Comparative Assessment',
        facultyName: 'Exam Cell',
        roomName: 'Computer Lab B',
        sessionType: 'Test Series',
        order: 3,
      },
      // Evening Shift
      {
        dayOfWeek: 'Monday',
        shiftId: 'shift-evening',
        startTime: '17:00',
        endTime: '19:00',
        timeFormatted: '05:00 PM - 07:00 PM',
        subject: 'Code of Civil Procedure (CPC)',
        topic: 'Pleadings, Plaint & Written Statement (Order 6 & 8)',
        facultyName: 'Adv. Rajinder Sir',
        roomName: 'Chamber 101',
        sessionType: 'Major Act',
        order: 1,
      },
      {
        dayOfWeek: 'Monday',
        shiftId: 'shift-evening',
        startTime: '19:15',
        endTime: '20:45',
        timeFormatted: '07:15 PM - 08:45 PM',
        subject: 'Bhartiya Nyaya Sanhita (BNS)',
        topic: 'Homicide, Murder & Culpable Homicide (Sec 100 to 105)',
        facultyName: 'Adv. Vikramjit Singh',
        roomName: 'Chamber 102',
        sessionType: 'Major Act',
        order: 2,
      },

      // ==================== TUESDAY ====================
      // Morning Shift
      {
        dayOfWeek: 'Tuesday',
        shiftId: 'shift-morning',
        startTime: '08:30',
        endTime: '10:30',
        timeFormatted: '08:30 AM - 10:30 AM',
        subject: 'Code of Civil Procedure (CPC)',
        topic: 'Summons, Appearance of Parties & Ex-Parte Decrees',
        facultyName: 'Adv. Rajinder Sir',
        roomName: 'Chamber 101',
        sessionType: 'Major Act',
        order: 1,
      },
      {
        dayOfWeek: 'Tuesday',
        shiftId: 'shift-morning',
        startTime: '11:00',
        endTime: '13:00',
        timeFormatted: '11:00 AM - 01:00 PM',
        subject: 'Bhartiya Nagarik Suraksha Sanhita (BNSS)',
        topic: 'FIR, Investigation & Powers of Police (Sec 173 to 190)',
        facultyName: 'Adv. Rajinder Sir',
        roomName: 'Chamber 101',
        sessionType: 'Major Act',
        order: 2,
      },
      {
        dayOfWeek: 'Tuesday',
        shiftId: 'shift-morning',
        startTime: '15:00',
        endTime: '16:30',
        timeFormatted: '03:00 PM - 04:30 PM',
        subject: 'Mains Daily Answer Writing (DAW)',
        topic: 'Drafting Charges & Framing of Issues workshop',
        facultyName: 'Adv. Vikramjit Singh',
        roomName: 'Chamber 104',
        sessionType: 'Minor Act',
        order: 3,
      },
      // Evening Shift
      {
        dayOfWeek: 'Tuesday',
        shiftId: 'shift-evening',
        startTime: '17:00',
        endTime: '19:00',
        timeFormatted: '05:00 PM - 07:00 PM',
        subject: 'Bhartiya Nagarik Suraksha Sanhita (BNSS)',
        topic: 'Arrest & Remand Procedures (Section 35 to 40)',
        facultyName: 'Adv. Vikramjit Singh',
        roomName: 'Chamber 101',
        sessionType: 'Major Act',
        order: 1,
      },
      {
        dayOfWeek: 'Tuesday',
        shiftId: 'shift-evening',
        startTime: '19:15',
        endTime: '20:45',
        timeFormatted: '07:15 PM - 08:45 PM',
        subject: 'Mains Daily Answer Writing (DAW)',
        topic: 'Criminal Complaint Drafting under BNSS 223',
        facultyName: 'Adv. Rajinder Sir',
        roomName: 'Chamber 104',
        sessionType: 'Minor Act',
        order: 2,
      },

      // ==================== WEDNESDAY ====================
      // Morning Shift
      {
        dayOfWeek: 'Wednesday',
        shiftId: 'shift-morning',
        startTime: '08:30',
        endTime: '10:30',
        timeFormatted: '08:30 AM - 10:30 AM',
        subject: 'Indian Evidence Act / BSA',
        topic: 'Dying Declaration & Admissions (Sec 26 to 32)',
        facultyName: 'Adv. Neha Sharma',
        roomName: 'Chamber 102',
        sessionType: 'Major Act',
        order: 1,
      },
      {
        dayOfWeek: 'Wednesday',
        shiftId: 'shift-morning',
        startTime: '11:00',
        endTime: '13:00',
        timeFormatted: '11:00 AM - 01:00 PM',
        subject: 'Constitution of India',
        topic: 'Writ Jurisdictions: Habeas Corpus & Mandamus',
        facultyName: 'Adv. Rajinder Sir',
        roomName: 'Chamber 101',
        sessionType: 'Major Act',
        order: 2,
      },
      {
        dayOfWeek: 'Wednesday',
        shiftId: 'shift-morning',
        startTime: '16:00',
        endTime: '17:30',
        timeFormatted: '04:00 PM - 05:30 PM',
        subject: 'Mentorship & 1-on-1 Doubts',
        topic: 'Case Law Citation clinic with Academic Director',
        facultyName: 'Adv. Rajinder Sir',
        roomName: 'Director Chamber',
        sessionType: 'Doubt Session',
        order: 3,
      },
      // Evening Shift
      {
        dayOfWeek: 'Wednesday',
        shiftId: 'shift-evening',
        startTime: '17:00',
        endTime: '19:00',
        timeFormatted: '05:00 PM - 07:00 PM',
        subject: 'Constitution of India',
        topic: 'Fundamental Rights & Judicial Review (Article 12-21)',
        facultyName: 'Adv. Rajinder Sir',
        roomName: 'Chamber 101',
        sessionType: 'Major Act',
        order: 1,
      },
      {
        dayOfWeek: 'Wednesday',
        shiftId: 'shift-evening',
        startTime: '19:15',
        endTime: '20:45',
        timeFormatted: '07:15 PM - 08:45 PM',
        subject: 'Indian Evidence Act / BSA',
        topic: 'Relevancy of Facts & Expert Opinions',
        facultyName: 'Adv. Neha Sharma',
        roomName: 'Chamber 102',
        sessionType: 'Major Act',
        order: 2,
      },

      // ==================== THURSDAY ====================
      // Morning Shift
      {
        dayOfWeek: 'Thursday',
        shiftId: 'shift-morning',
        startTime: '08:30',
        endTime: '10:30',
        timeFormatted: '08:30 AM - 10:30 AM',
        subject: 'Code of Civil Procedure (CPC)',
        topic: 'Execution of Decrees (Order 21 Deep Dive)',
        facultyName: 'Adv. Rajinder Sir',
        roomName: 'Chamber 101',
        sessionType: 'Major Act',
        order: 1,
      },
      {
        dayOfWeek: 'Thursday',
        shiftId: 'shift-morning',
        startTime: '11:00',
        endTime: '13:00',
        timeFormatted: '11:00 AM - 01:00 PM',
        subject: 'Specific Relief Act (SRA)',
        topic: 'Injunctions & Specific Performance of Contract',
        facultyName: 'Adv. Vikramjit Singh',
        roomName: 'Chamber 103',
        sessionType: 'Minor Act',
        order: 2,
      },
      // Evening Shift
      {
        dayOfWeek: 'Thursday',
        shiftId: 'shift-evening',
        startTime: '17:00',
        endTime: '19:00',
        timeFormatted: '05:00 PM - 07:00 PM',
        subject: 'Code of Civil Procedure (CPC)',
        topic: 'Execution of Decrees (Order 21)',
        facultyName: 'Adv. Rajinder Sir',
        roomName: 'Chamber 101',
        sessionType: 'Major Act',
        order: 1,
      },

      // ==================== FRIDAY ====================
      // Morning Shift
      {
        dayOfWeek: 'Friday',
        shiftId: 'shift-morning',
        startTime: '08:30',
        endTime: '10:30',
        timeFormatted: '08:30 AM - 10:30 AM',
        subject: 'Limitation Act, 1963',
        topic: 'Condonation of Delay (Section 5 & Legal Disability Sec 6)',
        facultyName: 'Adv. Neha Sharma',
        roomName: 'Chamber 102',
        sessionType: 'Minor Act',
        order: 1,
      },
      {
        dayOfWeek: 'Friday',
        shiftId: 'shift-morning',
        startTime: '11:00',
        endTime: '13:00',
        timeFormatted: '11:00 AM - 01:00 PM',
        subject: 'Constitution of India',
        topic: 'Basic Structure Doctrine & Judicial Review',
        facultyName: 'Adv. Rajinder Sir',
        roomName: 'Chamber 101',
        sessionType: 'Major Act',
        order: 2,
      },
      // Evening Shift
      {
        dayOfWeek: 'Friday',
        shiftId: 'shift-evening',
        startTime: '17:00',
        endTime: '19:00',
        timeFormatted: '05:00 PM - 07:00 PM',
        subject: 'Limitation Act, 1963',
        topic: 'Computation of Limitation Period & Acknowledgment',
        facultyName: 'Adv. Neha Sharma',
        roomName: 'Chamber 102',
        sessionType: 'Minor Act',
        order: 1,
      },

      // ==================== SATURDAY ====================
      // Morning Shift
      {
        dayOfWeek: 'Saturday',
        shiftId: 'shift-morning',
        startTime: '09:00',
        endTime: '12:00',
        timeFormatted: '09:00 AM - 12:00 PM',
        subject: 'All-India Prelims Mock Test',
        topic: 'Full Length 200 Questions Mock (Simulated DJS/UP PCS-J)',
        facultyName: 'Exam Cell',
        roomName: 'Main Examination Hall',
        sessionType: 'Test Series',
        order: 1,
      },
      {
        dayOfWeek: 'Saturday',
        shiftId: 'shift-morning',
        startTime: '13:00',
        endTime: '15:00',
        timeFormatted: '01:00 PM - 03:00 PM',
        subject: 'Mock Paper Post-Mortem & Analysis',
        topic: 'Line-by-line solution discussion with Rajinder Sir',
        facultyName: 'Adv. Rajinder Sir',
        roomName: 'Chamber 101',
        sessionType: 'Major Act',
        order: 2,
      },
      // Evening Shift
      {
        dayOfWeek: 'Saturday',
        shiftId: 'shift-evening',
        startTime: '16:00',
        endTime: '18:30',
        timeFormatted: '04:00 PM - 06:30 PM',
        subject: 'Mains Judgment Writing Masterclass',
        topic: 'Civil & Criminal Judgment Articulation Clinic',
        facultyName: 'Adv. Rajinder Sir',
        roomName: 'Chamber 101',
        sessionType: 'Special Lecture',
        order: 1,
      },
    ];

    const slotsToInsert = slotsToSeed.map((s) => ({
      batch: batch._id,
      shiftId: s.shiftId,
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime,
      timeFormatted: s.timeFormatted,
      subject: s.subject,
      topic: s.topic,
      faculty: facultyMap.get(s.facultyName),
      facultyName: s.facultyName,
      room: roomMap.get(s.roomName),
      roomName: s.roomName,
      sessionType: s.sessionType,
      order: s.order,
      isActive: true,
    }));

    await RecurringScheduleSlot.insertMany(slotsToInsert);
    console.log(`Seeded ${slotsToInsert.length} master weekly recurring slots for FJS-2025.`);

    // 7. Assign test student user to this batch
    const studentUser = await User.findOne({ role: 'student' });
    if (studentUser) {
      studentUser.assignedBatch = batch._id;
      studentUser.preferredShiftId = 'shift-morning';
      await studentUser.save();
      console.log(`Assigned student "${studentUser.name}" to batch FJS-2025.`);
    }

    console.log('✅ BATCH TIMETABLE & SHIFT SCHEDULE SEEDING COMPLETE!');
  } catch (error) {
    console.error('Seeding failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected.');
  }
}

seedTimetable();

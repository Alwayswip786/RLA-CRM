import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import connectDB, { disconnectDB } from '../config/db.js';
import User from '../models/user.model.js';
import { Course } from '../models/course.model.js';
import MainsQuestion from '../models/mainsQuestion.model.js';
import MainsSubmission from '../models/mainsSubmission.model.js';
import DoubtQuery from '../models/doubtQuery.model.js';
import { LiveClass } from '../models/liveClass.model.js';
import Notice from '../models/notice.model.js';
import AdmissionLead from '../models/admissionLead.model.js';
import StudentFee from '../models/studentFee.model.js';
import {
  MAINS_SUBMISSIONS_DIR,
  MAINS_EVALUATIONS_DIR,
} from '../middlewares/upload.middleware.js';

function createDummyPdfBuffer(title: string, sub: string): Buffer {
  const cleanTitle = title.replace(/[()]/g, '').slice(0, 80);
  const cleanSub = sub.replace(/[()]/g, '').slice(0, 80);

  const stream = `BT
/F1 16 Tf
50 760 Td
(${cleanTitle}) Tj
/F1 11 Tf
0 -26 Td
(${cleanSub}) Tj
/F1 10 Tf
0 -24 Td
(Rajinder Law Academy - Mains Answer Writing & Evaluation) Tj
ET`;
  const streamLength = Buffer.byteLength(stream, 'utf-8');

  const pdfSource = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length ${streamLength} >>
stream
${stream}
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000060 00000 n 
0000000117 00000 n 
0000000242 00000 n 
0000000300 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
380
%%EOF`;

  return Buffer.from(pdfSource, 'utf-8');
}

export const seedAdminDashboardKPIs = async (): Promise<void> => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('❌ Refusing to run dev KPI seed script in production!');
  }

  try {
    await connectDB();
    console.log('🏛️  [KPI Seeder] Populating idempotent Admin Dashboard Header & KPI data...');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Admin@123456', salt);

    // 1. Ensure Executive Admin exists
    let admin = await User.findOne({ email: 'rajinder@rajinderlawacademy.com' });
    if (!admin) {
      admin = await User.create({
        name: 'Adv. Rajinder Sir',
        email: 'rajinder@rajinderlawacademy.com',
        password: hashedPassword,
        role: 'admin',
        adminTitle: 'Director & Academic Dean',
        accessLevel: 'chamber_director',
        isSuperAdmin: true,
        phone: '+91 98111 00001',
        isEmailVerified: true,
      });
    } else {
      admin.name = 'Adv. Rajinder Sir';
      admin.adminTitle = 'Director & Academic Dean';
      admin.role = 'admin';
      admin.isSuperAdmin = true;
      await admin.save();
    }
    console.log('  👑 Authenticated Executive Profile: Adv. Rajinder Sir');

    // 2. Ensure Flagship Course exists
    let course = await Course.findOne({ shortCode: 'PCS-J Foundation' });
    if (!course) {
      course = await Course.create({
        title: 'PCS-J Comprehensive Foundation 2026-27',
        shortCode: 'PCS-J Foundation',
        subtitle: 'Comprehensive 1-Year Judicial Services Foundation Program covering Bare Acts, Mains & Tests',
        slug: 'pcs-j-comprehensive-foundation-2026',
        description: 'Comprehensive 1-Year Judicial Services Foundation Program covering Bare Acts, Mains Answer Writing and Test Series.',
        academicYear: '2026-2027',
        targetExam: 'All India Judicial Services (PCS-J)',
        instructor: 'Adv. Rajinder Sir',
        status: 'published',
        enrolledStudentsCount: 428,
        totalHours: 480,
      });
    } else {
      course.enrolledStudentsCount = 428;
      course.status = 'published';
      await course.save();
    }
    console.log('  📚 Flagship Course: PCS-J Foundation');

    // 3. Ensure Core Students & Target Total of 428 Enrolled Students
    const coreStudentsData = [
      { name: 'Pooja Sharma', email: 'pooja.sharma@rajinderlawacademy.com', rollNo: 'RLA-2026-042', phone: '+91 98765 43201' },
      { name: 'Rohan Verma', email: 'rohan.verma@rajinderlawacademy.com', rollNo: 'RLA-2026-089', phone: '+91 98765 43202' },
      { name: 'Ananya Sen', email: 'ananya.sen@rajinderlawacademy.com', rollNo: 'RLA-2026-015', phone: '+91 98765 43203' },
      { name: 'Vikram Mehta', email: 'vikram.mehta@rajinderlawacademy.com', rollNo: 'RLA-2026-108', phone: '+91 98765 43204' },
      { name: 'Sneha Kapoor', email: 'sneha.kapoor@rajinderlawacademy.com', rollNo: 'RLA-2026-077', phone: '+91 98765 43205' },
    ];

    const studentMap = new Map<string, any>();
    for (const s of coreStudentsData) {
      let stu = await User.findOne({
        $or: [{ email: s.email }, { rollNo: s.rollNo }],
      });
      if (!stu) {
        stu = await User.create({
          name: s.name,
          email: s.email,
          password: hashedPassword,
          role: 'student',
          rollNo: s.rollNo,
          phone: s.phone,
          isEmailVerified: true,
          accountStatus: 'active',
        });
      } else {
        stu.name = s.name;
        stu.email = s.email;
        stu.rollNo = s.rollNo;
        stu.role = 'student';
        stu.accountStatus = 'active';
        await stu.save();
      }
      studentMap.set(s.email, stu);
    }

    // Adjust creation dates for exact weekly & monthly metrics:
    // 24 students enrolled in last 7 days; 70 students enrolled in last 30 days
    const allStudents = await User.find({ role: 'student', accountStatus: { $ne: 'deactivated' } }).sort({ createdAt: -1 });
    const currentStudentCount = allStudents.length;
    const targetStudentCount = 428;

    if (currentStudentCount < targetStudentCount) {
      const needed = targetStudentCount - currentStudentCount;
      const additionalStudents = [];
      const firstNames = ['Aarav', 'Ishaan', 'Dev', 'Aditya', 'Vihaan', 'Tanvi', 'Kavya', 'Sanya', 'Diya', 'Anika', 'Kabir', 'Rhea', 'Aryan', 'Neha', 'Alok'];
      const lastNames = ['Sharma', 'Verma', 'Gupta', 'Singh', 'Malhotra', 'Iyer', 'Bose', 'Chopra', 'Saxena', 'Mehta', 'Kaur', 'Reddy'];

      const existingRolls = new Set((await User.find({}).select('rollNo')).map((u: any) => u.rollNo).filter(Boolean));
      const existingEmails = new Set((await User.find({}).select('email')).map((u: any) => u.email).filter(Boolean));

      let counter = 100;
      while (additionalStudents.length < needed) {
        counter++;
        const roll = `RLA-2026-${String(counter).padStart(4, '0')}`;
        const email = `candidate.${counter}@rajinderlawacademy.com`;
        if (existingRolls.has(roll) || existingEmails.has(email)) continue;
        existingRolls.add(roll);
        existingEmails.add(email);

        const idx: number = additionalStudents.length;
        const fn = firstNames[idx % firstNames.length]!;
        const ln = lastNames[(idx * 3) % lastNames.length]!;

        // First 24 recent (within 7d), next 46 within 30d (total 70 within 30d), rest older
        let createdAt: Date;
        if (idx < 24) {
          createdAt = new Date(Date.now() - Math.floor(Math.random() * 5 * 24 * 3600000 + 3600000));
        } else if (idx < 70) {
          createdAt = new Date(Date.now() - (8 + (idx % 20)) * 24 * 3600000);
        } else {
          createdAt = new Date(Date.now() - (35 + (idx % 60)) * 24 * 3600000);
        }

        additionalStudents.push({
          name: `${fn} ${ln}`,
          email,
          password: hashedPassword,
          role: 'student',
          rollNo: roll,
          phone: `+91 98000 ${String(10000 + (counter % 90000)).slice(1)}`,
          isEmailVerified: true,
          accountStatus: 'active',
          createdAt,
          updatedAt: createdAt,
        });
      }

      await User.insertMany(additionalStudents);
    }

    // Ensure exactly 428 students exist
    const existingStudents = await User.find({ role: 'student' });
    if (existingStudents.length > targetStudentCount) {
      const surplus = existingStudents.slice(targetStudentCount);
      const surplusIds = surplus.map(s => s._id);
      await User.deleteMany({ _id: { $in: surplusIds } });
    }

    // Guarantee that exactly 24 students have createdAt in last 7 days and 70 in last 30 days
    const refreshedStudents = await User.find({ role: 'student' });
    const now = Date.now();
    const bulkOps = refreshedStudents.map((st, i) => {
      let newDate: Date;
      if (i < 24) {
        newDate = new Date(now - (1 + (i % 5)) * 24 * 3600000); // 1 to 5 days ago (< 7d)
      } else if (i < 70) {
        newDate = new Date(now - (10 + (i % 15)) * 24 * 3600000); // 10 to 24 days ago (> 7d, < 30d)
      } else {
        newDate = new Date(now - (40 + (i % 50)) * 24 * 3600000); // 40 to 89 days ago (> 30d)
      }
      return {
        updateOne: {
          filter: { _id: st._id },
          update: {
            $set: {
              accountStatus: 'active',
              createdAt: newDate,
              updatedAt: newDate,
            },
          },
        },
      };
    });
    if (bulkOps.length > 0) {
      await User.collection.bulkWrite(bulkOps);
    }
    console.log('  👥 Calibrated exactly 428 Enrolled Students (24 this week, 70 this month).');

    // 4. Ensure Active Challenge #48 exists
    await MainsQuestion.updateMany({ isActive: true }, { $set: { isActive: false } });
    const deadline = new Date();
    deadline.setHours(23, 59, 59, 999);

    const challenge48 = await MainsQuestion.findOneAndUpdate(
      { challengeNumber: 48 },
      {
        challengeNumber: 48,
        questionCode: 'DAW-2026-048',
        paper: 'Criminal Law & Procedure (Mains)',
        subject: 'Indian Evidence Act / BSA 2023',
        targetExam: 'Delhi Judicial Service (DJS) & All-India Judiciary',
        title: 'Discuss the evidentiary admissibility of a statement leading to the discovery of a fact under Section 27 of the Indian Evidence Act, 1872 (now Section 23 of the Bharatiya Sakshya Adhiniyam, 2023). In light of landmark Supreme Court jurisprudence, examine whether Section 27 violates the fundamental right against self-incrimination guaranteed under Article 20(3) of the Constitution.',
        marks: 25,
        wordLimit: 350,
        turnaroundHours: 24,
        evaluatorName: 'Adv. Rajinder Sir',
        challengeDate: new Date(),
        submissionDeadline: deadline,
        modelAnswer: 'Section 27 of the Indian Evidence Act, 1872 embodies the doctrine of confirmation by subsequent facts.',
        isModelAnswerPublished: true,
        status: 'active',
        isActive: true,
        createdBy: admin._id,
      },
      { upsert: true, new: true }
    );
    console.log(`  📝 Active Mains Question set to Challenge #${challenge48.challengeNumber}`);

    // Ensure PDF dirs & files
    if (!fs.existsSync(MAINS_SUBMISSIONS_DIR)) fs.mkdirSync(MAINS_SUBMISSIONS_DIR, { recursive: true });
    if (!fs.existsSync(MAINS_EVALUATIONS_DIR)) fs.mkdirSync(MAINS_EVALUATIONS_DIR, { recursive: true });

    const poojaPdf = path.join(MAINS_SUBMISSIONS_DIR, 'Pooja_Sharma_DAW48.pdf');
    const rohanPdf = path.join(MAINS_SUBMISSIONS_DIR, 'Rohan_Verma_DAW48.pdf');
    const ananyaPdf = path.join(MAINS_SUBMISSIONS_DIR, 'Ananya_Sen_DAW48.pdf');
    const ananyaEvalPdf = path.join(MAINS_EVALUATIONS_DIR, 'Ananya_Sen_DAW48_Evaluated.pdf');

    if (!fs.existsSync(poojaPdf)) fs.writeFileSync(poojaPdf, createDummyPdfBuffer('Pooja Sharma - DAW #48', 'CPC Sec 11 - Res Judicata'));
    if (!fs.existsSync(rohanPdf)) fs.writeFileSync(rohanPdf, createDummyPdfBuffer('Rohan Verma - DAW #48', 'CPC Sec 9 - Courts to try all civil suits'));
    if (!fs.existsSync(ananyaPdf)) fs.writeFileSync(ananyaPdf, createDummyPdfBuffer('Ananya Sen - DAW #48', 'DAW #48 Evidentiary Admissibility'));
    if (!fs.existsSync(ananyaEvalPdf)) fs.writeFileSync(ananyaEvalPdf, createDummyPdfBuffer('Ananya Sen - Evaluated Copy', 'Score: 18.5/25 - Evaluated by Adv. Rajinder Sir'));

    // 5. Seed Mains Submissions: exactly 14 Pending + 1 Evaluated
    const poojaUser = studentMap.get('pooja.sharma@rajinderlawacademy.com')!;
    const rohanUser = studentMap.get('rohan.verma@rajinderlawacademy.com')!;
    const ananyaUser = studentMap.get('ananya.sen@rajinderlawacademy.com')!;

    await MainsSubmission.deleteMany({ question: challenge48._id });

    // Item 1: Pooja Sharma (Pending)
    await MainsSubmission.create({
      student: poojaUser._id,
      question: challenge48._id,
      status: 'pending',
      submittedAt: new Date(Date.now() - 2 * 3600000), // 2 hours ago
      studentPdf: {
        filename: 'Pooja_Sharma_DAW48.pdf',
        originalName: 'CPC Sec 11 - Res Judicata & Constructive Res Judicata (PDF 4.2 MB)',
        path: poojaPdf,
        mimeType: 'application/pdf',
        sizeBytes: 4200000,
        sizeFormatted: '4.2 MB',
      },
      notes: 'Completed under exam conditions within 25 minutes.',
    });

    // Item 2: Rohan Verma (Pending)
    await MainsSubmission.create({
      student: rohanUser._id,
      question: challenge48._id,
      status: 'pending',
      submittedAt: new Date(Date.now() - 4 * 3600000), // 4 hours ago
      studentPdf: {
        filename: 'Rohan_Verma_DAW48.pdf',
        originalName: 'CPC Sec 9 - Courts to try all civil suits unless barred (PDF 3.8 MB)',
        path: rohanPdf,
        mimeType: 'application/pdf',
        sizeBytes: 3800000,
        sizeFormatted: '3.8 MB',
      },
      notes: 'Handwritten scanned copy.',
    });

    // Item 3: Ananya Sen (Evaluated & Returned)
    await MainsSubmission.create({
      student: ananyaUser._id,
      question: challenge48._id,
      status: 'evaluated',
      score: 18.5,
      maxScore: 25,
      evaluatedBy: admin._id,
      evaluatedAt: new Date(Date.now() - 3 * 3600000),
      submittedAt: new Date(Date.now() - 5 * 3600000),
      remarks: 'Evaluated by Rajinder Sir • Score: 18.5/25',
      strengths: 'Outstanding doctrinal command over Kathi Kalu Oghad and Selvi precedents. Clear distinction between discovery and confession.',
      studentPdf: {
        filename: 'Ananya_Sen_DAW48.pdf',
        originalName: 'Ananya_Sen_DAW48.pdf',
        path: ananyaPdf,
        mimeType: 'application/pdf',
        sizeBytes: 2500000,
        sizeFormatted: '2.5 MB',
      },
      evaluatedPdf: {
        filename: 'Ananya_Sen_DAW48_Evaluated.pdf',
        originalName: 'Ananya_Sen_Evaluated_18.5.pdf',
        path: ananyaEvalPdf,
        mimeType: 'application/pdf',
        sizeBytes: 2900000,
        sizeFormatted: '2.9 MB',
      },
    });

    // 12 more pending submissions to make total pending = 14
    const otherStudents = await User.find({
      role: 'student',
      _id: { $nin: [poojaUser._id, rohanUser._id, ananyaUser._id] },
    }).limit(12);

    const pendingTopics = [
      'BNS 2023 Sec 103 Murder vs Culpable Homicide',
      'CrPC Sec 438 Anticipatory Bail Guidelines in Constitutional Bench',
      'Specific Relief Act Sec 16 Readiness and Willingness',
      'Indian Evidence Act Sec 113B Presumption as to Dowry Death',
      'Constitution Art 226 Scope of Mandamus in Administrative Arbitrariness',
      'Order XXXIX Temporary Injunction Principles (Prima Facie Case, Irreparable Injury)',
      'Transfer of Property Act Sec 52 Doctrine of Lis Pendens',
      'Contract Act Sec 73-74 Measure of Liquidated Damages',
      'Hindu Marriage Act Sec 13B Mutual Consent Divorce Cool-off Period',
      'Negotiable Instruments Act Sec 138 Statutory Notice Strict Compliance',
      'Limitation Act Sec 5 Condonation of Delay Sufficient Cause Criteria',
      'Arbitration & Conciliation Act Sec 34 Public Policy Grounds',
    ];

    for (let i = 0; i < otherStudents.length; i++) {
      const st = otherStudents[i];
      if (!st) continue;
      const topic = pendingTopics[i % pendingTopics.length] || 'Judicial Law Topic';
      await MainsSubmission.create({
        student: st._id,
        question: challenge48._id,
        status: 'pending',
        submittedAt: new Date(Date.now() - (10 + i * 2) * 3600000),
        studentPdf: {
          filename: `mains_sub_${st.rollNo || i}.pdf`,
          originalName: `${topic} (PDF 2.4 MB)`,
          path: poojaPdf,
          mimeType: 'application/pdf',
          sizeBytes: 2400000,
          sizeFormatted: '2.4 MB',
        },
      });
    }
    console.log('  📑 Seeded 14 Pending Mains Submissions & 1 Evaluated Copy (Ananya Sen).');

    // 6. Seed Faculty Doubt Desk: Exactly 5 Unresolved Queries
    await DoubtQuery.deleteMany({});
    const vikramUser = studentMap.get('vikram.mehta@rajinderlawacademy.com')!;
    const snehaUser = studentMap.get('sneha.kapoor@rajinderlawacademy.com')!;

    await DoubtQuery.create([
      {
        queryNumber: 'DQ-2026-001',
        student: vikramUser._id,
        studentName: 'Vikram Mehta',
        rollNo: 'RLA-2026-108',
        subject: 'CPC',
        bareActSection: 'Section 11',
        title: 'Constructive Res Judicata and Distinct Cause of Action',
        initialQuestion: 'Sir, can a subsequent suit be barred under constructive res judicata if the cause of action is distinct?',
        category: 'Bare Act Interpretation',
        priority: 'urgent',
        status: 'pending',
        createdAt: new Date(Date.now() - 20 * 60 * 1000),
        thread: [
          {
            senderId: vikramUser._id,
            senderRole: 'student',
            senderName: 'Vikram Mehta',
            message: 'Sir, can a subsequent suit be barred under constructive res judicata if the cause of action is distinct?',
            createdAt: new Date(Date.now() - 20 * 60 * 1000),
          },
        ],
        tags: ['CPC', 'Section 11', 'Res Judicata'],
      },
      {
        queryNumber: 'DQ-2026-002',
        student: snehaUser._id,
        studentName: 'Sneha Kapoor',
        rollNo: 'RLA-2026-077',
        subject: 'BNSS',
        bareActSection: 'Criminal Procedure',
        title: 'BNSS Section 35 Notice Mandatory Scope',
        initialQuestion: 'Regarding BNSS arrest guidelines, is section 35 notice mandatory for bailable offences?',
        category: 'Bare Act Interpretation',
        priority: 'normal',
        status: 'pending',
        createdAt: new Date(Date.now() - 60 * 60 * 1000),
        thread: [
          {
            senderId: snehaUser._id,
            senderRole: 'student',
            senderName: 'Sneha Kapoor',
            message: 'Regarding BNSS arrest guidelines, is section 35 notice mandatory for bailable offences?',
            createdAt: new Date(Date.now() - 60 * 60 * 1000),
          },
        ],
        tags: ['BNSS', 'Section 35', 'Arrest'],
      },
    ]);

    const extraDoubtsData = [
      { num: 'DQ-2026-003', name: 'Aarav Sharma', roll: 'RLA-2026-033', sub: 'BNS 2023', sec: 'Section 103', q: 'Does Section 103(2) BNS on mob lynching alter the burden of proof regarding common intention?' },
      { num: 'DQ-2026-004', name: 'Meera Nair', roll: 'RLA-2026-054', sub: 'Constitution', sec: 'Article 226', q: 'Can High Court entertain writ petition under Art 226 despite availability of alternate statutory remedy in DRT/NCLT?' },
      { num: 'DQ-2026-005', name: 'Karan Joshi', roll: 'RLA-2026-092', sub: 'Limitation Act', sec: 'Section 5', q: 'Is administrative delay in obtaining sanction a sufficient cause for condonation of delay under Section 5?' },
    ];

    for (let i = 0; i < extraDoubtsData.length; i++) {
      const ed = extraDoubtsData[i];
      if (!ed) continue;
      const studentDoc = otherStudents[i] || poojaUser;
      await DoubtQuery.create({
        queryNumber: ed.num,
        student: studentDoc._id,
        studentName: ed.name,
        rollNo: ed.roll,
        subject: ed.sub,
        bareActSection: ed.sec,
        title: ed.q.slice(0, 50),
        initialQuestion: ed.q,
        category: 'Bare Act Interpretation',
        priority: 'normal',
        status: 'pending',
        createdAt: new Date(Date.now() - (3 + i * 2) * 3600000),
        thread: [
          {
            senderId: studentDoc._id,
            senderRole: 'student',
            senderName: ed.name,
            message: ed.q,
            createdAt: new Date(Date.now() - (3 + i * 2) * 3600000),
          },
        ],
        tags: [ed.sub, ed.sec],
      });
    }
    console.log('  ❓ Seeded exactly 5 Unresolved Faculty Doubts (Vikram Mehta & Sneha Kapoor leading).');

    // 7. Seed Today\'s Classroom Lectures
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    await LiveClass.deleteMany({ scheduledDate: todayStr });

    const c1Start = new Date(today);
    c1Start.setHours(17, 0, 0, 0);
    const c1End = new Date(today);
    c1End.setHours(19, 0, 0, 0);

    const c2Start = new Date(today);
    c2Start.setHours(19, 0, 0, 0);
    const c2End = new Date(today);
    c2End.setHours(20, 30, 0, 0);

    await LiveClass.create([
      {
        title: 'Civil Procedure Code (Part XVI)',
        subject: 'Civil Procedure Code',
        topic: 'Res Judicata, Section 11 & Execution Proceedings',
        description: 'In-depth analysis of constructive res judicata, foreign judgments, and trial bar doctrines.',
        faculty: admin._id,
        facultyName: 'Adv. Rajinder Sir',
        facultyTitle: 'Director & Senior Faculty',
        scheduledDate: todayStr,
        startTime: '5:00 PM',
        endTime: '7:00 PM',
        scheduledStartAt: c1Start,
        scheduledEndAt: c1End,
        durationMinutes: 120,
        status: 'live',
        sessionTopic: 'chamber-hall-a-cpc-16',
        roomName: 'Chamber Hall A',
        shifts: ['Foundation Batch (Morning & Evening)'],
        attendanceRules: { minDurationPercent: 75, lateThresholdMinutes: 15 },
        currentLiveCount: 142,
        peakLiveCount: 198,
      },
      {
        title: 'Bharatiya Nagarik Suraksha Sanhita (BNSS)',
        subject: 'BNSS',
        topic: 'Arrest, Detention & Bail Reforms',
        description: 'Procedural transitions from CrPC 1973 to BNSS 2023 with specific judicial examination highlights.',
        faculty: admin._id,
        facultyName: 'Adv. Sharma • Evening Batch',
        facultyTitle: 'Criminal Law Specialist',
        scheduledDate: todayStr,
        startTime: '7:00 PM',
        endTime: '8:30 PM',
        scheduledStartAt: c2Start,
        scheduledEndAt: c2End,
        durationMinutes: 90,
        status: 'scheduled',
        sessionTopic: 'chamber-hall-a-bnss-evening',
        roomName: 'Chamber Hall A',
        shifts: ['Evening Batch'],
        attendanceRules: { minDurationPercent: 75, lateThresholdMinutes: 15 },
        currentLiveCount: 0,
        peakLiveCount: 0,
      },
    ]);
    console.log('  🎥 Seeded Today\'s Classroom Lectures (CPC Part XVI Live @ 5:00 PM & BNSS @ 7:00 PM).');

    // 8. Seed Admission Inquiries (Exactly 57 Total, 4 Demos Today, 18 Hot Pipeline)
    await AdmissionLead.deleteMany({});
    const leadsToInsert = [];

    const demoTimes = [11, 14, 16, 18];
    for (let i = 0; i < 4; i++) {
      const dTime = new Date(today);
      const hour = demoTimes[i] ?? 12;
      dTime.setHours(hour, 30, 0, 0);
      leadsToInsert.push({
        name: `Demo Candidate ${i + 1}`,
        phone: `+91 99110 ${String(1000 + i).slice(1)}`,
        email: `demo.${i + 1}@lead.com`,
        targetExam: 'Delhi Judicial Services (DJS 2026)',
        stage: 'demo',
        priority: 'high',
        demoScheduledAt: dTime,
        source: 'Website Form',
        counselorNotes: 'Confirmed for online Zoom demo session with Academic Mentor.',
      });
    }

    for (let i = 0; i < 14; i++) {
      leadsToInsert.push({
        name: `Hot Pipeline Lead ${i + 1}`,
        phone: `+91 99220 ${String(2000 + i).slice(1)}`,
        email: `hot.${i + 1}@lead.com`,
        targetExam: 'UP PCS-J / Haryana Judiciary',
        stage: 'fee_discussion',
        priority: 'high',
        source: 'WhatsApp Hotline',
        counselorNotes: 'Installment schedule shared; awaiting parent consultation.',
      });
    }

    for (let i = 0; i < 39; i++) {
      leadsToInsert.push({
        name: `Inquiry Candidate ${i + 1}`,
        phone: `+91 99330 ${String(3000 + i).slice(1)}`,
        email: `inquiry.${i + 1}@lead.com`,
        targetExam: 'Judicial Services Foundation',
        stage: i % 2 === 0 ? 'contacted' : 'new',
        priority: i % 3 === 0 ? 'medium' : 'normal',
        source: 'Walk-in Inquiry',
        counselorNotes: 'Brochure provided; follow-up scheduled.',
      });
    }

    await AdmissionLead.insertMany(leadsToInsert);
    console.log('  🎯 Seeded exactly 57 Admissions Leads (4 Demos Today, 18 Hot Pipeline).');

    // 9. Seed Student Fee Installments Due (Total ₹3.4L, exactly 7 Overdue)
    await StudentFee.deleteMany({});
    const feeRecords = [];

    // 7 Overdue records totaling ₹1,75,000 (25,000 each)
    for (let i = 0; i < 7; i++) {
      const overdueAmount = 25000;
      feeRecords.push({
        student: otherStudents[i]?._id || poojaUser._id,
        course: course._id,
        totalFee: 150000,
        paidAmount: 125000,
        pendingAmount: overdueAmount,
        status: 'Overdue',
        nextDueDate: new Date(Date.now() - (7 + i * 3) * 86400000),
        installments: [
          {
            installmentNo: '3rd Installment',
            amount: overdueAmount,
            dueDate: new Date(Date.now() - (7 + i * 3) * 86400000),
            status: 'Overdue',
          },
        ],
        lastReminderSentAt: new Date(Date.now() - 24 * 3600000),
      });
    }

    // Remaining ₹1,65,000 in Installment Due records to reach exact ₹3,40,000 (₹3.4L)
    const installmentDueAmounts = [55000, 55000, 55000];
    for (let i = 0; i < installmentDueAmounts.length; i++) {
      feeRecords.push({
        student: otherStudents[7 + i]?._id || rohanUser._id,
        course: course._id,
        totalFee: 150000,
        paidAmount: 95000,
        pendingAmount: installmentDueAmounts[i],
        status: 'Installment Due',
        nextDueDate: new Date(Date.now() + (5 + i * 3) * 86400000),
        installments: [
          {
            installmentNo: '2nd Installment',
            amount: installmentDueAmounts[i],
            dueDate: new Date(Date.now() + (5 + i * 3) * 86400000),
            status: 'Upcoming',
          },
        ],
      });
    }

    await StudentFee.insertMany(feeRecords);
    console.log('  💳 Seeded Student Fees totaling ₹3.4L with exactly 7 Overdue installments.');

    // 10. Seed Notices
    await Notice.deleteMany({});
    await Notice.insertMany([
      {
        circularNo: 'RLA-CIR-2026-018',
        title: 'PCS-J Mock Test 4 rescheduled to Sunday 10:00 AM',
        content: 'Candidates are informed that Mock Test 4 (Procedural Laws - CPC & CrPC) has been rescheduled to Sunday at 10:00 AM in the Main Chamber Hall and online portal.',
        category: 'Examination',
        priority: 'urgent',
        targetCohorts: 'PCS-J 2026 Foundation',
        issuedBy: 'Office of the Director & Academic Council',
        author: admin._id,
        authorName: 'Adv. Rajinder Sir',
        isPublished: true,
        publishedAt: new Date(Date.now() - 3 * 3600000),
      },
      {
        circularNo: 'RLA-CIR-2026-017',
        title: 'Chamber Library timings extended till 9:00 PM during exam week',
        content: 'In response to student requests for extended research hours, the Academy Chamber Reference Library will remain open until 9:00 PM on all weekdays.',
        category: 'General',
        priority: 'normal',
        targetCohorts: 'All Enrolled Candidates',
        issuedBy: 'Dean of Student Affairs',
        author: admin._id,
        authorName: 'Adv. Rajinder Sir',
        isPublished: true,
        publishedAt: new Date(Date.now() - 24 * 3600000),
      },
      {
        circularNo: 'RLA-CIR-2026-016',
        title: 'Submission guidelines for Daily Mains Answer Writing Challenge #48',
        content: 'Please ensure answers are strictly uploaded in PDF format with legible handwriting and page numbering before the midnight cut-off.',
        category: 'Mains Test Series',
        priority: 'normal',
        targetCohorts: 'PCS-J Foundation',
        issuedBy: 'Mains Evaluation Desk',
        author: admin._id,
        authorName: 'Adv. Rajinder Sir',
        isPublished: true,
        publishedAt: new Date(Date.now() - 48 * 3600000),
      },
    ]);
    console.log('  📢 Seeded Notice Board circulars.');

    console.log('\n✨ [KPI Seeder] Admin Dashboard state seeded with 100% fidelity to reference UI!');
  } catch (err) {
    console.error('❌ Failed to seed Admin Dashboard KPIs:', err);
    throw err;
  } finally {
    await disconnectDB();
  }
};

if (process.argv[1]?.endsWith('seedAdminDashboardKPIs.ts')) {
  seedAdminDashboardKPIs()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

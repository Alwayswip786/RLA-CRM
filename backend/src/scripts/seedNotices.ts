import Notice from '../models/notice.model.js';
import User from '../models/user.model.js';
import connectDB, { disconnectDB } from '../config/db.js';

export const seedInitialNotices = async (): Promise<void> => {
  try {
    const director = await User.findOne({ role: 'admin' });
    const authorId = director?._id;
    const authorName = director?.name || 'Adv. Rajinder Sir';

    const defaultNotices = [
      {
        circularNo: 'RLA/CIR/2026/048',
        title: 'Delhi Judicial Service (DJS) 2026 Notification Released – 124 Vacancies',
        category: 'Examination' as const,
        priority: 'urgent' as const,
        targetCohorts: 'All Enrolled Batches',
        targetExam: 'Delhi Judicial Service (DJS)',
        issuedBy: 'Director Office, Rajinder Law Academy',
        author: authorId,
        authorName,
        isPublished: true,
        publishedAt: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
        content:
          'The High Court of Delhi has officially published the competitive examination notification for 124 vacancies in the Delhi Judicial Service (DJS) 2026. Aspirants are advised to register immediately on the official High Court portal before the deadline.\n\nRajinder Law Academy will conduct intensive Prelims Mock Drills every Saturday at 10:00 AM, accompanied by Daily Answer Writing (DAW) sessions for Civil & Criminal Law in Chamber Hall A. Attendance is strictly compulsory for all registered aspirants.',
      },
      {
        circularNo: 'RLA/CIR/2026/047',
        title: 'Evening Shift CPC & Evidence Act Timing Adjusted for Live Interactive Bare Act Workshop',
        category: 'Classroom Timetable' as const,
        priority: 'normal' as const,
        targetCohorts: 'Evening Shift (Cohort B)',
        targetExam: 'All Judicial Aspirants',
        issuedBy: 'Academic Dean, Rajinder Law Academy',
        author: authorId,
        authorName,
        isPublished: true,
        publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3 hours ago
        content:
          'Please note that today\'s lecture on the Code of Civil Procedure (CPC) and Indian Evidence Act will commence at 05:00 PM sharp in Chamber Hall A.\n\nAdv. Rajinder Sir will conduct an interactive Bare Act interpretation session covering Sections 9 through 11 and Order II. Keep your annotated bare acts, highlighters, and procedural drafting notebooks ready before entering the lecture hall.',
      },
      {
        circularNo: 'RLA/CIR/2026/046',
        title: 'Daily Mains Answer Writing (DAW) Challenge #48 Model Answers Uploaded in Vault',
        category: 'Mains Test Series' as const,
        priority: 'normal' as const,
        targetCohorts: 'All Enrolled Batches',
        targetExam: 'All Judicial Aspirants',
        issuedBy: 'Faculty Evaluation Cell, Rajinder Law Academy',
        author: authorId,
        authorName: 'Prof. Ananya Sharma',
        isPublished: true,
        publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
        content:
          'Evaluated copies and benchmark model answers for DAW Challenge #48 (Topics: Res Judicata, Inherent Powers of Court u/s 151 CPC, and Dying Declarations) have been uploaded to the student portal vault.\n\nStudents scoring below 60% are requested to attend the mandatory personal evaluation clinic with Prof. Ananya Sharma on Thursday from 02:00 PM to 04:00 PM.',
      },
      {
        circularNo: 'RLA/CIR/2026/045',
        title: 'High Court Autumn Recess & Offline Library Turnstile 24/7 Biometric Access Guidelines',
        category: 'Holiday' as const,
        priority: 'normal' as const,
        targetCohorts: 'All Enrolled Batches',
        targetExam: 'All Judicial Aspirants',
        issuedBy: 'Campus Administration, Rajinder Law Academy',
        author: authorId,
        authorName,
        isPublished: true,
        publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
        content:
          'Regular offline lecture sessions will remain suspended from 14th to 17th October on account of the High Court Autumn Recess.\n\nHowever, the Academy Judicial Reference Library, Air-Conditioned Study Chambers, and Biometric Turnstiles will remain accessible 24/7. Your dynamic digital student QR pass will continue to operate the automated entry gates without restriction.',
      },
    ];

    for (const noticeData of defaultNotices) {
      const exists = await Notice.findOne({ circularNo: noticeData.circularNo });
      if (!exists) {
        await Notice.create(noticeData);
        console.log(`📢 Notice Seeded: [${noticeData.circularNo}] ${noticeData.title}`);
      }
    }
  } catch (error) {
    console.error('⚠️ Error during notices seeding:', error);
  }
};

// Standalone execution support
if (process.argv[1]?.endsWith('seedNotices.ts') || process.argv[1]?.endsWith('seedNotices.js')) {
  (async () => {
    await connectDB();
    await seedInitialNotices();
    await disconnectDB();
    process.exit(0);
  })();
}

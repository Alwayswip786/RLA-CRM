import bcrypt from 'bcryptjs';
import User from '../models/user.model.js';
import connectDB, { disconnectDB } from '../config/db.js';

export const seedInitialAdmin = async (): Promise<void> => {
  try {
    const defaultPassword = 'Judicial@2025';
    const hashedPassword = await bcrypt.hash(defaultPassword, 12);

    // 1. Director & Academic Dean (Executive Admin)
    const directorEmail = 'director@rajinderlawacademy.com';
    const directorExists = await User.findOne({ email: directorEmail });
    if (!directorExists) {
      await User.create({
        rollNo: 'RLA-DIR-001',
        salutation: 'Adv.',
        name: 'Adv. Rajinder Sir',
        email: directorEmail,
        password: hashedPassword,
        role: 'admin',
        isEmailVerified: true,
        isPhoneVerified: true,
        needsOnboarding: false,
        themePreference: 'dark',
        accountStatus: 'active',
        targetExam: 'All-India Judicial Services',
        targetState: 'Delhi / NCR',
      });
      console.log('🏛️ Director Account Seeded: director@rajinderlawacademy.com (Pass: Judicial@2025)');
    }

    // 2. Senior Faculty & Mains Evaluator (Faculty)
    const facultyEmail = 'faculty@rajinderlawacademy.com';
    const facultyExists = await User.findOne({ email: facultyEmail });
    if (!facultyExists) {
      await User.create({
        rollNo: 'RLA-FAC-001',
        salutation: 'Dr.',
        name: 'Prof. Ananya Sharma',
        email: facultyEmail,
        password: hashedPassword,
        role: 'faculty',
        isEmailVerified: true,
        isPhoneVerified: true,
        needsOnboarding: false,
        themePreference: 'dark',
        accountStatus: 'active',
        targetExam: 'Delhi Judicial Service (DJS)',
        targetState: 'Delhi / NCR',
      });
      console.log('🏛️ Faculty Account Seeded: faculty@rajinderlawacademy.com (Pass: Judicial@2025)');
    }

    // 3. Enrolled Full-Time Aspirant (Student - Onboarded)
    const student1Email = 'rohit.verma@rajinderlawacademy.com';
    const student1Exists = await User.findOne({ $or: [{ email: student1Email }, { rollNo: 'RLA20260001' }] });
    if (!student1Exists) {
      await User.create({
        rollNo: 'RLA20260001',
        salutation: 'Adv.',
        name: 'Adv. Rohit Verma',
        email: student1Email,
        phone: '9876543210',
        password: hashedPassword,
        role: 'student',
        isEmailVerified: true,
        isPhoneVerified: true,
        needsOnboarding: false,
        themePreference: 'light',
        accountStatus: 'active',
        targetExam: 'Delhi Judicial Service (DJS)',
        targetState: 'Delhi / NCR',
        targetYear: '2025-2026',
        academicStatus: 'Full-Time Aspirant',
      });
      console.log('🎓 Enrolled Student Seeded: rohit.verma@rajinderlawacademy.com | RLA20260001 (Pass: Judicial@2025)');
    }

    // 4. Fresh Aspirant (Student - Needs Onboarding)
    const student2Email = 'pooja.deshmukh@rajinderlawacademy.com';
    const student2Exists = await User.findOne({ $or: [{ email: student2Email }, { rollNo: 'RLA20260002' }] });
    if (!student2Exists) {
      await User.create({
        rollNo: 'RLA20260002',
        salutation: 'Ms.',
        name: 'Pooja Deshmukh',
        email: student2Email,
        phone: '9812345678',
        password: hashedPassword,
        role: 'student',
        isEmailVerified: true,
        isPhoneVerified: true,
        needsOnboarding: true,
        themePreference: 'dark',
        accountStatus: 'active',
        targetExam: 'UP PCS (Judicial)',
        targetState: 'Uttar Pradesh',
        targetYear: '2026-2027',
        academicStatus: 'Class 12 Student',
      });
      console.log('🎓 Fresh Student Seeded: pooja.deshmukh@rajinderlawacademy.com | RLA20260002 (Pass: Judicial@2025)');
    }
  } catch (error) {
    console.error('⚠️ Error during accounts seeding:', error);
  }
};

// Standalone execution support
if (process.argv[1]?.endsWith('seedAdmin.ts') || process.argv[1]?.endsWith('seedAdmin.js')) {
  (async () => {
    await connectDB();
    await seedInitialAdmin();
    await disconnectDB();
    process.exit(0);
  })();
}

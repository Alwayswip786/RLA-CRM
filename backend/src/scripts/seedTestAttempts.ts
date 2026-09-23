import User from '../models/user.model.js';
import TestAttempt from '../models/testAttempt.model.js';
import connectDB, { disconnectDB } from '../config/db.js';

export const DEMO_TEST_ATTEMPTS = [
  {
    testTitle: 'Delhi Judiciary (DJS) Prelims Mock 03',
    testType: 'mock_series' as const,
    targetExam: 'Delhi Judicial Service',
    score: 168.75,
    maxScore: 200,
    rank: 14,
    totalAspirants: 1240,
    percentile: 98.4,
    correct: 174,
    incorrect: 21,
    unattempted: 5,
    accuracy: 89.2,
    avgTimePerMcq: 42,
    negativeMarks: 5.25,
    timeSpentMinutes: 120,
    attemptedAt: new Date('2025-09-08T10:00:00Z'),
  },
  {
    testTitle: 'UP PCS-J Full Length Paper 2',
    testType: 'mock_series' as const,
    targetExam: 'UP PCS-J Examination',
    score: 128.5,
    maxScore: 150,
    rank: 28,
    totalAspirants: 1240,
    percentile: 96.1,
    correct: 132,
    incorrect: 11,
    unattempted: 7,
    accuracy: 92.3,
    avgTimePerMcq: 45,
    negativeMarks: 3.63,
    timeSpentMinutes: 110,
    attemptedAt: new Date('2025-09-01T10:00:00Z'),
  },
];

export const seedTestAttempts = async () => {
  try {
    await connectDB();
    console.log('⚡ Connecting to database for test attempts seeding...');

    // Find demo student Rohit Verma
    let student = await User.findOne({ email: 'rohit.verma@rajinderlawacademy.com' });
    if (!student) {
      student = await User.findOne({ role: 'student' });
    }

    if (!student) {
      console.warn('⚠️ No student account found to seed test attempts.');
      return;
    }

    console.log(`👤 Seeding test attempts for student: ${student.name} (${student.email})`);

    let seededCount = 0;
    for (const attemptData of DEMO_TEST_ATTEMPTS) {
      await TestAttempt.findOneAndUpdate(
        {
          student: student._id,
          testTitle: attemptData.testTitle,
        },
        {
          $set: {
            ...attemptData,
            student: student._id,
          },
        },
        { upsert: true, new: true }
      );
      seededCount++;
      console.log(`  📝 [${attemptData.testTitle}] Score: ${attemptData.score}/${attemptData.maxScore} (AIR #${attemptData.rank})`);
    }

    console.log(`\n🎉 Successfully seeded ${seededCount} mock test attempts!`);
  } catch (err: any) {
    console.error('❌ Error seeding test attempts:', err);
    throw err;
  } finally {
    await disconnectDB();
  }
};

// Standalone execution
if (process.argv[1]?.endsWith('seedTestAttempts.ts')) {
  seedTestAttempts()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

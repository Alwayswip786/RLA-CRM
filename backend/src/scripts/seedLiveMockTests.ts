import mongoose from 'mongoose';
import connectDB, { disconnectDB } from '../config/db.js';
import LiveMockTest from '../models/liveMockTest.model.js';
import LiveTestAttempt from '../models/liveTestAttempt.model.js';
import McqQuestion from '../models/mcqQuestion.model.js';
import User from '../models/user.model.js';
import { refreshLiveLeaderboardRanks } from '../controllers/liveMockTest.controller.js';

const CANDIDATE_NAMES = [
  'Ananya Sen',
  'Pooja Sharma',
  'Kavita Mehra',
  'Rohan Verma',
  'Vikramaditya Rao',
  'Isha Singhania',
  'Tanya Malhotra',
  'Siddharth Joshi',
  'Meenakshi Sundaram',
  'Arjun Devgan',
  'Neha Chawla',
  'Gaurav Mittal',
  'Divya Nair',
  'Harshavardhan Patil',
  'Simran Ahluwalia',
  'Karan Oberoi',
  'Ritika Sen',
  'Aakash Bansal',
  'Aditi Deshmukh',
  'Manish Tiwari',
  'Deepika Rathore',
  'Abhinav Saxena',
  'Shweta Ganguly',
  'Prateek Bhatia',
  'Anjali Goswami',
];

export const seedLiveMockExamData = async () => {
  console.log('🚀 Starting Competitive Live Mock Test Data Seeding...');
  await connectDB();

  // 1. Clean up existing seeded live mock tests and attempts
  await LiveTestAttempt.deleteMany({ isSeeded: true });
  await LiveMockTest.deleteMany({ isSeeded: true });
  await User.deleteMany({ email: /@seed\.rla\.edu$/ });
  console.log('🧹 Purged previous live mock test seed records.');

  // 2. Fetch existing MCQs
  const allQuestions = await McqQuestion.find({ isActive: true }).lean();
  if (allQuestions.length === 0) {
    throw new Error('No MCQ questions found in database. Please run seedMockExamData.ts first.');
  }
  console.log(`📚 Found ${allQuestions.length} curated MCQ questions in database.`);

  const questionIds = allQuestions.map((q) => q._id);

  // 3. Find primary student or create fallback
  let primaryStudent = await User.findOne({ role: 'student' });
  if (!primaryStudent) {
    primaryStudent = await User.create({
      name: 'Adv. Rajinder Sir',
      email: 'student@rla.edu',
      password: 'Password123!',
      role: 'student',
      rollNo: 'RLA-DIR-001',
      batch: 'Regular Judiciary Morning',
      isVerified: true,
      accountStatus: 'active',
    });
  }

  // 4. Create 25 realistic mock competitor users
  const mockStudents = [];
  for (let i = 0; i < CANDIDATE_NAMES.length; i++) {
    const name = CANDIDATE_NAMES[i];
    const email = `aspirant.${i + 1}@seed.rla.edu`;
    const rollNumber = `RLA-2026-${String(i + 14).padStart(3, '0')}`;
    const user = await User.create({
      name,
      email,
      password: 'SeedPassword123!',
      role: 'student',
      rollNo: rollNumber,
      batch: i % 2 === 0 ? 'Morning Shift (Cohort A)' : 'Evening Shift (Cohort B)',
      isVerified: true,
      accountStatus: 'active',
      isSeeded: true,
    });
    mockStudents.push(user);
  }
  console.log(`👥 Created ${mockStudents.length} simulated All-India judicial candidates.`);

  const now = new Date();

  // 5. Create Live Mock Tests
  // Test 1: Live Now — Delhi Judiciary (DJS) Full Mock 04
  const djsWindowStart = new Date(now.getTime() - 45 * 60 * 1000); // Started 45m ago
  const djsWindowEnd = new Date(now.getTime() + 180 * 60 * 1000);  // Ends in 3 hours
  const djsQuestions = questionIds.slice(0, 200);

  const djsMock = await LiveMockTest.create({
    testCode: 'RLA-LIVE-DJS-04',
    title: 'Delhi Judiciary (DJS) Full Mock 04',
    targetExam: 'Delhi Judicial Services (DJS 2026)',
    targetState: 'Delhi (DJS)',
    syllabus: 'Full Syllabus: CPC, CrPC/BNSS, BNS, Evidence, Constitution, Commercial Courts & Specific Relief Act',
    windowStart: djsWindowStart,
    windowEnd: djsWindowEnd,
    durationMinutes: 150,
    questionsCount: 200,
    maxScore: 200,
    marksPerCorrect: 1.0,
    negativeMarkWeight: 0.25,
    difficulty: 'hard',
    questions: djsQuestions,
    sections: [
      { name: 'Paper I: Civil & Procedural Laws', questionCount: 100, questionIds: djsQuestions.slice(0, 100) },
      { name: 'Paper II: Criminal & Constitutional Laws', questionCount: 100, questionIds: djsQuestions.slice(100, 200) },
    ],
    status: 'live',
    isPublished: true,
    isLeaderboardFrozen: false,
    allowReviewBeforeWindowClose: true,
    stats: {
      totalRegistered: 348,
      totalAttempted: 0,
      avgScore: 0,
      topScore: 0,
    },
    isSeeded: true,
  });

  // Test 2: Scheduled — UP PCS-J Law Paper Mock 03
  const upWindowStart = new Date(now.getTime() + 22 * 60 * 60 * 1000); // Tomorrow at 10 AM
  const upWindowEnd = new Date(now.getTime() + 30 * 60 * 60 * 1000);
  const upQuestions = questionIds.slice(50, 200);

  const upMock = await LiveMockTest.create({
    testCode: 'RLA-LIVE-UPPCSJ-03',
    title: 'UP PCS-J Law Paper Mock 03',
    targetExam: 'UP Judicial Services Preliminary Examination',
    targetState: 'Uttar Pradesh',
    syllabus: 'Substantive & Procedural Law: IPC, CrPC, CPC, TPA, Contract, Partnership & Specific Relief Act',
    windowStart: upWindowStart,
    windowEnd: upWindowEnd,
    durationMinutes: 120,
    questionsCount: 150,
    maxScore: 150,
    marksPerCorrect: 1.0,
    negativeMarkWeight: 0.33,
    difficulty: 'medium',
    questions: upQuestions,
    sections: [
      { name: 'Core Substantive Law', questionCount: 80, questionIds: upQuestions.slice(0, 80) },
      { name: 'Procedural Codes & Local Acts', questionCount: 70, questionIds: upQuestions.slice(80, 150) },
    ],
    status: 'scheduled',
    isPublished: true,
    isLeaderboardFrozen: false,
    stats: {
      totalRegistered: 412,
      totalAttempted: 0,
      avgScore: 0,
      topScore: 0,
    },
    isSeeded: true,
  });

  // Test 3: Live Now — Bhartiya Nyaya Sanhita (BNS) Master Mock
  const bnsWindowStart = new Date(now.getTime() - 20 * 60 * 1000);
  const bnsWindowEnd = new Date(now.getTime() + 120 * 60 * 1000);
  const bnsQuestions = questionIds.slice(0, 100);

  const bnsMock = await LiveMockTest.create({
    testCode: 'RLA-LIVE-BNS-01',
    title: 'Bhartiya Nyaya Sanhita (BNS) Master Mock',
    targetExam: 'All-India Judicial Services / Criminal Law Special',
    targetState: 'All-India',
    syllabus: '100 MCQs strictly focused on new BNS provisions and repealed IPC sections with landmark amendments',
    windowStart: bnsWindowStart,
    windowEnd: bnsWindowEnd,
    durationMinutes: 90,
    questionsCount: 100,
    maxScore: 100,
    marksPerCorrect: 1.0,
    negativeMarkWeight: 0.25,
    difficulty: 'medium',
    questions: bnsQuestions,
    sections: [
      { name: 'General Exceptions & Inchoate Offenses', questionCount: 40, questionIds: bnsQuestions.slice(0, 40) },
      { name: 'Offenses Against Body & Property', questionCount: 60, questionIds: bnsQuestions.slice(40, 100) },
    ],
    status: 'live',
    isPublished: true,
    isLeaderboardFrozen: false,
    stats: {
      totalRegistered: 289,
      totalAttempted: 0,
      avgScore: 0,
      topScore: 0,
    },
    isSeeded: true,
  });

  // Test 4: Closed — Haryana ADA & PCS-J Combined Mock
  const haryanaWindowStart = new Date(now.getTime() - 72 * 60 * 60 * 1000);
  const haryanaWindowEnd = new Date(now.getTime() - 48 * 60 * 60 * 1000);
  const haryanaQuestions = questionIds.slice(100, 225);

  const haryanaMock = await LiveMockTest.create({
    testCode: 'RLA-LIVE-HARYANA-01',
    title: 'Haryana ADA Prelims Mock Test 01',
    targetExam: 'Haryana Judicial & Prosecution Examination',
    targetState: 'Haryana',
    syllabus: 'Substantive Law, Evidence, Criminal Procedure, Haryana Rent Control & Local Customary Laws',
    windowStart: haryanaWindowStart,
    windowEnd: haryanaWindowEnd,
    durationMinutes: 120,
    questionsCount: 125,
    maxScore: 125,
    marksPerCorrect: 1.0,
    negativeMarkWeight: 0.25,
    difficulty: 'medium',
    questions: haryanaQuestions,
    sections: [],
    status: 'closed',
    isPublished: true,
    isLeaderboardFrozen: true,
    stats: {
      totalRegistered: 195,
      totalAttempted: 0,
      avgScore: 0,
      topScore: 0,
    },
    isSeeded: true,
  });

  console.log('✅ Created 4 Live Mock Tests: DJS Full Mock 04, UP PCS-J Mock 03, BNS Master Mock, and Haryana ADA.');

  // 6. Generate Realistic Candidate Attempts for DJS Mock (Test 1)
  console.log('⚡ Generating candidate attempts and leaderboard for DJS Full Mock 04...');
  const competitors = [primaryStudent, ...mockStudents];

  for (let i = 0; i < competitors.length; i++) {
    const student = competitors[i];
    if (!student) continue;
    const isPrimary = student._id.toString() === primaryStudent._id.toString();

    // Gaussian-like score distribution
    // Primary student achieves a high competitive score (168.75) for great UX
    let correct = isPrimary ? 174 : Math.max(70, Math.min(188, Math.round(180 - i * 4.2)));
    let incorrect = isPrimary ? 21 : Math.round(200 - correct - Math.floor(Math.random() * 8));
    if (correct + incorrect > 200) incorrect = 200 - correct;
    const unattempted = 200 - correct - incorrect;

    const negPenalty = parseFloat((incorrect * 0.25).toFixed(2));
    const score = parseFloat(Math.max(0, correct * 1.0 - negPenalty).toFixed(2));
    const accuracy = parseFloat(((correct / (correct + incorrect)) * 100).toFixed(1));
    const durationSeconds = Math.round(5400 + (i * 120) + (Math.random() * 60));
    const durationMs = durationSeconds * 1000 + Math.floor(Math.random() * 800);
    const submittedAt = new Date(djsWindowStart.getTime() + durationMs);

    const answers = djsQuestions.map((qId, qIdx) => ({
      questionId: qId,
      selectedOption: qIdx < correct ? 1 : qIdx < correct + incorrect ? 2 : null,
      isAnswered: qIdx < correct + incorrect,
      isMarkedForReview: qIdx % 15 === 0,
      isVisited: true,
      timeSpentSeconds: 38,
      isCorrect: qIdx < correct,
    }));

    await LiveTestAttempt.create({
      testId: djsMock._id,
      studentId: student._id,
      attemptNumber: 1,
      isOfficial: true,
      status: 'submitted',
      startedAt: djsWindowStart,
      expiresAt: djsWindowEnd,
      submittedAt,
      durationUsedMilliseconds: durationMs,
      durationUsedSeconds: durationSeconds,
      currentIndex: 199,
      answers,
      result: {
        score,
        maxScore: 200,
        correct,
        incorrect,
        unattempted,
        accuracy,
        negativeMarks: negPenalty,
        avgTimePerMcq: 38,
        rank: 1,
        percentile: 98.0,
        totalCandidates: competitors.length,
      },
      subjectAnalysis: [
        { subject: 'Civil Law', total: 100, correct: Math.round(correct * 0.52), incorrect: Math.round(incorrect * 0.5), unattempted: Math.round(unattempted * 0.5), accuracy: 88.0, timeSpentSeconds: 2700 },
        { subject: 'Criminal Law', total: 100, correct: Math.round(correct * 0.48), incorrect: Math.round(incorrect * 0.5), unattempted: Math.round(unattempted * 0.5), accuracy: 82.5, timeSpentSeconds: 2700 },
      ],
      antiCheat: {
        status: 'clean',
        violationsCount: 0,
        events: [{ eventType: 'exam_started', timestamp: djsWindowStart }],
      },
      isSeeded: true,
    });
  }

  // Refresh leaderboard ranks for DJS Mock
  await refreshLiveLeaderboardRanks(djsMock._id);
  console.log(`🏆 Computed dense All-India leaderboard ranks across ${competitors.length} candidates for DJS Full Mock 04.`);

  // 7. Generate a past completed attempt for primary student on Haryana Mock
  await LiveTestAttempt.create({
    testId: haryanaMock._id,
    studentId: primaryStudent._id,
    attemptNumber: 1,
    isOfficial: true,
    status: 'submitted',
    startedAt: haryanaWindowStart,
    expiresAt: haryanaWindowEnd,
    submittedAt: new Date(haryanaWindowStart.getTime() + 6200000),
    durationUsedMilliseconds: 6200000,
    durationUsedSeconds: 6200,
    currentIndex: 124,
    answers: haryanaQuestions.map((qId, qIdx) => ({
      questionId: qId,
      selectedOption: qIdx < 105 ? 1 : 2,
      isAnswered: true,
      isMarkedForReview: false,
      isVisited: true,
      timeSpentSeconds: 49,
      isCorrect: qIdx < 105,
    })),
    result: {
      score: 100.0,
      maxScore: 125,
      correct: 105,
      incorrect: 20,
      unattempted: 0,
      accuracy: 84.0,
      negativeMarks: 5.0,
      avgTimePerMcq: 49,
      rank: 4,
      percentile: 98.2,
      totalCandidates: 195,
    },
    subjectAnalysis: [
      { subject: 'Civil Law', total: 65, correct: 56, incorrect: 9, unattempted: 0, accuracy: 86.2, timeSpentSeconds: 3100 },
      { subject: 'Criminal Law', total: 60, correct: 49, incorrect: 11, unattempted: 0, accuracy: 81.7, timeSpentSeconds: 3100 },
    ],
    antiCheat: {
      status: 'clean',
      violationsCount: 0,
      events: [{ eventType: 'exam_started', timestamp: haryanaWindowStart }],
    },
    isSeeded: true,
  });

  console.log('=============================================================');
  console.log('🎉 COMPETITIVE LIVE MOCK TEST SEEDING COMPLETED SUCCESSFULLY!');
  console.log('=============================================================');
};

// Standalone execution support
if (process.argv[1]?.includes('seedLiveMockTests')) {
  seedLiveMockExamData()
    .then(async () => {
      await disconnectDB();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('❌ Seeding failed:', err);
      await disconnectDB();
      process.exit(1);
    });
}

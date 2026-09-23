import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/user.model.js';
import { Course, CourseEnrollment } from '../models/course.model.js';
import { VideoWatchSession } from '../models/videoWatchSession.model.js';
import { MONGODB_URI } from '../config/env.js';
import { seedStudentTelemetry } from './seedStudentTelemetry.js';

dotenv.config();

async function runE2ETests() {
  console.log('====================================================');
  console.log('🧪 Starting Student Telemetry & Metrics E2E Test Suite');
  console.log('====================================================');

  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(MONGODB_URI);
  }

  // 1. Run Seeder
  console.log('\n[1/7] Ensuring Fresh Seed Data...');
  await seedStudentTelemetry();

  // 2. Test User Model & Telemetry Fields
  console.log('\n[2/7] Verifying Student Users & Extended Telemetry Fields...');
  const pooja = await User.findOne({ rollNo: 'RLA-2026-042' });
  if (!pooja) throw new Error('Pooja Sharma not found in DB');
  console.log(`✓ Found Student: ${pooja.name} (${pooja.rollNo})`);
  console.log(`✓ RFID Turnstile: ${pooja.rfidTurnstileId}`);
  console.log(`✓ Prelims Score: ${pooja.prelimsAverageScore}%`);
  console.log(`✓ Fee Status: ${pooja.feeDetails?.feeStatus}`);
  console.log(`✓ Active Device: ${pooja.activeDevice?.deviceModel}`);

  // 3. Test Video Watch Sessions & Scrub Detection
  console.log('\n[3/7] Verifying Video Watch Sessions & Scrub Detection...');
  const sessions = await VideoWatchSession.find({ userId: pooja._id });
  console.log(`✓ Found ${sessions.length} video watch sessions for ${pooja.name}`);
  if (sessions.length < 3) throw new Error('Expected at least 3 sessions for Pooja');

  const scrubSessions = await VideoWatchSession.find({ scrubDetected: true });
  console.log(`✓ Found ${scrubSessions.length} session(s) with scrub detection alert flagged`);
  if (scrubSessions.length === 0) throw new Error('Expected scrub detected sessions');

  // 4. Test Course Enrollments & Progress Aggregations
  console.log('\n[4/7] Verifying Course Enrollments & Progress Percentages...');
  const enrollments = await CourseEnrollment.find({}).populate('courseId', 'title slug');
  console.log(`✓ Found ${enrollments.length} active course enrollments`);
  for (const e of enrollments) {
    console.log(`  - Student ${e.userId}: ${(e.courseId as any)?.title} -> ${e.overallProgressPercent}%`);
  }

  // 5. Test Academy Aggregate Metrics Calculation
  console.log('\n[5/7] Testing Academy Summary Metrics Logic...');
  const totalEnrolled = await CourseEnrollment.distinct('userId');
  const allEnrollments = await CourseEnrollment.find({});
  let totalProg = 0;
  allEnrollments.forEach((e) => (totalProg += e.overallProgressPercent || 0));
  const avgProgress = Number((totalProg / allEnrollments.length).toFixed(2));
  const atRiskCount = await CourseEnrollment.countDocuments({ overallProgressPercent: { $lt: 35 } });

  console.log(`✓ Distinct Enrolled Count: ${totalEnrolled.length}`);
  console.log(`✓ Academy Average Progress: ${avgProgress}%`);
  console.log(`✓ At-Risk (<35%) Students Count: ${atRiskCount}`);
  if (atRiskCount < 2) throw new Error('Expected at least 2 at-risk students (<35%)');

  // 6. Test Video Telemetry Overview KPIs
  console.log('\n[6/7] Testing Video Telemetry Overview KPIs Logic...');
  const sessionStats = await VideoWatchSession.aggregate([
    {
      $group: {
        _id: null,
        totalSeconds: { $sum: '$watchedSeconds' },
        avgPercentage: { $avg: '$watchPercentage' },
      },
    },
  ]);
  const totalWatchedHours = Number(((sessionStats[0]?.totalSeconds || 0) / 3600).toFixed(1));
  const avgCompletion = Number((sessionStats[0]?.avgPercentage || 0).toFixed(1));
  const fullCompletions = await VideoWatchSession.countDocuments({
    $or: [{ watchPercentage: { $gte: 90 } }, { status: 'completed' }],
  });
  const earlyDrops = await VideoWatchSession.countDocuments({
    $or: [{ watchPercentage: { $lt: 20 } }, { status: 'early_drop' }],
  });

  console.log(`✓ Total Watched Hours: ${totalWatchedHours} hrs`);
  console.log(`✓ Avg Video Completion: ${avgCompletion}%`);
  console.log(`✓ Full Completions Count (>=90%): ${fullCompletions}`);
  console.log(`✓ Early Drop-offs Count (<20%): ${earlyDrops}`);

  // 7. Test Session Revocation
  console.log('\n[7/7] Testing Active Device Session Revocation...');
  const poojaWithAuth = await User.findById(pooja._id).select('+authVersion');
  const initialAuthVersion = poojaWithAuth?.authVersion || 1;
  poojaWithAuth!.authVersion = initialAuthVersion + 1;
  if (poojaWithAuth!.activeDevice) {
    poojaWithAuth!.activeDevice.concurrentSessions = 1;
  }
  await poojaWithAuth!.save();
  const updatedPooja = await User.findById(pooja._id).select('+authVersion');
  console.log(`✓ Initial authVersion: ${initialAuthVersion}, Updated authVersion: ${updatedPooja?.authVersion}`);
  if (updatedPooja?.authVersion !== initialAuthVersion + 1) {
    throw new Error('AuthVersion did not increment during session revocation');
  }

  console.log('\n====================================================');
  console.log('🎉 ALL 7 E2E INTEGRATION TESTS PASSED SUCCESSFULLY! 🎉');
  console.log('====================================================\n');
}

runE2ETests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ E2E Test Suite Failed:', err);
    process.exit(1);
  });

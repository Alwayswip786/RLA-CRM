import assert from 'node:assert';
import http from 'node:http';
import mongoose from 'mongoose';
import connectDB, { disconnectDB } from '../config/db.js';
import app from '../app.js';
import User from '../models/user.model.js';
import { generateAuthTokens } from '../utils/jwt.js';

const PORT = 54890;
let server: http.Server;

async function runTests() {
  console.log('🚀 Starting Student Dashboard KPI Metrics E2E Test Suite...\n');

  await connectDB();

  server = http.createServer(app);
  await new Promise<void>((resolve) => {
    server.listen(PORT, '127.0.0.1', () => {
      console.log(`📡 In-memory test server listening on port ${PORT}\n`);
      resolve();
    });
  });

  const baseUrl = `http://127.0.0.1:${PORT}/api/dashboard/kpi-metrics`;

  try {
    // 🧪 TEST 1: Unauthenticated request should return 401
    console.log('🧪 TEST 1: Unauthenticated request should return 401');
    const unauthRes = await fetch(baseUrl);
    assert.strictEqual(unauthRes.status, 401, 'Unauthenticated request must be rejected');
    console.log('  ✅ PASS: Returns 401 Unauthorized without token\n');

    // 🧪 TEST 2: Demo Student (Adv. Rohit Verma)
    console.log('🧪 TEST 2: Retrieve KPI Metrics for Demo Student (Adv. Rohit Verma)');
    let student = await User.findOne({ email: 'rohit.verma@rajinderlawacademy.com' });
    if (!student) {
      student = await User.findOne({ role: 'student' });
    }
    assert(student, 'Demo student must exist in database');

    const studentTokens = generateAuthTokens(student._id.toString(), student.authVersion || 1, 'student');
    const authHeaders = {
      Authorization: `Bearer ${studentTokens.accessToken}`,
      'Content-Type': 'application/json',
    };

    const demoRes = await fetch(baseUrl, { headers: authHeaders });
    assert.strictEqual(demoRes.status, 200, 'Authenticated request returns 200 OK');

    const demoData: any = await demoRes.json();
    assert.strictEqual(demoData.success, true, 'Response success must be true');
    assert(demoData.data, 'Response must contain data object');

    // 1. Chamber Attendance
    const att = demoData.data.attendance;
    assert(att, 'attendance metric object must be present');
    assert.strictEqual(typeof att.percentage, 'number', 'attendance percentage must be a number');
    assert(att.percentage >= 75, 'attendance must be >= 75% for eligible student');
    assert.strictEqual(att.isEligible, true, 'isEligible must be true');
    assert.strictEqual(att.statusText, 'Eligible for Certificate & Tests', 'statusText must match eligible text');
    console.log(`  ✅ PASS: Chamber Attendance: ${att.percentageFormatted} (${att.statusText})`);

    // 2. Mains Copies
    const mains = demoData.data.mains;
    assert(mains, 'mains metric object must be present');
    assert.strictEqual(typeof mains.evaluatedCopies, 'number', 'evaluatedCopies must be number');
    assert(mains.subtitle, 'mains subtitle must be present');
    console.log(`  ✅ PASS: Mains Copies: ${mains.evaluatedCopiesFormatted} (${mains.subtitle})`);

    // 3. Prelims Accuracy
    const prelims = demoData.data.prelims;
    assert(prelims, 'prelims metric object must be present');
    assert.strictEqual(typeof prelims.accuracy, 'number', 'accuracy must be a number');
    assert(prelims.subtitle, 'prelims subtitle must be present');
    console.log(`  ✅ PASS: Prelims Accuracy: ${prelims.accuracyFormatted} (${prelims.subtitle})`);

    // 4. Bare Acts Covered
    const acts = demoData.data.bareActs;
    assert(acts, 'bareActs metric object must be present');
    assert(acts.coveredCount >= 1, 'coveredCount must be >= 1 for active student');
    assert.strictEqual(acts.totalCount, 14, 'totalCount must be 14 curriculum acts');
    assert(acts.displayValue.includes('/ 14 Acts'), 'displayValue format must be X / 14 Acts');
    assert(Array.isArray(acts.acronyms), 'acronyms must be an array');
    assert(acts.hasPracticed, 'hasPracticed must be true');
    console.log(`  ✅ PASS: Bare Acts: ${acts.displayValue} (${acts.subtitle})\n`);

    // 🧪 TEST 3: Fresh/New Student (Zero records baseline)
    console.log('🧪 TEST 3: New Student Zero-Baseline Metrics Fallback');
    const freshStudent = await User.create({
      rollNo: `TESTNEW${Date.now()}`,
      salutation: 'Ms.',
      name: 'Aishwarya Roy',
      email: `aishwarya.fresh.${Date.now()}@testacademy.com`,
      role: 'student',
      needsOnboarding: true,
      attendanceRate: 100,
    });

    const freshTokens = generateAuthTokens(freshStudent._id.toString(), 1, 'student');
    const freshHeaders = {
      Authorization: `Bearer ${freshTokens.accessToken}`,
      'Content-Type': 'application/json',
    };

    const freshRes = await fetch(baseUrl, { headers: freshHeaders });
    assert.strictEqual(freshRes.status, 200, 'Fresh student request returns 200 OK');

    const freshData: any = await freshRes.json();
    const freshAtt = freshData.data.attendance;
    const freshMains = freshData.data.mains;
    const freshPrelims = freshData.data.prelims;
    const freshActs = freshData.data.bareActs;

    // Verify Fresh Student Baseline Defaults
    assert.strictEqual(freshAtt.isNewStudent, true, 'Fresh student flagged as isNewStudent: true');
    assert.strictEqual(freshAtt.statusText, 'New Admission • Orientation Phase');
    assert.strictEqual(freshMains.evaluatedCopies, 0, 'Fresh student has 0 evaluated copies');
    assert.strictEqual(freshMains.subtitle, 'No copies evaluated • Submit first copy');
    assert.strictEqual(freshPrelims.hasAttempts, false, 'Fresh student has 0 test attempts');
    assert.strictEqual(freshPrelims.subtitle, 'No tests attempted • Take a sprint to rank');
    assert.strictEqual(freshActs.coveredCount, 0, 'Fresh student has 0 bare acts covered');
    assert.strictEqual(freshActs.displayValue, '0 / 14 Acts');
    assert.strictEqual(freshActs.hasPracticed, false, 'Fresh student hasPracticed: false');

    console.log('  ✅ PASS: Fresh student receives orientation attendance status');
    console.log('  ✅ PASS: Fresh student receives zero-submission prompt for mains');
    console.log('  ✅ PASS: Fresh student receives zero-attempt prompt for prelims');
    console.log('  ✅ PASS: Fresh student receives 0 / 14 Acts prompt for bare acts\n');

    // Clean up fresh test student
    await User.findByIdAndDelete(freshStudent._id);
    console.log('🧹 Cleaned up temporary test student.\n');

    console.log('========================================');
    console.log('🏁 All Dashboard KPI Metrics Tests Passed Cleanly!');
    console.log('========================================\n');
  } finally {
    if (server) {
      server.close();
    }
    await disconnectDB();
  }
}

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Test failed:', err);
    process.exit(1);
  });

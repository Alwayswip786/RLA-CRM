import http from 'http';
import app from '../app.js';
import connectDB, { disconnectDB } from '../config/db.js';
import User from '../models/user.model.js';
import LiveMockTest from '../models/liveMockTest.model.js';
import LiveTestAttempt from '../models/liveTestAttempt.model.js';
import { generateAuthTokens } from '../utils/jwt.js';

let server: http.Server;
let port: number;

function request(
  method: string,
  path: string,
  headers: Record<string, string> = {},
  body?: any
): Promise<{ statusCode: number; headers: http.IncomingHttpHeaders; data: any }> {
  return new Promise((resolve, reject) => {
    const payload = body ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined;
    const reqHeaders: Record<string, string> = { ...headers };
    if (payload && !reqHeaders['Content-Type']) {
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(payload).toString();
    }

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port,
        path,
        method,
        headers: reqHeaders,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          const raw = Buffer.concat(chunks).toString('utf-8');
          let data: any = raw;
          try {
            data = JSON.parse(raw);
          } catch {}
          resolve({ statusCode: res.statusCode || 0, headers: res.headers, data });
        });
      }
    );

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function runE2ETests() {
  console.log('🚀 Starting Competitive Live Mock Test E2E Test Suite...\n');
  await connectDB();

  server = http.createServer(app);
  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address() as any;
      port = addr.port;
      console.log(`📡 In-memory test server listening on port ${port}\n`);
      resolve();
    });
  });

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // Setup test users
    let student = await User.findOne({ email: 'e2e.live.student@rla.edu' });
    if (!student) {
      student = await User.create({
        name: 'E2E Live Aspirant',
        email: 'e2e.live.student@rla.edu',
        password: 'Password123!',
        role: 'student',
        rollNo: 'RLA-E2E-LIVE-01',
        batch: 'Evening Shift (Cohort B)',
        isVerified: true,
        accountStatus: 'active',
      });
    }

    let admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      admin = await User.create({
        name: 'E2E Exam Director',
        email: 'e2e.live.admin@rla.edu',
        password: 'Password123!',
        role: 'admin',
        rollNo: 'RLA-ADM-001',
        isVerified: true,
        accountStatus: 'active',
      });
    }

    const studentTokens = generateAuthTokens(student._id, student.authVersion ?? 1, student.role);
    const studentAuth = { Authorization: `Bearer ${studentTokens.accessToken}` };

    const adminTokens = generateAuthTokens(admin._id, admin.authVersion ?? 1, admin.role);
    const adminAuth = { Authorization: `Bearer ${adminTokens.accessToken}` };

    // 🧪 TEST 1: Unauthenticated request should be rejected
    console.log(`🧪 TEST 1: Unauthenticated request should return 401`);
    const unauthRes = await request('GET', '/api/tests/live/catalog');
    assert(unauthRes.statusCode === 401, 'Returns 401 Unauthorized without token');

    // 🧪 TEST 2: Retrieve Live Test Catalog
    console.log(`\n🧪 TEST 2: Retrieve Live Test Catalog`);
    const catalogRes = await request('GET', '/api/tests/live/catalog', studentAuth);
    assert(catalogRes.statusCode === 200, 'GET /catalog returns 200 OK');
    assert(catalogRes.data.success === true, 'Response success: true');
    assert(Array.isArray(catalogRes.data.data), 'Returns tests array');
    assert(catalogRes.data.data.length >= 3, 'Found at least 3 live/scheduled tests');

    const liveMock = catalogRes.data.data.find((t: any) => t.phase === 'live');
    const scheduledMock = catalogRes.data.data.find((t: any) => t.phase === 'scheduled');
    assert(!!liveMock, 'Found active "live" mock test');
    assert(!!scheduledMock, 'Found "scheduled" mock test');
    assert(liveMock.countdownMs > 0, 'Live test has positive countdownMs');

    // 🧪 TEST 3: Cannot start scheduled test before window opens
    console.log(`\n🧪 TEST 3: Prevent starting scheduled test before window opens`);
    const scheduledStartRes = await request(
      'POST',
      `/api/tests/live/tests/${scheduledMock.id}/start`,
      studentAuth
    );
    assert(scheduledStartRes.statusCode === 400, 'POST /start returns 400 for scheduled test');
    assert(
      scheduledStartRes.data.message?.includes('not open yet'),
      'Returns descriptive window opening error'
    );

    // 🧪 TEST 4: Start an active Live Test with Zero-Leak answer stripping
    console.log(`\n🧪 TEST 4: Start Live Test Session with Zero-Leak answer stripping`);
    const startRes = await request(
      'POST',
      `/api/tests/live/tests/${liveMock.id}/start`,
      studentAuth
    );
    assert(startRes.statusCode === 201, 'POST /start returns 201 Created');
    assert(startRes.data.isResumed === false, 'Flags isResumed: false');
    assert(startRes.data.session.isOfficial === true, 'Designated as isOfficial: true');
    assert(Array.isArray(startRes.data.session.questions), 'Returns questions array');

    const sampleQ = startRes.data.session.questions[0];
    assert(sampleQ.question.correctOptionIndex === undefined, 'correctOptionIndex is stripped');
    assert(sampleQ.question.explanation === undefined, 'explanation is stripped');
    assert(sampleQ.question.landmarkCases === undefined, 'landmarkCases is stripped');

    const attemptId = startRes.data.attemptId;

    // 🧪 TEST 5: Re-connecting / Resuming active session
    console.log(`\n🧪 TEST 5: Resuming active live session`);
    const resumeRes = await request(
      'POST',
      `/api/tests/live/tests/${liveMock.id}/start`,
      studentAuth
    );
    assert(resumeRes.statusCode === 200, 'Resume returns 200 OK');
    assert(resumeRes.data.isResumed === true, 'Flags isResumed: true');
    assert(resumeRes.data.attemptId === attemptId, 'Returns identical active attemptId');

    // 🧪 TEST 6: Auto-save candidate question selection & review flag
    console.log(`\n🧪 TEST 6: Atomic progress auto-save`);
    const patchRes = await request(
      'PATCH',
      `/api/tests/live/attempts/${attemptId}/answer`,
      studentAuth,
      {
        questionIndex: 0,
        selectedOption: 1,
        isMarkedForReview: true,
        timeSpentDelta: 28,
      }
    );
    assert(patchRes.statusCode === 200, 'PATCH /answer returns 200 OK');
    assert(patchRes.data.success === true, 'Selection auto-saved');

    // 🧪 TEST 7: Heartbeat ping time synchronization
    console.log(`\n🧪 TEST 7: Heartbeat time limit sync`);
    const heartbeatRes = await request(
      'PATCH',
      `/api/tests/live/attempts/${attemptId}/heartbeat`,
      studentAuth
    );
    assert(heartbeatRes.statusCode === 200, 'PATCH /heartbeat returns 200 OK');
    assert(heartbeatRes.data.status === 'in_progress', 'Session confirmed in_progress');
    assert(heartbeatRes.data.timeRemainingSeconds > 0, 'Returns active timeRemainingSeconds');

    // 🧪 TEST 8: Anti-Cheat / Focus tracking event logging
    console.log(`\n🧪 TEST 8: Log Proctoring & Anti-Cheat Events`);
    const eventRes = await request(
      'POST',
      `/api/tests/live/attempts/${attemptId}/event`,
      studentAuth,
      {
        eventType: 'window_blur',
        metadata: { clientTimestamp: Date.now() },
      }
    );
    assert(eventRes.statusCode === 200, 'POST /event returns 200 OK');
    assert(eventRes.data.violationsCount === 1, 'Violations count incremented');

    // 🧪 TEST 9: Final Submission & Automatic Scoring
    console.log(`\n🧪 TEST 9: Submit live test and evaluate`);
    const submitRes = await request(
      'POST',
      `/api/tests/live/attempts/${attemptId}/submit`,
      studentAuth
    );
    assert(submitRes.statusCode === 200, 'POST /submit returns 200 OK');
    assert(submitRes.data.success === true, 'Submission evaluated');
    assert(typeof submitRes.data.resultSummary.score === 'number', 'Calculated score is a number');
    assert(submitRes.data.review.questions.length > 0, 'Review contains full questions with solutions');
    assert(submitRes.data.review.questions[0].explanation !== undefined, 'Post-submit review reveals legal explanation');

    // 🧪 TEST 10: Idempotent re-submission
    console.log(`\n🧪 TEST 10: Idempotent re-submission check`);
    const duplicateSubmitRes = await request(
      'POST',
      `/api/tests/live/attempts/${attemptId}/submit`,
      studentAuth
    );
    assert(duplicateSubmitRes.statusCode === 200, 'Re-submit returns 200 OK');
    assert(duplicateSubmitRes.data.alreadyProcessed === true, 'Flags alreadyProcessed: true');
    assert(duplicateSubmitRes.data.review !== undefined, 'Provides cached review payload');

    // 🧪 TEST 11: All-India Leaderboard Ranking & Tie-breaking
    console.log(`\n🧪 TEST 11: Retrieve test-specific All-India Leaderboard`);
    const lbRes = await request(
      'GET',
      `/api/tests/live/tests/${liveMock.id}/leaderboard`,
      studentAuth
    );
    assert(lbRes.statusCode === 200, 'GET /leaderboard returns 200 OK');
    assert(Array.isArray(lbRes.data.data.leaderboard), 'Returns leaderboard array');
    assert(lbRes.data.data.leaderboard.length >= 2, 'Leaderboard has candidates');
    assert(lbRes.data.data.currentUserRank !== null, 'Current student is placed on leaderboard');
    assert(typeof lbRes.data.data.currentUserRank.rank === 'number', 'Student has an official rank');

    // 🧪 TEST 12: Student Exam History Archive
    console.log(`\n🧪 TEST 12: Student Exam History Archive`);
    const historyRes = await request('GET', '/api/tests/live/history', studentAuth);
    assert(historyRes.statusCode === 200, 'GET /history returns 200 OK');
    assert(Array.isArray(historyRes.data.data), 'Returns history array');
    assert(historyRes.data.data.some((h: any) => h.attemptId === attemptId), 'Completed attempt appears in history');

    // 🧪 TEST 13: Autopsy Review Endpoint
    console.log(`\n🧪 TEST 13: Detailed autopsy review`);
    const autopsyRes = await request(
      'GET',
      `/api/tests/live/attempts/${attemptId}/review`,
      studentAuth
    );
    assert(autopsyRes.statusCode === 200, 'GET /review returns 200 OK');
    assert(Array.isArray(autopsyRes.data.data.questions), 'Returns autopsy questions');
    assert(Array.isArray(autopsyRes.data.data.subjectAnalysis), 'Returns subject-wise analysis');

    // 🧪 TEST 14: Admin Operations (Create, Publish, Freeze)
    console.log(`\n🧪 TEST 14: Admin Live Mock Test Operations`);
    const adminListRes = await request('GET', '/api/tests/admin/live-tests', adminAuth);
    assert(adminListRes.statusCode === 200, 'Admin can list live mock tests');

    const adminFreezeRes = await request(
      'POST',
      `/api/tests/admin/live-tests/${liveMock.id}/freeze`,
      adminAuth
    );
    assert(adminFreezeRes.statusCode === 200, 'Admin can toggle freeze leaderboard');

    // Clean up temporary test attempt
    console.log(`\n🧹 Cleaning up test artifacts...`);
    await LiveTestAttempt.deleteOne({ _id: attemptId });
    await User.deleteOne({ _id: student._id });
    console.log('  Cleaned up temporary test attempt and student.');

    console.log(`\n========================================`);
    console.log(`🏁 Live Test Engine Summary: ${passed} passed, ${failed} failed`);
    console.log(`========================================\n`);

    if (failed > 0) throw new Error(`${failed} tests failed!`);
  } finally {
    server.close();
    await disconnectDB();
  }
}

runE2ETests()
  .then(() => {
    console.log('✅ All Competitive Live Test Engine E2E tests passed cleanly.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ E2E test error:', err);
    process.exit(1);
  });

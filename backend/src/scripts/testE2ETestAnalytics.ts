import http from 'http';
import app from '../app.js';
import connectDB, { disconnectDB } from '../config/db.js';
import User from '../models/user.model.js';
import TestAttempt from '../models/testAttempt.model.js';
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
  console.log('🚀 Starting Test Analytics & Scorecards E2E Test Suite...\n');
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

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${msg}`);
      failed++;
    }
  }

  try {
    // 1. Find demo student
    const student = await User.findOne({ email: 'rohit.verma@rajinderlawacademy.com' });
    if (!student) {
      throw new Error('Demo student not found! Please run seed scripts first.');
    }
    const studentTokens = generateAuthTokens(student._id, 1, 'student');
    const studentAuthHeader = { Authorization: `Bearer ${studentTokens.accessToken}` };

    console.log(`🧪 TEST 1: Unauthenticated request should be rejected`);
    const unauthRes = await request('GET', '/api/tests/analytics/my');
    assert(unauthRes.statusCode === 401, 'Returns 401 Unauthorized without token');

    console.log(`\n🧪 TEST 2: Student retrieves their scorecards & latest test analytics`);
    const myRes = await request('GET', '/api/tests/analytics/my', studentAuthHeader);
    assert(myRes.statusCode === 200, 'Returns 200 OK');
    assert(myRes.data.success === true, 'Response has success = true');
    assert(myRes.data.hasAttempts === true, 'Student has test attempts');
    assert(myRes.data.totalAttempts >= 2, `Total attempts is at least 2 (found ${myRes.data.totalAttempts})`);
    assert(!!myRes.data.latestTest, 'latestTest payload exists');
    assert(myRes.data.latestTest.title === 'Delhi Judiciary (DJS) Prelims Mock 03', `Latest test title is "${myRes.data.latestTest?.title}"`);
    assert(myRes.data.latestTest.rank === 14, `Latest test rank is AIR #14 (actual: ${myRes.data.latestTest?.rank})`);
    assert(myRes.data.latestTest.accuracy === 89.2, `Latest test accuracy is 89.2% (actual: ${myRes.data.latestTest?.accuracy}%)`);
    assert(myRes.data.latestTest.avgTimePerMcq === 42, `Avg time per MCQ is 42s`);
    assert(myRes.data.latestTest.negativeMarksFormatted === '-5.25 Pts', `Negative marks formatted is '-5.25 Pts'`);
    assert(Array.isArray(myRes.data.reports) && myRes.data.reports.length >= 2, 'Reports array contains list of test reports');

    console.log(`\n🧪 TEST 3: Student records a new mock test attempt`);
    const newAttemptPayload = {
      testTitle: 'Haryana ADA Prelims Mock Test 01',
      testType: 'mock_series',
      targetExam: 'Haryana ADA / Judiciary',
      totalQuestions: 100,
      maxScore: 100,
      correct: 82,
      incorrect: 12,
      unattempted: 6,
      negativeMarkWeight: 0.25,
      avgTimePerMcq: 38,
      timeSpentMinutes: 90,
    };

    const recordRes = await request('POST', '/api/tests/analytics/attempts', studentAuthHeader, newAttemptPayload);
    assert(recordRes.statusCode === 201, 'POST /attempts returns 201 Created');
    assert(recordRes.data.success === true, 'Record test attempt success');
    assert(recordRes.data.attempt.testTitle === 'Haryana ADA Prelims Mock Test 01', 'Attempt title matches');
    assert(recordRes.data.attempt.negativeMarks === 3, `Negative penalty is 12 * 0.25 = 3 pts (actual: ${recordRes.data.attempt.negativeMarks})`);
    assert(recordRes.data.attempt.score === 79, `Score is 82 - 3 = 79 (actual: ${recordRes.data.attempt.score})`);

    console.log(`\n🧪 TEST 4: Verifying latest test was updated dynamically`);
    const updatedRes = await request('GET', '/api/tests/analytics/my', studentAuthHeader);
    assert(updatedRes.statusCode === 200, 'Returns 200 OK');
    assert(updatedRes.data.latestTest.title === 'Haryana ADA Prelims Mock Test 01', `Latest test spotlight shifted to newest test ("${updatedRes.data.latestTest.title}")`);
    assert(updatedRes.data.totalAttempts === myRes.data.totalAttempts + 1, 'Total attempts incremented by 1');

    console.log(`\n🧹 Cleaning up test attempt...`);
    await TestAttempt.deleteOne({ _id: recordRes.data.attempt._id });
    console.log('  Cleaned up temporary test attempt.');

    // Re-check back to 2
    const finalRes = await request('GET', '/api/tests/analytics/my', studentAuthHeader);
    assert(finalRes.data.latestTest.title === 'Delhi Judiciary (DJS) Prelims Mock 03', 'Latest test restored to Delhi Judiciary Prelims Mock 03');

    console.log(`\n========================================`);
    console.log(`🏁 Test Summary: ${passed} passed, ${failed} failed`);
    console.log(`========================================\n`);

    if (failed > 0) {
      throw new Error(`${failed} tests failed!`);
    }
  } finally {
    server.close();
    await disconnectDB();
  }
}

runE2ETests()
  .then(() => {
    console.log('✅ All Test Analytics E2E tests completed successfully.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ E2E test suite error:', err);
    process.exit(1);
  });

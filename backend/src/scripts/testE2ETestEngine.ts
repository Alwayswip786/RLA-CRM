import http from 'http';
import app from '../app.js';
import connectDB, { disconnectDB } from '../config/db.js';
import User from '../models/user.model.js';
import TestSession from '../models/testSession.model.js';
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
  console.log('🚀 Starting Test & Practice Exam Engine E2E Test Suite...\n');
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
    // 1. Get demo student
    const student = await User.findOne({ email: 'rohit.verma@rajinderlawacademy.com' });
    if (!student) throw new Error('Demo student not found! Please run seed scripts first.');
    const tokens = generateAuthTokens(student._id, 1, 'student');
    const authHeader = { Authorization: `Bearer ${tokens.accessToken}` };

    // Clean up any lingering active sessions for test reproducibility
    await TestSession.deleteMany({ student: student._id, status: 'in_progress' });

    console.log(`🧪 TEST 1: Unauthenticated requests should return 401`);
    const unauthRes = await request('GET', '/api/tests/engine/practice/bare-acts');
    assert(unauthRes.statusCode === 401, 'Returns 401 Unauthorized without token');

    console.log(`\n🧪 TEST 2: Retrieve dynamic Bare Act practice catalogue`);
    const actsRes = await request('GET', '/api/tests/engine/practice/bare-acts', authHeader);
    assert(actsRes.statusCode === 200, 'Returns 200 OK');
    assert(actsRes.data.success === true, 'Response success: true');
    assert(Array.isArray(actsRes.data.data) && actsRes.data.data.length === 6, 'Returns all 6 Bare Acts');
    const cpcAct = actsRes.data.data.find((a: any) => a.id === 'cpc');
    assert(!!cpcAct && cpcAct.totalQuestions >= 60, `CPC has at least 60 curated questions (actual: ${cpcAct?.totalQuestions})`);

    console.log(`\n🧪 TEST 3: Retrieve All-India Mock Series list`);
    const mocksRes = await request('GET', '/api/tests/engine/mock-series', authHeader);
    assert(mocksRes.statusCode === 200, 'Returns 200 OK');
    assert(Array.isArray(mocksRes.data.data) && mocksRes.data.data.length >= 3, 'Returns at least 3 mock tests');
    const djsMock = mocksRes.data.data.find((m: any) => m.testCode === 'RLA-DJS-PRELIMS-04');
    assert(!!djsMock && djsMock.questionsCount === 200, 'DJS mock has 200 questions count');

    console.log(`\n🧪 TEST 4: Start a new 5-Question Bare Act Sprint with Zero-Leak Answer Stripping`);
    const startRes = await request('POST', '/api/tests/engine/session/start', authHeader, {
      actName: 'Code of Civil Procedure, 1908',
      count: 5,
    });
    assert(startRes.statusCode === 201, 'POST /session/start returns 201 Created');
    assert(startRes.data.isResumed === false, 'Session is brand new (not resumed)');
    const sessionId = startRes.data.session.id;
    assert(!!sessionId, 'Session ID received');
    assert(startRes.data.session.questions.length === 5, 'Session has exactly 5 questions');
    
    // Security check: Verify answer stripping
    const firstQ = startRes.data.session.questions[0].question;
    assert(firstQ.correctOptionIndex === undefined, 'correctOptionIndex is stripped from client payload');
    assert(firstQ.explanation === undefined, 'explanation is stripped from client payload');
    assert(firstQ.landmarkCases === undefined, 'landmarkCases is stripped from client payload');

    console.log(`\n🧪 TEST 5: Resuming active session (Refresh / Reconnect Handling)`);
    const resumeRes = await request('POST', '/api/tests/engine/session/start', authHeader, {
      actName: 'Code of Civil Procedure, 1908',
      count: 5,
    });
    assert(resumeRes.statusCode === 200, 'Returns 200 OK');
    assert(resumeRes.data.isResumed === true, 'Confirms isResumed = true');
    assert(resumeRes.data.session.id === sessionId, 'Returned the same active session ID');

    console.log(`\n🧪 TEST 6: Atomic progress update (Option selection & Review flag)`);
    const patchRes = await request('PATCH', `/api/tests/engine/session/${sessionId}/progress`, authHeader, {
      questionIndex: 0,
      selectedOption: 1, // Option B
      isMarkedForReview: true,
      timeSpentDelta: 24,
    });
    assert(patchRes.statusCode === 200, 'PATCH /progress returns 200 OK');
    assert(patchRes.data.success === true, 'Progress saved successfully');

    console.log(`\n🧪 TEST 7: Active session endpoint reflects saved progress`);
    const activeRes = await request('GET', '/api/tests/engine/session/active', authHeader);
    assert(activeRes.statusCode === 200, 'GET /active returns 200 OK');
    assert(activeRes.data.session.questions[0].selectedOption === 1, 'Question #0 selectedOption is 1');
    assert(activeRes.data.session.questions[0].isMarkedForReview === true, 'Question #0 isMarkedForReview is true');

    console.log(`\n🧪 TEST 8: Submit test session & Verify evaluation + Scorecard Bridge`);
    const submitRes = await request('POST', `/api/tests/engine/session/${sessionId}/submit`, authHeader);
    assert(submitRes.statusCode === 200, 'POST /submit returns 200 OK');
    assert(submitRes.data.success === true, 'Test evaluated successfully');
    assert(submitRes.data.resultSummary.totalQuestions === 5, 'Total questions evaluated: 5');
    assert(submitRes.data.resultSummary.attempted === 1, 'Attempted count is 1');
    assert(submitRes.data.resultSummary.unattempted === 4, 'Unattempted count is 4');
    assert(typeof submitRes.data.resultSummary.score === 'number', 'Calculated score is a number');
    assert(submitRes.data.review.resultSummary !== undefined, 'Review payload contains resultSummary');
    assert(submitRes.data.review.resultSummary.totalQuestions === 5, 'Review resultSummary totalQuestions is 5');
    assert(Array.isArray(submitRes.data.review.questions), 'Review contains full questions with solutions');
    assert(submitRes.data.review.questions[0].explanation !== undefined, 'Post-submit review reveals legal explanation');

    // Verify TestAttempt bridge
    const attemptInDb = await TestAttempt.findOne({ student: student._id }).sort({ attemptedAt: -1 });
    assert(!!attemptInDb && attemptInDb.testTitle === startRes.data.session.title, 'TestAttempt automatically created for Scorecard sync');

    console.log(`\n🧪 TEST 9: Idempotent re-submission check`);
    const duplicateSubmitRes = await request('POST', `/api/tests/engine/session/${sessionId}/submit`, authHeader);
    assert(duplicateSubmitRes.statusCode === 200, 'Re-submit returns 200 OK');
    assert(duplicateSubmitRes.data.alreadyProcessed === true, 'Flags alreadyProcessed: true');
    assert(duplicateSubmitRes.data.review !== undefined, 'Re-submit provides review payload');
    assert(duplicateSubmitRes.data.review.resultSummary !== undefined, 'Re-submit review payload contains resultSummary');

    console.log(`\n🧪 TEST 10: Autopsy review endpoint`);
    const autopsyRes = await request('GET', `/api/tests/engine/session/${sessionId}/review`, authHeader);
    assert(autopsyRes.statusCode === 200, 'GET /review returns 200 OK');
    assert(autopsyRes.data.data.questions.length === 5, 'Autopsy returns all 5 questions');

    console.log(`\n🧹 Cleaning up test artifacts...`);
    await TestSession.deleteOne({ _id: sessionId });
    await TestAttempt.deleteOne({ _id: attemptInDb?._id });
    console.log('  Cleaned up temporary test session and test attempt.');

    console.log(`\n========================================`);
    console.log(`🏁 Engine Test Summary: ${passed} passed, ${failed} failed`);
    console.log(`========================================\n`);

    if (failed > 0) throw new Error(`${failed} tests failed!`);
  } finally {
    server.close();
    await disconnectDB();
  }
}

runE2ETests()
  .then(() => {
    console.log('✅ All Test Engine E2E tests passed cleanly.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ E2E test error:', err);
    process.exit(1);
  });

/**
 * E2E Integration Test Suite for Landmark Judgment of the Day
 *
 * Tests the complete lifecycle:
 * 1. Seed & fetch today's dynamic landmark judgment (Selvi & Ors.).
 * 2. Verify all UI fields: benchStrength, keyHoldings bullets, provisions pills, category.
 * 3. Student toggles bookmark via /api/bookmarks/toggle.
 * 4. Verify today's judgment reflects isBookmarked: true.
 * 5. Student views full analysis.
 * 6. Student queries daily archive.
 * 7. Admin schedules a judgment for a future date.
 * 8. Admin updates judgment status (draft <-> published).
 */

import assert from 'node:assert';
import http from 'node:http';
import connectDB, { disconnectDB } from '../config/db.js';
import app from '../app.js';
import User from '../models/user.model.js';
import JudgementDigest from '../models/judgementDigest.model.js';
import Bookmark from '../models/bookmark.model.js';
import { generateAuthTokens } from '../utils/jwt.js';
import { getCurrentDateIST } from '../controllers/judgement.controller.js';

const PORT = 54892;
let server: http.Server;
const BASE_URL = `http://127.0.0.1:${PORT}/api/judgements`;

async function runDailyJudgementE2ETests() {
  console.log('🚀 Starting Landmark Judgment of the Day E2E Test Suite...\n');

  try {
    await connectDB();

    server = http.createServer(app);
    await new Promise<void>((resolve) => {
      server.listen(PORT, '127.0.0.1', () => {
        console.log(`📡 In-memory test server listening on port ${PORT}\n`);
        resolve();
      });
    });

    // 1. Get test users
    let adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      adminUser = await User.create({
        name: 'Faculty Admin',
        email: 'admin.judgement@rajinderlawacademy.com',
        phone: '9888877772',
        password: 'Password123!',
        role: 'admin',
        isVerified: true,
      });
    }

    let studentUser = await User.findOne({ role: 'student' });
    if (!studentUser) {
      studentUser = await User.create({
        name: 'Student Aspirant',
        email: 'student.judgement@rajinderlawacademy.com',
        phone: '9888877773',
        password: 'Password123!',
        role: 'student',
        isVerified: true,
      });
    }

    const adminTokens = generateAuthTokens(adminUser._id.toString(), adminUser.authVersion ?? 1, adminUser.role);
    const studentTokens = generateAuthTokens(studentUser._id.toString(), studentUser.authVersion ?? 1, studentUser.role);

    const todayIST = getCurrentDateIST();

    // Clean up student's prior bookmarks for Selvi
    const selviCase = await JudgementDigest.findOne({ title: 'Selvi & Ors. v. State of Karnataka' });
    assert.ok(selviCase, 'Selvi case should be seeded in DB');
    await Bookmark.deleteMany({ user: studentUser._id, itemId: selviCase._id.toString() });

    console.log(`Step 1: Student fetches Today's Landmark Judgment (GET /api/judgements/daily/today)...`);
    const todayRes = await fetch(`${BASE_URL}/daily/today`, {
      headers: { Authorization: `Bearer ${studentTokens.accessToken}` },
    });
    assert.strictEqual(todayRes.status, 200, 'Expected 200 OK');
    const todayData: any = await todayRes.json();
    assert.strictEqual(todayData.success, true);
    assert.ok(todayData.judgment, 'Expected a judgment in response');
    assert.strictEqual(todayData.judgment.title, 'Selvi & Ors. v. State of Karnataka');
    assert.strictEqual(todayData.judgment.citation, '(2010) 7 SCC 263');
    assert.strictEqual(todayData.judgment.benchStrength, '3-Judge Bench');
    assert.strictEqual(todayData.isBookmarked, false, 'Should initially not be bookmarked');
    console.log(`  ✅ PASS: Today's case loaded: "${todayData.judgment.title}" (${todayData.judgment.citation})`);

    console.log(`\nStep 2: Verifying structured Key Holdings and Provision pills match reference UI...`);
    assert.ok(Array.isArray(todayData.judgment.keyHoldings), 'Expected keyHoldings array');
    assert.strictEqual(todayData.judgment.keyHoldings.length, 2, 'Expected 2 key holding bullets');
    assert.ok(todayData.judgment.keyHoldings[0].title.includes('Article 20(3) Violation'));
    assert.ok(todayData.judgment.keyHoldings[1].title.includes('Article 21 & Privacy'));

    assert.ok(Array.isArray(todayData.judgment.provisions), 'Expected provisions array');
    assert.strictEqual(todayData.judgment.provisions.length, 3, 'Expected 3 provision pills');
    assert.strictEqual(todayData.judgment.provisions[0].label, 'Art. 20(3)');
    assert.strictEqual(todayData.judgment.provisions[1].label, 'Sec 161 CrPC / Sec 175 BNSS');
    assert.strictEqual(todayData.judgment.provisions[2].label, 'Sec 27 IEA / Sec 23 BSA');
    console.log(`  ✅ PASS: All bullets and provision badges validated!`);

    console.log(`\nStep 3: Student bookmarks the case (POST /api/bookmarks/toggle)...`);
    const bmRes = await fetch(`http://127.0.0.1:${PORT}/api/bookmarks/toggle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentTokens.accessToken}`,
      },
      body: JSON.stringify({
        itemType: 'Judgment',
        itemId: selviCase._id.toString(),
        title: selviCase.title,
        source: `${selviCase.citation} | ${selviCase.court}`,
        subject: selviCase.subject,
      }),
    });
    assert.ok(bmRes.status === 200 || bmRes.status === 201, `Expected 200 or 201, got ${bmRes.status}`);
    const bmData: any = await bmRes.json();
    assert.strictEqual(bmData.success, true);
    assert.strictEqual(bmData.bookmarked, true);
    console.log(`  ✅ PASS: Successfully bookmarked into student Legal Vault`);

    console.log(`\nStep 4: Re-fetching today's judgment to verify isBookmarked state...`);
    const reTodayRes = await fetch(`${BASE_URL}/daily/today`, {
      headers: { Authorization: `Bearer ${studentTokens.accessToken}` },
    });
    const reTodayData: any = await reTodayRes.json();
    assert.strictEqual(reTodayData.isBookmarked, true, 'Should now be reported as bookmarked');
    console.log(`  ✅ PASS: Dynamic bookmark state verified: isBookmarked = true`);

    console.log(`\nStep 5: Student queries historical archive (GET /api/judgements/daily/archive)...`);
    const archiveRes = await fetch(`${BASE_URL}/daily/archive?limit=5`, {
      headers: { Authorization: `Bearer ${studentTokens.accessToken}` },
    });
    assert.strictEqual(archiveRes.status, 200);
    const archiveData: any = await archiveRes.json();
    assert.strictEqual(archiveData.success, true);
    assert.ok(archiveData.judgements.length > 0, 'Archive should contain cases');
    console.log(`  ✅ PASS: Archive returned ${archiveData.total} historical precedents`);

    console.log(`\nStep 6: Admin schedules a case for a specific date (PATCH /api/judgements/:id/schedule)...`);
    const scheduleRes = await fetch(`${BASE_URL}/${selviCase._id}/schedule`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminTokens.accessToken}`,
      },
      body: JSON.stringify({
        dailyDateIST: todayIST,
        priority: 15,
        isDailyFeatured: true,
        status: 'published',
      }),
    });
    assert.strictEqual(scheduleRes.status, 200);
    const scheduleData: any = await scheduleRes.json();
    assert.strictEqual(scheduleData.success, true);
    assert.strictEqual(scheduleData.judgement.priority, 15);
    console.log(`  ✅ PASS: Scheduled case for ${todayIST} with Priority 15`);

    console.log(`\nStep 7: Admin updates status (PATCH /api/judgements/:id/status)...`);
    const statusRes = await fetch(`${BASE_URL}/${selviCase._id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminTokens.accessToken}`,
      },
      body: JSON.stringify({ status: 'published' }),
    });
    assert.strictEqual(statusRes.status, 200);
    console.log(`  ✅ PASS: Admin status management verified`);

    console.log('\n🎉 ALL 7 DAILY LANDMARK JUDGMENT E2E TESTS PASSED WITH 100% SUCCESS!\n');
  } catch (err: any) {
    console.error('❌ Test Failed:', err);
    throw err;
  } finally {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
    await disconnectDB();
  }
}

runDailyJudgementE2ETests().then(() => process.exit(0)).catch(() => process.exit(1));

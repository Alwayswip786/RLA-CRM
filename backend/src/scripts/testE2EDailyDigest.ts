import assert from 'assert';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import app from '../app.js';
import User from '../models/user.model.js';
import { DailyLegalDigestEdition } from '../models/dailyDigest.model.js';
import { generateAuthTokens } from '../utils/jwt.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rla_crm';

const getCurrentDateIST = (): string => {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
};

async function runE2ETests() {
  console.log('🚀 Starting Daily Legal Digest & Case Law Brief E2E Test Suite...\n');

  await mongoose.connect(MONGODB_URI);
  console.log('MongoDB connection established.');

  const server = app.listen(0);
  const port = (server.address() as any).port;
  const BASE_URL = `http://localhost:${port}/api/daily-digest`;
  console.log(`📡 In-memory test server listening on port ${port}\n`);

  try {
    // 1. Get or create test student & admin
    let student = await User.findOne({ role: 'student' });
    if (!student) {
      student = await User.create({
        name: 'Digest Test Aspirant',
        email: 'student.digest.test@rla.edu',
        phone: '9888877774',
        rollNo: 'RLA-DIGEST-01',
        password: 'Password123!',
        role: 'student',
        cohort: 'Comprehensive Batch 2026',
        targetExam: 'DJS',
      });
    }

    let admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      admin = await User.create({
        name: 'Faculty Desk Admin',
        email: 'admin.digest.test@rla.edu',
        phone: '9888877775',
        password: 'Password123!',
        role: 'admin',
      });
    }

    const studentTokens = generateAuthTokens(student._id, student.authVersion ?? 1, student.role);
    const adminTokens = generateAuthTokens(admin._id, admin.authVersion ?? 1, admin.role);

    // Clean up student's prior bookmarks for Daily Digest
    await (await import('../models/bookmark.model.js')).default.deleteMany({
      user: student._id,
      itemType: 'Daily Digest',
    });

    const todayIST = getCurrentDateIST();

    // -------------------------------------------------------------
    // Step 1: Student fetches Today's Daily Legal Digest
    // -------------------------------------------------------------
    console.log(`Step 1: Student fetches Today's Daily Legal Digest (GET /api/daily-digest/today)...`);
    const todayRes = await fetch(`${BASE_URL}/today`, {
      headers: { Authorization: `Bearer ${studentTokens.accessToken}` },
    });
    assert.strictEqual(todayRes.status, 200, 'Expected 200 OK');
    const todayData: any = await todayRes.json();
    assert.strictEqual(todayData.success, true);
    assert.ok(todayData.edition, 'Expected an edition in response');
    assert.strictEqual(todayData.edition.title, 'Daily Legal Digest & Case Law Brief');
    assert.ok(
      todayData.edition.featuredMaxim.latinText.includes('Actus non facit reum'),
      'Expected Latin maxim of the day'
    );
    console.log(`  ✅ PASS: Today's edition loaded: "${todayData.edition.title}" for ${todayData.edition.editionDateIST}`);
    console.log(`  ✅ PASS: Featured Maxim: ${todayData.edition.featuredMaxim.latinText}`);

    // -------------------------------------------------------------
    // Step 2: Verify structured content items match reference UI
    // -------------------------------------------------------------
    console.log(`\nStep 2: Verifying structured content cards match reference UI...`);
    const items = todayData.edition.items;
    assert.ok(Array.isArray(items), 'Expected items array');
    assert.strictEqual(items.length, 3, 'Expected 3 seeded items');

    // Item 1: SC Ruling
    assert.strictEqual(items[0].contentType, 'Supreme Court Ruling');
    assert.strictEqual(items[0].categoryBadge, 'SUPREME COURT RULING');
    assert.ok(items[0].title.includes('Section 482 CrPC Power'));
    assert.ok(items[0].examinationTip.includes('Vital for Mains Criminal Procedure'));
    console.log(`  ✅ PASS: SC Ruling verified: "${items[0].title.substring(0, 45)}..."`);

    // Item 2: Legal Maxim
    assert.strictEqual(items[1].contentType, 'Legal Maxim');
    assert.strictEqual(items[1].categoryBadge, 'LEGAL MAXIM');
    assert.ok(items[1].title.includes('Nemo debet bis vexari'));
    assert.ok(items[1].examinationTip.includes('Double Jeopardy'));
    console.log(`  ✅ PASS: Legal Maxim verified: "${items[1].title}"`);

    // Item 3: Legislative Amendment
    assert.strictEqual(items[2].contentType, 'Legislative Amendment');
    assert.strictEqual(items[2].categoryBadge, 'LEGISLATIVE AMENDMENT');
    assert.ok(items[2].title.includes('Key Differences: Organised Crime in BNS'));
    assert.ok(items[2].examinationTip.includes('Expected 10-marker'));
    console.log(`  ✅ PASS: Legislative Amendment verified: "${items[2].title.substring(0, 45)}..."`);

    // -------------------------------------------------------------
    // Step 3: Student bookmarks an item into Starred Vault
    // -------------------------------------------------------------
    console.log(`\nStep 3: Student bookmarks SC Ruling item (POST /api/bookmarks/toggle)...`);
    const scItem = items[0];
    const bmRes = await fetch(`http://localhost:${port}/api/bookmarks/toggle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentTokens.accessToken}`,
      },
      body: JSON.stringify({
        itemType: 'Daily Digest',
        itemId: scItem.itemId,
        title: scItem.title,
        source: `${scItem.contentType} • ${todayIST}`,
        subject: scItem.subject,
        metadata: {
          categoryBadge: scItem.categoryBadge,
          citation: scItem.citation,
          examinationTip: scItem.examinationTip,
        },
      }),
    });
    assert.ok(bmRes.status === 200 || bmRes.status === 201, `Expected 200/201, got ${bmRes.status}`);
    const bmData: any = await bmRes.json();
    assert.strictEqual(bmData.success, true);
    assert.strictEqual(bmData.bookmarked, true);
    console.log(`  ✅ PASS: Successfully bookmarked into student Legal Vault`);

    // -------------------------------------------------------------
    // Step 4: Re-fetch today's digest to verify dynamic isBookmarked
    // -------------------------------------------------------------
    console.log(`\nStep 4: Re-fetching today's digest to verify bookmarkedItemIds...`);
    const reTodayRes = await fetch(`${BASE_URL}/today`, {
      headers: { Authorization: `Bearer ${studentTokens.accessToken}` },
    });
    const reTodayData: any = await reTodayRes.json();
    assert.ok(reTodayData.bookmarkedItemIds.includes(scItem.itemId), 'scItem should be in bookmarkedItemIds');
    console.log(`  ✅ PASS: Dynamic bookmark state verified: [${reTodayData.bookmarkedItemIds.join(', ')}]`);

    // -------------------------------------------------------------
    // Step 5: Student marks an item as read and builds streak
    // -------------------------------------------------------------
    console.log(`\nStep 5: Student marks item as read (POST /api/daily-digest/read-item)...`);
    const readRes = await fetch(`${BASE_URL}/read-item`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentTokens.accessToken}`,
      },
      body: JSON.stringify({
        editionId: todayData.edition._id,
        itemId: scItem.itemId,
      }),
    });
    assert.strictEqual(readRes.status, 200);
    const readData: any = await readRes.json();
    assert.strictEqual(readData.success, true);
    assert.ok(readData.readItemIds.includes(scItem.itemId));
    assert.strictEqual(readData.streak.currentStreak, 1);
    console.log(`  ✅ PASS: Read tracking verified! Current Streak: ${readData.streak.currentStreak} day(s)`);

    // -------------------------------------------------------------
    // Step 6: Student queries historical archive
    // -------------------------------------------------------------
    console.log(`\nStep 6: Student queries historical archive (GET /api/daily-digest/archive)...`);
    const archiveRes = await fetch(`${BASE_URL}/archive?limit=5`, {
      headers: { Authorization: `Bearer ${studentTokens.accessToken}` },
    });
    assert.strictEqual(archiveRes.status, 200);
    const archiveData: any = await archiveRes.json();
    assert.strictEqual(archiveData.success, true);
    assert.ok(archiveData.editions.length > 0, 'Archive should contain editions');
    console.log(`  ✅ PASS: Archive returned ${archiveData.total} published edition(s)`);

    // -------------------------------------------------------------
    // Step 7: Admin creates & schedules tomorrow's digest edition
    // -------------------------------------------------------------
    console.log(`\nStep 7: Admin schedules new edition and manages status...`);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowIST = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(tomorrow);

    // Clean up if already exists
    await DailyLegalDigestEdition.deleteMany({ editionDateIST: tomorrowIST });

    const createRes = await fetch(`${BASE_URL}/admin/editions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminTokens.accessToken}`,
      },
      body: JSON.stringify({
        editionDateIST: tomorrowIST,
        editionNumber: 143,
        title: 'Daily Legal Digest & Case Law Brief',
        featuredMaxim: {
          latinText: '"Ubi jus ibi remedium"',
          englishMeaning: 'Where there is a right, there is a remedy.',
          jurisprudenceContext: 'Foundational maxim for judicial review under Article 32 & 226.',
        },
        items: [
          {
            itemId: 'item-tomorrow-1',
            contentType: 'Legal Maxim',
            categoryBadge: 'LEGAL MAXIM',
            badgeColor: 'amber',
            subject: 'Constitutional Law',
            title: 'Ubi jus ibi remedium: Constitutional Enforceability',
            summary: 'Ashby v. White principle embodied in Constitutional remedies.',
            examinationTip: 'Essential for Article 32 writ jurisdiction answers.',
            order: 1,
          },
        ],
        status: 'scheduled',
      }),
    });
    assert.strictEqual(createRes.status, 201);
    const createData: any = await createRes.json();
    assert.strictEqual(createData.success, true);
    console.log(`  ✅ PASS: Admin scheduled edition for ${tomorrowIST}`);

    // Update status to published
    const statusRes = await fetch(`${BASE_URL}/admin/editions/${createData.edition._id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminTokens.accessToken}`,
      },
      body: JSON.stringify({ status: 'published' }),
    });
    assert.strictEqual(statusRes.status, 200);
    console.log(`  ✅ PASS: Admin updated status to published`);

    // Clean up tomorrow's test edition
    await DailyLegalDigestEdition.findByIdAndDelete(createData.edition._id);

    console.log('\n🎉 ALL 7 DAILY LEGAL DIGEST E2E TESTS PASSED WITH 100% SUCCESS!\n');
  } finally {
    server.close();
    await mongoose.disconnect();
    console.log('MongoDB connection closed gracefully.');
  }
}

runE2ETests().catch((err) => {
  console.error('❌ E2E Test Suite Failed:', err);
  process.exit(1);
});

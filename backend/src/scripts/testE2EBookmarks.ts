import http from 'http';
import app from '../app.js';
import connectDB, { disconnectDB } from '../config/db.js';
import User from '../models/user.model.js';
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
  console.log('🚀 Starting Starred Questions & Legal Vault E2E Test Suite...\n');
  await connectDB();

  server = http.createServer(app);
  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address() as any;
      port = addr.port;
      console.log(`📡 Ephemeral Test Server listening on http://127.0.0.1:${port}`);
      resolve();
    });
  });

  const student = await User.findOne({ email: 'rohit.verma@rajinderlawacademy.com' });
  if (!student) throw new Error('Student Rohit Verma not found in database.');

  const { accessToken: studentToken } = generateAuthTokens(student._id, student.authVersion ?? 1, student.role);
  const studentHeaders = { Authorization: `Bearer ${studentToken}` };

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, msg: string) {
    total++;
    if (condition) {
      console.log(`  ✅ [PASS] ${msg}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${msg}`);
      throw new Error(`Test failed: ${msg}`);
    }
  }

  try {
    // Test 1: Unauthorized access rejected
    console.log('\n--- 1. Authentication & Security ---');
    const unauthRes = await request('GET', '/api/bookmarks');
    assert(unauthRes.statusCode === 401, 'Unauthenticated request receives 401');

    // Test 2: Fetch bookmarks list with counts
    console.log('\n--- 2. Vault Retrieval & Aggregation ---');
    const listRes = await request('GET', '/api/bookmarks', studentHeaders);
    assert(listRes.statusCode === 200, 'Authenticated student can retrieve vault bookmarks (200)');
    assert(listRes.data.success === true, 'Response indicates success: true');
    assert(Array.isArray(listRes.data.bookmarks), 'Returns bookmarks array');
    assert(listRes.data.counts && typeof listRes.data.counts.totalCount === 'number', 'Returns KPI counts object');
    assert(listRes.data.counts.totalCount >= 6, `Found at least 6 seeded bookmarks (actual: ${listRes.data.counts.totalCount})`);
    assert(listRes.data.counts.mcqCount >= 2, `MCQ count is >= 2 (actual: ${listRes.data.counts.mcqCount})`);
    assert(listRes.data.counts.judgmentCount >= 2, `Judgment count is >= 2 (actual: ${listRes.data.counts.judgmentCount})`);
    assert(listRes.data.counts.bareActCount >= 2, `Bare Act Note count is >= 2 (actual: ${listRes.data.counts.bareActCount})`);
    assert(Array.isArray(listRes.data.subjects) && listRes.data.subjects.length > 0, 'Returns distinct subjects');

    // Test 3: Filter by type
    console.log('\n--- 3. Type & Search Filtering ---');
    const mcqRes = await request('GET', '/api/bookmarks?itemType=MCQ', studentHeaders);
    assert(mcqRes.statusCode === 200, 'Filtering by itemType=MCQ succeeds (200)');
    assert(mcqRes.data.bookmarks.every((b: any) => b.itemType === 'MCQ'), 'All returned items are MCQ');

    // Test 4: Search filter
    const searchRes = await request('GET', '/api/bookmarks?search=jurisdiction', studentHeaders);
    assert(searchRes.statusCode === 200, 'Search keyword returns 200');
    assert(searchRes.data.bookmarks.length > 0, 'Keyword search for "jurisdiction" found matching items');

    // Test 5: Fast IDs retrieval for star indicator
    console.log('\n--- 4. Fast Star IDs Projection ---');
    const idsRes = await request('GET', '/api/bookmarks/ids', studentHeaders);
    assert(idsRes.statusCode === 200, 'GET /api/bookmarks/ids returns 200');
    assert(Array.isArray(idsRes.data.itemIds), 'itemIds is an array');
    assert(idsRes.data.itemIds.includes('mcq-cpc-sec21-jurisdiction'), 'Includes seeded item ID');
    assert(Boolean(idsRes.data.byType), 'Returns categorized byType mapping');

    // Test 6: 1-Click Toggle (Create new star)
    console.log('\n--- 5. 1-Click Toggle & Annotation Editing ---');
    const testItemId = 'test-e2e-question-101';
    const toggleAddRes = await request('POST', '/api/bookmarks/toggle', studentHeaders, {
      itemType: 'MCQ',
      itemId: testItemId,
      title: 'E2E Test Starred Question on Indian Evidence Act Section 27',
      source: 'IEA Section 27 / Pulukuri Kottaya (1947)',
      subject: 'Law of Evidence',
      annotation: 'Discovery of fact must be direct consequence of information given by accused.',
    });
    assert(toggleAddRes.statusCode === 201, 'New star creation returns 201 Created');
    assert(toggleAddRes.data.bookmarked === true, 'Response confirms item is bookmarked');
    const createdBookmarkId = toggleAddRes.data.bookmark._id;

    // Test 7: Update Annotation
    const updateRes = await request(
      'PUT',
      `/api/bookmarks/${createdBookmarkId}/annotation`,
      studentHeaders,
      { annotation: 'Updated annotation: Confession leading to discovery is only admissible to that extent.' }
    );
    assert(updateRes.statusCode === 200, 'Update annotation returns 200');
    assert(updateRes.data.bookmark.annotation.includes('Updated annotation'), 'Annotation was updated successfully in DB');

    // Test 8: 1-Click Toggle (Unstar existing)
    const toggleRemoveRes = await request('POST', '/api/bookmarks/toggle', studentHeaders, {
      itemType: 'MCQ',
      itemId: testItemId,
    });
    assert(toggleRemoveRes.statusCode === 200, 'Toggle existing star returns 200');
    assert(toggleRemoveRes.data.bookmarked === false, 'Response confirms item was unstarred');

    // Test 9: Direct Delete endpoint
    // Add again to test direct delete
    const reAddRes = await request('POST', '/api/bookmarks/toggle', studentHeaders, {
      itemType: 'MCQ',
      itemId: testItemId,
      title: 'Temporary Star for deletion',
      subject: 'Constitutional Law',
    });
    const tempId = reAddRes.data.bookmark._id;
    const deleteRes = await request('DELETE', `/api/bookmarks/${tempId}`, studentHeaders);
    assert(deleteRes.statusCode === 200, 'DELETE /api/bookmarks/:id returns 200');

    // Verify it is gone
    const verifyGone = await request('GET', `/api/bookmarks?search=Temporary+Star`, studentHeaders);
    assert(verifyGone.data.bookmarks.length === 0, 'Deleted bookmark no longer appears in vault search');

    console.log(`\n=============================================================`);
    console.log(`🎉 ALL ${passed}/${total} STARRED VAULT E2E TESTS PASSED SUCCESSFULLY!`);
    console.log(`=============================================================\n`);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await disconnectDB();
  }
}

runE2ETests().catch((err) => {
  console.error('❌ E2E Test Suite Error:', err);
  process.exit(1);
});

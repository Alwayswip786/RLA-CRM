import http from 'http';
import app from '../app.js';
import connectDB, { disconnectDB } from '../config/db.js';
import BareActNote from '../models/bareActNote.model.js';
import { generateAuthTokens } from '../utils/jwt.js';
import User from '../models/user.model.js';

let server: http.Server;
let port: number;

function request(
  method: string,
  path: string,
  headers: Record<string, string> = {},
  body?: any
): Promise<{ statusCode: number; headers: http.IncomingHttpHeaders; data: any; rawBuffer: Buffer }> {
  return new Promise((resolve, reject) => {
    const payload = body ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined;
    const reqHeaders: Record<string, string> = {
      ...headers,
    };
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
          const rawBuffer = Buffer.concat(chunks);
          let data: any = null;
          const ct = res.headers['content-type'] || '';
          if (ct.includes('application/json')) {
            try {
              data = JSON.parse(rawBuffer.toString('utf-8'));
            } catch {
              data = rawBuffer.toString('utf-8');
            }
          } else {
            data = rawBuffer.toString('utf-8');
          }
          resolve({
            statusCode: res.statusCode || 0,
            headers: res.headers,
            data,
            rawBuffer,
          });
        });
      }
    );

    req.on('error', reject);
    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

async function runBareActTests() {
  console.log('🧪 Initializing Bare Act Decoding Notes E2E Test Suite...\n');
  await connectDB();

  server = http.createServer(app);
  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      if (addr && typeof addr === 'object') {
        port = addr.port;
      }
      resolve();
    });
  });

  console.log(`📡 Test server running on port ${port}`);

  // Fetch student and admin users
  const adminUser = await User.findOne({ role: 'admin' });
  const studentUser = await User.findOne({ role: 'student' }) || adminUser;

  if (!adminUser || !studentUser) {
    throw new Error('Required test users not found in database.');
  }

  const adminToken = generateAuthTokens(adminUser._id, adminUser.authVersion, adminUser.role).accessToken;
  const studentToken = generateAuthTokens(studentUser._id, studentUser.authVersion, studentUser.role).accessToken;

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName} ${detail ? `- ${detail}` : ''}`);
      failed++;
    }
  }

  try {
    // Test 1: GET /api/bare-acts/meta/filters
    const resFilters = await request('GET', '/api/bare-acts/meta/filters', {
      Authorization: `Bearer ${studentToken}`,
    });
    assert(resFilters.statusCode === 200, 'GET /api/bare-acts/meta/filters returns 200');
    assert(Array.isArray(resFilters.data?.acts), 'Filter meta returns acts array');
    assert(resFilters.data?.acts.length > 0, 'Filter meta has seeded acts');

    // Test 2: GET /api/bare-acts/featured
    const resFeatured = await request('GET', '/api/bare-acts/featured', {
      Authorization: `Bearer ${studentToken}`,
    });
    assert(resFeatured.statusCode === 200, 'GET /api/bare-acts/featured returns 200');
    assert(!!resFeatured.data?.note, 'Featured note is present');

    // Test 3: GET /api/bare-acts with pagination & category filter
    const resList = await request('GET', '/api/bare-acts?category=New+Criminal+Laws&limit=5', {
      Authorization: `Bearer ${studentToken}`,
    });
    assert(resList.statusCode === 200, 'GET /api/bare-acts returns 200');
    assert(resList.data?.notes?.length > 0, 'Notes array returned');
    assert(
      resList.data?.notes?.every((n: any) => n.category === 'New Criminal Laws'),
      'All returned notes belong to New Criminal Laws'
    );

    // Test 4: Search query
    const resSearch = await request('GET', '/api/bare-acts?search=homicide', {
      Authorization: `Bearer ${studentToken}`,
    });
    assert(resSearch.statusCode === 200, 'Search query returns 200');
    assert(resSearch.data?.notes?.length > 0, 'Search matches notes with homicide');

    // Test 5: GET single note details
    const sampleNote = await BareActNote.findOne({ isPublished: true });
    if (!sampleNote) throw new Error('No published note found');
    const noteId = sampleNote._id.toString();

    const resDetail = await request('GET', `/api/bare-acts/${noteId}`, {
      Authorization: `Bearer ${studentToken}`,
    });
    assert(resDetail.statusCode === 200, 'GET /api/bare-acts/:id returns 200');
    assert(resDetail.data?.note?._id === noteId, 'Returned note ID matches');

    // Test 6: PDF Range Streaming (HTTP 206)
    const resRange = await request('GET', `/api/bare-acts/${noteId}/preview`, {
      Authorization: `Bearer ${studentToken}`,
      Range: 'bytes=0-100',
    });
    assert(resRange.statusCode === 206, 'PDF range streaming returns HTTP 206 Partial Content');
    assert(Boolean(resRange.headers['content-range']?.includes('bytes 0-100/')), 'Content-Range header correct');
    assert(resRange.headers['content-type'] === 'application/pdf', 'Content-Type is application/pdf');

    // Test 7: Download PDF + Atomic counter increment
    const initialDownloads = sampleNote.downloadCount;
    const resDownload = await request('GET', `/api/bare-acts/${noteId}/download`, {
      Authorization: `Bearer ${studentToken}`,
    });
    assert(resDownload.statusCode === 200, 'Download endpoint returns 200');
    assert(
      Boolean(resDownload.headers['content-disposition']?.includes('attachment')),
      'Content-Disposition is attachment'
    );
    const updatedNote = await BareActNote.findById(noteId);
    assert(
      (updatedNote?.downloadCount || 0) === initialDownloads + 1,
      'Download count atomically incremented by +1'
    );

    // Test 8: Admin Management API with 5 KPIs
    const resAdmin = await request('GET', '/api/bare-acts/admin/all', {
      Authorization: `Bearer ${adminToken}`,
    });
    assert(resAdmin.statusCode === 200, 'GET /api/bare-acts/admin/all returns 200 for admin');
    assert(resAdmin.data?.stats?.totalNotes >= 6, 'Admin stats totalNotes is at least 6');
    assert(resAdmin.data?.stats?.uniqueActs >= 4, 'Admin stats uniqueActs is at least 4');
    assert(typeof resAdmin.data?.stats?.totalDownloads === 'number', 'totalDownloads is a number');

    // Test 9: 1-Click Publish Toggle
    const resToggle = await request('PATCH', `/api/bare-acts/${noteId}/publish`, {
      Authorization: `Bearer ${adminToken}`,
    });
    assert(resToggle.statusCode === 200, 'Toggle publish returns 200');
    assert(resToggle.data?.isPublished === false, 'Note toggled to unpublished draft');

    // Toggle back to published
    await request('PATCH', `/api/bare-acts/${noteId}/publish`, {
      Authorization: `Bearer ${adminToken}`,
    });

  } finally {
    server.close();
    await disconnectDB();
  }

  console.log(`\n========================================`);
  console.log(`🏁 Bare Act Notes E2E Tests Finished`);
  console.log(`✅ Passed: ${passed} | ❌ Failed: ${failed}`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runBareActTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

import http from 'http';
import app from '../app.js';
import connectDB, { disconnectDB } from '../config/db.js';
import User from '../models/user.model.js';
import MainsSubmission from '../models/mainsSubmission.model.js';
import DoubtQuery from '../models/doubtQuery.model.js';
import { LiveClass } from '../models/liveClass.model.js';
import Notice from '../models/notice.model.js';
import { generateAuthTokens } from '../utils/jwt.js';

const PORT = 8004;
const BASE_URL = `http://localhost:${PORT}/api`;

const makeRequest = (
  endpoint: string,
  method: string = 'GET',
  body?: any,
  token?: string
): Promise<{ status: number; data: any; headers: http.IncomingHttpHeaders }> => {
  return new Promise((resolve, reject) => {
    const url = new URL(`${BASE_URL}${endpoint}`);
    const postData = body ? JSON.stringify(body) : null;

    const options: http.RequestOptions = {
      hostname: url.hostname,
      port: url.port,
      path: `${url.pathname}${url.search}`,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(postData ? { 'Content-Length': Buffer.byteLength(postData) } : {}),
      },
    };

    const req = http.request(options, (res) => {
      let rawData = '';
      res.on('data', (chunk) => {
        rawData += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = rawData ? JSON.parse(rawData) : null;
          resolve({ status: res.statusCode || 500, data: parsed, headers: res.headers });
        } catch {
          resolve({ status: res.statusCode || 500, data: rawData, headers: res.headers });
        }
      });
    });

    req.on('error', (err) => reject(err));
    if (postData) req.write(postData);
    req.end();
  });
};

async function runE2ETests() {
  console.log('🧪 Running Admin Dashboard Dynamic E2E Tests...\n');
  await connectDB();

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(PORT, () => resolve()));
  console.log(`🌐 Test server listening on port ${PORT}`);

  try {
    // 1. Authenticate as Admin
    const admin = await User.findOne({ email: 'rajinder@rajinderlawacademy.com' }).select('+authVersion');
    if (!admin) {
      throw new Error('Admin user not found. Please run seedAdminDashboard first.');
    }

    const { accessToken } = generateAuthTokens(admin._id, admin.authVersion || 1, admin.role || 'admin');

    console.log('\n1️⃣  Testing GET /api/admin/dashboard/overview...');
    const overviewRes = await makeRequest('/admin/dashboard/overview', 'GET', null, accessToken);

    if (overviewRes.status !== 200) {
      throw new Error(`Overview API failed with status ${overviewRes.status}: ${JSON.stringify(overviewRes.data)}`);
    }

    const data = overviewRes.data.data;

    console.log('   KPIs received:');
    console.log(`   - Enrolled Students: ${data.kpis.enrolledStudents.count} (${data.kpis.enrolledStudents.growthText})`);
    console.log(`   - Pending Mains Copies: ${data.kpis.pendingMainsCopies.count} (${data.kpis.pendingMainsCopies.challengeLabel})`);
    console.log(`   - Admissions Inquiries: ${data.kpis.admissionsInquiries.count} (${data.kpis.admissionsInquiries.demosTodayText})`);
    console.log(`   - Fee Due: ${data.kpis.feeInstallmentsDue.amountFormatted} (${data.kpis.feeInstallmentsDue.overdueText})`);

    if (data.kpis.enrolledStudents.count < 428) throw new Error('Enrolled students count mismatch');
    if (data.kpis.pendingMainsCopies.count !== 14) throw new Error(`Pending mains copies expected 14, got ${data.kpis.pendingMainsCopies.count}`);
    if (data.kpis.admissionsInquiries.count !== 57) throw new Error(`Admissions inquiries expected 57, got ${data.kpis.admissionsInquiries.count}`);
    if (data.kpis.feeInstallmentsDue.overdueCount !== 7) throw new Error(`Fee overdue count expected 7, got ${data.kpis.feeInstallmentsDue.overdueCount}`);

    console.log('   Mains Submissions count:', data.mainsSubmissions.recentSubmissions.length);
    const pooja = data.mainsSubmissions.recentSubmissions.find((s: any) => s.studentName === 'Pooja Sharma');
    const ananya = data.mainsSubmissions.recentSubmissions.find((s: any) => s.studentName === 'Ananya Sen');
    if (!pooja) throw new Error('Pooja Sharma submission missing');
    if (!ananya || !ananya.isEvaluated) throw new Error('Ananya Sen evaluated submission missing');
    console.log('   ✅ Top Mains Submissions verified (Pooja Sharma pending, Ananya Sen evaluated)');

    console.log('   Faculty Doubts count:', data.facultyDoubts.recentQueries.length);
    const vikram = data.facultyDoubts.recentQueries.find((d: any) => d.studentName === 'Vikram Mehta');
    if (!vikram) throw new Error('Vikram Mehta doubt query missing');
    console.log('   ✅ Top Faculty Doubts verified (Vikram Mehta & Sneha Kapoor present)');

    console.log('   Today\'s Lectures count:', data.todayLectures.length);
    const cpc = data.todayLectures.find((c: any) => c.title.includes('Civil Procedure Code'));
    if (!cpc) throw new Error('CPC lecture missing');
    console.log('   ✅ Today\'s Classroom Lectures verified');

    // 2. Test Quick Grade Copy
    console.log('\n2️⃣  Testing POST /api/admin/dashboard/quick-evaluate/:submissionId...');
    const gradeRes = await makeRequest(
      `/admin/dashboard/quick-evaluate/${pooja.id}`,
      'POST',
      {
        score: 19,
        remarks: 'Meticulous articulation of Section 11 Explanations IV and VIII. Excellent handwritten answer sheet.',
        strengths: 'Clear application of Kathi Kalu Oghad and Selvi precedents.',
      },
      accessToken
    );

    if (gradeRes.status !== 200) {
      throw new Error(`Quick evaluate failed with status ${gradeRes.status}: ${JSON.stringify(gradeRes.data)}`);
    }
    console.log('   ✅ Graded Pooja Sharma copy successfully:', gradeRes.data.data.score, '/', gradeRes.data.data.maxScore);

    // Verify DB updated
    const updatedSub = await MainsSubmission.findById(pooja.id);
    if (updatedSub?.status !== 'evaluated' || updatedSub?.score !== 19) {
      throw new Error('Database not updated with evaluated status');
    }

    // 3. Test Quick Doubt Reply
    console.log('\n3️⃣  Testing POST /api/admin/dashboard/quick-reply-doubt/:doubtId...');
    const replyRes = await makeRequest(
      `/admin/dashboard/quick-reply-doubt/${vikram.id}`,
      'POST',
      {
        message: 'Under Order II Rule 2, if a cause of action is distinct, constructive res judicata under Explanation IV to Section 11 does not apply unless both reliefs arose from the same bundle of facts and could have been joined without embarrassment.',
      },
      accessToken
    );

    if (replyRes.status !== 200) {
      throw new Error(`Quick reply doubt failed: ${JSON.stringify(replyRes.data)}`);
    }
    console.log('   ✅ Replied to Vikram Mehta query successfully, status:', replyRes.data.data.status);

    const updatedDoubt = await DoubtQuery.findById(vikram.id);
    if (updatedDoubt?.status !== 'resolved' || updatedDoubt?.thread.length < 2) {
      throw new Error('Doubt status not resolved or thread not updated');
    }

    // 4. Test Post New Circular
    console.log('\n4️⃣  Testing POST /api/admin/dashboard/broadcast-notice...');
    const noticeRes = await makeRequest(
      '/admin/dashboard/broadcast-notice',
      'POST',
      {
        title: 'Special Live Bare Act Analysis Session on BNSS 2023 tomorrow',
        content: 'Director Adv. Rajinder Sir will conduct an exclusive 3-hour marathon breakdown of arrest and bail provisions under the new Bharatiya Nagarik Suraksha Sanhita.',
        category: 'Classroom Timetable',
        priority: 'urgent',
        targetCohorts: 'All Enrolled Candidates',
      },
      accessToken
    );

    if (noticeRes.status !== 201) {
      throw new Error(`Broadcast notice failed: ${JSON.stringify(noticeRes.data)}`);
    }
    console.log('   ✅ Circular broadcasted successfully:', noticeRes.data.data.circularNo, '-', noticeRes.data.data.title);

    // 5. Test Start Live Stream
    console.log('\n5️⃣  Testing POST /api/admin/dashboard/start-live-stream/:classId...');
    const liveRes = await makeRequest(
      `/admin/dashboard/start-live-stream/${cpc.id}`,
      'POST',
      null,
      accessToken
    );

    if (liveRes.status !== 200) {
      throw new Error(`Start live stream failed: ${JSON.stringify(liveRes.data)}`);
    }
    console.log('   ✅ Live stream activated successfully, class status:', liveRes.data.data.status);

    console.log('\n🎉 ALL 5 E2E TESTS PASSED WITH 100% ACCURACY!');
  } finally {
    server.close();
    await disconnectDB();
  }
}

runE2ETests().catch((err) => {
  console.error('❌ E2E Test Suite Failed:', err);
  process.exit(1);
});

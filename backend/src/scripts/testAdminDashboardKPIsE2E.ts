import http from 'http';
import app from '../app.js';
import connectDB, { disconnectDB } from '../config/db.js';
import User from '../models/user.model.js';
import { generateAuthTokens } from '../utils/jwt.js';

const PORT = 8005;
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

async function runKPIVerificationTests() {
  console.log('🧪 Running Dynamic Admin Dashboard Header & KPI E2E Test Suite...\n');
  await connectDB();

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(PORT, () => resolve()));
  console.log(`🌐 Test server listening on port ${PORT}`);

  try {
    const admin = await User.findOne({ email: 'rajinder@rajinderlawacademy.com' }).select('+authVersion');
    if (!admin) {
      throw new Error('Executive Admin not found. Run seed script first.');
    }

    const { accessToken } = generateAuthTokens(admin._id, admin.authVersion || 1, admin.role || 'admin');

    // 1. Test Default Overview (Timeframe: 7d)
    console.log('1️⃣  Testing GET /api/admin/dashboard/overview?timeframe=7d...');
    const res7d = await makeRequest('/admin/dashboard/overview?timeframe=7d', 'GET', null, accessToken);
    if (res7d.status !== 200) {
      throw new Error(`Failed with status ${res7d.status}: ${JSON.stringify(res7d.data)}`);
    }

    const data7d = res7d.data.data;
    console.log('   👤 Admin Profile:', data7d.adminProfile.name, '|', data7d.adminProfile.title);
    console.log(`   👥 Enrolled Students: ${data7d.kpis.enrolledStudents.count} (${data7d.kpis.enrolledStudents.growthText})`);
    console.log(`   📑 Pending Copies: ${data7d.kpis.pendingMainsCopies.count} (${data7d.kpis.pendingMainsCopies.challengeLabel} • ${data7d.kpis.pendingMainsCopies.statusLabel})`);
    console.log(`   🎯 Admissions: ${data7d.kpis.admissionsInquiries.count} (${data7d.kpis.admissionsInquiries.demosTodayText} • ${data7d.kpis.admissionsInquiries.hotPipelineText})`);
    console.log(`   💳 Fees Due: ${data7d.kpis.feeInstallmentsDue.amountFormatted} (${data7d.kpis.feeInstallmentsDue.overdueText})`);

    if (data7d.kpis.enrolledStudents.count !== 428) {
      throw new Error(`Expected exactly 428 enrolled students, got ${data7d.kpis.enrolledStudents.count}`);
    }
    if (data7d.kpis.enrolledStudents.growthCount !== 24) {
      throw new Error(`Expected exactly 24 enrolled this week, got ${data7d.kpis.enrolledStudents.growthCount}`);
    }
    if (data7d.kpis.pendingMainsCopies.count !== 14) {
      throw new Error(`Expected exactly 14 pending copies, got ${data7d.kpis.pendingMainsCopies.count}`);
    }
    if (data7d.kpis.admissionsInquiries.count !== 57) {
      throw new Error(`Expected exactly 57 admissions inquiries, got ${data7d.kpis.admissionsInquiries.count}`);
    }
    if (data7d.kpis.admissionsInquiries.demosTodayCount !== 4) {
      throw new Error(`Expected 4 demos today, got ${data7d.kpis.admissionsInquiries.demosTodayCount}`);
    }
    if (data7d.kpis.admissionsInquiries.hotPipelineCount !== 18) {
      throw new Error(`Expected 18 hot pipeline leads, got ${data7d.kpis.admissionsInquiries.hotPipelineCount}`);
    }
    if (data7d.kpis.feeInstallmentsDue.amountFormatted !== '₹3.4L') {
      throw new Error(`Expected ₹3.4L fee pending, got ${data7d.kpis.feeInstallmentsDue.amountFormatted}`);
    }
    if (data7d.kpis.feeInstallmentsDue.overdueCount !== 7) {
      throw new Error(`Expected 7 overdue fee accounts, got ${data7d.kpis.feeInstallmentsDue.overdueCount}`);
    }
    console.log('   ✅ Exact Reference UI values verified on 7-day view!');

    // 2. Test Timeframe Switching (Timeframe: 30d)
    console.log('\n2️⃣  Testing GET /api/admin/dashboard/overview?timeframe=30d...');
    const res30d = await makeRequest('/admin/dashboard/overview?timeframe=30d', 'GET', null, accessToken);
    if (res30d.status !== 200) {
      throw new Error(`Failed with status ${res30d.status}: ${JSON.stringify(res30d.data)}`);
    }

    const data30d = res30d.data.data;
    console.log(`   👥 30-Day Growth: ${data30d.kpis.enrolledStudents.growthText} (Count: ${data30d.kpis.enrolledStudents.growthCount})`);
    if (data30d.kpis.enrolledStudents.growthCount !== 70) {
      throw new Error(`Expected 70 enrolled in 30d timeframe, got ${data30d.kpis.enrolledStudents.growthCount}`);
    }
    console.log('   ✅ Timeframe filter dynamically alters secondary growth metrics!');

    // 3. Test In-Memory Caching & Force Refresh
    console.log('\n3️⃣  Testing Caching & Force Refresh (?refresh=true)...');
    const cachedRes = await makeRequest('/admin/dashboard/overview?timeframe=7d', 'GET', null, accessToken);
    if (cachedRes.data.cached !== true) {
      throw new Error('Expected response to be served from cache');
    }
    console.log('   ✅ Cache hit verified (cached: true)');

    const refreshedRes = await makeRequest('/admin/dashboard/overview?timeframe=7d&refresh=true', 'GET', null, accessToken);
    if (refreshedRes.data.cached === true) {
      throw new Error('Expected response to bypass cache on refresh=true');
    }
    console.log('   ✅ Cache bypass on refresh=true verified (cached: false)');

    console.log('\n🎉 ALL DYNAMIC KPI & HEADER VERIFICATIONS PASSED WITH 100% ACCURACY!');
  } finally {
    server.close();
    await disconnectDB();
  }
}

runKPIVerificationTests().catch((err) => {
  console.error('❌ KPI Verification Test Suite Failed:', err);
  process.exit(1);
});

import http from 'http';
import app from '../app.js';
import connectDB, { disconnectDB } from '../config/db.js';
import User from '../models/user.model.js';
import AdminRole from '../models/adminRole.model.js';
import AdminAuditLog from '../models/adminAuditLog.model.js';
import { generateAuthTokens } from '../utils/jwt.js';

const PORT = 8003;
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

export const runE2ETests = async () => {
  console.log('\n🏛️ =========================================================');
  console.log('🏛️   RUNNING E2E AUTOMATED TEST SUITE: ADMIN MANAGEMENT & RBAC');
  console.log('🏛️ =========================================================\n');

  await connectDB();
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(PORT, () => resolve()));

  let passed = 0;
  let failed = 0;

  const assert = (condition: boolean, testName: string, detail?: string) => {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
      failed++;
    }
  };

  try {
    // -------------------------------------------------------------
    // Scenario 1: Super Admin Login & Effective Permissions
    // -------------------------------------------------------------
    console.log('\n--- Scenario 1: Super Admin Login & Effective Permissions ---');
    const superAdminUser = await User.findOne({ email: 'rajinder@rajinderlawacademy.com' }).select('+authVersion');
    assert(!!superAdminUser, 'Adv. Rajinder Sir exists in database');

    const superTokens = generateAuthTokens(superAdminUser!._id, superAdminUser!.authVersion, 'admin');

    const meRes = await makeRequest('/auth/me', 'GET', null, superTokens.accessToken);
    assert(meRes.status === 200, 'Super Admin profile fetched via /api/auth/me');
    assert(meRes.data?.user?.isSuperAdmin === true, 'User is recognized as Super Admin');
    assert(meRes.data?.user?.permissions?.includes('*'), 'Super Admin holds wildcard (*) clearance');
    assert(meRes.data?.user?.permissionTier === 'Full Access', 'Super Admin tier is "Full Access"');

    // -------------------------------------------------------------
    // Scenario 2: Seed Verification (All 4 Reference Staff & Roles)
    // -------------------------------------------------------------
    console.log('\n--- Scenario 2: Seed Verification (Staff & System Roles) ---');
    const staffRes = await makeRequest('/admin/staff', 'GET', null, superTokens.accessToken);
    assert(staffRes.status === 200, 'GET /api/admin/staff returns 200 OK');
    assert(Array.isArray(staffRes.data?.staff), 'Staff returned as array');

    const names = (staffRes.data?.staff || []).map((s: any) => s.name);
    assert(names.includes('Adv. Rajinder Sir'), 'Staff directory includes "Adv. Rajinder Sir"');
    assert(names.includes('Adv. Sharma'), 'Staff directory includes "Adv. Sharma"');
    assert(names.includes('Adv. R.K. Gupta'), 'Staff directory includes "Adv. R.K. Gupta"');
    assert(names.includes('Priya Malhotra'), 'Staff directory includes "Priya Malhotra"');

    const rolesRes = await makeRequest('/admin/roles', 'GET', null, superTokens.accessToken);
    assert(rolesRes.status === 200, 'GET /api/admin/roles returns 200 OK');
    assert((rolesRes.data?.roles || []).length >= 9, 'All 9 predefined system roles are present');

    // -------------------------------------------------------------
    // Scenario 3: Permissions Matrix Endpoint
    // -------------------------------------------------------------
    console.log('\n--- Scenario 3: Permissions Taxonomy Matrix ---');
    const matrixRes = await makeRequest('/admin/permissions/matrix', 'GET', null, superTokens.accessToken);
    assert(matrixRes.status === 200, 'GET /api/admin/permissions/matrix returns 200 OK');
    assert((matrixRes.data?.modules || []).length >= 14, 'System defines at least 14 modular permission scopes');

    // -------------------------------------------------------------
    // Scenario 4: Create Admin Account with Role & Permissions
    // -------------------------------------------------------------
    console.log('\n--- Scenario 4: Create Admin Account ---');
    const testAdminEmail = `test.kavita.${Date.now()}@rajinderlawacademy.com`;
    const courseManagerRole = (rolesRes.data?.roles || []).find((r: any) => r.slug === 'course_manager');

    const createRes = await makeRequest(
      '/admin/staff',
      'POST',
      {
        salutation: 'Ms.',
        name: 'Kavita Sen',
        email: testAdminEmail,
        phone: '+91 98111 99999',
        password: 'Judicial@2026',
        adminRoleId: courseManagerRole?._id,
        adminTitle: 'Senior Course Curator',
        status: 'active',
      },
      superTokens.accessToken
    );

    assert(createRes.status === 201, 'POST /api/admin/staff successfully creates admin account (201 Created)');
    assert(createRes.data?.staff?.email === testAdminEmail, 'Created admin email matches input');
    assert(createRes.data?.staff?.role === 'Senior Course Curator', 'Assigned custom admin title matches');
    const createdAdminId = createRes.data?.staff?.id;

    // -------------------------------------------------------------
    // Scenario 5: Duplicate Email Prevention Guard
    // -------------------------------------------------------------
    console.log('\n--- Scenario 5: Duplicate Email Prevention ---');
    const dupRes = await makeRequest(
      '/admin/staff',
      'POST',
      {
        name: 'Kavita Sen Duplicate',
        email: testAdminEmail,
      },
      superTokens.accessToken
    );
    assert(dupRes.status === 400, 'Attempting to create duplicate email returns 400 Bad Request');

    // -------------------------------------------------------------
    // Scenario 6: Non-Authorized Staff Access Rejection (403)
    // -------------------------------------------------------------
    console.log('\n--- Scenario 6: Non-Authorized Staff Access Rejection ---');
    const priyaUser = await User.findOne({ email: 'admissions@rajinderlawacademy.com' }).select('+authVersion');
    assert(!!priyaUser, 'Priya Malhotra (Admissions) exists');
    const priyaTokens = generateAuthTokens(priyaUser!._id, priyaUser!.authVersion, 'admin');

    // Admissions Counselor lacks "staff:view" permission -> must return 403 Forbidden!
    const priyaStaffRes = await makeRequest('/admin/staff', 'GET', null, priyaTokens.accessToken);
    assert(
      priyaStaffRes.status === 403,
      'Priya Malhotra accessing /api/admin/staff is blocked with 403 Forbidden',
      `Got status ${priyaStaffRes.status}`
    );

    // -------------------------------------------------------------
    // Scenario 7: Authorized Staff Allowed Route Access (200)
    // -------------------------------------------------------------
    console.log('\n--- Scenario 7: Authorized Staff Allowed Route Access ---');
    // Admissions Counselor holds "notices:view" permission
    const priyaNoticeRes = await makeRequest('/notices', 'GET', null, priyaTokens.accessToken);
    assert(priyaNoticeRes.status === 200, 'Priya Malhotra accessing /api/notices succeeds with 200 OK');

    // -------------------------------------------------------------
    // Scenario 8: Privilege Escalation Prevention Guard
    // -------------------------------------------------------------
    console.log('\n--- Scenario 8: Privilege Escalation Prevention ---');
    // Priya attempts to appoint a Super Admin or grant wildcard (*)
    const escalationRes = await makeRequest(
      '/admin/staff',
      'POST',
      {
        name: 'Rogue Admin',
        email: `rogue.${Date.now()}@rajinderlawacademy.com`,
        isSuperAdmin: true,
      },
      priyaTokens.accessToken
    );
    assert(
      escalationRes.status === 403,
      'Non-super admin attempting privilege escalation is blocked with 403'
    );

    // -------------------------------------------------------------
    // Scenario 9: Instant Session Revocation via authVersion
    // -------------------------------------------------------------
    console.log('\n--- Scenario 9: Instant Session Revocation (authVersion) ---');
    const kavitaUser = await User.findById(createdAdminId).select('+authVersion');
    assert(!!kavitaUser, 'Created admin found in DB');

    // Generate token with current authVersion
    const kavitaTokens = generateAuthTokens(kavitaUser!._id, kavitaUser!.authVersion, 'admin');

    // Verify token works initially on an accessible route
    const preRevokeRes = await makeRequest('/auth/me', 'GET', null, kavitaTokens.accessToken);
    assert(preRevokeRes.status === 200, 'Kavita token works prior to session revocation');

    // Super Admin forces session revocation
    const revokeRes = await makeRequest(
      `/admin/staff/${createdAdminId}/revoke-sessions`,
      'POST',
      null,
      superTokens.accessToken
    );
    assert(revokeRes.status === 200, 'POST /api/admin/staff/:id/revoke-sessions returns 200 OK');

    // Now test with the same old token -> must be rejected with 401!
    const postRevokeRes = await makeRequest('/auth/me', 'GET', null, kavitaTokens.accessToken);
    assert(
      postRevokeRes.status === 401,
      'Old token rejected with 401 Unauthorized after session revocation',
      `Got status ${postRevokeRes.status}`
    );

    // -------------------------------------------------------------
    // Scenario 10: Sole Active Super Admin Protection Guard
    // -------------------------------------------------------------
    console.log('\n--- Scenario 10: Sole Active Super Admin Protection ---');
    const rajinderId = String(superAdminUser!._id);
    const demoteRes = await makeRequest(
      `/admin/staff/${rajinderId}`,
      'PUT',
      {
        isSuperAdmin: false,
        status: 'suspended',
      },
      superTokens.accessToken
    );
    assert(
      demoteRes.status === 400,
      'Attempting to demote or suspend the sole active Super Admin returns 400 Bad Request'
    );

    // -------------------------------------------------------------
    // Scenario 11: Custom Role Lifecycle (Create, List, Delete)
    // -------------------------------------------------------------
    console.log('\n--- Scenario 11: Custom Role Lifecycle ---');
    const customRoleName = `Mains Grader Intern ${Date.now()}`;
    const customRoleRes = await makeRequest(
      '/admin/roles',
      'POST',
      {
        name: customRoleName,
        permissionTier: 'Academic & Grading',
        description: 'Intern copy grader assisting senior faculty',
        permissions: ['overview:view', 'mains_evaluation:evaluate'],
      },
      superTokens.accessToken
    );
    assert(customRoleRes.status === 201, 'POST /api/admin/roles creates custom role (201)');
    const customRoleId = customRoleRes.data?.role?._id;

    // Delete custom role
    const deleteRoleRes = await makeRequest(
      `/admin/roles/${customRoleId}`,
      'DELETE',
      null,
      superTokens.accessToken
    );
    assert(deleteRoleRes.status === 200, 'DELETE /api/admin/roles/:id deletes custom role (200)');

    // -------------------------------------------------------------
    // Scenario 12: Audit Trail Verification
    // -------------------------------------------------------------
    console.log('\n--- Scenario 12: Governance Audit Trail Verification ---');
    const auditRes = await makeRequest('/admin/audit-logs', 'GET', null, superTokens.accessToken);
    assert(auditRes.status === 200, 'GET /api/admin/audit-logs returns 200 OK');
    assert((auditRes.data?.logs || []).length > 0, 'Audit logs recorded and queryable');

    const actions = (auditRes.data?.logs || []).map((l: any) => l.action);
    assert(actions.includes('admin:create'), 'Audit trail captured admin:create event');
    assert(actions.includes('admin:revoke_sessions'), 'Audit trail captured admin:revoke_sessions event');
    assert(actions.includes('role:create'), 'Audit trail captured role:create event');
    assert(actions.includes('role:delete'), 'Audit trail captured role:delete event');

    // Clean up created test admin
    if (createdAdminId) {
      await User.findByIdAndDelete(createdAdminId);
    }
  } catch (err) {
    console.error('⚠️ Unexpected error during E2E test execution:', err);
    failed++;
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await disconnectDB();
  }

  console.log('\n=============================================================');
  console.log(`🏛️ TEST SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log('=============================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
};

// Standalone execution support
if (process.argv[1]?.endsWith('testE2EAdminRbac.ts') || process.argv[1]?.endsWith('testE2EAdminRbac.js')) {
  runE2ETests();
}

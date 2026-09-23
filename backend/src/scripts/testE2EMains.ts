import http from 'http';
import fs from 'fs';
import path from 'path';
import app from '../app.js';
import connectDB, { disconnectDB } from '../config/db.js';
import User from '../models/user.model.js';
import MainsQuestion from '../models/mainsQuestion.model.js';
import { generateAuthTokens } from '../utils/jwt.js';

let server: http.Server;
let port: number;

function requestMultipart(
  urlPath: string,
  headers: Record<string, string>,
  fields: Record<string, string>,
  fileField: { fieldname: string; filename: string; contentType: string; buffer: Buffer }
): Promise<{ statusCode: number; data: any }> {
  return new Promise((resolve, reject) => {
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    const crlf = '\r\n';

    const parts: Buffer[] = [];

    // Append text fields
    for (const [key, val] of Object.entries(fields)) {
      parts.push(
        Buffer.from(
          `--${boundary}${crlf}Content-Disposition: form-data; name="${key}"${crlf}${crlf}${val}${crlf}`
        )
      );
    }

    // Append file
    parts.push(
      Buffer.from(
        `--${boundary}${crlf}Content-Disposition: form-data; name="${fileField.fieldname}"; filename="${fileField.filename}"${crlf}Content-Type: ${fileField.contentType}${crlf}${crlf}`
      )
    );
    parts.push(fileField.buffer);
    parts.push(Buffer.from(crlf));

    // End boundary
    parts.push(Buffer.from(`--${boundary}--${crlf}`));

    const fullBody = Buffer.concat(parts);

    const reqHeaders: Record<string, string> = {
      ...headers,
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': fullBody.length.toString(),
    };

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port,
        path: urlPath,
        method: 'POST',
        headers: reqHeaders,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const raw = Buffer.concat(chunks).toString('utf-8');
          let data = raw;
          try {
            data = JSON.parse(raw);
          } catch {}
          resolve({ statusCode: res.statusCode || 0, data });
        });
      }
    );

    req.on('error', reject);
    req.write(fullBody);
    req.end();
  });
}

function requestJson(
  method: string,
  urlPath: string,
  headers: Record<string, string> = {},
  body?: any
): Promise<{ statusCode: number; data: any }> {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : undefined;
    const reqHeaders: Record<string, string> = { ...headers };
    if (payload) {
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(payload).toString();
    }

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port,
        path: urlPath,
        method,
        headers: reqHeaders,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const raw = Buffer.concat(chunks).toString('utf-8');
          let data = raw;
          try {
            data = JSON.parse(raw);
          } catch {}
          resolve({ statusCode: res.statusCode || 0, data });
        });
      }
    );

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function runMainsE2ETests() {
  console.log('🚀 Starting Mains Answer Writing & Evaluation E2E Test Suite...\n');
  await connectDB();

  server = http.createServer(app);
  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address() as any;
      port = addr.port;
      console.log(`📡 Test Server listening on http://127.0.0.1:${port}`);
      resolve();
    });
  });

  const student = await User.findOne({ email: 'rohit.verma@rajinderlawacademy.com' });
  const admin = await User.findOne({ role: 'admin' });

  if (!student || !admin) throw new Error('Student or Admin user not found.');

  const { accessToken: studentToken } = generateAuthTokens(student._id, student.authVersion ?? 1, student.role);
  const { accessToken: adminToken } = generateAuthTokens(admin._id, admin.authVersion ?? 1, admin.role);

  const studentHeaders = { Authorization: `Bearer ${studentToken}` };
  const adminHeaders = { Authorization: `Bearer ${adminToken}` };

  let passed = 0;
  let total = 0;

  function assert(cond: boolean, msg: string) {
    total++;
    if (cond) {
      console.log(`  ✅ [PASS] ${msg}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${msg}`);
      throw new Error(`Test failed: ${msg}`);
    }
  }

  try {
    // 1. Fetch active question
    console.log('\n--- 1. Student Active Question Retrieval ---');
    const activeRes = await requestJson('GET', '/api/mains/questions/active', studentHeaders);
    assert(activeRes.statusCode === 200, 'GET /api/mains/questions/active returns 200');
    assert(activeRes.data.success === true, 'Response success: true');
    assert(activeRes.data.question && activeRes.data.question.questionCode === 'DAW-2026-084', 'Returns active question DAW-2026-084');

    // 2. Fetch student's own submissions
    console.log('\n--- 2. Student Submissions & Evaluated Copies ---');
    const mySubsRes = await requestJson('GET', '/api/mains/submissions/my', studentHeaders);
    assert(mySubsRes.statusCode === 200, 'GET /api/mains/submissions/my returns 200');
    assert(mySubsRes.data.counts.evaluated >= 1, 'Found at least 1 seeded evaluated copy');
    const hasSeededEval = mySubsRes.data.submissions.some((s: any) => s.status === 'evaluated' && s.score === 15.5);
    assert(hasSeededEval, 'Seeded evaluated copy with 15.5 score and faculty remarks is present');

    // 3. Submit new answer sheet PDF for active question
    console.log('\n--- 3. Student Answer Copy PDF Upload ---');
    const samplePdfBuffer = Buffer.from('%PDF-1.4 Minimal Test PDF for Mains Copy %%EOF', 'utf-8');
    const uploadRes = await requestMultipart(
      '/api/mains/submissions',
      studentHeaders,
      {
        questionId: activeRes.data.question._id,
        notes: 'Submitted test copy for E2E verification.',
      },
      {
        fieldname: 'pdf',
        filename: 'Rohit_Verma_DAW_84_Answersheet.pdf',
        contentType: 'application/pdf',
        buffer: samplePdfBuffer,
      }
    );
    assert(uploadRes.statusCode === 201, 'POST /api/mains/submissions returns 201 Created');
    assert(uploadRes.data.success === true, 'Answer copy upload returns success');
    assert(uploadRes.data.submission.status === 'pending', 'New submission status is "pending"');
    const newSubId = uploadRes.data.submission._id;

    // 4. Admin Pending Inbox
    console.log('\n--- 4. Admin Evaluation Desk Pending Queue ---');
    const pendingRes = await requestJson('GET', '/api/mains/admin/submissions/pending', adminHeaders);
    assert(pendingRes.statusCode === 200, 'GET /api/mains/admin/submissions/pending returns 200');
    assert(pendingRes.data.count >= 1, 'Pending submissions queue has items');
    const foundInPending = pendingRes.data.submissions.find((s: any) => s._id === newSubId);
    assert(Boolean(foundInPending), 'Newly submitted copy is present in Admin pending inbox');
    assert(foundInPending.student.name === student.name, 'Student name is correctly populated');

    // 5. Admin evaluates the submission
    console.log('\n--- 5. Admin Evaluation & Return to Student ---');
    const evalRes = await requestJson(
      'POST',
      `/api/mains/admin/submissions/${newSubId}/evaluate`,
      adminHeaders,
      {
        score: '17.0',
        remarks: 'Very well structured. Good distinction drawn regarding foreign court jurisdiction under Section 10.',
        strengths: 'Clear headings and statutory language.',
        needsWork: 'Can elaborate on inherent powers under Section 151 when Section 10 does not strictly apply.',
      }
    );
    assert(evalRes.statusCode === 200, 'POST /evaluate returns 200');
    assert(evalRes.data.submission.status === 'evaluated', 'Status updated to "evaluated"');
    assert(evalRes.data.submission.score === 17.0, 'Score 17.0 recorded in database');

    // 6. Admin Graded Archive
    console.log('\n--- 6. Admin Graded Archive Verification ---');
    const gradedRes = await requestJson('GET', '/api/mains/admin/submissions/graded', adminHeaders);
    assert(gradedRes.statusCode === 200, 'GET /admin/submissions/graded returns 200');
    const foundInGraded = gradedRes.data.submissions.find((s: any) => s._id === newSubId);
    assert(Boolean(foundInGraded), 'Evaluated copy now appears in Admin graded archive');

    // 7. Student checks "Evaluated Copies & Remarks"
    console.log('\n--- 7. Student Evaluated Copies Sync ---');
    const studentEvalRes = await requestJson('GET', '/api/mains/submissions/my?status=evaluated', studentHeaders);
    assert(studentEvalRes.statusCode === 200, 'Student can retrieve evaluated copies (200)');
    const studentView = studentEvalRes.data.submissions.find((s: any) => s._id === newSubId);
    assert(Boolean(studentView), 'Evaluated copy immediately synced to student portal');
    assert(studentView.score === 17.0, 'Student sees the awarded score 17.0');
    assert(studentView.remarks.includes('foreign court'), 'Student sees faculty qualitative remarks');

    console.log(`\n=============================================================`);
    console.log(`🎉 ALL ${passed}/${total} MAINS ANSWER WRITING E2E TESTS PASSED!`);
    console.log(`=============================================================\n`);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await disconnectDB();
  }
}

runMainsE2ETests().catch((err) => {
  console.error('❌ E2E Error:', err);
  process.exit(1);
});

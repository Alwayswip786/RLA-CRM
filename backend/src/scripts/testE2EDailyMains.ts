/**
 * E2E Integration Test Suite for Daily Mains Challenge (DAW Clinic)
 * 
 * Tests the complete lifecycle:
 * 1. Admin creates and schedules Challenge #48.
 * 2. Student fetches today's challenge via GET /api/mains/questions/today.
 * 3. Student uploads answer copy v1.
 * 4. Student replaces answer copy with v2 before deadline; verifies revision history.
 * 5. Admin claims submission and evaluates with rubrics & structured remarks.
 * 6. Student views autopsy (rubric scores, remarks & model answer).
 * 7. Student streak tracking verification.
 */

import assert from 'node:assert';
import http from 'node:http';
import mongoose from 'mongoose';
import connectDB, { disconnectDB } from '../config/db.js';
import app from '../app.js';
import path from 'path';
import fs from 'fs';
import User from '../models/user.model.js';
import MainsQuestion from '../models/mainsQuestion.model.js';
import MainsSubmission from '../models/mainsSubmission.model.js';
import MainsStreak from '../models/mainsStreak.model.js';
import { generateAuthTokens } from '../utils/jwt.js';

const PORT = 54891;
let server: http.Server;
const BASE_URL = `http://127.0.0.1:${PORT}/api/mains`;

async function runMainsE2ETests() {
  console.log('🚀 Starting Daily Mains Challenge E2E Test Suite...\n');

  try {
    await connectDB();

    server = http.createServer(app);
    await new Promise<void>((resolve) => {
      server.listen(PORT, '127.0.0.1', () => {
        console.log(`📡 In-memory test server listening on port ${PORT}\n`);
        resolve();
      });
    });

    // Find or create admin user
    let adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      adminUser = await User.create({
        name: 'Adv. Rajinder Sir',
        email: 'admin.mains@rajinderlawacademy.com',
        phone: '9888877771',
        password: 'Password123!',
        role: 'admin',
        isVerified: true,
      });
    }

    // Find or create student user
    let studentUser = await User.findOne({ role: 'student' });
    if (!studentUser) {
      studentUser = await User.create({
        name: 'Aarav Sharma',
        email: 'aarav.mains@rajinderlawacademy.com',
        phone: '9888877772',
        password: 'Password123!',
        role: 'student',
        isVerified: true,
        rollNo: 'DJS-2026-089',
        targetExam: 'Delhi Judicial Service',
      });
    }

    const adminTokens = generateAuthTokens(adminUser._id, adminUser.authVersion ?? 1, adminUser.role);
    const studentTokens = generateAuthTokens(studentUser._id, studentUser.authVersion ?? 1, studentUser.role);
    const adminToken = adminTokens.accessToken;
    const studentToken = studentTokens.accessToken;

    const adminHeaders = {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    };

    const studentHeaders = {
      Authorization: `Bearer ${studentToken}`,
      'Content-Type': 'application/json',
    };

    // Clean previous test data for this specific test
    await MainsSubmission.deleteMany({ student: studentUser._id });
    await MainsStreak.deleteMany({ student: studentUser._id });
    await MainsQuestion.deleteMany({ questionCode: 'DAW-2026-TEST48' });

    // Step 1: Admin schedules Challenge #48
    console.log('Step 1: Admin creates & schedules Daily Mains Challenge #48...');
    const deadline = new Date(Date.now() + 4 * 60 * 60 * 1000); // 4 hours from now

    const createPayload = {
      challengeNumber: 48,
      questionCode: 'DAW-2026-TEST48',
      paper: 'Criminal Law & Procedure (Mains)',
      subject: 'Indian Evidence Act / BSA 2023',
      title: 'Discuss the evidentiary admissibility of a statement leading to the discovery of a fact under Section 27 of the Indian Evidence Act, 1872 (now Section 23 of the Bharatiya Sakshya Adhiniyam, 2023). In light of landmark Supreme Court jurisprudence, examine whether Section 27 violates the fundamental right against self-incrimination guaranteed under Article 20(3) of the Constitution.',
      marks: 15,
      wordLimit: 250,
      turnaroundHours: 24,
      evaluatorName: 'Adv. Rajinder Sir',
      submissionDeadline: deadline.toISOString(),
      guidelines: [
        'Introduction: Concept of confession vs discovery fact',
        'Constitutional Validity: State of Bombay v. Kathi Kalu Oghad',
        'Extent of admissibility: Pulukuri Kottaya v. King Emperor',
        'Conclusion and transition to BSA Section 23',
      ],
      modelAnswer: 'Section 27 of the Indian Evidence Act operates as an exception to Sections 25 and 26. In Kathi Kalu Oghad (1961), the 11-judge bench held that self-incrimination under Art 20(3) requires compulsion to be a witness against oneself. Discovery of a physical object does not constitute coerced testimony.',
      isModelAnswerPublished: false,
      status: 'active',
      isActive: true,
    };

    const createRes = await fetch(`${BASE_URL}/admin/questions`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify(createPayload),
    });

    const createData: any = await createRes.json();
    assert.strictEqual(createRes.status, 201, 'Admin question creation returns 201');
    assert.strictEqual(createData.success, true);
    assert.strictEqual(createData.question.challengeNumber, 48);
    assert.strictEqual(createData.question.paper, 'Criminal Law & Procedure (Mains)');
    const createdQuestionId = createData.question._id;
    console.log(`  ✅ PASS: Scheduled Challenge #${createData.question.challengeNumber} (${createData.question.questionCode})\n`);

    // Step 2: Student fetches Today's Challenge
    console.log("Step 2: Student fetches Today's Challenge...");
    const todayRes = await fetch(`${BASE_URL}/questions/today`, {
      headers: studentHeaders,
    });
    const todayData: any = await todayRes.json();
    assert.strictEqual(todayRes.status, 200);
    assert.strictEqual(todayData.success, true);
    assert.strictEqual(todayData.question._id, createdQuestionId);
    assert.strictEqual(todayData.question.challengeNumber, 48);
    assert(todayData.deadlineInfo, 'Must have deadlineInfo');
    assert.strictEqual(todayData.deadlineInfo.isPassed, false);
    assert(todayData.deadlineInfo.formattedText.includes('Due in'), 'Formatted countdown text expected');
    // Model answer must be hidden before evaluation / deadline
    assert.strictEqual(todayData.question.modelAnswer, undefined, 'Model answer must be hidden before evaluation');
    console.log(`  ✅ PASS: Today's Challenge loaded with countdown: "${todayData.deadlineInfo.formattedText}"\n`);

    // Step 3: Student uploads initial answer copy (v1)
    console.log('Step 3: Student uploads answer copy v1...');
    // Create a temporary dummy file to upload
    const dummyPdfPath = path.join(process.cwd(), 'uploads', 'temp_test_copy_v1.pdf');
    fs.writeFileSync(dummyPdfPath, '%PDF-1.4 dummy test answer sheet content for challenge 48');

    const formData1 = new FormData();
    const fileBlob1 = new Blob([fs.readFileSync(dummyPdfPath)], { type: 'application/pdf' });
    formData1.append('pdf', fileBlob1, 'Aarav_Sharma_DAW_48_v1.pdf');
    formData1.append('questionId', createdQuestionId);
    formData1.append('notes', 'Strict 20-minute timed attempt. Focused on Kathi Kalu Oghad.');

    const sub1Res = await fetch(`${BASE_URL}/submissions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${studentToken}`,
      },
      body: formData1,
    });

    const sub1Data: any = await sub1Res.json();
    assert.strictEqual(sub1Res.status, 201, 'Initial submission returns 201 Created');
    assert.strictEqual(sub1Data.success, true);
    assert.strictEqual(sub1Data.version, 1);
    assert.strictEqual(sub1Data.isReplacement, false);
    assert.strictEqual(sub1Data.submission.status, 'pending');
    const submissionId = sub1Data.submission._id;
    console.log(`  ✅ PASS: Uploaded answer copy v1 (Submission ID: ${submissionId})\n`);

    // Step 4: Student replaces answer copy with v2 before deadline
    console.log('Step 4: Student replaces answer copy with v2 before deadline...');
    const dummyPdfPath2 = path.join(process.cwd(), 'uploads', 'temp_test_copy_v2.pdf');
    fs.writeFileSync(dummyPdfPath2, '%PDF-1.4 improved answer sheet content with Pulukuri Kottaya citations');

    const formData2 = new FormData();
    const fileBlob2 = new Blob([fs.readFileSync(dummyPdfPath2)], { type: 'application/pdf' });
    formData2.append('pdf', fileBlob2, 'Aarav_Sharma_DAW_48_v2.pdf');
    formData2.append('questionId', createdQuestionId);
    formData2.append('notes', 'Revised copy with Section 23 BSA comparative table added.');

    const sub2Res = await fetch(`${BASE_URL}/submissions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${studentToken}`,
      },
      body: formData2,
    });

    const sub2Data: any = await sub2Res.json();
    assert.strictEqual(sub2Res.status, 200, 'Replacement returns 200 OK');
    assert.strictEqual(sub2Data.success, true);
    assert.strictEqual(sub2Data.isReplacement, true);
    assert.strictEqual(sub2Data.version, 2);

    // Verify revision history in DB
    const subInDb = await MainsSubmission.findById(submissionId);
    assert(subInDb, 'Submission must exist in DB');
    assert.strictEqual(subInDb.version, 2);
    assert.strictEqual(subInDb.revisionHistory.length, 1, 'Previous version must be archived in revisionHistory');
    assert.strictEqual(subInDb.revisionHistory[0]?.version, 1);
    console.log(`  ✅ PASS: Successfully replaced copy to v2. Revision history preserved v1 copy.\n`);

    // Step 5: Admin views pending inbox & evaluates submission with rubrics
    console.log('Step 5: Admin claims & evaluates submission with rubrics...');
    // Claim lock
    const claimRes = await fetch(`${BASE_URL}/admin/submissions/${submissionId}/claim`, {
      method: 'POST',
      headers: adminHeaders,
    });
    const claimData: any = await claimRes.json();
    assert.strictEqual(claimRes.status, 200);
    assert.strictEqual(claimData.submission.status, 'under_review');
    console.log('  ✅ Locked submission for review');

    // Evaluate
    const rubricPayload = {
      score: 12.5,
      rubricBreakdown: JSON.stringify([
        { criterion: 'legalDoctrine', label: 'Legal Doctrine & Constitutional Jurisprudence', score: 4.5, maxScore: 5 },
        { criterion: 'caseApplication', label: 'Case Law Application (Kathi Kalu Oghad & Selvi)', score: 4.0, maxScore: 5 },
        { criterion: 'structuringLanguage', label: 'Answer Structuring & Legal Headings', score: 4.0, maxScore: 5 },
      ]),
      remarks: 'Impressive command over Section 27. Excellent contrast with Article 20(3).',
      strengths: 'Clear ratio explanation of Kathi Kalu Oghad. Good hand-drawn transition diagram.',
      mistakes: 'Missed citing Selvi v. State of Karnataka regarding involuntary narco-analysis discovery.',
      improvementPoints: 'Highlight the difference between fact discovered and object discovered more sharply.',
    };

    const evalFormData = new FormData();
    evalFormData.append('score', '12.5');
    evalFormData.append('rubricBreakdown', rubricPayload.rubricBreakdown);
    evalFormData.append('remarks', rubricPayload.remarks);
    evalFormData.append('strengths', rubricPayload.strengths);
    evalFormData.append('mistakes', rubricPayload.mistakes);
    evalFormData.append('improvementPoints', rubricPayload.improvementPoints);

    const evalRes = await fetch(`${BASE_URL}/admin/submissions/${submissionId}/evaluate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
      body: evalFormData,
    });

    const evalData: any = await evalRes.json();
    assert.strictEqual(evalRes.status, 200, 'Evaluation returns 200');
    assert.strictEqual(evalData.success, true);
    assert.strictEqual(evalData.submission.status, 'evaluated');
    assert.strictEqual(evalData.submission.score, 12.5);
    assert.strictEqual(evalData.submission.rubricBreakdown.length, 3);
    console.log(`  ✅ PASS: Evaluated copy with Score 12.5/15 & 3 rubric criteria\n`);

    // Step 6: Student retrieves Autopsy (copy + model answer)
    console.log('Step 6: Student retrieves comparative autopsy...');
    const autopsyRes = await fetch(`${BASE_URL}/submissions/${submissionId}/autopsy`, {
      headers: studentHeaders,
    });
    const autopsyData: any = await autopsyRes.json();
    assert.strictEqual(autopsyRes.status, 200);
    assert.strictEqual(autopsyData.success, true);
    assert.strictEqual(autopsyData.submission.status, 'evaluated');
    assert.strictEqual(autopsyData.submission.score, 12.5);
    assert(autopsyData.submission.question.modelAnswer, 'Model answer now revealed in autopsy');
    console.log(`  ✅ PASS: Autopsy contains rubric marks and model answer synopsis\n`);

    // Step 7: Verify Student Streak
    console.log('Step 7: Verifying Student Consistency Streak...');
    const streakDoc = await MainsStreak.findOne({ student: studentUser._id });
    assert(streakDoc, 'Streak record must exist');
    assert(streakDoc.currentStreak >= 1, 'Current streak must be at least 1');
    assert(streakDoc.totalSubmissions >= 1, 'Total submissions must be tracked');
    console.log(`  ✅ PASS: Student streak verified: ${streakDoc.currentStreak} day streak, ${streakDoc.totalSubmissions} lifetime DAW attempts\n`);

    // Clean up temporary dummy files
    if (fs.existsSync(dummyPdfPath)) fs.unlinkSync(dummyPdfPath);
    if (fs.existsSync(dummyPdfPath2)) fs.unlinkSync(dummyPdfPath2);

    console.log('🎉 ALL 7 DAILY MAINS E2E TESTS PASSED WITH 100% SUCCESS!\n');
  } catch (err) {
    console.error('❌ Mains E2E Test Failure:', err);
    process.exitCode = 1;
  } finally {
    if (server) {
      server.close();
    }
    await disconnectDB();
  }
}

runMainsE2ETests();

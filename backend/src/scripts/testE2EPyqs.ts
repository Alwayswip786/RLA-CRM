import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://127.0.0.1:8000';

interface LoginResponse {
  success: boolean;
  message: string;
  accessToken: string;
  user: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
}

async function runE2ETests() {
  console.log('===========================================================');
  console.log('🚀 STARTING COMPREHENSIVE E2E VERIFICATION SUITE');
  console.log('   Solved PYQ Archive System & PDF Streaming Engine');
  console.log('===========================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, detail?: any) {
    totalTests++;
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}`, detail !== undefined ? detail : '');
      throw new Error(`Assertion failed for: ${testName}`);
    }
  }

  try {
    // Wait for server to be ready
    for (let i = 0; i < 10; i++) {
      try {
        const res = await fetch(`${BASE_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: '{}',
        });
        if (res.status) break;
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    // -------------------------------------------------------------
    // Step 1: User Authentication
    // -------------------------------------------------------------
    console.log('\n--- Step 1: User Authentication ---');

    const studentLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'rohit.verma@rajinderlawacademy.com',
        password: 'Judicial@2025',
      }),
    });
    const studentData = (await studentLoginRes.json()) as LoginResponse;
    assert(studentData.success && !!studentData.accessToken, 'Student Rohit Verma logs in successfully');
    const studentToken = studentData.accessToken;

    const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'director@rajinderlawacademy.com',
        password: 'Judicial@2025',
      }),
    });
    const adminData = (await adminLoginRes.json()) as LoginResponse;
    assert(adminData.success && !!adminData.accessToken, 'Admin Adv. Rajinder Sir logs in successfully');
    const adminToken = adminData.accessToken;

    // -------------------------------------------------------------
    // Step 2: Student Filter & Library Endpoints
    // -------------------------------------------------------------
    console.log('\n--- Step 2: Student Filter & Library Endpoints ---');

    // 2.1 Fetch Filter Meta
    const metaRes = await fetch(`${BASE_URL}/api/pyqs/meta/filters`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const metaData = (await metaRes.json()) as any;
    assert(metaData.success && Array.isArray(metaData.meta.exams), 'Student retrieves dynamic filter metadata');
    assert(metaData.meta.exams.length >= 3, `Filter meta includes multiple judicial exams (found ${metaData.meta.exams.length})`);
    assert(metaData.meta.years.length >= 2, `Filter meta includes multiple exam years (found ${metaData.meta.years.length})`);

    // 2.2 List published papers
    const libraryRes = await fetch(`${BASE_URL}/api/pyqs?page=1&limit=10`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const libraryData = (await libraryRes.json()) as any;
    assert(libraryData.success && Array.isArray(libraryData.pyqs), 'Student fetches published PYQ library');
    assert(libraryData.pyqs.length >= 4, `Found ${libraryData.pyqs.length} published papers in Student Vault`);

    // Check draft paper exclusion: no unpublished paper should be in student's published list
    const draftFoundInStudentList = libraryData.pyqs.some((p: any) => p.isPublished === false);
    assert(!draftFoundInStudentList, 'Unpublished draft papers are securely excluded from Student Vault');

    // 2.3 Test keyword search
    const searchRes = await fetch(`${BASE_URL}/api/pyqs?search=Res%20Judicata`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const searchData = (await searchRes.json()) as any;
    assert(searchData.success && searchData.pyqs.length >= 1, 'Search query for "Res Judicata" returns matching papers');
    assert(searchData.pyqs[0].topics.some((t: string) => t.toLowerCase().includes('res judicata')), 'Search matches topic tags');

    // 2.4 Test stage filtering
    const stageRes = await fetch(`${BASE_URL}/api/pyqs?stage=Prelims`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const stageData = (await stageRes.json()) as any;
    assert(stageData.success && stageData.pyqs.every((p: any) => p.stage === 'Prelims'), 'Stage filter returns only Prelims papers');

    // 2.5 Single paper detail & related papers
    const targetPaper = libraryData.pyqs[0];
    const detailRes = await fetch(`${BASE_URL}/api/pyqs/${targetPaper._id}`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const detailData = (await detailRes.json()) as any;
    assert(detailData.success && detailData.pyq._id === targetPaper._id, 'Student fetches single PYQ paper details');
    assert(Array.isArray(detailData.related), 'Paper detail response includes related papers array');

    // -------------------------------------------------------------
    // Step 3: PDF Range Streaming (HTTP 206) & Download Counter
    // -------------------------------------------------------------
    console.log('\n--- Step 3: PDF Streaming & Download Handling ---');

    // 3.1 HTTP 206 Partial Content Range Request
    const rangeRes = await fetch(`${BASE_URL}/api/pyqs/${targetPaper._id}/preview`, {
      headers: {
        Authorization: `Bearer ${studentToken}`,
        Range: 'bytes=0-300',
      },
    });
    assert(rangeRes.status === 206, 'Server responds with HTTP 206 Partial Content for Range requests');
    assert(rangeRes.headers.get('content-type') === 'application/pdf', 'Response Content-Type is application/pdf');
    assert(!!rangeRes.headers.get('content-disposition')?.includes('inline'), 'Content-Disposition is inline for viewer');
    assert(!!rangeRes.headers.get('content-range'), 'Content-Range header returned: ' + rangeRes.headers.get('content-range'));

    // 3.2 Full file preview without Range
    const fullPreviewRes = await fetch(`${BASE_URL}/api/pyqs/${targetPaper._id}/preview`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(fullPreviewRes.status === 200, 'Server responds with HTTP 200 for full PDF stream');

    // 3.3 Download and Atomic Counter Tracking
    const initialDownloadCount = targetPaper.downloadCount;
    const downloadRes = await fetch(`${BASE_URL}/api/pyqs/${targetPaper._id}/download`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(downloadRes.status === 200, 'Download endpoint responds with HTTP 200');
    assert(!!downloadRes.headers.get('content-disposition')?.includes('attachment'), 'Content-Disposition is attachment for download');
    const downloadBlob = await downloadRes.arrayBuffer();
    assert(downloadBlob.byteLength > 0, 'Binary PDF payload received with byte length: ' + downloadBlob.byteLength);

    // Verify atomic increment
    const verifyPaperRes = await fetch(`${BASE_URL}/api/pyqs/${targetPaper._id}`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const verifiedPaperData = (await verifyPaperRes.json()) as any;
    assert(
      verifiedPaperData.pyq.downloadCount === initialDownloadCount + 1,
      `Download counter incremented atomically from ${initialDownloadCount} to ${verifiedPaperData.pyq.downloadCount}`
    );

    // -------------------------------------------------------------
    // Step 4: Admin Management & Publication Toggles
    // -------------------------------------------------------------
    console.log('\n--- Step 4: Admin Management & Publication Toggles ---');

    // 4.1 Admin fetches all papers with KPI stats
    const adminListRes = await fetch(`${BASE_URL}/api/pyqs/admin/all`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminListData = (await adminListRes.json()) as any;
    assert(adminListData.success && !!adminListData.stats, 'Admin fetches all papers with KPI statistics');
    console.log('     Admin KPI Stats:', JSON.stringify(adminListData.stats));
    assert(adminListData.stats.totalPapers >= 5, 'KPI stats reflects totalPapers >= 5');
    assert(adminListData.stats.draftCount >= 1, 'KPI stats reflects at least 1 draft paper');

    // 4.2 Toggle publish status of the draft paper
    const draftPaper = adminListData.pyqs.find((p: any) => !p.isPublished);
    assert(!!draftPaper, 'Found draft paper in Admin desk: ' + draftPaper?.title);

    const publishRes = await fetch(`${BASE_URL}/api/pyqs/${draftPaper._id}/publish`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const publishData = (await publishRes.json()) as any;
    assert(publishData.success && publishData.isPublished === true, 'Admin toggles paper status to PUBLISHED');

    // Verify it is now visible in student published list
    const studentCheckRes = await fetch(`${BASE_URL}/api/pyqs/${draftPaper._id}`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(studentCheckRes.status === 200, 'Student can now access the newly published paper');

    // Toggle it back to draft
    const unpublishRes = await fetch(`${BASE_URL}/api/pyqs/${draftPaper._id}/publish`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const unpublishData = (await unpublishRes.json()) as any;
    assert(unpublishData.success && unpublishData.isPublished === false, 'Admin toggles paper back to DRAFT');

    // 4.3 Update paper metadata
    const updateRes = await fetch(`${BASE_URL}/api/pyqs/${draftPaper._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        totalMarks: 250,
        description: 'Updated comprehensive model answers with latest high court revisions.',
      }),
    });
    const updateData = (await updateRes.json()) as any;
    assert(updateData.success && updateData.pyq.totalMarks === 250, 'Admin updates paper metadata (totalMarks: 250)');

    // -------------------------------------------------------------
    // Step 5: Multipart File Upload & Cleanup
    // -------------------------------------------------------------
    console.log('\n--- Step 5: Multipart Upload & Cleanup ---');

    // Create a temporary PDF file to test multipart upload
    const dummyPdfContent = Buffer.from(
      '%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [] /Count 0 >>\nendobj\nxref\n0 3\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \ntrailer\n<< /Size 3 /Root 1 0 R >>\nstartxref\n115\n%%EOF'
    );
    const testPdfBlob = new Blob([dummyPdfContent], { type: 'application/pdf' });

    const formData = new FormData();
    formData.append('pdf', testPdfBlob, 'E2E_Test_Paper.pdf');
    formData.append('title', 'E2E Automated Test Solved Paper 2026');
    formData.append('exam', 'Delhi Judicial Service (DJS)');
    formData.append('year', '2026');
    formData.append('stage', 'Mains');
    formData.append('subject', 'Commercial Law & Arbitration');
    formData.append('totalMarks', '200');
    formData.append('description', 'Test paper created by automated E2E test suite.');
    formData.append('isPublished', 'false');

    const uploadRes = await fetch(`${BASE_URL}/api/pyqs`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
      body: formData,
    });
    const uploadData = (await uploadRes.json()) as any;
    assert(uploadData.success && !!uploadData.pyq?._id, 'Admin successfully uploads new solved paper with multipart/form-data');
    const createdPaperId = uploadData.pyq._id;
    const physicalCreatedPath = uploadData.pyq.pdfFile.path;
    assert(fs.existsSync(physicalCreatedPath), 'Uploaded PDF saved physically on disk: ' + physicalCreatedPath);

    // Delete paper and verify physical file cleanup
    const deleteRes = await fetch(`${BASE_URL}/api/pyqs/${createdPaperId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const deleteData = (await deleteRes.json()) as any;
    assert(deleteData.success, 'Admin deletes test paper');
    assert(!fs.existsSync(physicalCreatedPath), 'Physical PDF file cleanly unlinked from disk upon deletion');

    console.log('\n===========================================================');
    console.log(`🏆 ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY!`);
    console.log('   PYQ Solved Archive & PDF Streaming are 100% Operational.');
    console.log('===========================================================\n');
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ E2E Verification Suite encountered an error:', error.message, error.stack);
    process.exit(1);
  }
}

runE2ETests();

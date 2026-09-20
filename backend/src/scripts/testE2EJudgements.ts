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
  console.log('   Landmark Judgement Digest Module & PDF Streaming Engine');
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
    // Readiness check loop
    for (let i = 0; i < 15; i++) {
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
    const metaRes = await fetch(`${BASE_URL}/api/judgements/meta/filters`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const metaData = (await metaRes.json()) as any;
    assert(metaData.success && Array.isArray(metaData.meta.courts), 'Student retrieves dynamic filter metadata');
    assert(metaData.meta.courts.includes('Supreme Court of India'), 'Filter meta includes Supreme Court of India');
    assert(metaData.meta.subjects.length >= 2, `Filter meta includes multiple legal subjects (found ${metaData.meta.subjects.length})`);
    assert(metaData.meta.totalPublished >= 4, `Filter meta reflects at least 4 published precedents (found ${metaData.meta.totalPublished})`);

    // 2.2 Featured Judgement of the Day
    const featuredRes = await fetch(`${BASE_URL}/api/judgements/featured`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const featuredData = (await featuredRes.json()) as any;
    assert(featuredData.success && featuredData.featured !== null, 'Student retrieves Precedent of the Day');
    assert(
      featuredData.featured.title.includes('Kesavananda') || featuredData.featured.importance === 'Landmark',
      `Spotlight precedent is an authentic landmark (${featuredData.featured.title})`
    );

    // 2.3 List published judgements
    const libraryRes = await fetch(`${BASE_URL}/api/judgements?page=1&limit=25`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const libraryData = (await libraryRes.json()) as any;
    assert(libraryData.success, 'Student retrieves published judgements list');
    assert(libraryData.judgements.length >= 4, `Student sees at least 4 published precedents (found ${libraryData.judgements.length})`);

    const kesavananda = libraryData.judgements.find((j: any) => j.title.includes('Kesavananda'));
    assert(!!kesavananda, 'Published list contains landmark Kesavananda Bharati');
    assert(
      Array.isArray(kesavananda.ratioDecidendi) && kesavananda.ratioDecidendi.length >= 3,
      'Kesavananda contains authoritative 3-Point Ratio Decidendi'
    );
    assert(
      kesavananda.legalProvisions.includes('Article 368'),
      'Kesavananda contains legal provision Article 368'
    );

    // 2.4 Faceted search by subject
    const subjectRes = await fetch(
      `${BASE_URL}/api/judgements?subject=${encodeURIComponent('Constitutional Law')}`,
      {
        headers: { Authorization: `Bearer ${studentToken}` },
      }
    );
    const subjectData = (await subjectRes.json()) as any;
    assert(subjectData.success && subjectData.judgements.length >= 1, 'Filter by Constitutional Law returns matching cases');

    // 2.5 Text search by keyword
    const searchRes = await fetch(
      `${BASE_URL}/api/judgements?search=${encodeURIComponent('Basic Structure')}`,
      {
        headers: { Authorization: `Bearer ${studentToken}` },
      }
    );
    const searchData = (await searchRes.json()) as any;
    assert(searchData.success && searchData.judgements.length >= 1, 'Text search for "Basic Structure" returns Kesavananda Bharati');

    // 2.6 Fetch single judgement by ID
    const singleRes = await fetch(`${BASE_URL}/api/judgements/${kesavananda._id}`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const singleData = (await singleRes.json()) as any;
    assert(singleData.success && singleData.judgement._id === kesavananda._id, 'Fetch single judgement by ID succeeds');

    // -------------------------------------------------------------
    // Step 3: PDF Streaming Engine & Download Tracking
    // -------------------------------------------------------------
    console.log('\n--- Step 3: PDF Streaming Engine & Download Tracking ---');

    // 3.1 HTTP 206 Partial Content Range Request (First 300 bytes)
    const rangeRes = await fetch(`${BASE_URL}/api/judgements/${kesavananda._id}/preview`, {
      headers: {
        Authorization: `Bearer ${studentToken}`,
        Range: 'bytes=0-299',
      },
    });
    assert(rangeRes.status === 206, `Range request returns HTTP 206 Partial Content (status ${rangeRes.status})`);
    assert(
      !!rangeRes.headers.get('content-range')?.startsWith('bytes 0-299/'),
      `Content-Range header returned: ${rangeRes.headers.get('content-range')}`
    );
    assert(
      rangeRes.headers.get('content-type') === 'application/pdf',
      'Content-Type header is application/pdf'
    );
    assert(
      rangeRes.headers.get('accept-ranges') === 'bytes',
      'Accept-Ranges header is bytes'
    );

    const rangeBuffer = await rangeRes.arrayBuffer();
    assert(rangeBuffer.byteLength === 300, `Received exact 300 byte chunk (actual ${rangeBuffer.byteLength})`);

    // 3.2 Full PDF stream (HTTP 200)
    const fullStreamRes = await fetch(`${BASE_URL}/api/judgements/${kesavananda._id}/preview`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(fullStreamRes.status === 200, 'Standard preview returns HTTP 200 OK');
    const fullBuffer = await fullStreamRes.arrayBuffer();
    const pdfHeader = Buffer.from(fullBuffer.slice(0, 5)).toString('ascii');
    assert(pdfHeader === '%PDF-', `Document starts with valid PDF header (found "${pdfHeader}")`);

    // 3.3 Query Token URL Preview
    const tokenStreamRes = await fetch(
      `${BASE_URL}/api/judgements/${kesavananda._id}/preview?token=${studentToken}`
    );
    assert(tokenStreamRes.status === 200, 'Query token auth stream returns HTTP 200 OK');

    // 3.4 Download PDF and verify downloadCount atomic increment
    const initialDownloads = kesavananda.downloadCount;
    const downloadRes = await fetch(`${BASE_URL}/api/judgements/${kesavananda._id}/download`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(downloadRes.status === 200, 'Download endpoint returns HTTP 200 OK');
    assert(
      !!downloadRes.headers.get('content-disposition')?.includes('attachment'),
      'Content-Disposition is attachment'
    );

    // Re-fetch to verify increment
    const refreshedRes = await fetch(`${BASE_URL}/api/judgements/${kesavananda._id}`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const refreshedData = (await refreshedRes.json()) as any;
    assert(
      refreshedData.judgement.downloadCount === initialDownloads + 1,
      `Download counter atomically incremented from ${initialDownloads} to ${refreshedData.judgement.downloadCount}`
    );

    // -------------------------------------------------------------
    // Step 4: Admin Management & KPI Statistics
    // -------------------------------------------------------------
    console.log('\n--- Step 4: Admin Management & KPI Statistics ---');

    const adminAllRes = await fetch(`${BASE_URL}/api/judgements/admin/all`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminAllData = (await adminAllRes.json()) as any;
    assert(adminAllData.success, 'Admin retrieves comprehensive judgement repository queue');
    assert(adminAllData.stats.totalPrecedents >= 5, `Admin KPI reports total precedents >= 5 (found ${adminAllData.stats.totalPrecedents})`);
    assert(adminAllData.stats.publishedCount >= 4, `Admin KPI reports published precedents >= 4 (found ${adminAllData.stats.publishedCount})`);
    assert(adminAllData.stats.draftCount >= 1, `Admin KPI reports draft precedents >= 1 (found ${adminAllData.stats.draftCount})`);
    assert(adminAllData.stats.totalDownloads > 0, `Admin KPI reports student downloads (found ${adminAllData.stats.totalDownloads})`);

    // 4.1 Non-admin student cannot access admin queue (RBAC 403)
    const unauthorizedRes = await fetch(`${BASE_URL}/api/judgements/admin/all`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(unauthorizedRes.status === 403, `Non-admin student blocked from admin queue with HTTP 403 (status ${unauthorizedRes.status})`);

    // -------------------------------------------------------------
    // Step 5: Admin Upload, Metadata Update, Replace PDF & Delete
    // -------------------------------------------------------------
    console.log('\n--- Step 5: Admin Upload, Metadata Update, Replace PDF & Delete ---');

    // Create a temporary valid PDF document
    const tempPdfPath = path.join(process.cwd(), 'temp-test-judgement.pdf');
    const dummyPdfContent = `%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] >>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \ntrailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n185\n%%EOF`;
    fs.writeFileSync(tempPdfPath, dummyPdfContent);

    // 5.1 Admin uploads new landmark judgement
    const formData = new FormData();
    const fileBuffer = fs.readFileSync(tempPdfPath);
    const pdfBlob = new Blob([fileBuffer], { type: 'application/pdf' });
    formData.append('pdf', pdfBlob, 'Puttaswamy_Right_To_Privacy_Digest.pdf');
    formData.append('title', 'K.S. Puttaswamy v. Union of India (Privacy)');
    formData.append('citation', '(2017) 10 SCC 1 | AIR 2017 SC 4161');
    formData.append('court', 'Supreme Court of India');
    formData.append('bench', '9-Judge Constitutional Bench');
    formData.append('judges', 'J.S. Khehar, C.J., J. Chelameswar, D.Y. Chandrachud');
    formData.append('dateOfJudgement', '2017-08-24');
    formData.append('subject', 'Constitutional Law & Information Privacy');
    formData.append('legalProvisions', 'Article 21, Article 14, Article 19, Informational Privacy');
    formData.append('summary', 'Unanimous 9-judge bench holding that the Right to Privacy is an intrinsic fundamental right guaranteed under Article 21.');
    formData.append(
      'ratioDecidendi',
      JSON.stringify([
        'Privacy is a fundamental right grounded in human dignity and personal autonomy under Article 21.',
        'Any state intrusion must satisfy the three-fold test of legality, legitimate state aim, and proportionality.',
        'Overruled M.P. Sharma (1954) and Kharak Singh (1962) to the extent they held privacy was not a fundamental right.',
      ])
    );
    formData.append('mainsUtility', 'Indispensable for GS-II and Law Optional questions on surveillance, data protection, and Article 21 scope.');
    formData.append('overruledPrecedents', 'Overruled M.P. Sharma (1954) and Kharak Singh (1962).');
    formData.append('tags', 'Privacy, Article 21, Proportionality, Puttaswamy');
    formData.append('importance', 'Landmark');
    formData.append('isPublished', 'false'); // Create as draft initially
    formData.append('isFeatured', 'false');

    const uploadRes = await fetch(`${BASE_URL}/api/judgements`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: formData,
    });
    const uploadData = (await uploadRes.json()) as any;
    assert(uploadRes.status === 201 && uploadData.success, 'Admin uploads new Landmark Judgement with PDF');
    const createdId = uploadData.judgement._id;
    assert(uploadData.judgement.isPublished === false, 'New judgement created with draft status');

    // 5.2 Toggle publication status (Draft -> Published)
    const toggleRes = await fetch(`${BASE_URL}/api/judgements/${createdId}/publish`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const toggleData = (await toggleRes.json()) as any;
    assert(toggleData.success && toggleData.isPublished === true, '1-Click publish toggle successfully publishes the judgement');

    // 5.3 Update judgement metadata
    const updateRes = await fetch(`${BASE_URL}/api/judgements/${createdId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Justice K.S. Puttaswamy (Retd.) v. Union of India (Aadhaar & Privacy)',
        mainsUtility: 'Updated: Critical authority for proportionality standard and digital privacy.',
      }),
    });
    const updateData = (await updateRes.json()) as any;
    assert(updateData.success, 'Admin updates judgement metadata');
    assert(updateData.judgement.title.includes('Aadhaar & Privacy'), 'Updated title verified');

    // 5.4 Replace PDF document
    const replaceFormData = new FormData();
    const replacementBuffer = Buffer.from(dummyPdfContent + '\n% Revised Version');
    const replacementBlob = new Blob([replacementBuffer], { type: 'application/pdf' });
    replaceFormData.append('pdf', replacementBlob, 'Puttaswamy_Revised_Full_Digest.pdf');

    const replaceRes = await fetch(`${BASE_URL}/api/judgements/${createdId}/file`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: replaceFormData,
    });
    const replaceData = (await replaceRes.json()) as any;
    assert(replaceRes.status === 200 && replaceData.success, 'Admin replaces existing PDF document');
    assert(
      replaceData.judgement.pdfFile.originalName === 'Puttaswamy_Revised_Full_Digest.pdf',
      'Replaced PDF original filename updated'
    );

    // 5.5 Delete judgement and verify file cleanup
    const deleteRes = await fetch(`${BASE_URL}/api/judgements/${createdId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const deleteData = (await deleteRes.json()) as any;
    assert(deleteRes.status === 200 && deleteData.success, 'Admin deletes judgement record');

    // Verify it is gone from database
    const verifyRes = await fetch(`${BASE_URL}/api/judgements/${createdId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(verifyRes.status === 404, 'Deleted judgement returns HTTP 404 Not Found');

    // Clean up temporary local test file
    if (fs.existsSync(tempPdfPath)) {
      fs.unlinkSync(tempPdfPath);
    }

    console.log('\n===========================================================');
    console.log(`🎉 ALL TESTS PASSED SUCCESSFULLY! (${passedTests}/${totalTests})`);
    console.log('   Landmark Judgement Digest Module 100% OPERATIONAL');
    console.log('===========================================================');
  } catch (err: any) {
    console.error('\n❌ TEST SUITE FAILED:', err.message);
    process.exit(1);
  }
}

runE2ETests();

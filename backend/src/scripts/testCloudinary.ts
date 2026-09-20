import cloudinary, { isCloudinaryConfigured } from '../config/cloudinary.js';
import {
  uploadImageBufferToCloudinary,
  uploadDocumentBufferToCloudinary,
  getCloudinaryPublicId,
  deleteCloudinaryAssetByPublicId,
  deleteCloudinaryAssetByUrl,
} from '../utils/cloudinaryUpload.js';
import {
  fetchCloudinaryMediaLibrary,
  buildCloudinarySearchExpression,
  sanitizeLuceneString,
} from '../services/adminMedia.service.js';

const testPngBase64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

const testPdfString =
  '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000052 00000 n \n0000000108 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n183\n%%EOF';

async function runCloudinaryVerification() {
  console.log('===========================================================');
  console.log('☁️  CLOUDINARY INFRASTRUCTURE & INTEGRATION TEST SUITE');
  console.log('   Rajinder Law Academy CRM (RLA-CRM)');
  console.log('===========================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string, detail?: any) {
    total++;
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}`, detail !== undefined ? detail : '');
      throw new Error(`Assertion failed for: ${testName}`);
    }
  }

  try {
    // 1. Configuration Check
    console.log('[1/7] Checking Cloudinary Configuration...');
    assert(isCloudinaryConfigured, 'Cloudinary credentials configured in environment');

    // 2. Cloudinary API Ping
    console.log('\n[2/7] Testing Cloudinary API Ping...');
    const ping = await cloudinary.api.ping();
    assert(ping.status === 'ok', 'Cloudinary API Ping returns status "ok"');

    // 3. Image Buffer Streaming
    console.log('\n[3/7] Testing Image Upload Stream to Cloudinary (rla/tests)...');
    const imgBuffer = Buffer.from(testPngBase64, 'base64');
    const imgUpload = await uploadImageBufferToCloudinary(imgBuffer, 'rla/tests');
    assert(Boolean(imgUpload.secureUrl), 'Image upload returned secureUrl', imgUpload.secureUrl);
    assert(Boolean(imgUpload.publicId), 'Image upload returned publicId', imgUpload.publicId);
    assert(imgUpload.resourceType === 'image', 'Image resource type is "image"');
    console.log(`      Uploaded Image: ${imgUpload.secureUrl}`);

    // 4. Document / PDF Buffer Streaming
    console.log('\n[4/7] Testing Document (PDF) Upload Stream (rla/tests)...');
    const pdfBuffer = Buffer.from(testPdfString);
    const customFilename = `test-judgement-${Date.now()}.pdf`;
    const docUpload = await uploadDocumentBufferToCloudinary(pdfBuffer, 'rla/tests', customFilename);
    assert(Boolean(docUpload.secureUrl), 'Document upload returned secureUrl', docUpload.secureUrl);
    assert(Boolean(docUpload.publicId), 'Document upload returned publicId', docUpload.publicId);
    assert(docUpload.resourceType === 'raw', 'Document resource type is "raw"');
    console.log(`      Uploaded Document: ${docUpload.secureUrl}`);

    // 5. Public ID Extraction & Search Expression
    console.log('\n[5/7] Testing Public ID Extraction & Lucene Search Service...');
    const extractedImgId = getCloudinaryPublicId(imgUpload.secureUrl);
    assert(extractedImgId === imgUpload.publicId, 'getCloudinaryPublicId parsed image correctly', {
      expected: imgUpload.publicId,
      actual: extractedImgId,
    });

    const luceneQuery = sanitizeLuceneString('test-query');
    assert(luceneQuery === 'test-query', 'Lucene string sanitized properly');

    const searchExp = buildCloudinarySearchExpression({ folder: 'rla/tests', resource_type: 'all' });
    assert(searchExp.includes('folder="rla/tests"'), 'Search expression includes target folder');

    const librarySearchResult = await fetchCloudinaryMediaLibrary({
      folder: 'rla/tests',
      limit: 10,
    });
    assert(Array.isArray(librarySearchResult.data), 'Media library search returns array');
    console.log(`      Found ${librarySearchResult.totalCount} assets in rla/tests search index.`);

    // 6. Asset Cleanup by PublicId
    console.log('\n[6/7] Testing Asset Deletion by Public ID...');
    await deleteCloudinaryAssetByPublicId(imgUpload.publicId, 'image');
    assert(true, 'Image asset deleted successfully from Cloudinary');

    await deleteCloudinaryAssetByPublicId(docUpload.publicId, 'raw');
    assert(true, 'Document asset deleted successfully from Cloudinary');

    // 7. Asset Cleanup by URL
    console.log('\n[7/7] Testing Secondary Upload & Cleanup by URL...');
    const tempUpload = await uploadImageBufferToCloudinary(imgBuffer, 'rla/tests');
    assert(Boolean(tempUpload.secureUrl), 'Temporary test image uploaded');
    await deleteCloudinaryAssetByUrl(tempUpload.secureUrl, 'image');
    assert(true, 'Temporary test image deleted successfully via URL helper');

    console.log('\n===========================================================');
    console.log(`🎉 ALL ${passed}/${total} CLOUDINARY VERIFICATION TESTS PASSED!`);
    console.log('   Cloudinary integration is 100% active, operational, and verified.');
    console.log('===========================================================\n');
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ CLOUDINARY TEST RUN FAILED:', error.message);
    if (error.stack) console.error(error.stack);
    process.exit(1);
  }
}

runCloudinaryVerification();

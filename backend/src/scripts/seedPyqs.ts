import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import User from '../models/user.model.js';
import PyqPaper from '../models/pyqPaper.model.js';
import connectDB, { disconnectDB } from '../config/db.js';
import { PDFS_DIR } from '../middlewares/upload.middleware.js';

/**
 * Creates a valid minimal PDF-1.4 document buffer with text
 */
function createDummyPdfBuffer(title: string, subtitle: string): Buffer {
  const contentStream = `BT
/F1 20 Tf
50 750 Td
(${title}) Tj
/F1 12 Tf
0 -30 Td
(${subtitle}) Tj
/F1 10 Tf
0 -25 Td
(Official Model Solutions - Rajinder Law Academy Judiciary Excellence) Tj
ET`;

  const streamLength = Buffer.byteLength(contentStream, 'utf-8');

  const pdfSource = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length ${streamLength} >>
stream
${contentStream}
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000300 ${streamLength.toString().padStart(5, '0')} n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
${400 + streamLength}
%%EOF`;

  return Buffer.from(pdfSource, 'utf-8');
}

export const seedInitialPyqs = async (): Promise<void> => {
  try {
    const director = await User.findOne({ email: 'director@rajinderlawacademy.com' });
    if (!director) {
      console.warn('⚠️ Cannot seed PYQs: Director admin user not found.');
      return;
    }

    if (!fs.existsSync(PDFS_DIR)) {
      fs.mkdirSync(PDFS_DIR, { recursive: true });
    }

    const count = await PyqPaper.countDocuments();
    if (count >= 5) {
      console.log(`ℹ️ Solved PYQ papers already seeded (found ${count}).`);
      return;
    }

    console.log('🌱 Generating authentic sample PDF files and seeding PYQ papers...');

    const samplePapers = [
      {
        title: 'Delhi Judicial Service (DJS) 2023 Mains Civil Law I & II Model Solved Paper',
        exam: 'Delhi Judicial Service (DJS)' as const,
        year: 2023,
        stage: 'Mains' as const,
        subject: 'Civil Law I (CPC, Contract, TPA, SRA) with Model Ratios',
        paperCode: 'DJS-M-2023-CIVIL',
        totalMarks: 200,
        durationMinutes: 180,
        description:
          'Authoritative question-by-question model answer script for DJS Mains 2023 Civil Law. Contains complete legal reasoning, 3-tier Res Judicata analysis (Mahboob Sahab), Specific Relief Act 2018 infrastructure contracts, and Order 39 injunction tests.',
        topics: [
          'Section 11 Res Judicata',
          'Mahboob Sahab v. Syed Ismail',
          'Specific Relief Act 2018 Amendment',
          'Order 39 Temporary Injunctions',
        ],
        solvedByFaculty: 'Adv. Rajinder Sir & Senior Faculty Board',
        modelAnswersIncluded: true,
        solutionsProvided: true,
        isPublished: true,
        downloadCount: 48,
        viewCount: 142,
        isFeatured: true,
        originalFilename: 'DJS_2023_Mains_Civil_Law_Solved.pdf',
        subtitle: 'Paper I & II Model Answer Script - Adv. Rajinder Sir',
      },
      {
        title: 'Delhi Judicial Service (DJS) 2024 Preliminary Examination Full Solved Question Paper',
        exam: 'Delhi Judicial Service (DJS)' as const,
        year: 2024,
        stage: 'Prelims' as const,
        subject: 'Complete Law & General Knowledge Objective Paper (200 MCQs)',
        paperCode: 'DJS-P-2024-FULL',
        totalMarks: 200,
        durationMinutes: 150,
        description:
          'Official 200 objective questions with detailed bare act section references, case law citations, and key statutory nuances under the new criminal codes (BNS, BNSS, BSA).',
        topics: [
          'Constitution of India',
          'BNS / IPC Transition',
          'BSA / Evidence Section 63',
          'Limitation Act Schedule',
        ],
        solvedByFaculty: 'Judicial Research Cell',
        modelAnswersIncluded: true,
        solutionsProvided: true,
        isPublished: true,
        downloadCount: 92,
        viewCount: 280,
        isFeatured: true,
        originalFilename: 'DJS_2024_Prelims_Official_Solved.pdf',
        subtitle: 'Prelims 200 Questions with Rationales & Case Citations',
      },
      {
        title: 'Haryana Civil Services (Judicial) 2023 Mains Civil & Criminal Law Solved Compilation',
        exam: 'Haryana Civil Services (Judicial)' as const,
        year: 2023,
        stage: 'Mains' as const,
        subject: 'Civil Law I, Civil Law II & Criminal Law Model Solutions',
        paperCode: 'HCS-M-2023-COMB',
        totalMarks: 400,
        durationMinutes: 360,
        description:
          'Complete model answers covering Section 482 BNSS/CrPC quashing standards under Bhajan Lal guidelines, Section 13B mutual consent divorce cooling-off condonation (Amardeep Singh), and Section 65B/63 electronic certificate mandates.',
        topics: [
          'Section 482 Quashing',
          'Bhajan Lal Principles',
          'HMA Section 13B Cooling Period',
          'Electronic Records Admissibility',
        ],
        solvedByFaculty: 'Adv. Sharma & Adv. Rajinder Sir',
        modelAnswersIncluded: true,
        solutionsProvided: true,
        isPublished: true,
        downloadCount: 35,
        viewCount: 110,
        isFeatured: false,
        originalFilename: 'HCS_Judicial_2023_Mains_Solved.pdf',
        subtitle: 'Civil Law & Criminal Law Master Compilation',
      },
      {
        title: 'UP PCS-J 2023 Mains Substantive Law & Procedure and Evidence Solved Archive',
        exam: 'UP PCS-J Judicial Examination' as const,
        year: 2023,
        stage: 'Mains' as const,
        subject: 'Paper II: Substantive Law & Paper III: Procedure and Evidence',
        paperCode: 'UP-PCSJ-M-2023-II-III',
        totalMarks: 400,
        durationMinutes: 360,
        description:
          'High-scoring model answer drafting format for UP PCS-J Mains. Step-by-step ratio analysis for Easements, Law of Torts, statutory discovery under Section 27, and mandatory arrest compliance under Section 35 BNSS / 41A CrPC (Arnesh Kumar).',
        topics: [
          'Indian Easements Act',
          'Law of Torts & Vicarious Liability',
          'Section 27 Evidence Act',
          'Arnesh Kumar Guidelines',
        ],
        solvedByFaculty: 'Adv. Rajinder Sir',
        modelAnswersIncluded: true,
        solutionsProvided: true,
        isPublished: true,
        downloadCount: 61,
        viewCount: 195,
        isFeatured: false,
        originalFilename: 'UP_PCSJ_2023_Mains_Solved_Answers.pdf',
        subtitle: 'Paper II Substantive & Paper III Procedure Solved',
      },
      {
        title: 'Madhya Pradesh Civil Judge (MP CJ) 2024 Preliminary Examination Model Answers',
        exam: 'MP Civil Judge (MP CJ)' as const,
        year: 2024,
        stage: 'Prelims' as const,
        subject: 'Online Prelims Law Paper with Comprehensive Rationales',
        paperCode: 'MP-CJ-P-2024-ONLINE',
        totalMarks: 150,
        durationMinutes: 120,
        description:
          'Draft model answers currently undergoing final faculty peer review. Covers MP Accommodation Control Act, MP Land Revenue Code, and Negotiable Instruments Act Section 138.',
        topics: [
          'MP Accommodation Control Act',
          'MP Land Revenue Code 1959',
          'NI Act Section 138',
        ],
        solvedByFaculty: 'Faculty Board',
        modelAnswersIncluded: true,
        solutionsProvided: true,
        isPublished: false, // Notice: Draft state for Admin testing!
        downloadCount: 0,
        viewCount: 12,
        isFeatured: false,
        originalFilename: 'MP_CJ_2024_Prelims_Draft_Solved.pdf',
        subtitle: 'Faculty Review Draft - MP CJ Prelims',
      },
    ];

    for (const p of samplePapers) {
      const randomSuffix = crypto.randomBytes(6).toString('hex');
      const filename = `pyq-${Date.now()}-${randomSuffix}.pdf`;
      const physicalPath = path.join(PDFS_DIR, filename);

      // Write valid PDF buffer to disk
      const pdfBuffer = createDummyPdfBuffer(p.title, p.subtitle);
      fs.writeFileSync(physicalPath, pdfBuffer);

      const sizeBytes = pdfBuffer.length;
      const sizeFormatted = `${(sizeBytes / 1024).toFixed(1)} KB PDF`;

      await PyqPaper.create({
        title: p.title,
        exam: p.exam,
        year: p.year,
        stage: p.stage,
        subject: p.subject,
        paperCode: p.paperCode,
        totalMarks: p.totalMarks,
        durationMinutes: p.durationMinutes,
        description: p.description,
        topics: p.topics,
        solvedByFaculty: p.solvedByFaculty,
        modelAnswersIncluded: p.modelAnswersIncluded,
        solutionsProvided: p.solutionsProvided,
        pdfFile: {
          filename,
          originalName: p.originalFilename,
          path: physicalPath,
          mimeType: 'application/pdf',
          sizeBytes,
          sizeFormatted,
          pageCount: 1,
        },
        isPublished: p.isPublished,
        publishedAt: p.isPublished ? new Date() : undefined,
        downloadCount: p.downloadCount,
        viewCount: p.viewCount,
        isFeatured: p.isFeatured,
        uploadedBy: director._id,
      });

      console.log(`  ✅ Seeded: ${p.title} (${p.isPublished ? 'Published' : 'Draft'})`);
    }

    console.log('🎉 Solved PYQ Archive seeded successfully with 5 papers.');
  } catch (err: any) {
    console.error('❌ Error seeding PYQ papers:', err.message);
  }
};

// Standalone execution support
if (process.argv[1]?.endsWith('seedPyqs.ts')) {
  (async () => {
    await connectDB();
    await seedInitialPyqs();
    await disconnectDB();
  })();
}

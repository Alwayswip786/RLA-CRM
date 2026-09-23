import fs from 'fs';
import path from 'path';
import User from '../models/user.model.js';
import MainsQuestion from '../models/mainsQuestion.model.js';
import MainsSubmission from '../models/mainsSubmission.model.js';
import connectDB, { disconnectDB } from '../config/db.js';
import {
  MAINS_SUBMISSIONS_DIR,
  MAINS_EVALUATIONS_DIR,
} from '../middlewares/upload.middleware.js';

function createDummyPdfBuffer(title: string, sub: string): Buffer {
  const cleanTitle = title.replace(/[()]/g, '').slice(0, 80);
  const cleanSub = sub.replace(/[()]/g, '').slice(0, 80);

  const stream = `BT
/F1 16 Tf
50 760 Td
(${cleanTitle}) Tj
/F1 11 Tf
0 -26 Td
(${cleanSub}) Tj
/F1 10 Tf
0 -24 Td
(Rajinder Law Academy - Mains Answer Writing & Evaluation) Tj
ET`;
  const streamLength = Buffer.byteLength(stream, 'utf-8');

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
${stream}
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000060 00000 n 
0000000117 00000 n 
0000000242 00000 n 
0000000300 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
380
%%EOF`;

  return Buffer.from(pdfSource, 'utf-8');
}

export const seedMains = async (): Promise<void> => {
  try {
    await connectDB();

    const admin = await User.findOne({ role: 'admin' });
    const student = await User.findOne({
      $or: [{ email: 'rohit.verma@rajinderlawacademy.com' }, { role: 'student' }],
    });

    if (!admin || !student) {
      console.warn('⚠️ Admin or Student account not found. Run seed:admin first.');
      return;
    }

    console.log(`👤 Seeding Mains for Faculty Admin: ${admin.name} & Student: ${student.name}`);

    // 1. Seed Questions
    const questionsData = [
      {
        questionCode: 'DAW-2026-084',
        title:
          'Q. Discuss the scope and principles governing the doctrine of Res Sub Judice under Section 10 of the Code of Civil Procedure, 1908. Does the pendency of a previously instituted suit in a Foreign Court bar a court in India from trying a subsequent suit on identical cause of action? Cite relevant case law.',
        subject: 'Civil Law I (CPC & Specific Relief Act)',
        targetExam: 'Delhi Judicial Service (DJS)',
        marks: 20,
        wordLimit: 350,
        guidelines: [
          'Introduction: Purpose of Section 10 to prevent parallel conflicting decrees.',
          'Key Ingredients: Previously vs subsequently instituted suit; same parties; competent court.',
          'Foreign Court Exception: Detail statutory Explanation to Section 10 explicitly.',
          'Judicial Dictum: National Institute of Mental Health v. C. Parameshwara (2005 SC).',
        ],
        isActive: true, // Today's active question
        submissionDeadline: new Date(Date.now() + 18 * 3600000), // Today evening
      },
      {
        questionCode: 'DAW-2026-083',
        title:
          'Q. Critically examine the extent and limits of the Right of Private Defence under Chapter III of Bharatiya Nyaya Sanhita (BNS) 2023. When does such right extend to causing the death of the assailant?',
        subject: 'Substantive Criminal Law (BNS 2023)',
        targetExam: 'UP PCS-J / MP Judiciary',
        marks: 25,
        wordLimit: 400,
        guidelines: [
          'Statutory comparison between Section 100 IPC and Section 38 BNS 2023.',
          'Immediate apprehension of death or grievous hurt.',
          'Proportionality rule: No more harm than necessary for defence.',
        ],
        isActive: false,
      },
      {
        questionCode: 'DAW-2026-082',
        title:
          'Q. Explain the procedural mandate governing the Framing of Issues under Order XIV of CPC. Distinguish between Issues of Law and Issues of Fact.',
        subject: 'Civil Law I',
        targetExam: 'Haryana Judicial Service (HCS)',
        marks: 20,
        wordLimit: 300,
        guidelines: [
          'Order XIV Rule 1: Material propositions of fact and law affirmed by one party and denied by the other.',
          'Order XIV Rule 2: Mandate to pronounce judgment on all issues, subject to preliminary issues of jurisdiction.',
        ],
        isActive: false,
      },
    ];

    const savedQuestions: any[] = [];
    for (const q of questionsData) {
      const doc = await MainsQuestion.findOneAndUpdate(
        { questionCode: q.questionCode },
        {
          $set: {
            ...q,
            createdBy: admin._id,
            publishedAt: new Date(),
          },
        },
        { upsert: true, new: true }
      );
      savedQuestions.push(doc);
      console.log(`  📝 Question: [${doc.questionCode}] ${doc.subject}`);
    }

    // 2. Ensure sample PDF files exist for student submission & evaluated copies
    const subFilename = `mains_sub_rohit_verma_daw82.pdf`;
    const evalFilename = `mains_eval_rohit_verma_daw82_marked.pdf`;

    const subPath = path.join(MAINS_SUBMISSIONS_DIR, subFilename);
    const evalPath = path.join(MAINS_EVALUATIONS_DIR, evalFilename);

    if (!fs.existsSync(subPath)) {
      fs.writeFileSync(subPath, createDummyPdfBuffer('Student Copy: Rohit Verma', 'DAW #82 Framing of Issues'));
    }
    if (!fs.existsSync(evalPath)) {
      fs.writeFileSync(evalPath, createDummyPdfBuffer('Faculty Evaluated Marked Copy', 'Evaluated by Adv. Rajinder Sir - 15.5/20'));
    }

    // 3. Seed an already Evaluated submission for Rohit Verma (DAW-2026-082)
    const q82 = savedQuestions.find((q) => q.questionCode === 'DAW-2026-082');
    if (q82) {
      await MainsSubmission.findOneAndUpdate(
        { student: student._id, question: q82._id },
        {
          $set: {
            student: student._id,
            question: q82._id,
            studentPdf: {
              filename: subFilename,
              originalName: 'RohitVerma_DAW_82_Framing_Issues.pdf',
              path: subPath,
              mimeType: 'application/pdf',
              sizeBytes: fs.statSync(subPath).size,
              sizeFormatted: '1.8 MB',
            },
            notes: 'Attempted strictly within 20 minutes timed condition.',
            status: 'evaluated',
            submittedAt: new Date(Date.now() - 4 * 86400000),
            evaluatedBy: admin._id,
            score: 15.5,
            maxScore: 20,
            remarks:
              'Excellent structuring. Issues of law vs issues of fact separated clearly as per Order XIV Rule 2. Handwriting is clean and legible.',
            strengths: 'Spot-on case law citations and crisp operative reasoning on preliminary issues.',
            needsWork: 'Can articulate burden of proof under Section 101/102 Evidence Act more prominently in the opening paragraph.',
            evaluatedPdf: {
              filename: evalFilename,
              originalName: 'RohitVerma_DAW_82_Evaluated_Marked.pdf',
              path: evalPath,
              mimeType: 'application/pdf',
              sizeBytes: fs.statSync(evalPath).size,
              sizeFormatted: '2.1 MB',
            },
            evaluatedAt: new Date(Date.now() - 2 * 86400000),
          },
        },
        { upsert: true, new: true }
      );
      console.log(`  ✅ Seeded Evaluated Copy for ${student.name} on [DAW-2026-082] (15.5 / 20)`);
    }

    console.log('\n🎉 Successfully seeded Mains questions and evaluated answer copies!');
  } catch (err) {
    console.error('❌ Error seeding mains:', err);
    throw err;
  } finally {
    await disconnectDB();
  }
};

if (process.argv[1]?.endsWith('seedMains.ts')) {
  seedMains()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import User from '../models/user.model.js';
import JudgementDigest, { type CourtCategory, type JudgementImportance } from '../models/judgementDigest.model.js';
import connectDB, { disconnectDB } from '../config/db.js';
import { JUDGEMENTS_PDFS_DIR } from '../middlewares/upload.middleware.js';

/**
 * Creates a valid minimal PDF-1.4 document buffer with case title & holding
 */
function createJudgementPdfBuffer(caseTitle: string, citation: string, court: string): Buffer {
  const contentStream = `BT
/F1 18 Tf
50 770 Td
(${caseTitle.replace(/[()]/g, '')}) Tj
/F1 12 Tf
0 -30 Td
(${citation.replace(/[()]/g, '')}) Tj
/F1 11 Tf
0 -25 Td
(${court.replace(/[()]/g, '')}) Tj
/F1 10 Tf
0 -35 Td
(Official Landmark Judgement Digest - Rajinder Law Academy Judiciary Excellence) Tj
/F1 9 Tf
0 -20 Td
(Authoritative 3-Point Ratio Decidendi & Mains Answer Value-Add Notes) Tj
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

export const seedInitialJudgements = async (): Promise<void> => {
  try {
    const director = await User.findOne({ email: 'director@rajinderlawacademy.com' });
    if (!director) {
      console.warn('⚠️ Cannot seed judgements: Director admin user not found.');
      return;
    }

    if (!fs.existsSync(JUDGEMENTS_PDFS_DIR)) {
      fs.mkdirSync(JUDGEMENTS_PDFS_DIR, { recursive: true });
    }

    const count = await JudgementDigest.countDocuments();
    if (count >= 5) {
      console.log(`ℹ️ Landmark Judgements already seeded (found ${count}).`);
      return;
    }

    console.log('🌱 Generating authentic sample PDF files and seeding Landmark Judgements...');

    const sampleJudgements = [
      {
        title: 'Kesavananda Bharati Sripadagalvaru v. State of Kerala',
        citation: '(1973) 4 SCC 225 | AIR 1973 SC 1461',
        court: 'Supreme Court of India' as CourtCategory,
        bench: '13-Judge Constitutional Bench (7:6 Majority)',
        judges: [
          'S.M. Sikri, C.J.',
          'J.M. Shelat, J.',
          'K.S. Hegde, J.',
          'A.N. Grover, J.',
          'A.N. Ray, J.',
          'H.R. Khanna, J.',
          'Y.V. Chandrachud, J.',
        ],
        dateOfJudgement: new Date('1973-04-24'),
        year: 1973,
        subject: 'Constitutional Law',
        legalProvisions: [
          'Article 368',
          'Article 13(2)',
          'Article 31C',
          'Preamble',
          'Basic Structure Doctrine',
        ],
        summary:
          'Historic 13-judge bench ruling establishing the Basic Structure Doctrine. The Supreme Court held that while Parliament possesses plenary power under Article 368 to amend any provision of the Constitution, it cannot alter, destroy, or abrogate the foundational framework or basic features of the Constitution.',
        ratioDecidendi: [
          "Parliament's power to amend under Article 368 is broad but not unlimited; it does not extend to abrogating the 'Basic Structure' of the Constitution.",
          'Judicial Review is an integral component of the Basic Structure and cannot be excluded by constitutional amendment.',
          'Clause (2) of Article 31C as introduced by the 25th Amendment, barring judicial inquiry into directive principles compliance, was declared unconstitutional.',
        ],
        mainsUtility:
          'Directly cited in judicial mains examinations across Constitutional Law and Essay papers for questions concerning legislative vs judicial supremacy, separation of powers, and scope of constituent power under Article 368.',
        overruledPrecedents:
          'Overruled I.C. Golaknath v. State of Punjab (1967) regarding fundamental rights amendment embargo.',
        tags: [
          'Basic Structure',
          'Constitutional Amendment',
          'Article 368',
          'Judicial Review',
          'Kesavananda',
        ],
        importance: 'Landmark' as JudgementImportance,
        isPublished: true,
        isFeatured: true,
        downloadCount: 142,
        viewCount: 580,
        originalFilename: 'Kesavananda_Bharati_Basic_Structure_Digest.pdf',
      },
      {
        title: 'Maneka Gandhi v. Union of India & Another',
        citation: '(1978) 1 SCC 248 | AIR 1978 SC 597',
        court: 'Supreme Court of India' as CourtCategory,
        bench: '7-Judge Constitutional Bench',
        judges: [
          'M.H. Beg, C.J.',
          'Y.V. Chandrachud, J.',
          'P.N. Bhagwati, J.',
          'V.R. Krishna Iyer, J.',
          'N.L. Untwalia, J.',
          'S. Murtaza Fazal Ali, J.',
          'P.S. Kailasam, J.',
        ],
        dateOfJudgement: new Date('1978-01-25'),
        year: 1978,
        subject: 'Constitutional & Administrative Law',
        legalProvisions: [
          'Article 21',
          'Article 14',
          'Article 19',
          'Golden Triangle Doctrine',
          'Audi Alteram Partem',
        ],
        summary:
          "Pivotal ruling humanizing Article 21. Overruled the narrow reading in A.K. Gopalan and held that 'procedure established by law' under Article 21 must be fair, just, and reasonable, embodying natural justice principles and intertwined with Articles 14 and 19.",
        ratioDecidendi: [
          "The procedure depriving personal liberty under Article 21 must not be arbitrary, fanciful, or oppressive; it must satisfy the test of 'fair, just, and reasonable'.",
          "Articles 14, 19, and 21 are not mutually exclusive water-tight compartments but form an interconnected 'Golden Triangle' protecting human liberty.",
          'Principles of Natural Justice (Audi Alteram Partem) are inherent in every administrative action affecting civil rights, unless expressly and validly excluded.',
        ],
        mainsUtility:
          'Indispensable for Mains questions on the evolution of Due Process in Indian jurisprudence, expanding frontiers of Article 21, and procedural fairness in administrative orders.',
        overruledPrecedents:
          'A.K. Gopalan v. State of Madras (1950) on compartmentalization of Fundamental Rights.',
        tags: [
          'Article 21',
          'Golden Triangle',
          'Personal Liberty',
          'Natural Justice',
          'Due Process',
        ],
        importance: 'Landmark' as JudgementImportance,
        isPublished: true,
        isFeatured: false,
        downloadCount: 98,
        viewCount: 340,
        originalFilename: 'Maneka_Gandhi_Article21_Golden_Triangle.pdf',
      },
      {
        title: 'Arnesh Kumar v. State of Bihar & Another',
        citation: '(2014) 8 SCC 273 | AIR 2014 SC 2756',
        court: 'Supreme Court of India' as CourtCategory,
        bench: 'Division Bench (2 Judges)',
        judges: ['Chandramauli Kr. Prasad, J.', 'Pinaki Chandra Ghose, J.'],
        dateOfJudgement: new Date('2014-07-02'),
        year: 2014,
        subject: 'Criminal Procedure (CrPC / BNSS) & IPC',
        legalProvisions: [
          'Section 41 CrPC',
          'Section 41A CrPC',
          'Section 498A IPC',
          'Section 35 BNSS',
          'Arrest Guidelines',
        ],
        summary:
          'Authoritative landmark judgment prohibiting automatic arrests by police in offenses punishable with imprisonment up to 7 years. Formulated mandatory checklist under Section 41(1)(b) CrPC (now Section 35 BNSS) to prevent arbitrary deprivation of liberty.',
        ratioDecidendi: [
          'Arrest cannot be executed merely because a non-bailable offense is alleged; police must record subjective satisfaction satisfying sub-clauses of Section 41(1)(b) CrPC.',
          'Magistrates authorizing detention under Section 167 CrPC must evaluate the police checklist and record independent reasons; mechanical remand orders lead to departmental disciplinary action.',
          'Notice of appearance under Section 41A CrPC must be served upon the accused within two weeks from the date of institution of the case.',
        ],
        mainsUtility:
          'Essential for Criminal Procedure papers (CrPC / BNSS) in state judicial services regarding powers of arrest, magistrate remand scrutiny under Section 167, and rights of the accused.',
        overruledPrecedents: 'Curtailed mechanical arrest practices post-498A complaints.',
        tags: [
          'Section 41 CrPC',
          'Section 41A',
          'Arrest Guidelines',
          'Section 498A',
          'Remand Under 167',
        ],
        importance: 'Leading' as JudgementImportance,
        isPublished: true,
        isFeatured: false,
        downloadCount: 115,
        viewCount: 410,
        originalFilename: 'Arnesh_Kumar_Arrest_Guidelines_41A.pdf',
      },
      {
        title: 'Kiran Singh & Others v. Chaman Paswan & Others',
        citation: '(1955) 1 SCR 117 | AIR 1954 SC 340',
        court: 'Supreme Court of India' as CourtCategory,
        bench: '4-Judge Constitutional Bench',
        judges: [
          'B.K. Mukherjea, J.',
          'Sudhi Ranjan Das, J.',
          'Ghulam Hasan, J.',
          'Vivian Bose, J.',
        ],
        dateOfJudgement: new Date('1954-04-14'),
        year: 1954,
        subject: 'Civil Procedure Code (CPC)',
        legalProvisions: [
          'Section 9 CPC',
          'Section 21 CPC',
          'Suits Valuation Act Section 11',
          'Inherent Lack of Jurisdiction',
        ],
        summary:
          'Foundational CPC authority establishing the fundamental distinction between inherent lack of jurisdiction (coram non judice) and irregular exercise or pecuniary/territorial jurisdiction under Section 21 CPC.',
        ratioDecidendi: [
          'A decree passed by a court without inherent jurisdiction over the subject-matter is a nullity and its invalidity could be set up whenever and wherever it is sought to be enforced or relied upon, even at the stage of execution and even in collateral proceedings.',
          'Objection to pecuniary or territorial jurisdiction must be taken in the court of first instance at the earliest possible opportunity and before settlement of issues.',
          'Under Section 11 of the Suits Valuation Act, an appellate court cannot entertain an objection regarding valuation unless there is recorded prejudice on merits.',
        ],
        mainsUtility:
          'Top-tier citation for Civil Procedure Code Mains questions on jurisdiction of civil courts, nullity of decrees, and scope of Section 21 objections.',
        overruledPrecedents:
          'Clarified various high court conflicts on pecuniary overvaluation vs inherent jurisdiction.',
        tags: [
          'CPC Section 9',
          'CPC Section 21',
          'Inherent Jurisdiction',
          'Nullity of Decree',
          'Pecuniary Jurisdiction',
        ],
        importance: 'Landmark' as JudgementImportance,
        isPublished: true,
        isFeatured: false,
        downloadCount: 76,
        viewCount: 290,
        originalFilename: 'Kiran_Singh_Jurisdiction_Nullity_CPC.pdf',
      },
      {
        title: 'Navtej Singh Johar & Others v. Union of India',
        citation: '(2018) 10 SCC 1 | AIR 2018 SC 4321',
        court: 'Supreme Court of India' as CourtCategory,
        bench: 'Constitution Bench (5 Judges)',
        judges: [
          'Dipak Misra, C.J.',
          'A.M. Khanwilkar, J.',
          'R.F. Nariman, J.',
          'D.Y. Chandrachud, J.',
          'Indu Malhotra, J.',
        ],
        dateOfJudgement: new Date('2018-09-06'),
        year: 2018,
        subject: 'Constitutional & Criminal Law',
        legalProvisions: [
          'Section 377 IPC',
          'Article 14',
          'Article 15',
          'Article 19(1)(a)',
          'Article 21',
          'Constitutional Morality',
        ],
        summary:
          'Unanimous 5-judge bench decision reading down Section 377 IPC to decriminalize consensual sexual relationships between adults of the same sex, affirming that constitutional morality supersedes majoritarian morality.',
        ratioDecidendi: [
          'Section 377 IPC, in so far as it criminalises consensual sexual conduct between adults in private, violates Articles 14, 15, 19, and 21 of the Constitution.',
          'Constitutional morality, and not social or majoritarian morality, must guide the interpretation of fundamental rights.',
          'The right to privacy and autonomy encompasses sexual orientation and gender identity as protected facets under Article 21.',
        ],
        mainsUtility:
          'Ideal for Mains answers on Constitutional Morality vs Popular Morality, Section 377 IPC decriminalization, and non-discrimination on grounds of sex under Article 15.',
        overruledPrecedents: 'Overruled Suresh Kumar Koushal v. Naz Foundation (2014) 1 SCC 1.',
        tags: [
          'Section 377 IPC',
          'Constitutional Morality',
          'Article 14',
          'Article 21',
          'Privacy',
        ],
        importance: 'Recent / Overruling' as JudgementImportance,
        isPublished: false, // Draft for admin queue testing
        isFeatured: false,
        downloadCount: 0,
        viewCount: 0,
        originalFilename: 'Navtej_Johar_Section377_Constitutional_Morality.pdf',
      },
    ];

    for (const j of sampleJudgements) {
      const pdfBuffer = createJudgementPdfBuffer(j.title, j.citation, j.court);
      const randomSuffix = crypto.randomBytes(6).toString('hex');
      const filename = `judgement-${j.year}-${randomSuffix}.pdf`;
      const physicalPath = path.join(JUDGEMENTS_PDFS_DIR, filename);

      await fs.promises.writeFile(physicalPath, pdfBuffer);
      const sizeBytes = pdfBuffer.length;
      const sizeFormatted = `${(sizeBytes / 1024).toFixed(1)} KB`;

      await JudgementDigest.create({
        title: j.title,
        citation: j.citation,
        court: j.court,
        bench: j.bench,
        judges: j.judges,
        dateOfJudgement: j.dateOfJudgement,
        year: j.year,
        subject: j.subject,
        legalProvisions: j.legalProvisions,
        summary: j.summary,
        ratioDecidendi: j.ratioDecidendi,
        mainsUtility: j.mainsUtility,
        overruledPrecedents: j.overruledPrecedents,
        tags: j.tags,
        importance: j.importance,
        pdfFile: {
          filename,
          originalName: j.originalFilename,
          path: physicalPath,
          mimeType: 'application/pdf',
          sizeBytes,
          sizeFormatted,
          pageCount: 1,
        },
        isPublished: j.isPublished,
        publishedAt: j.isPublished ? j.dateOfJudgement : undefined,
        downloadCount: j.downloadCount,
        viewCount: j.viewCount,
        isFeatured: j.isFeatured,
        uploadedBy: director._id,
      });

      console.log(`  ✅ Seeded: ${j.title} (${j.isPublished ? 'Published' : 'Draft'})`);
    }

    console.log('🎉 Landmark Judgements Digest seeded successfully with 5 precedents.');
  } catch (err: any) {
    console.error('❌ Error seeding judgements:', err.message);
  }
};

// Standalone execution support
if (process.argv[1]?.endsWith('seedJudgements.ts')) {
  (async () => {
    await connectDB();
    await seedInitialJudgements();
    await disconnectDB();
  })();
}

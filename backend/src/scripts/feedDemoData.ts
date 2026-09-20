import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import User from '../models/user.model.js';
import PyqPaper, { type JudicialExam, type ExamStage } from '../models/pyqPaper.model.js';
import JudgementDigest, { type CourtCategory, type JudgementImportance } from '../models/judgementDigest.model.js';
import connectDB, { disconnectDB } from '../config/db.js';
import {
  PDFS_DIR as PYQ_PDFS_DIR,
  JUDGEMENTS_PDFS_DIR,
} from '../middlewares/upload.middleware.js';

/**
 * Creates a valid minimal PDF-1.4 document buffer with custom header & typography
 */
function createPdfBuffer(title: string, subtitle: string, institutionTag: string): Buffer {
  const cleanTitle = title.replace(/[()]/g, '').slice(0, 90);
  const cleanSubtitle = subtitle.replace(/[()]/g, '').slice(0, 110);
  const cleanTag = institutionTag.replace(/[()]/g, '').slice(0, 100);

  const contentStream = `BT
/F1 16 Tf
50 770 Td
(${cleanTitle}) Tj
/F1 11 Tf
0 -28 Td
(${cleanSubtitle}) Tj
/F1 10 Tf
0 -25 Td
(${cleanTag}) Tj
/F1 9 Tf
0 -30 Td
(Official Academic Vault - Rajinder Law Academy Judiciary Preparation) Tj
/F1 8 Tf
0 -18 Td
(Verified Model Solved Answers & Authoritative Headnotes) Tj
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

export const feedComprehensiveDemoData = async (): Promise<void> => {
  try {
    const director = await User.findOne({ email: 'director@rajinderlawacademy.com' });
    if (!director) {
      console.warn('⚠️ Cannot seed: Director admin user (director@rajinderlawacademy.com) not found.');
      return;
    }

    [PYQ_PDFS_DIR, JUDGEMENTS_PDFS_DIR].forEach((dir) => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });

    console.log('\n=============================================================');
    console.log('🌱 FEEDING AUTHENTIC DEMO PYQS & LANDMARK JUDGEMENTS INTO DB');
    console.log('=============================================================\n');

    // =========================================================================
    // SECTION 1: 12 SOLVED PREVIOUS YEAR QUESTION PAPERS (PYQs)
    // =========================================================================
    console.log('--- Seeding Solved PYQ Archive (12 State Judicial Papers) ---');

    const demoPyqs = [
      {
        title: 'Delhi Judicial Service (DJS) 2023 Mains Civil Law I & II Model Solved Paper',
        exam: 'Delhi Judicial Service (DJS)' as JudicialExam,
        year: 2023,
        stage: 'Mains' as ExamStage,
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
        isPublished: true,
        isFeatured: true,
        downloadCount: 148,
        viewCount: 412,
        filenamePrefix: 'DJS_2023_Mains_Civil_Law',
      },
      {
        title: 'Delhi Judicial Service (DJS) 2024 Preliminary Examination Full Solved Question Paper',
        exam: 'Delhi Judicial Service (DJS)' as JudicialExam,
        year: 2024,
        stage: 'Prelims' as ExamStage,
        subject: 'Complete Law & General Knowledge Objective Paper (200 MCQs)',
        paperCode: 'DJS-P-2024-FULL',
        totalMarks: 200,
        durationMinutes: 150,
        description:
          'Official 200 objective questions with detailed bare act section references, case law citations, and key statutory nuances under the criminal codes (BNS, BNSS, BSA transition).',
        topics: [
          'Constitution of India',
          'BNS / IPC Transition',
          'BSA / Evidence Section 63',
          'Limitation Act Schedule',
        ],
        solvedByFaculty: 'Judicial Research Cell',
        isPublished: true,
        isFeatured: true,
        downloadCount: 210,
        viewCount: 630,
        filenamePrefix: 'DJS_2024_Prelims_Full_Solved',
      },
      {
        title: 'Delhi Higher Judicial Service (DHJS) 2023 Mains Commercial & Arbitration Law',
        exam: 'Delhi Higher Judicial Service (DHJS)' as JudicialExam,
        year: 2023,
        stage: 'Mains' as ExamStage,
        subject: 'Commercial Courts Act & Arbitration & Conciliation Act 1996',
        paperCode: 'DHJS-M-2023-COMM',
        totalMarks: 250,
        durationMinutes: 180,
        description:
          'High-level commercial jurisprudence solutions for DHJS aspirants. In-depth analysis of Section 34 patent illegality, Section 9 interim measures vs Section 17, and pre-institution mediation timelines.',
        topics: [
          'Section 34 Setting Aside Arbitral Award',
          'Section 9 Interim Relief',
          'Commercial Courts Pre-Institution Mediation',
          'Vidya Drolia Arbitrability Doctrine',
        ],
        solvedByFaculty: 'Adv. Rajinder Sir',
        isPublished: true,
        isFeatured: false,
        downloadCount: 88,
        viewCount: 290,
        filenamePrefix: 'DHJS_2023_Mains_Commercial',
      },
      {
        title: 'Haryana Civil Services (Judicial) 2023 Mains Civil & Criminal Law Solved Compilation',
        exam: 'Haryana Civil Services (Judicial)' as JudicialExam,
        year: 2023,
        stage: 'Mains' as ExamStage,
        subject: 'Civil Law I, II & Criminal Law with Judgement Writing',
        paperCode: 'HCS-M-2023-COMB',
        totalMarks: 200,
        durationMinutes: 180,
        description:
          'Exhaustive model solutions for Haryana Judiciary Mains 2023. Covers Haryana Urban Rent Control Act provisions, Section 300 IPC exceptions, and accomplice testimony under Section 133 IEA.',
        topics: [
          'Haryana Urban Rent Control Act',
          'Section 300 IPC Exceptions',
          'Accomplice Evidence Section 133',
          'Order 7 Rule 11 CPC',
        ],
        solvedByFaculty: 'Faculty Panel - Former District Judges',
        isPublished: true,
        isFeatured: false,
        downloadCount: 125,
        viewCount: 395,
        filenamePrefix: 'HCS_2023_Mains_Law_Compendium',
      },
      {
        title: 'Haryana Civil Services (Judicial) 2024 Prelims Official Master Solved Paper',
        exam: 'Haryana Civil Services (Judicial)' as JudicialExam,
        year: 2024,
        stage: 'Prelims' as ExamStage,
        subject: 'Law & Current Legal GK (125 Questions with Negative Marking)',
        paperCode: 'HCS-P-2024-FULL',
        totalMarks: 500,
        durationMinutes: 120,
        description:
          'Complete 125 question paper with precise answer keys, case citations, and conceptual explanations for Haryana Civil Judge preliminary examination.',
        topics: [
          'Indian Contract Act 1872',
          'Hindu Marriage Act 1955',
          'Specific Relief Act Section 20A',
          'Punjab Courts Act',
        ],
        solvedByFaculty: 'Adv. Rajinder Sir & Academic Mentors',
        isPublished: true,
        isFeatured: false,
        downloadCount: 175,
        viewCount: 520,
        filenamePrefix: 'HCS_2024_Prelims_Master_Solved',
      },
      {
        title: 'UP PCS-J 2023 Mains Substantive & Procedure Law Solved Compendium',
        exam: 'UP PCS-J Judicial Examination' as JudicialExam,
        year: 2023,
        stage: 'Mains' as ExamStage,
        subject: 'Paper II (Substantive Law) & Paper III (Procedure & Evidence)',
        paperCode: 'UP-M-2023-LAW',
        totalMarks: 200,
        durationMinutes: 180,
        description:
          'Authoritative solutions tailored to UP Public Service Commission evaluation patterns. Includes UP Revenue Code 2006 land laws, CrPC Section 313 accused examination, and TPA Doctrine of Election.',
        topics: [
          'TPA Doctrine of Election',
          'CrPC Section 313 Examination',
          'Charge Framing & Joinder of Charges',
          'UP Revenue Code 2006',
        ],
        solvedByFaculty: 'Adv. Rajinder Sir & High Court Bar Mentors',
        isPublished: true,
        isFeatured: false,
        downloadCount: 160,
        viewCount: 480,
        filenamePrefix: 'UP_PCSJ_2023_Mains_Substantive',
      },
      {
        title: 'UP PCS-J 2022 Prelims Paper I & II Official Key Analysis',
        exam: 'UP PCS-J Judicial Examination' as JudicialExam,
        year: 2022,
        stage: 'Prelims' as ExamStage,
        subject: 'General Knowledge & Law Papers with Statutory Notes',
        paperCode: 'UP-P-2022-ALL',
        totalMarks: 450,
        durationMinutes: 240,
        description:
          'Comprehensive solved question paper with detailed commentary on Indian legal history, Analytical jurisprudence, international treaties, and IPC statutory defenses.',
        topics: [
          'International Affairs & Legal Maxims',
          'Jurisprudence Analytical School',
          'Transfer of Property Section 52',
          'CrPC Police Report',
        ],
        solvedByFaculty: 'Judicial Research Cell',
        isPublished: true,
        isFeatured: false,
        downloadCount: 140,
        viewCount: 410,
        filenamePrefix: 'UP_PCSJ_2022_Prelims_All_Papers',
      },
      {
        title: 'UP Higher Judicial Service (UP HJS) 2023 Criminal Trial & Sessions Judgement Writing',
        exam: 'UP Higher Judicial Service (UP HJS)' as JudicialExam,
        year: 2023,
        stage: 'Mains' as ExamStage,
        subject: 'Criminal Procedure, POCSO, NDPS & Sessions Judgement Writing',
        paperCode: 'UPHJS-M-2023-CRIM',
        totalMarks: 200,
        durationMinutes: 180,
        description:
          'Model Sessions Court judgement writing format, appreciation of circumstantial evidence (Sharad Birdhichand Sarda), mandatory compliance under Section 50 NDPS Act, and POCSO statutory presumptions.',
        topics: [
          'Sessions Trial Judgement Writing',
          'POCSO Act Presumption Section 29',
          'NDPS Search Procedure Section 50',
          'Circumstantial Evidence Panchsheel',
        ],
        solvedByFaculty: 'Adv. Rajinder Sir',
        isPublished: true,
        isFeatured: false,
        downloadCount: 65,
        viewCount: 215,
        filenamePrefix: 'UPHJS_2023_Mains_Criminal_Sessions',
      },
      {
        title: 'MP Civil Judge (MP CJ) 2024 Preliminary Examination Model Solved Paper',
        exam: 'MP Civil Judge (MP CJ)' as JudicialExam,
        year: 2024,
        stage: 'Prelims' as ExamStage,
        subject: 'Law, Computer & General Studies (150 Objective Questions)',
        paperCode: 'MP-P-2024-FULL',
        totalMarks: 150,
        durationMinutes: 120,
        description:
          'Complete model question paper for MP Civil Judge Prelims with exhaustive coverage of local laws: MP Accommodation Control Act 1961 and MP Land Revenue Code 1959.',
        topics: [
          'MP Accommodation Control Act 1961',
          'MP Land Revenue Code 1959',
          'Negotiable Instruments Section 138',
          'Indian Evidence Act Confessions',
        ],
        solvedByFaculty: 'Academic Mentors Board',
        isPublished: true,
        isFeatured: false,
        downloadCount: 110,
        viewCount: 340,
        filenamePrefix: 'MP_CJ_2024_Prelims_Solved',
      },
      {
        title: 'MP Civil Judge (MP CJ) 2023 Mains Judgement Writing (Civil & Criminal) Mastery',
        exam: 'MP Civil Judge (MP CJ)' as JudicialExam,
        year: 2023,
        stage: 'Mains' as ExamStage,
        subject: 'Paper IV: Judgement Writing & Framing of Issues / Charges',
        paperCode: 'MP-M-2023-JW',
        totalMarks: 100,
        durationMinutes: 180,
        description:
          'Authoritative guide for MP Mains Paper IV. Includes complete model civil judgement in specific performance and eviction suit, plus criminal conviction judgement under Sections 325 & 354 IPC.',
        topics: [
          'Civil Judgement Writing Format',
          'Criminal Judgement Conviction Format',
          'Framing of Issues in Injunction Suit',
          'Framing of Charges under Section 326 IPC',
        ],
        solvedByFaculty: 'Adv. Rajinder Sir & Former Judicial Officers',
        isPublished: true,
        isFeatured: true,
        downloadCount: 195,
        viewCount: 580,
        filenamePrefix: 'MP_CJ_2023_Mains_Judgement_Writing',
      },
      {
        title: 'Rajasthan Judicial Service (RJS) 2024 Mains Law Paper I & II Detailed Solutions',
        exam: 'Rajasthan Judicial Service (RJS)' as JudicialExam,
        year: 2024,
        stage: 'Mains' as ExamStage,
        subject: 'Civil & Criminal Law with Rajasthan Local Laws',
        paperCode: 'RJS-M-2024-LAW',
        totalMarks: 200,
        durationMinutes: 180,
        description:
          'Exemplary model answers for RJS Mains Law Paper I & II. Deep dive into Rajasthan Rent Control Act 2001, Domestic Violence Act procedure, and Order 21 Execution of Decrees.',
        topics: [
          'Rajasthan Rent Control Act 2001',
          'Domestic Violence Act 2005',
          'Section 144 CrPC Orders',
          'Order 21 Execution of Decrees',
        ],
        solvedByFaculty: 'Judicial Faculty Board',
        isPublished: true,
        isFeatured: false,
        downloadCount: 130,
        viewCount: 375,
        filenamePrefix: 'RJS_2024_Mains_Law_Paper',
      },
      {
        title: 'Himachal Pradesh Judicial Service (HPJS) 2023 Mains Civil Law & Rent Control',
        exam: 'Himachal Pradesh Judicial Service (HPJS)' as JudicialExam,
        year: 2023,
        stage: 'Mains' as ExamStage,
        subject: 'Civil Law Paper I & II with HP Urban Rent Control Act',
        paperCode: 'HPJS-M-2023-CIVIL',
        totalMarks: 200,
        durationMinutes: 180,
        description:
          'Comprehensive model solution script for HPJS Mains Civil Law. Covers HP Urban Rent Control Act 1987, Specific Relief injunctions, and Indian Partnership Act dissolution.',
        topics: [
          'HP Urban Rent Control Act 1987',
          'Specific Relief Injunctions',
          'Indian Partnership Act Dissolution',
          'Sale of Goods Act Caveat Emptor',
        ],
        solvedByFaculty: 'Adv. Rajinder Sir & Research Fellows',
        isPublished: false, // DRAFT for Admin Desk review testing
        isFeatured: false,
        downloadCount: 0,
        viewCount: 0,
        filenamePrefix: 'HPJS_2023_Mains_Civil_Law',
      },
    ];

    for (const item of demoPyqs) {
      const pdfBuffer = createPdfBuffer(
        item.title,
        `${item.exam} - Year ${item.year} (${item.stage})`,
        item.subject
      );
      const randomSuffix = crypto.randomBytes(6).toString('hex');
      const filename = `pyq-${item.year}-${randomSuffix}.pdf`;
      const physicalPath = path.join(PYQ_PDFS_DIR, filename);

      await fs.promises.writeFile(physicalPath, pdfBuffer);
      const sizeBytes = pdfBuffer.length;
      const sizeFormatted = `${(sizeBytes / 1024).toFixed(1)} KB`;

      await PyqPaper.findOneAndUpdate(
        { paperCode: item.paperCode },
        {
          title: item.title,
          exam: item.exam,
          year: item.year,
          stage: item.stage,
          subject: item.subject,
          paperCode: item.paperCode,
          totalMarks: item.totalMarks,
          durationMinutes: item.durationMinutes,
          description: item.description,
          topics: item.topics,
          solvedByFaculty: item.solvedByFaculty,
          modelAnswersIncluded: true,
          solutionsProvided: true,
          pdfFile: {
            filename,
            originalName: `${item.filenamePrefix}.pdf`,
            path: physicalPath,
            mimeType: 'application/pdf',
            sizeBytes,
            sizeFormatted,
            pageCount: 1,
          },
          isPublished: item.isPublished,
          publishedAt: item.isPublished ? new Date() : undefined,
          downloadCount: item.downloadCount,
          viewCount: item.viewCount,
          isFeatured: item.isFeatured,
          uploadedBy: director._id,
        },
        { upsert: true, new: true }
      );

      console.log(`  📄 [PYQ] ${item.paperCode} - ${item.exam} (${item.isPublished ? 'Published' : 'Draft'})`);
    }

    // =========================================================================
    // SECTION 2: 14 LANDMARK JUDGEMENT DIGESTS
    // =========================================================================
    console.log('\n--- Seeding Landmark Judgement Digest (14 Precedents) ---');

    const demoJudgements = [
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
        downloadCount: 165,
        viewCount: 640,
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
        downloadCount: 120,
        viewCount: 420,
        originalFilename: 'Maneka_Gandhi_Article21_Golden_Triangle.pdf',
      },
      {
        title: 'Justice K.S. Puttaswamy (Retd.) & Anr. v. Union of India & Ors.',
        citation: '(2017) 10 SCC 1 | AIR 2017 SC 4161',
        court: 'Supreme Court of India' as CourtCategory,
        bench: '9-Judge Constitutional Bench (Unanimous)',
        judges: [
          'J.S. Khehar, C.J.',
          'J. Chelameswar, J.',
          'S.A. Bobde, J.',
          'R.K. Agrawal, J.',
          'R.F. Nariman, J.',
          'A.M. Sapre, J.',
          'D.Y. Chandrachud, J.',
          'S.K. Kaul, J.',
          'S.A. Nazeer, J.',
        ],
        dateOfJudgement: new Date('2017-08-24'),
        year: 2017,
        subject: 'Constitutional Law & Information Privacy',
        legalProvisions: [
          'Article 21',
          'Article 14',
          'Article 19',
          'Informational Privacy',
          'Proportionality Standard',
        ],
        summary:
          'Historic 9-judge bench holding that the Right to Privacy is an intrinsic fundamental right guaranteed under Article 21 and the foundational principles of liberty in Part III of the Constitution.',
        ratioDecidendi: [
          'Privacy is a fundamental right grounded in human dignity, individual autonomy, and personal liberty under Article 21.',
          'Any state intrusion into privacy must satisfy the three-fold test of legality, legitimate state aim, and proportionality.',
          'Overruled M.P. Sharma (1954) and Kharak Singh (1962) to the extent they held privacy was not a fundamental right.',
        ],
        mainsUtility:
          'Critical authority for Mains questions concerning Aadhaar, surveillance, biometric data protection, DNA profiling, and reproductive autonomy.',
        overruledPrecedents:
          'Overruled M.P. Sharma v. Satish Chandra (1954) and Kharak Singh v. State of UP (1962).',
        tags: [
          'Privacy',
          'Article 21',
          'Proportionality Standard',
          'Informational Privacy',
          'Puttaswamy',
        ],
        importance: 'Landmark' as JudgementImportance,
        isPublished: true,
        isFeatured: true,
        downloadCount: 185,
        viewCount: 710,
        originalFilename: 'Puttaswamy_Right_To_Privacy_Digest.pdf',
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
        downloadCount: 135,
        viewCount: 460,
        originalFilename: 'Arnesh_Kumar_Arrest_Guidelines_41A.pdf',
      },
      {
        title: 'Lalita Kumari v. Government of Uttar Pradesh & Ors.',
        citation: '(2014) 2 SCC 1 | AIR 2014 SC 187',
        court: 'Supreme Court of India' as CourtCategory,
        bench: '5-Judge Constitution Bench',
        judges: [
          'P. Sathasivam, C.J.',
          'B.S. Chauhan, J.',
          'Ranjana P. Desai, J.',
          'Ranjan Gogoi, J.',
          'S.A. Bobde, J.',
        ],
        dateOfJudgement: new Date('2013-11-12'),
        year: 2014,
        subject: 'Criminal Procedure Code (CrPC / BNSS)',
        legalProvisions: [
          'Section 154 CrPC',
          'Section 173 BNSS',
          'Mandatory Registration of FIR',
          'Preliminary Inquiry Limits',
        ],
        summary:
          'Authoritative 5-judge bench decision ruling that registration of First Information Report (FIR) is mandatory under Section 154 CrPC if the information discloses the commission of a cognizable offence.',
        ratioDecidendi: [
          "Registration of FIR is mandatory under Section 154 of the Code if the information discloses commission of a cognizable offence and no preliminary inquiry is permissible in such a situation.",
          'Preliminary inquiry may be conducted only to ascertain whether cognizable offence is disclosed or not, strictly limited to matrimonial disputes, commercial offences, medical negligence, and corruption cases.',
          'Preliminary inquiry must be completed expeditiously and in any case not exceeding 7 days, with reasons recorded in General Diary.',
        ],
        mainsUtility:
          'Foundational precedent for CrPC/BNSS problems in judicial mains exams regarding police duties, Section 154 scope, and legal consequences of non-registration of FIR.',
        overruledPrecedents:
          'Clarified Ramesh Kumari (2006) and State of Haryana v. Bhajan Lal (1992).',
        tags: [
          'Section 154 CrPC',
          'Mandatory FIR',
          'Preliminary Inquiry',
          'Cognizable Offence',
          'Lalita Kumari',
        ],
        importance: 'Leading' as JudgementImportance,
        isPublished: true,
        isFeatured: false,
        downloadCount: 155,
        viewCount: 520,
        originalFilename: 'Lalita_Kumari_Mandatory_FIR_Section154.pdf',
      },
      {
        title: 'D.K. Basu v. State of West Bengal',
        citation: '(1997) 1 SCC 416 | AIR 1997 SC 610',
        court: 'Supreme Court of India' as CourtCategory,
        bench: 'Division Bench (2 Judges)',
        judges: ['Kuldip Singh, J.', 'A.S. Anand, J.'],
        dateOfJudgement: new Date('1996-12-18'),
        year: 1997,
        subject: 'Criminal Procedure & Human Rights Law',
        legalProvisions: [
          'Article 21',
          'Article 22',
          'Section 41B CrPC',
          'Section 41D CrPC',
          'Custodial Violence Guidelines',
        ],
        summary:
          'Seminal judicial verdict formulating 11 mandatory guidelines to be followed in all cases of arrest or detention to eradicate custodial violence, torture, and lock-up deaths.',
        ratioDecidendi: [
          'Custodial violence, torture, and custodial death are serious breaches of Article 21 and the rule of law that cannot be justified by any investigatory necessity.',
          'Police personnel carrying out arrest must wear accurate, visible identification and clear name tags, and prepare a memo of arrest attested by at least one witness.',
          'The arrestee is entitled to have one friend, relative or acquaintance informed of the arrest and the place of detention within 8 to 12 hours.',
        ],
        mainsUtility:
          'Indispensable reference for questions on police reforms, human rights jurisprudence, statutory incorporation into Sections 41B, 41C, and 41D CrPC, and victim compensation.',
        overruledPrecedents: 'Established direct constitutional tort liability against state functionaries.',
        tags: [
          'Custodial Violence',
          'Arrest Memo',
          'DK Basu Guidelines',
          'Article 21',
          'Section 41B CrPC',
        ],
        importance: 'Landmark' as JudgementImportance,
        isPublished: true,
        isFeatured: false,
        downloadCount: 140,
        viewCount: 490,
        originalFilename: 'DK_Basu_Custodial_Violence_Guidelines.pdf',
      },
      {
        title: 'Bachan Singh v. State of Punjab',
        citation: '(1980) 2 SCC 684 | AIR 1980 SC 898',
        court: 'Supreme Court of India' as CourtCategory,
        bench: '5-Judge Constitution Bench',
        judges: [
          'Y.V. Chandrachud, C.J.',
          'A. Gupta, J.',
          'N.L. Untwalia, J.',
          'P.N. Bhagwati, J. (Dissenting)',
          'R.S. Sarkaria, J.',
        ],
        dateOfJudgement: new Date('1980-05-09'),
        year: 1980,
        subject: 'Criminal Law & Sentencing Jurisprudence',
        legalProvisions: [
          'Section 302 IPC',
          'Section 354(3) CrPC',
          'Article 21',
          'Rarest of Rare Doctrine',
        ],
        summary:
          "Constitutional Bench authority upholding the validity of capital punishment under Section 302 IPC but establishing the binding 'Rarest of Rare Cases' doctrine where the alternative option of life imprisonment is unquestionably foreclosed.",
        ratioDecidendi: [
          "The death penalty provided under Section 302 IPC read with Section 354(3) CrPC does not violate Article 19 or Article 21 of the Constitution.",
          "Extreme penalty of death can be inflicted only in the 'Rarest of Rare cases' when the alternative option of life imprisonment is unquestionably foreclosed.",
          'A balance sheet of aggravating and mitigating circumstances must be drawn, giving full weight to the mitigating circumstances of the offender and reformative potential.',
        ],
        mainsUtility:
          'Benchmark authority for Criminal Law Mains questions on capital sentencing, Section 354(3) special reasons, Machhi Singh categories, and modern sentencing guidelines.',
        overruledPrecedents: 'Affirmed Jagmohan Singh v. State of U.P. (1973).',
        tags: [
          'Rarest of Rare',
          'Capital Punishment',
          'Section 302 IPC',
          'Section 354(3) CrPC',
          'Mitigating Circumstances',
        ],
        importance: 'Landmark' as JudgementImportance,
        isPublished: true,
        isFeatured: false,
        downloadCount: 110,
        viewCount: 380,
        originalFilename: 'Bachan_Singh_Rarest_Of_Rare_Doctrine.pdf',
      },
      {
        title: 'Selvi & Others v. State of Karnataka',
        citation: '(2010) 7 SCC 263 | AIR 2010 SC 1974',
        court: 'Supreme Court of India' as CourtCategory,
        bench: '3-Judge Bench',
        judges: ['K.G. Balakrishnan, C.J.', 'R.V. Raveendran, J.', 'J.M. Panchal, J.'],
        dateOfJudgement: new Date('2010-05-05'),
        year: 2010,
        subject: 'Evidence Law (IEA / BSA) & Constitutional Law',
        legalProvisions: [
          'Article 20(3)',
          'Article 21',
          'Section 27 Evidence Act',
          'Narcoanalysis & Brain Mapping',
        ],
        summary:
          'Supreme Court held that the compulsory administration of scientific investigative techniques—Narcoanalysis, Polygraph examination, and BEAP (Brain Electrical Activation Profile)—violates Article 20(3) (right against self-incrimination) and substantive due process under Article 21.',
        ratioDecidendi: [
          'Involuntary administration of Narcoanalysis, Lie-Detector (Polygraph), and Brain Fingerprinting tests violates the constitutional guarantee against self-incrimination under Article 20(3).',
          'Forcible intrusion into a person’s mental privacy impairs human dignity and personal autonomy protected by Article 21.',
          'Any information or material discovered with the help of voluntary test results may be admitted in evidence under Section 27 of the Indian Evidence Act.',
        ],
        mainsUtility:
          'Highly critical for Evidence Law and Constitutional Law papers on investigative techniques, Article 20(3) testimonial compulsion, and admissibility of Section 27 discoveries.',
        overruledPrecedents: 'Disapproved several High Court judgments permitting involuntary narco testing.',
        tags: [
          'Article 20(3)',
          'Narcoanalysis',
          'Mental Privacy',
          'Self-Incrimination',
          'Section 27 Evidence Act',
        ],
        importance: 'Landmark' as JudgementImportance,
        isPublished: true,
        isFeatured: false,
        downloadCount: 95,
        viewCount: 330,
        originalFilename: 'Selvi_Narcoanalysis_Self_Incrimination.pdf',
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
          'Foundational CPC authority establishing the fundamental distinction between inherent lack of jurisdiction (coram non judice) and irregular exercise of pecuniary or territorial jurisdiction under Section 21 CPC.',
        ratioDecidendi: [
          'A decree passed by a court without inherent jurisdiction over the subject-matter is a nullity and its invalidity could be set up whenever and wherever it is sought to be enforced or relied upon, even at the stage of execution and in collateral proceedings.',
          'Objection to pecuniary or territorial jurisdiction must be taken in the court of first instance at the earliest possible opportunity and before settlement of issues.',
          'Under Section 11 of the Suits Valuation Act, an appellate court cannot entertain an objection regarding valuation unless there is recorded prejudice on the merits.',
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
        downloadCount: 105,
        viewCount: 350,
        originalFilename: 'Kiran_Singh_Jurisdiction_Nullity_CPC.pdf',
      },
      {
        title: 'Vidya Drolia & Others v. Durga Trading Corporation',
        citation: '(2021) 2 SCC 1 | AIR 2021 SC 79',
        court: 'Supreme Court of India' as CourtCategory,
        bench: '3-Judge Bench',
        judges: ['N.V. Ramana, J.', 'Sanjiv Khanna, J.', 'Krishna Murari, J.'],
        dateOfJudgement: new Date('2020-12-14'),
        year: 2021,
        subject: 'Arbitration & Commercial Law',
        legalProvisions: [
          'Section 8 Arbitration Act',
          'Section 11 Arbitration Act',
          'Subject-Matter Arbitrability',
          'Four-Fold Test',
        ],
        summary:
          "Authoritative 3-judge bench decision articulating the definitive 'Four-Fold Test' to determine when a subject-matter dispute is non-arbitrable under the Arbitration and Conciliation Act 1996.",
        ratioDecidendi: [
          'Disputes are non-arbitrable when: (1) Cause of action arises out of actions in rem; (2) Erga omnes rights affected; (3) Inalienable sovereign/public interest involved; (4) Non-arbitrable by mandatory statutory decree.',
          'Landlord-tenant disputes governed by the Transfer of Property Act are fully arbitrable, except where covered by special statutory Rent Control Acts conferring exclusive jurisdiction on special tribunals.',
          'Judicial review at the Section 8 and Section 11 stage is prima facie and limited to weeding out non-existent, invalid or dead agreements, leaving merits to the arbitral tribunal.',
        ],
        mainsUtility:
          'Essential for Commercial Law, Arbitration Act, and Higher Judicial Service papers regarding judicial intervention limits and non-arbitrability tests.',
        overruledPrecedents: 'Overruled Himangni Enterprises v. Kamaljeet Singh Ahluwalia (2017).',
        tags: [
          'Arbitration Act',
          'Four-Fold Test',
          'Arbitrability',
          'Section 8 & 11',
          'Vidya Drolia',
        ],
        importance: 'Leading' as JudgementImportance,
        isPublished: true,
        isFeatured: false,
        downloadCount: 82,
        viewCount: 295,
        originalFilename: 'Vidya_Drolia_Arbitrability_Four_Fold_Test.pdf',
      },
      {
        title: 'Indra Sawhney & Others v. Union of India',
        citation: '1992 Supp (3) SCC 217 | AIR 1993 SC 477',
        court: 'Supreme Court of India' as CourtCategory,
        bench: '9-Judge Constitutional Bench (6:3 Majority)',
        judges: [
          'M.H. Kania, C.J.',
          'M.N. Venkatachaliah, J.',
          'S. Ratnavel Pandian, J.',
          'A.M. Ahmadi, J.',
          'K. Ramaswamy, J.',
          'P.B. Sawant, J.',
          'B.P. Jeevan Reddy, J.',
        ],
        dateOfJudgement: new Date('1992-11-16'),
        year: 1992,
        subject: 'Constitutional Law (Reservation Jurisprudence)',
        legalProvisions: [
          'Article 16(4)',
          'Article 14',
          'Article 15(4)',
          '50% Ceiling Limit',
          'Creamy Layer Exclusion',
        ],
        summary:
          "Monumental 9-judge bench decision upholding 27% reservation for Other Backward Classes (OBCs) while instituting the mandatory 'Creamy Layer' exclusion and cementing the 50% ceiling rule on total reservations.",
        ratioDecidendi: [
          'Backward class of citizens under Article 16(4) can be identified on the basis of caste; caste can be a relevant social backwardness criterion.',
          'Creamy layer among backward classes must be excluded from the benefit of reservation to ensure benefits reach the truly disadvantaged.',
          'Reservations under Article 16(4) cannot exceed 50% of appointments except in extraordinary situations; reservations in promotions are not constitutionally permissible under 16(4).',
        ],
        mainsUtility:
          'Fundamental precedent for Constitutional Law Mains answers on affirmative action, Article 16(4), 16(4A), 103rd Amendment EWS evaluation, and equality code.',
        overruledPrecedents: 'Overruled General Manager, S. Rly. v. Rangachari (1962) on reservation in promotions.',
        tags: [
          'Indra Sawhney',
          'Article 16(4)',
          '50% Ceiling',
          'Creamy Layer',
          'Reservations',
        ],
        importance: 'Landmark' as JudgementImportance,
        isPublished: true,
        isFeatured: false,
        downloadCount: 130,
        viewCount: 450,
        originalFilename: 'Indra_Sawhney_Mandal_Case_Digest.pdf',
      },
      {
        title: 'Shayara Bano v. Union of India & Others',
        citation: '(2017) 9 SCC 1 | AIR 2017 SC 4609',
        court: 'Supreme Court of India' as CourtCategory,
        bench: '5-Judge Constitution Bench (3:2 Majority)',
        judges: [
          'J.S. Khehar, C.J.',
          'Kurian Joseph, J.',
          'R.F. Nariman, J.',
          'U.U. Lalit, J.',
          'S. Abdul Nazeer, J.',
        ],
        dateOfJudgement: new Date('2017-08-22'),
        year: 2017,
        subject: 'Family Law & Constitutional Law',
        legalProvisions: [
          'Article 14',
          'Article 25',
          'Muslim Personal Law (Shariat) Application Act 1937',
          'Manifest Arbitrariness Doctrine',
        ],
        summary:
          'Constitution Bench set aside the practice of Talaq-e-Biddat (instantaneous triple talaq), ruling that it is capricious, whimsical, and violates Article 14 on the touchstone of Manifest Arbitrariness.',
        ratioDecidendi: [
          'Triple talaq (Talaq-e-Biddat) is instantaneous and irrevocable; an arbitrary power to break marital ties without attempt at reconciliation violates Article 14.',
          'Manifest Arbitrariness is an independent ground under Article 14 to invalidate both statutory enactments and recognized personal law customs.',
          'Practices not essential to religion are not protected under Article 25; what is bad in theology cannot be good in law.',
        ],
        mainsUtility:
          'Pivotal for Family Law & Constitutional Law questions regarding personal laws vs fundamental rights, Manifest Arbitrariness doctrine, and Muslim Women (Protection of Rights on Marriage) Act.',
        overruledPrecedents: 'Modified state of jurisprudence on unreviewability of personal laws.',
        tags: [
          'Triple Talaq',
          'Manifest Arbitrariness',
          'Article 14',
          'Family Law',
          'Shayara Bano',
        ],
        importance: 'Leading' as JudgementImportance,
        isPublished: true,
        isFeatured: false,
        downloadCount: 115,
        viewCount: 390,
        originalFilename: 'Shayara_Bano_Triple_Talaq_Manifest_Arbitrariness.pdf',
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
          'Unanimous 5-judge bench decision reading down Section 377 IPC to decriminalize consensual sexual relationships between adults in private, affirming that constitutional morality supersedes majoritarian morality.',
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
        isPublished: true,
        isFeatured: false,
        downloadCount: 140,
        viewCount: 480,
        originalFilename: 'Navtej_Johar_Section377_Constitutional_Morality.pdf',
      },
      {
        title: 'Shreya Singhal v. Union of India',
        citation: '(2015) 5 SCC 1 | AIR 2015 SC 1523',
        court: 'Supreme Court of India' as CourtCategory,
        bench: 'Division Bench (2 Judges)',
        judges: ['J. Chelameswar, J.', 'R.F. Nariman, J.'],
        dateOfJudgement: new Date('2015-03-24'),
        year: 2015,
        subject: 'Information Technology & Constitutional Law',
        legalProvisions: [
          'Section 66A IT Act',
          'Article 19(1)(a)',
          'Article 19(2)',
          'Void for Vagueness Doctrine',
          'Chilling Effect',
        ],
        summary:
          'Struck down Section 66A of the Information Technology Act 2000 in its entirety for violating freedom of speech and expression under Article 19(1)(a) without being saved by the reasonable restrictions under Article 19(2).',
        ratioDecidendi: [
          'Section 66A IT Act is unconstitutionally vague and overbroad; it penalizes discussion and advocacy alongside incitement, creating an impermissible chilling effect on free speech.',
          'Clear distinction must be maintained between discussion, advocacy, and incitement. Mere discussion or advocacy of an unpopular cause cannot be restricted under Article 19(2).',
          'Intermediary liability under Section 79(3)(b) IT Act read down so that intermediaries must take down content only upon receiving actual knowledge by a court order or authorized government notification.',
        ],
        mainsUtility:
          'Top citation for Article 19(1)(a) reasonable restrictions, free speech on digital platforms, Vagueness doctrine, and intermediary liability rules.',
        overruledPrecedents: 'Struck down Section 66A IT Act as ultra vires.',
        tags: [
          'Section 66A IT Act',
          'Freedom of Speech',
          'Article 19(1)(a)',
          'Chilling Effect',
          'Intermediary Liability',
        ],
        importance: 'Landmark' as JudgementImportance,
        isPublished: false, // DRAFT for Admin CMS queue verification
        isFeatured: false,
        downloadCount: 0,
        viewCount: 0,
        originalFilename: 'Shreya_Singhal_Section66A_Free_Speech.pdf',
      },
    ];

    for (const j of demoJudgements) {
      const pdfBuffer = createPdfBuffer(
        j.title,
        `${j.court} - ${j.citation}`,
        `3-Point Ratio Decidendi & Mains Value-Add Notes`
      );
      const randomSuffix = crypto.randomBytes(6).toString('hex');
      const filename = `judgement-${j.year}-${randomSuffix}.pdf`;
      const physicalPath = path.join(JUDGEMENTS_PDFS_DIR, filename);

      await fs.promises.writeFile(physicalPath, pdfBuffer);
      const sizeBytes = pdfBuffer.length;
      const sizeFormatted = `${(sizeBytes / 1024).toFixed(1)} KB`;

      await JudgementDigest.findOneAndUpdate(
        { citation: j.citation },
        {
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
        },
        { upsert: true, new: true }
      );

      console.log(`  ⚖️ [Judgement] ${j.citation} - ${j.title.slice(0, 45)}... (${j.isPublished ? 'Published' : 'Draft'})`);
    }

    console.log('\n=============================================================');
    console.log('🎉 DEMO DATA INGESTION COMPLETED SUCCESSFULLY!');
    console.log(`   Total PYQs in DB: ${await PyqPaper.countDocuments()} papers`);
    console.log(`   Total Landmark Judgements in DB: ${await JudgementDigest.countDocuments()} precedents`);
    console.log('=============================================================\n');
  } catch (err: any) {
    console.error('❌ Error feeding demo data:', err.message);
  }
};

// Standalone execution support
if (process.argv[1]?.endsWith('feedDemoData.ts')) {
  (async () => {
    await connectDB();
    await feedComprehensiveDemoData();
    await disconnectDB();
  })();
}

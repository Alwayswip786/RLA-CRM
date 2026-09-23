import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import User from '../models/user.model.js';
import BareActNote, { type ActCategory, type NoteDifficulty } from '../models/bareActNote.model.js';
import JudgementDigest from '../models/judgementDigest.model.js';
import connectDB, { disconnectDB } from '../config/db.js';
import { BARE_ACTS_PDFS_DIR } from '../middlewares/upload.middleware.js';

/**
 * Creates a valid minimal PDF-1.4 document buffer with statutory title & sections
 */
function createBareActPdfBuffer(actName: string, title: string, sections: string): Buffer {
  const contentStream = `BT
/F1 18 Tf
50 770 Td
(${actName.replace(/[()]/g, '')}) Tj
/F1 13 Tf
0 -30 Td
(${title.replace(/[()]/g, '')}) Tj
/F1 11 Tf
0 -25 Td
(${sections.replace(/[()]/g, '')}) Tj
/F1 10 Tf
0 -35 Td
(Rajinder Law Academy - Statutory Knowledge Vault & Bare Act Decoding) Tj
/F1 9 Tf
0 -20 Td
(Faculty Curated Section-by-Section Analysis, Concordance Charts & Mains Notes) Tj
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

interface DemoBareActData {
  actName: string;
  actYear: number;
  actNumber: string;
  category: ActCategory;
  chapter: string;
  sectionsCovered: string;
  title: string;
  description: string;
  highlights: string[];
  sectionBreakdown: {
    sectionNumber: string;
    heading: string;
    keyTakeaway: string;
    pageNumber: number;
  }[];
  difficulty: NoteDifficulty;
  author: string;
  tags: string[];
  pageCount: number;
  isFeatured?: boolean;
}

const DEMO_BARE_ACTS: DemoBareActData[] = [
  {
    actName: 'Bharatiya Nyaya Sanhita, 2023',
    actYear: 2023,
    actNumber: 'Act No. 45 of 2023',
    category: 'New Criminal Laws',
    chapter: 'Chapter VI: Offences Affecting the Human Body',
    sectionsCovered: 'Sections 100 to 146 (Mapping IPC 299 to 377)',
    title: 'Offences Affecting Life - BNS 2023 vs IPC 1860 Comparative Concordance & Flowcharts',
    description: 'Comprehensive section-by-section transition manual mapping IPC murder (300) with BNS murder (101), culpable homicide (100), mob lynching (103(2)), organized crime (111), and medical negligence (106). Includes handwritten model flowcharts and Mains answer blueprints.',
    highlights: [
      'IPC 299-304 vs BNS 100-106 Concordance Table',
      'Mob Lynching Section 103(2) statutory elements breakdown',
      'Organized Crime Section 111 vs MCOCA comparison',
      'Mains Model Answer: Medical Negligence under Section 106(1)',
    ],
    sectionBreakdown: [
      {
        sectionNumber: 'Section 100',
        heading: 'Culpable Homicide not amounting to murder',
        keyTakeaway: 'Replaces IPC 299; preserves the 3 classical intent/knowledge tiers with streamlined language.',
        pageNumber: 12,
      },
      {
        sectionNumber: 'Section 101',
        heading: 'Murder & Classical Exceptions',
        keyTakeaway: 'Replaces IPC 300; incorporates all 5 exceptions including Grave & Sudden Provocation.',
        pageNumber: 24,
      },
      {
        sectionNumber: 'Section 103(2)',
        heading: 'Punishment for Murder by 5 or more persons (Mob Lynching)',
        keyTakeaway: 'Newly codified offence imposing capital punishment or life imprisonment for hate/bias lynching.',
        pageNumber: 45,
      },
      {
        sectionNumber: 'Section 106',
        heading: 'Causing death by negligence',
        keyTakeaway: 'Separates ordinary vehicular rashness (5 years) from hit-and-run without reporting (10 years).',
        pageNumber: 58,
      },
      {
        sectionNumber: 'Section 111',
        heading: 'Organized Crime Syndicate Offences',
        keyTakeaway: 'First national penal codification defining continuing unlawful activity, economic offences, and syndicate membership.',
        pageNumber: 76,
      },
    ],
    difficulty: 'Comprehensive Mastery',
    author: 'Adv. Rajinder Sir & Criminal Law Faculty',
    tags: ['BNS', 'New Criminal Laws', 'Homicide', 'Murder', 'IPC Comparison', 'Mob Lynching'],
    pageCount: 184,
    isFeatured: true,
  },
  {
    actName: 'Code of Civil Procedure, 1908',
    actYear: 1908,
    actNumber: 'Act No. 5 of 1908',
    category: 'Major Procedural Act',
    chapter: 'Part I: Suits in General & Orders I to XX',
    sectionsCovered: 'Sections 9 to 35B & Orders I, II, VI, VII, VIII',
    title: 'Civil Procedure Master Handbook: Jurisdiction, Res Judicata & Pleadings Formulas',
    description: 'Line-by-line bare act analysis with Orders & Rules synopses. Specialized focus on Section 9 (Inherent Jurisdiction), Section 10 (Res Sub Judice), Section 11 (Res Judicata 8 Explanations), Order VI Rule 17 (Amendment of Pleadings), and Order VII Rule 11 (Rejection of Plaint).',
    highlights: [
      'Res Judicata Section 11: All 8 Explanations Simplified',
      'Order VII Rule 11: 6 Grounds for Plaint Rejection with Landmark Case Citations',
      'Pleadings Drafting Formulas for Judiciary Practical Papers',
      'Execution of Decrees (Section 36 to 74 & Order XXI) Quick Chart',
    ],
    sectionBreakdown: [
      {
        sectionNumber: 'Section 9',
        heading: 'Courts to try all civil suits unless barred',
        keyTakeaway: 'Expressly or impliedly barred suits; presumption in favor of civil court jurisdiction (Dhulabhai test).',
        pageNumber: 8,
      },
      {
        sectionNumber: 'Section 10',
        heading: 'Stay of Suit (Res Sub Judice)',
        keyTakeaway: 'Mandatory stay on trial of previously instituted suit; does not bar filing of plaint or interlocutory relief.',
        pageNumber: 19,
      },
      {
        sectionNumber: 'Section 11',
        heading: 'Res Judicata (Matter directly & substantially in issue)',
        keyTakeaway: 'Explanations I to VIII analyzed; constructive res judicata under Explanation IV explained with flowcharts.',
        pageNumber: 31,
      },
      {
        sectionNumber: 'Order VI Rule 17',
        heading: 'Amendment of Pleadings',
        keyTakeaway: 'Pre-trial vs post-commencement of trial standards; due diligence proviso and Salem Advocate Bar Association tests.',
        pageNumber: 94,
      },
      {
        sectionNumber: 'Order VII Rule 11',
        heading: 'Rejection of Plaint',
        keyTakeaway: 'Must be decided solely on basis of plaint averments without looking into written statement.',
        pageNumber: 118,
      },
    ],
    difficulty: 'Mains Analytical',
    author: 'Adv. Rajinder Sir & Civil Procedure Team',
    tags: ['CPC', 'Civil Procedure', 'Res Judicata', 'Pleadings', 'Order VII Rule 11', 'Jurisdiction'],
    pageCount: 210,
    isFeatured: false,
  },
  {
    actName: 'Bharatiya Nagarik Suraksha Sanhita, 2023',
    actYear: 2023,
    actNumber: 'Act No. 46 of 2023',
    category: 'New Criminal Laws',
    chapter: 'Chapter V & XII: Arrest, Information to Police & Remand',
    sectionsCovered: 'Sections 35 to 62 & Sections 173 to 193 (Mapping CrPC 41 to 173)',
    title: 'Arrest, Bail, Forensic Mandates & Police Custody Limits under BNSS 2023',
    description: 'Practical procedural decoding of BNSS changes: Zero FIR statutory formalization, electronic summons service, Section 176(3) mandatory forensic team visit for offences punishable with 7+ years, and Section 187 police custody staggered over 60/90 days.',
    highlights: [
      'Section 187 BNSS: 15-day police custody spread across 40/60 days',
      'Mandatory Forensic Investigation Protocol under Section 176(3)',
      'First-time offender statutory bail under Section 479 BNSS',
      'Audio-video electronic recording of search and seizure (Section 105)',
    ],
    sectionBreakdown: [
      {
        sectionNumber: 'Section 35',
        heading: 'When police may arrest without warrant',
        keyTakeaway: 'Replaces CrPC 41; integrates Arnesh Kumar notice safeguards and prior sanction for senior citizens.',
        pageNumber: 14,
      },
      {
        sectionNumber: 'Section 173',
        heading: 'Information in cognizable cases (Zero FIR & E-FIR)',
        keyTakeaway: 'Statutory mandate to register Zero FIR and allow electronic FIR with signature verification within 3 days.',
        pageNumber: 42,
      },
      {
        sectionNumber: 'Section 176(3)',
        heading: 'Mandatory Forensic Expert Inspection',
        keyTakeaway: 'Compulsory on-site videographed forensic inspection for crimes carrying punishment of 7 years or more.',
        pageNumber: 68,
      },
      {
        sectionNumber: 'Section 187',
        heading: 'Procedure when investigation cannot be completed in 24 hours (Remand)',
        keyTakeaway: 'Critical shift allowing 15 days of police custody in parts during the first 40 or 60 days of the detention period.',
        pageNumber: 89,
      },
      {
        sectionNumber: 'Section 479',
        heading: 'Maximum period for which an undertrial prisoner can be detained',
        keyTakeaway: 'Special relaxation for first-time offenders who have served one-third of the maximum sentence.',
        pageNumber: 145,
      },
    ],
    difficulty: 'Comprehensive Mastery',
    author: 'Adv. Sharma & Procedural Research Wing',
    tags: ['BNSS', 'CrPC Comparison', 'Police Custody', 'Bail', 'Forensic Protocol', 'Zero FIR'],
    pageCount: 195,
    isFeatured: false,
  },
  {
    actName: 'Constitution of India',
    actYear: 1950,
    actNumber: 'Supreme Law of the Land',
    category: 'Major Substantive Act',
    chapter: 'Part III & IV: Fundamental Rights, DPSP & Writs',
    sectionsCovered: 'Articles 12 to 51A & Articles 32, 226',
    title: 'Constitutional Law Master Digest: Fundamental Rights, Judicial Review & Writs Jurisprudence',
    description: 'Judiciary services centric breakdown of Article 12 (State definition), Article 13 (Doctrine of Eclipse, Severability), Article 14 (Rule against Arbitrariness), Article 19 (Reasonable Restrictions), Article 21 (Golden Triangle & Due Process), and Articles 32/226 (Prerogative Writs).',
    highlights: [
      'Golden Triangle Test: Interconnection of Articles 14, 19, and 21',
      'Chronological Table of 12 Basic Structure Doctrine Decisions',
      'Comparative Table: Article 32 vs Article 226 Scope & Discretion',
      'Directive Principles (Part IV) vs Fundamental Rights Harmonious Construction',
    ],
    sectionBreakdown: [
      {
        sectionNumber: 'Article 12',
        heading: 'Definition of the State & Other Authorities',
        keyTakeaway: 'Ajay Hasia 6-factor test and Pradeep Kumar Biswas functional/administrative dominance test.',
        pageNumber: 10,
      },
      {
        sectionNumber: 'Article 14',
        heading: 'Equality before Law & Equal Protection of Laws',
        keyTakeaway: 'Old doctrine of reasonable classification (State of WB v. Anwar Ali) vs New non-arbitrariness doctrine (Royappa & Shayara Bano).',
        pageNumber: 22,
      },
      {
        sectionNumber: 'Article 21',
        heading: 'Protection of Life and Personal Liberty',
        keyTakeaway: 'Evolution from A.K. Gopalan to Maneka Gandhi; right to privacy (Puttaswamy) and right to die with dignity (Common Cause).',
        pageNumber: 48,
      },
      {
        sectionNumber: 'Article 32',
        heading: 'Remedies for enforcement of Fundamental Rights (Constitutional Soul)',
        keyTakeaway: 'Scope of Habeas Corpus, Mandamus, Certiorari, Prohibition, and Quo Warranto with locus standi relaxations (PIL).',
        pageNumber: 82,
      },
    ],
    difficulty: 'Mains Analytical',
    author: 'Adv. Rajinder Sir & Constitutional Bench Faculty',
    tags: ['Constitution', 'Fundamental Rights', 'Article 21', 'Writs', 'Judicial Review', 'Basic Structure'],
    pageCount: 160,
    isFeatured: false,
  },
  {
    actName: 'Bharatiya Sakshya Adhiniyam, 2023',
    actYear: 2023,
    actNumber: 'Act No. 47 of 2023',
    category: 'New Criminal Laws',
    chapter: 'Part II: Relevancy of Facts & Electronic Records',
    sectionsCovered: 'Sections 22 to 27 & Sections 57 to 63 (Mapping IEA 24-30 & 65A-65B)',
    title: 'Electronic Evidence, Confessions & Digital Signatures under BSA 2023',
    description: 'Detailed statutory analysis of the transition from Indian Evidence Act 1872 to BSA 2023. Comprehensive guide to Section 61 (Electronic Records Admissibility), Section 63 (Certificate requirement replacing Section 65B IEA), Section 23 (Confessions), and Section 24 (Discovery under Police Custody).',
    highlights: [
      'Section 63 BSA vs Section 65B IEA: Streamlined Certificate Schedule',
      'Primary vs Secondary Electronic Evidence under Section 57 Explanations',
      'Confessions & Information leading to discovery under Section 23 & 24',
      'Expert opinion on digital signatures and hash algorithms',
    ],
    sectionBreakdown: [
      {
        sectionNumber: 'Section 23',
        heading: 'Confession caused by inducement, threat or promise',
        keyTakeaway: 'Replaces IEA 24; retains protections against involuntary statements made to persons in authority.',
        pageNumber: 15,
      },
      {
        sectionNumber: 'Section 24',
        heading: 'How much of information received from accused may be proved',
        keyTakeaway: 'Replaces Section 27 IEA; exact statutory words retained affirming Pulukuri Kottaya doctrine of discovery.',
        pageNumber: 26,
      },
      {
        sectionNumber: 'Section 57',
        heading: 'Primary Evidence & Electronic Storage Media',
        keyTakeaway: 'Explicitly recognizes synchronized cloud storage, USBs, and semiconductor memory as primary evidence if created in ordinary course.',
        pageNumber: 52,
      },
      {
        sectionNumber: 'Section 63',
        heading: 'Admissibility of electronic records and Certificate Schedule',
        keyTakeaway: 'Prescribes mandatory certificate signed by in-charge of device or official forensic expert.',
        pageNumber: 74,
      },
    ],
    difficulty: 'Mains Analytical',
    author: 'Adv. Gupta & Forensic Evidence Team',
    tags: ['BSA', 'Evidence Act', 'Electronic Evidence', 'Section 65B', 'Confession', 'Discovery'],
    pageCount: 140,
    isFeatured: false,
  },
  {
    actName: 'Indian Contract Act, 1872',
    actYear: 1872,
    actNumber: 'Act No. 9 of 1872',
    category: 'Civil & Property Law',
    chapter: 'Chapters I to VI: Formation, Performance & Breach of Contracts',
    sectionsCovered: 'Sections 1 to 75 (General Principles)',
    title: 'General Principles of Contract Law: Formation, Vitiating Factors & Frustration',
    description: 'Core statutory breakdown covering Section 2(h) enforceability, Section 10 valid contract requisites, Sections 13 to 19 Free Consent (Coercion, Undue Influence, Fraud, Misrepresentation), Section 23 Unlawful Consideration, Section 56 Frustration of Contract (Satyabrata Ghose), and Sections 73-74 Damages.',
    highlights: [
      'Section 56 Doctrine of Frustration vs Section 32 Contingent Contracts',
      'Liquidated Damages vs Penalty under Section 74 (Kailash Nath case law)',
      'Free Consent vitiating factors comparison matrix',
      'Standard Form of Contracts and unequal bargaining power tests',
    ],
    sectionBreakdown: [
      {
        sectionNumber: 'Section 10',
        heading: 'What agreements are contracts (Essential conditions)',
        keyTakeaway: 'Free consent, competent parties, lawful consideration, lawful object, and not expressly declared void.',
        pageNumber: 8,
      },
      {
        sectionNumber: 'Section 16',
        heading: 'Undue Influence (Dominating the will of another)',
        keyTakeaway: 'Presumption in fiduciary relations and unconscionable transactions; burden of proof shift.',
        pageNumber: 24,
      },
      {
        sectionNumber: 'Section 56',
        heading: 'Agreement to do impossible act & Subsequent Frustration',
        keyTakeaway: 'Supervening impossibility dissolving contract automatically; distinguished from commercial hardship.',
        pageNumber: 58,
      },
      {
        sectionNumber: 'Section 73',
        heading: 'Compensation for loss or damage caused by breach',
        keyTakeaway: 'Hadley v. Baxendale rule codified: direct and natural losses vs remote damages.',
        pageNumber: 79,
      },
    ],
    difficulty: 'Prelims Booster',
    author: 'Adv. Rajinder Sir & Commercial Faculty',
    tags: ['Contract Act', 'Frustration', 'Damages', 'Section 56', 'Free Consent', 'Breach'],
    pageCount: 125,
    isFeatured: false,
  },
];

async function seedBareActs() {
  console.log('🏛️ Connecting to MongoDB Atlas for Bare Act Notes seeding...');
  await connectDB();

  // Find or create admin user to attribute upload
  let adminUser = await User.findOne({ role: 'admin' });
  if (!adminUser) {
    adminUser = await User.findOne({});
  }

  if (!adminUser) {
    console.error('❌ No user found in database to attribute Bare Act note uploads to. Run seed:admin first.');
    await disconnectDB();
    process.exit(1);
  }

  console.log(`👤 Using admin user: ${adminUser.name} (${adminUser.email || adminUser.rollNo})`);

  // Ensure uploads directory exists
  if (!fs.existsSync(BARE_ACTS_PDFS_DIR)) {
    fs.mkdirSync(BARE_ACTS_PDFS_DIR, { recursive: true });
  }

  // Fetch some judgement IDs if available for cross-linking
  const judgements = await JudgementDigest.find({}).limit(5).select('_id');
  const judgementIds = judgements.map((j) => j._id);

  console.log('🧹 Clearing existing BareActNote collection...');
  await BareActNote.deleteMany({});

  console.log(`📦 Seeding ${DEMO_BARE_ACTS.length} authoritative Bare Act Decoding Notes...`);

  for (const item of DEMO_BARE_ACTS) {
    const randomSuffix = crypto.randomBytes(8).toString('hex');
    const filename = `bareact-${Date.now()}-${randomSuffix}.pdf`;
    const physicalPath = path.join(BARE_ACTS_PDFS_DIR, filename);

    // Generate valid PDF document
    const pdfBuffer = createBareActPdfBuffer(item.actName, item.title, item.sectionsCovered);
    fs.writeFileSync(physicalPath, pdfBuffer);

    const sizeBytes = pdfBuffer.length;
    const sizeFormatted = `${parseFloat((sizeBytes / 1024).toFixed(1))} KB`;

    // Random initial downloads between 200 and 800
    const downloadCount = Math.floor(Math.random() * 600) + 200;
    const viewCount = downloadCount * 2 + Math.floor(Math.random() * 300);

    // Cross link with up to 2 landmark judgements if available
    const related = judgementIds.slice(0, 2);

    await BareActNote.create({
      actName: item.actName,
      actYear: item.actYear,
      actNumber: item.actNumber,
      category: item.category,
      chapter: item.chapter,
      sectionsCovered: item.sectionsCovered,
      title: item.title,
      description: item.description,
      highlights: item.highlights,
      sectionBreakdown: item.sectionBreakdown,
      difficulty: item.difficulty,
      author: item.author,
      tags: item.tags,
      relatedJudgements: related,
      pdfFile: {
        filename,
        originalName: `${item.actName.replace(/[^a-zA-Z0-9]/g, '_')}_Decoding_Notes.pdf`,
        path: physicalPath,
        mimeType: 'application/pdf',
        sizeBytes,
        sizeFormatted,
        pageCount: item.pageCount,
      },
      isPublished: true,
      publishedAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 86400000),
      isFeatured: !!item.isFeatured,
      downloadCount,
      viewCount,
      uploadedBy: adminUser._id,
    });

    console.log(`  ✅ Seeded: [${item.category}] ${item.actName} (${item.sectionsCovered})`);
  }

  console.log(`\n🎉 Successfully seeded ${DEMO_BARE_ACTS.length} Bare Act Decoding Notes!`);
  await disconnectDB();
  process.exit(0);
}

seedBareActs().catch(async (err) => {
  console.error('❌ Error seeding Bare Act notes:', err);
  await disconnectDB();
  process.exit(1);
});

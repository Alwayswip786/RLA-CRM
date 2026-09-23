import User from '../models/user.model.js';
import Bookmark from '../models/bookmark.model.js';
import connectDB, { disconnectDB } from '../config/db.js';

const DEMO_BOOKMARKS = [
  {
    itemId: 'mcq-crpc-482-quash',
    itemType: 'MCQ' as const,
    title:
      'Whether the High Court under Section 482 of CrPC can quash an FIR in non-compoundable offences when the dispute is predominantly civil or commercial and the parties have amicably compromised?',
    source: 'CrPC Section 482 / BNSS Section 528 & Gian Singh v. State of Punjab (2012)',
    subject: 'Criminal Procedure Code',
    annotation:
      'Key distinction: Commercial/civil disputes with compromise can be quashed under 482 to prevent abuse of process, but heinous offences (murder, rape, dacoity) cannot be compromised even if parties settle.',
    tags: ['CrPC 482', 'BNSS 528', 'Quashing FIR', 'Compromise Quashing', 'Gian Singh'],
    metadata: {
      options: [
        { key: 'A', text: 'No, High Court has no power to quash non-compoundable offences under any circumstances.' },
        { key: 'B', text: 'Yes, if the dispute is predominantly civil/commercial and conviction is remote after amicable settlement.' },
        { key: 'C', text: 'Yes, but only with prior written sanction of the State Government Advocate General.' },
        { key: 'D', text: 'No, compoundability under Section 320 is strictly exhaustive and binding on inherent powers.' },
      ],
      correctOption: 'B',
      explanation:
        'Gian Singh v. State of Punjab (2012) 10 SCC 303 & State of MP v. Laxmi Narayan (2019): Inherent power under Section 482 is not curbed by Section 320. For offences arising out of commercial or matrimonial disputes, quashing is justified to preserve peace.',
    },
  },
  {
    itemId: 'mcq-cpc-sec21-jurisdiction',
    itemType: 'MCQ' as const,
    title:
      'Whether an objection as to the territorial or pecuniary jurisdiction of the trial court can be raised for the first time in the appellate or revisional court?',
    source: 'CPC Section 21 & Kiran Singh v. Chaman Paswan (1954 SC)',
    subject: 'Civil Procedure Code',
    annotation:
      'Remember: Pecuniary and territorial defects must be raised at earliest opportunity before settlement of issues; only subject-matter defect goes to root and renders decree a nullity.',
    tags: ['CPC Section 21', 'Territorial Jurisdiction', 'Pecuniary Jurisdiction', 'Coram Non Judice'],
    metadata: {
      options: [
        { key: 'A', text: 'Yes, jurisdictional objections can be raised at any stage including execution.' },
        { key: 'B', text: 'No, unless taken in the court of first instance at earliest opportunity and there was consequent failure of justice.' },
        { key: 'C', text: 'Yes, but only with special leave granted by the High Court in revision.' },
        { key: 'D', text: 'No, territorial jurisdiction can never be challenged once the plaint is admitted.' },
      ],
      correctOption: 'B',
      explanation:
        'Under Section 21(1) and 21(2) CPC, three conditions must concur before an appellate/revisional court entertains the objection: (1) taken in trial court, (2) taken at earliest possible opportunity, and (3) there has been a consequent failure of justice.',
    },
  },
  {
    itemId: 'judg-kiran-singh-1954',
    itemType: 'Judgment' as const,
    title: 'Kiran Singh & Ors. v. Chaman Paswan & Ors. (AIR 1954 SC 340)',
    source: 'AIR 1954 SC 340 (5-Judge Constitutional Bench)',
    subject: 'Civil Procedure Code',
    annotation:
      'Fundamental principle: A decree passed by a court without subject-matter jurisdiction is a coram non judice (nullity) and defect can be raised even at execution or collateral stage.',
    tags: ['Subject Matter Jurisdiction', 'Nullity of Decree', 'Coram Non Judice', 'Execution Stage', 'Section 21 CPC'],
    metadata: {
      citation: 'AIR 1954 SC 340 | 1955 SCR 117',
      court: 'Supreme Court of India',
      bench: '5-Judge Bench (B.K. Mukherjea, Vivian Bose, Ghulam Hasan, N.H. Bhagwati, T.L. Venkatarama Ayyar, JJ.)',
      year: 1954,
      targetRoute: '/dashboard/judgements',
    },
  },
  {
    itemId: 'judg-satender-antil-2022',
    itemType: 'Judgment' as const,
    title: 'Satender Kumar Antil v. CBI (2022) 10 SCC 51 — Comprehensive Bail Guidelines',
    source: 'Criminal Law / BNSS Section 479 & 480',
    subject: 'Criminal Procedure Code',
    annotation:
      'Key test categorization of offences (A, B, C, D) for grant of bail without physical custody upon filing of chargesheet.',
    tags: ['Bail Jurisprudence', 'Section 437/439 CrPC', 'BNSS 479', 'Personal Liberty', 'Arrest Guidelines'],
    metadata: {
      citation: '(2022) 10 SCC 51 | 2022 LiveLaw (SC) 577',
      court: 'Supreme Court of India',
      bench: 'Division Bench (S.K. Kaul & M.M. Sundresh, JJ.)',
      year: 2022,
      targetRoute: '/dashboard/judgements',
    },
  },
  {
    itemId: 'bare-act-cpc-sec21',
    itemType: 'Bare Act Note' as const,
    title: 'Section 21 CPC — Objections to Jurisdiction (Territorial, Pecuniary & Execution)',
    source: 'The Code of Civil Procedure, 1908 — Part I, Sections 15 to 21A',
    subject: 'Civil Procedure Code',
    annotation:
      'Three mandatory conditions for pecuniary/territorial objection: (1) taken in court of first instance, (2) at earliest opportunity, (3) consequent failure of justice. Distinguish from Section 9 inherent defect.',
    tags: ['CPC 1908', 'Section 21', 'Section 9', 'Jurisdiction Objections', 'Consequent Failure of Justice'],
    metadata: {
      actName: 'The Code of Civil Procedure, 1908',
      actYear: 1908,
      sectionsCovered: 'Sections 15 - 21A',
      chapter: 'Part I — Suits in General',
      targetRoute: '/dashboard/bare-acts',
    },
  },
  {
    itemId: 'bare-act-bns-sec38',
    itemType: 'Bare Act Note' as const,
    title: 'Comparative Table: Section 100 IPC vs Section 38 BNS (When Right of Private Defence Extends to Causing Death)',
    source: 'Bharatiya Nyaya Sanhita, 2023 — Chapter III',
    subject: 'Substantive Criminal Law',
    annotation:
      'Check the newly phrased 7th clause on acid attack and gang rape. Section 38(7) BNS codifies the 2013 criminal amendment explicitly.',
    tags: ['BNS 2023', 'Section 38', 'IPC Section 100', 'Private Defence', 'New Criminal Laws'],
    metadata: {
      actName: 'Bharatiya Nyaya Sanhita, 2023',
      actYear: 2023,
      sectionsCovered: 'Sections 34 - 44',
      chapter: 'Chapter III — General Exceptions',
      targetRoute: '/dashboard/bare-acts',
    },
  },
];

export const seedBookmarks = async (): Promise<void> => {
  try {
    await connectDB();

    // Find demo student
    const student = await User.findOne({
      $or: [{ email: 'rohit.verma@rajinderlawacademy.com' }, { rollNo: 'RLA20260001' }, { role: 'student' }],
    });

    if (!student) {
      console.warn('⚠️ No student account found to seed bookmarks. Please run npm run seed:admin first.');
      return;
    }

    console.log(`👤 Seeding Starred Vault for student: ${student.name} (${student.email})`);

    let addedCount = 0;
    for (const item of DEMO_BOOKMARKS) {
      await Bookmark.findOneAndUpdate(
        {
          user: student._id,
          itemType: item.itemType,
          itemId: item.itemId,
        },
        {
          $set: {
            user: student._id,
            itemType: item.itemType,
            itemId: item.itemId,
            title: item.title,
            source: item.source,
            subject: item.subject,
            annotation: item.annotation,
            tags: item.tags,
            metadata: item.metadata,
          },
        },
        { upsert: true, new: true }
      );
      addedCount++;
      console.log(`  ⭐ [${item.itemType}] ${item.title.slice(0, 60)}...`);
    }

    console.log(`\n🎉 Successfully synced ${addedCount} initial bookmarks to Starred Vault!`);
  } catch (err: any) {
    console.error('❌ Error seeding bookmarks:', err);
    throw err;
  } finally {
    await disconnectDB();
  }
};

// Standalone execution
if (process.argv[1]?.endsWith('seedBookmarks.ts')) {
  seedBookmarks()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

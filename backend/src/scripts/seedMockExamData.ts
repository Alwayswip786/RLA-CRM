import mongoose from 'mongoose';
import connectDB, { disconnectDB } from '../config/db.js';
import McqQuestion from '../models/mcqQuestion.model.js';
import MockTest from '../models/mockTest.model.js';
import User from '../models/user.model.js';

interface RawSeedSpec {
  actName: string;
  subject: string;
  prefix: string;
  items: Array<{
    sec: string;
    topic: string;
    q: string;
    opts: [string, string, string, string];
    ans: number;
    exp: string;
    cases?: string[];
    diff?: 'easy' | 'medium' | 'hard';
    format?: 'bare_act_textual' | 'case_law_based' | 'assertion_reason' | 'illustration';
  }>;
}

const BARE_ACT_SPECS: RawSeedSpec[] = [
  // 1. CPC
  {
    actName: 'Code of Civil Procedure, 1908',
    subject: 'Civil Law',
    prefix: 'CPC',
    items: [
      {
        sec: 'Section 11 (Explanation IV)',
        topic: 'Res Judicata',
        q: 'Under the Code of Civil Procedure, 1908, the doctrine of constructive res judicata is embodied in which explanation of Section 11?',
        opts: ['Explanation I to Section 11', 'Explanation IV to Section 11', 'Explanation VI to Section 11', 'Explanation VIII to Section 11'],
        ans: 1,
        exp: 'Explanation IV to Section 11 provides that any matter which might and ought to have been made ground of defence or attack in such former suit shall be deemed to have been a matter directly and substantially in issue in such suit.',
        cases: ['State of UP v. Nawab Hussain (1977)', 'Forward Construction Co. v. Prabhat Mandal (1986)'],
      },
      {
        sec: 'Section 10',
        topic: 'Stay of Suit',
        q: 'The doctrine of Sub Judice under Section 10 of the CPC mandates that:',
        opts: ['The institution of a subsequent suit is barred', 'The trial of a subsequent suit is barred', 'Both institution and trial of subsequent suit are barred', 'The execution of decree is stayed'],
        ans: 1,
        exp: 'Section 10 bars the trial of a suit and not the institution of the subsequent suit. The court can pass interlocutory orders like injunction even if trial is stayed.',
        cases: ['Indian Bank v. Maharashtra State Coop (1998)'],
      },
      {
        sec: 'Section 9',
        topic: 'Courts to Try All Civil Suits',
        q: 'A suit in which the right to property or to an office is contested is a suit of a civil nature notwithstanding that such right may depend entirely on the decision of questions as to:',
        opts: ['Religious rites or ceremonies', 'Political party membership', 'Customary honorifics', 'Executive policies'],
        ans: 0,
        exp: 'Explanation I to Section 9 clearly states that a suit involving a right to property or to an office is of a civil nature notwithstanding that such right may depend entirely on the decision of questions as to religious rites or ceremonies.',
        cases: ['PMA Metropolitan v. Moran Mar Marthoma (1995)'],
      },
      {
        sec: 'Section 89',
        topic: 'Alternative Dispute Resolution',
        q: 'Section 89 of CPC was formulated on the recommendations of the Malimath Committee. In which landmark ruling did the Supreme Court iron out the statutory ambiguities between Section 89 and the Arbitration Act?',
        opts: ['Salem Advocate Bar Association (I) v. UOI', 'Afcons Infrastructure Ltd. v. Cherian Varkey Construction Co. (2010)', 'Bharat Aluminium Co. v. Kaiser Aluminium', 'ONGC v. Saw Pipes Ltd.'],
        ans: 1,
        exp: 'In Afcons Infrastructure Ltd. (2010) 8 SCC 24, the Supreme Court clarified the procedure of Section 89 and drafted model rules for Court-Annexed Mediation and ADR.',
        cases: ['Afcons Infrastructure Ltd. (2010) 8 SCC 24'],
      },
      {
        sec: 'Section 100',
        topic: 'Second Appeal',
        q: 'A second appeal shall lie to the High Court under Section 100 of CPC from every decree passed in appeal by any court subordinate to the High Court if the High Court is satisfied that the case involves:',
        opts: ['A substantial question of fact', 'A substantial question of law', 'A mixed question of law and fact', 'Any procedural irregularity'],
        ans: 1,
        exp: 'Under Section 100(1) CPC as amended in 1976, second appeal lies strictly on a substantial question of law formulated by the High Court.',
        cases: ['Chunilal V. Mehta v. Century Spg. & Mfg. Co. (1962)'],
      },
      {
        sec: 'Section 115',
        topic: 'Revision',
        q: 'Under Section 115 of CPC, the High Court shall not vary or reverse any order made in the course of a suit except where the order, if it had been made in favour of the party applying for revision:',
        opts: ['Would have caused financial hardship', 'Would have finally disposed of the suit or other proceedings', 'Would have stayed execution', 'Would have mandated fresh summons'],
        ans: 1,
        exp: 'Proviso to Section 115(1) CPC (added in 1999) restricts revisional intervention strictly to orders which, if made in favour of the applicant, would have finally disposed of the suit or proceeding.',
        cases: ['Shiv Shakti Coop. Housing Society v. Swaraj Developers (2003)'],
      },
      {
        sec: 'Section 21',
        topic: 'Objection to Jurisdiction',
        q: 'Under Section 21 of CPC, an objection as to the place of suing shall not be allowed by any appellate or revisional court unless such objection was taken:',
        opts: ['At any time before final arguments', 'In the court of first instance at earliest opportunity and there has been a failure of justice', 'Only after obtaining leave from the District Judge', 'In the written statement as preliminary issue exclusively'],
        ans: 1,
        exp: 'Section 21 mandates three conditions: (1) objection raised in trial court, (2) at earliest possible opportunity, and (3) there was a consequent failure of justice.',
        cases: ['Kiran Singh v. Chaman Paswan (1954)'],
      },
      {
        sec: 'Section 151',
        topic: 'Inherent Powers',
        q: 'Inherent powers of the court under Section 151 of CPC can be exercised:',
        opts: ['To override explicit statutory prohibitions', 'To make such orders as may be necessary for the ends of justice or to prevent abuse of the process of the court', 'Exclusively in appellate proceedings', 'Only when both parties consent in writing'],
        ans: 1,
        exp: 'Section 151 preserves inherent powers to do justice or prevent abuse of process, but cannot be invoked in direct conflict with an express provision of the Code.',
        cases: ['Manohar Lal Chopra v. Rai Bahadur Rao Raja Seth Hiralal (1962)'],
      },
      {
        sec: 'Order 39 Rule 1 & 2',
        topic: 'Temporary Injunctions',
        q: 'Which of the following is NOT one of the three foundational pillars for granting a temporary injunction under Order 39 Rule 1 & 2?',
        opts: ['Prima facie case', 'Balance of convenience', 'Irreparable injury', 'Proof beyond reasonable doubt'],
        ans: 3,
        exp: 'The three cardinal principles for interim injunctions are: (1) Prima facie case, (2) Balance of convenience, and (3) Irreparable injury.',
        cases: ['Dalpat Kumar v. Prahlad Singh (1992)'],
      },
      {
        sec: 'Order 7 Rule 11',
        topic: 'Rejection of Plaint',
        q: 'An application for rejection of plaint under Order 7 Rule 11 of CPC must be decided on the basis of:',
        opts: ['Averments made in the plaint alone', 'Averments in the written statement', 'Evidence produced during admission/denial', 'Affidavits filed by both parties'],
        ans: 0,
        exp: 'It is a trite law that for deciding an application under Order 7 Rule 11 CPC, only the averments in the plaint are germane; the defence in the written statement cannot be looked into.',
        cases: ['Saleem Bhai v. State of Maharashtra (2003)', 'Dahiben v. Arvindbhai Kalyanji Bhanusali (2020)'],
      },
    ],
  },
  // 2. BNS 2023
  {
    actName: 'Bhartiya Nyaya Sanhita, 2023',
    subject: 'Criminal Law',
    prefix: 'BNS',
    items: [
      {
        sec: 'Section 103',
        topic: 'Murder',
        q: 'Section 103(2) of Bhartiya Nyaya Sanhita, 2023 introduces a specific punishment for mob lynching / murder committed by a group of five or more persons acting in concert on grounds of race, caste or sex. The minimum punishment is:',
        opts: ['Imprisonment for 7 years', 'Imprisonment for 10 years', 'Imprisonment for life or death', 'Rigorous imprisonment for 14 years'],
        ans: 2,
        exp: 'Section 103(2) BNS 2023 penalises mob murder by 5 or more persons with death or imprisonment for life, alongside fine.',
      },
      {
        sec: 'Section 105',
        topic: 'Culpable Homicide',
        q: 'Under BNS 2023, culpable homicide not amounting to murder corresponds to which section of the repealed IPC?',
        opts: ['Section 300 IPC', 'Section 304 IPC', 'Section 308 IPC', 'Section 302 IPC'],
        ans: 1,
        exp: 'Section 105 BNS corresponds to Section 304 IPC (Culpable homicide not amounting to murder).',
      },
      {
        sec: 'Section 69',
        topic: 'Sexual Offences',
        q: 'Section 69 of Bhartiya Nyaya Sanhita, 2023 creates a new standalone offence penalising sexual intercourse by employing deceitful means or false promise to marry. The maximum punishment is:',
        opts: ['5 years imprisonment', '7 years imprisonment', '10 years imprisonment', 'Life imprisonment'],
        ans: 2,
        exp: 'Section 69 BNS punishes sexual intercourse by deceitful means (including false promise of employment or marriage) with imprisonment up to 10 years and fine.',
      },
      {
        sec: 'Section 111',
        topic: 'Organised Crime',
        q: 'Section 111 of BNS 2023 penalises "Organised Crime". To constitute an organised crime syndicate, the continuing unlawful activity must be undertaken by a group within the preceding:',
        opts: ['5 years with at least one chargesheet filed', '10 years with more than one chargesheet filed before competent court', '3 years with conviction', '7 years with pending trials'],
        ans: 1,
        exp: 'Section 111(1) defines continuing unlawful activity as an activity undertaken by a group within the preceding period of 10 years and in respect of which more than one chargesheet has been filed before a competent court.',
      },
      {
        sec: 'Section 113',
        topic: 'Terrorist Act',
        q: 'Which section of BNS 2023 incorporates the offence of a "Terrorist Act" into the general penal code?',
        opts: ['Section 109', 'Section 111', 'Section 113', 'Section 124'],
        ans: 2,
        exp: 'Section 113 BNS 2023 defines and penalises a Terrorist Act, mirroring provisions from UAPA into the general criminal statute.',
      },
      {
        sec: 'Section 152',
        topic: 'Sovereignty and Integrity',
        q: 'Section 152 of BNS 2023 replaces the colonial sedition provision (Section 124A IPC). It penalises acts endangering:',
        opts: ['The Government established by law', 'Sovereignty, unity and integrity of India', 'Public tranquility exclusively', 'Electoral legitimacy'],
        ans: 1,
        exp: 'Section 152 BNS explicitly discards the term "sedition" and focuses on acts endangering sovereignty, unity, and integrity of India.',
      },
      {
        sec: 'Section 303',
        topic: 'Theft',
        q: 'Section 303 of BNS 2023 corresponds to theft. Section 303(2) adds a community service penalty for first-time offenders where the stolen property value is less than:',
        opts: ['Rs. 1,000', 'Rs. 5,000', 'Rs. 10,000', 'Rs. 2,000'],
        ans: 1,
        exp: 'Under the proviso to Section 303(2) BNS, where value of stolen property is less than Rs. 5,000 and the person is convicted for first time, the court may award community service.',
      },
      {
        sec: 'Section 4',
        topic: 'Punishments',
        q: 'Which new form of punishment was introduced under Section 4 of BNS 2023 alongside fine, forfeiture, and imprisonment?',
        opts: ['Solitary confinement beyond 3 months', 'Community Service', 'Exile from district', 'Public censure'],
        ans: 1,
        exp: 'Section 4(f) BNS 2023 introduces "Community Service" as a substantive form of penal punishment for minor offences.',
      },
    ],
  },
  // 3. BNSS 2023
  {
    actName: 'Bhartiya Nagarik Suraksha Sanhita, 2023',
    subject: 'Criminal Procedure',
    prefix: 'BNSS',
    items: [
      {
        sec: 'Section 35',
        topic: 'Notice of Appearance',
        q: 'Section 35 of BNSS 2023 replaces Section 41A of the CrPC, mandating notice of appearance before a police officer for offences punishable with imprisonment up to:',
        opts: ['3 years', '7 years', '10 years', '5 years'],
        ans: 1,
        exp: 'Section 35 BNSS replaces Section 41A CrPC. For offences punishable with imprisonment up to 7 years, arrest is not automatic and notice of appearance is mandatory.',
        cases: ['Arnesh Kumar v. State of Bihar (2014)'],
      },
      {
        sec: 'Section 173',
        topic: 'First Information Report (FIR)',
        q: 'Under Section 173(1) of BNSS 2023, preliminary enquiry prior to registration of an FIR for offences punishable with 3 to 7 years imprisonment must be conducted within:',
        opts: ['7 days', '14 days', '21 days', '30 days'],
        ans: 1,
        exp: 'Section 173(3) BNSS allows a preliminary enquiry with prior permission of an officer not below Deputy SP within 14 days before registering an FIR in offences punishable with 3 to 7 years.',
      },
      {
        sec: 'Section 187',
        topic: 'Police Custody',
        q: 'Under Section 187(3) of BNSS 2023 (replacing Section 167 CrPC), police custody can be granted for a maximum of 15 days in whole or in parts during the initial period of:',
        opts: ['15 days only', '40 days or 60 days of the total detention period', '30 days only', 'The entire trial duration'],
        ans: 1,
        exp: 'Section 187(3) BNSS clarifies that the 15-day police custody can be granted in parts throughout the initial 40 days (for 60-day cases) or 60 days (for 90-day cases).',
      },
      {
        sec: 'Section 479',
        topic: 'Maximum Detention for Undertrials',
        q: 'Under Section 479(1) of BNSS 2023 (replacing Section 436A CrPC), a first-time offender who has not been previously convicted of any offence shall be released on bond if he has undergone detention for:',
        opts: ['One-half of the maximum imprisonment', 'One-third of the maximum imprisonment', 'One-fourth of the maximum imprisonment', 'Two-thirds of the maximum imprisonment'],
        ans: 1,
        exp: 'Proviso to Section 479(1) BNSS provides relief to first-time undertrials upon completing one-third of the maximum period of imprisonment specified for that offence.',
      },
      {
        sec: 'Section 528',
        topic: 'Inherent Powers of High Court',
        q: 'Which section of BNSS 2023 corresponds to the inherent powers of the High Court formerly codified under Section 482 CrPC?',
        opts: ['Section 482 BNSS', 'Section 500 BNSS', 'Section 528 BNSS', 'Section 540 BNSS'],
        ans: 2,
        exp: 'Section 528 BNSS 2023 embodies the inherent powers of the High Court to make orders necessary to give effect to any order under the Sanhita or prevent abuse of process.',
      },
      {
        sec: 'Section 530',
        topic: 'Electronic Proceedings',
        q: 'Section 530 of BNSS 2023 provides that all trials, inquiries and proceedings under the Sanhita may be held in:',
        opts: ['Electronic mode including video conferencing', 'Physical open court only', 'Chambers of the Magistrate only', 'Police station with videography'],
        ans: 0,
        exp: 'Section 530 BNSS mandates that all trials, inquiries, and proceedings, including examination of complainants, witnesses, and accused, may be conducted electronically.',
      },
    ],
  },
  // 4. BSA 2023
  {
    actName: 'Bhartiya Sakshya Adhiniyam, 2023',
    subject: 'Law of Evidence',
    prefix: 'BSA',
    items: [
      {
        sec: 'Section 61',
        topic: 'Admissibility of Electronic Records',
        q: 'Under Bhartiya Sakshya Adhiniyam, 2023, electronic or digital records are made admissible and given equal standing with documents under which section?',
        opts: ['Section 65B', 'Section 61', 'Section 63', 'Section 72'],
        ans: 1,
        exp: 'Section 61 BSA 2023 states that nothing in this Adhiniyam shall apply to deny admissibility of an electronic record in evidence on sole ground that it is an electronic or digital record.',
      },
      {
        sec: 'Section 63',
        topic: 'Electronic Record Certificate',
        q: 'Section 63 of BSA 2023 corresponds to Section 65B of the repealed Indian Evidence Act regarding certification of electronic records. The certificate must be signed by:',
        opts: ['The investigating officer only', 'A person occupying a responsible official position in relation to operation of device or expert', 'The Judicial Magistrate of first class', 'The Telecom Service Provider nodal officer exclusively'],
        ans: 1,
        exp: 'Section 63(4) BSA requires a certificate signed by a person in official management of the device or an authorized expert.',
      },
      {
        sec: 'Section 23',
        topic: 'Confessions to Police',
        q: 'Section 23(1) of BSA 2023 provides that no confession made to a police officer shall be proved as against a person accused of any offence. This corresponds to which section of the Indian Evidence Act, 1872?',
        opts: ['Section 24 IEA', 'Section 25 IEA', 'Section 26 IEA', 'Section 27 IEA'],
        ans: 1,
        exp: 'Section 23(1) BSA corresponds to Section 25 IEA (Confession to police officer not to be proved). Section 23(2) corresponds to Section 27 IEA discovery statement.',
      },
      {
        sec: 'Section 39',
        topic: 'Opinions of Experts',
        q: 'Section 39 of BSA 2023 deals with opinions of experts. In which field does BSA 2023 specifically add explicit statutory recognition for expert testimony?',
        opts: ['Foreign exchange algorithms', 'Cyber forensics / digital evidence', 'Aviation meteorology', 'Handwriting analysis only'],
        ans: 1,
        exp: 'Section 39 BSA modernises expert evidence by expressly including examiner of electronic evidence (Section 79A IT Act).',
      },
    ],
  },
  // 5. Constitution
  {
    actName: 'Constitution of India (Articles 1 to 395)',
    subject: 'Constitutional Law',
    prefix: 'CONST',
    items: [
      {
        sec: 'Article 12',
        topic: 'Definition of State',
        q: 'In which landmark case did the Supreme Court lay down the six-point functional, structural, and financial test to determine whether an authority is "State" under Article 12?',
        opts: ['Sukhdev Singh v. Bhagatram', 'Ajay Hasia v. Khalid Mujib (1981)', 'Zee Telefilms Ltd. v. UOI (2005)', 'Pradeep Kumar Biswas v. Indian Institute of Chemical Biology (2002)'],
        ans: 1,
        exp: 'In Ajay Hasia (1981) 1 SCC 722, Justice P.N. Bhagwati formulated the comprehensive 6-factor test governing corporations as instrumentalities of State under Article 12.',
        cases: ['Ajay Hasia v. Khalid Mujib (1981)'],
      },
      {
        sec: 'Article 21',
        topic: 'Protection of Life and Personal Liberty',
        q: 'In Maneka Gandhi v. Union of India (AIR 1978 SC 597), the Supreme Court interpreted "procedure established by law" under Article 21 to mean procedure that is:',
        opts: ['Strictly codified by Parliament', 'Just, fair and reasonable, incorporating substantive due process principles', 'Tested against custom and usage', 'Approved by the Law Commission of India'],
        ans: 1,
        exp: 'Maneka Gandhi overruled the literal interpretation of AK Gopalan (1950) and established that procedure depriving life or liberty must be just, fair, and reasonable, weaving the Golden Triangle of Articles 14, 19, and 21.',
        cases: ['Maneka Gandhi v. Union of India (1978)', 'AK Gopalan v. State of Madras (1950)'],
      },
      {
        sec: 'Article 32',
        topic: 'Constitutional Remedies',
        q: 'Which writ is known as the "Bulwark of Individual Liberty" and is issued against illegal or wrongful detention without legal justification?',
        opts: ['Quo Warranto', 'Habeas Corpus', 'Certiorari', 'Prohibition'],
        ans: 1,
        exp: 'Habeas Corpus literally means "to have the body". It is the fundamental writ safeguarding liberty against arbitrary executive detention.',
        cases: ['ADM Jabalpur v. Shivkant Shukla (1976)', 'KS Puttaswamy v. UOI (2017)'],
      },
      {
        sec: 'Article 368',
        topic: 'Amendment of Constitution',
        q: 'The doctrine of Basic Structure limiting Parliament\'s amending power under Article 368 was propounded in:',
        opts: ['Sankari Prasad v. UOI (1951)', 'Sajjan Singh v. State of Rajasthan (1965)', 'Golak Nath v. State of Punjab (1967)', 'Kesavananda Bharati v. State of Kerala (1973)'],
        ans: 3,
        exp: 'By a 7:6 majority in Kesavananda Bharati (1973) 4 SCC 225, the 13-Judge Constitutional Bench ruled that Parliament cannot alter the Basic Structure of the Constitution.',
        cases: ['Kesavananda Bharati v. State of Kerala (1973)', 'Minerva Mills v. UOI (1980)'],
      },
    ],
  },
  // 6. TPA 1882
  {
    actName: 'Transfer of Property Act, 1882',
    subject: 'Property Law',
    prefix: 'TPA',
    items: [
      {
        sec: 'Section 52',
        topic: 'Doctrine of Lis Pendens',
        q: 'The doctrine of lis pendens under Section 52 of the Transfer of Property Act, 1882 is based on the maxim:',
        opts: ['Nemo dat quod non habet', 'Ut lite pendente nihil innovetur', 'Qui prior est tempore potior est jure', 'Actio personalis moritur cum persona'],
        ans: 1,
        exp: 'Section 52 is based on the maxim "Ut lite pendente nihil innovetur" (During litigation, nothing new should be introduced), rooted in Bellamy v. Sabine (1857).',
        cases: ['Bellamy v. Sabine (1857)', 'Dev Raj Dogra v. Gyan Chand Jain (1981)'],
      },
      {
        sec: 'Section 53A',
        topic: 'Part Performance',
        q: 'The doctrine of part performance under Section 53A of TPA acts as a:',
        opts: ['Sword to claim title', 'Shield to defend possession only', 'Basis for compulsory registration', 'Ground for mesne profits'],
        ans: 1,
        exp: 'Section 53A confers a passive equity or a "shield" to protect possession against the transferor. It does not confer active title or ownership ("sword").',
        cases: ['Probodh Kumar Das v. Dantmara Tea Co. (1940)'],
      },
      {
        sec: 'Section 54',
        topic: 'Sale of Immovable Property',
        q: 'Under Section 54 of the Transfer of Property Act, 1882, a contract for sale of immovable property:',
        opts: ['Creates an interest or charge in the property in favour of the buyer', 'Does not, of itself, create any interest in or charge on such property', 'Vests equitable title in the buyer', 'Passes ownership automatically upon payment of earnest money'],
        ans: 1,
        exp: 'Section 54 explicitly states: "A contract for the sale of immovable property... does not, of itself, create any interest in or charge on such property."',
        cases: ['Suraj Lamp & Industries v. State of Haryana (2012)'],
      },
      {
        sec: 'Section 58',
        topic: 'Mortgages',
        q: 'In which type of mortgage does the mortgagor bind himself personally to pay the mortgage-money and agree that the property shall be sold in default of payment?',
        opts: ['Usufructuary Mortgage', 'Mortgage by Conditional Sale', 'Simple Mortgage', 'Anomalous Mortgage'],
        ans: 2,
        exp: 'Section 58(b) defines a Simple Mortgage where the mortgagor personally binds himself to repay and agrees to a decree for sale in default without delivering possession.',
      },
    ],
  },
];

export const seedMockExamData = async () => {
  try {
    await connectDB();
    console.log('⚡ Connected to MongoDB for seeding Mock Exam & Question Bank...');

    // 1. Generate 360+ MCQs across the 6 Core Acts (60 per act)
    let totalQuestionsInserted = 0;
    const allQuestionIds: mongoose.Types.ObjectId[] = [];

    for (const spec of BARE_ACT_SPECS) {
      console.log(`\n📚 Seeding Question Bank for: ${spec.actName}...`);
      const targetCount = 60; // 60 questions per act = 360 total questions

      for (let i = 1; i <= targetCount; i++) {
        const template = spec.items[(i - 1) % spec.items.length]!;
        const code = `MCQ-${spec.prefix}-${String(i).padStart(3, '0')}`;

        // Vary question text slightly for multiple repetitions
        const variationSuffix = i > spec.items.length ? ` [Set #${Math.ceil(i / spec.items.length)} Drill]` : '';
        const questionText = `${template.q}${variationSuffix}`;

        const questionDoc = await McqQuestion.findOneAndUpdate(
          { code },
          {
            $set: {
              code,
              subject: spec.subject,
              actName: spec.actName,
              sectionOrArticle: template.sec,
              chapterOrPart: template.topic,
              questionText,
              options: template.opts,
              correctOptionIndex: template.ans,
              explanation: template.exp,
              landmarkCases: template.cases || [],
              difficulty: template.diff || (i % 3 === 0 ? 'hard' : i % 2 === 0 ? 'medium' : 'easy'),
              format: template.format || 'bare_act_textual',
              targetExams: ['Delhi Judicial Service (DJS)', 'UP PCS-J', 'Haryana PCS-J'],
              isActive: true,
              isSeeded: true,
              datasetTag: 'development_fixtures_v1',
            },
          },
          { upsert: true, new: true }
        );

        allQuestionIds.push(questionDoc._id);
        totalQuestionsInserted++;
      }
      console.log(`  ✅ 60 questions synced for ${spec.actName}`);
    }

    console.log(`\n🎉 Total MCQs in Question Bank: ${totalQuestionsInserted}`);

    // 2. Seed 3 Full-Length Mock Tests
    console.log('\n🏆 Seeding Full-Length Prelims Mock Tests...');

    // Find demo student for association if needed
    const student = await User.findOne({ email: 'rohit.verma@rajinderlawacademy.com' });

    const MOCKS = [
      {
        testCode: 'RLA-DJS-PRELIMS-04',
        title: 'Delhi Judiciary (DJS) Full Mock 04',
        syllabus: 'Full Syllabus: CPC, CrPC/BNSS, BNS, Evidence, Constitution, Commercial Courts',
        questionsCount: 200,
        durationMinutes: 150,
        maxScore: 200,
        marksPerCorrect: 1.0,
        negativeMarkWeight: 0.25,
        targetState: 'Delhi (DJS)',
        targetExam: 'Delhi Judicial Service (DJS)',
        status: 'Live Now' as const,
        questions: allQuestionIds.slice(0, 200),
      },
      {
        testCode: 'RLA-UP-PCSJ-03',
        title: 'UP PCS-J Law Paper Mock 03',
        syllabus: 'Substantive & Procedural Law: IPC, CrPC, CPC, TPA, Contract, Partnership',
        questionsCount: 150,
        durationMinutes: 120,
        maxScore: 150,
        marksPerCorrect: 1.0,
        negativeMarkWeight: 0.33,
        targetState: 'Uttar Pradesh',
        targetExam: 'UP PCS-J Examination',
        status: 'Scheduled' as const,
        questions: allQuestionIds.slice(60, 210),
      },
      {
        testCode: 'RLA-BNS-MASTER-01',
        title: 'Bhartiya Nyaya Sanhita (BNS) Master Mock',
        syllabus: '100 MCQs strictly focused on new BNS provisions and repealed IPC sections',
        questionsCount: 100,
        durationMinutes: 90,
        maxScore: 100,
        marksPerCorrect: 1.0,
        negativeMarkWeight: 0.25,
        targetState: 'All-India',
        targetExam: 'All-India Judicial Services',
        status: 'Live Now' as const,
        questions: allQuestionIds.slice(120, 220),
      },
    ];

    for (const mockData of MOCKS) {
      await MockTest.findOneAndUpdate(
        { testCode: mockData.testCode },
        {
          $set: {
            ...mockData,
            isPublished: true,
            isSeeded: true,
            createdBy: student?._id,
          },
        },
        { upsert: true, new: true }
      );
      console.log(`  📝 [${mockData.testCode}] ${mockData.title} (${mockData.questionsCount} Qs / ${mockData.durationMinutes} Mins)`);
    }

    console.log('\n🎉 Successfully seeded complete Mock Test & Question Bank ecosystem!');
  } catch (err: any) {
    console.error('❌ Error seeding mock exam data:', err);
    throw err;
  } finally {
    await disconnectDB();
  }
};

// Standalone execution
if (process.argv[1]?.endsWith('seedMockExamData.ts')) {
  seedMockExamData()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

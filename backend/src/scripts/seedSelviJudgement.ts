import mongoose from 'mongoose';
import connectDB, { disconnectDB } from '../config/db.js';
import JudgementDigest from '../models/judgementDigest.model.js';
import User from '../models/user.model.js';
import { getCurrentDateIST } from '../controllers/judgement.controller.js';

export const seedSelviJudgement = async (): Promise<void> => {
  try {
    await connectDB();
    console.log('Seeding Selvi & Ors. v. State of Karnataka as Landmark Judgment of the Day...');

    let admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      admin = await User.findOne({});
    }
    if (!admin) {
      console.warn('⚠️ No user found to assign as uploadedBy.');
      return;
    }

    const todayIST = getCurrentDateIST();

    // Check if already seeded
    let existing = await JudgementDigest.findOne({
      title: 'Selvi & Ors. v. State of Karnataka',
    });

    const caseData = {
      title: 'Selvi & Ors. v. State of Karnataka',
      citation: '(2010) 7 SCC 263',
      court: 'Supreme Court of India' as const,
      bench: '3-Judge Bench (C.J. K.G. Balakrishnan, R.V. Raveendran & J.M. Panchal, JJ.)',
      benchStrength: '3-Judge Bench',
      judges: ['K.G. Balakrishnan, C.J.', 'R.V. Raveendran, J.', 'J.M. Panchal, J.'],
      dateOfJudgement: new Date('2010-05-05'),
      year: 2010,
      subject: 'Constitutional Criminal Jurisprudence',
      category: 'Constitutional Criminal Jurisprudence',
      summary:
        'Historic 3-Judge Bench ruling of the Supreme Court of India establishing that compulsory administration of neuro-scientific investigation techniques like Narco-Analysis, Polygraph examination, and Brain Electrical Activation Profile (BEAP) without voluntary consent violates the right against forced self-incrimination under Article 20(3) and infringes personal liberty and mental privacy under Article 21.',
      keyHoldings: [
        {
          title: 'Article 20(3) Violation:',
          text: 'Involuntary administration of Narco-Analysis, Polygraph (Lie-Detector), and BEAP tests violates the right against forced self-incrimination.',
        },
        {
          title: 'Article 21 & Privacy:',
          text: 'Compelling an individual to undergo intrusive psychological interrogation is an invasion of mental privacy and bodily autonomy.',
        },
      ],
      legalProvisions: [
        'Art. 20(3)',
        'Sec 161 CrPC / Sec 175 BNSS',
        'Sec 27 IEA / Sec 23 BSA',
        'Article 21',
      ],
      provisions: [
        {
          label: 'Art. 20(3)',
          actOrCode: 'Constitution of India',
          badgeColor: 'amber' as const,
        },
        {
          label: 'Sec 161 CrPC / Sec 175 BNSS',
          actOrCode: 'Code of Criminal Procedure / BNSS',
          badgeColor: 'blue' as const,
        },
        {
          label: 'Sec 27 IEA / Sec 23 BSA',
          actOrCode: 'Indian Evidence Act / BSA',
          badgeColor: 'emerald' as const,
        },
      ],
      ratioDecidendi: [
        'Involuntary administration of narco-analysis, polygraph, and BEAP tests amounts to testimonial compulsion and violates Article 20(3).',
        'Intrusive psychological interrogation without consent infringes mental privacy and bodily autonomy under Article 21.',
        'Subsequent physical discoveries made on the basis of voluntary neuro-tests can be admitted under Section 27 IEA / Section 23 BSA, but the test statements themselves remain strictly inadmissible.',
      ],
      fullAnalysis: `### **Selvi & Ors. v. State of Karnataka (2010) 7 SCC 263**

#### **1. Background & Legal Controversy**
The legality of invasive neuro-scientific investigative tools—namely **Narco-Analysis** (involving Sodium Pentothal), **Polygraph Examination** (Lie-Detector), and **Brain Electrical Activation Profile (BEAP / P300 Brain Mapping)**—was challenged as violative of constitutional safeguards under **Article 20(3)** (Right against self-incrimination) and **Article 21** (Right to life, bodily autonomy, and mental privacy).

#### **2. Key Constitutional Questions Framed**
1. Does the involuntary administration of neuro-investigative techniques amount to "testimonial compulsion" under Article 20(3)?
2. Does subjecting an accused or witness to intrusive psychological evaluation violate bodily autonomy and privacy guaranteed under Article 21?
3. Can evidence or physical facts discovered pursuant to involuntary neuro-tests be admitted under Section 27 of the Indian Evidence Act (now Section 23 of Bhartiya Sakshya Adhiniyam, 2023)?

#### **3. Landmark Holding & Ratio Decidendi**
- **Testimonial Compulsion under Art. 20(3):** The Supreme Court held that the right against forced self-incrimination applies at all stages of criminal proceedings, including police interrogation under Section 161 CrPC (Section 175 BNSS). Compulsory administration of psychological tests extracts information from an individual's subconscious mind, amounting to forced testimony.
- **Mental Privacy & Art. 21:** The Court recognized that personal liberty under Article 21 encompasses "mental privacy", cognitive freedom, and bodily integrity. Intrusive chemical or electrical probing of the human psyche without voluntary consent constitutes cruel, inhuman, and degrading treatment.
- **Section 27 IEA / Section 23 BSA Scope:** If tests are administered *voluntarily* after strict compliance with NHRC guidelines, any purely physical fact/material discovery recovered in consequence can be admitted under Section 27 IEA / Section 23 BSA. However, the test results and answers themselves cannot be used as substantive evidence.

#### **4. Guidelines Prescribed by Supreme Court**
The Court mandated strict compliance with the **National Human Rights Commission (NHRC) Guidelines (2000)** for Lie-Detector tests:
1. Consent must be recorded before a Judicial Magistrate.
2. The subject must be informed of the medical and legal consequences of the test.
3. Full legal representation and access to counsel must be provided during test proceedings.

#### **5. Mains Examination Utility (PCS-J & Higher Judiciary)**
- **Criminal Procedure:** Crucial precedent for questions discussing police interrogation powers under Section 161 CrPC / Section 175 BNSS and the extent of magistrate authorization.
- **Law of Evidence:** Directly applicable to evidentiary admissibility of discovery evidence under Section 27 IEA / Section 23 BSA.
- **Constitutional Law:** Classic authority on the evolution of mental privacy, substantive due process under Article 21, and the Golden Triangle doctrine.`,
      sourceReference: 'SCC (2010) 7 SCC 263 | Bench of Honble C.J. K.G. Balakrishnan',
      mainsUtility:
        'Indispensable authority for Section 161 CrPC / 175 BNSS police interrogations, Section 27 IEA / 23 BSA discovery evidence, and Article 20(3) testimonial compulsion questions.',
      overruledPrecedents:
        'Overruled judgments of various High Courts that permitted involuntary lie-detection in heinous crimes.',
      tags: [
        'Narco Analysis',
        'Article 20(3)',
        'Article 21',
        'Mental Privacy',
        'Self-Incrimination',
        'Section 27 Evidence Act',
        'BEAP Test',
      ],
      importance: 'Landmark' as const,
      status: 'published' as const,
      dailyDateIST: todayIST,
      isDailyFeatured: true,
      priority: 10,
      isPublished: true,
      publishedAt: new Date(),
      isFeatured: true,
      downloadCount: 84,
      viewCount: 420,
      bookmarkCount: 15,
      relatedCases: [
        {
          title: 'State of Bombay v. Kathi Kalu Oghad',
          citation: 'AIR 1961 SC 1808',
          relationship: 'Distinguished' as const,
        },
        {
          title: 'K.S. Puttaswamy v. Union of India',
          citation: '(2017) 10 SCC 1',
          relationship: 'Followed' as const,
        },
      ],
      examRelevance: {
        prelimsFactoids: [
          'Decided by 3-Judge Bench led by Chief Justice K.G. Balakrishnan.',
          'Held Narco-analysis and Polygraph unconstitutional without voluntary consent.',
          'Recognized mental privacy under Article 21 before Puttaswamy judgment.',
        ],
        mainsPerspective:
          'Emphasize the reconciliation of police investigative necessity with Article 20(3) protections and the strict conditions for admitting Section 27 discovery evidence.',
        pyqReferences: [
          'Delhi Judicial Services (DJS) Mains 2018 - Criminal Law',
          'UP PCS-J Mains 2022 - Constitutional & Evidence Law',
          'Haryana Judicial Services 2021 - Evidence Paper',
        ],
      },
      overruledStatus: {
        status: 'Good Law',
        byCase: 'Affirmed and expanded in K.S. Puttaswamy (2017)',
      },
      uploadedBy: admin._id,
    };

    if (existing) {
      Object.assign(existing, caseData);
      await existing.save();
      console.log(`✅ Successfully updated Selvi & Ors. (ID: ${existing._id}) as Landmark Judgment of the Day for ${todayIST}!`);
    } else {
      const created = await JudgementDigest.create(caseData);
      console.log(`✅ Successfully created Selvi & Ors. (ID: ${created._id}) as Landmark Judgment of the Day for ${todayIST}!`);
    }
  } catch (err: any) {
    console.error('❌ Failed to seed Selvi Judgement:', err.message);
  } finally {
    await disconnectDB();
  }
};

if (process.argv[1]?.endsWith('seedSelviJudgement.ts')) {
  seedSelviJudgement().then(() => process.exit(0));
}

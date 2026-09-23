import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { DailyLegalDigestEdition } from '../models/dailyDigest.model.js';
import User from '../models/user.model.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rla_crm';

const getCurrentDateIST = (): string => {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
};

async function seedDailyDigest() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected successfully.');

    const todayIST = getCurrentDateIST();
    console.log(`Current IST Date: ${todayIST}`);

    const adminUser = await User.findOne({ role: 'admin' });

    const items = [
      {
        itemId: 'item-sc-482',
        contentType: 'Supreme Court Ruling' as const,
        categoryBadge: 'SUPREME COURT RULING',
        badgeColor: 'amber' as const,
        subject: 'Criminal Procedure',
        title: 'Section 482 CrPC Power Cannot Be Exercised Mechanically To Stifle Legitimate Prosecution',
        citation: '2025 INSC 142 • 3-Judge Bench (CJI Bench)',
        bench: '3-Judge Bench (CJI Bench)',
        court: 'Supreme Court of India',
        date: '12 Sep 2025',
        summary:
          'The Apex Court held that while the High Court has inherent powers to prevent abuse of the process of law, such powers must be exercised ex debito justitiae and not to hold a mini-trial at the threshold of framing charges.',
        examinationTip:
          'Vital for Mains Criminal Procedure answer on quashing of FIRs under BNSS 528 / CrPC 482.',
        legalProvisions: [
          { sectionOrArticle: 'Section 482 CrPC', actOrCode: 'Code of Criminal Procedure, 1973' },
          { sectionOrArticle: 'Section 528 BNSS', actOrCode: 'Bharatiya Nagarik Suraksha Sanhita, 2023' },
        ],
        tags: ['Quashing', 'Section 482', 'Inherent Powers', 'Mini-trial', 'BNSS 528'],
        order: 1,
      },
      {
        itemId: 'item-maxim-nemo',
        contentType: 'Legal Maxim' as const,
        categoryBadge: 'LEGAL MAXIM',
        badgeColor: 'amber' as const,
        subject: 'Constitutional Law',
        title: 'Nemo debet bis vexari pro una et eadem causa',
        citation: 'Constitutional Common Law Principle',
        bench: '',
        court: '',
        date: '12 Sep 2025',
        summary:
          'No man should be twice harassed for one and the same cause. Corresponds directly with Section 300 of the CrPC, Section 337 BNSS, and Article 20(2) of the Indian Constitution.',
        examinationTip:
          'Distinguish between Double Jeopardy (criminal conviction) and departmental inquiry proceedings.',
        legalProvisions: [
          { sectionOrArticle: 'Article 20(2)', actOrCode: 'Constitution of India, 1950' },
          { sectionOrArticle: 'Section 300 CrPC', actOrCode: 'CrPC 1973' },
          { sectionOrArticle: 'Section 337 BNSS', actOrCode: 'BNSS 2023' },
        ],
        tags: ['Double Jeopardy', 'Article 20(2)', 'Autrefois Acquit', 'Autrefois Convict'],
        order: 2,
      },
      {
        itemId: 'item-amend-bns111',
        contentType: 'Legislative Amendment' as const,
        categoryBadge: 'LEGISLATIVE AMENDMENT',
        badgeColor: 'amber' as const,
        subject: 'Bhartiya Nyaya Sanhita (BNS)',
        title: 'Key Differences: Organised Crime in BNS (Section 111) vs State Anti-Gangster Acts',
        citation: 'Act No. 45 of 2023',
        bench: '',
        court: '',
        date: '11 Sep 2025',
        summary:
          'Analysis of Section 111 Bhartiya Nyaya Sanhita which introduces a standalone penal provision for continuing unlawful activity by syndicates without needing state sanction pre-requisites.',
        examinationTip:
          'Expected 10-marker in upcoming DJS / UP Mains examination.',
        legalProvisions: [
          { sectionOrArticle: 'Section 111 BNS', actOrCode: 'Bharatiya Nyaya Sanhita, 2023' },
          { sectionOrArticle: 'Section 3 MCOCA', actOrCode: 'State Anti-Gangster Precedents' },
        ],
        tags: ['Organised Crime', 'Section 111 BNS', 'Syndicate', 'Continuing Unlawful Activity'],
        order: 3,
      },
    ];

    const featuredMaxim = {
      latinText: '"Actus non facit reum, nisi mens sit rea"',
      englishMeaning:
        'An act does not make a person guilty unless the mind is also guilty.',
      jurisprudenceContext:
        'Fundamental principle of penal jurisprudence embodied under BNS General Exceptions and Section 21 of BNS.',
      relevantProvisions: ['Section 21 BNS', 'Section 84 IPC', 'BNS General Exceptions'],
      subject: 'Penal Jurisprudence',
    };

    // Upsert edition for today
    const edition = await DailyLegalDigestEdition.findOneAndUpdate(
      { editionDateIST: todayIST },
      {
        editionDateIST: todayIST,
        editionNumber: 142,
        title: 'Daily Legal Digest & Case Law Brief',
        subtitle:
          'Stay ahead with daily judgments, Bare Act comparative pointers, and Latin maxims.',
        curatedBy: 'Curated Daily by Faculty Wing',
        featuredMaxim,
        items,
        status: 'published',
        isPublished: true,
        publishedAt: new Date(),
        author: adminUser?._id,
        authorName: 'Adv. Rajinder Sir',
      },
      { upsert: true, new: true }
    );

    console.log(`✅ Daily Legal Digest seeded successfully for ${todayIST}! Edition ID: ${edition._id}`);
  } catch (err) {
    console.error('Failed to seed Daily Legal Digest:', err);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected.');
  }
}

seedDailyDigest();

import mongoose from 'mongoose';
import connectDB, { disconnectDB } from '../config/db.js';
import MainsQuestion from '../models/mainsQuestion.model.js';
import User from '../models/user.model.js';

async function seedChallenge48() {
  try {
    await connectDB();
    console.log('Seeding Today\'s Mains Challenge #48 matching reference UI...');

    let admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      admin = await User.findOne();
    }

    if (!admin) {
      console.log('No user found to assign as creator.');
      return;
    }

    // Deactivate previous active questions
    await MainsQuestion.updateMany({ isActive: true }, { $set: { isActive: false } });

    // Cutoff deadline: tonight at 11:59 PM
    const dl = new Date();
    dl.setHours(23, 59, 59, 999);

    const q = await MainsQuestion.findOneAndUpdate(
      { challengeNumber: 48 },
      {
        challengeNumber: 48,
        questionCode: 'DAW-2026-048',
        paper: 'Criminal Law & Procedure (Mains)',
        subject: 'Indian Evidence Act / BSA 2023',
        targetExam: 'All-India Judicial Services',
        title: 'Discuss the evidentiary admissibility of a statement leading to the discovery of a fact under Section 27 of the Indian Evidence Act, 1872 (now Section 23 of the Bharatiya Sakshya Adhiniyam, 2023). In light of landmark Supreme Court jurisprudence, examine whether Section 27 violates the fundamental right against self-incrimination guaranteed under Article 20(3) of the Constitution.',
        marks: 15,
        wordLimit: 250,
        turnaroundHours: 24,
        evaluatorName: 'Adv. Rajinder Sir',
        challengeDate: new Date(),
        submissionDeadline: dl,
        guidelines: [
          'Conceptual distinction between information and confession under Section 27 IEA / Section 23 BSA',
          'Constitution Bench precedent: State of Bombay v. Kathi Kalu Oghad (1961)',
          'Privilege against self-incrimination under Article 20(3): "compelled testimony" vs physical discovery',
          'Contemporary doctrine: Selvi v. State of Karnataka (2010) on involuntary disclosures',
          'Modern perspective under Bharatiya Sakshya Adhiniyam, 2023',
        ],
        modelAnswer: 'Section 27 of the Indian Evidence Act, 1872 (analogous to Section 23 of Bharatiya Sakshya Adhiniyam, 2023) embodies the doctrine of confirmation by subsequent facts. In Pulukuri Kottaya v. Emperor (1947), the Privy Council established that only so much of the information as relates distinctly to the fact thereby discovered is admissible, not the confession of guilt.\n\nIn State of Bombay v. Kathi Kalu Oghad (AIR 1961 SC 1808), an eleven-judge Constitution Bench settled the constitutional validity of Section 27 vis-à-vis Article 20(3). The Court ruled that "to be a witness against oneself" requires compelled testimony conveying personal knowledge. The mere physical recovery of an incriminating object (weapon, stolen property) based on information provided by the accused does not constitute testimonial compulsion, provided no physical or psychological duress was applied.\n\nThis position was reinforced in Selvi v. State of Karnataka (2010), where the Supreme Court held that while involuntary narco-analysis or polygraph results violate Article 20(3), voluntary statements leading to physical discovery remain valid under Section 27.',
        isModelAnswerPublished: true,
        status: 'active',
        isActive: true,
        createdBy: admin._id,
      },
      { upsert: true, new: true }
    );

    console.log(`✅ Successfully seeded Challenge #${q.challengeNumber} (${q.questionCode}) as Active!`);
  } catch (err) {
    console.error('Failed to seed Challenge #48:', err);
  } finally {
    await disconnectDB();
  }
}

seedChallenge48();

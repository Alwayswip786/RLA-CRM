import mongoose from 'mongoose';
import User from '../models/user.model.js';
import DoubtQuery from '../models/doubtQuery.model.js';
import ChatConversation from '../models/chatConversation.model.js';
import ChatMessage from '../models/chatMessage.model.js';
import connectDB, { disconnectDB } from '../config/db.js';

export const seedInitialDoubts = async (): Promise<void> => {
  try {
    const student1 = await User.findOne({ email: 'rohit.verma@rajinderlawacademy.com' });
    const student2 = await User.findOne({ email: 'pooja.deshmukh@rajinderlawacademy.com' });
    const director = await User.findOne({ email: 'director@rajinderlawacademy.com' });
    const faculty = await User.findOne({ email: 'faculty@rajinderlawacademy.com' });

    if (!student1 || !student2 || !director || !faculty) {
      console.warn('⚠️ Cannot seed doubts: One or more seed users not found.');
      return;
    }

    // 1. Seed Doubt Queries (if not already seeded with rich entries)
    const existingCount = await DoubtQuery.countDocuments();
    if (existingCount < 5) {
      console.log('🌱 Seeding rich academic doubt queries into cluster...');

      const sampleQueries = [
        {
          queryNumber: 'RLA-DBT-2026-001',
          student: student1._id,
          studentName: student1.name,
          rollNo: student1.rollNo,
          subject: 'Code of Civil Procedure',
          bareActSection: 'Section 11 (Res Judicata)',
          title: 'Application of Res Judicata between co-defendants where no relief was claimed inter-se',
          initialQuestion:
            'Sir, does Res Judicata apply between co-defendants if no relief was claimed by one against the other in the former suit?',
          category: 'Bare Act Interpretation' as const,
          priority: 'normal' as const,
          status: 'resolved' as const,
          assignedFaculty: director._id,
          assignedFacultyName: director.name,
          resolvedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
          escalatedToLiveChat: false,
          tags: ['CPC', 'Section 11', 'Res Judicata', 'Co-defendants'],
          thread: [
            {
              senderId: student1._id,
              senderRole: 'student' as const,
              senderName: student1.name,
              senderSalutation: student1.salutation || 'Adv.',
              message:
                'Sir, does Res Judicata apply between co-defendants if no relief was claimed by one against the other in the former suit?',
              createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
            },
            {
              senderId: director._id,
              senderRole: 'admin' as const,
              senderName: director.name,
              senderSalutation: director.salutation || 'Adv.',
              message:
                'No Rohit. As authoritatively held in Mahboob Sahab v. Syed Ismail (1995 SC), for res judicata to apply between co-defendants, there must be:\n1. A conflict of interest between the co-defendants;\n2. It must be necessary to decide this conflict in order to give the plaintiff the relief claimed; and\n3. The question must have been actually and finally decided.\n\nIf the co-defendants had no mutual conflict and no determination was required to grant plaintiff relief, Section 11 explanation does not bar subsequent litigation between them.',
              createdAt: new Date(Date.now() - 36 * 60 * 60 * 1000),
            },
            {
              senderId: student1._id,
              senderRole: 'student' as const,
              senderName: student1.name,
              senderSalutation: student1.salutation || 'Adv.',
              message:
                'Understood perfectly Sir! The 3-tier test of Mahboob Sahab clears the ambiguity. Thank you!',
              createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
            },
          ],
        },
        {
          queryNumber: 'RLA-DBT-2026-002',
          student: student1._id,
          studentName: student1.name,
          rollNo: student1.rollNo,
          subject: 'Bhartiya Nyaya Sanhita (BNS)',
          bareActSection: 'Section 111 (Organized Crime)',
          title: 'Minimum sentence ambiguity under Section 111 BNS when death results',
          initialQuestion:
            'In Section 111 BNS (Organized Crime), what is the exact minimum punishment if death of any person results from the act? Does the court retain discretion to impose a term of years?',
          category: 'Bare Act Interpretation' as const,
          priority: 'normal' as const,
          status: 'under_review' as const,
          assignedFaculty: faculty._id,
          assignedFacultyName: faculty.name,
          escalatedToLiveChat: false,
          tags: ['BNS', 'Section 111', 'Organized Crime', 'Penology'],
          thread: [
            {
              senderId: student1._id,
              senderRole: 'student' as const,
              senderName: student1.name,
              senderSalutation: student1.salutation || 'Adv.',
              message:
                'In Section 111 BNS (Organized Crime), what is the exact minimum punishment if death of any person results from the act? Does the court retain discretion to impose a term of years?',
              createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
            },
            {
              senderId: faculty._id,
              senderRole: 'faculty' as const,
              senderName: faculty.name,
              senderSalutation: faculty.salutation || 'Dr.',
              message:
                'Under Section 111(2)(a) BNS, if the organized crime results in the death of any person, the statute prescribes death or imprisonment for life, and a mandatory minimum fine of ₹10 Lakhs. The court has no discretion to sentence below life imprisonment in death-resulting cases.',
              createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
            },
          ],
        },
        {
          queryNumber: 'RLA-DBT-2026-003',
          student: student2._id,
          studentName: student2.name,
          rollNo: student2.rollNo,
          subject: 'Bhartiya Nagarik Suraksha Sanhita (BNSS)',
          bareActSection: 'Section 35 (Notice of Appearance vs Arrest)',
          title: 'Mandatory requirement of Section 35 BNSS notice when electronic evidence tampering is suspected',
          initialQuestion:
            'Regarding BNSS arrest guidelines, is Section 35 notice of appearance mandatory even if the investigating officer reasonably believes the accused may tamper with electronic evidence or witnesses?',
          category: 'Procedural Practice' as const,
          priority: 'urgent' as const,
          status: 'pending' as const,
          escalatedToLiveChat: false,
          tags: ['BNSS', 'Section 35', 'Arrest', 'Notice of Appearance'],
          thread: [
            {
              senderId: student2._id,
              senderRole: 'student' as const,
              senderName: student2.name,
              senderSalutation: student2.salutation || 'Adv.',
              message:
                'Regarding BNSS arrest guidelines, is Section 35 notice of appearance mandatory even if the investigating officer reasonably believes the accused may tamper with electronic evidence or witnesses?',
              createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
            },
          ],
        },
        {
          queryNumber: 'RLA-DBT-2026-004',
          student: student1._id,
          studentName: student1.name,
          rollNo: student1.rollNo,
          subject: 'Constitution of India',
          bareActSection: 'Article 21 & Article 137',
          title: 'Scope of Curative Petition after dismissal of review petition under Article 137',
          initialQuestion:
            'Sir, under what exceptional conditions does the Supreme Court entertain a curative petition as laid down in Rupa Ashok Hurra v. Ashok Hurra (2002)? Does bias of a judge suffice?',
          category: 'Case Law & Precedent' as const,
          priority: 'normal' as const,
          status: 'resolved' as const,
          assignedFaculty: director._id,
          assignedFacultyName: director.name,
          resolvedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
          escalatedToLiveChat: false,
          tags: ['Constitution', 'Article 21', 'Curative Petition', 'Rupa Hurra'],
          thread: [
            {
              senderId: student1._id,
              senderRole: 'student' as const,
              senderName: student1.name,
              senderSalutation: student1.salutation || 'Adv.',
              message:
                'Sir, under what exceptional conditions does the Supreme Court entertain a curative petition as laid down in Rupa Ashok Hurra v. Ashok Hurra (2002)? Does bias of a judge suffice?',
              createdAt: new Date(Date.now() - 10 * 60 * 60 * 1000),
            },
            {
              senderId: director._id,
              senderRole: 'admin' as const,
              senderName: director.name,
              senderSalutation: director.salutation || 'Adv.',
              message:
                'In Rupa Ashok Hurra (2002 4 SCC 388), the 5-judge Constitution Bench held that a curative petition is maintainable to prevent abuse of its process and cure gross miscarriage of justice on very narrow grounds:\n1. Violation of principles of natural justice (e.g. petitioner was not served with notice or heard);\n2. Where a judge failed to disclose his connection with the subject-matter or parties giving rise to real apprehension of bias.\nIt must also be certified by a Senior Advocate and circulated to the 3 senior-most judges.',
              createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
            },
          ],
        },
        {
          queryNumber: 'RLA-DBT-2026-005',
          student: student2._id,
          studentName: student2.name,
          rollNo: student2.rollNo,
          subject: 'Indian Evidence Act / BSA',
          bareActSection: 'Section 63 BSA (Old Section 65B IEA)',
          title: 'Requirement of certificate for electronic records when original device is produced in court',
          initialQuestion:
            'Is a Section 63 BSA (corresponding to Section 65B IEA) electronic certificate mandatory when the primary original device (e.g. the phone itself) is produced directly before the trial judge?',
          category: 'Bare Act Interpretation' as const,
          priority: 'urgent' as const,
          status: 'under_review' as const,
          assignedFaculty: faculty._id,
          assignedFacultyName: faculty.name,
          escalatedToLiveChat: false,
          tags: ['BSA', 'Section 63', 'Section 65B', 'Electronic Evidence', 'Arjun Panditrao'],
          thread: [
            {
              senderId: student2._id,
              senderRole: 'student' as const,
              senderName: student2.name,
              senderSalutation: student2.salutation || 'Adv.',
              message:
                'Is a Section 63 BSA (corresponding to Section 65B IEA) electronic certificate mandatory when the primary original device (e.g. the phone itself) is produced directly before the trial judge?',
              createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
            },
            {
              senderId: faculty._id,
              senderRole: 'faculty' as const,
              senderName: faculty.name,
              senderSalutation: faculty.salutation || 'Dr.',
              message:
                'No Pooja. As clarified by the Supreme Court in Arjun Panditrao Khotkar v. Kailash Kushanrao Gorantyal (2020), if the original device is brought into court by the owner/stepper into the witness box, it is admissible directly as primary evidence under Section 62 without any 65B / Section 63 certificate. The certificate is required only when secondary copies/printouts/CDs are produced.',
              createdAt: new Date(Date.now() - 30 * 60 * 1000),
            },
          ],
        },
      ];

      for (const q of sampleQueries) {
        const exists = await DoubtQuery.findOne({ queryNumber: q.queryNumber });
        if (!exists) {
          await DoubtQuery.create(q);
        }
      }
      console.log('✅ Academic doubt queries seeded.');
    }

    // 2. Seed Realistic Chat Conversations & Messages
    console.log('🌱 Seeding initial 1-to-1 mentorship chat conversations...');

    // Conversation 1: Rohit Verma <-> Adv. Rajinder Sir
    let conv1 = await ChatConversation.findOne({
      studentId: student1._id,
      adminId: director._id,
    });

    if (!conv1) {
      conv1 = await ChatConversation.create({
        participants: [student1._id, director._id],
        studentId: student1._id,
        adminId: director._id,
        studentRollNo: student1.rollNo,
        studentName: student1.name,
        channel: 'mentorship',
        status: 'active',
        lastMessageAt: new Date(Date.now() - 15 * 60 * 1000),
        lastMessagePreview: 'Remember to cite Mahboob Sahab in your DAW submission today.',
        lastMessageSenderId: director._id,
        unreadCountStudent: 0,
        unreadCountAdmin: 0,
      });

      const conv1Messages = [
        {
          conversationId: conv1._id,
          senderId: student1._id,
          senderRole: 'student' as const,
          senderName: student1.name,
          message: 'Good morning Adv. Rajinder Sir! I am preparing the written assignment on CPC Section 11.',
          clientMessageId: 'seed-rohit-001',
          deliveryStatus: 'read' as const,
          deliveredAt: new Date(Date.now() - 45 * 60 * 1000),
          readAt: new Date(Date.now() - 40 * 60 * 1000),
          createdAt: new Date(Date.now() - 45 * 60 * 1000),
        },
        {
          conversationId: conv1._id,
          senderId: director._id,
          senderRole: 'admin' as const,
          senderName: director.name,
          message: 'Good morning Rohit. Make sure you clearly differentiate constructive res judicata (Explanation IV) from actual res judicata.',
          clientMessageId: 'seed-rajinder-001',
          deliveryStatus: 'read' as const,
          deliveredAt: new Date(Date.now() - 30 * 60 * 1000),
          readAt: new Date(Date.now() - 25 * 60 * 1000),
          createdAt: new Date(Date.now() - 30 * 60 * 1000),
        },
        {
          conversationId: conv1._id,
          senderId: student1._id,
          senderRole: 'student' as const,
          senderName: student1.name,
          message: 'Yes Sir! I will structure the answer with Forward Construction Co. v. Prabhat Mandal principles.',
          clientMessageId: 'seed-rohit-002',
          deliveryStatus: 'read' as const,
          deliveredAt: new Date(Date.now() - 20 * 60 * 1000),
          readAt: new Date(Date.now() - 18 * 60 * 1000),
          createdAt: new Date(Date.now() - 20 * 60 * 1000),
        },
        {
          conversationId: conv1._id,
          senderId: director._id,
          senderRole: 'admin' as const,
          senderName: director.name,
          message: 'Excellent. Remember to cite Mahboob Sahab in your DAW submission today.',
          clientMessageId: 'seed-rajinder-002',
          deliveryStatus: 'read' as const,
          deliveredAt: new Date(Date.now() - 15 * 60 * 1000),
          readAt: new Date(Date.now() - 14 * 60 * 1000),
          createdAt: new Date(Date.now() - 15 * 60 * 1000),
        },
      ];

      await ChatMessage.insertMany(conv1Messages);
      console.log(`✅ Seeded conversation and 4 messages for ${student1.name}.`);
    }

    // Conversation 2: Pooja Deshmukh <-> Adv. Rajinder Sir (with 1 unread message for Admin!)
    let conv2 = await ChatConversation.findOne({
      studentId: student2._id,
      adminId: director._id,
    });

    if (!conv2) {
      conv2 = await ChatConversation.create({
        participants: [student2._id, director._id],
        studentId: student2._id,
        adminId: director._id,
        studentRollNo: student2.rollNo,
        studentName: student2.name,
        channel: 'mentorship',
        status: 'active',
        lastMessageAt: new Date(Date.now() - 5 * 60 * 1000),
        lastMessagePreview: 'Sir, what is the exact difference between Section 105 and Section 106 BSA regarding burden of proof?',
        lastMessageSenderId: student2._id,
        unreadCountStudent: 0,
        unreadCountAdmin: 1, // Notice: unread badge for Admin Console!
      });

      const conv2Messages = [
        {
          conversationId: conv2._id,
          senderId: student2._id,
          senderRole: 'student' as const,
          senderName: student2.name,
          message: 'Respectful regards Sir, I had a doubt regarding the Indian Evidence Act / BSA chapters.',
          clientMessageId: 'seed-pooja-001',
          deliveryStatus: 'read' as const,
          deliveredAt: new Date(Date.now() - 25 * 60 * 1000),
          readAt: new Date(Date.now() - 20 * 60 * 1000),
          createdAt: new Date(Date.now() - 25 * 60 * 1000),
        },
        {
          conversationId: conv2._id,
          senderId: director._id,
          senderRole: 'admin' as const,
          senderName: director.name,
          message: 'Please state the sections, Pooja. I am reviewing the chamber questions now.',
          clientMessageId: 'seed-rajinder-003',
          deliveryStatus: 'read' as const,
          deliveredAt: new Date(Date.now() - 15 * 60 * 1000),
          readAt: new Date(Date.now() - 10 * 60 * 1000),
          createdAt: new Date(Date.now() - 15 * 60 * 1000),
        },
        {
          conversationId: conv2._id,
          senderId: student2._id,
          senderRole: 'student' as const,
          senderName: student2.name,
          message: 'Sir, what is the exact difference between Section 105 and Section 106 BSA regarding burden of proof?',
          clientMessageId: 'seed-pooja-002',
          deliveryStatus: 'delivered' as const, // Double grey tick: delivered to admin, but not yet marked read!
          deliveredAt: new Date(Date.now() - 5 * 60 * 1000),
          createdAt: new Date(Date.now() - 5 * 60 * 1000),
        },
      ];

      await ChatMessage.insertMany(conv2Messages);
      console.log(`✅ Seeded conversation and 3 messages for ${student2.name} (1 unread for faculty).`);
    }

    console.log('🎉 All doubts and live chat seeds completed successfully.');
  } catch (err: any) {
    console.error('❌ Error seeding doubts & chat:', err.message);
  }
};

// Standalone execution support
if (process.argv[1]?.endsWith('seedDoubts.ts')) {
  (async () => {
    await connectDB();
    await seedInitialDoubts();
    await disconnectDB();
  })();
}

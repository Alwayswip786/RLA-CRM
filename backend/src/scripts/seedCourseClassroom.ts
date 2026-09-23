import mongoose from 'mongoose';
import dotenv from 'dotenv';
import {
  Course,
  CourseModule,
  CourseLesson,
  CourseEnrollment,
  LessonProgress,
  LessonReaction,
  LessonComment,
  CourseAnnouncement,
  CourseLiveSession,
} from '../models/course.model.js';
import User from '../models/user.model.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rla_crm';

export async function seedCourseClassroom() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB.');

    // 1. Fetch Students & Admin
    const students = await User.find({ role: 'student' });
    const admin = await User.findOne({ role: 'admin' });
    console.log(`Found ${students.length} students and admin: ${admin?.email}`);

    // Clean existing course data for fresh idempotent seeding
    await Course.deleteMany({});
    await CourseModule.deleteMany({});
    await CourseLesson.deleteMany({});
    await CourseEnrollment.deleteMany({});
    await LessonProgress.deleteMany({});
    await LessonReaction.deleteMany({});
    await LessonComment.deleteMany({});
    await CourseAnnouncement.deleteMany({});
    await CourseLiveSession.deleteMany({});

    console.log('Cleaned previous course collections.');

    // ========================================================================
    // COURSE 1: Judicial Services Foundation (Flagship Law Program)
    // ========================================================================
    const djsCourse = await Course.create({
      title: 'Judicial Services (PCS-J) Comprehensive Foundation 2025-26',
      slug: 'djs-foundation',
      shortCode: 'PCS-J FOUNDATION',
      subtitle: 'Delhi, UP, Haryana & MP Judicial syllabus line-by-line coverage',
      description:
        'Complete judicial preparation covering Major & Minor Acts, Bare Act decoding, Mains judgment writing, daily MCQs and chamber mentorship.',
      thumbnailTag: 'JUDICIARY 360°',
      thumbnailBg: 'from-[#0a1c36] to-[#143564]',
      instructor: 'Adv. Rajinder Sir',
      facultyInCharge: admin?._id,
      targetExam: 'DJS, UP-PCS(J), MP-CJ, HCS(JB)',
      category: 'Judicial Services',
      status: 'published',
      enrolledStudentsCount: 264,
      totalLecturesCount: 78,
      totalHours: 145.5,
      activeBatches: ['Morning Shift (Cohort A)', 'Evening Shift (Cohort B)'],
      certificateRule: {
        minProgressPercent: 100,
        minAssessmentScorePercent: 70,
        certificateTitle: 'Honor Certificate in Judicial Services & Procedural Law',
        issuingAuthority: 'Rajinder Law Academy Academic Council',
      },
    });

    // Modules for djsCourse
    const djsMod1 = await CourseModule.create({
      courseId: djsCourse._id,
      title: 'Orientation & Legal Pedagogy',
      order: 1,
      badge: 'Completed',
    });

    const djsMod2 = await CourseModule.create({
      courseId: djsCourse._id,
      title: '1 - Code of Civil Procedure (CPC) - Sections & Orders',
      order: 2,
      badge: 'Core Major Act',
    });

    const djsMod3 = await CourseModule.create({
      courseId: djsCourse._id,
      title: '2 - Bharatiya Nagarik Suraksha Sanhita (BNSS 2023)',
      order: 3,
      badge: 'New Criminal Law',
    });

    const djsMod4 = await CourseModule.create({
      courseId: djsCourse._id,
      title: '3 - Bharatiya Nyaya Sanhita (BNS 2023)',
      order: 4,
      badge: 'Substantive Law',
    });

    // Lessons for djsCourse Mod 1
    await CourseLesson.create({
      courseId: djsCourse._id,
      moduleId: djsMod1._id,
      title: 'Meet Your Mentor & Judicial Exam Roadmap',
      type: 'video',
      order: 1,
      duration: '18:45',
      durationSeconds: 1125,
      score: '10/10',
      points: 10,
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      likesCount: 142,
      dislikesCount: 2,
    });

    // Lessons for djsCourse Mod 2
    const djsL2_1 = await CourseLesson.create({
      courseId: djsCourse._id,
      moduleId: djsMod2._id,
      title: 'CPC Sec 11: Res Judicata & Constructive Res Judicata Deep Dive',
      type: 'video',
      order: 1,
      duration: '28:45',
      durationSeconds: 1725,
      score: '10/10',
      points: 15,
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      likesCount: 218,
      dislikesCount: 5,
    });

    const djsL2_2 = await CourseLesson.create({
      courseId: djsCourse._id,
      moduleId: djsMod2._id,
      title: 'Res Judicata Statutory Conditions (Sec 11)',
      type: 'quiz',
      order: 2,
      duration: '10 mins',
      score: '20/20',
      points: 20,
      quizData: [
        {
          question:
            'Which of the following is an indispensable condition for the application of Res Judicata under Section 11 of the Code of Civil Procedure, 1908?',
          options: [
            'The matter directly and substantially in issue in the subsequent suit must have been directly and substantially in issue in the former suit',
            'The parties in both suits must be completely different persons with no privity of interest',
            'The former court had no competent jurisdiction to try the subsequent suit',
            'The former suit was dismissed solely on technical grounds of non-joinder without hearing on merits',
          ],
          correctIndex: 0,
          explanation:
            'Section 11 CPC mandates that the matter directly and substantially in issue in the subsequent suit must have been directly and substantially in issue in the former suit between the same parties or between parties under whom they or any of them claim litigating under the same title, and heard and finally decided by a competent court.',
          points: 10,
        },
        {
          question:
            'Under which Explanation to Section 11 CPC is the doctrine of "Constructive Res Judicata" specifically embodied?',
          options: ['Explanation II', 'Explanation IV', 'Explanation VI', 'Explanation VIII'],
          correctIndex: 1,
          explanation:
            'Explanation IV to Section 11 CPC provides: "Any matter which might and ought to have been made ground of defence or attack in such former suit shall be deemed to have been a matter directly and substantially in issue in such suit." This is the foundational rule of Constructive Res Judicata (Forward Construction Co. v. Prabhat Mandal).',
          points: 10,
        },
      ],
    });

    const djsL2_3 = await CourseLesson.create({
      courseId: djsCourse._id,
      moduleId: djsMod2._id,
      title: 'Order 7 Rule 11: Rejection of Plaint Application Drafting',
      type: 'problem',
      order: 3,
      duration: '25 mins',
      score: '10/10',
      points: 20,
      problemData: {
        problemStatement:
          'Draft the key grounds under Order VII Rule 11(a) and (d) for an application praying for the rejection of a civil plaint where the plaintiff claims partition of ancestral agricultural land without disclosing a cause of action, and where the suit is ex-facie barred by Section 34 of the SARFAESI Act.',
        exampleInput:
          'Suit for partition filed against bank auction property without challenging loan default.',
        exampleOutput:
          'Plaint rejected under Order VII Rule 11(a) for failure to disclose cause of action against the secured creditor and under Rule 11(d) as barred by the statutory prohibition in Section 34 of SARFAESI Act.',
        modelAnswer:
          '1. The plaint does not disclose any valid cause of action against Defendant No. 2 (Bank).\n2. Section 34 of SARFAESI expressly ousts Civil Court jurisdiction in respect of measures under Sec 13(4).\n3. Rejection of plaint under Order VII Rule 11 is mandatory as per Supreme Court mandate in Dahiben v. Arvindbhai Kalyanji Bhanusali (2020).',
        hint: 'Refer to Order 7 Rule 11(a) and 11(d) of CPC and recent Supreme Court precedent in Dahiben.',
      },
    });

    await CourseLesson.create({
      courseId: djsCourse._id,
      moduleId: djsMod2._id,
      title: 'CPC Section 10 vs Section 11 Comparative Notes',
      type: 'document',
      order: 4,
      duration: '15 mins',
      score: '10/10',
      points: 10,
      documentContent: [
        'Principle 1: Section 10 deals with "Stay of Suit" (Res Sub Judice) where a previously instituted suit between the same parties is already pending before a competent court.',
        'Principle 2: Section 11 deals with "Bar of Trial" (Res Judicata) where the issue has already been heard and finally decided by a competent court in a former suit.',
        'Principle 3: The objective of Section 10 is to prevent concurrent conflicting judgments on the same subject matter, whereas the objective of Section 11 is to bring finality to litigation (interest reipublicae ut sit finis litium).',
        'Principle 4: Inherent powers under Section 151 CPC can be invoked for consolidation of suits when Section 10 conditions are technically incomplete.',
      ],
    });

    // Announcements for djsCourse
    await CourseAnnouncement.create({
      courseId: djsCourse._id,
      title: 'Interactive Case Law Discussion: CPC Order 39 Temporary Injunctions',
      content:
        'Adv. Rajinder Sir will conduct an exclusive 90-minute live doubt resolution and Mains answer evaluation session on Order 39 Rules 1 & 2 this Thursday at 7:00 PM IST. Please submit your drafted answers in the Mains portal beforehand.',
      priority: 'urgent',
      authorName: 'Adv. Rajinder Sir',
      authorRole: 'Dean & Lead Faculty',
      badge: 'URGENT CHAMBER ALERT',
      publishedAt: new Date(Date.now() - 3600 * 1000 * 4),
    });

    await CourseAnnouncement.create({
      courseId: djsCourse._id,
      title: 'BNS vs IPC Comparative Section Concordance Table Uploaded',
      content:
        'A comprehensive 45-page Bare Act concordance chart mapping Indian Penal Code sections to Bharatiya Nyaya Sanhita 2023 has been uploaded to the Study Vault and course module attachments.',
      priority: 'normal',
      authorName: 'Academic Examination Cell',
      authorRole: 'Faculty',
      badge: 'RESOURCE UPDATE',
      publishedAt: new Date(Date.now() - 3600 * 1000 * 28),
    });

    // Live Doubt Session for djsCourse
    await CourseLiveSession.create({
      courseId: djsCourse._id,
      title: 'Chamber Mentorship: Drafting Written Statements under Order 8 CPC',
      facultyName: 'Adv. Rajinder Sir',
      scheduledAt: new Date(Date.now() + 3600 * 1000 * 24),
      durationMinutes: 90,
      joinUrl: '/dashboard/chat',
      status: 'upcoming',
    });

    // ========================================================================
    // COURSE 2: Constitutional Law of India & Landmark Precedents Mastery
    // ========================================================================
    const constCourse = await Course.create({
      title: 'Constitutional Law of India & Landmark Precedents Mastery',
      slug: 'constitutional-law',
      shortCode: 'CONSTITUTIONAL LAW',
      subtitle: 'From Preamble to Part XXI: Fundamental Rights, Writs, Judicial Review & Basic Structure',
      description:
        'In-depth judicial examination preparation covering constitutional interpretation, landmark Supreme Court benches, doctrine of basic structure, emergency powers, and writ jurisprudence.',
      thumbnailTag: 'CONSTITUTIONAL LAW',
      thumbnailBg: 'from-[#0d1e38] to-[#163564]',
      instructor: 'Adv. Rajinder Sir',
      targetExam: 'DJS, UP-PCS(J), MP-CJ, HCS(JB) & Supreme Court Practice',
      category: 'Constitutional Law',
      status: 'published',
      enrolledStudentsCount: 312,
      totalLecturesCount: 58,
      totalHours: 105,
      activeBatches: ['Morning Shift (Cohort A)', 'Evening Shift (Cohort B)'],
      certificateRule: {
        minProgressPercent: 100,
        minAssessmentScorePercent: 75,
        certificateTitle: 'Honor Certificate of Mastery in Constitutional Law & Judicial Review',
        issuingAuthority: 'Rajinder Law Academy Academic Council',
      },
    });

    // Modules for constCourse (Matching Reference UI hierarchy)
    const constResMod = await CourseModule.create({
      courseId: constCourse._id,
      title: 'Resources',
      order: 1,
    });

    const constBeforeMod = await CourseModule.create({
      courseId: constCourse._id,
      title: 'Before We Start',
      order: 2,
      badge: 'Completed',
    });

    const constMod1 = await CourseModule.create({
      courseId: constCourse._id,
      title: '1 - Preamble, Basic Structure & Article 368',
      order: 3,
    });

    await CourseModule.create({
      courseId: constCourse._id,
      title: 'Directive Principles & Fundamental Duties (Part IV & IVA)',
      order: 4,
    });

    await CourseModule.create({
      courseId: constCourse._id,
      title: 'Union & State Judiciary (Articles 124 to 237)',
      order: 5,
    });

    await CourseModule.create({
      courseId: constCourse._id,
      title: 'Emergency Provisions & Article 356 Landmark Rulings',
      order: 6,
    });

    await CourseModule.create({
      courseId: constCourse._id,
      title: 'Writs Jurisdiction (Articles 32 & 226) & PIL Evolution',
      order: 7,
    });

    // Lessons for constCourse Mod 1 (Resources)
    await CourseLesson.create({
      courseId: constCourse._id,
      moduleId: constResMod._id,
      title: 'Judicial Services Bare Act Compendium & Syllabus Sheet',
      type: 'resource',
      order: 1,
      duration: 'Resource File',
      resourceFile: {
        fileName: 'Judiciary_Constitutional_Law_Syllabus_Sheet.pdf',
        fileUrl: 'https://example.com/judiciary-constitution-sheet.pdf',
        fileSize: '3.2 MB',
        fileType: 'pdf',
      },
    });

    await CourseLesson.create({
      courseId: constCourse._id,
      moduleId: constResMod._id,
      title: 'Landmark Constitutional Benches Compendium (1950–2026)',
      type: 'resource',
      order: 2,
      duration: 'Resource File',
      resourceFile: {
        fileName: 'Landmark_Constitutional_Judgments_Compendium.pdf',
        fileUrl: 'https://example.com/landmark-constitution-compendium.pdf',
        fileSize: '4.8 MB',
        fileType: 'pdf',
      },
    });

    // Lessons for constCourse Mod 2 (Before We Start)
    await CourseLesson.create({
      courseId: constCourse._id,
      moduleId: constBeforeMod._id,
      title: 'Course Overview: Navigating Constitutional Law in Judicial Exams',
      type: 'video',
      order: 1,
      duration: '18 mins',
      durationSeconds: 1080,
      score: '10/10',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    });

    await CourseLesson.create({
      courseId: constCourse._id,
      moduleId: constBeforeMod._id,
      title: 'Chamber Mentorship: How to Formulate Constitutional Arguments',
      type: 'video',
      order: 2,
      duration: '14 mins',
      durationSeconds: 840,
      score: '10/10',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    });

    // Lessons for constCourse Mod 3 (1 - Preamble, Basic Structure & Article 368)
    const constPreambleLesson = await CourseLesson.create({
      courseId: constCourse._id,
      moduleId: constMod1._id,
      title: 'Preamble, Basic Structure Doctrine & Kesavananda Bharati Analysis',
      type: 'video',
      order: 1,
      duration: '28:45',
      durationSeconds: 1725,
      score: '10/10',
      points: 10,
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      likesCount: 184,
      dislikesCount: 3,
    });

    await CourseLesson.create({
      courseId: constCourse._id,
      moduleId: constMod1._id,
      title: 'Preamble & 42nd Amendment Act MCQs',
      type: 'quiz',
      order: 2,
      duration: '5 mins',
      score: '20/20',
      points: 20,
      quizData: [
        {
          question:
            'Which words were added to the Preamble of the Constitution of India by the 42nd Constitutional Amendment Act, 1976?',
          options: [
            'Socialist, Secular, and Integrity',
            'Sovereign, Democratic, and Republic',
            'Liberty, Equality, and Fraternity',
            'Justice, Dignity, and Unity',
          ],
          correctIndex: 0,
          explanation:
            'The 42nd Constitutional Amendment Act of 1976 amended the Preamble to insert three words: "Socialist", "Secular", and "Integrity". As affirmed in S.R. Bommai v. Union of India, secularism is part of the basic structure of the Constitution.',
          points: 20,
        },
      ],
    });

    await CourseLesson.create({
      courseId: constCourse._id,
      moduleId: constMod1._id,
      title: 'Article 368 Amendment Power & Judicial Review',
      type: 'quiz',
      order: 3,
      duration: '5 mins',
      score: '20/20',
      points: 20,
      quizData: [
        {
          question:
            'In which landmark judgment did the 13-judge bench of the Supreme Court rule that Parliament cannot alter the Basic Structure of the Constitution under Article 368?',
          options: [
            'Shankari Prasad v. Union of India (1951)',
            'Sajjan Singh v. State of Rajasthan (1965)',
            'I.C. Golaknath v. State of Punjab (1967)',
            'Kesavananda Bharati v. State of Kerala (1973)',
          ],
          correctIndex: 3,
          explanation:
            'In Kesavananda Bharati v. State of Kerala (1973), a historic 13-judge bench by a 7:6 majority propounded the Basic Structure Doctrine, holding that while Parliament has wide constituent powers under Article 368, it cannot damage or destroy the essential framework or basic features of the Constitution.',
          points: 20,
        },
      ],
    });

    await CourseLesson.create({
      courseId: constCourse._id,
      moduleId: constMod1._id,
      title: 'Constitutional Case Law Problem: Severability & Eclipse under Article 13',
      type: 'problem',
      order: 4,
      duration: '20 mins',
      score: '10/10',
      points: 20,
      problemData: {
        problemStatement:
          'The State Legislature enacts the Public Property Preservation Act, 2026. Section 14(2) of the Act imposes an unconditional pre-censorship on publication of court proceedings relating to corruption trials, whereas the rest of the Act governs physical security of judicial infrastructure. A journalist challenges Section 14(2) as violative of Article 19(1)(a). The State argues that the entire Act must be upheld under reasonable restrictions of public order.\n\nFormulate the legal argument applying the Doctrine of Severability under Article 13(1) & (2) and determine whether the whole Act fails or only Section 14(2).',
        exampleInput:
          'Impugned Provision: Section 14(2) Pre-censorship of Judicial Proceedings.\nConstitutional Test: Article 19(1)(a) read with Article 19(2) and Article 13.',
        exampleOutput:
          'Ruling: Section 14(2) is severable and void ab initio. The remaining provisions governing physical security remain valid and operational under the doctrine of severability established in R.M.D. Chamarbaugwalla v. Union of India.',
        modelAnswer:
          'Applying the Doctrine of Severability (R.M.D. Chamarbaugwalla v. Union of India, 1957 SCR 930):\n1. Article 13 declares that laws inconsistent with Part III are void to the extent of such inconsistency.\n2. If the invalid part can be severed from the valid portion without altering the legislative intent and core scheme of the statute, only the unconstitutional section falls.\n3. Since Section 14(2) (pre-censorship) is independent of the physical security scheme of the Act, striking down Section 14(2) leaves the rest of the Act workable. Therefore, Section 14(2) alone is unconstitutional under Article 19(1)(a).',
        hint: 'Consider R.M.D. Chamarbaugwalla v. Union of India (1957) and the legislative intent behind the surviving provisions.',
      },
    });

    await CourseLesson.create({
      courseId: constCourse._id,
      moduleId: constMod1._id,
      title: 'Bare Act Study Guide: The Golden Triangle (Articles 14, 19 & 21)',
      type: 'document',
      order: 5,
      duration: '10 mins',
      score: '0/1',
      points: 10,
      documentContent: [
        'Step 1: Understand the Interconnection — In Maneka Gandhi v. Union of India (1978), the Supreme Court overruled A.K. Gopalan (1950) and established that Articles 14, 19, and 21 are not mutually exclusive water-tight compartments, but form a protective Trinity or Golden Triangle.',
        'Step 2: Article 14 (Equality) — Requires that any state action must satisfy both intelligible differentia and rational nexus, as well as the test against arbitrariness (E.P. Royappa v. State of Tamil Nadu).',
        'Step 3: Article 19 (Six Freedoms) — Any restriction imposed under clauses (2) to (6) must be reasonable, proportionate, and strictly authorized by a valid enacted law.',
        'Step 4: Article 21 (Right to Life & Personal Liberty) — "Procedure established by law" must be just, fair, and reasonable, incorporating the principles of natural justice (substantive due process).',
        'Step 5: Judicial Examination Application — When tackling Mains questions on detention, privacy (K.S. Puttaswamy), or state licensing, always test the impugned measure cumulatively against the triad of Articles 14, 19, and 21.',
      ],
    });

    // ========================================================================
    // COURSE 3: Bharatiya Nyaya Sanhita (BNS) & Criminal Law Domination
    // ========================================================================
    const bnsCourse = await Course.create({
      title: 'Bhartiya Nyaya Sanhita (BNS) & Criminal Law Domination',
      slug: 'bns-mastery',
      shortCode: 'BNS CRIMINAL LAW',
      subtitle: 'IPC vs BNS comparative analysis, case laws & charge framing',
      description:
        'Master the substantive criminal law transitions: homicide, sexual offences, terrorism provisions, and trial preparation.',
      thumbnailTag: 'NEW CRIMINAL LAWS',
      thumbnailBg: 'from-[#14233c] to-[#1c3860]',
      instructor: 'Adv. Rajinder Sir',
      targetExam: 'PCS-J, APO & Judiciary Exams',
      category: 'Criminal Law',
      status: 'published',
      enrolledStudentsCount: 195,
      totalLecturesCount: 36,
      totalHours: 65,
      activeBatches: ['Evening Shift (Cohort B)'],
    });

    const bnsMod1 = await CourseModule.create({
      courseId: bnsCourse._id,
      title: '1 - Introduction to Bharatiya Nyaya Sanhita, 2023',
      order: 1,
      badge: 'Foundations',
    });

    await CourseLesson.create({
      courseId: bnsCourse._id,
      moduleId: bnsMod1._id,
      title: 'BNS Sec 100 vs 101: Culpable Homicide vs Murder Distinction',
      type: 'video',
      order: 1,
      duration: '35:10',
      durationSeconds: 2110,
      score: '10/10',
      points: 15,
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
    });

    // ========================================================================
    // COURSE 4: Civil Procedure Code (CPC) & Pleadings Drafting Mastery
    // ========================================================================
    const cpcCourse = await Course.create({
      title: 'Civil Procedure Code (CPC) & Pleadings Drafting Mastery',
      slug: 'cpc-chambers',
      shortCode: 'CPC DRAFTING',
      subtitle: 'Order 1 to 51, Plaints, Injunctions & Execution of Decrees',
      description:
        'Advanced chamber drafting masterclass on civil pleadings, interim relief, revision and second appeals.',
      thumbnailTag: 'PROCEDURAL LAW',
      thumbnailBg: 'from-[#061120] to-[#0e274b]',
      instructor: 'Adv. Rajinder Sir',
      targetExam: 'Mains Examination & High Court Practice',
      category: 'Civil Law',
      status: 'published',
      enrolledStudentsCount: 220,
      totalLecturesCount: 42,
      totalHours: 72,
      activeBatches: ['Morning Shift (Cohort A)'],
    });

    const cpcMod1 = await CourseModule.create({
      courseId: cpcCourse._id,
      title: 'Chamber Pleadings & Injunction Practice',
      order: 1,
      badge: 'Drafting Clinic',
    });

    await CourseLesson.create({
      courseId: cpcCourse._id,
      moduleId: cpcMod1._id,
      title: 'Drafting Plaints & Written Statements: The 5 Golden Rules',
      type: 'video',
      order: 1,
      duration: '42:00',
      durationSeconds: 2520,
      score: '10/10',
      points: 15,
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    });

    // ========================================================================
    // SEED ENROLLMENTS FOR STUDENTS
    // ========================================================================
    console.log('Seeding student enrollments and initial progress...');
    for (const student of students) {
      // Enroll in djsCourse
      await CourseEnrollment.findOneAndUpdate(
        { userId: student._id, courseId: djsCourse._id },
        {
          $set: {
            userId: student._id,
            courseId: djsCourse._id,
            enrolledAt: new Date('2024-10-05T10:00:00Z'),
            lastAccessedLessonId: djsL2_1._id,
            lastAccessedAt: new Date(),
            overallProgressPercent: 28.95,
            completedLessonsCount: 2,
            totalPointsEarned: 19280,
          },
        },
        { upsert: true }
      );

      // Enroll in constCourse
      await CourseEnrollment.findOneAndUpdate(
        { userId: student._id, courseId: constCourse._id },
        {
          $set: {
            userId: student._id,
            courseId: constCourse._id,
            enrolledAt: new Date('2024-08-25T10:00:00Z'),
            lastAccessedLessonId: constPreambleLesson._id,
            lastAccessedAt: new Date(),
            overallProgressPercent: 7.97,
            completedLessonsCount: 2,
            totalPointsEarned: 12450,
          },
        },
        { upsert: true }
      );

      // Enroll in bnsCourse
      await CourseEnrollment.findOneAndUpdate(
        { userId: student._id, courseId: bnsCourse._id },
        {
          $set: {
            userId: student._id,
            courseId: bnsCourse._id,
            enrolledAt: new Date('2024-08-25T10:00:00Z'),
            overallProgressPercent: 7.97,
            completedLessonsCount: 1,
            totalPointsEarned: 8400,
          },
        },
        { upsert: true }
      );

      // Enroll in cpcCourse
      await CourseEnrollment.findOneAndUpdate(
        { userId: student._id, courseId: cpcCourse._id },
        {
          $set: {
            userId: student._id,
            courseId: cpcCourse._id,
            enrolledAt: new Date('2024-05-22T10:00:00Z'),
            overallProgressPercent: 90.8,
            completedLessonsCount: 38,
            totalPointsEarned: 24500,
          },
        },
        { upsert: true }
      );

      // Seed lesson progress for djsL2_1
      await LessonProgress.findOneAndUpdate(
        { userId: student._id, lessonId: djsL2_1._id },
        {
          $set: {
            userId: student._id,
            courseId: djsCourse._id,
            lessonId: djsL2_1._id,
            isCompleted: true,
            completedAt: new Date(),
            videoWatchSeconds: 1550,
            videoDurationSeconds: 1725,
            isBookmarked: true,
          },
        },
        { upsert: true }
      );

      // Seed lesson progress for constPreambleLesson
      await LessonProgress.findOneAndUpdate(
        { userId: student._id, lessonId: constPreambleLesson._id },
        {
          $set: {
            userId: student._id,
            courseId: constCourse._id,
            lessonId: constPreambleLesson._id,
            isCompleted: true,
            completedAt: new Date(),
            videoWatchSeconds: 1200,
            videoDurationSeconds: 1725,
            isBookmarked: true,
          },
        },
        { upsert: true }
      );

      // Seed initial like reaction
      await LessonReaction.findOneAndUpdate(
        { userId: student._id, lessonId: djsL2_1._id },
        {
          $set: {
            userId: student._id,
            lessonId: djsL2_1._id,
            reactionType: 'like',
          },
        },
        { upsert: true }
      );
    }

    // Seed Threaded Comments on djsL2_1
    const firstStudent = students[0];
    if (firstStudent) {
      const parentComment = await LessonComment.create({
        courseId: djsCourse._id,
        lessonId: djsL2_1._id,
        userId: firstStudent._id,
        userName: firstStudent.name || 'Aadarsh Dangi (Aspirant)',
        userAvatar: firstStudent.avatarUrl,
        userRole: 'student',
        content:
          'Sir, in Explanation VIII of Section 11 CPC, does the decision of a Court of limited jurisdiction operate as Res Judicata in a subsequent suit triable only by a Court of higher jurisdiction?',
        likesCount: 12,
        isPinned: true,
      });

      // Faculty Reply
      await LessonComment.create({
        courseId: djsCourse._id,
        lessonId: djsL2_1._id,
        userId: admin?._id || firstStudent._id,
        userName: 'Adv. Rajinder Sir',
        userRole: 'faculty',
        parentCommentId: parentComment._id,
        content:
          'Excellent question, Aadarsh. Prior to the 1976 amendment, it did not. However, Explanation VIII specifically altered this position: the decision of a Court of limited jurisdiction now operates as res judicata in a subsequent suit, notwithstanding that the former court was not competent to try the subsequent suit. Refer to Sulochana Amma v. Narayanan Nair (1994) 2 SCC 14.',
        likesCount: 24,
      });
    }

    // Seed mock enrollments for Leaderboard podium (matching Image 2: Vaibhav 26.22k, Abhima 26.2k, Krishna 25.05k)
    const mockLeaderboardNames = [
      { name: 'Vaibhav', email: 'vaibhav.podium@rla.in', rollNo: 'RLA-2026-V01', points: 26220 },
      { name: 'Abhima', email: 'abhima.podium@rla.in', rollNo: 'RLA-2026-A02', points: 26200 },
      { name: 'Krishna', email: 'krishna.podium@rla.in', rollNo: 'RLA-2026-K03', points: 25050 },
      { name: 'Arpit _', email: 'arpit.leader@rla.in', rollNo: 'RLA-2026-A04', points: 23930 },
      { name: 'Vaibhav Tiwari', email: 'v.tiwari@rla.in', rollNo: 'RLA-2026-V05', points: 23270 },
      { name: 'Aadarsh Dangi', email: 'aadarsh@rla.in', rollNo: 'RLA-2026-A06', points: 23120 },
      { name: 'Ronit Kumar', email: 'ronit@rla.in', rollNo: 'RLA-2026-R07', points: 22520 },
      { name: 'Kaustubh Sharma', email: 'kaustubh@rla.in', rollNo: 'RLA-2026-K08', points: 21360 },
      { name: 'Abhay Dhaneshwar', email: 'abhay@rla.in', rollNo: 'RLA-2026-A09', points: 20250 },
      { name: 'Pooja Yadav', email: 'pooja.y@rla.in', rollNo: 'RLA-2026-P10', points: 18360 },
      { name: 'Himani', email: 'himani@rla.in', rollNo: 'RLA-2026-H11', points: 18070 },
    ];

    for (const entry of mockLeaderboardNames) {
      let u = await User.findOne({ email: entry.email });
      if (!u) {
        u = await User.create({
          name: entry.name,
          rollNo: entry.rollNo,
          email: entry.email,
          password: 'Password@123',
          role: 'student',
          accountStatus: 'active',
        });
      }

      await CourseEnrollment.findOneAndUpdate(
        { userId: u._id, courseId: djsCourse._id },
        {
          $set: {
            userId: u._id,
            courseId: djsCourse._id,
            enrolledAt: new Date('2024-09-01'),
            overallProgressPercent: 92,
            completedLessonsCount: 72,
            totalPointsEarned: entry.points,
          },
        },
        { upsert: true }
      );

      await CourseEnrollment.findOneAndUpdate(
        { userId: u._id, courseId: constCourse._id },
        {
          $set: {
            userId: u._id,
            courseId: constCourse._id,
            enrolledAt: new Date('2024-09-01'),
            overallProgressPercent: 88,
            completedLessonsCount: 40,
            totalPointsEarned: entry.points,
          },
        },
        { upsert: true }
      );
    }

    console.log('✅ Course Classroom LMS successfully seeded with full dynamic content!');
  } catch (error) {
    console.error('Error seeding Course Classroom:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

// Auto-run when invoked directly
if (process.argv[1]?.endsWith('seedCourseClassroom.ts') || process.argv[1]?.endsWith('seedCourseClassroom.js')) {
  seedCourseClassroom()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

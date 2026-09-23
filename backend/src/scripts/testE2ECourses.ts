import assert from 'assert';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { type AddressInfo } from 'net';
import app from '../app.js';
import User from '../models/user.model.js';
import { generateAuthTokens } from '../utils/jwt.js';
import { Course, CourseLesson } from '../models/course.model.js';
import { seedCourseClassroom } from './seedCourseClassroom.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rla_crm';

async function runE2ETests() {
  console.log('================================================================');
  console.log('🚀 RUNNING COMPREHENSIVE E2E TESTS: CLASSROOM & COURSE LMS');
  console.log('================================================================\n');

  let server: any;
  let baseUrl: string;

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connection established.');

    // 1. Seed fresh courses catalog
    console.log('1. Seeding fresh course catalog...');
    await seedCourseClassroom();
    await mongoose.connect(MONGODB_URI); // Reconnect after seed completes

    server = app.listen(0);
    const addr = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${addr.port}/api/courses`;
    console.log(`📡 In-memory test server listening on port ${addr.port}\n`);

    // 2. Fetch or create Student & Admin
    const student: any = await User.findOne({ role: 'student' }).select('+authVersion');
    const admin: any = await User.findOne({ role: 'admin' }).select('+authVersion');

    if (!student || !admin) {
      throw new Error('Student or Admin user not found in database.');
    }

    const studentTokens = generateAuthTokens(student._id.toString(), student.authVersion || 0, student.role);
    const adminTokens = generateAuthTokens(admin._id.toString(), admin.authVersion || 0, admin.role);

    const studentHeaders = {
      Authorization: `Bearer ${studentTokens.accessToken}`,
      'Content-Type': 'application/json',
    };

    const adminHeaders = {
      Authorization: `Bearer ${adminTokens.accessToken}`,
      'Content-Type': 'application/json',
    };

    console.log(`Testing with Student: ${student.email} and Admin: ${admin.email}`);

    // TEST 1: GET /api/courses/enrolled
    console.log('\n--- TEST 1: GET /api/courses/enrolled ---');
    const enrolledRes = await fetch(`${baseUrl}/enrolled`, { headers: studentHeaders });
    const enrolledData: any = await enrolledRes.json();
    assert.strictEqual(enrolledRes.status, 200);
    assert.ok(enrolledData.data && enrolledData.data.length > 0, 'Should return enrolled courses');
    console.log(`✅ Passed: Fetched ${enrolledData.data.length} enrolled courses for student.`);
    const firstEnrolled = enrolledData.data[0];
    console.log(`   Sample Course: ${firstEnrolled.title} (Progress: ${firstEnrolled.progress}%)`);

    // TEST 2: GET /api/courses/:courseId
    console.log('\n--- TEST 2: GET /api/courses/:courseId ---');
    const detailRes = await fetch(`${baseUrl}/${firstEnrolled.slug}`, { headers: studentHeaders });
    const detailData: any = await detailRes.json();
    assert.strictEqual(detailRes.status, 200);
    const { course, modules, announcements, liveSession, certificate } = detailData.data;
    assert.ok(course && modules && modules.length > 0, 'Course details and modules must be present');
    console.log(`✅ Passed: Loaded '${course.title}' with ${modules.length} modules.`);
    console.log(`   Announcements count: ${announcements.length}`);
    console.log(`   Live doubt session: ${liveSession?.title || 'None scheduled'}`);
    console.log(`   Certificate eligibility: ${certificate.isEligible}`);

    // Pick first module and lesson
    const testLessonId = modules[1]?.items[0]?.id || modules[0]?.items[0]?.id;
    assert.ok(testLessonId, 'A test lesson must exist');

    // TEST 3: GET /api/courses/:courseId/leaderboard
    console.log('\n--- TEST 3: GET /api/courses/:courseId/leaderboard ---');
    const leaderboardRes = await fetch(`${baseUrl}/${firstEnrolled.slug}/leaderboard`, { headers: studentHeaders });
    const leaderboardData: any = await leaderboardRes.json();
    assert.strictEqual(leaderboardRes.status, 200);
    assert.ok(leaderboardData.data.rankedUsers.length > 0, 'Leaderboard must have rankings');
    console.log(`✅ Passed: Loaded leaderboard with ${leaderboardData.data.rankedUsers.length} ranked aspirants.`);
    console.log(`   1st: ${leaderboardData.data.topPodium.first.name} (${leaderboardData.data.topPodium.first.points})`);

    // TEST 4: GET /api/courses/:courseId/lessons/:lessonId
    console.log('\n--- TEST 4: GET /api/courses/:courseId/lessons/:lessonId ---');
    const lessonRes = await fetch(`${baseUrl}/${firstEnrolled.slug}/lessons/${testLessonId}`, { headers: studentHeaders });
    const lessonData: any = await lessonRes.json();
    assert.strictEqual(lessonRes.status, 200);
    assert.ok(lessonData.data.lesson, 'Lesson object must exist');
    console.log(`✅ Passed: Fetched lesson '${lessonData.data.lesson.title}' (${lessonData.data.lesson.type}).`);

    // TEST 5: POST Watch Progress Heartbeat (Auto-completion >= 85%)
    console.log('\n--- TEST 5: POST Watch Progress Heartbeat ---');
    const progressRes = await fetch(`${baseUrl}/${firstEnrolled.slug}/lessons/${testLessonId}/progress`, {
      method: 'POST',
      headers: studentHeaders,
      body: JSON.stringify({ videoWatchSeconds: 1600, videoDurationSeconds: 1725 }),
    });
    const progressData: any = await progressRes.json();
    assert.strictEqual(progressRes.status, 200);
    assert.strictEqual(progressData.data.isCompleted, true);
    console.log(`✅ Passed: Watch progress saved and auto-completed (Progress: ${progressData.data.overallProgressPercent}%)`);

    // TEST 6: POST Quiz Answer Submission
    const quizLesson = await CourseLesson.findOne({ type: 'quiz' });
    if (quizLesson) {
      console.log('\n--- TEST 6: POST Quiz Answer Submission ---');
      const quizRes = await fetch(`${baseUrl}/${firstEnrolled.slug}/lessons/${quizLesson._id}/quiz-submit`, {
        method: 'POST',
        headers: studentHeaders,
        body: JSON.stringify({ answers: [0, 1] }),
      });
      const quizData: any = await quizRes.json();
      assert.strictEqual(quizRes.status, 200);
      assert.ok(quizData.data.score !== undefined, 'Quiz score must be returned');
      console.log(`✅ Passed: Quiz submitted! Scored ${quizData.data.score}/${quizData.data.totalScore} points.`);
    }

    // TEST 7: POST Like/Dislike Reaction
    console.log('\n--- TEST 7: POST Like/Dislike Reaction Toggling ---');
    // Toggle off (since seed initially had 'like')
    const toggleOffRes = await fetch(`${baseUrl}/${firstEnrolled.slug}/lessons/${testLessonId}/reaction`, {
      method: 'POST',
      headers: studentHeaders,
      body: JSON.stringify({ reactionType: 'like' }),
    });
    const toggleOffData: any = await toggleOffRes.json();
    assert.strictEqual(toggleOffRes.status, 200);
    console.log(`✅ Passed: Reaction toggled off to: ${toggleOffData.data.userReaction} (Likes: ${toggleOffData.data.likesCount})`);

    // Toggle on
    const toggleOnRes = await fetch(`${baseUrl}/${firstEnrolled.slug}/lessons/${testLessonId}/reaction`, {
      method: 'POST',
      headers: studentHeaders,
      body: JSON.stringify({ reactionType: 'like' }),
    });
    const toggleOnData: any = await toggleOnRes.json();
    assert.strictEqual(toggleOnRes.status, 200);
    assert.strictEqual(toggleOnData.data.userReaction, 'like');
    console.log(`✅ Passed: Reaction toggled on to: ${toggleOnData.data.userReaction} (Likes: ${toggleOnData.data.likesCount})`);

    // TEST 8: Threaded Comments & Replies
    console.log('\n--- TEST 8: Threaded Comments & Replies ---');
    const commentRes = await fetch(`${baseUrl}/${firstEnrolled.slug}/lessons/${testLessonId}/comments`, {
      method: 'POST',
      headers: studentHeaders,
      body: JSON.stringify({ content: 'Under Section 11, can Res Judicata be waived by mutual consent of parties?' }),
    });
    const commentData: any = await commentRes.json();
    assert.strictEqual(commentRes.status, 201);
    const newCommentId = commentData.data.id;
    assert.ok(newCommentId, 'Comment ID must be generated');
    console.log(`✅ Passed: Created top-level comment ID: ${newCommentId}`);

    // Add Reply
    const replyRes = await fetch(`${baseUrl}/${firstEnrolled.slug}/lessons/${testLessonId}/comments`, {
      method: 'POST',
      headers: studentHeaders,
      body: JSON.stringify({
        content: 'No, res judicata is a rule of public policy and jurisdiction, hence cannot be waived.',
        parentCommentId: newCommentId,
      }),
    });
    const replyData: any = await replyRes.json();
    assert.strictEqual(replyRes.status, 201);
    console.log(`✅ Passed: Posted reply to comment thread.`);

    // Like Comment
    const likeCommentRes = await fetch(`${baseUrl}/${firstEnrolled.slug}/lessons/${testLessonId}/comments/${newCommentId}/like`, {
      method: 'POST',
      headers: studentHeaders,
    });
    const likeCommentData: any = await likeCommentRes.json();
    assert.strictEqual(likeCommentRes.status, 200);
    assert.strictEqual(likeCommentData.data.isLikedByMe, true);
    console.log(`✅ Passed: Liked comment! Total likes: ${likeCommentData.data.likesCount}`);

    // TEST 9: POST Bookmark Lesson / Note
    console.log('\n--- TEST 9: POST Bookmark Lesson / Note ---');
    const bookmarkRes = await fetch(`${baseUrl}/${firstEnrolled.slug}/lessons/${testLessonId}/bookmark`, {
      method: 'POST',
      headers: studentHeaders,
    });
    const bookmarkData: any = await bookmarkRes.json();
    assert.strictEqual(bookmarkRes.status, 200);
    console.log(`✅ Passed: Bookmarked state toggled to: ${bookmarkData.data.isBookmarked}`);

    // TEST 10: Admin Course Management APIs
    console.log('\n--- TEST 10: Admin Course Management APIs ---');
    const adminCoursesRes = await fetch(`${baseUrl}/admin/all`, { headers: adminHeaders });
    const adminCoursesData: any = await adminCoursesRes.json();
    assert.strictEqual(adminCoursesRes.status, 200);
    assert.ok(adminCoursesData.data.length > 0, 'Admin courses must be returned');
    console.log(`✅ Passed: Admin retrieved ${adminCoursesData.data.length} courses with full metrics.`);

    // Admin Create Course
    const createRes = await fetch(`${baseUrl}/admin`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        title: 'Evidence Act & Bharatiya Sakshya Adhiniyam (BSA) Masterclass',
        slug: 'bsa-mastery-test',
        subtitle: 'Comparative dissection of electronic records & confessions',
        instructor: 'Adv. Rajinder Sir',
      }),
    });
    const createData: any = await createRes.json();
    assert.strictEqual(createRes.status, 201);
    const testCourseId = createData.data._id;
    console.log(`✅ Passed: Admin created new course: ${createData.data.title}`);

    // Admin Add Module
    const addModRes = await fetch(`${baseUrl}/admin/${testCourseId}/modules`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({ title: 'Module 1: Electronic Evidence Sec 61 to 65B' }),
    });
    const addModData: any = await addModRes.json();
    assert.strictEqual(addModRes.status, 201);
    console.log(`✅ Passed: Admin created module: ${addModData.data.title}`);

    // Admin Add Lesson
    const addLessonRes = await fetch(`${baseUrl}/admin/${testCourseId}/modules/${addModData.data._id}/lessons`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        title: 'Section 65B Certificate Mandate under Anvar P.V. vs P.K. Basheer',
        type: 'video',
        duration: '35 mins',
        points: 15,
      }),
    });
    const addLessonData: any = await addLessonRes.json();
    assert.strictEqual(addLessonRes.status, 201);
    // Admin Recordings Vault
    const recRes = await fetch(`${baseUrl}/admin/recordings`, { headers: adminHeaders });
    const recData: any = await recRes.json();
    assert.strictEqual(recRes.status, 200);
    assert.ok(Array.isArray(recData.data));
    console.log(`✅ Passed: Admin retrieved ${recData.data.length} video lectures from recordings vault.`);

    // Clean up test course
    const deleteRes = await fetch(`${baseUrl}/admin/${testCourseId}`, {
      method: 'DELETE',
      headers: adminHeaders,
    });
    assert.strictEqual(deleteRes.status, 200);
    console.log('✅ Passed: Cleaned up temporary test course.');

    console.log('\n================================================================');
    console.log('🎉 ALL 10 E2E CLASSROOM & COURSE LMS TESTS PASSED WITH 100% SUCCESS!');
    console.log('================================================================\n');
  } catch (error) {
    console.error('❌ E2E TEST RUN FAILED:', error);
    process.exit(1);
  } finally {
    if (server) server.close();
    await mongoose.disconnect();
    process.exit(0);
  }
}

runE2ETests();

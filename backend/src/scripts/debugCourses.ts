import connectDB, { disconnectDB } from '../config/db.js';
import User from '../models/user.model.js';
import { CourseEnrollment } from '../models/course.model.js';

async function main() {
  await connectDB();
  const dirUser = await User.findOne({ rollNo: 'RLA-DIR-001' });
  const enrollments = await CourseEnrollment.find({ userId: dirUser!._id })
    .populate('courseId')
    .populate('lastAccessedLessonId');

  console.log('Enrollments details:');
  for (const e of enrollments) {
    console.log({
      id: e._id,
      courseId: (e.courseId as any)?._id,
      slug: (e.courseId as any)?.slug,
      enrolledAt: e.enrolledAt,
      enrolledAtValid: !isNaN(new Date(e.enrolledAt).getTime()),
      overallProgressPercent: e.overallProgressPercent,
      lastLesson: (e.lastAccessedLessonId as any)?._id,
    });
  }
  await disconnectDB();
}

main().catch(console.error);

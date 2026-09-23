import mongoose, { Schema, type Document, type Types } from 'mongoose';

export type CourseStatus = 'draft' | 'published' | 'archived';
export type LessonType = 'video' | 'quiz' | 'problem' | 'document' | 'resource';
export type ReactionType = 'like' | 'dislike';

// ============================================================================
// 1. Course Schema
// ============================================================================
export interface ICertificateRule {
  minProgressPercent: number;
  minAssessmentScorePercent: number;
  certificateTitle: string;
  issuingAuthority: string;
}

export interface ILeaderboardSettings {
  isEnabled: boolean;
  pointsPerVideoMinute: number;
  pointsPerQuizCorrect: number;
  pointsPerProblemSolved: number;
}

export interface ICourse extends Document {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  shortCode?: string;
  subtitle: string;
  description: string;
  thumbnailTag: string;
  thumbnailBg: string;
  thumbnailUrl?: string;
  instructor: string;
  facultyInCharge?: Types.ObjectId;
  targetExam: string;
  category: string;
  status: CourseStatus;
  enrolledStudentsCount: number;
  totalLecturesCount: number;
  totalHours: number;
  activeBatches: string[];
  certificateRule: ICertificateRule;
  leaderboardSettings: ILeaderboardSettings;
  createdAt: Date;
  updatedAt: Date;
}

const CourseSchema = new Schema<ICourse>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, index: true },
    shortCode: { type: String, trim: true },
    subtitle: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    thumbnailTag: { type: String, default: 'JUDICIARY 360°' },
    thumbnailBg: { type: String, default: 'from-[#0a1c36] to-[#143564]' },
    thumbnailUrl: { type: String },
    instructor: { type: String, default: 'Adv. Rajinder Sir' },
    facultyInCharge: { type: Schema.Types.ObjectId, ref: 'User' },
    targetExam: { type: String, default: 'All India Judicial Services' },
    category: { type: String, default: 'Judiciary' },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'published',
      index: true,
    },
    enrolledStudentsCount: { type: Number, default: 0 },
    totalLecturesCount: { type: Number, default: 0 },
    totalHours: { type: Number, default: 0 },
    activeBatches: [{ type: String }],
    certificateRule: {
      minProgressPercent: { type: Number, default: 100 },
      minAssessmentScorePercent: { type: Number, default: 70 },
      certificateTitle: { type: String, default: 'Certificate of Excellence & Judicial Proficiency' },
      issuingAuthority: { type: String, default: 'Rajinder Law Academy Academic Council' },
    },
    leaderboardSettings: {
      isEnabled: { type: Boolean, default: true },
      pointsPerVideoMinute: { type: Number, default: 2 },
      pointsPerQuizCorrect: { type: Number, default: 10 },
      pointsPerProblemSolved: { type: Number, default: 20 },
    },
  },
  { timestamps: true }
);

export const Course = mongoose.model<ICourse>('Course', CourseSchema);

// ============================================================================
// 2. Course Module Schema
// ============================================================================
export interface ICourseModule extends Document {
  _id: Types.ObjectId;
  courseId: Types.ObjectId;
  title: string;
  order: number;
  badge?: string;
  description?: string;
  itemsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const CourseModuleSchema = new Schema<ICourseModule>(
  {
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    title: { type: String, required: true, trim: true },
    order: { type: Number, required: true, default: 0 },
    badge: { type: String, default: '' },
    description: { type: String, default: '' },
    itemsCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

CourseModuleSchema.index({ courseId: 1, order: 1 });
export const CourseModule = mongoose.model<ICourseModule>('CourseModule', CourseModuleSchema);

// ============================================================================
// 3. Course Lesson Schema
// ============================================================================
export interface IQuizItem {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  points: number;
}

export interface IProblemData {
  problemStatement: string;
  exampleInput?: string;
  exampleOutput?: string;
  modelAnswer?: string;
  hint?: string;
}

export interface IResourceFileData {
  fileName: string;
  fileUrl: string;
  fileSize?: string;
  fileType?: string;
}

export interface ICourseLesson extends Document {
  _id: Types.ObjectId;
  courseId: Types.ObjectId;
  moduleId: Types.ObjectId;
  title: string;
  type: LessonType;
  order: number;
  duration?: string;
  durationSeconds: number;
  score?: string;
  points: number;
  videoUrl?: string;
  videoThumbnail?: string;
  documentContent?: string[];
  resourceFile?: IResourceFileData;
  quizData?: IQuizItem[];
  problemData?: IProblemData;
  likesCount: number;
  dislikesCount: number;
  commentsCount: number;
  isFreePreview: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CourseLessonSchema = new Schema<ICourseLesson>(
  {
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    moduleId: { type: Schema.Types.ObjectId, ref: 'CourseModule', required: true, index: true },
    title: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['video', 'quiz', 'problem', 'document', 'resource'],
      required: true,
      default: 'video',
    },
    order: { type: Number, required: true, default: 0 },
    duration: { type: String, default: '20 mins' },
    durationSeconds: { type: Number, default: 1200 },
    score: { type: String, default: '10/10' },
    points: { type: Number, default: 10 },
    videoUrl: { type: String },
    videoThumbnail: { type: String },
    documentContent: [{ type: String }],
    resourceFile: {
      fileName: { type: String },
      fileUrl: { type: String },
      fileSize: { type: String },
      fileType: { type: String },
    },
    quizData: [
      {
        question: { type: String, required: true },
        options: [{ type: String, required: true }],
        correctIndex: { type: Number, required: true },
        explanation: { type: String, default: '' },
        points: { type: Number, default: 10 },
      },
    ],
    problemData: {
      problemStatement: { type: String },
      exampleInput: { type: String },
      exampleOutput: { type: String },
      modelAnswer: { type: String },
      hint: { type: String },
    },
    likesCount: { type: Number, default: 0 },
    dislikesCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
    isFreePreview: { type: Boolean, default: false },
  },
  { timestamps: true }
);

CourseLessonSchema.index({ moduleId: 1, order: 1 });
CourseLessonSchema.index({ courseId: 1, order: 1 });
export const CourseLesson = mongoose.model<ICourseLesson>('CourseLesson', CourseLessonSchema);

// ============================================================================
// 4. Course Enrollment Schema
// ============================================================================
export interface ICourseEnrollment extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  courseId: Types.ObjectId;
  enrolledAt: Date;
  lastAccessedLessonId?: Types.ObjectId;
  lastAccessedAt: Date;
  overallProgressPercent: number;
  completedLessonsCount: number;
  totalPointsEarned: number;
  certificateClaimed: boolean;
  certificateClaimedAt?: Date;
  certificateId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CourseEnrollmentSchema = new Schema<ICourseEnrollment>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    enrolledAt: { type: Date, default: Date.now },
    lastAccessedLessonId: { type: Schema.Types.ObjectId, ref: 'CourseLesson' },
    lastAccessedAt: { type: Date, default: Date.now },
    overallProgressPercent: { type: Number, default: 0 },
    completedLessonsCount: { type: Number, default: 0 },
    totalPointsEarned: { type: Number, default: 0 },
    certificateClaimed: { type: Boolean, default: false },
    certificateClaimedAt: { type: Date },
    certificateId: { type: String },
  },
  { timestamps: true }
);

CourseEnrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true });
export const CourseEnrollment = mongoose.model<ICourseEnrollment>(
  'CourseEnrollment',
  CourseEnrollmentSchema
);

// ============================================================================
// 5. Lesson Progress Schema
// ============================================================================
export interface ILessonProgress extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  courseId: Types.ObjectId;
  lessonId: Types.ObjectId;
  isCompleted: boolean;
  completedAt?: Date;
  videoWatchSeconds: number;
  videoDurationSeconds: number;
  quizScore: number;
  quizTotalScore: number;
  quizAttemptsCount: number;
  quizSelectedAnswers: number[];
  isBookmarked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LessonProgressSchema = new Schema<ILessonProgress>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    lessonId: { type: Schema.Types.ObjectId, ref: 'CourseLesson', required: true, index: true },
    isCompleted: { type: Boolean, default: false },
    completedAt: { type: Date },
    videoWatchSeconds: { type: Number, default: 0 },
    videoDurationSeconds: { type: Number, default: 0 },
    quizScore: { type: Number, default: 0 },
    quizTotalScore: { type: Number, default: 0 },
    quizAttemptsCount: { type: Number, default: 0 },
    quizSelectedAnswers: [{ type: Number }],
    isBookmarked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

LessonProgressSchema.index({ userId: 1, lessonId: 1 }, { unique: true });
LessonProgressSchema.index({ userId: 1, courseId: 1 });
export const LessonProgress = mongoose.model<ILessonProgress>(
  'LessonProgress',
  LessonProgressSchema
);

// ============================================================================
// 6. Lesson Reaction Schema (Like / Dislike)
// ============================================================================
export interface ILessonReaction extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  lessonId: Types.ObjectId;
  reactionType: ReactionType;
  createdAt: Date;
}

const LessonReactionSchema = new Schema<ILessonReaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    lessonId: { type: Schema.Types.ObjectId, ref: 'CourseLesson', required: true, index: true },
    reactionType: { type: String, enum: ['like', 'dislike'], required: true },
  },
  { timestamps: true }
);

LessonReactionSchema.index({ userId: 1, lessonId: 1 }, { unique: true });
export const LessonReaction = mongoose.model<ILessonReaction>(
  'LessonReaction',
  LessonReactionSchema
);

// ============================================================================
// 7. Lesson Comment Schema (Threaded Discussions)
// ============================================================================
export interface ILessonComment extends Document {
  _id: Types.ObjectId;
  courseId: Types.ObjectId;
  lessonId: Types.ObjectId;
  userId: Types.ObjectId;
  userName: string;
  userAvatar?: string;
  userRole: 'student' | 'faculty' | 'admin';
  parentCommentId?: Types.ObjectId;
  content: string;
  likesCount: number;
  likedBy: Types.ObjectId[];
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LessonCommentSchema = new Schema<ILessonComment>(
  {
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    lessonId: { type: Schema.Types.ObjectId, ref: 'CourseLesson', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    userName: { type: String, required: true },
    userAvatar: { type: String },
    userRole: { type: String, enum: ['student', 'faculty', 'admin'], default: 'student' },
    parentCommentId: { type: Schema.Types.ObjectId, ref: 'LessonComment', default: null, index: true },
    content: { type: String, required: true, trim: true },
    likesCount: { type: Number, default: 0 },
    likedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    isPinned: { type: Boolean, default: false },
  },
  { timestamps: true }
);

LessonCommentSchema.index({ lessonId: 1, createdAt: -1 });
export const LessonComment = mongoose.model<ILessonComment>('LessonComment', LessonCommentSchema);

// ============================================================================
// 8. Course Announcement Schema
// ============================================================================
export interface ICourseAnnouncement extends Document {
  _id: Types.ObjectId;
  courseId: Types.ObjectId;
  title: string;
  content: string;
  priority: 'normal' | 'urgent';
  authorName: string;
  authorRole: string;
  badge?: string;
  isPinned: boolean;
  publishedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CourseAnnouncementSchema = new Schema<ICourseAnnouncement>(
  {
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    priority: { type: String, enum: ['normal', 'urgent'], default: 'normal' },
    authorName: { type: String, default: 'Academic Desk' },
    authorRole: { type: String, default: 'Faculty' },
    badge: { type: String, default: 'COURSE UPDATE' },
    isPinned: { type: Boolean, default: false },
    publishedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

CourseAnnouncementSchema.index({ courseId: 1, publishedAt: -1 });
export const CourseAnnouncement = mongoose.model<ICourseAnnouncement>(
  'CourseAnnouncement',
  CourseAnnouncementSchema
);

// ============================================================================
// 9. Course Live Session Schema
// ============================================================================
export interface ICourseLiveSession extends Document {
  _id: Types.ObjectId;
  courseId: Types.ObjectId;
  title: string;
  facultyName: string;
  scheduledAt: Date;
  durationMinutes: number;
  joinUrl: string;
  status: 'upcoming' | 'live' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

const CourseLiveSessionSchema = new Schema<ICourseLiveSession>(
  {
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    title: { type: String, required: true },
    facultyName: { type: String, default: 'Adv. Rajinder Sir' },
    scheduledAt: { type: Date, required: true },
    durationMinutes: { type: Number, default: 60 },
    joinUrl: { type: String, default: '/dashboard/chat' },
    status: { type: String, enum: ['upcoming', 'live', 'completed'], default: 'upcoming' },
  },
  { timestamps: true }
);

CourseLiveSessionSchema.index({ courseId: 1, scheduledAt: 1 });
export const CourseLiveSession = mongoose.model<ICourseLiveSession>(
  'CourseLiveSession',
  CourseLiveSessionSchema
);

import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Users,
  ArrowRight,
  Loader2,
  RefreshCw,
  X,
  Trash2,
  Bell,
  Video,
  BarChart3,
  HelpCircle,
  FileText,
  Code2,
  Edit3,
  Upload,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import apiClient from '../../lib/apiClient';

interface AdminCourseItem {
  courseId: string;
  _id: string;
  courseTitle: string;
  subtitle?: string;
  slug: string;
  shortCode: string;
  facultyInCharge: string;
  totalStudents: number;
  activeBatches: string[];
  avgCompletionRate: number;
  totalLecturesCount: number;
  totalHours: number;
  status: string;
  createdAt: string;
}

export const CoursesAllPage: React.FC = () => {
  const [courses, setCourses] = useState<AdminCourseItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [isAddCourseModalOpen, setIsAddCourseModalOpen] = useState(false);
  const [selectedCourseForCurriculum, setSelectedCourseForCurriculum] = useState<AdminCourseItem | null>(null);
  const [curriculumData, setCurriculumData] = useState<any>(null);
  const [isLoadingCurriculum, setIsLoadingCurriculum] = useState(false);

  // Sub-modals inside Curriculum Builder
  const [isAddModuleModalOpen, setIsAddModuleModalOpen] = useState(false);
  const [selectedModuleForLesson, setSelectedModuleForLesson] = useState<string | null>(null);
  const [isAddLessonModalOpen, setIsAddLessonModalOpen] = useState(false);

  // Announcement & Analytics modals
  const [selectedCourseForAnnouncement, setSelectedCourseForAnnouncement] = useState<AdminCourseItem | null>(null);
  const [selectedCourseForLiveSession, setSelectedCourseForLiveSession] = useState<AdminCourseItem | null>(null);
  const [selectedCourseForAnalytics, setSelectedCourseForAnalytics] = useState<AdminCourseItem | null>(null);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);

  // Form states
  const [newCourse, setNewCourse] = useState({
    title: '',
    slug: '',
    shortCode: '',
    subtitle: '',
    description: '',
    instructor: 'Adv. Rajinder Sir',
    targetExam: 'All India Judicial Services (PCS-J)',
    category: 'Judiciary',
    activeBatches: 'Morning Shift (Cohort A), Evening Shift (Cohort B)',
    thumbnailTag: 'JUDICIARY 360°',
    minProgressPercent: 100,
  });

  const [newModule, setNewModule] = useState({
    title: '',
    badge: 'Core Act',
  });

  const [newLesson, setNewLesson] = useState({
    title: '',
    type: 'video' as 'video' | 'quiz' | 'problem' | 'document' | 'resource',
    duration: '25 mins',
    points: 10,
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    quizQuestion: '',
    quizOptions: ['', '', '', ''],
    quizCorrectIndex: 0,
    quizExplanation: '',
    problemStatement: '',
    exampleInput: '',
    exampleOutput: '',
    problemModelAnswer: '',
    problemHint: '',
    documentContent: '',
    resourceFileName: '',
    resourceFileUrl: '',
    resourceFileSize: '2.5 MB',
  });
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);

  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    priority: 'normal' as 'normal' | 'urgent',
    badge: 'COURSE UPDATE',
  });

  const [newLiveSession, setNewLiveSession] = useState({
    title: '',
    facultyName: 'Adv. Rajinder Sir',
    scheduledAt: '',
    durationMinutes: 60,
    joinUrl: '/dashboard/chat',
  });

  // Assign Batch state
  const [selectedCourseForBatchAssign, setSelectedCourseForBatchAssign] = useState<AdminCourseItem | null>(null);
  const [batchNameToAssign, setBatchNameToAssign] = useState('Foundation Judicial Services Batch 2025-26');
  const [isAssigningBatch, setIsAssigningBatch] = useState(false);

  // Edit Course state
  const [selectedCourseForEdit, setSelectedCourseForEdit] = useState<AdminCourseItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editSubtitle, setEditSubtitle] = useState('');
  const [editInstructor, setEditInstructor] = useState('');
  const [editBatches, setEditBatches] = useState('');
  const [editMinProgress, setEditMinProgress] = useState(100);
  const [editMinScore, setEditMinScore] = useState(70);
  const [isUpdatingCourse, setIsUpdatingCourse] = useState(false);

  const fetchCourses = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await apiClient.get('/courses/admin/all');
      if (res.data?.data) {
        setCourses(res.data.data);
      }
    } catch (err: any) {
      console.error('Failed to load courses:', err);
      setError(err?.response?.data?.message || 'Failed to load courses.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  // Open Curriculum Drawer
  const handleOpenCurriculum = async (course: AdminCourseItem) => {
    setSelectedCourseForCurriculum(course);
    try {
      setIsLoadingCurriculum(true);
      const res = await apiClient.get(`/courses/${course.slug || course.courseId}`);
      if (res.data?.data) {
        setCurriculumData(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load course modules.');
    } finally {
      setIsLoadingCurriculum(false);
    }
  };

  // Open Analytics Modal
  const handleOpenAnalytics = async (course: AdminCourseItem) => {
    setSelectedCourseForAnalytics(course);
    try {
      setIsLoadingAnalytics(true);
      const res = await apiClient.get(`/courses/admin/${course.slug || course.courseId}/analytics`);
      if (res.data?.data) {
        setAnalyticsData(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load course analytics.');
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  const handleOpenEditCourse = (course: AdminCourseItem) => {
    setSelectedCourseForEdit(course);
    setEditTitle(course.courseTitle);
    setEditSubtitle(course.subtitle || '');
    setEditInstructor(course.facultyInCharge || 'Adv. Rajinder Sir');
    setEditBatches(course.activeBatches?.join(', ') || 'Morning Shift (Cohort A)');
    setEditMinProgress(100);
    setEditMinScore(70);
  };

  const handleUpdateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseForEdit) return;
    try {
      setIsUpdatingCourse(true);
      await apiClient.put(`/courses/admin/${selectedCourseForEdit.slug || selectedCourseForEdit.courseId}`, {
        title: editTitle,
        subtitle: editSubtitle,
        instructor: editInstructor,
        activeBatches: editBatches.split(',').map((s) => s.trim()).filter(Boolean),
        certificateRule: {
          minProgressPercent: Number(editMinProgress),
          minAssessmentScorePercent: Number(editMinScore),
        },
      });
      toast.success('Course settings updated successfully!');
      setSelectedCourseForEdit(null);
      fetchCourses();
    } catch (err: any) {
      console.error('Update course failed:', err);
      toast.error(err?.response?.data?.message || 'Failed to update course.');
    } finally {
      setIsUpdatingCourse(false);
    }
  };

  const handleDeleteCourse = async (course: AdminCourseItem) => {
    if (!window.confirm(`Are you sure you want to permanently delete course "${course.courseTitle}"?`)) return;
    try {
      await apiClient.delete(`/courses/admin/${course.slug || course.courseId}`);
      toast.success(`Course "${course.courseTitle}" deleted successfully.`);
      fetchCourses();
    } catch (err: any) {
      console.error('Delete course failed:', err);
      toast.error(err?.response?.data?.message || 'Failed to delete course.');
    }
  };

  const handleAssignBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseForBatchAssign || !batchNameToAssign) return;
    try {
      setIsAssigningBatch(true);
      const res = await apiClient.post(
        `/courses/admin/${selectedCourseForBatchAssign.slug || selectedCourseForBatchAssign.courseId}/enroll-batch`,
        { batchName: batchNameToAssign }
      );
      toast.success(res.data?.message || 'Batch enrolled successfully into course!');
      setSelectedCourseForBatchAssign(null);
      fetchCourses();
    } catch (err: any) {
      console.error('Assign batch error:', err);
      toast.error(err?.response?.data?.message || 'Failed to assign batch.');
    } finally {
      setIsAssigningBatch(false);
    }
  };

  // Create Course
  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourse.title.trim() || !newCourse.slug.trim()) {
      toast.error('Please fill in course title and slug.');
      return;
    }

    try {
      const payload = {
        title: newCourse.title.trim(),
        slug: newCourse.slug.trim().toLowerCase().replace(/\s+/g, '-'),
        shortCode: newCourse.shortCode || newCourse.slug.toUpperCase(),
        subtitle: newCourse.subtitle || newCourse.title,
        description: newCourse.description,
        instructor: newCourse.instructor,
        targetExam: newCourse.targetExam,
        category: newCourse.category,
        activeBatches: newCourse.activeBatches.split(',').map((b) => b.trim()),
        thumbnailTag: newCourse.thumbnailTag,
        certificateRule: {
          minProgressPercent: Number(newCourse.minProgressPercent),
          minAssessmentScorePercent: 70,
          certificateTitle: `${newCourse.title} Proficiency Certificate`,
          issuingAuthority: 'Rajinder Law Academy Academic Council',
        },
      };

      await apiClient.post('/courses/admin', payload);
      toast.success('Course curriculum created successfully!');
      setIsAddCourseModalOpen(false);
      setNewCourse({
        title: '',
        slug: '',
        shortCode: '',
        subtitle: '',
        description: '',
        instructor: 'Adv. Rajinder Sir',
        targetExam: 'All India Judicial Services (PCS-J)',
        category: 'Judiciary',
        activeBatches: 'Morning Shift (Cohort A), Evening Shift (Cohort B)',
        thumbnailTag: 'JUDICIARY 360°',
        minProgressPercent: 100,
      });
      fetchCourses();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create course.');
    }
  };

  // Add Module to Course
  const handleAddModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModule.title.trim() || !selectedCourseForCurriculum) return;

    try {
      await apiClient.post(`/courses/admin/${selectedCourseForCurriculum.slug}/modules`, {
        title: newModule.title.trim(),
        badge: newModule.badge.trim(),
      });
      toast.success('Module added successfully!');
      setIsAddModuleModalOpen(false);
      setNewModule({ title: '', badge: 'Core Act' });
      // Refresh curriculum
      handleOpenCurriculum(selectedCourseForCurriculum);
    } catch (err: any) {
      toast.error('Failed to add module.');
    }
  };

  // Delete Module
  const handleDeleteModule = async (moduleId: string) => {
    if (!selectedCourseForCurriculum || !window.confirm('Delete this module and all its lessons?')) return;
    try {
      await apiClient.delete(`/courses/admin/${selectedCourseForCurriculum.slug}/modules/${moduleId}`);
      toast.success('Module deleted.');
      handleOpenCurriculum(selectedCourseForCurriculum);
    } catch (err) {
      toast.error('Failed to delete module.');
    }
  };

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>, targetField: 'video' | 'resource') => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingMedia(true);
      const formData = new FormData();
      formData.append('file', file);
      const res = await apiClient.post('/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const uploadedUrl = res.data?.data?.url || res.data?.url;
      if (targetField === 'video') {
        setNewLesson((prev) => ({ ...prev, videoUrl: uploadedUrl }));
        toast.success('Video uploaded to cloud storage successfully!');
      } else {
        setNewLesson((prev) => ({
          ...prev,
          resourceFileUrl: uploadedUrl,
          resourceFileName: file.name,
          resourceFileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        }));
        toast.success('Resource document uploaded successfully!');
      }
    } catch (err: any) {
      console.error('File upload failed:', err);
      toast.error('File upload failed. You can paste the direct URL.');
    } finally {
      setIsUploadingMedia(false);
    }
  };

  // Add Lesson to Module
  const handleAddLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLesson.title.trim() || !selectedCourseForCurriculum || !selectedModuleForLesson) return;

    try {
      const payload: any = {
        title: newLesson.title.trim(),
        type: newLesson.type,
        duration: newLesson.duration,
        points: Number(newLesson.points) || 10,
      };

      if (newLesson.type === 'video') {
        payload.videoUrl = newLesson.videoUrl;
      } else if (newLesson.type === 'quiz') {
        payload.quizData = [
          {
            question: newLesson.quizQuestion || newLesson.title,
            options: newLesson.quizOptions.filter((o) => o.trim().length > 0),
            correctIndex: Number(newLesson.quizCorrectIndex),
            explanation: newLesson.quizExplanation || '',
            points: Number(newLesson.points) || 10,
          },
        ];
      } else if (newLesson.type === 'problem') {
        payload.problemData = {
          problemStatement: newLesson.problemStatement || newLesson.title,
          exampleInput: newLesson.exampleInput,
          exampleOutput: newLesson.exampleOutput,
          modelAnswer: newLesson.problemModelAnswer,
          hint: newLesson.problemHint,
        };
      } else if (newLesson.type === 'document') {
        payload.documentContent = newLesson.documentContent
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean);
      } else if (newLesson.type === 'resource') {
        payload.resourceFile = {
          fileName: newLesson.resourceFileName || `${newLesson.title.replace(/\s+/g, '_')}.pdf`,
          fileUrl: newLesson.resourceFileUrl,
          fileSize: newLesson.resourceFileSize || '2.5 MB',
          fileType: 'pdf',
        };
      }

      await apiClient.post(
        `/courses/admin/${selectedCourseForCurriculum.slug}/modules/${selectedModuleForLesson}/lessons`,
        payload
      );

      toast.success('Lesson created successfully!');
      setIsAddLessonModalOpen(false);
      setNewLesson({
        title: '',
        type: 'video',
        duration: '25 mins',
        points: 10,
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        quizQuestion: '',
        quizOptions: ['', '', '', ''],
        quizCorrectIndex: 0,
        quizExplanation: '',
        problemStatement: '',
        exampleInput: '',
        exampleOutput: '',
        problemModelAnswer: '',
        problemHint: '',
        documentContent: '',
        resourceFileName: '',
        resourceFileUrl: '',
        resourceFileSize: '2.5 MB',
      });
      handleOpenCurriculum(selectedCourseForCurriculum);
      fetchCourses();
    } catch (err: any) {
      toast.error('Failed to create lesson.');
    }
  };

  // Delete Lesson
  const handleDeleteLesson = async (lessonId: string) => {
    if (!selectedCourseForCurriculum || !window.confirm('Delete this lesson?')) return;
    try {
      await apiClient.delete(`/courses/admin/${selectedCourseForCurriculum.slug}/lessons/${lessonId}`);
      toast.success('Lesson deleted.');
      handleOpenCurriculum(selectedCourseForCurriculum);
      fetchCourses();
    } catch (err) {
      toast.error('Failed to delete lesson.');
    }
  };

  // Post Announcement
  const handlePostAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnouncement.title.trim() || !newAnnouncement.content.trim() || !selectedCourseForAnnouncement) return;

    try {
      await apiClient.post(
        `/courses/admin/${selectedCourseForAnnouncement.slug}/announcements`,
        newAnnouncement
      );
      toast.success('Announcement broadcasted to enrolled cohort!');
      setSelectedCourseForAnnouncement(null);
      setNewAnnouncement({
        title: '',
        content: '',
        priority: 'normal',
        badge: 'COURSE UPDATE',
      });
    } catch (err) {
      toast.error('Failed to broadcast announcement.');
    }
  };

  // Schedule Live Session
  const handleScheduleLiveSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLiveSession.title.trim() || !newLiveSession.scheduledAt || !selectedCourseForLiveSession) return;

    try {
      await apiClient.post(
        `/courses/admin/${selectedCourseForLiveSession.slug}/live-sessions`,
        newLiveSession
      );
      toast.success('Live doubt session scheduled successfully!');
      setSelectedCourseForLiveSession(null);
      setNewLiveSession({
        title: '',
        facultyName: 'Adv. Rajinder Sir',
        scheduledAt: '',
        durationMinutes: 60,
        joinUrl: '/dashboard/chat',
      });
    } catch (err) {
      toast.error('Failed to schedule live session.');
    }
  };

  return (
    <div className="space-y-6 select-none">
      {/* Header */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C19B48]/15 border border-[#C19B48]/30 text-[#C19B48] text-xs font-semibold">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Academic Curriculum Builder</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#F7F3E6]">
            Course Offerings & Curricula Hub
          </h1>
          <p className="text-xs text-[#A8A294] max-w-2xl leading-relaxed">
            Manage comprehensive judiciary foundation courses, Bare Act specialized modules, lecture roadmaps, and academic lesson milestones.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
          <button
            onClick={fetchCourses}
            className="p-2.5 rounded-xl bg-[#262626] hover:bg-[#333333] border border-[#3D3D3D] text-[#A8A294] hover:text-[#F7F3E6] transition-colors cursor-pointer"
            title="Refresh Courses"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsAddCourseModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C19B48] hover:bg-[#D8B862] text-[#1E1E1E] text-xs font-bold transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Course Curriculum</span>
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center p-16 space-y-3">
          <Loader2 className="w-8 h-8 text-[#C19B48] animate-spin" />
          <p className="text-xs text-[#A8A294]">Loading course curricula catalog...</p>
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <div className="p-8 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center space-y-3">
          <p className="text-sm font-semibold text-rose-400">{error}</p>
          <button
            onClick={fetchCourses}
            className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold"
          >
            Retry
          </button>
        </div>
      )}

      {/* Courses Grid */}
      {!isLoading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {courses.map((course) => (
            <div
              key={course.courseId || course._id}
              className="p-6 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] hover:border-[#C19B48]/50 transition-colors space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#C19B48]/15 text-[#E8CF8D] border border-[#C19B48]/30">
                    {course.shortCode || course.slug?.toUpperCase()}
                  </span>
                  <span className="text-xs text-[#34D399] font-semibold flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {course.totalStudents} Enrolled
                  </span>
                </div>

                <div>
                  <h3 className="font-serif text-lg font-bold text-[#F7F3E6]">
                    {course.courseTitle}
                  </h3>
                  <p className="text-xs text-[#A8A294] mt-1">
                    Lead Faculty: <strong className="text-[#F7F3E6]">{course.facultyInCharge}</strong>
                  </p>
                </div>

                {/* Stats Bar */}
                <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-[#262626] border border-[#3D3D3D] text-center text-xs">
                  <div>
                    <div className="text-[10px] text-[#A8A294]">Total Lectures</div>
                    <div className="font-bold text-[#F7F3E6] font-serif">{course.totalLecturesCount}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#A8A294]">Duration</div>
                    <div className="font-bold text-[#F7F3E6] font-serif">{course.totalHours} hrs</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#A8A294]">Cohort Avg</div>
                    <div className="font-bold text-[#34D399] font-serif">{course.avgCompletionRate}%</div>
                  </div>
                </div>

                {/* Active Batches */}
                <div className="text-xs text-[#A8A294] space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Assigned Batches:
                  </div>
                  <div className="text-xs text-[#F7F3E6]">
                    {course.activeBatches?.join(' • ') || 'Morning Shift (Cohort A)'}
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="pt-3 border-t border-[#3D3D3D] flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={() => setSelectedCourseForAnnouncement(course)}
                    className="px-2.5 py-1.5 rounded-lg bg-[#262626] hover:bg-[#333333] text-[11px] font-semibold text-[#A8A294] hover:text-[#F7F3E6] flex items-center gap-1 cursor-pointer transition-colors"
                    title="Broadcast Announcement"
                  >
                    <Bell className="w-3 h-3 text-[#C19B48]" />
                    <span>Broadcast</span>
                  </button>

                  <button
                    onClick={() => setSelectedCourseForLiveSession(course)}
                    className="px-2.5 py-1.5 rounded-lg bg-[#262626] hover:bg-[#333333] text-[11px] font-semibold text-[#A8A294] hover:text-[#F7F3E6] flex items-center gap-1 cursor-pointer transition-colors"
                    title="Schedule Live Session"
                  >
                    <Video className="w-3 h-3 text-[#34D399]" />
                    <span>Live Class</span>
                  </button>

                  <button
                    onClick={() => setSelectedCourseForBatchAssign(course)}
                    className="px-2.5 py-1.5 rounded-lg bg-[#262626] hover:bg-[#333333] text-[11px] font-semibold text-[#A8A294] hover:text-[#F7F3E6] flex items-center gap-1 cursor-pointer transition-colors"
                    title="Assign Batch Cohort"
                  >
                    <Users className="w-3 h-3 text-amber-400" />
                    <span>Assign Batch</span>
                  </button>

                  <button
                    onClick={() => handleOpenAnalytics(course)}
                    className="px-2.5 py-1.5 rounded-lg bg-[#262626] hover:bg-[#333333] text-[11px] font-semibold text-[#A8A294] hover:text-[#F7F3E6] flex items-center gap-1 cursor-pointer transition-colors"
                    title="View Analytics"
                  >
                    <BarChart3 className="w-3 h-3 text-sky-400" />
                    <span>Analytics</span>
                  </button>

                  <button
                    onClick={() => handleOpenEditCourse(course)}
                    className="p-1.5 rounded-lg bg-[#262626] hover:bg-[#333333] text-[#A8A294] hover:text-[#C19B48] transition-colors cursor-pointer"
                    title="Edit Course Settings"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDeleteCourse(course)}
                    className="p-1.5 rounded-lg bg-[#262626] hover:bg-rose-500/20 text-[#A8A294] hover:text-rose-400 transition-colors cursor-pointer"
                    title="Delete Course"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  onClick={() => handleOpenCurriculum(course)}
                  className="flex items-center gap-1.5 text-xs text-[#C19B48] hover:text-[#E8CF8D] font-bold cursor-pointer shrink-0"
                >
                  <span>Edit Curriculum</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL 1: ADD COURSE CURRICULUM */}
      {isAddCourseModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-xl rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] shadow-2xl p-6 text-[#F7F3E6] animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-[#3D3D3D] mb-5">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#C19B48]" />
                <h3 className="font-serif text-lg font-bold text-[#F7F3E6]">Add Course Curriculum</h3>
              </div>
              <button
                onClick={() => setIsAddCourseModalOpen(false)}
                className="text-[#A8A294] hover:text-[#F7F3E6] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCourse} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#A8A294] mb-1">Course Title *</label>
                  <input
                    type="text"
                    required
                    value={newCourse.title}
                    onChange={(e) => {
                      const t = e.target.value;
                      setNewCourse({
                        ...newCourse,
                        title: t,
                        slug: t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
                      });
                    }}
                    placeholder="e.g. Criminal Law & BNSS Mastery"
                    className="w-full rounded-xl bg-[#262626] border border-[#3D3D3D] p-2.5 text-xs text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#A8A294] mb-1">Course Slug *</label>
                  <input
                    type="text"
                    required
                    value={newCourse.slug}
                    onChange={(e) => setNewCourse({ ...newCourse, slug: e.target.value })}
                    placeholder="e.g. bnss-mastery"
                    className="w-full rounded-xl bg-[#262626] border border-[#3D3D3D] p-2.5 text-xs text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#A8A294] mb-1">Short Code Badge</label>
                  <input
                    type="text"
                    value={newCourse.shortCode}
                    onChange={(e) => setNewCourse({ ...newCourse, shortCode: e.target.value })}
                    placeholder="e.g. BNSS 2026"
                    className="w-full rounded-xl bg-[#262626] border border-[#3D3D3D] p-2.5 text-xs text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#A8A294] mb-1">Lead Faculty</label>
                  <input
                    type="text"
                    value={newCourse.instructor}
                    onChange={(e) => setNewCourse({ ...newCourse, instructor: e.target.value })}
                    placeholder="e.g. Adv. Rajinder Sir"
                    className="w-full rounded-xl bg-[#262626] border border-[#3D3D3D] p-2.5 text-xs text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A8A294] mb-1">Subtitle / Summary</label>
                <input
                  type="text"
                  value={newCourse.subtitle}
                  onChange={(e) => setNewCourse({ ...newCourse, subtitle: e.target.value })}
                  placeholder="Comprehensive analysis of Bharatiya Nagarik Suraksha Sanhita"
                  className="w-full rounded-xl bg-[#262626] border border-[#3D3D3D] p-2.5 text-xs text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A8A294] mb-1">Active Batches</label>
                <input
                  type="text"
                  value={newCourse.activeBatches}
                  onChange={(e) => setNewCourse({ ...newCourse, activeBatches: e.target.value })}
                  placeholder="Morning Shift (Cohort A), Evening Shift (Cohort B)"
                  className="w-full rounded-xl bg-[#262626] border border-[#3D3D3D] p-2.5 text-xs text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#3D3D3D]">
                <button
                  type="button"
                  onClick={() => setIsAddCourseModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#262626] text-[#A8A294] text-xs font-bold hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#C19B48] hover:bg-[#D8B862] text-[#1E1E1E] text-xs font-bold shadow-md cursor-pointer"
                >
                  Create Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DRAWER / MODAL 2: EDIT CURRICULUM BUILDER */}
      {selectedCourseForCurriculum && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-3xl h-full bg-[#1E1E1E] border-l border-[#3D3D3D] shadow-2xl p-6 flex flex-col min-h-0 text-[#F7F3E6] animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#3D3D3D] shrink-0">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#C19B48]">
                  Curriculum Builder
                </span>
                <h2 className="font-serif text-xl font-bold text-[#F7F3E6]">
                  {selectedCourseForCurriculum.courseTitle}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsAddModuleModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-[#C19B48] hover:bg-[#D8B862] text-[#1E1E1E] text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Module</span>
                </button>
                <button
                  onClick={() => setSelectedCourseForCurriculum(null)}
                  className="p-2 rounded-xl bg-[#262626] text-[#A8A294] hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modules & Lessons List */}
            <div className="flex-1 min-h-0 overflow-y-auto pr-1 py-4 space-y-4 custom-scrollbar">
              {isLoadingCurriculum ? (
                <div className="text-center py-12 text-[#A8A294] text-xs flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#C19B48]" />
                  <span>Loading curriculum modules...</span>
                </div>
              ) : curriculumData?.modules?.length === 0 ? (
                <div className="text-center py-12 text-[#A8A294] text-xs space-y-2">
                  <BookOpen className="w-8 h-8 text-[#A8A294] mx-auto" />
                  <p>No modules added yet. Click "Add Module" to start structuring your course.</p>
                </div>
              ) : (
                curriculumData?.modules?.map((mod: any, mIdx: number) => (
                  <div
                    key={mod.id}
                    className="p-4 rounded-xl bg-[#262626] border border-[#3D3D3D] space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-[#C19B48]/15 text-[#C19B48] border border-[#C19B48]/30 flex items-center justify-center text-xs font-bold">
                          {mIdx + 1}
                        </span>
                        <h4 className="text-sm font-bold text-[#F7F3E6]">{mod.title}</h4>
                        {mod.badge && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#C19B48]/15 text-[#E8CF8D]">
                            {mod.badge}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedModuleForLesson(mod.id);
                            setIsAddLessonModalOpen(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-[#333333] hover:bg-[#444444] text-xs font-semibold text-[#F7F3E6] flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3 text-[#C19B48]" />
                          <span>Add Lesson</span>
                        </button>

                        <button
                          onClick={() => handleDeleteModule(mod.id)}
                          className="p-1 text-[#A8A294] hover:text-rose-400 cursor-pointer"
                          title="Delete Module"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Lessons inside module */}
                    <div className="space-y-1.5 pl-8 border-l border-[#3D3D3D]">
                      {mod.items?.length === 0 ? (
                        <div className="text-xs text-[#A8A294] py-1">No lessons in this module.</div>
                      ) : (
                        mod.items?.map((lessonItem: any) => (
                          <div
                            key={lessonItem.id}
                            className="p-2.5 rounded-lg bg-[#1E1E1E] border border-[#3D3D3D] flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2 truncate pr-2">
                              {lessonItem.type === 'video' ? (
                                <Video className="w-3.5 h-3.5 text-[#C19B48] shrink-0" />
                              ) : lessonItem.type === 'quiz' ? (
                                <HelpCircle className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                              ) : lessonItem.type === 'problem' ? (
                                <Code2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              ) : (
                                <FileText className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              )}
                              <span className="text-[#F7F3E6] font-medium truncate">
                                {lessonItem.title}
                              </span>
                              <span className="text-[10px] text-[#A8A294] uppercase font-bold px-1.5 py-0.2 rounded bg-[#262626]">
                                {lessonItem.type}
                              </span>
                              {lessonItem.duration && (
                                <span className="text-[10px] text-[#A8A294]">
                                  • {lessonItem.duration}
                                </span>
                              )}
                            </div>

                            <button
                              onClick={() => handleDeleteLesson(lessonItem.id)}
                              className="text-[#A8A294] hover:text-rose-400 p-1 cursor-pointer shrink-0"
                              title="Delete Lesson"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB-MODAL: ADD MODULE */}
      {isAddModuleModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] p-5 text-[#F7F3E6] space-y-4 animate-in zoom-in duration-150">
            <div className="flex justify-between items-center border-b border-[#3D3D3D] pb-3">
              <h3 className="font-bold text-sm">Add New Curriculum Module</h3>
              <button onClick={() => setIsAddModuleModalOpen(false)}>
                <X className="w-4 h-4 text-[#A8A294]" />
              </button>
            </div>
            <form onSubmit={handleAddModule} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#A8A294] mb-1">Module Title *</label>
                <input
                  type="text"
                  required
                  value={newModule.title}
                  onChange={(e) => setNewModule({ ...newModule, title: e.target.value })}
                  placeholder="e.g. Module 2: Bharatiya Nagarik Suraksha Sanhita"
                  className="w-full rounded-xl bg-[#262626] border border-[#3D3D3D] p-2.5 text-xs text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#A8A294] mb-1">Badge Tag</label>
                <input
                  type="text"
                  value={newModule.badge}
                  onChange={(e) => setNewModule({ ...newModule, badge: e.target.value })}
                  placeholder="e.g. Core Procedural Law"
                  className="w-full rounded-xl bg-[#262626] border border-[#3D3D3D] p-2.5 text-xs text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModuleModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-[#A8A294]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#C19B48] text-[#1E1E1E] text-xs font-bold cursor-pointer"
                >
                  Add Module
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUB-MODAL: ADD LESSON */}
      {isAddLessonModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] p-5 text-[#F7F3E6] space-y-4 animate-in zoom-in duration-150">
            <div className="flex justify-between items-center border-b border-[#3D3D3D] pb-3">
              <h3 className="font-bold text-sm">Add Lesson to Module</h3>
              <button onClick={() => setIsAddLessonModalOpen(false)}>
                <X className="w-4 h-4 text-[#A8A294]" />
              </button>
            </div>
            <form onSubmit={handleAddLesson} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#A8A294] mb-1">Lesson Title *</label>
                <input
                  type="text"
                  required
                  value={newLesson.title}
                  onChange={(e) => setNewLesson({ ...newLesson, title: e.target.value })}
                  placeholder="e.g. Sec 11 CPC Res Judicata Deep Dive"
                  className="w-full rounded-xl bg-[#262626] border border-[#3D3D3D] p-2.5 text-xs text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#A8A294] mb-1">Type *</label>
                  <select
                    value={newLesson.type}
                    onChange={(e) => setNewLesson({ ...newLesson, type: e.target.value as any })}
                    className="w-full rounded-xl bg-[#262626] border border-[#3D3D3D] p-2.5 text-xs text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
                  >
                    <option value="video">Video Lecture</option>
                    <option value="quiz">MCQ Assessment</option>
                    <option value="problem">Problem Runner / Case Law</option>
                    <option value="document">Document / Bare Act Notes</option>
                    <option value="resource">PDF Resource / Handout</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#A8A294] mb-1">Duration / Label</label>
                  <input
                    type="text"
                    value={newLesson.duration}
                    onChange={(e) => setNewLesson({ ...newLesson, duration: e.target.value })}
                    placeholder="25 mins"
                    className="w-full rounded-xl bg-[#262626] border border-[#3D3D3D] p-2.5 text-xs text-[#F7F3E6]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#A8A294] mb-1">Points</label>
                  <input
                    type="number"
                    value={newLesson.points}
                    onChange={(e) => setNewLesson({ ...newLesson, points: Number(e.target.value) })}
                    className="w-full rounded-xl bg-[#262626] border border-[#3D3D3D] p-2.5 text-xs text-[#F7F3E6]"
                  />
                </div>
              </div>

              {/* Type specific fields */}
              {newLesson.type === 'video' && (
                <div className="space-y-2 p-3 rounded-xl bg-[#262626] border border-[#3D3D3D]">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-[#C19B48]">Video Lecture Stream / MP4 URL</label>
                    <label className="text-[11px] text-[#34D399] hover:underline flex items-center gap-1 cursor-pointer font-semibold">
                      <Upload className="w-3 h-3" />
                      <span>{isUploadingMedia ? 'Uploading...' : 'Upload Video File'}</span>
                      <input
                        type="file"
                        accept="video/*"
                        disabled={isUploadingMedia}
                        onChange={(e) => handleUploadFile(e, 'video')}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <input
                    type="text"
                    value={newLesson.videoUrl}
                    onChange={(e) => setNewLesson({ ...newLesson, videoUrl: e.target.value })}
                    placeholder="https://commondatastorage.googleapis.com/.../video.mp4"
                    className="w-full rounded-xl bg-[#1E1E1E] border border-[#3D3D3D] p-2.5 text-xs text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
                  />
                </div>
              )}

              {newLesson.type === 'quiz' && (
                <div className="space-y-2.5 p-3 rounded-xl bg-[#262626] border border-[#3D3D3D]">
                  <label className="block text-xs font-bold text-[#C19B48]">MCQ Assessment Question Setup</label>
                  <input
                    type="text"
                    value={newLesson.quizQuestion}
                    onChange={(e) => setNewLesson({ ...newLesson, quizQuestion: e.target.value })}
                    placeholder="Question prompt (e.g. Which amendment added Secular to Preamble?)..."
                    className="w-full rounded-lg bg-[#1E1E1E] border border-[#3D3D3D] p-2 text-xs text-[#F7F3E6]"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    {[0, 1, 2, 3].map((optIdx) => (
                      <input
                        key={optIdx}
                        type="text"
                        placeholder={`Option ${optIdx + 1}`}
                        value={newLesson.quizOptions[optIdx]}
                        onChange={(e) => {
                          const opts = [...newLesson.quizOptions];
                          opts[optIdx] = e.target.value;
                          setNewLesson({ ...newLesson, quizOptions: opts });
                        }}
                        className="rounded-lg bg-[#1E1E1E] border border-[#3D3D3D] p-2 text-xs text-[#F7F3E6]"
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-2 pt-1 text-xs">
                    <span className="text-[#A8A294]">Correct Answer:</span>
                    <select
                      value={newLesson.quizCorrectIndex}
                      onChange={(e) => setNewLesson({ ...newLesson, quizCorrectIndex: Number(e.target.value) })}
                      className="rounded-lg bg-[#1E1E1E] border border-[#3D3D3D] p-1.5 text-xs text-[#C19B48] font-bold"
                    >
                      <option value={0}>Option 1</option>
                      <option value={1}>Option 2</option>
                      <option value={2}>Option 3</option>
                      <option value={3}>Option 4</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#A8A294] mb-1">
                      Statutory / Judicial Explanation (Shown to student upon submission)
                    </label>
                    <textarea
                      rows={2}
                      value={newLesson.quizExplanation}
                      onChange={(e) => setNewLesson({ ...newLesson, quizExplanation: e.target.value })}
                      placeholder="e.g. As affirmed by the Supreme Court in S.R. Bommai v. Union of India..."
                      className="w-full rounded-lg bg-[#1E1E1E] border border-[#3D3D3D] p-2 text-xs text-[#F7F3E6]"
                    />
                  </div>
                </div>
              )}

              {newLesson.type === 'problem' && (
                <div className="space-y-2.5 p-3 rounded-xl bg-[#262626] border border-[#3D3D3D]">
                  <label className="block text-xs font-bold text-emerald-400">Legal Case Problem & Drafting Scenario</label>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#A8A294] mb-1">Fact Scenario / Problem Statement</label>
                    <textarea
                      rows={3}
                      value={newLesson.problemStatement}
                      onChange={(e) => setNewLesson({ ...newLesson, problemStatement: e.target.value })}
                      placeholder="Facts of the case for student legal analysis..."
                      className="w-full rounded-xl bg-[#1E1E1E] border border-[#3D3D3D] p-2 text-xs text-[#F7F3E6]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#A8A294] mb-1">Statutory Premise / Input</label>
                      <input
                        type="text"
                        value={newLesson.exampleInput}
                        onChange={(e) => setNewLesson({ ...newLesson, exampleInput: e.target.value })}
                        placeholder="e.g. Order 6 Rule 17 CPC"
                        className="w-full rounded-lg bg-[#1E1E1E] border border-[#3D3D3D] p-2 text-xs text-[#F7F3E6]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#A8A294] mb-1">Expected Outcome / Ruling</label>
                      <input
                        type="text"
                        value={newLesson.exampleOutput}
                        onChange={(e) => setNewLesson({ ...newLesson, exampleOutput: e.target.value })}
                        placeholder="e.g. Amendment allowed before commencement of trial"
                        className="w-full rounded-lg bg-[#1E1E1E] border border-[#3D3D3D] p-2 text-xs text-[#F7F3E6]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#A8A294] mb-1">Model Answer / Bench Guidance</label>
                    <textarea
                      rows={2}
                      value={newLesson.problemModelAnswer}
                      onChange={(e) => setNewLesson({ ...newLesson, problemModelAnswer: e.target.value })}
                      placeholder="Model judicial answer formulation..."
                      className="w-full rounded-xl bg-[#1E1E1E] border border-[#3D3D3D] p-2 text-xs text-[#F7F3E6]"
                    />
                  </div>
                </div>
              )}

              {newLesson.type === 'document' && (
                <div className="space-y-2 p-3 rounded-xl bg-[#262626] border border-[#3D3D3D]">
                  <label className="block text-xs font-bold text-amber-400">
                    Bare Act Study Notes & Section Breakdown (1 step/paragraph per line)
                  </label>
                  <textarea
                    rows={4}
                    value={newLesson.documentContent}
                    onChange={(e) => setNewLesson({ ...newLesson, documentContent: e.target.value })}
                    placeholder="Step 1: Bare Act text and legislative intent&#10;Step 2: Key elements and essential ingredients&#10;Step 3: Leading High Court & Supreme Court precedents"
                    className="w-full rounded-xl bg-[#1E1E1E] border border-[#3D3D3D] p-2 text-xs text-[#F7F3E6]"
                  />
                </div>
              )}

              {newLesson.type === 'resource' && (
                <div className="space-y-2.5 p-3 rounded-xl bg-[#262626] border border-[#3D3D3D]">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-[#C19B48]">PDF Resource & Bare Act Handout</label>
                    <label className="text-[11px] text-[#34D399] hover:underline flex items-center gap-1 cursor-pointer font-semibold">
                      <Upload className="w-3 h-3" />
                      <span>{isUploadingMedia ? 'Uploading...' : 'Upload PDF'}</span>
                      <input
                        type="file"
                        accept="application/pdf"
                        disabled={isUploadingMedia}
                        onChange={(e) => handleUploadFile(e, 'resource')}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#A8A294] mb-1">File Name</label>
                    <input
                      type="text"
                      value={newLesson.resourceFileName}
                      onChange={(e) => setNewLesson({ ...newLesson, resourceFileName: e.target.value })}
                      placeholder="e.g. CPC_Order_6_Pleadings_Handout.pdf"
                      className="w-full rounded-lg bg-[#1E1E1E] border border-[#3D3D3D] p-2 text-xs text-[#F7F3E6]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#A8A294] mb-1">Downloadable PDF URL</label>
                    <input
                      type="url"
                      value={newLesson.resourceFileUrl}
                      onChange={(e) => setNewLesson({ ...newLesson, resourceFileUrl: e.target.value })}
                      placeholder="https://example.com/cpc-handout.pdf"
                      className="w-full rounded-lg bg-[#1E1E1E] border border-[#3D3D3D] p-2 text-xs text-[#F7F3E6]"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-[#3D3D3D]">
                <button
                  type="button"
                  onClick={() => setIsAddLessonModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-[#A8A294]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#C19B48] text-[#1E1E1E] text-xs font-bold cursor-pointer"
                >
                  Save Lesson
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: BROADCAST ANNOUNCEMENT */}
      {selectedCourseForAnnouncement && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] p-5 text-[#F7F3E6] space-y-4">
            <div className="flex justify-between items-center border-b border-[#3D3D3D] pb-3">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#C19B48]" />
                <h3 className="font-bold text-sm">
                  Broadcast to {selectedCourseForAnnouncement.shortCode}
                </h3>
              </div>
              <button onClick={() => setSelectedCourseForAnnouncement(null)}>
                <X className="w-4 h-4 text-[#A8A294]" />
              </button>
            </div>

            <form onSubmit={handlePostAnnouncement} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#A8A294] mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={newAnnouncement.title}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                  placeholder="e.g. Schedule for Injunctions Evaluation"
                  className="w-full rounded-xl bg-[#262626] border border-[#3D3D3D] p-2.5 text-xs text-[#F7F3E6]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A8A294] mb-1">Priority</label>
                <select
                  value={newAnnouncement.priority}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, priority: e.target.value as any })}
                  className="w-full rounded-xl bg-[#262626] border border-[#3D3D3D] p-2.5 text-xs text-[#F7F3E6]"
                >
                  <option value="normal">Normal Priority</option>
                  <option value="urgent">Urgent Alert</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A8A294] mb-1">Content</label>
                <textarea
                  rows={4}
                  required
                  value={newAnnouncement.content}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                  placeholder="Enter notice details for enrolled students..."
                  className="w-full rounded-xl bg-[#262626] border border-[#3D3D3D] p-2.5 text-xs text-[#F7F3E6]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedCourseForAnnouncement(null)}
                  className="px-3 py-1.5 rounded-lg text-xs text-[#A8A294]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#C19B48] text-[#1E1E1E] text-xs font-bold"
                >
                  Publish Announcement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: SCHEDULE LIVE SESSION */}
      {selectedCourseForLiveSession && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] p-5 text-[#F7F3E6] space-y-4">
            <div className="flex justify-between items-center border-b border-[#3D3D3D] pb-3">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-[#34D399]" />
                <h3 className="font-bold text-sm">Schedule Live Doubt Class</h3>
              </div>
              <button onClick={() => setSelectedCourseForLiveSession(null)}>
                <X className="w-4 h-4 text-[#A8A294]" />
              </button>
            </div>

            <form onSubmit={handleScheduleLiveSession} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#A8A294] mb-1">Topic / Title</label>
                <input
                  type="text"
                  required
                  value={newLiveSession.title}
                  onChange={(e) => setNewLiveSession({ ...newLiveSession, title: e.target.value })}
                  placeholder="e.g. Order 39 Injunctions Live Chamber Review"
                  className="w-full rounded-xl bg-[#262626] border border-[#3D3D3D] p-2.5 text-xs text-[#F7F3E6]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A8A294] mb-1">Faculty Name</label>
                <input
                  type="text"
                  value={newLiveSession.facultyName}
                  onChange={(e) => setNewLiveSession({ ...newLiveSession, facultyName: e.target.value })}
                  className="w-full rounded-xl bg-[#262626] border border-[#3D3D3D] p-2.5 text-xs text-[#F7F3E6]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A8A294] mb-1">Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={newLiveSession.scheduledAt}
                  onChange={(e) => setNewLiveSession({ ...newLiveSession, scheduledAt: e.target.value })}
                  className="w-full rounded-xl bg-[#262626] border border-[#3D3D3D] p-2.5 text-xs text-[#F7F3E6]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedCourseForLiveSession(null)}
                  className="px-3 py-1.5 rounded-lg text-xs text-[#A8A294]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#34D399] text-[#1E1E1E] text-xs font-bold"
                >
                  Schedule Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: COHORT ANALYTICS */}
      {selectedCourseForAnalytics && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl max-h-[85vh] rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] p-6 text-[#F7F3E6] flex flex-col min-h-0 space-y-4">
            <div className="flex justify-between items-center border-b border-[#3D3D3D] pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-sky-400" />
                <h3 className="font-serif text-base font-bold text-[#F7F3E6]">
                  Cohort Analytics: {selectedCourseForAnalytics.courseTitle}
                </h3>
              </div>
              <button onClick={() => setSelectedCourseForAnalytics(null)}>
                <X className="w-4 h-4 text-[#A8A294]" />
              </button>
            </div>

            {isLoadingAnalytics ? (
              <div className="text-center py-12 text-xs text-[#A8A294]">
                Loading enrollment analytics...
              </div>
            ) : (
              <div className="flex-1 min-h-0 overflow-y-auto space-y-4 custom-scrollbar">
                {/* 3 KPI cards */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 rounded-xl bg-[#262626] border border-[#3D3D3D]">
                    <div className="text-[10px] text-[#A8A294]">Total Enrolled</div>
                    <div className="text-base font-bold text-[#F7F3E6] font-serif">
                      {analyticsData?.totalEnrolled || 0}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#262626] border border-[#3D3D3D]">
                    <div className="text-[10px] text-[#A8A294]">In Progress</div>
                    <div className="text-base font-bold text-[#C19B48] font-serif">
                      {analyticsData?.inProgressCount || 0}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#262626] border border-[#3D3D3D]">
                    <div className="text-[10px] text-[#A8A294]">Completed (100%)</div>
                    <div className="text-base font-bold text-[#34D399] font-serif">
                      {analyticsData?.completedCount || 0}
                    </div>
                  </div>
                </div>

                {/* Students list table */}
                <div className="rounded-xl border border-[#3D3D3D] bg-[#262626] overflow-hidden">
                  <div className="grid grid-cols-12 px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider text-[#A8A294] border-b border-[#3D3D3D]">
                    <div className="col-span-5">Student</div>
                    <div className="col-span-3 text-center">Progress</div>
                    <div className="col-span-4 text-right">Points / Status</div>
                  </div>

                  <div className="divide-y divide-[#333333]">
                    {analyticsData?.students?.map((s: any) => (
                      <div key={s.id} className="grid grid-cols-12 items-center px-3.5 py-2.5 text-xs">
                        <div className="col-span-5 truncate">
                          <div className="font-bold text-[#F7F3E6] truncate">{s.student?.name || 'Aspirant'}</div>
                          <div className="text-[10px] text-[#A8A294] font-mono">{s.student?.rollNo}</div>
                        </div>
                        <div className="col-span-3 text-center">
                          <span className="font-bold text-[#C19B48]">{s.progressPercent}%</span>
                        </div>
                        <div className="col-span-4 text-right">
                          <span className="font-mono text-[#34D399] font-bold">{s.totalPointsEarned} pts</span>
                          {s.certificateClaimed && (
                            <span className="block text-[9px] text-emerald-400 font-bold">
                              ✓ Certificate Issued
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 6: ASSIGN BATCH TO COURSE */}
      {selectedCourseForBatchAssign && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-md rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] p-6 text-[#F7F3E6] shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#3D3D3D]">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-400" />
                <h3 className="font-serif font-bold text-lg text-[#F7F3E6]">Assign Cohort / Batch</h3>
              </div>
              <button
                onClick={() => setSelectedCourseForBatchAssign(null)}
                className="text-[#A8A294] hover:text-[#F7F3E6] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignBatch} className="space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-[#262626] border border-[#3D3D3D] space-y-1">
                <div className="text-[10px] uppercase font-bold text-[#A8A294]">Target Course</div>
                <div className="text-sm font-serif font-bold text-[#F7F3E6]">
                  {selectedCourseForBatchAssign.courseTitle}
                </div>
                <div className="text-[11px] text-[#C19B48]">
                  Currently enrolled: {selectedCourseForBatchAssign.totalStudents} students
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#A8A294] mb-1">Batch / Cohort Name *</label>
                <input
                  type="text"
                  value={batchNameToAssign}
                  onChange={(e) => setBatchNameToAssign(e.target.value)}
                  placeholder="e.g. Foundation Judicial Services Batch 2025-26"
                  className="w-full p-2.5 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] focus:outline-hidden focus:border-[#C19B48]"
                  required
                />
                <p className="text-[10px] text-[#A8A294] mt-1">
                  All active enrolled students in this batch will be enrolled into this curriculum.
                </p>
              </div>

              <div className="pt-3 border-t border-[#3D3D3D] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedCourseForBatchAssign(null)}
                  className="px-4 py-2 rounded-xl bg-[#262626] hover:bg-[#333333] text-[#A8A294] text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAssigningBatch}
                  className="px-5 py-2 rounded-xl bg-[#C19B48] hover:bg-[#D8B862] text-[#1E1E1E] text-xs font-bold transition-colors cursor-pointer flex items-center gap-2"
                >
                  {isAssigningBatch && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Enroll Batch</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 7: EDIT COURSE SETTINGS */}
      {selectedCourseForEdit && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-xl rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] p-6 text-[#F7F3E6] shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#3D3D3D]">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-[#C19B48]" />
                <h3 className="font-serif font-bold text-lg text-[#F7F3E6]">Edit Course Settings</h3>
              </div>
              <button
                onClick={() => setSelectedCourseForEdit(null)}
                className="text-[#A8A294] hover:text-[#F7F3E6] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateCourse} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#A8A294] mb-1">Course Title *</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] focus:outline-hidden focus:border-[#C19B48]"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-[#A8A294] mb-1">Course Subtitle</label>
                <input
                  type="text"
                  value={editSubtitle}
                  onChange={(e) => setEditSubtitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] focus:outline-hidden focus:border-[#C19B48]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-[#A8A294] mb-1">Lead Faculty</label>
                  <input
                    type="text"
                    value={editInstructor}
                    onChange={(e) => setEditInstructor(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] focus:outline-hidden focus:border-[#C19B48]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#A8A294] mb-1">Active Batches (comma-sep)</label>
                  <input
                    type="text"
                    value={editBatches}
                    onChange={(e) => setEditBatches(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] focus:outline-hidden focus:border-[#C19B48]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-[#A8A294] mb-1">Certificate Min Progress (%)</label>
                  <input
                    type="number"
                    value={editMinProgress}
                    onChange={(e) => setEditMinProgress(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] focus:outline-hidden focus:border-[#C19B48]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#A8A294] mb-1">Certificate Min Score (%)</label>
                  <input
                    type="number"
                    value={editMinScore}
                    onChange={(e) => setEditMinScore(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] focus:outline-hidden focus:border-[#C19B48]"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#3D3D3D] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedCourseForEdit(null)}
                  className="px-4 py-2 rounded-xl bg-[#262626] hover:bg-[#333333] text-[#A8A294] text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingCourse}
                  className="px-5 py-2 rounded-xl bg-[#C19B48] hover:bg-[#D8B862] text-[#1E1E1E] text-xs font-bold transition-colors cursor-pointer flex items-center gap-2"
                >
                  {isUpdatingCourse && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

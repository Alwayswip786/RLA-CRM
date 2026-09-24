import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  Trophy,
  Award,
  Bookmark,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Bell,
  PanelRightClose,
  PanelRightOpen,
  Share2,
  Lock,
  FileText,
  Play,
  HelpCircle,
  Code2,
  Download,
  Sparkles,
  Loader2,
  Check,
} from 'lucide-react';
import { toast } from '../../../lib/toast';
import { ThemeSwitcher } from '../../../components/dashboard/ThemeSwitcher';
import apiClient from '../../../lib/apiClient';
import { CourseDetailSkeleton } from '../../../components/ui/skeleton';
import { UnderlineTabs } from '../../../components/ui/tabs';

interface LessonSubItem {
  id: string;
  title: string;
  type: 'video' | 'quiz' | 'problem' | 'document' | 'resource' | 'lecture';
  duration?: string;
  completed?: boolean;
  score?: string;
  userScore?: number;
  url?: string;
  isBookmarked?: boolean;
  points?: number;
}

interface ModuleItem {
  id: string;
  title: string;
  isCompleted?: boolean;
  badge?: string;
  items: LessonSubItem[];
}

interface LeaderboardUser {
  rank: number;
  name: string;
  points: string;
  avatarColor: string;
  isCurrent?: boolean;
  avatarUrl?: string;
}

interface CourseData {
  id: string;
  _id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  instructor: string;
  targetExam: string;
  category: string;
  totalLecturesCount: number;
  totalHours: number;
  enrolledDate: string;
  overallProgressPercent: number;
  completedLessonsCount: number;
  lastAccessedLessonId?: string;
}

interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  priority: 'normal' | 'urgent';
  authorName: string;
  authorRole: string;
  badge?: string;
  isPinned?: boolean;
  publishedAt: string;
}

interface LiveSessionItem {
  id: string;
  title: string;
  facultyName: string;
  scheduledAt: string;
  durationMinutes: number;
  joinUrl: string;
  status: string;
}

interface CertificateInfo {
  isEligible: boolean;
  claimed: boolean;
  claimedAt?: string;
  certificateId?: string;
  minProgressPercent: number;
  currentProgressPercent: number;
  title?: string;
  issuingAuthority?: string;
}

interface BookmarkedLesson {
  lessonId: string;
  title: string;
  type: string;
  moduleId: string;
}

export const CourseDetailPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  // Data states
  const [course, setCourse] = useState<CourseData | null>(null);
  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [liveSession, setLiveSession] = useState<LiveSessionItem | null>(null);
  const [certificate, setCertificate] = useState<CertificateInfo | null>(null);
  const [bookmarkedLessons, setBookmarkedLessons] = useState<BookmarkedLesson[]>([]);

  // Leaderboard states
  const [topPodium, setTopPodium] = useState<{
    first: any;
    second: any;
    third: any;
  }>({
    first: { name: 'Adv. Vaibhav', points: '26.22k points', initial: 'V' },
    second: { name: 'Adv. Abhima', points: '26.2k points' },
    third: { name: 'Adv. Krishna', points: '25.05k points' },
  });
  const [rankedUsers, setRankedUsers] = useState<LeaderboardUser[]>([]);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'modules' | 'announcements'>('modules');
  const [activeRightTab, setActiveRightTab] = useState<'leaderboard' | 'certificate' | 'bookmarks'>('leaderboard');
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  const [isClaimingCert, setIsClaimingCert] = useState(false);

  const fetchCourseData = async () => {
    if (!courseId) return;
    try {
      setIsLoading(true);
      setError(null);

      // Fetch course detail + leaderboard in parallel
      const [detailRes, leaderboardRes] = await Promise.all([
        apiClient.get(`/courses/${courseId}`),
        apiClient.get(`/courses/${courseId}/leaderboard`).catch(() => ({ data: { data: null } })),
      ]);

      if (detailRes.data?.data) {
        const { course: c, modules: m, announcements: a, liveSession: ls, certificate: cert, bookmarkedLessons: bm } =
          detailRes.data.data;
        setCourse(c);
        setModules(m || []);
        setAnnouncements(a || []);
        setLiveSession(ls || null);
        setCertificate(cert || null);
        setBookmarkedLessons(bm || []);

        // Expand first two modules by default
        const initExpanded: Record<string, boolean> = {};
        (m || []).forEach((mod: ModuleItem, idx: number) => {
          initExpanded[mod.id] = idx < 2;
        });
        setExpandedModules(initExpanded);
      }

      if (leaderboardRes.data?.data) {
        const { topPodium: tp, rankedUsers: ru } = leaderboardRes.data.data;
        if (tp) setTopPodium(tp);
        if (ru) setRankedUsers(ru);
      }
    } catch (err: any) {
      console.error('Failed to load course details:', err);
      setError(err?.response?.data?.message || 'Failed to load course details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCourseData();
  }, [courseId]);

  const toggleModule = (id: string) => {
    setExpandedModules((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleLessonLaunch = (lessonId: string) => {
    navigate(`/dashboard/courses/${courseId || course?.slug}/learn/${lessonId}`);
  };

  const handleResourceOpen = (resTitle: string, url?: string) => {
    if (url && url.startsWith('http')) {
      window.open(url, '_blank');
    } else {
      toast.success(`Accessing resource: ${resTitle}`);
    }
  };

  const handleClaimCertificate = async () => {
    if (!courseId) return;
    try {
      setIsClaimingCert(true);
      const res = await apiClient.post(`/courses/${courseId}/claim-certificate`);
      if (res.data?.data) {
        toast.success(res.data.message || 'Certificate claimed successfully!');
        setCertificate((prev) =>
          prev
            ? {
                ...prev,
                claimed: true,
                claimedAt: res.data.data.claimedAt,
                certificateId: res.data.data.certificateId,
              }
            : null
        );
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to claim certificate.');
    } finally {
      setIsClaimingCert(false);
    }
  };

  const renderItemIcon = (type: string) => {
    switch (type) {
      case 'video':
      case 'lecture':
        return <Play className="w-4 h-4 text-[#c19b48] dark:text-[#e8cf8d] shrink-0" />;
      case 'quiz':
        return <HelpCircle className="w-4 h-4 text-sky-500 shrink-0" />;
      case 'problem':
        return <Code2 className="w-4 h-4 text-emerald-500 shrink-0" />;
      case 'document':
        return <FileText className="w-4 h-4 text-amber-500 shrink-0" />;
      case 'resource':
        return <Download className="w-4 h-4 text-rose-500 shrink-0" />;
      default:
        return <BookOpen className="w-4 h-4 text-[#c19b48] shrink-0" />;
    }
  };

  if (isLoading) {
    return <CourseDetailSkeleton />;
  }

  if (error || !course) {
    return (
      <div className="h-screen max-h-screen bg-[#F7F3E6] dark:bg-[#040b14] text-slate-900 dark:text-slate-100 p-6 flex items-center justify-center">
        <div className="max-w-md w-full p-8 rounded-2xl bg-white dark:bg-[#0b1322] border border-slate-200 dark:border-[#16253d] text-center space-y-4 shadow-xl">
          <BookOpen className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-lg font-serif font-bold text-slate-900 dark:text-white">
            Failed to Load Course
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400">{error || 'Course could not be found.'}</p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => navigate('/dashboard/courses')}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#16253d] text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200"
            >
              Back to Courses
            </button>
            <button
              onClick={fetchCourseData}
              className="px-4 py-2 rounded-xl bg-[#c19b48] text-[#061120] text-xs font-semibold hover:bg-[#d8b862]"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentTitle = course.title || 'Course Curriculum';
  const progressPercent = course.overallProgressPercent || 0;
  const firstLessonId = modules[0]?.items[0]?.id || modules[1]?.items[0]?.id;
  const continueLessonId = course.lastAccessedLessonId || firstLessonId;

  return (
    <div className="min-h-[100dvh] lg:h-screen lg:max-h-screen bg-[#F7F3E6] dark:bg-[#040b14] text-slate-900 dark:text-slate-100 p-2.5 sm:p-3.5 lg:p-4 transition-colors flex flex-col overflow-y-auto lg:overflow-hidden">
      <div className="max-w-[1600px] w-full mx-auto flex-1 flex flex-col space-y-2.5 animate-in fade-in duration-200 min-h-0">
        {/* Top Header Card */}
        <div className="rounded-2xl bg-white dark:bg-[#0b1322] border border-slate-200 dark:border-[#16253d] p-3.5 sm:p-4 shadow-xs transition-colors shrink-0">
          {/* Back Link, Title & Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
            <button
              type="button"
              onClick={() => navigate('/dashboard/courses')}
              className="flex items-center gap-2.5 text-base sm:text-lg font-serif font-bold text-slate-900 dark:text-slate-100 hover:text-[#c19b48] transition-colors group cursor-pointer text-left min-w-0"
            >
              <ArrowLeft className="w-5 h-5 text-slate-500 dark:text-slate-400 group-hover:-translate-x-1 transition-transform shrink-0" />
              <span className="truncate">{currentTitle}</span>
            </button>

            <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
              <ThemeSwitcher />

              {continueLessonId && (
                <button
                  type="button"
                  onClick={() => handleLessonLaunch(continueLessonId)}
                  className="px-4 py-2 rounded-xl bg-[#c19b48] hover:bg-[#d8b862] text-[#061120] text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs hover:shadow-md cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-[#061120]" />
                  <span>Resume Learning</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast.success('Course syllabus link copied!');
                }}
                className="p-2 rounded-xl bg-slate-100 dark:bg-[#111c30] text-slate-600 dark:text-slate-300 hover:text-[#c19b48] hover:bg-slate-200 dark:hover:bg-[#16253d] transition-colors cursor-pointer border border-slate-200/60 dark:border-[#16253d]"
                title="Share Course Link"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Progress Bar & Metrics */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold mb-2">
              <span className="text-[#c19b48] dark:text-[#e8cf8d] font-semibold tracking-wide">
                {progressPercent}% Syllabus Complete
              </span>
              <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                Target: {certificate?.minProgressPercent || 100}% for Certification
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 bg-slate-100 dark:bg-[#15233c] rounded-full overflow-hidden mb-3 border border-slate-200/50 dark:border-[#1e3458]/40">
              <div
                className="h-full bg-gradient-to-r from-[#c19b48] to-[#e8cf8d] rounded-full transition-all duration-700 shadow-xs"
                style={{ width: `${Math.min(100, progressPercent)}%` }}
              />
            </div>

            {/* Metric Stats Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs font-medium">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#070d18] border border-slate-200 dark:border-[#16253d]">
                <div className="text-[10px] text-slate-500 dark:text-slate-400">Total Modules</div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {modules.length} Modules
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#070d18] border border-slate-200 dark:border-[#16253d]">
                <div className="text-[10px] text-slate-500 dark:text-slate-400">Completed Lessons</div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {course.completedLessonsCount} / {course.totalLecturesCount || 40}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#070d18] border border-slate-200 dark:border-[#16253d]">
                <div className="text-[10px] text-slate-500 dark:text-slate-400">Lead Faculty</div>
                <div className="text-xs font-bold text-[#c19b48] dark:text-[#e8cf8d] truncate">
                  {course.instructor}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#070d18] border border-slate-200 dark:border-[#16253d]">
                <div className="text-[10px] text-slate-500 dark:text-slate-400">Enrolled On</div>
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">
                  {course.enrolledDate}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#070d18] border border-slate-200 dark:border-[#16253d]">
                <div className="text-[10px] text-slate-500 dark:text-slate-400">Upcoming Doubt Class</div>
                <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 truncate">
                  {liveSession ? 'Scheduled' : 'Weekly Live'}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#070d18] border border-slate-200 dark:border-[#16253d]">
                <div className="text-[10px] text-slate-500 dark:text-slate-400">Certificate Status</div>
                <div className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  {certificate?.claimed ? (
                    <span className="text-emerald-500 font-bold flex items-center gap-1">
                      <Award className="w-3 h-3" /> Issued
                    </span>
                  ) : certificate?.isEligible ? (
                    <span className="text-[#c19b48] font-bold flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Unlocked!
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Lock className="w-3 h-3 text-amber-500" />
                      {Math.max(0, (certificate?.minProgressPercent || 100) - progressPercent)}% to unlock
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Dual-Column Grid */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-2.5 min-h-0 lg:overflow-hidden items-stretch">
          {/* Left Column: Modules & Announcements */}
          <div
            className={`${
              isRightSidebarOpen
                ? 'lg:col-span-7 xl:col-span-7 2xl:col-span-7'
                : 'lg:col-span-11 xl:col-span-11'
            } flex flex-col min-h-0 lg:h-full lg:overflow-hidden`}
          >
            <div className="flex-1 rounded-2xl bg-white dark:bg-[#0b1322] border border-slate-200 dark:border-[#16253d] p-3.5 sm:p-4 shadow-xs transition-colors flex flex-col min-h-0 lg:overflow-hidden">
              {/* Top Navigation Tabs */}
              <UnderlineTabs<'modules' | 'announcements'>
                value={activeTab}
                onChange={setActiveTab}
                className="mb-3"
                items={[
                  {
                    id: 'modules',
                    label: `All Modules (${modules.length})`,
                    shortLabel: `Modules (${modules.length})`,
                    icon: <BookOpen className="w-4 h-4" />,
                  },
                  {
                    id: 'announcements',
                    label: 'Announcements',
                    shortLabel: 'Announcements',
                    icon: <Bell className="w-4 h-4" />,
                    badge: announcements.length > 0 ? announcements.length : undefined,
                    badgeVariant: 'gold',
                  },
                ]}
              />

              {/* Tab: All Modules Accordions */}
              {activeTab === 'modules' && (
                <div className="flex-1 min-h-0 overflow-y-auto pr-1.5 custom-scrollbar space-y-2.5">
                  {modules.map((mod) => {
                    const isOpen = !!expandedModules[mod.id];
                    return (
                      <div
                        key={mod.id}
                        className="rounded-xl border border-slate-200 dark:border-[#16253d] bg-slate-50 dark:bg-[#070d18] overflow-hidden transition-colors"
                      >
                        {/* Accordion Header */}
                        <button
                          type="button"
                          onClick={() => toggleModule(mod.id)}
                          className="w-full flex items-center justify-between p-3.5 text-left hover:bg-slate-100 dark:hover:bg-[#0d182b] transition-colors cursor-pointer"
                        >
                          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 pr-2">
                            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                              {mod.title}
                            </span>
                            {mod.badge && (
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  mod.badge === 'Completed'
                                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                    : 'bg-[#c19b48]/15 text-[#c19b48] dark:text-[#e8cf8d] border border-[#c19b48]/30'
                                }`}
                              >
                                {mod.badge}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-slate-400 shrink-0">
                            <span className="text-xs text-slate-400">
                              {mod.items.length} {mod.items.length === 1 ? 'item' : 'items'}
                            </span>
                            {isOpen ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </div>
                        </button>

                        {/* Accordion Items Body */}
                        {isOpen && (
                          <div className="border-t border-slate-200 dark:border-[#16253d] divide-y divide-slate-200 dark:divide-[#131f33] bg-white dark:bg-[#0b1322]">
                            {mod.items.map((item) => (
                              <div
                                key={item.id}
                                className="flex items-center justify-between p-3 sm:px-4 hover:bg-slate-50 dark:hover:bg-[#0e192c] transition-colors group"
                              >
                                <div
                                  onClick={() => {
                                    if (item.type === 'resource') {
                                      handleResourceOpen(item.title, item.url);
                                    } else {
                                      handleLessonLaunch(item.id);
                                    }
                                  }}
                                  className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                                >
                                  {/* Icon */}
                                  {renderItemIcon(item.type)}

                                  {/* Title & Type Badge */}
                                  <div className="min-w-0 flex-1">
                                    <h4 className="text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100 group-hover:text-[#c19b48] transition-colors truncate">
                                      {item.title}
                                    </h4>
                                    <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                                      <span className="capitalize font-semibold text-slate-600 dark:text-slate-300">
                                        {item.type}
                                      </span>
                                      {item.duration && (
                                        <>
                                          <span>•</span>
                                          <span>{item.duration}</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Right Score & Status */}
                                <div className="flex items-center gap-3 shrink-0">
                                  {item.score && (
                                    <span className="text-[11px] font-semibold text-[#c19b48] dark:text-[#e8cf8d] bg-[#c19b48]/10 px-2 py-0.5 rounded border border-[#c19b48]/20">
                                      {item.score}
                                    </span>
                                  )}

                                  {item.completed ? (
                                    <span
                                      className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400"
                                      title="Lesson Completed"
                                    >
                                      <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-500/20" />
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleLessonLaunch(item.id)}
                                      className="text-xs font-semibold text-slate-500 hover:text-[#c19b48] transition-colors"
                                    >
                                      Start
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Tab: Announcements */}
              {activeTab === 'announcements' && (
                <div className="flex-1 min-h-0 overflow-y-auto pr-1.5 custom-scrollbar space-y-3 py-1">
                  {announcements.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-xs">
                      No announcements posted for this course yet.
                    </div>
                  ) : (
                    announcements.map((a) => (
                      <div
                        key={a.id}
                        className={`p-4 rounded-xl border transition-colors ${
                          a.priority === 'urgent'
                            ? 'bg-amber-500/5 dark:bg-[#c19b48]/10 border-[#c19b48]/40'
                            : 'bg-slate-50 dark:bg-[#070d18] border-slate-200 dark:border-[#16253d]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#c19b48] dark:text-[#e8cf8d]">
                              {a.authorName} ({a.authorRole})
                            </span>
                            {a.priority === 'urgent' && (
                              <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-rose-500 text-white">
                                URGENT
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500">
                            {new Date(a.publishedAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">
                          {a.title}
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                          {a.content}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Tab View & Icon Rail (Leaderboard / Certificates / Bookmarks) */}
          <div
            className={`${
              isRightSidebarOpen
                ? 'lg:col-span-5 xl:col-span-5 2xl:col-span-5'
                : 'lg:col-span-1 xl:col-span-1'
            } flex gap-2 min-w-0 min-h-0 h-full overflow-hidden`}
          >
            {/* Main Card Content */}
            {isRightSidebarOpen && (
              <div className="flex-1 rounded-2xl bg-white dark:bg-[#0b1322] border border-slate-200 dark:border-[#16253d] p-3.5 sm:p-4 shadow-xs min-w-0 transition-colors overflow-hidden flex flex-col min-h-0 h-full">
                {/* TAB 1: LEADERBOARD */}
                {activeRightTab === 'leaderboard' && (
                  <div className="flex-1 flex flex-col min-h-0">
                    {/* Title & Badge */}
                    <div className="flex items-center justify-between mb-3 shrink-0">
                      <div className="flex items-center gap-2 text-sm font-semibold text-[#c19b48] dark:text-[#e8cf8d]">
                        <Trophy className="w-4 h-4" />
                        <span>Cohort Leaderboard</span>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#131f33] text-slate-600 dark:text-slate-300">
                        {rankedUsers.length} Aspirants
                      </span>
                    </div>

                    {/* Top 3 Podium visualization */}
                    <div className="flex items-end justify-center gap-2 sm:gap-3 mb-3.5 pt-1 px-1 w-full max-w-full shrink-0">
                      {/* 2nd Place */}
                      <div className="flex-1 min-w-0 max-w-[95px] flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full border-2 border-amber-400 overflow-hidden bg-amber-500/20 flex items-center justify-center text-amber-700 dark:text-amber-200 font-bold text-xs mb-1.5 shadow-xs shrink-0">
                          {topPodium.second.name.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-200 mb-2 truncate max-w-full text-center px-0.5">
                          {topPodium.second.name}
                        </span>
                        <div className="w-full h-24 bg-[#fde047] text-slate-950 rounded-t-xl flex flex-col items-center justify-center p-1 shadow-md">
                          <span className="text-xs font-bold">2nd</span>
                          <span className="text-[10px] font-semibold text-slate-800 truncate">
                            {topPodium.second.points}
                          </span>
                        </div>
                      </div>

                      {/* 1st Place */}
                      <div className="flex-1 min-w-0 max-w-[105px] flex flex-col items-center -mt-4 z-10">
                        <div className="w-12 h-12 rounded-full bg-pink-600 border-2 border-sky-400 flex items-center justify-center text-white font-bold text-sm mb-1.5 shadow-lg shrink-0">
                          {topPodium.first.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 mb-2 truncate max-w-full text-center px-0.5">
                          {topPodium.first.name}
                        </span>
                        <div className="w-full h-32 bg-[#93c5fd] text-slate-950 rounded-t-xl flex flex-col items-center justify-center p-1 shadow-lg relative">
                          <Trophy className="w-5 h-5 text-white mb-1 drop-shadow-xs" />
                          <span className="text-sm font-extrabold">1st</span>
                          <span className="text-[10px] font-bold text-slate-800 truncate">
                            {topPodium.first.points}
                          </span>
                        </div>
                      </div>

                      {/* 3rd Place */}
                      <div className="flex-1 min-w-0 max-w-[95px] flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full border-2 border-amber-400 overflow-hidden bg-amber-500/20 flex items-center justify-center text-amber-700 dark:text-amber-200 font-bold text-xs mb-1.5 shadow-xs shrink-0">
                          {topPodium.third.name.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-200 mb-2 truncate max-w-full text-center px-0.5">
                          {topPodium.third.name}
                        </span>
                        <div className="w-full h-20 bg-[#fed7aa] text-slate-950 rounded-t-xl flex flex-col items-center justify-center p-1 shadow-md">
                          <span className="text-xs font-bold">3rd</span>
                          <span className="text-[10px] font-semibold text-slate-800 truncate">
                            {topPodium.third.points}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Leaderboard Table */}
                    <div className="flex-1 flex flex-col min-h-0 rounded-xl border border-slate-200 dark:border-[#16253d] bg-slate-50 dark:bg-[#070d18] overflow-hidden transition-colors">
                      <div className="grid grid-cols-12 px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-[#0e192c] border-b border-slate-200 dark:border-[#16253d] shrink-0">
                        <div className="col-span-6">Name</div>
                        <div className="col-span-3 text-center">Rank</div>
                        <div className="col-span-3 text-right">Points</div>
                      </div>

                      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar divide-y divide-slate-200 dark:divide-[#131f33]">
                        {rankedUsers.map((u) => (
                          <div
                            key={u.rank}
                            className={`grid grid-cols-12 items-center px-3.5 py-2.5 text-xs transition-colors ${
                              u.isCurrent
                                ? 'bg-amber-500/10 dark:bg-[#c19b48]/15 text-amber-950 dark:text-[#e8cf8d] font-medium border-l-2 border-[#c19b48]'
                                : 'hover:bg-slate-100 dark:hover:bg-[#0d182b] text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <div className="col-span-6 flex items-center gap-2 min-w-0 pr-1">
                              <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 ${u.avatarColor}`}
                              >
                                {u.name.charAt(0)}
                              </div>
                              <span className="truncate">{u.name}</span>
                            </div>
                            <div className="col-span-3 text-center font-semibold text-slate-700 dark:text-slate-300">
                              #{u.rank}
                            </div>
                            <div className="col-span-3 text-right font-medium text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                              {u.points}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: CERTIFICATES */}
                {activeRightTab === 'certificate' && (
                  <div className="flex-1 flex flex-col min-h-0">
                    <div className="flex items-center gap-2 text-sm font-semibold text-[#c19b48] dark:text-[#e8cf8d] mb-4 shrink-0">
                      <Award className="w-4 h-4" />
                      <span>Verified Certificates</span>
                    </div>

                    <div className="flex-1 min-h-0 overflow-y-auto pr-1 custom-scrollbar space-y-4">
                      {/* Course Certificate Card */}
                      <div className="rounded-xl border border-slate-200 dark:border-[#16253d] bg-slate-50 dark:bg-[#070d18] p-4 flex flex-col gap-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-[#c19b48]/15 text-[#c19b48] dark:text-[#e8cf8d] border border-[#c19b48]/30 mb-1">
                              Target: {certificate?.minProgressPercent || 100}% Syllabus
                            </span>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                              {certificate?.title || 'Certificate of Judicial Excellence'}
                            </h4>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              Issued by {certificate?.issuingAuthority || 'Rajinder Law Academy Academic Council'}
                            </p>
                          </div>
                          {certificate?.claimed ? (
                            <span className="px-2 py-1 rounded bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1">
                              <Check className="w-3 h-3" /> Claimed
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded bg-amber-500/15 text-[#c19b48] border border-amber-500/30 text-[10px] font-bold">
                              {certificate?.isEligible ? 'Unlocked' : 'Locked'}
                            </span>
                          )}
                        </div>

                        {/* Visual Progress toward Certificate */}
                        <div className="space-y-1 pt-1">
                          <div className="flex justify-between text-[11px] text-slate-500">
                            <span>Your Progress: {progressPercent}%</span>
                            <span>Target: {certificate?.minProgressPercent || 100}%</span>
                          </div>
                          <div className="w-full h-2 bg-slate-200 dark:bg-[#14233c] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-[#c19b48] to-[#e8cf8d] rounded-full"
                              style={{
                                width: `${Math.min(
                                  100,
                                  (progressPercent / (certificate?.minProgressPercent || 100)) * 100
                                )}%`,
                              }}
                            />
                          </div>
                        </div>

                        {/* Claim or Status Button */}
                        <div className="pt-2 border-t border-slate-200 dark:border-[#16253d]">
                          {certificate?.claimed ? (
                            <div className="space-y-1.5">
                              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs">
                                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">
                                  Official Certificate ID
                                </div>
                                <div className="font-mono text-xs font-bold text-slate-900 dark:text-white mt-0.5">
                                  {certificate.certificateId}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => toast.success(`Certificate ${certificate.certificateId} downloaded!`)}
                                className="w-full py-2 rounded-xl bg-[#c19b48] text-[#061120] text-xs font-bold hover:bg-[#d8b862] transition-colors cursor-pointer"
                              >
                                Download Digital Certificate (PDF)
                              </button>
                            </div>
                          ) : certificate?.isEligible ? (
                            <button
                              type="button"
                              onClick={handleClaimCertificate}
                              disabled={isClaimingCert}
                              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#c19b48] to-[#e8cf8d] text-[#061120] font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                            >
                              {isClaimingCert ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Sparkles className="w-3.5 h-3.5" />
                              )}
                              <span>Claim Official Certificate Now</span>
                            </button>
                          ) : (
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                              <span>
                                Complete all modules and lectures to unlock your credential.
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: BOOKMARKS */}
                {activeRightTab === 'bookmarks' && (
                  <div className="flex-1 flex flex-col min-h-0">
                    <div className="flex items-center gap-2 text-sm font-semibold text-[#c19b48] dark:text-[#e8cf8d] mb-4 shrink-0">
                      <Bookmark className="w-4 h-4 fill-[#c19b48] text-[#c19b48]" />
                      <span>Saved Notes & Bookmarks</span>
                    </div>

                    {bookmarkedLessons.length === 0 ? (
                      <div className="text-center py-10 text-slate-400 text-xs space-y-2">
                        <Bookmark className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                        <p>No bookmarks saved in this course yet.</p>
                        <p className="text-[11px] text-slate-500">
                          Click the bookmark button inside any lecture or notes guide to save it here for rapid revision.
                        </p>
                      </div>
                    ) : (
                      <div className="flex-1 min-h-0 overflow-y-auto pr-1 custom-scrollbar space-y-2.5">
                        {bookmarkedLessons.map((bm) => (
                          <div
                            key={bm.lessonId}
                            className="p-3 rounded-xl bg-slate-50 dark:bg-[#070d18] border border-slate-200 dark:border-[#16253d] flex items-center justify-between text-xs hover:border-slate-300 dark:hover:border-[#274068] transition-colors"
                          >
                            <div className="flex items-center gap-2.5 pr-2 min-w-0">
                              <FileText className="w-4 h-4 text-[#c19b48] dark:text-[#e8cf8d] shrink-0" />
                              <span className="text-slate-800 dark:text-slate-200 truncate">
                                {bm.title}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleLessonLaunch(bm.lessonId)}
                              className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline px-2 py-1 shrink-0 cursor-pointer"
                            >
                              Jump
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Bottom Live Chamber Card */}
                {liveSession && (
                  <div className="mt-3 pt-3 border-t border-slate-200 dark:border-[#16253d] shrink-0">
                    <div className="p-3 rounded-xl bg-[#0a1c36] text-white flex items-center justify-between gap-3 shadow-md">
                      <div className="min-w-0">
                        <div className="text-[9px] font-bold text-[#c19b48] uppercase tracking-wider flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                          Live Doubt Support
                        </div>
                        <div className="text-xs font-bold truncate mt-0.5">{liveSession.title}</div>
                        <div className="text-[10px] text-slate-300 truncate">
                          {liveSession.facultyName} • {new Date(liveSession.scheduledAt).toLocaleDateString()}
                        </div>
                      </div>
                      <button
                        onClick={() => navigate(liveSession.joinUrl || '/dashboard/chat')}
                        className="px-3 py-1.5 rounded-lg bg-[#c19b48] hover:bg-[#d8b862] text-[#061120] text-xs font-bold shrink-0 transition-colors cursor-pointer"
                      >
                        Join
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Far Right Vertical Icon Rail */}
            <div className="flex flex-col items-center gap-2 bg-white dark:bg-[#0b1322] border border-slate-200 dark:border-[#16253d] p-1.5 rounded-2xl shrink-0 h-fit shadow-xs transition-colors">
              {/* Toggle Drawer */}
              <button
                type="button"
                onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
                className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#16253d] transition-colors cursor-pointer"
                title={isRightSidebarOpen ? 'Collapse rail' : 'Expand rail'}
              >
                {isRightSidebarOpen ? (
                  <PanelRightClose className="w-4 h-4" />
                ) : (
                  <PanelRightOpen className="w-4 h-4" />
                )}
              </button>

              <div className="w-full h-px bg-slate-200 dark:bg-[#16253d] my-1" />

              {/* Leaderboard Icon Button */}
              <button
                type="button"
                onClick={() => {
                  setIsRightSidebarOpen(true);
                  setActiveRightTab('leaderboard');
                }}
                className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                  activeRightTab === 'leaderboard' && isRightSidebarOpen
                    ? 'bg-[#c19b48]/20 text-[#c19b48] dark:text-[#e8cf8d] border border-[#c19b48]/40 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#16253d]'
                }`}
                title="Cohort Leaderboard"
              >
                <Trophy className="w-4 h-4" />
              </button>

              {/* Certificate Icon Button */}
              <button
                type="button"
                onClick={() => {
                  setIsRightSidebarOpen(true);
                  setActiveRightTab('certificate');
                }}
                className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                  activeRightTab === 'certificate' && isRightSidebarOpen
                    ? 'bg-[#c19b48]/20 text-[#c19b48] dark:text-[#e8cf8d] border border-[#c19b48]/40 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#16253d]'
                }`}
                title="Course Certificates"
              >
                <Award className="w-4 h-4" />
              </button>

              {/* Bookmark Icon Button */}
              <button
                type="button"
                onClick={() => {
                  setIsRightSidebarOpen(true);
                  setActiveRightTab('bookmarks');
                }}
                className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                  activeRightTab === 'bookmarks' && isRightSidebarOpen
                    ? 'bg-[#c19b48]/20 text-[#c19b48] dark:text-[#e8cf8d] border border-[#c19b48]/40 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#16253d]'
                }`}
                title="Saved Bookmarks"
              >
                <Bookmark className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

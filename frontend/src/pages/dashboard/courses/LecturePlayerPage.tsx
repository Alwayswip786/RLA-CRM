import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  FileText,
  Code2,
  CheckCircle2,
  X,
  Send,
  PanelLeftClose,
  PanelLeftOpen,
  Check,
  ThumbsUp,
  ThumbsDown,
  Bookmark,
  MessageSquare,
  Loader2,
  CornerDownRight,
} from 'lucide-react';
import { toast } from '../../../lib/toast';
import { ThemeSwitcher } from '../../../components/dashboard/ThemeSwitcher';
import apiClient from '../../../lib/apiClient';
import { CustomSelect } from '../../../components/ui/CustomSelect';
import { LecturePlayerSkeleton } from '../../../components/ui/skeleton';

interface LessonDetail {
  id: string;
  title: string;
  type: 'video' | 'quiz' | 'problem' | 'document' | 'resource' | 'lecture';
  order: number;
  duration?: string;
  durationSeconds: number;
  score?: string;
  points: number;
  videoUrl?: string;
  videoThumbnail?: string;
  documentContent?: string[];
  quizData?: Array<{
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
    points: number;
  }>;
  problemData?: {
    problemStatement: string;
    exampleInput?: string;
    exampleOutput?: string;
    modelAnswer?: string;
    hint?: string;
  };
  resourceFile?: {
    fileName: string;
    fileUrl: string;
    fileSize?: string;
  };
  likesCount: number;
  dislikesCount: number;
  commentsCount: number;
  userReaction: 'like' | 'dislike' | null;
  isCompleted: boolean;
  videoWatchSeconds: number;
  quizScore: number;
  isBookmarked: boolean;
}

interface ModuleInfo {
  id: string;
  title: string;
  progressPercent: number;
  videoCount: number;
  problemCount: number;
  mcqCount: number;
  completedCount: number;
}

interface DrawerLesson {
  id: string;
  title: string;
  type: 'video' | 'quiz' | 'problem' | 'document' | 'resource' | 'lecture';
  duration?: string;
  score?: string;
  completed: boolean;
  userScore?: number;
  points: number;
  question?: string;
  options?: string[];
  correctIndex?: number;
  explanation?: string;
  problemStatement?: string;
  exampleInput?: string;
  exampleOutput?: string;
  documentContent?: string[];
}

interface CommentItem {
  id: string;
  userName: string;
  userAvatar?: string;
  userRole: string;
  content: string;
  likesCount: number;
  isLikedByMe: boolean;
  createdAt: string;
  replies: Array<{
    id: string;
    userName: string;
    userAvatar?: string;
    userRole: string;
    content: string;
    likesCount: number;
    isLikedByMe: boolean;
    createdAt: string;
  }>;
}

export const LecturePlayerPage: React.FC = () => {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const navigate = useNavigate();

  // Data states
  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [moduleInfo, setModuleInfo] = useState<ModuleInfo | null>(null);
  const [moduleLessons, setModuleLessons] = useState<DrawerLesson[]>([]);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [isSidebarOpen, setIsSidebarOpen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );
  const [isLessonAccordionOpen, setIsLessonAccordionOpen] = useState(true);
  const [isDoubtModalOpen, setIsDoubtModalOpen] = useState(false);
  const [doubtText, setDoubtText] = useState('');
  const [doubtCategory, setDoubtCategory] = useState<string>('Bare Act Interpretation');
  const [isSubmittingDoubt, setIsSubmittingDoubt] = useState(false);

  // Discussion state
  const [newCommentText, setNewCommentText] = useState('');
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);

  // Video playback states
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playerContainerRef = useRef<HTMLDivElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(1725);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [hasRestoredTimestamp, setHasRestoredTimestamp] = useState(false);

  // Quiz state
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizResult, setQuizResult] = useState<any>(null);

  // Problem state
  const [problemCode, setProblemCode] = useState('');
  const [problemSubmitted, setProblemSubmitted] = useState(false);

  // Fetch lesson data & comments
  const fetchLessonData = async () => {
    if (!courseId || !lessonId) return;
    try {
      setIsLoading(true);
      setError(null);
      const [lessonRes, commentsRes] = await Promise.all([
        apiClient.get(`/courses/${courseId}/lessons/${lessonId}`),
        apiClient
          .get(`/courses/${courseId}/lessons/${lessonId}/comments`)
          .catch(() => ({ data: { data: [] } })),
      ]);

      if (lessonRes.data?.data) {
        const { lesson: l, module: m, moduleLessons: ml } = lessonRes.data.data;
        setLesson(l);
        setModuleInfo(m);
        setModuleLessons(ml || []);
        setCurrentTime(l.videoWatchSeconds || 0);
        setDuration(l.durationSeconds || 1725);
        setHasRestoredTimestamp(false);

        // Reset interactive states for current lesson
        setSelectedAnswers({});
        setQuizSubmitted(false);
        setQuizResult(null);
        setProblemCode('');
        setProblemSubmitted(false);
      }

      if (commentsRes.data?.data) {
        setComments(commentsRes.data.data);
      }
    } catch (err: any) {
      console.error('Failed to load lesson:', err);
      setError(err?.response?.data?.message || 'Failed to load lesson.');
    } finally {
      setIsLoading(false);
    }
  };

  // Telemetry session references
  const telemetrySessionIdRef = useRef<string>(`sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
  const lastHeartbeatPosRef = useRef<number>(0);
  const lastHeartbeatTimeRef = useRef<number>(Date.now());
  const scrubFlagRef = useRef<boolean>(false);

  useEffect(() => {
    fetchLessonData();
  }, [courseId, lessonId]);

  // Video progress telemetry heartbeat (every 10s while playing)
  useEffect(() => {
    if (!isPlaying || !courseId || !lessonId) return;

    const interval = setInterval(() => {
      if (videoRef.current) {
        const currentSecs = Math.floor(videoRef.current.currentTime);
        const durationSecs = Math.floor(videoRef.current.duration || duration);
        const now = Date.now();
        const timeElapsedSecs = (now - lastHeartbeatTimeRef.current) / 1000;
        const posDiff = currentSecs - lastHeartbeatPosRef.current;

        // Scrub detected if position jumped > 30s without proportional time elapsed
        if (posDiff > 30 && posDiff > timeElapsedSecs * 2.5) {
          scrubFlagRef.current = true;
        }

        apiClient
          .post(`/courses/${courseId}/lessons/${lessonId}/telemetry`, {
            sessionId: telemetrySessionIdRef.current,
            playbackSpeed: playbackRate,
            watchedSeconds: currentSecs,
            lastPositionSeconds: currentSecs,
            videoDurationSeconds: durationSecs,
            scrubDetected: scrubFlagRef.current,
            deviceInfo: {
              deviceModel: navigator.userAgent.includes('Mac') ? 'MacBook Pro' : 'Desktop Windows',
              os: navigator.platform || 'Desktop OS',
              browser: 'Chrome / Web Browser',
              location: 'New Delhi, India',
            },
          })
          .catch((err) => console.error('Telemetry heartbeat sync error:', err));

        lastHeartbeatPosRef.current = currentSecs;
        lastHeartbeatTimeRef.current = now;
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [isPlaying, courseId, lessonId, duration, playbackRate]);

  // Sync watch time on pause / ended
  const handleSyncProgress = async (forceCompleted?: boolean) => {
    if (!courseId || !lessonId) return;
    const currentSecs = videoRef.current ? Math.floor(videoRef.current.currentTime) : currentTime;
    const durationSecs = videoRef.current
      ? Math.floor(videoRef.current.duration || duration)
      : duration;

    try {
      const res = await apiClient.post(`/courses/${courseId}/lessons/${lessonId}/telemetry`, {
        sessionId: telemetrySessionIdRef.current,
        playbackSpeed: playbackRate,
        watchedSeconds: currentSecs,
        lastPositionSeconds: currentSecs,
        videoDurationSeconds: durationSecs,
        scrubDetected: scrubFlagRef.current,
        isCompleted: forceCompleted,
      });
      if (res.data?.data?.isCompleted && !lesson?.isCompleted) {
        setLesson((prev) => (prev ? { ...prev, isCompleted: true } : null));
        toast.success('Lesson marked as completed! Points awarded.');
      }
    } catch (err) {
      console.error('Progress sync error:', err);
    }
  };

  // Restore timestamp on video metadata loaded
  const handleLoadedMetadata = () => {
    if (videoRef.current && lesson?.videoWatchSeconds && !hasRestoredTimestamp) {
      videoRef.current.currentTime = lesson.videoWatchSeconds;
      setCurrentTime(lesson.videoWatchSeconds);
      setHasRestoredTimestamp(true);
    }
  };

  // Video playback controls
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
        handleSyncProgress();
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    setIsMuted(vol === 0);
    if (videoRef.current) {
      videoRef.current.volume = vol;
      videoRef.current.muted = vol === 0;
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const nextMute = !isMuted;
      setIsMuted(nextMute);
      videoRef.current.muted = nextMute;
    } else {
      setIsMuted(!isMuted);
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackRate(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  const toggleFullscreen = () => {
    if (!playerContainerRef.current) return;
    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen().catch((err) => {
        toast.error(`Fullscreen request failed: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(console.error);
      setIsFullscreen(false);
    }
  };

  const formatTime = (timeInSeconds: number) => {
    const mins = Math.floor(timeInSeconds / 60);
    const secs = Math.floor(timeInSeconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Like / Dislike reaction toggling
  const handleToggleReaction = async (reactionType: 'like' | 'dislike') => {
    if (!courseId || !lessonId || !lesson) return;
    const targetReaction = lesson.userReaction === reactionType ? null : reactionType;
    try {
      const res = await apiClient.post(`/courses/${courseId}/lessons/${lessonId}/reaction`, {
        reactionType: targetReaction,
      });
      if (res.data?.data) {
        setLesson({
          ...lesson,
          likesCount: res.data.data.likesCount,
          dislikesCount: res.data.data.dislikesCount,
          userReaction: res.data.data.userReaction,
        });
        if (targetReaction === 'like') {
          toast.success('Liked lecture!');
        }
      }
    } catch (err: any) {
      toast.error('Failed to update reaction.');
    }
  };

  // Bookmark toggling
  const handleToggleBookmark = async () => {
    if (!courseId || !lessonId || !lesson) return;
    try {
      const res = await apiClient.post(`/courses/${courseId}/lessons/${lessonId}/bookmark`);
      if (res.data?.data) {
        const nextState = res.data.data.isBookmarked;
        setLesson({ ...lesson, isBookmarked: nextState });
        toast.success(nextState ? 'Saved to Bookmarks Vault!' : 'Removed from Bookmarks.');
      }
    } catch (err) {
      toast.error('Failed to update bookmark.');
    }
  };

  // Submit Doubt Modal
  const handleDoubtSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doubtText.trim() || !courseId || !lesson) return;

    try {
      setIsSubmittingDoubt(true);
      const videoTime = formatTime(currentTime);
      await apiClient.post('/doubts', {
        subject: 'Procedural Law & Curriculum',
        category: doubtCategory,
        title: `Doubt on ${lesson.title} (${videoTime})`,
        initialQuestion: doubtText.trim(),
        priority: 'normal',
        courseId,
        moduleId: moduleInfo?.id,
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        videoTimestamp: videoTime,
      });

      toast.success('Doubt submitted to Academic Faculty!');
      setDoubtText('');
      setIsDoubtModalOpen(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to submit doubt.');
    } finally {
      setIsSubmittingDoubt(false);
    }
  };

  // Add Comment
  const handleAddComment = async (parentCommentId?: string) => {
    const text = parentCommentId ? replyText : newCommentText;
    if (!text.trim() || !courseId || !lessonId) return;

    try {
      setIsPostingComment(true);
      const res = await apiClient.post(`/courses/${courseId}/lessons/${lessonId}/comments`, {
        content: text.trim(),
        parentCommentId: parentCommentId || null,
      });

      if (res.data?.data) {
        toast.success(parentCommentId ? 'Reply posted!' : 'Comment posted!');
        if (parentCommentId) {
          setComments((prev) =>
            prev.map((c) =>
              c.id === parentCommentId
                ? { ...c, replies: [...c.replies, res.data.data] }
                : c
            )
          );
          setReplyText('');
          setReplyingToCommentId(null);
        } else {
          setComments((prev) => [res.data.data, ...prev]);
          setNewCommentText('');
        }
      }
    } catch (err: any) {
      toast.error('Failed to post comment.');
    } finally {
      setIsPostingComment(false);
    }
  };

  // Like Comment
  const handleLikeComment = async (commentId: string) => {
    if (!courseId || !lessonId) return;
    try {
      const res = await apiClient.post(
        `/courses/${courseId}/lessons/${lessonId}/comments/${commentId}/like`
      );
      if (res.data?.data) {
        const { likesCount, isLikedByMe } = res.data.data;
        setComments((prev) =>
          prev.map((c) => {
            if (c.id === commentId) {
              return { ...c, likesCount, isLikedByMe };
            }
            return {
              ...c,
              replies: c.replies.map((r) =>
                r.id === commentId ? { ...r, likesCount, isLikedByMe } : r
              ),
            };
          })
        );
      }
    } catch (err) {
      toast.error('Failed to like comment.');
    }
  };

  // Quiz submission
  const handleQuizSubmit = async () => {
    if (!courseId || !lessonId || !lesson?.quizData) return;
    const answers = lesson.quizData.map((_, idx) => selectedAnswers[idx] ?? -1);

    try {
      const res = await apiClient.post(`/courses/${courseId}/lessons/${lessonId}/quiz-submit`, {
        answers,
      });
      if (res.data?.data) {
        setQuizResult(res.data.data);
        setQuizSubmitted(true);
        setLesson((prev) => (prev ? { ...prev, isCompleted: true } : null));
        toast.success(`Quiz Completed! Scored ${res.data.data.score}/${res.data.data.totalScore} pts`);
      }
    } catch (err: any) {
      toast.error('Failed to submit quiz.');
    }
  };

  // Navigation between lessons in module
  const currentLessonIndex = moduleLessons.findIndex((l) => l.id === lessonId);
  const activeIndex = Math.max(0, currentLessonIndex);

  const handlePrevLesson = () => {
    if (activeIndex > 0) {
      const prev = moduleLessons[activeIndex - 1];
      navigate(`/dashboard/courses/${courseId}/learn/${prev.id}`);
    }
  };

  const handleNextLesson = () => {
    if (activeIndex < moduleLessons.length - 1) {
      const next = moduleLessons[activeIndex + 1];
      navigate(`/dashboard/courses/${courseId}/learn/${next.id}`);
    }
  };

  if (isLoading) {
    return <LecturePlayerSkeleton />;
  }

  if (error || !lesson) {
    return (
      <div className="h-screen max-h-screen bg-[#F7F3E6] dark:bg-[#060a12] text-slate-900 dark:text-slate-100 p-6 flex items-center justify-center">
        <div className="max-w-md w-full p-8 rounded-2xl bg-white dark:bg-[#0b101c] border border-slate-200 dark:border-[#141e32] text-center space-y-4 shadow-xl">
          <BookOpen className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-lg font-serif font-bold text-slate-900 dark:text-white">
            Lesson Unavailable
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400">{error || 'Could not load lesson.'}</p>
          <button
            onClick={() => navigate(`/dashboard/courses/${courseId}`)}
            className="px-4 py-2 rounded-xl bg-[#c19b48] text-[#061120] text-xs font-semibold"
          >
            Back to Course Syllabus
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen max-h-screen bg-[#F7F3E6] dark:bg-[#060a12] text-slate-900 dark:text-slate-100 flex flex-col overflow-hidden transition-colors">
      {/* Top Bar matching Image 6 */}
      <header className="h-14 bg-white dark:bg-[#090d16] border-b border-slate-200 dark:border-[#141b2b] px-4 flex items-center justify-between shrink-0 z-30 transition-colors">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => navigate(`/dashboard/courses/${courseId}`)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#0f172a] text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#1a2846] transition-colors text-xs font-semibold shrink-0 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Syllabus</span>
          </button>

          <div className="h-4 w-px bg-slate-200 dark:bg-[#1f2d48] hidden sm:block" />

          <button
            type="button"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#141e32] transition-colors cursor-pointer"
            title={isSidebarOpen ? 'Collapse Drawer' : 'Expand Drawer'}
          >
            {isSidebarOpen ? (
              <PanelLeftClose className="w-4 h-4" />
            ) : (
              <PanelLeftOpen className="w-4 h-4" />
            )}
          </button>

          <div className="min-w-0 flex items-center gap-2">
            <span className="text-xs font-semibold text-[#c19b48] dark:text-[#e8cf8d] hidden md:inline truncate">
              {moduleInfo?.title}
            </span>
            <span className="text-xs text-slate-400 hidden md:inline">•</span>
            <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
              {lesson.title}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <ThemeSwitcher />

          {/* Ask a Doubt Button */}
          <button
            type="button"
            onClick={() => setIsDoubtModalOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-[#c19b48]/15 hover:bg-[#c19b48]/25 text-[#c19b48] dark:text-[#e8cf8d] border border-[#c19b48]/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Ask Doubt</span>
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 flex min-h-0 overflow-hidden relative">
        {/* Mobile Backdrop for Drawer (< 1024px) */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden animate-in fade-in duration-200"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Collapsible Left Drawer (Slide-over on mobile/tablet, in-flow on desktop) */}
        <aside
          className={`${
            isSidebarOpen
              ? 'fixed inset-y-0 left-0 z-50 w-[85vw] max-w-sm lg:static lg:z-20 lg:w-96 shadow-2xl lg:shadow-none'
              : 'fixed -left-full lg:static lg:w-0'
          } bg-white dark:bg-[#090d16] border-r border-slate-200 dark:border-[#141b2b] flex flex-col shrink-0 transition-all duration-300 overflow-hidden`}
        >
          {/* Mobile Drawer Header with Close Button (< 1024px) */}
          <div className="flex items-center justify-between p-3.5 border-b border-slate-200 dark:border-[#141b2b] lg:hidden shrink-0">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-[#c19b48]" />
              <span>Course Syllabus</span>
            </span>
            <button
              type="button"
              onClick={() => setIsSidebarOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-3.5 sm:p-4 flex-1 flex flex-col min-h-0 space-y-3">
            {/* Top Module Card */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#0b101c] border border-slate-200 dark:border-[#141e32] shrink-0 space-y-3 shadow-xs">
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                  {moduleInfo?.title || 'Current Module'}
                </h3>
                <div className="flex items-center justify-between text-[11px] font-semibold text-[#c19b48] dark:text-[#e8cf8d] mt-1">
                  <span>Progress</span>
                  <span>{moduleInfo?.progressPercent || 0}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-[#141e32] rounded-full h-1.5 overflow-hidden mt-1.5">
                  <div
                    className="h-full bg-gradient-to-r from-[#c19b48] to-[#e8cf8d] rounded-full transition-all duration-500"
                    style={{ width: `${moduleInfo?.progressPercent || 0}%` }}
                  />
                </div>
              </div>

              {/* 4 Mini KPI Boxes */}
              <div className="grid grid-cols-4 gap-1.5 text-center">
                <div className="p-1.5 rounded-lg bg-white dark:bg-[#070b14] border border-slate-200 dark:border-[#141e32]">
                  <div className="text-[9px] text-slate-500 dark:text-slate-400 font-semibold">Video</div>
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {moduleInfo?.videoCount || 0}
                  </div>
                </div>
                <div className="p-1.5 rounded-lg bg-white dark:bg-[#070b14] border border-slate-200 dark:border-[#141e32]">
                  <div className="text-[9px] text-slate-500 dark:text-slate-400 font-semibold">Problem</div>
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {moduleInfo?.problemCount || 0}
                  </div>
                </div>
                <div className="p-1.5 rounded-lg bg-white dark:bg-[#070b14] border border-slate-200 dark:border-[#141e32]">
                  <div className="text-[9px] text-slate-500 dark:text-slate-400 font-semibold">MCQs</div>
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {moduleInfo?.mcqCount || 0}
                  </div>
                </div>
                <div className="p-1.5 rounded-lg bg-white dark:bg-[#070b14] border border-slate-200 dark:border-[#141e32]">
                  <div className="text-[9px] text-slate-500 dark:text-slate-400 font-semibold">Done</div>
                  <div className="text-xs font-bold text-emerald-500">
                    {moduleInfo?.completedCount || 0}
                  </div>
                </div>
              </div>
            </div>

            {/* Accordion Lessons List */}
            <div className="flex-1 flex flex-col min-h-0 rounded-2xl bg-slate-50 dark:bg-[#0b101c] border border-slate-200 dark:border-[#141e32] overflow-hidden shadow-xs">
              <button
                type="button"
                onClick={() => setIsLessonAccordionOpen(!isLessonAccordionOpen)}
                className="w-full p-3 flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#101726] transition-colors border-b border-slate-200 dark:border-[#141e32] cursor-pointer shrink-0"
              >
                <span>Lessons in this Module ({moduleLessons.length})</span>
                {isLessonAccordionOpen ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              {isLessonAccordionOpen && (
                <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar divide-y divide-slate-200 dark:divide-[#141e32]">
                  {moduleLessons.map((item) => {
                    const isActive = item.id === lessonId;
                    return (
                      <div
                        key={item.id}
                        onClick={() => navigate(`/dashboard/courses/${courseId}/learn/${item.id}`)}
                        className={`p-3 flex items-center justify-between transition-colors cursor-pointer ${
                          isActive
                            ? 'bg-amber-500/10 dark:bg-[#c19b48]/15 border-l-2 border-[#c19b48]'
                            : 'hover:bg-slate-100 dark:hover:bg-[#101726]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          {item.type === 'video' || item.type === 'lecture' ? (
                            <Play
                              className={`w-3.5 h-3.5 shrink-0 ${
                                isActive ? 'text-[#c19b48]' : 'text-slate-400'
                              }`}
                            />
                          ) : item.type === 'quiz' ? (
                            <HelpCircle
                              className={`w-3.5 h-3.5 shrink-0 ${
                                isActive ? 'text-sky-500' : 'text-slate-400'
                              }`}
                            />
                          ) : item.type === 'problem' ? (
                            <Code2
                              className={`w-3.5 h-3.5 shrink-0 ${
                                isActive ? 'text-emerald-500' : 'text-slate-400'
                              }`}
                            />
                          ) : (
                            <FileText
                              className={`w-3.5 h-3.5 shrink-0 ${
                                isActive ? 'text-amber-500' : 'text-slate-400'
                              }`}
                            />
                          )}

                          <div className="min-w-0">
                            <h4
                              className={`text-xs truncate ${
                                isActive
                                  ? 'font-bold text-[#c19b48] dark:text-[#e8cf8d]'
                                  : 'font-medium text-slate-800 dark:text-slate-200'
                              }`}
                            >
                              {item.title}
                            </h4>
                            <span className="text-[10px] text-slate-400 capitalize">
                              {item.type} {item.duration && `• ${item.duration}`}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {item.score && (
                            <span className="text-[10px] font-semibold text-[#c19b48] dark:text-[#e8cf8d]">
                              {item.score}
                            </span>
                          )}
                          {item.completed && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Center / Right Content Canvas */}
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto custom-scrollbar p-3.5 sm:p-5">
          {/* Top Reaction & Meta Ribbon */}
          <div className="max-w-5xl mx-auto w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-3 border-b border-slate-200 dark:border-[#141b2b]">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#c19b48]/15 text-[#c19b48] border border-[#c19b48]/30">
                  {lesson.type.toUpperCase()}
                </span>
                {lesson.isCompleted && (
                  <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Completed
                  </span>
                )}
              </div>
              <h1 className="text-base sm:text-xl font-bold font-serif text-slate-900 dark:text-white mt-1">
                {lesson.title}
              </h1>
            </div>

            {/* Reaction Bar & Bookmark */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Like Button */}
              <button
                type="button"
                onClick={() => handleToggleReaction('like')}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  lesson.userReaction === 'like'
                    ? 'bg-[#c19b48] text-[#061120] border-[#c19b48]'
                    : 'bg-white dark:bg-[#0b101c] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-[#141e32] hover:border-[#c19b48]'
                }`}
                title="Like Lecture"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                <span>{lesson.likesCount}</span>
              </button>

              {/* Dislike Button */}
              <button
                type="button"
                onClick={() => handleToggleReaction('dislike')}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  lesson.userReaction === 'dislike'
                    ? 'bg-rose-500 text-white border-rose-500'
                    : 'bg-white dark:bg-[#0b101c] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-[#141e32] hover:border-rose-500'
                }`}
                title="Dislike"
              >
                <ThumbsDown className="w-3.5 h-3.5" />
                <span>{lesson.dislikesCount}</span>
              </button>

              {/* Bookmark Button */}
              <button
                type="button"
                onClick={handleToggleBookmark}
                className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                  lesson.isBookmarked
                    ? 'bg-[#c19b48]/20 border-[#c19b48] text-[#c19b48]'
                    : 'bg-white dark:bg-[#0b101c] border-slate-200 dark:border-[#141e32] text-slate-500 hover:text-[#c19b48]'
                }`}
                title={lesson.isBookmarked ? 'Bookmarked' : 'Save Bookmark'}
              >
                <Bookmark className="w-4 h-4 fill-current" />
              </button>
            </div>
          </div>

          {/* VIEW 1: Video Lecture */}
          {(lesson.type === 'video' || lesson.type === 'lecture') && (
            <div className="flex-1 max-w-5xl mx-auto w-full space-y-5">
              {/* Video Player Container */}
              <div
                ref={playerContainerRef}
                className="w-full aspect-video rounded-2xl overflow-hidden bg-black relative shadow-2xl border border-slate-800 group"
              >
                {/* Real HTML5 Video Element */}
                <video
                  ref={videoRef}
                  src={lesson.videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'}
                  onTimeUpdate={() => {
                    if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
                  }}
                  onLoadedMetadata={handleLoadedMetadata}
                  onEnded={() => {
                    setIsPlaying(false);
                    handleSyncProgress(true);
                  }}
                  onPause={() => {
                    setIsPlaying(false);
                    handleSyncProgress();
                  }}
                  onPlay={() => setIsPlaying(true)}
                  className="w-full h-full object-cover"
                />

                {/* Big Center Play/Pause button when paused */}
                {!isPlaying && (
                  <div
                    onClick={togglePlay}
                    className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-2xs cursor-pointer z-10 transition-all"
                  >
                    <div className="w-16 h-16 rounded-full bg-[#c19b48] text-[#061120] flex items-center justify-center shadow-2xl hover:scale-110 transition-transform">
                      <Play className="w-8 h-8 fill-current ml-1" />
                    </div>
                  </div>
                )}

                {/* Video Controls Bar Overlay */}
                <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                  {/* Scrubber */}
                  <input
                    type="range"
                    min={0}
                    max={duration || 100}
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#c19b48]"
                  />

                  {/* Buttons row */}
                  <div className="flex items-center justify-between text-white text-xs">
                    <div className="flex items-center gap-3">
                      <button type="button" onClick={togglePlay} className="hover:text-[#c19b48] cursor-pointer">
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>

                      <button type="button" onClick={toggleMute} className="hover:text-[#c19b48] cursor-pointer">
                        {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      </button>

                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={isMuted ? 0 : volume}
                        onChange={handleVolumeChange}
                        className="w-16 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#c19b48]"
                      />

                      <span className="font-mono text-[11px] text-slate-300">
                        {formatTime(currentTime)} / {formatTime(duration)}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Speed selector */}
                      <div className="flex items-center gap-1 bg-white/10 rounded-lg px-2 py-0.5">
                        {[1, 1.25, 1.5, 2].map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => handleSpeedChange(s)}
                            className={`px-1 rounded text-[10px] font-bold ${
                              playbackRate === s ? 'text-[#c19b48]' : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            {s}x
                          </button>
                        ))}
                      </div>

                      <button type="button" onClick={toggleFullscreen} className="hover:text-[#c19b48] cursor-pointer">
                        {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Discussion & Threaded Comments Section */}
              <div className="rounded-2xl bg-white dark:bg-[#0b101c] border border-slate-200 dark:border-[#141e32] p-5 shadow-xs space-y-5">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#141e32] pb-3">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-[#c19b48]" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Lecture Discussion & Doubts ({comments.length})
                    </h3>
                  </div>
                </div>

                {/* Add new top-level comment form */}
                <div className="space-y-2">
                  <textarea
                    rows={2}
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    placeholder="Ask a question or share judicial insights on this lecture..."
                    className="w-full rounded-xl bg-slate-50 dark:bg-[#070b14] border border-slate-200 dark:border-[#141e32] p-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#c19b48] resize-none"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      disabled={isPostingComment || !newCommentText.trim()}
                      onClick={() => handleAddComment()}
                      className="px-4 py-2 rounded-xl bg-[#c19b48] hover:bg-[#d8b862] text-[#061120] text-xs font-bold transition-colors disabled:opacity-40 flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Send className="w-3 h-3" />
                      <span>Post Comment</span>
                    </button>
                  </div>
                </div>

                {/* Comments List */}
                <div className="space-y-4 pt-2">
                  {comments.length === 0 ? (
                    <div className="text-center py-6 text-xs text-slate-400">
                      No comments yet. Start the discussion!
                    </div>
                  ) : (
                    comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#070b14] border border-slate-200 dark:border-[#141e32] space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-[#c19b48]/20 text-[#c19b48] font-bold flex items-center justify-center text-[10px]">
                              {comment.userName.charAt(0)}
                            </div>
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              {comment.userName}
                            </span>
                            {comment.userRole === 'faculty' && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-[#c19b48] text-[#061120]">
                                FACULTY
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed pl-8">
                          {comment.content}
                        </p>

                        <div className="flex items-center gap-3 pl-8 pt-1 text-[11px]">
                          <button
                            type="button"
                            onClick={() => handleLikeComment(comment.id)}
                            className={`flex items-center gap-1 hover:text-[#c19b48] cursor-pointer ${
                              comment.isLikedByMe ? 'text-[#c19b48] font-bold' : 'text-slate-400'
                            }`}
                          >
                            <ThumbsUp className="w-3 h-3" />
                            <span>{comment.likesCount}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setReplyingToCommentId(
                                replyingToCommentId === comment.id ? null : comment.id
                              )
                            }
                            className="text-slate-400 hover:text-slate-200 cursor-pointer font-medium"
                          >
                            Reply
                          </button>
                        </div>

                        {/* Threaded Replies */}
                        {comment.replies?.length > 0 && (
                          <div className="pl-8 space-y-2 pt-2 border-t border-slate-200/60 dark:border-[#141e32]/60">
                            {comment.replies.map((reply) => (
                              <div
                                key={reply.id}
                                className="p-2.5 rounded-lg bg-white dark:bg-[#0b101c] border border-slate-200 dark:border-[#141e32] space-y-1"
                              >
                                <div className="flex items-center justify-between text-[11px]">
                                  <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                                    <CornerDownRight className="w-3 h-3 text-[#c19b48]" />
                                    <span>{reply.userName}</span>
                                    {reply.userRole === 'faculty' && (
                                      <span className="text-[8px] font-bold px-1 py-0.2 rounded bg-[#c19b48] text-[#061120]">
                                        FACULTY
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[9px] text-slate-400">
                                    {new Date(reply.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-700 dark:text-slate-300 pl-4">
                                  {reply.content}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Reply Form */}
                        {replyingToCommentId === comment.id && (
                          <div className="pl-8 pt-2 space-y-2">
                            <input
                              type="text"
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder={`Reply to ${comment.userName}...`}
                              className="w-full rounded-xl bg-white dark:bg-[#0b101c] border border-slate-200 dark:border-[#141e32] p-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#c19b48]"
                            />
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setReplyingToCommentId(null)}
                                className="px-3 py-1 rounded-lg text-xs text-slate-400 hover:text-white"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAddComment(comment.id)}
                                className="px-3 py-1 rounded-lg bg-[#c19b48] text-[#061120] text-xs font-bold"
                              >
                                Reply
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* VIEW 2: MCQ Assessment Runner */}
          {lesson.type === 'quiz' && (
            <div className="flex-1 max-w-3xl mx-auto w-full py-4 space-y-6">
              <div className="rounded-2xl bg-white dark:bg-[#0b101c] border border-slate-200 dark:border-[#141e32] p-6 shadow-xs space-y-6">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#141e32] pb-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-sky-500">
                      Preliminary Assessment
                    </span>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                      {lesson.title}
                    </h2>
                  </div>
                  {quizSubmitted && (
                    <span className="px-3 py-1 rounded-xl bg-[#c19b48]/15 text-[#c19b48] border border-[#c19b48]/30 text-xs font-bold">
                      Score: {quizResult?.score} / {quizResult?.totalScore} Points
                    </span>
                  )}
                </div>

                {/* Questions */}
                <div className="space-y-6">
                  {lesson.quizData?.map((q, qIndex) => {
                    const selected = selectedAnswers[qIndex];

                    return (
                      <div key={qIndex} className="space-y-3">
                        <h4 className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">
                          <span className="text-[#c19b48] font-bold mr-1.5">Q{qIndex + 1}.</span>
                          {q.question}
                        </h4>

                        <div className="space-y-2">
                          {q.options.map((opt, optIndex) => {
                            const isChosen = selected === optIndex;
                            let optionClass =
                              'p-3 rounded-xl border text-xs font-medium cursor-pointer transition-all flex items-center justify-between';

                            if (quizSubmitted) {
                              if (optIndex === q.correctIndex) {
                                optionClass += ' bg-emerald-500/15 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold';
                              } else if (isChosen) {
                                optionClass += ' bg-rose-500/15 border-rose-500 text-rose-600 dark:text-rose-400 font-bold';
                              } else {
                                optionClass += ' bg-slate-50 dark:bg-[#070b14] border-slate-200 dark:border-[#141e32] opacity-50';
                              }
                            } else if (isChosen) {
                              optionClass += ' bg-[#c19b48]/15 border-[#c19b48] text-[#c19b48] font-semibold';
                            } else {
                              optionClass +=
                                ' bg-slate-50 dark:bg-[#070b14] border-slate-200 dark:border-[#141e32] hover:border-[#c19b48] text-slate-700 dark:text-slate-300';
                            }

                            return (
                              <div
                                key={optIndex}
                                onClick={() => {
                                  if (!quizSubmitted) {
                                    setSelectedAnswers({ ...selectedAnswers, [qIndex]: optIndex });
                                  }
                                }}
                                className={optionClass}
                              >
                                <span>{opt}</span>
                                {quizSubmitted && optIndex === q.correctIndex && (
                                  <Check className="w-4 h-4 text-emerald-500" />
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Explanation Card */}
                        {quizSubmitted && q.explanation && (
                          <div className="p-3.5 rounded-xl bg-amber-500/5 dark:bg-[#c19b48]/10 border border-[#c19b48]/30 text-xs space-y-1 animate-in fade-in">
                            <span className="font-bold text-[#c19b48] text-[10px] uppercase tracking-wider">
                              Legal Analysis & Statutory Reference:
                            </span>
                            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                              {q.explanation}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-[#141e32] flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleToggleBookmark}
                    className="text-xs text-[#c19b48] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>Bookmark Questions</span>
                  </button>

                  {!quizSubmitted ? (
                    <button
                      type="button"
                      onClick={handleQuizSubmit}
                      className="px-5 py-2.5 rounded-xl bg-[#c19b48] hover:bg-[#d8b862] text-[#061120] text-xs font-bold transition-all shadow-md cursor-pointer"
                    >
                      Submit & Check Answers
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleNextLesson}
                      className="px-5 py-2.5 rounded-xl bg-[#c19b48] hover:bg-[#d8b862] text-[#061120] text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Next Lesson</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* VIEW 3: Problem Runner */}
          {lesson.type === 'problem' && (
            <div className="flex-1 max-w-4xl mx-auto w-full py-4 space-y-5">
              <div className="rounded-2xl bg-white dark:bg-[#0b101c] border border-slate-200 dark:border-[#141e32] p-6 shadow-xs space-y-5">
                <div className="border-b border-slate-200 dark:border-[#141e32] pb-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">
                    Drafting / Problem Simulation
                  </span>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    {lesson.title}
                  </h2>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase text-slate-400">Problem Statement</h4>
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {lesson.problemData?.problemStatement}
                  </p>
                </div>

                {lesson.problemData?.exampleInput && (
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#070b14] border border-slate-200 dark:border-[#141e32] text-xs space-y-1">
                    <span className="font-mono text-[10px] font-bold text-slate-400">SAMPLE FACTS / INPUT:</span>
                    <p className="font-mono text-slate-600 dark:text-slate-300">{lesson.problemData.exampleInput}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Your Legal Arguments / Draft Solution:
                  </label>
                  <textarea
                    rows={6}
                    value={problemCode}
                    onChange={(e) => setProblemCode(e.target.value)}
                    placeholder="Enter your drafted arguments, citations and statutory provisions..."
                    className="w-full rounded-xl bg-slate-50 dark:bg-[#070b14] border border-slate-200 dark:border-[#141e32] p-3 text-xs font-mono text-slate-900 dark:text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-[#c19b48]"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setProblemSubmitted(true);
                      handleSyncProgress(true);
                      toast.success('Solution submitted! Comparing with model answer.');
                    }}
                    className="px-5 py-2.5 rounded-xl bg-[#c19b48] hover:bg-[#d8b862] text-[#061120] text-xs font-bold transition-all shadow-md cursor-pointer"
                  >
                    Submit & Evaluate
                  </button>
                </div>

                {problemSubmitted && lesson.problemData?.modelAnswer && (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-2 animate-in fade-in">
                    <span className="font-bold text-emerald-500 uppercase tracking-wider">
                      Academy Model Answer & Key Points:
                    </span>
                    <p className="text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                      {lesson.problemData.modelAnswer}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VIEW 4: Document / Study Guide */}
          {(lesson.type === 'document' || lesson.type === 'resource') && (
            <div className="flex-1 max-w-4xl mx-auto w-full py-4 space-y-5">
              <div className="rounded-2xl bg-white dark:bg-[#0b101c] border border-slate-200 dark:border-[#141e32] p-6 shadow-xs space-y-5">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#141e32] pb-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[#c19b48]" />
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                      {lesson.title}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleBookmark}
                    className="text-xs text-[#c19b48] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>{lesson.isBookmarked ? 'Bookmarked' : 'Bookmark Notes'}</span>
                  </button>
                </div>

                {/* Document Steps */}
                <div className="space-y-3.5">
                  {lesson.documentContent?.map((step, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-slate-50 dark:bg-[#070b14] border border-slate-200 dark:border-[#141e32] flex items-start gap-3"
                    >
                      <span className="w-6 h-6 rounded-full bg-[#c19b48]/15 text-[#c19b48] border border-[#c19b48]/30 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                        {step}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Mark as Completed */}
                <div className="pt-4 border-t border-slate-200 dark:border-[#141e32] flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleSyncProgress(true)}
                    className="px-5 py-2.5 rounded-xl bg-[#c19b48] hover:bg-[#d8b862] text-[#061120] text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Mark as Read & Completed</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Bottom Sticky Lesson Navigator Bar matching Image 6 (< Lesson 1/7 >) */}
      <footer className="h-12 bg-white dark:bg-[#090d16] border-t border-slate-200 dark:border-[#141b2b] px-4 flex items-center justify-center shrink-0 transition-colors">
        <div className="flex items-center gap-2">
          {/* Previous Lesson Button */}
          <button
            type="button"
            onClick={handlePrevLesson}
            disabled={activeIndex === 0}
            className="w-7 h-7 rounded-md bg-slate-100 dark:bg-[#0e1626] border border-slate-200 dark:border-[#18243c] text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#142036] disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center transition-colors cursor-pointer"
            title="Previous Lesson"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          {/* Lesson Counter Badge */}
          <div className="px-4 py-1 rounded-md bg-slate-100 dark:bg-[#0e1626] border border-slate-200 dark:border-[#18243c] text-xs font-medium text-slate-700 dark:text-slate-300 select-none">
            Lesson {activeIndex + 1} / {moduleLessons.length}
          </div>

          {/* Next Lesson Button */}
          <button
            type="button"
            onClick={handleNextLesson}
            disabled={activeIndex === moduleLessons.length - 1}
            className="w-7 h-7 rounded-md bg-slate-100 dark:bg-[#0e1626] border border-slate-200 dark:border-[#18243c] text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#142036] disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center transition-colors cursor-pointer"
            title="Next Lesson"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </footer>

      {/* Ask a Doubt Modal */}
      {isDoubtModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#0b101c] border border-slate-200 dark:border-[#1a2842] shadow-2xl p-5 text-slate-900 dark:text-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#1a2842] mb-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                <HelpCircle className="w-4 h-4 text-[#c19b48] dark:text-[#e8cf8d]" />
                <span>Ask a Doubt on this Lesson</span>
              </div>
              <button
                type="button"
                onClick={() => setIsDoubtModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleDoubtSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Lesson Reference & Timestamp
                </label>
                <div className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-[#070b14] border border-slate-200 dark:border-[#141e32] p-2.5 rounded-xl flex items-center justify-between">
                  <span className="truncate">{lesson.title}</span>
                  <span className="font-mono text-[#c19b48] font-bold shrink-0">
                    {formatTime(currentTime)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Doubt Category
                </label>
                <CustomSelect
                  options={[
                    { value: 'Bare Act Interpretation', label: 'Bare Act Interpretation' },
                    { value: 'Mains Answer Drafting', label: 'Mains Answer Drafting' },
                    { value: 'Case Law & Precedent', label: 'Case Law & Precedent' },
                    { value: 'Procedural Practice', label: 'Procedural Practice' },
                    { value: 'General Legal Doubt', label: 'General Legal Doubt' },
                  ]}
                  value={doubtCategory}
                  onChange={(val) => setDoubtCategory(val)}
                  placeholder="Select Category"
                  sheetTitle="Doubt Category"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Describe what you are stuck on
                </label>
                <textarea
                  rows={4}
                  value={doubtText}
                  onChange={(e) => setDoubtText(e.target.value)}
                  placeholder="Explain your confusion or question on this lecture's provisions..."
                  className="w-full rounded-xl bg-slate-50 dark:bg-[#070b14] border border-slate-200 dark:border-[#141e32] p-3 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#c19b48] transition-colors resize-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDoubtModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#141e32] text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingDoubt}
                  className="px-4 py-2 rounded-xl bg-[#c19b48] hover:bg-[#d8b862] text-xs font-semibold text-[#061120] flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingDoubt ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>Submit Doubt Query</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

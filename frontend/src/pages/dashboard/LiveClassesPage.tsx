import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Settings,
  Users,
  MessageSquare,
  Send,
  Paperclip,
  Download,
  Bookmark,
  Clock,
  User,
  Radio,
  ChevronLeft,
  ChevronRight,
  ThumbsUp,
  ThumbsDown,
  X,
  Loader2,
  Eye,
  Pin,
} from 'lucide-react';
import { toast } from '../../lib/toast';
import { io, type Socket } from 'socket.io-client';
import { apiClient, getAccessToken } from '../../lib/apiClient';
import { useAuthStore } from '../../store/useAuthStore';
import { LiveStreamCanvasSkeleton, RecordingCardSkeleton } from '../../components/ui/skeleton';
import { UniversalPdfModal } from '../../components/pdf';
import { SegmentedTabs } from '../../components/ui/tabs';
import { ThemeSwitcher } from '../../components/dashboard/ThemeSwitcher';

interface ChatMessage {
  id: string;
  sender: string;
  role: 'student' | 'faculty' | 'admin';
  text: string;
  time: string;
  isFacultyMessage?: boolean;
  isPinned?: boolean;
  isDoubt?: boolean;
}

interface LearningFocusItem {
  title: string;
  description: string;
}

interface LiveClassData {
  _id: string;
  title: string;
  subject: string;
  topic: string;
  description?: string;
  facultyName: string;
  facultyTitle?: string;
  startTime: string;
  endTime: string;
  scheduledDate: string;
  status: 'scheduled' | 'upcoming' | 'live' | 'ended' | 'archived';
  currentLiveCount: number;
  sessionTopic: string;
  learningFocus?: LearningFocusItem[];
  handoutPdf?: {
    fileName: string;
    fileUrl: string;
    fileSize: string;
  };
}

interface ArchivedClassItem {
  _id: string;
  id?: string;
  subject: string;
  title: string;
  date: string;
  duration: string;
  durationSeconds?: number;
  faculty: string;
  facultyTitle?: string;
  videoUrl: string;
  notesFile?: {
    fileName: string;
    fileUrl: string;
    fileSize: string;
  };
  notesSize?: string;
  chapters?: Array<{ timestampSeconds: number; title: string }>;
  likesCount: number;
  dislikesCount: number;
  commentsCount: number;
  viewsCount?: number;
}

interface ArchivedComment {
  _id: string;
  userName: string;
  userRole: string;
  text: string;
  createdAt: string;
  likesCount: number;
}

interface OtherLiveSession {
  id: string;
  title: string;
  subtitle: string;
  badge?: string;
  isLive?: boolean;
  date?: string;
  time?: string;
}

const DEFAULT_CHAMBER_MESSAGES: ChatMessage[] = [
  {
    id: 'm1',
    sender: 'Aman Singh',
    role: 'student',
    text: 'Sir, is this provision applicable to both cognizable and non-cognizable offences?',
    time: '7:02 PM',
  },
  {
    id: 'm2',
    sender: 'Priya Deshmukh',
    role: 'student',
    text: 'Can you please explain the latest amendment in Sec 173?',
    time: '7:04 PM',
  },
  {
    id: 'm3',
    sender: 'Adv. Sharma',
    role: 'faculty',
    text: 'Yes, it applies to both. The timelines differ. Let me explain with an example...',
    time: '7:05 PM',
    isFacultyMessage: true,
    isPinned: true,
  },
  {
    id: 'm4',
    sender: 'Rohit Kumar',
    role: 'student',
    text: 'Sir, will this be asked in Mains?',
    time: '7:06 PM',
  },
  {
    id: 'm5',
    sender: 'Adv. Sharma',
    role: 'faculty',
    text: "Yes, it's very important for both Mains and Interview. Make short notes of key provisions.",
    time: '7:07 PM',
    isFacultyMessage: true,
    isPinned: true,
  },
];

const OTHER_SESSIONS: OtherLiveSession[] = [
  {
    id: 's1',
    title: 'BNSS - Key Provisions',
    subtitle: 'Live Now • Adv. Sharma',
    isLive: true,
    badge: 'LIVE',
  },
  {
    id: 's2',
    title: 'BNS - Important Sections',
    subtitle: 'Tomorrow • 7:00 PM',
    date: 'Tomorrow',
    time: '7:00 PM',
  },
  {
    id: 's3',
    title: 'Evidence Act - Case Laws',
    subtitle: 'Oct 2 • 6:00 PM',
    date: 'Oct 2',
    time: '6:00 PM',
  },
  {
    id: 's4',
    title: 'Judicial Ethics & Conduct',
    subtitle: 'Oct 3 • 7:00 PM',
    date: 'Oct 3',
    time: '7:00 PM',
  },
];

export const LiveClassesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'stream' | 'recordings'>('stream');

  // Live Stream State
  const [liveClass, setLiveClass] = useState<LiveClassData | null>(null);
  const [liveCount, setLiveCount] = useState<number>(1);
  const [messages, setMessages] = useState<ChatMessage[]>(DEFAULT_CHAMBER_MESSAGES);
  const [newMsg, setNewMsg] = useState('');
  const [isLoadingStream, setIsLoadingStream] = useState(true);
  const [isPlayingSession, setIsPlayingSession] = useState(true);

  // Video Controls State
  const [isPlaying, setIsPlaying] = useState(true);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState('1x');
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [isCcActive, setIsCcActive] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFullscreenChat, setShowFullscreenChat] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Archives State
  const [archives, setArchives] = useState<ArchivedClassItem[]>([]);
  const [isLoadingArchives, setIsLoadingArchives] = useState(true);

  // Active Watched Archive Modal
  const [selectedArchive, setSelectedArchive] = useState<ArchivedClassItem | null>(null);
  const [archiveComments, setArchiveComments] = useState<ArchivedComment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [userReaction, setUserReaction] = useState<'like' | 'dislike' | null>(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // In-App Handout/Notes PDF Viewer
  const [activeHandoutPdf, setActiveHandoutPdf] = useState<{
    url: string;
    title: string;
    subtitle?: string;
    filename?: string;
  } | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);
  const carouselTrackRef = useRef<HTMLDivElement | null>(null);
  const liveVideoRef = useRef<HTMLDivElement | null>(null);

  // Lock body scroll while in fullscreen chamber
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Sync Fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isPlayerFullscreen = document.fullscreenElement === liveVideoRef.current;
      setIsFullscreen(isPlayerFullscreen);
      if (!isPlayerFullscreen) setShowFullscreenChat(false);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // F toggles the player fullscreen; Escape exits through the browser fullscreen API.
  useEffect(() => {
    const handlePlayerKeys = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping = target?.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName || '');
      if (isTyping || event.altKey || event.ctrlKey || event.metaKey) return;

      if (event.key.toLowerCase() === 'f') {
        event.preventDefault();
        toggleFullscreen();
      } else if (event.key === 'Escape' && !document.fullscreenElement && isFullscreen) {
        setIsFullscreen(false);
        setShowFullscreenChat(false);
      }
    };
    window.addEventListener('keydown', handlePlayerKeys);
    return () => window.removeEventListener('keydown', handlePlayerKeys);
  }, [isFullscreen]);

  // Visual Viewport resize handler for mobile keyboard
  useEffect(() => {
    const handleResize = () => {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    window.visualViewport?.addEventListener('resize', handleResize);
    return () => window.visualViewport?.removeEventListener('resize', handleResize);
  }, []);

  // Back Navigation Helper
  const handleBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/dashboard');
    }
  };

  // Toggle Native Fullscreen
  const toggleFullscreen = async () => {
    if (document.fullscreenElement) {
      if (document.fullscreenElement === liveVideoRef.current) {
        await document.exitFullscreen().catch(() => {});
      }
      return;
    }

    const player = liveVideoRef.current;
    if (!player) return;

    if (player.requestFullscreen) {
      try {
        await player.requestFullscreen();
        return;
      } catch {
        // Use the fixed-position fallback on browsers that reject element fullscreen.
      }
    }
    setIsFullscreen(true);
  };

  // 1. Fetch Current Live Class Data
  const fetchCurrentClass = async () => {
    try {
      setIsLoadingStream(true);
      const res = await apiClient.get('/live-classes/current');
      if (res.data?.data?.class) {
        const cls = res.data.data.class;
        setLiveClass(cls);
        setLiveCount(cls.currentLiveCount || 1);
        if (res.data.data.initialMessages && res.data.data.initialMessages.length > 0) {
          setMessages(res.data.data.initialMessages);
        }
      }
    } catch (err) {
      console.error('Failed to fetch live class:', err);
    } finally {
      setIsLoadingStream(false);
    }
  };

  // 2. Fetch Recorded Archives
  const fetchArchives = async () => {
    try {
      setIsLoadingArchives(true);
      const res = await apiClient.get('/live-classes/archives');
      if (res.data?.data) {
        setArchives(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load archives:', err);
    } finally {
      setIsLoadingArchives(false);
    }
  };

  useEffect(() => {
    fetchCurrentClass();
    fetchArchives();
  }, []);

  // 3. Socket.io Real-Time Connection
  useEffect(() => {
    if (!liveClass?._id) return;

    const token = getAccessToken();
    const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const baseUrl = rawUrl.replace(/\/api\/?$/, '');

    const socket = io(`${baseUrl}/live-class`, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.emit('live_class:join_room', { classId: liveClass._id }, (res: any) => {
      if (res?.success && res.data?.liveCount) {
        setLiveCount(res.data.liveCount);
      }
    });

    socket.on('live_class:new_chat', (msg: ChatMessage) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      setTimeout(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    });

    socket.on('live_class:participant_count', (data: { count: number }) => {
      if (data?.count) setLiveCount(data.count);
    });

    socket.on('live_class:status_changed', (data: { status: string }) => {
      if (data?.status) {
        setLiveClass((prev) => (prev ? { ...prev, status: data.status as any } : prev));
        if (data.status === 'live') {
          toast.success('Adv. Rajinder Sir has launched the live chamber!');
        } else if (data.status === 'ended') {
          toast.info('The live lecture has concluded. Recording processing initiated.');
        }
      }
    });

    // Heartbeat Interval (60s)
    const heartbeatTimer = setInterval(() => {
      socket.emit('live_class:heartbeat', { classId: liveClass._id });
    }, 60000);

    return () => {
      clearInterval(heartbeatTimer);
      socket.disconnect();
    };
  }, [liveClass?._id]);

  // Handle Send Chat Message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsg.trim()) return;

    const socket = socketRef.current;
    const textToSend = newMsg.trim();
    setNewMsg('');

    const localMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: user?.name || 'Adv. Rohit Verma',
      role: (user?.role as any) || 'student',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isFacultyMessage: user?.role === 'faculty' || user?.role === 'admin',
      isDoubt: true,
    };

    if (socket && socket.connected && liveClass?._id) {
      socket.emit(
        'live_class:send_chat',
        {
          classId: liveClass._id,
          messageText: textToSend,
          isDoubt: true,
        },
        (res: any) => {
          if (!res?.success) {
            toast.error(res?.error || 'Failed to submit doubt.');
          } else {
            toast.success('Doubt submitted to lecture queue');
          }
        }
      );
    } else {
      setMessages((prev) => [...prev, localMsg]);
      toast.success('Doubt submitted to lecture queue');
    }

    setTimeout(() => {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  // Connect / Join Session via Video SDK
  const handleJoinVideoSession = async () => {
    if (!liveClass) return;
    try {
      setIsPlayingSession(true);
      const res = await apiClient.post(`/live-classes/${liveClass._id}/join`);
      if (res.data?.data?.token) {
        toast.success('Connected to Zoom Video SDK interactive chamber stream!');
      }
    } catch (err: any) {
      console.error('Failed to initialize video session:', err);
      toast.info('Streaming from chamber live feed.');
    }
  };

  // Open Archived Lecture Modal & Load Comments
  const handleOpenArchive = async (rec: ArchivedClassItem) => {
    setSelectedArchive(rec);
    try {
      const [detailsRes, commentsRes] = await Promise.all([
        apiClient.get(`/live-classes/archives/${rec._id || rec.id}`),
        apiClient.get(`/live-classes/archives/${rec._id || rec.id}/comments`),
      ]);

      if (detailsRes.data?.data?.userReaction) {
        setUserReaction(detailsRes.data.data.userReaction);
      }
      if (commentsRes.data?.data) {
        setArchiveComments(commentsRes.data.data);
      }
    } catch (err) {
      console.error('Failed to load archive details:', err);
    }
  };

  // React to Archived Lecture
  const handleReactArchive = async (reaction: 'like' | 'dislike') => {
    if (!selectedArchive) return;
    try {
      const res = await apiClient.post(
        `/live-classes/archives/${selectedArchive._id || selectedArchive.id}/react`,
        { reaction }
      );
      if (res.data?.data) {
        setUserReaction(res.data.data.userReaction);
        setSelectedArchive((prev) =>
          prev
            ? {
                ...prev,
                likesCount: res.data.data.likesCount,
                dislikesCount: res.data.data.dislikesCount,
              }
            : prev
        );
      }
    } catch (err) {
      toast.error('Failed to update reaction.');
    }
  };

  // Post Comment on Archive
  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !selectedArchive) return;

    try {
      setIsSubmittingComment(true);
      const res = await apiClient.post(
        `/live-classes/archives/${selectedArchive._id || selectedArchive.id}/comments`,
        { text: newCommentText.trim() }
      );
      if (res.data?.data) {
        setArchiveComments((prev) => [res.data.data, ...prev]);
        setNewCommentText('');
        toast.success('Comment posted successfully!');
      }
    } catch (err) {
      toast.error('Failed to post comment.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Add to Notes Bookmark handler
  const handleAddToNotes = () => {
    setIsBookmarked((prev) => !prev);
    if (!isBookmarked) {
      toast.success('Lecture timestamp & BNSS citation saved to your Study Notes!');
    } else {
      toast.info('Removed from Study Notes.');
    }
  };

  // Download / View Handout PDF
  const handleOpenHandout = () => {
    if (liveClass?.handoutPdf?.fileUrl) {
      setActiveHandoutPdf({
        url: liveClass.handoutPdf.fileUrl,
        title: liveClass.handoutPdf.fileName || 'BNSS Class Handout',
        subtitle: `${liveClass.sessionTopic || 'Bhartiya Nagarik Suraksha Sanhita'} • ${liveClass.facultyName || 'Adv. Sharma'}`,
        filename: liveClass.handoutPdf.fileName || 'BNSS_Handout.pdf',
      });
    } else {
      toast.success('Opening BNSS Chapter Handout (PDF)');
    }
  };


  // Carousel navigation
  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselTrackRef.current) {
      const scrollAmount = direction === 'left' ? -260 : 260;
      carouselTrackRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="h-screen h-[100dvh] w-screen overflow-hidden flex flex-col bg-[#F7F3E6] dark:bg-[#040b14] text-slate-900 dark:text-slate-100 transition-colors selection:bg-[#c19b48]/30">
      {/* 1. TOP CHAMBER NAVIGATION HEADER */}
      <header className="h-14 sm:h-16 shrink-0 border-b border-slate-200 dark:border-[#143564] bg-white dark:bg-[#061120] px-3 sm:px-5 flex items-center justify-between gap-3 shadow-xs z-30">
        {/* Left Side: Back Arrow, Chamber Title & Live Badge */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
          <button
            onClick={handleBack}
            className="p-1.5 sm:p-2 -ml-1 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            title="Return to User Panel"
            aria-label="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5 sm:w-5 sm:h-5 text-slate-800 dark:text-slate-200" />
          </button>

          <h1 className="min-w-0 font-serif font-bold text-sm sm:text-base md:text-lg leading-tight text-slate-900 dark:text-white whitespace-normal break-words">
            <span>Live Classroom Chamber</span>
          </h1>
        </div>

        {/* Center / Right Side: Attendees, Tabs Switcher, Fullscreen & Settings */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Attendees Counter Pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] text-xs text-slate-700 dark:text-slate-300 font-medium shrink-0">
            <Users className="w-3.5 h-3.5 text-[#c19b48]" />
            <span>{liveCount} Aspirants Attending</span>
          </div>

          {/* Tab Switcher (Desktop & Tablet) */}
          <div className="hidden md:flex items-center p-1 bg-slate-100 dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] rounded-xl shrink-0">
            <button
              onClick={() => setActiveTab('stream')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'stream'
                  ? 'bg-[#c19b48] text-[#061120] shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium'
              }`}
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Live Lecture Stream</span>
            </button>
            <button
              onClick={() => setActiveTab('recordings')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'recordings'
                  ? 'bg-[#c19b48] text-[#061120] shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium'
              }`}
            >
              <span>Recorded Archive ({archives.length})</span>
            </button>
          </div>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl border border-slate-200 dark:border-[#143564] bg-white dark:bg-[#0a1c36] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-[#c19b48] transition-colors cursor-pointer hidden sm:flex items-center justify-center"
            title={isFullscreen ? 'Exit Video Fullscreen (Esc)' : 'Fullscreen Video (F)'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Theme Switcher Toggle */}
          <div className="shrink-0 flex items-center">
            <ThemeSwitcher />
          </div>

          {/* Settings Button */}
          <button
            onClick={() => toast.info('Chamber stream configured: 1080p 60fps • Ultra Low Latency')}
            className="p-2 rounded-xl border border-slate-200 dark:border-[#143564] bg-white dark:bg-[#0a1c36] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-[#c19b48] transition-colors cursor-pointer flex items-center justify-center"
            title="Chamber Settings & Preferences"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* MOBILE SECONDARY TAB STRIP (Row 2 on < 768px matching mobile reference) */}
      <div className="md:hidden px-3 py-2 border-b border-slate-200 dark:border-[#143564] bg-white dark:bg-[#061120] shrink-0">
        <SegmentedTabs<'stream' | 'recordings'>
          value={activeTab}
          onChange={setActiveTab}
          size="sm"
          fullWidthMobile={true}
          items={[
            {
              id: 'stream',
              label: 'Live Lecture Stream',
              shortLabel: 'Live Stream',
              icon: <Play className="w-3 h-3 fill-current" />,
            },
            {
              id: 'recordings',
              label: `Recorded Archive (${archives.length})`,
              shortLabel: `Archive (${archives.length})`,
            },
          ]}
        />
      </div>

      {/* 2. MAIN CHAMBER CONTENT AREA */}
      {activeTab === 'stream' ? (
        isLoadingStream && !liveClass ? (
          <div className="flex-1 min-h-0 p-4">
            <LiveStreamCanvasSkeleton />
          </div>
        ) : (
          <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-3 lg:gap-4 p-2.5 sm:p-4 overflow-y-auto md:overflow-hidden">
          {/* LEFT COLUMN: Main Video Player & Session Info Bar */}
          <div className="flex-none md:flex-1 md:min-h-0 min-w-0 flex flex-col md:justify-between md:overflow-hidden">
            {/* Video Player Canvas */}
            <div
              ref={liveVideoRef}
              className={`relative w-full aspect-video shrink-0 md:aspect-auto md:flex-1 md:min-h-[180px] bg-[#061120] border border-slate-200 dark:border-[#143564] overflow-hidden flex flex-col items-center justify-center shadow-lg group select-none ${
                isFullscreen ? 'fixed inset-0 z-[100] h-[100dvh] w-screen max-h-none aspect-auto rounded-none border-0' : 'rounded-2xl'
              }`}
            >
              {/* Simulated Judicial Classroom Blackboard & Faculty Presentation */}
              <div className="absolute inset-0 bg-[#08121e] flex items-center justify-center overflow-hidden">
                {/* Chalkboard Texture Background */}
                <div className="absolute inset-0 bg-radial from-[#0a1e35]/80 via-[#061120] to-[#030912] opacity-95" />

                {/* Blackboard Content Layout */}
                <div className="relative z-10 w-full h-full p-4 sm:p-6 flex flex-col justify-between pointer-events-none select-none">
                  {/* Chalkboard Title */}
                  <div className="text-center pt-1 sm:pt-2">
                    <h2 className="text-sm sm:text-lg md:text-xl font-serif font-bold text-amber-200 tracking-wide border-b border-amber-300/40 inline-block pb-0.5 sm:pb-1">
                      Bhartiya Nagarik Suraksha Sanhita (BNSS)
                    </h2>
                  </div>

                  {/* Chalkboard Sections Grid */}
                  <div className="grid grid-cols-12 gap-2 sm:gap-4 items-center text-[10px] sm:text-xs">
                    {/* Left: Object & Key Features */}
                    <div className="col-span-5 space-y-2 text-slate-200">
                      <div className="space-y-0.5">
                        <span className="font-bold text-amber-300 flex items-center gap-1">
                          <span className="w-3.5 h-3.5 rounded-full border border-amber-300 inline-flex items-center justify-center text-[9px]">
                            1
                          </span>
                          Object & Purpose
                        </span>
                        <ul className="list-disc list-inside text-slate-300 pl-1 text-[9px] sm:text-[11px] leading-tight space-y-0.5 opacity-90">
                          <li>Replace CrPC 1973</li>
                          <li>Speedy trial & Victim centric</li>
                          <li>Technology integration</li>
                          <li>Time bound procedures</li>
                        </ul>
                      </div>

                      <div className="space-y-0.5 hidden sm:block">
                        <span className="font-bold text-amber-300 flex items-center gap-1">
                          <span className="w-3.5 h-3.5 rounded-full border border-amber-300 inline-flex items-center justify-center text-[9px]">
                            2
                          </span>
                          Key Features
                        </span>
                        <ul className="list-disc list-inside text-slate-300 pl-1 text-[9px] sm:text-[11px] leading-tight space-y-0.5 opacity-90">
                          <li>Summons & warrants modernization</li>
                          <li>Investigation timelines</li>
                          <li>Bail provisions revamp</li>
                        </ul>
                      </div>
                    </div>

                    {/* Middle: Conceptual Shift Flow */}
                    <div className="col-span-3 text-center flex flex-col items-center justify-center space-y-1 sm:space-y-2">
                      <span className="text-[9px] sm:text-[11px] text-amber-300 font-semibold border-b border-amber-300/40">
                        Conceptual Shift
                      </span>
                      <div className="p-1 sm:p-2 rounded-lg border border-teal-400/50 bg-teal-950/40 text-teal-300 font-mono text-[8px] sm:text-[10px] leading-tight">
                        Efficient + Transparent
                        <br />+ Accountable
                      </div>
                      <div className="p-1 rounded-md border border-slate-600 bg-slate-900/60 text-[8px] sm:text-[9px] text-slate-300 font-mono">
                        CrPC 1973 → BNSS 2023
                      </div>
                    </div>

                    {/* Right: Faculty Silhouette / Graphic */}
                    <div className="col-span-4 flex flex-col items-center justify-center text-right pr-2">
                      <div className="w-16 h-16 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-full border-2 border-[#c19b48]/40 bg-gradient-to-tr from-[#0a1c36] to-[#143564] flex items-center justify-center shadow-xl relative overflow-hidden">
                        <User className="w-10 h-10 sm:w-16 sm:h-16 text-[#c19b48] opacity-80" />
                        <span className="absolute bottom-1 bg-[#c19b48] text-[#061120] text-[8px] sm:text-[10px] font-bold px-1.5 py-0.2 rounded-full uppercase">
                          Mentor
                        </span>
                      </div>
                      <span className="text-[10px] sm:text-xs font-serif font-bold text-white mt-1">
                        Adv. Sharma
                      </span>
                    </div>
                  </div>

                  {/* Chalkboard Footer Note */}
                  <div className="text-[8px] sm:text-[10px] text-slate-400 font-mono text-center pb-8 sm:pb-10">
                    Live Broadcast • Judicial Services Preliminary & Mains Chamber
                  </div>
                </div>
              </div>

              {/* OVERLAY: Top Video Badges */}
              <div className="absolute top-2.5 sm:top-3.5 left-2.5 sm:left-3.5 flex items-center gap-2 z-20">
                <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[9px] sm:text-[10px] font-bold tracking-wider uppercase flex items-center gap-1 animate-pulse shadow-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-white" /> LIVE
                </span>
                <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] sm:text-[11px] font-mono border border-white/15">
                  01:24:36
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-mono border border-white/15">
                  📶 {liveCount} Aspirants Attending
                </span>
                {isPlayingSession && (
                  <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-semibold border border-emerald-500/40">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Chamber Stream Connected</span>
                  </span>
                )}
              </div>

              {/* OVERLAY: Center Play/Join Button */}
              {!isPlaying && (
                <div
                  onClick={() => {
                    setIsPlaying(true);
                    handleJoinVideoSession();
                  }}
                  className="relative z-20 w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#c19b48] text-[#061120] flex items-center justify-center shadow-2xl hover:scale-105 transition-transform cursor-pointer"
                  title="Connect / Resume Chamber Stream"
                >
                  <Play className="w-7 h-7 fill-[#061120] ml-1" />
                </div>
              )}

              {/* Fullscreen-only comments overlay, opened from the player controls. */}
              {isFullscreen && showFullscreenChat && (
                <aside className="live-classroom-fullscreen-comments flex flex-col rounded-2xl bg-white/95 dark:bg-[#0a1c36]/95 backdrop-blur-md border border-slate-200 dark:border-[#143564] shadow-2xl overflow-hidden">
                  <div className="shrink-0 p-3 border-b border-slate-200 dark:border-[#143564] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-[#c19b48]" />
                      <h3 className="text-xs font-bold uppercase tracking-wide">Live Classroom Chat</h3>
                    </div>
                    <button type="button" onClick={() => setShowFullscreenChat(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10" aria-label="Close live comments">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex-1 min-h-0 p-3 overflow-y-auto space-y-3">
                    {messages.map((m) => {
                      const isFaculty = m.isFacultyMessage || m.role === 'faculty';
                      const initials = m.sender.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
                      return (
                        <div key={`fullscreen-${m.id}`} className="flex gap-2.5 items-start text-xs">
                          <div className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center font-bold text-[10px] ${isFaculty ? 'bg-[#c19b48] text-[#061120]' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'}`}>
                            {initials}
                          </div>
                          <div className="flex-1 min-w-0 space-y-0.5">
                            <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{m.sender}{isFaculty && <span className="ml-1 text-[#c19b48] font-bold">Faculty</span>}</span>
                              <span className="shrink-0 pl-1">{m.time}</span>
                            </div>
                            <div className={`p-2.5 rounded-xl text-[11px] leading-relaxed ${isFaculty ? 'bg-amber-50 dark:bg-[#c19b48]/15 border border-amber-200 dark:border-[#c19b48]/40 text-slate-900 dark:text-slate-100' : 'bg-slate-100 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] text-slate-800 dark:text-slate-200'}`}>
                              {m.text}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <form onSubmit={handleSendMessage} className="shrink-0 p-2.5 border-t border-slate-200 dark:border-[#143564] flex items-center gap-2">
                    <input type="text" value={newMsg} onChange={(e) => setNewMsg(e.target.value)} placeholder="Ask Rajinder Sir a doubt..." className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-white dark:bg-[#061120] border border-slate-200 dark:border-[#143564] text-xs focus:outline-none focus:border-[#c19b48]" />
                    <button type="submit" className="p-2 rounded-xl bg-[#c19b48] text-[#061120]" aria-label="Send live comment"><Send className="w-4 h-4" /></button>
                  </form>
                </aside>
              )}

              {/* OVERLAY: Bottom Custom Video Controls Bar */}
              <div className="absolute bottom-2 sm:bottom-3 inset-x-2 sm:inset-x-3 flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-black/75 backdrop-blur-md border border-white/10 text-white text-xs z-20">
                {/* Left Controls: Play/Pause, Live Indicator & Volume */}
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <button
                    onClick={() => setIsPlaying((p) => !p)}
                    className="p-1 hover:text-[#c19b48] transition-colors cursor-pointer"
                    title={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                  </button>

                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-red-400">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span>LIVE</span>
                  </div>

                  <div className="flex items-center gap-1.5 pl-1 sm:pl-2">
                    <button
                      onClick={() => setIsMuted((m) => !m)}
                      className="p-1 hover:text-[#c19b48] transition-colors cursor-pointer"
                      title={isMuted ? 'Unmute' : 'Mute'}
                    >
                      {isMuted || volume === 0 ? (
                        <VolumeX className="w-4 h-4 text-red-400" />
                      ) : (
                        <Volume2 className="w-4 h-4" />
                      )}
                    </button>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={isMuted ? 0 : volume}
                      onChange={(e) => {
                        setVolume(Number(e.target.value));
                        if (isMuted) setIsMuted(false);
                      }}
                      className="w-14 sm:w-20 h-1 accent-[#c19b48] bg-white/30 rounded-lg cursor-pointer hidden xs:inline-block"
                      title={`Volume ${volume}%`}
                    />
                  </div>
                </div>

                {/* Right Controls: CC, Speed, PiP, Fullscreen */}
                <div className="flex items-center gap-1.5 sm:gap-2.5 relative">
                  <button
                    onClick={() => setShowFullscreenChat((open) => !open)}
                    className={`p-1 transition-colors cursor-pointer ${showFullscreenChat ? 'text-[#e8cf8d]' : 'hover:text-[#c19b48]'}`}
                    title={showFullscreenChat ? 'Close Live Comments' : 'Open Live Comments'}
                    aria-label={showFullscreenChat ? 'Close live comments' : 'Open live comments'}
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                  {/* Closed Captions */}
                  <button
                    onClick={() => {
                      setIsCcActive((c) => !c);
                      toast.info(isCcActive ? 'Subtitles turned off' : 'Subtitles turned on (English / Hindi)');
                    }}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                      isCcActive
                        ? 'bg-[#c19b48] text-[#061120] border-[#c19b48]'
                        : 'border-white/30 text-white hover:border-white'
                    }`}
                    title="Closed Captions (CC)"
                  >
                    CC
                  </button>

                  {/* Playback Speed */}
                  <div className="relative">
                    <button
                      onClick={() => setShowSpeedMenu((s) => !s)}
                      className="px-1.5 py-0.5 rounded text-[11px] font-bold text-white hover:text-[#c19b48] transition-colors cursor-pointer"
                      title="Playback Speed"
                    >
                      {playbackSpeed}
                    </button>

                    {showSpeedMenu && (
                      <div className="absolute bottom-8 right-0 bg-[#061120] border border-white/20 rounded-xl p-1 shadow-2xl flex flex-col gap-0.5 text-xs z-30 min-w-16">
                        {['0.75x', '1x', '1.25x', '1.5x', '2x'].map((spd) => (
                          <button
                            key={spd}
                            onClick={() => {
                              setPlaybackSpeed(spd);
                              setShowSpeedMenu(false);
                            }}
                            className={`px-2 py-1 text-left rounded-lg text-[11px] cursor-pointer ${
                              playbackSpeed === spd
                                ? 'bg-[#c19b48] text-[#061120] font-bold'
                                : 'text-slate-300 hover:bg-white/10'
                            }`}
                          >
                            {spd}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Fullscreen Video Toggle */}
                  <button
                    onClick={toggleFullscreen}
                    className="p-1 hover:text-[#c19b48] transition-colors cursor-pointer"
                    title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Fullscreen (F)'}
                    aria-label={isFullscreen ? 'Exit video fullscreen' : 'Enter video fullscreen'}
                  >
                    {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Session Information & Action Controls Bar */}
            <div className="mt-2.5 sm:mt-3 p-2.5 sm:p-3.5 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 shadow-xs shrink-0">
              {/* Session Time & Faculty Mentorship Details */}
              <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-1.5 sm:gap-6 text-[11px] sm:text-xs text-slate-700 dark:text-slate-300">
                <div className="min-w-0 flex items-start sm:items-center gap-2">
                  <Clock className="w-4 h-4 text-[#c19b48] shrink-0 mt-0.5 sm:mt-0" />
                  <p className="min-w-0 leading-snug">
                    <span className="font-semibold text-slate-500 dark:text-slate-400">Session:</span>{' '}
                    Started <strong className="text-slate-900 dark:text-white">7:00 PM</strong> · Ends <strong className="text-slate-900 dark:text-white">8:30 PM</strong>
                  </p>
                </div>

                <div className="min-w-0 flex items-start sm:items-center gap-2 border-l-0 sm:border-l sm:border-slate-200 sm:dark:border-[#143564] sm:pl-6">
                  <User className="w-4 h-4 text-[#c19b48] shrink-0 mt-0.5 sm:mt-0" />
                  <p className="min-w-0 leading-snug">
                    <span className="font-semibold text-slate-500 dark:text-slate-400">Faculty:</span>{' '}
                    <strong className="font-bold text-slate-900 dark:text-white">
                      {liveClass?.facultyName || 'Adv. Sharma'}
                    </strong>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400"> · </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      {liveClass?.facultyTitle || 'Criminal Law Specialist'}
                    </span>
                  </p>
                </div>
              </div>

              {/* Action Buttons: Handout (PDF) & Add to Notes */}
              <div className="flex items-center gap-2 self-stretch sm:self-auto w-full sm:w-auto">
                <button
                  onClick={handleOpenHandout}
                  className="flex-1 sm:flex-none min-w-0 inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-xl bg-[#c19b48] hover:bg-[#d4ad53] text-[#061120] text-[10px] sm:text-xs font-bold transition-all shadow-xs cursor-pointer whitespace-nowrap"
                >
                  <Download className="w-3.5 h-3.5 shrink-0" />
                  <span>Class Handout (PDF)</span>
                </button>

                <button
                  onClick={handleAddToNotes}
                  title={isBookmarked ? 'Saved to Notes' : 'Add to Notes'}
                  aria-label={isBookmarked ? 'Saved to Notes' : 'Add to Notes'}
                  className={`w-10 sm:w-auto sm:flex-none shrink-0 inline-flex items-center justify-center gap-1.5 px-2 sm:px-3.5 py-2 rounded-xl border text-[10px] sm:text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    isBookmarked
                      ? 'bg-amber-100 dark:bg-[#c19b48]/20 border-[#c19b48] text-[#c19b48]'
                      : 'border-slate-200 dark:border-[#143564] text-slate-700 dark:text-slate-200 hover:border-[#c19b48]'
                  }`}
                >
                  <Bookmark className={`w-3.5 h-3.5 shrink-0 ${isBookmarked ? 'fill-current text-[#c19b48]' : ''}`} />
                  <span className="hidden sm:inline">{isBookmarked ? 'Saved to Notes' : 'Add to Notes'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Live Classroom Chat Pane */}
          <div className="w-full md:w-80 lg:w-96 xl:w-[420px] shrink-0 h-[480px] md:h-full flex flex-col rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] overflow-hidden shadow-xs">
            {/* Chat Pane Header */}
            <div className="shrink-0 p-3.5 sm:p-4 border-b border-slate-200 dark:border-[#143564] flex items-center justify-between bg-slate-50/80 dark:bg-[#061120]/80">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#c19b48]" />
                <h3 className="text-xs font-serif font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Live Classroom Chat
                </h3>
              </div>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Faculty Online
              </span>
            </div>

            {/* Chat Message Stream */}
            <div className="flex-1 min-h-0 p-3 overflow-y-auto space-y-3">
              {messages.map((m) => {
                const isFaculty = m.isFacultyMessage || m.role === 'faculty';
                const initials = m.sender
                  .split(' ')
                  .map((w) => w[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase();

                return (
                  <div key={m.id} className="flex gap-2.5 items-start text-xs">
                    {/* Avatar Circle */}
                    <div
                      className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center font-bold text-[10px] shadow-xs ${
                        isFaculty
                          ? 'bg-[#c19b48] text-[#061120]'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      {initials}
                    </div>

                    {/* Message Bubble Container */}
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1 truncate">
                          {m.sender}
                          {isFaculty && (
                            <span className="text-[#c19b48] font-bold text-[9px] bg-[#c19b48]/15 px-1 rounded">
                              Faculty
                            </span>
                          )}
                        </span>
                        <span className="shrink-0 pl-1">{m.time}</span>
                      </div>

                      {/* Bubble Text */}
                      <div
                        className={`p-2.5 rounded-xl text-[11px] leading-relaxed relative ${
                          isFaculty
                            ? 'bg-amber-50/90 dark:bg-[#c19b48]/15 border border-amber-200 dark:border-[#c19b48]/40 text-slate-900 dark:text-slate-100 font-medium'
                            : 'bg-slate-100 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {isFaculty && (
                          <Pin className="w-3 h-3 text-[#c19b48] absolute top-2 right-2 fill-[#c19b48]/30" />
                        )}
                        <p className={isFaculty ? 'pr-4' : ''}>{m.text}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={chatBottomRef} />
            </div>

            {/* Pinned Bottom Chat Composer */}
            <form
              onSubmit={handleSendMessage}
              className="shrink-0 p-2.5 sm:p-3 border-t border-slate-200 dark:border-[#143564] bg-slate-50/90 dark:bg-[#061120]/90 flex items-center gap-2"
            >
              <input
                type="text"
                value={newMsg}
                onChange={(e) => setNewMsg(e.target.value)}
                placeholder="Ask Rajinder Sir a doubt..."
                className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#c19b48] transition-colors"
              />

              <button
                type="button"
                onClick={() => toast.info('You can upload judicial handwritten doubt slips or case references.')}
                className="p-2 rounded-xl border border-slate-200 dark:border-[#143564] bg-white dark:bg-[#0a1c36] text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                title="Attach Document or Image"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              <button
                type="submit"
                className="p-2 rounded-xl bg-[#c19b48] hover:bg-[#d8b862] text-[#061120] transition-colors cursor-pointer shadow-xs"
                title="Send Doubt to Live Stream Queue"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
        )
      ) : (
        /* 3. RECORDED ARCHIVE LIBRARY VIEW */
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Grid of Lecture Archive Cards */}
          {isLoadingArchives && archives.length === 0 ? (
            <RecordingCardSkeleton count={6} />
          ) : archives.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] space-y-2">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No archived lectures available at this time.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {archives.map((rec) => (
                <div
                  key={rec._id || rec.id}
                  className="p-5 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] flex flex-col justify-between space-y-4 shadow-xs hover:border-[#c19b48]/60 transition-all group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[10px] font-bold text-[#c19b48] uppercase tracking-wider">
                        {rec.subject}
                      </span>
                      <span className="text-slate-400 text-[11px]">{rec.date}</span>
                    </div>
                    <h4 className="text-sm font-serif font-bold text-slate-900 dark:text-white group-hover:text-[#c19b48] transition-colors line-clamp-2">
                      {rec.title}
                    </h4>
                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 pt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#c19b48]" /> {rec.duration}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-[#c19b48]" /> {rec.faculty}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-[#143564] flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-400">
                      {rec.notesFile?.fileSize || rec.notesSize || '3.5 MB PDF'}
                    </span>
                    <div className="flex items-center gap-2">
                      {rec.notesFile?.fileUrl && (
                        <button
                          onClick={() =>
                            setActiveHandoutPdf({
                              url: rec.notesFile!.fileUrl,
                              title: rec.notesFile?.fileName || `${rec.title} - Study Notes`,
                              subtitle: `${rec.subject} • ${rec.faculty}`,
                              filename: rec.notesFile?.fileName || `${rec.title}_Notes.pdf`,
                            })
                          }
                          className="p-1.5 rounded-lg text-slate-400 hover:text-[#c19b48] hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                          title="Read Study Notes in PDF Viewer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (rec.notesFile?.fileUrl) window.open(rec.notesFile.fileUrl, '_blank');
                          toast.success(`Downloading notes for ${rec.title}`);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-[#c19b48] hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                        title="Download Bare Act Study Notes"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenArchive(rec)}
                        className="px-3 py-1.5 rounded-lg bg-[#0a1c36] dark:bg-[#143564] hover:bg-[#143564] text-white font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Watch</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. BOTTOM CAROUSEL: "OTHER LIVE SESSIONS" */}
      <footer className="shrink-0 px-3 sm:px-4 py-2 border-t border-slate-200 dark:border-[#143564] bg-white dark:bg-[#061120] backdrop-blur-md flex items-center gap-2 sm:gap-3 z-20">
        {/* Label with Live Radio Pulse */}
        <div className="flex items-center gap-2 shrink-0 pr-2 border-r border-slate-200 dark:border-[#143564] text-xs font-bold text-slate-800 dark:text-slate-200">
          <Radio className="w-4 h-4 text-red-500 animate-pulse shrink-0" />
          <span className="hidden sm:inline">Other Live Sessions</span>
        </div>

        {/* Carousel Navigation Arrow (Left) */}
        <button
          onClick={() => scrollCarousel('left')}
          className="p-1.5 rounded-lg border border-slate-200 dark:border-[#143564] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer shrink-0"
          title="Previous sessions"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        {/* Horizontal Track of Live & Upcoming Sessions */}
        <div
          ref={carouselTrackRef}
          className="flex-1 min-w-0 flex items-center gap-2.5 overflow-x-auto scrollbar-none snap-x py-0.5"
        >
          {OTHER_SESSIONS.map((ses) => (
            <div
              key={ses.id}
              onClick={() => {
                if (ses.isLive) {
                  toast.success(`Active stream switched to ${ses.title}`);
                } else {
                  toast.info(`Reminder registered for ${ses.title} (${ses.subtitle})`);
                }
              }}
              className={`shrink-0 snap-start px-3 py-1.5 rounded-xl border text-xs flex items-center gap-2.5 transition-all cursor-pointer ${
                ses.isLive
                  ? 'bg-amber-50/80 dark:bg-[#0a1c36] border-[#c19b48] shadow-xs'
                  : 'bg-slate-50 dark:bg-[#061120] border-slate-200 dark:border-[#143564] hover:border-[#c19b48]/50'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                  ses.isLive
                    ? 'bg-[#c19b48] text-[#061120]'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                {ses.isLive ? <Play className="w-3 h-3 fill-current ml-0.5" /> : <Clock className="w-3 h-3" />}
              </div>

              <div className="w-36 sm:w-44 min-w-0">
                <span className="font-bold text-slate-900 dark:text-white block text-[11px] whitespace-normal break-words leading-tight">
                  {ses.title}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block whitespace-normal break-words leading-tight">
                  {ses.subtitle}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Carousel Navigation Arrow (Right) */}
        <button
          onClick={() => scrollCarousel('right')}
          className="p-1.5 rounded-lg border border-slate-200 dark:border-[#143564] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer shrink-0"
          title="Next sessions"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </footer>

      {/* 5. MODAL: INTERACTIVE RECORDED LECTURE PLAYER */}
      {selectedArchive && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-4xl rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 dark:border-[#143564] flex items-center justify-between bg-slate-50 dark:bg-[#061120]">
              <div className="flex items-center gap-2 truncate pr-4">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#c19b48]/20 text-[#c19b48] uppercase">
                  {selectedArchive.subject}
                </span>
                <h3 className="font-serif text-sm font-bold text-slate-900 dark:text-white truncate">
                  {selectedArchive.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedArchive(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Viewport */}
            <div className="aspect-video w-full bg-black relative">
              <video
                src={selectedArchive.videoUrl}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            </div>

            {/* Content & Discussion Drawer */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-[#143564] pb-3">
                <div>
                  <h4 className="font-serif text-base font-bold text-slate-900 dark:text-white">
                    {selectedArchive.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Faculty: {selectedArchive.faculty} • Duration: {selectedArchive.duration} • Recorded:{' '}
                    {selectedArchive.date}
                  </p>
                </div>

                {/* Reaction Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleReactArchive('like')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${
                      userReaction === 'like'
                        ? 'bg-[#c19b48] text-[#061120] border-[#c19b48]'
                        : 'border-slate-200 dark:border-[#143564] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#143564]'
                    }`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>{selectedArchive.likesCount}</span>
                  </button>
                  <button
                    onClick={() => handleReactArchive('dislike')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${
                      userReaction === 'dislike'
                        ? 'bg-rose-500 text-white border-rose-500'
                        : 'border-slate-200 dark:border-[#143564] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#143564]'
                    }`}
                  >
                    <ThumbsDown className="w-3.5 h-3.5" />
                    <span>{selectedArchive.dislikesCount}</span>
                  </button>
                </div>
              </div>

              {/* Comments Feed */}
              <div className="space-y-3">
                <h5 className="font-serif font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Discussion Chamber ({archiveComments.length})
                </h5>

                <form onSubmit={handlePostComment} className="flex gap-2">
                  <input
                    type="text"
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    placeholder="Contribute a query or observation on this archive..."
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#c19b48]"
                  />
                  <button
                    type="submit"
                    disabled={isSubmittingComment}
                    className="px-4 py-2 rounded-xl bg-[#c19b48] hover:bg-[#d8b862] text-[#061120] font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingComment ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Post'}
                  </button>
                </form>

                <div className="space-y-2 pt-2 max-h-48 overflow-y-auto">
                  {archiveComments.length === 0 ? (
                    <p className="text-slate-400 text-center py-4">No comments posted yet.</p>
                  ) : (
                    archiveComments.map((c) => (
                      <div
                        key={c._id}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-100 dark:border-[#143564] space-y-1"
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {c.userName} ({c.userRole})
                          </span>
                          <span className="text-slate-400">{c.createdAt}</span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 text-xs">{c.text}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. UNIVERSAL PDF VIEWER MODAL */}
      {activeHandoutPdf && (
        <UniversalPdfModal
          isOpen={true}
          onClose={() => setActiveHandoutPdf(null)}
          url={activeHandoutPdf.url}
          title={activeHandoutPdf.title}
          subtitle={activeHandoutPdf.subtitle}
          downloadFileName={activeHandoutPdf.filename}
        />
      )}
    </div>
  );
};

export default LiveClassesPage;

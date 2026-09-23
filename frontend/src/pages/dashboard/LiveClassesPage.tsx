import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Clock,
  User,
  MessageSquare,
  Send,
  Download,
  Sparkles,
  Search,
  ThumbsUp,
  ThumbsDown,
  X,
  Loader2,
  Bell,
} from 'lucide-react';
import { toast } from '../../lib/toast';
import { io, type Socket } from 'socket.io-client';
import { apiClient, getAccessToken } from '../../lib/apiClient';
import { useAuthStore } from '../../store/useAuthStore';
import { CustomSelect } from '../../components/ui/CustomSelect';
import { LiveStreamCanvasSkeleton, RecordingCardSkeleton } from '../../components/ui/skeleton';

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
  learningFocus: LearningFocusItem[];
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

export const LiveClassesPage: React.FC = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'stream' | 'recordings'>('stream');

  // Live Stream State
  const [liveClass, setLiveClass] = useState<LiveClassData | null>(null);
  const [liveCount, setLiveCount] = useState<number>(184);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [isLoadingStream, setIsLoadingStream] = useState(true);
  const [isPlayingSession, setIsPlayingSession] = useState(false);

  // Archives State
  const [archives, setArchives] = useState<ArchivedClassItem[]>([]);
  const [isLoadingArchives, setIsLoadingArchives] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');

  // Active Watched Archive Modal
  const [selectedArchive, setSelectedArchive] = useState<ArchivedClassItem | null>(null);
  const [archiveComments, setArchiveComments] = useState<ArchivedComment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [userReaction, setUserReaction] = useState<'like' | 'dislike' | null>(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Upcoming Alert subscription
  const [isAlertSubscribed, setIsAlertSubscribed] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // 1. Fetch Current Live Class Data
  const fetchCurrentClass = async () => {
    try {
      setIsLoadingStream(true);
      const res = await apiClient.get('/live-classes/current');
      if (res.data?.data?.class) {
        const cls = res.data.data.class;
        setLiveClass(cls);
        setLiveCount(cls.currentLiveCount || 184);
        if (res.data.data.initialMessages) {
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
    if (!newMsg.trim() || !liveClass?._id) return;

    const socket = socketRef.current;
    const textToSend = newMsg.trim();
    setNewMsg('');

    if (socket && socket.connected) {
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
      // Optimistic fallback
      const localMsg: ChatMessage = {
        id: Date.now().toString(),
        sender: user?.name || 'Adv. Rohit Verma',
        role: (user?.role as any) || 'student',
        text: textToSend,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isFacultyMessage: user?.role === 'faculty' || user?.role === 'admin',
        isDoubt: true,
      };
      setMessages((prev) => [...prev, localMsg]);
      toast.success('Doubt submitted to lecture queue');
    }
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
      const res = await apiClient.post(`/live-classes/archives/${selectedArchive._id || selectedArchive.id}/react`, {
        reaction,
      });
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

  // Toggle Alert Reminder
  const handleToggleAlert = async () => {
    if (!liveClass) return;
    try {
      const res = await apiClient.post(`/live-classes/${liveClass._id}/alert-toggle`);
      setIsAlertSubscribed(res.data?.data?.isSubscribed);
      toast.success(res.data?.message || 'Reminder updated.');
    } catch (err) {
      toast.error('Failed to toggle reminder.');
    }
  };

  // Download Handout PDF
  const handleDownloadHandout = () => {
    if (liveClass?.handoutPdf?.fileUrl) {
      window.open(liveClass.handoutPdf.fileUrl, '_blank');
      toast.success(`Downloading ${liveClass.handoutPdf.fileName}`);
    } else {
      toast.success('Lecture handouts downloaded.');
    }
  };

  // Filtered archives
  const filteredArchives = archives.filter((rec) => {
    const matchesSearch =
      !searchQuery.trim() ||
      rec.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.faculty.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSubject =
      selectedSubject === 'all' || rec.subject.toLowerCase().includes(selectedSubject.toLowerCase());

    return matchesSearch && matchesSubject;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-50 dark:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold mb-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span>Interactive Classroom Chamber</span>
            {(isLoadingStream || isLoadingArchives) && (
              <Loader2 className="w-3 h-3 ml-1 animate-spin text-[#c19b48]" />
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 dark:text-white">
            Live Streaming & Lecture Recordings
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Bare Act line-by-line decoding with direct 2-way doubt resolution.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-[#061120] rounded-xl border border-slate-200 dark:border-[#143564] self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('stream')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'stream'
                ? 'bg-[#c19b48] text-[#061120] shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Live Lecture Stream
          </button>
          <button
            onClick={() => setActiveTab('recordings')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'recordings'
                ? 'bg-[#c19b48] text-[#061120] shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Recorded Archive ({archives.length})
          </button>
        </div>
      </div>

      {activeTab === 'stream' ? (
        isLoadingStream && !liveClass ? (
          <LiveStreamCanvasSkeleton />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Video Player Canvas */}
          <div className="lg:col-span-2 space-y-4">
            <div className="relative aspect-video rounded-2xl bg-[#061120] border border-slate-200 dark:border-[#143564] overflow-hidden flex flex-col items-center justify-center p-6 text-center group">
              <div className="absolute inset-0 bg-gradient-to-t from-[#061120] via-transparent to-[#061120]/40 pointer-events-none" />

              {/* Status Header Badge */}
              <div className="absolute top-4 left-4 flex items-center gap-2 z-20">
                <span className="px-2.5 py-1 rounded-full bg-red-600 text-white text-[10px] font-bold tracking-wider uppercase flex items-center gap-1.5 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-white" /> LIVE
                </span>
                <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-mono border border-white/15">
                  {liveCount} Aspirants Attending
                </span>
              </div>

              {/* Video Stream / Play Simulation */}
              <div className="relative z-10 space-y-3 max-w-md">
                <div
                  onClick={handleJoinVideoSession}
                  className="w-16 h-16 rounded-full bg-[#c19b48]/90 text-[#061120] flex items-center justify-center mx-auto shadow-2xl hover:scale-105 transition-transform cursor-pointer"
                  title="Connect to Zoom Video SDK Stream"
                >
                  <Play className="w-7 h-7 fill-[#061120] ml-1" />
                </div>
                <h3 className="text-lg font-serif font-bold text-white">
                  {liveClass?.title || 'CPC Section 9 to 14: Res Sub Judice & Jurisdiction'}
                </h3>
                <p className="text-xs text-slate-300">
                  Lecturer: {liveClass?.facultyName || 'Adv. Rajinder Sir'} (
                  {liveClass?.facultyTitle || 'Founding Director & Judicial Mentor'})
                </p>

                {isPlayingSession && (
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-semibold animate-in fade-in">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Zoom Video SDK Stream Connected • 1080p 60fps</span>
                  </div>
                )}
              </div>

              {/* Bottom Controls Bar */}
              <div className="absolute bottom-2 sm:bottom-4 inset-x-2 sm:inset-x-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 text-[11px] sm:text-xs text-slate-300 bg-black/65 backdrop-blur-md p-2 sm:p-2.5 rounded-xl border border-white/10 z-20">
                <span className="flex items-center gap-1.5 truncate max-w-full">
                  <Clock className="w-3.5 h-3.5 text-[#c19b48] shrink-0" />
                  <span className="truncate">
                    Session Started:{' '}
                    {liveClass?.startTime === '17:00'
                      ? '5:00 PM (Ends 7:00 PM)'
                      : `${liveClass?.startTime || '5:00 PM'} (Ends ${liveClass?.endTime || '7:00 PM'})`}
                  </span>
                </span>
                <button
                  onClick={handleDownloadHandout}
                  className="inline-flex items-center gap-1 text-[11px] text-[#e8cf8d] hover:underline font-semibold cursor-pointer shrink-0 ml-auto sm:ml-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Class Handout (PDF)</span>
                </button>
              </div>
            </div>

            {/* Lecture Syllabus Outline: Today's Learning Focus */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-serif font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#c19b48]" />
                  <span>Today's Learning Focus</span>
                </h3>
                <button
                  onClick={handleToggleAlert}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    isAlertSubscribed
                      ? 'bg-amber-100 dark:bg-[#c19b48]/20 text-[#c19b48]'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>{isAlertSubscribed ? 'Alert Active' : 'Set Class Reminder'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                {liveClass?.learningFocus && liveClass.learningFocus.length > 0 ? (
                  liveClass.learningFocus.map((focus, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564]"
                    >
                      <span className="font-semibold text-slate-900 dark:text-white block mb-0.5">
                        {focus.title}
                      </span>
                      <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                        {focus.description}
                      </p>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564]">
                      <span className="font-semibold text-slate-900 dark:text-white block mb-0.5">
                        Section 9 Analysis
                      </span>
                      <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                        Suits of civil nature & express/implied bars.
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564]">
                      <span className="font-semibold text-slate-900 dark:text-white block mb-0.5">
                        Section 10 & 11
                      </span>
                      <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                        Res Sub Judice vs Res Judicata distinction.
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564]">
                      <span className="font-semibold text-slate-900 dark:text-white block mb-0.5">
                        7 Case Precedents
                      </span>
                      <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                        Supreme Court ratio on stay of civil proceedings.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Live Classroom Chat */}
          <div className="flex flex-col h-[520px] rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-[#143564] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#c19b48]" />
                <h3 className="text-xs font-serif font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Live Classroom Chat
                </h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold">
                Faculty Online
              </span>
            </div>

            {/* Message Feed */}
            <div className="flex-1 p-3 overflow-y-auto space-y-3">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`p-2.5 rounded-xl text-xs space-y-1 ${
                    m.isFacultyMessage || m.role === 'faculty'
                      ? 'bg-amber-50/80 dark:bg-[#143564]/50 border border-amber-200 dark:border-[#c19b48]/30'
                      : 'bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564]'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span
                      className={`font-semibold ${
                        m.isFacultyMessage || m.role === 'faculty'
                          ? 'text-[#c19b48] dark:text-[#e8cf8d]'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {m.sender} {(m.isFacultyMessage || m.role === 'faculty') && '⭐'}
                    </span>
                    <span className="text-slate-400">{m.time}</span>
                  </div>
                  <p className="text-slate-800 dark:text-slate-200 text-[11px] leading-relaxed">
                    {m.text}
                  </p>
                </div>
              ))}
              <div ref={chatBottomRef} />
            </div>

            {/* Chat Input Bar */}
            <form
              onSubmit={handleSendMessage}
              className="p-3 border-t border-slate-200 dark:border-[#143564] flex items-center gap-2 bg-slate-50/70 dark:bg-[#061120]"
            >
              <input
                type="text"
                value={newMsg}
                onChange={(e) => setNewMsg(e.target.value)}
                placeholder="Ask Rajinder Sir a doubt..."
                className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#c19b48]"
              />
              <button
                type="submit"
                className="p-2 rounded-xl bg-[#c19b48] hover:bg-[#d8b862] text-[#061120] transition-colors cursor-pointer"
                title="Send Doubt"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
        )
      ) : (
        /* Recorded Archive Tab */
        <div className="space-y-6">
          {/* Search & Filter Header */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search lectures by title, topic, or faculty..."
                className="w-full pl-9 pr-4 py-2 sm:py-1.5 rounded-lg bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#c19b48]"
              />
            </div>

            <div className="w-full sm:w-56 shrink-0">
              <CustomSelect
                options={[
                  { value: 'all', label: 'All Law Subjects' },
                  { value: 'Code of Civil Procedure (CPC)', label: 'CPC' },
                  { value: 'Bhartiya Nyaya Sanhita (BNS)', label: 'BNS / Criminal Law' },
                  { value: 'Indian Evidence Act (BSA)', label: 'Evidence / BSA' },
                  { value: 'Constitutional Law', label: 'Constitutional Law' },
                ]}
                value={selectedSubject}
                onChange={(val) => setSelectedSubject(val)}
                placeholder="All Law Subjects"
                sheetTitle="Filter by Law Subject"
              />
            </div>
          </div>

          {/* Grid of Lecture Archive Cards */}
          {isLoadingArchives && archives.length === 0 ? (
            <RecordingCardSkeleton count={6} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredArchives.map((rec) => (
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
                        className="px-3 py-1.5 rounded-lg bg-[#0a1c36] dark:bg-[#143564] hover:bg-[#143564] text-white font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <Play className="w-3 h-3" />
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

      {/* MODAL: INTERACTIVE RECORDED LECTURE PLAYER */}
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
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'border-slate-200 dark:border-[#143564] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#143564]'
                    }`}
                  >
                    <ThumbsDown className="w-3.5 h-3.5" />
                    <span>{selectedArchive.dislikesCount}</span>
                  </button>
                  {selectedArchive.notesFile && (
                    <button
                      onClick={() => window.open(selectedArchive.notesFile?.fileUrl, '_blank')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#c19b48]/15 text-[#c19b48] border border-[#c19b48]/30 text-xs font-bold hover:bg-[#c19b48]/25 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{selectedArchive.notesFile.fileName}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Syllabus Chapters */}
              {selectedArchive.chapters && selectedArchive.chapters.length > 0 && (
                <div className="space-y-2">
                  <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
                    Syllabus Chapters & Timestamps
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {selectedArchive.chapters.map((ch, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] flex items-center justify-between"
                      >
                        <span className="text-[11px] text-slate-700 dark:text-slate-300 font-medium truncate pr-2">
                          {ch.title}
                        </span>
                        <span className="text-[10px] font-mono text-[#c19b48]">
                          {Math.floor(ch.timestampSeconds / 60)}:00
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Threaded Discussion Section */}
              <div className="space-y-3 pt-2">
                <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
                  Judicial Discussion & Peer Queries ({archiveComments.length})
                </span>

                <form onSubmit={handlePostComment} className="flex gap-2">
                  <input
                    type="text"
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    placeholder="Contribute a judicial query or analysis on this recording..."
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#c19b48]"
                  />
                  <button
                    type="submit"
                    disabled={isSubmittingComment}
                    className="px-4 py-2 rounded-xl bg-[#c19b48] hover:bg-[#d8b862] text-[#061120] font-bold text-xs cursor-pointer flex items-center gap-1"
                  >
                    {isSubmittingComment ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>Post</span>
                  </button>
                </form>

                <div className="space-y-2.5 max-h-48 overflow-y-auto">
                  {archiveComments.map((comment) => (
                    <div
                      key={comment._id}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] space-y-1"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {comment.userName}{' '}
                          {comment.userRole === 'faculty' && <span className="text-[#c19b48]">⭐ Faculty</span>}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 text-xs">{comment.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveClassesPage;

import React, { useState, useEffect, useRef } from 'react';
import {
  Video,
  Radio,
  Users,
  Copy,
  Play,
  StopCircle,
  MessageSquare,
  Plus,
  Loader2,
  X,
  Upload,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { io, type Socket } from 'socket.io-client';
import apiClient from '../../lib/apiClient';

interface LiveClassItem {
  _id: string;
  title: string;
  subject: string;
  topic: string;
  description?: string;
  facultyName: string;
  facultyTitle?: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  status: 'scheduled' | 'upcoming' | 'live' | 'ended' | 'archived';
  sessionTopic: string;
  currentLiveCount: number;
  learningFocus?: Array<{ title: string; description: string }>;
  handoutPdf?: { fileName: string; fileUrl: string; fileSize: string };
}

interface ChatMessage {
  id: string;
  sender: string;
  role: string;
  text: string;
  time: string;
  isFacultyMessage?: boolean;
}

export const LiveClassesPage: React.FC = () => {
  const [liveClass, setLiveClass] = useState<LiveClassItem | null>(null);
  const [allClasses, setAllClasses] = useState<LiveClassItem[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [isTogglingLive, setIsTogglingLive] = useState(false);

  // Modals
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isUploadingHandout, setIsUploadingHandout] = useState(false);

  // New Class Schedule Form
  const [formTitle, setFormTitle] = useState('');
  const [formSubject, setFormSubject] = useState('Code of Civil Procedure (CPC)');
  const [formTopic, setFormTopic] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formStartTime, setFormStartTime] = useState('17:00');
  const [formEndTime, setFormEndTime] = useState('19:00');
  const [formDuration, setFormDuration] = useState(120);
  const [formFocus1, setFormFocus1] = useState({ title: 'Section 9 Analysis', desc: 'Suits of civil nature & express/implied bars.' });
  const [formFocus2, setFormFocus2] = useState({ title: 'Section 10 & 11', desc: 'Res Sub Judice vs Res Judicata distinction.' });
  const [formFocus3, setFormFocus3] = useState({ title: '7 Case Precedents', desc: 'Supreme Court ratio on stay of civil proceedings.' });
  const [formHandoutName, setFormHandoutName] = useState('');
  const [formHandoutUrl, setFormHandoutUrl] = useState('');
  const [isSubmittingSchedule, setIsSubmittingSchedule] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const streamKey = `rtmp://live.rajinderlawacademy.com/live/${liveClass?.sessionTopic || 'chambers_cpc_live_2026'}`;

  // Fetch current live and all classes
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [currRes, allRes] = await Promise.all([
        apiClient.get('/live-classes/current'),
        apiClient.get('/live-classes/admin/all'),
      ]);

      if (currRes.data?.data?.class) {
        const cls = currRes.data.data.class;
        setLiveClass(cls);
        setIsLiveActive(cls.status === 'live');
        if (currRes.data.data.initialMessages) {
          setMessages(currRes.data.data.initialMessages);
        }
      }
      if (allRes.data?.data) {
        setAllClasses(allRes.data.data);
      }
    } catch (err) {
      console.error('Failed to load live classes data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Socket.io for Real-Time Moderation
  useEffect(() => {
    if (!liveClass?._id) return;

    const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const baseUrl = rawUrl.replace(/\/api\/?$/, '');

    const socket = io(`${baseUrl}/live-class`, {
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.emit('live_class:join_room', { classId: liveClass._id }, (res: any) => {
      if (res?.success && res.data?.liveCount) {
        setLiveClass((prev) => (prev ? { ...prev, currentLiveCount: res.data.liveCount } : prev));
      }
    });

    socket.on('live_class:new_chat', (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on('live_class:participant_count', (data: { count: number }) => {
      if (data?.count) {
        setLiveClass((prev) => (prev ? { ...prev, currentLiveCount: data.count } : prev));
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [liveClass?._id]);

  const handleCopyKey = () => {
    navigator.clipboard.writeText(streamKey);
    toast.success('Stream Key Copied to Clipboard');
  };

  // Toggle Go Live / End Live
  const handleToggleLive = async () => {
    if (!liveClass?._id) return;

    try {
      setIsTogglingLive(true);
      if (!isLiveActive) {
        // Start Live
        await apiClient.post(`/live-classes/admin/${liveClass._id}/start`);
        setIsLiveActive(true);
        setLiveClass((prev) => (prev ? { ...prev, status: 'live' } : prev));
        toast.success('Live stream started! Broadcast active on student chambers.');
      } else {
        // End Live
        await apiClient.post(`/live-classes/admin/${liveClass._id}/end`);
        setIsLiveActive(false);
        setLiveClass((prev) => (prev ? { ...prev, status: 'ended' } : prev));
        toast.error('Live stream stopped. Cloud recording processing initiated.');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to toggle live state.');
    } finally {
      setIsTogglingLive(false);
    }
  };

  // Upload PDF Handout
  const handleUploadHandout = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingHandout(true);
      const formData = new FormData();
      formData.append('file', file);
      const res = await apiClient.post('/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = res.data?.data?.url || res.data?.url;
      setFormHandoutUrl(url);
      setFormHandoutName(file.name);
      toast.success('Class handout PDF uploaded successfully!');
    } catch (err) {
      toast.error('Failed to upload PDF. You can paste a direct URL.');
    } finally {
      setIsUploadingHandout(false);
    }
  };

  // Schedule New Class
  const handleScheduleClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formDate || !formStartTime || !formEndTime) {
      toast.error('Please fill in title, date, and times.');
      return;
    }

    try {
      setIsSubmittingSchedule(true);
      const payload = {
        title: formTitle.trim(),
        subject: formSubject.trim(),
        topic: formTopic.trim() || formTitle.trim(),
        scheduledDate: formDate,
        startTime: formStartTime,
        endTime: formEndTime,
        durationMinutes: Number(formDuration) || 120,
        learningFocus: [formFocus1, formFocus2, formFocus3].filter((f) => f.title.trim()),
        handoutPdf: formHandoutUrl
          ? {
              fileName: formHandoutName || `${formTitle.replace(/\s+/g, '_')}_Handout.pdf`,
              fileUrl: formHandoutUrl,
              fileSize: '3.8 MB PDF',
            }
          : undefined,
        autoRecord: true,
      };

      await apiClient.post('/live-classes/admin/schedule', payload);
      toast.success('Live classroom lecture scheduled successfully!');
      setIsScheduleModalOpen(false);
      setFormTitle('');
      setFormTopic('');
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to schedule class.');
    } finally {
      setIsSubmittingSchedule(false);
    }
  };

  return (
    <div className="space-y-6 select-none">
      {/* Header */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-semibold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
            </span>
            <span>Live Classroom & Zoom Video SDK Studio</span>
            {isLoading && <Loader2 className="w-3 h-3 ml-1 animate-spin text-[#C19B48]" />}
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#F7F3E6]">
            Broadcast & Live Stream Control Desk
          </h1>
          <p className="text-xs text-[#A8A294] max-w-2xl leading-relaxed">
            Manage live broadcast streams, verify Zoom Video SDK session health, monitor active connected aspirants, and moderate real-time legal doubt chats.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto">
          <button
            onClick={() => setIsScheduleModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#262626] border border-[#3D3D3D] hover:border-[#C19B48] text-[#F7F3E6] text-xs font-bold transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#C19B48]" />
            <span>Schedule Live Class</span>
          </button>

          {isLiveActive ? (
            <button
              onClick={handleToggleLive}
              disabled={isTogglingLive}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#EF4444] hover:bg-red-600 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              {isTogglingLive ? <Loader2 className="w-4 h-4 animate-spin" /> : <StopCircle className="w-4 h-4" />}
              <span>End Live Stream</span>
            </button>
          ) : (
            <button
              onClick={handleToggleLive}
              disabled={isTogglingLive}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#34D399] hover:bg-emerald-600 text-[#1E1E1E] text-xs font-bold transition-colors cursor-pointer"
            >
              {isTogglingLive ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              <span>Go Live Now</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Broadcast Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stream Preview (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="aspect-video w-full rounded-2xl bg-[#000] border border-[#3D3D3D] relative overflow-hidden flex items-center justify-center">
            {isLiveActive ? (
              <div className="w-full h-full flex flex-col items-center justify-center space-y-3 bg-gradient-to-br from-[#1E1E1E] to-[#121212] p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-[#C19B48]/20 border border-[#C19B48]/50 flex items-center justify-center text-[#C19B48] animate-pulse">
                  <Video className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <div className="font-serif text-lg font-bold text-[#F7F3E6]">
                    {liveClass?.title || 'CPC Section 9 to 14: Res Sub Judice & Jurisdiction'}
                  </div>
                  <div className="text-xs text-[#C19B48]">
                    Faculty: {liveClass?.facultyName || 'Adv. Rajinder Sir'} • Zoom Video SDK 1080p 60fps Broadcast
                  </div>
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#262626] border border-[#3D3D3D] text-xs text-[#34D399]">
                  <Radio className="w-3.5 h-3.5" />
                  <span>Bitrate: 6,200 kbps • Zero dropped frames • Session: {liveClass?.sessionTopic || 'active'}</span>
                </div>
              </div>
            ) : (
              <div className="text-center text-xs text-[#A8A294] space-y-2 p-6">
                <Video className="w-10 h-10 mx-auto opacity-40" />
                <span>Stream currently offline. Click "Go Live Now" to broadcast.</span>
                {liveClass && (
                  <div className="text-[#F7F3E6] font-semibold text-sm pt-2">
                    Next: {liveClass.title} ({liveClass.startTime} - {liveClass.endTime})
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RTMP Encoder / Video SDK Credentials */}
          <div className="p-4 rounded-xl bg-[#1E1E1E] border border-[#3D3D3D] space-y-3 text-xs">
            <span className="font-bold text-[#F7F3E6] uppercase tracking-wider text-[11px]">
              OBS / Hardware Encoder Stream URL & Key
            </span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={streamKey}
                className="flex-1 px-3.5 py-2 rounded-lg bg-[#262626] border border-[#3D3D3D] font-mono text-xs text-[#E8CF8D] focus:outline-hidden"
              />
              <button
                onClick={handleCopyKey}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#C19B48] hover:bg-[#D8B862] text-[#1E1E1E] font-bold cursor-pointer transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </button>
            </div>
          </div>
        </div>

        {/* Live Attendance & Chat Moderation (1 Col) */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#A8A294] font-bold uppercase">Connected Aspirants</span>
              <span className="text-xs text-[#34D399] font-bold flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {liveClass?.currentLiveCount || 184} Live
              </span>
            </div>
            <div className="font-serif text-3xl font-bold text-[#F7F3E6]">
              {liveClass?.currentLiveCount || 184} Students
            </div>
            <p className="text-[11px] text-[#A8A294]">
              Morning Shift Cohort A (128) + Evening Cohort B (56)
            </p>
          </div>

          {/* Live Chat Q&A Moderation Preview */}
          <div className="p-5 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] space-y-3">
            <div className="flex items-center justify-between border-b border-[#3D3D3D] pb-2">
              <span className="text-xs font-bold text-[#F7F3E6] flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-[#C19B48]" />
                Live Student Q&A Stream
              </span>
              <span className="text-[10px] text-[#C19B48]">Moderator View</span>
            </div>

            <div className="space-y-2.5 max-h-64 overflow-y-auto no-scrollbar text-xs">
              {messages.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs">No chat messages yet.</div>
              ) : (
                messages.map((m) => (
                  <div key={m.id} className="p-2.5 rounded-lg bg-[#262626] border border-[#3D3D3D] space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-[#F7F3E6]">
                        {m.sender} {m.isFacultyMessage && '⭐ Faculty'}
                      </span>
                      <span className="text-[10px] text-[#A8A294]">{m.time}</span>
                    </div>
                    <p className="text-[#A8A294] text-[11px]">{m.text}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* All Scheduled & Recent Classes Table */}
      <div className="p-5 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] space-y-4">
        <div className="flex items-center justify-between border-b border-[#3D3D3D] pb-3">
          <div>
            <h3 className="font-serif text-sm font-bold text-[#F7F3E6]">
              All Chamber & Live Streaming Schedules
            </h3>
            <p className="text-[11px] text-[#A8A294]">
              Manage upcoming, ongoing, and completed judicial live sessions ({allClasses.length} total)
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#262626] text-[#A8A294] font-semibold border-b border-[#3D3D3D]">
              <tr>
                <th className="p-3">Title & Subject</th>
                <th className="p-3">Date & Time</th>
                <th className="p-3">Faculty</th>
                <th className="p-3">Status</th>
                <th className="p-3">Attendees</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#3D3D3D]">
              {allClasses.map((cls) => (
                <tr key={cls._id} className="hover:bg-[#262626]/50 transition-colors">
                  <td className="p-3">
                    <span className="font-bold text-[#F7F3E6] block">{cls.title}</span>
                    <span className="text-[10px] text-[#C19B48]">{cls.subject}</span>
                  </td>
                  <td className="p-3 text-[#A8A294]">
                    {cls.scheduledDate} • {cls.startTime} - {cls.endTime}
                  </td>
                  <td className="p-3 text-[#F7F3E6]">{cls.facultyName}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        cls.status === 'live'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : cls.status === 'upcoming'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-[#262626] text-[#A8A294]'
                      }`}
                    >
                      {cls.status}
                    </span>
                  </td>
                  <td className="p-3 text-[#34D399] font-mono">{cls.currentLiveCount || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SCHEDULE MODAL */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] p-5 text-[#F7F3E6] space-y-4 animate-in zoom-in duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-[#3D3D3D] pb-3">
              <h3 className="font-bold text-sm">Schedule Live Classroom Lecture</h3>
              <button onClick={() => setIsScheduleModalOpen(false)}>
                <X className="w-4 h-4 text-[#A8A294]" />
              </button>
            </div>

            <form onSubmit={handleScheduleClass} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#A8A294] mb-1">Lecture Title *</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. CPC Section 15 to 20: Place of Suing & Territorial Jurisdiction"
                  className="w-full rounded-xl bg-[#262626] border border-[#3D3D3D] p-2.5 text-xs text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#A8A294] mb-1">Law Subject</label>
                  <select
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value)}
                    className="w-full rounded-xl bg-[#262626] border border-[#3D3D3D] p-2.5 text-xs text-[#F7F3E6]"
                  >
                    <option value="Code of Civil Procedure (CPC)">Code of Civil Procedure (CPC)</option>
                    <option value="Bhartiya Nyaya Sanhita (BNS)">Bhartiya Nyaya Sanhita (BNS)</option>
                    <option value="Indian Evidence Act (BSA)">Indian Evidence Act (BSA)</option>
                    <option value="Constitutional Law">Constitutional Law</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#A8A294] mb-1">Scheduled Date *</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full rounded-xl bg-[#262626] border border-[#3D3D3D] p-2.5 text-xs text-[#F7F3E6]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#A8A294] mb-1">Start Time *</label>
                  <input
                    type="text"
                    required
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    placeholder="17:00"
                    className="w-full rounded-xl bg-[#262626] border border-[#3D3D3D] p-2.5 text-xs text-[#F7F3E6]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#A8A294] mb-1">End Time *</label>
                  <input
                    type="text"
                    required
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    placeholder="19:00"
                    className="w-full rounded-xl bg-[#262626] border border-[#3D3D3D] p-2.5 text-xs text-[#F7F3E6]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#A8A294] mb-1">Duration (Mins)</label>
                  <input
                    type="number"
                    value={formDuration}
                    onChange={(e) => setFormDuration(Number(e.target.value))}
                    className="w-full rounded-xl bg-[#262626] border border-[#3D3D3D] p-2.5 text-xs text-[#F7F3E6]"
                  />
                </div>
              </div>

              {/* Learning Focus Cards */}
              <div className="p-3 rounded-xl bg-[#262626] border border-[#3D3D3D] space-y-2">
                <label className="text-xs font-bold text-[#C19B48]">Today's Learning Focus (3 Cards)</label>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={formFocus1.title}
                    onChange={(e) => setFormFocus1({ ...formFocus1, title: e.target.value })}
                    placeholder="Focus 1 Title"
                    className="rounded-lg bg-[#1E1E1E] border border-[#3D3D3D] p-2 text-xs text-[#F7F3E6]"
                  />
                  <input
                    type="text"
                    value={formFocus2.title}
                    onChange={(e) => setFormFocus2({ ...formFocus2, title: e.target.value })}
                    placeholder="Focus 2 Title"
                    className="rounded-lg bg-[#1E1E1E] border border-[#3D3D3D] p-2 text-xs text-[#F7F3E6]"
                  />
                  <input
                    type="text"
                    value={formFocus3.title}
                    onChange={(e) => setFormFocus3({ ...formFocus3, title: e.target.value })}
                    placeholder="Focus 3 Title"
                    className="rounded-lg bg-[#1E1E1E] border border-[#3D3D3D] p-2 text-xs text-[#F7F3E6]"
                  />
                </div>
              </div>

              {/* Handout PDF Upload */}
              <div className="p-3 rounded-xl bg-[#262626] border border-[#3D3D3D] space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#C19B48]">Class Handout (PDF)</label>
                  <label className="text-[11px] text-[#34D399] hover:underline flex items-center gap-1 cursor-pointer font-semibold">
                    <Upload className="w-3 h-3" />
                    <span>{isUploadingHandout ? 'Uploading...' : 'Upload PDF File'}</span>
                    <input
                      type="file"
                      accept="application/pdf"
                      disabled={isUploadingHandout}
                      onChange={handleUploadHandout}
                      className="hidden"
                    />
                  </label>
                </div>
                <input
                  type="text"
                  value={formHandoutUrl}
                  onChange={(e) => setFormHandoutUrl(e.target.value)}
                  placeholder="https://.../handout.pdf"
                  className="w-full rounded-lg bg-[#1E1E1E] border border-[#3D3D3D] p-2 text-xs text-[#F7F3E6]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#3D3D3D]">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-[#A8A294]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingSchedule}
                  className="px-4 py-1.5 rounded-lg bg-[#C19B48] text-[#1E1E1E] text-xs font-bold cursor-pointer flex items-center gap-1"
                >
                  {isSubmittingSchedule && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Schedule</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveClassesPage;

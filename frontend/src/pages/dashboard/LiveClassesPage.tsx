import React, { useState } from 'react';
import {
  Play,
  Clock,
  User,
  MessageSquare,
  Send,
  Download,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

interface ChatMessage {
  id: string;
  sender: string;
  role: 'student' | 'faculty';
  text: string;
  time: string;
}

const initialMessages: ChatMessage[] = [
  {
    id: '1',
    sender: 'Faculty Desk',
    role: 'faculty',
    text: 'Welcome aspirants! Please keep your CPC Bare Acts open to Section 9 (Courts to try all civil suits unless barred).',
    time: '4:55 PM',
  },
  {
    id: '2',
    sender: 'Adv. Rohit Verma',
    role: 'student',
    text: 'Sir, will we also cover the Dhulabhai 7-point test on implied bar of jurisdiction today?',
    time: '4:58 PM',
  },
  {
    id: '3',
    sender: 'Adv. Rajinder Sir',
    role: 'faculty',
    text: 'Yes Rohit! Dhulabhai v. State of MP is essential for both Prelims and Mains. We will analyze all 7 principles in detail.',
    time: '5:01 PM',
  },
];

const recordedLectures = [
  {
    id: 'rec-1',
    subject: 'Code of Civil Procedure (CPC)',
    title: 'Pleadings & Plaint (Order 6 & 7) - Rejection of Plaint Grounds',
    date: 'Yesterday',
    duration: '1h 45m',
    faculty: 'Adv. Rajinder Sir',
    notesSize: '3.8 MB PDF',
  },
  {
    id: 'rec-2',
    subject: 'Bhartiya Nyaya Sanhita (BNS)',
    title: 'General Exceptions: Private Defence (Sec 34 to 44)',
    date: '10 Sep 2025',
    duration: '2h 10m',
    faculty: 'Adv. Rajinder Sir',
    notesSize: '4.5 MB PDF',
  },
  {
    id: 'rec-3',
    subject: 'Indian Evidence Act (BSA)',
    title: 'Relevancy of Facts forming part of same transaction (Res Gestae)',
    date: '08 Sep 2025',
    duration: '1h 35m',
    faculty: 'Adv. Neha Sharma',
    notesSize: '2.9 MB PDF',
  },
];

export const LiveClassesPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [newMsg, setNewMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'stream' | 'recordings'>('stream');

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsg.trim()) return;
    const msg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'Adv. Rohit Verma',
      role: 'student',
      text: newMsg.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, msg]);
    setNewMsg('');
    toast.success('Doubt submitted to lecture queue');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-50 dark:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold mb-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span>Interactive Classroom Chamber</span>
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
            Recorded Archive ({recordedLectures.length})
          </button>
        </div>
      </div>

      {activeTab === 'stream' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Video Player Canvas */}
          <div className="lg:col-span-2 space-y-4">
            <div className="relative aspect-video rounded-2xl bg-[#061120] border border-slate-200 dark:border-[#143564] overflow-hidden flex flex-col items-center justify-center p-6 text-center group">
              <div className="absolute inset-0 bg-gradient-to-t from-[#061120] via-transparent to-[#061120]/40 pointer-events-none" />

              {/* Status Header Badge */}
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-red-600 text-white text-[10px] font-bold tracking-wider uppercase flex items-center gap-1.5 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-white" /> LIVE
                </span>
                <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-mono border border-white/15">
                  184 Aspirants Attending
                </span>
              </div>

              {/* Center Play Simulation */}
              <div className="relative z-10 space-y-3 max-w-md">
                <div className="w-16 h-16 rounded-full bg-[#c19b48]/90 text-[#061120] flex items-center justify-center mx-auto shadow-2xl hover:scale-105 transition-transform cursor-pointer">
                  <Play className="w-7 h-7 fill-[#061120] ml-1" />
                </div>
                <h3 className="text-lg font-serif font-bold text-white">
                  CPC Section 9 to 14: Res Sub Judice & Jurisdiction
                </h3>
                <p className="text-xs text-slate-300">
                  Lecturer: Adv. Rajinder Sir (Founding Director & Judicial Mentor)
                </p>
              </div>

              {/* Bottom Controls Bar */}
              <div className="absolute bottom-4 inset-x-4 flex items-center justify-between text-xs text-slate-300 bg-black/50 backdrop-blur-md p-2.5 rounded-xl border border-white/10">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#c19b48]" />
                  <span>Session Started: 5:00 PM (Ends 7:00 PM)</span>
                </span>
                <button
                  onClick={() => toast.success('Lecture handouts downloaded')}
                  className="inline-flex items-center gap-1 text-[11px] text-[#e8cf8d] hover:underline font-semibold cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Class Handout (PDF)</span>
                </button>
              </div>
            </div>

            {/* Lecture Syllabus Outline */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] space-y-3">
              <h3 className="text-sm font-serif font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#c19b48]" />
                <span>Today's Learning Focus</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564]">
                  <span className="font-semibold text-slate-900 dark:text-white block mb-0.5">Section 9 Analysis</span>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">Suits of civil nature & express/implied bars.</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564]">
                  <span className="font-semibold text-slate-900 dark:text-white block mb-0.5">Section 10 & 11</span>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">Res Sub Judice vs Res Judicata distinction.</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564]">
                  <span className="font-semibold text-slate-900 dark:text-white block mb-0.5">7 Case Precedents</span>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">Supreme Court ratio on stay of civil proceedings.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Live Doubts Q&A Stream */}
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
                    m.role === 'faculty'
                      ? 'bg-amber-50/80 dark:bg-[#143564]/50 border border-amber-200 dark:border-[#c19b48]/30'
                      : 'bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564]'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span
                      className={`font-semibold ${
                        m.role === 'faculty'
                          ? 'text-[#c19b48] dark:text-[#e8cf8d]'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {m.sender} {m.role === 'faculty' && '⭐'}
                    </span>
                    <span className="text-slate-400">{m.time}</span>
                  </div>
                  <p className="text-slate-800 dark:text-slate-200 text-[11px] leading-relaxed">
                    {m.text}
                  </p>
                </div>
              ))}
            </div>

            {/* Input Bar */}
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
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* Recorded Archive Tab */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {recordedLectures.map((rec) => (
            <div
              key={rec.id}
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
                    <Clock className="w-3 h-3 text-[#c19b48]" /> {rec.duration}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3 text-[#c19b48]" /> {rec.faculty}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-[#143564] flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400">{rec.notesSize}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toast.success(`Downloading notes for ${rec.title}`)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-[#c19b48] hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                    title="Download Notes"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => toast.info(`Playing recorded lecture: ${rec.title}`)}
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
  );
};

import React, { useState } from 'react';
import {
  Video,
  Radio,
  Users,
  Copy,
  Play,
  StopCircle,
  MessageSquare,
} from 'lucide-react';
import { toast } from 'sonner';

export const LiveClassesPage: React.FC = () => {
  const [isLiveActive, setIsLiveActive] = useState(true);
  const streamKey = 'rtmp://live.rajinderlawacademy.com/live/chambers_cpc_live_2026';

  const handleCopyKey = () => {
    navigator.clipboard.writeText(streamKey);
    toast.success('Stream Key Copied to Clipboard', {
      description: 'Paste into OBS Studio or vMix encoder to start broadcast.',
    });
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
            <span>Live Classroom & Stream Studio</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#F7F3E6]">
            Broadcast & Live Stream Control Desk
          </h1>
          <p className="text-xs text-[#A8A294] max-w-2xl leading-relaxed">
            Manage live broadcast streams, verify low-latency WebRTC streams, monitor active connected aspirants, and moderate real-time legal doubt chats.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto">
          {isLiveActive ? (
            <button
              onClick={() => {
                setIsLiveActive(false);
                toast.error('Live stream stopped');
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#EF4444] hover:bg-red-600 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              <StopCircle className="w-4 h-4" />
              <span>End Live Stream</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setIsLiveActive(true);
                toast.success('Live stream started');
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#34D399] hover:bg-emerald-600 text-[#1E1E1E] text-xs font-bold transition-colors cursor-pointer"
            >
              <Play className="w-4 h-4" />
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
              <div className="w-full h-full flex flex-col items-center justify-center space-y-3 bg-gradient-to-br from-[#1E1E1E] to-[#121212]">
                <div className="w-16 h-16 rounded-full bg-[#C19B48]/20 border border-[#C19B48]/50 flex items-center justify-center text-[#C19B48] animate-pulse">
                  <Video className="w-8 h-8" />
                </div>
                <div className="text-center space-y-1">
                  <div className="font-serif text-lg font-bold text-[#F7F3E6]">
                    CPC Section 9 to 14: Res Sub Judice & Jurisdiction
                  </div>
                  <div className="text-xs text-[#C19B48]">
                    Faculty: Adv. Rajinder Sir • 1080p 60fps Studio Feed
                  </div>
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#262626] border border-[#3D3D3D] text-xs text-[#34D399]">
                  <Radio className="w-3.5 h-3.5" />
                  <span>Bitrate: 6,200 kbps • Zero dropped frames</span>
                </div>
              </div>
            ) : (
              <div className="text-center text-xs text-[#A8A294] space-y-2">
                <Video className="w-10 h-10 mx-auto opacity-40" />
                <span>Stream currently offline. Click "Go Live Now" to broadcast.</span>
              </div>
            )}
          </div>

          {/* RTMP Encoder Credentials */}
          <div className="p-4 rounded-xl bg-[#1E1E1E] border border-[#3D3D3D] space-y-3 text-xs">
            <span className="font-bold text-[#F7F3E6] uppercase tracking-wider text-[11px]">
              OBS / Hardware Encoder Stream Key
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
                164 Live
              </span>
            </div>
            <div className="font-serif text-3xl font-bold text-[#F7F3E6]">164 Students</div>
            <p className="text-[11px] text-[#A8A294]">
              Morning Shift Cohort A (128) + Evening Cohort B (36)
            </p>
          </div>

          {/* Live Chat Q&A Preview */}
          <div className="p-5 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] space-y-3">
            <div className="flex items-center justify-between border-b border-[#3D3D3D] pb-2">
              <span className="text-xs font-bold text-[#F7F3E6] flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-[#C19B48]" />
                Live Student Q&A Stream
              </span>
              <span className="text-[10px] text-[#C19B48]">Moderator View</span>
            </div>

            <div className="space-y-2.5 max-h-64 overflow-y-auto no-scrollbar text-xs">
              <div className="p-2.5 rounded-lg bg-[#262626] border border-[#3D3D3D] space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-[#F7F3E6]">Pooja Sharma (Roll #042)</span>
                  <span className="text-[10px] text-[#A8A294]">1 min ago</span>
                </div>
                <p className="text-[#A8A294]">
                  Sir, is constructive res judicata applicable to writ proceedings under Art 32?
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-[#262626] border border-[#3D3D3D] space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-[#F7F3E6]">Rohan Verma (Roll #089)</span>
                  <span className="text-[10px] text-[#A8A294]">3 mins ago</span>
                </div>
                <p className="text-[#A8A294]">
                  Please repeat explanation of Section 10 vs Section 11 difference once again.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

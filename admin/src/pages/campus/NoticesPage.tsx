import React, { useState } from 'react';
import {
  BellRing,
  Send,
} from 'lucide-react';
import { toast } from 'sonner';

interface NoticeItem {
  id: string;
  title: string;
  category: string;
  targetCohorts: string;
  publishDate: string;
  priority: 'urgent' | 'normal';
  content: string;
}

const NOTICES: NoticeItem[] = [
  {
    id: 'n-01',
    title: 'Evening Shift CPC Timing Adjusted for Live Interactive Bare Act Workshop',
    category: 'Classroom Timetable',
    targetCohorts: 'Evening Shift (Cohort B)',
    publishDate: 'Today, 09:00 AM',
    priority: 'urgent',
    content: 'Please note that today\'s CPC class will commence at 05:00 PM sharp in Chamber Hall A. Keep CPC bare acts open to Section 9.',
  },
  {
    id: 'n-02',
    title: 'Delhi Judicial Service (DJS) 2026 Notification Expected Next Week',
    category: 'Exam Alert',
    targetCohorts: 'All Enrolled Batches',
    publishDate: 'Yesterday, 02:30 PM',
    priority: 'normal',
    content: 'High Court of Delhi is expected to release official notification for 124 vacancies. Aspirants are advised to accelerate Daily Answer Writing submissions.',
  },
  {
    id: 'n-03',
    title: 'Daily Mains Challenge #48 Model Answers Released in Vault',
    category: 'Mains Test Series',
    targetCohorts: 'All Enrolled Batches',
    publishDate: '10 Sep 2026',
    priority: 'normal',
    content: 'Full annotated answers for Res Judicata and Inherent Powers have been uploaded by Adv. Rajinder Sir.',
  },
];

export const NoticesPage: React.FC = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<'urgent' | 'normal'>('normal');

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) {
      toast.error('Please enter notice title and content');
      return;
    }
    toast.success('Notice Broadcasted to Student Classroom Portals', {
      description: `Push alert sent to enrolled student mobile and web apps.`,
    });
    setTitle('');
    setContent('');
  };

  return (
    <div className="space-y-6 select-none">
      <div className="p-6 sm:p-8 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] space-y-1">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs font-semibold">
          <BellRing className="w-3.5 h-3.5" />
          <span>Campus Communication Broadcaster</span>
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#F7F3E6]">
          Notice Board Broadcasts & Push Alerts
        </h1>
        <p className="text-xs text-[#A8A294] max-w-2xl leading-relaxed">
          Broadcast official academy notices, exam schedule changes, holiday circulars, and emergency alerts directly to student portals.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Form */}
        <div className="lg:col-span-2 space-y-4">
          <form onSubmit={handleBroadcast} className="p-6 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] space-y-4">
            <h3 className="font-serif text-base font-bold text-[#F7F3E6] border-b border-[#3D3D3D] pb-2 flex items-center justify-between">
              <span>Broadcast New Circular</span>
              <span className="text-xs text-[#C19B48]">Instant Sync to Portal</span>
            </h3>

            <div className="space-y-1.5 text-xs">
              <label className="text-[#A8A294] font-medium">Notice Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Schedule Revision for Independence Day Weekend Mock"
                className="w-full px-3.5 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] placeholder-[#A8A294] focus:outline-hidden focus:border-[#C19B48]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-[#A8A294] font-medium">Target Cohorts</label>
                <select className="w-full px-3.5 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] focus:outline-hidden focus:border-[#C19B48] cursor-pointer">
                  <option>All Enrolled Batches (Morning + Evening + Weekend)</option>
                  <option>Morning Shift (Cohort A) Only</option>
                  <option>Evening Shift (Cohort B) Only</option>
                  <option>Weekend Fastrack (Cohort C) Only</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[#A8A294] font-medium">Priority Level</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as 'urgent' | 'normal')}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] focus:outline-hidden focus:border-[#C19B48] cursor-pointer"
                >
                  <option value="normal">Normal Circular</option>
                  <option value="urgent">Urgent Alert (Red Banner Notification)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="text-[#A8A294] font-medium">Notice Body Content</label>
              <textarea
                rows={4}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Type circular description and instructions for aspirants..."
                className="w-full px-3.5 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] placeholder-[#A8A294] focus:outline-hidden focus:border-[#C19B48]"
              />
            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#C19B48] hover:bg-[#D8B862] text-[#1E1E1E] text-xs font-bold transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Publish & Broadcast</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right 1 Col: Past Notices */}
        <div className="space-y-4">
          <div className="p-6 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] space-y-4">
            <h3 className="font-serif text-base font-bold text-[#F7F3E6] border-b border-[#3D3D3D] pb-2">
              Active Broadcasts
            </h3>
            <div className="space-y-3">
              {NOTICES.map((n) => (
                <div
                  key={n.id}
                  className="p-3.5 rounded-xl bg-[#262626] border border-[#3D3D3D] hover:border-[#C19B48]/40 transition-colors space-y-1.5"
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span
                      className={`font-bold px-2 py-0.5 rounded uppercase ${
                        n.priority === 'urgent'
                          ? 'bg-[#EF4444]/20 text-[#EF4444]'
                          : 'bg-[#60A5FA]/20 text-[#60A5FA]'
                      }`}
                    >
                      {n.priority}
                    </span>
                    <span className="text-[#A8A294]">{n.publishDate}</span>
                  </div>
                  <h4 className="text-xs font-bold text-[#F7F3E6] leading-snug">
                    {n.title}
                  </h4>
                  <p className="text-[11px] text-[#A8A294] line-clamp-2">{n.content}</p>
                  <div className="text-[10px] text-[#C19B48] pt-0.5">{n.targetCohorts}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

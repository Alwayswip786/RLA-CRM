import React, { useState, useEffect } from 'react';
import {
  BellRing,
  Send,
  Trash2,
  Download,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { apiClient } from '../../lib/apiClient';
import { generateNoticePdf } from '../../utils/noticePdfGenerator';

interface NoticeItem {
  _id: string;
  circularNo: string;
  title: string;
  content: string;
  category: string;
  targetCohorts: string;
  priority: 'urgent' | 'normal';
  publishedAt: string;
  authorName?: string;
  issuedBy?: string;
}

export const NoticesPage: React.FC = () => {
  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Examination');
  const [targetCohorts, setTargetCohorts] = useState('All Enrolled Batches (Morning + Evening + Weekend)');
  const [priority, setPriority] = useState<'urgent' | 'normal'>('normal');
  const [content, setContent] = useState('');

  // Live Data State
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fetch notices from backend
  const fetchNotices = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.get('/notices');
      if (res.data?.notices) {
        setNotices(res.data.notices);
      }
    } catch (err: any) {
      console.error('Failed to fetch circulars:', err);
      toast.error('Failed to load active circulars from server');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  // Publish New Circular
  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error('Please enter notice title and content');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiClient.post('/notices', {
        title: title.trim(),
        content: content.trim(),
        category,
        priority,
        targetCohorts,
      });

      const newNotice = res.data?.notice;
      if (newNotice) {
        setNotices((prev) => [newNotice, ...prev]);
      }

      toast.success(
        <div>
          <div className="font-semibold text-[#F7F3E6]">Notice Broadcasted Successfully!</div>
          <div className="text-xs text-[#A8A294] mt-0.5">
            Circular {newNotice?.circularNo || ''} is now live on student classroom portals.
          </div>
        </div>
      );

      // Reset form
      setTitle('');
      setContent('');
      setCategory('Examination');
      setPriority('normal');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to broadcast circular. Please try again.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Notice
  const handleDeleteNotice = async (id: string, circularNo: string) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to withdraw Circular ${circularNo}? It will be removed from all student portals.`
    );
    if (!confirmDelete) return;

    setDeletingId(id);
    try {
      await apiClient.delete(`/notices/${id}`);
      setNotices((prev) => prev.filter((n) => n._id !== id));
      toast.success(`Circular ${circularNo} withdrawn successfully.`);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to delete circular.';
      toast.error(msg);
    } finally {
      setDeletingId(null);
    }
  };

  // Download PDF
  const handleDownloadPdf = (notice: NoticeItem) => {
    try {
      generateNoticePdf(notice);
      toast.success(`Official Gazette PDF for ${notice.circularNo} downloaded`);
    } catch (err) {
      console.error('PDF generation error:', err);
      toast.error('Failed to generate PDF document');
    }
  };

  return (
    <div className="space-y-6 select-none animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
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

        <button
          type="button"
          onClick={fetchNotices}
          disabled={isLoading}
          className="self-start sm:self-auto px-4 py-2 rounded-xl bg-[#262626] hover:bg-[#333333] border border-[#3D3D3D] text-[#F7F3E6] text-xs font-medium transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-60"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#C19B48] ${isLoading ? 'animate-spin' : ''}`} />
          <span>Sync Circulars</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Form */}
        <div className="lg:col-span-2 space-y-4">
          <form onSubmit={handleBroadcast} className="p-6 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] space-y-4">
            <h3 className="font-serif text-base font-bold text-[#F7F3E6] border-b border-[#3D3D3D] pb-2 flex items-center justify-between">
              <span>Broadcast New Circular</span>
              <span className="text-xs text-[#C19B48] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Instant Cloud Sync
              </span>
            </h3>

            {/* Notice Title */}
            <div className="space-y-1.5 text-xs">
              <label className="text-[#A8A294] font-medium">Notice Title <span className="text-red-400">*</span></label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Schedule Revision for Independence Day Weekend Mock"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] placeholder-[#A8A294] focus:outline-none focus:border-[#C19B48]"
              />
            </div>

            {/* Category & Priority */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-[#A8A294] font-medium">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] focus:outline-none focus:border-[#C19B48] cursor-pointer"
                >
                  <option value="Examination">Examination & Notification</option>
                  <option value="Classroom Timetable">Classroom Timetable & Shift</option>
                  <option value="Mains Test Series">Mains Test Series & DAW</option>
                  <option value="Holiday">Holiday & Campus Recess</option>
                  <option value="Admissions">Admissions & Batches</option>
                  <option value="General">General Academy Circular</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[#A8A294] font-medium">Priority Level</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as 'urgent' | 'normal')}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] focus:outline-none focus:border-[#C19B48] cursor-pointer"
                >
                  <option value="normal">Normal Circular</option>
                  <option value="urgent">Urgent Alert (Red Banner Notification)</option>
                </select>
              </div>
            </div>

            {/* Target Cohort */}
            <div className="space-y-1.5 text-xs">
              <label className="text-[#A8A294] font-medium">Target Cohorts</label>
              <select
                value={targetCohorts}
                onChange={(e) => setTargetCohorts(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] focus:outline-none focus:border-[#C19B48] cursor-pointer"
              >
                <option value="All Enrolled Batches (Morning + Evening + Weekend)">All Enrolled Batches (Morning + Evening + Weekend)</option>
                <option value="Morning Shift (Cohort A) Only">Morning Shift (Cohort A) Only</option>
                <option value="Evening Shift (Cohort B) Only">Evening Shift (Cohort B) Only</option>
                <option value="Weekend Fastrack (Cohort C) Only">Weekend Fastrack (Cohort C) Only</option>
                <option value="Mains Answer Writing Intensive Batch">Mains Answer Writing Intensive Batch</option>
              </select>
            </div>

            {/* Notice Body Content */}
            <div className="space-y-1.5 text-xs">
              <label className="text-[#A8A294] font-medium">Notice Body Content <span className="text-red-400">*</span></label>
              <textarea
                rows={5}
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Type circular description and official instructions for aspirants..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] placeholder-[#A8A294] focus:outline-none focus:border-[#C19B48] leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#C19B48] hover:bg-[#D8B862] text-[#1E1E1E] text-xs font-bold transition-all disabled:opacity-60 cursor-pointer shadow-md hover:shadow-lg active:scale-[0.99]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Broadcasting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Publish & Broadcast Circular</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right 1 Col: Active Broadcasts */}
        <div className="space-y-4">
          <div className="p-6 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] space-y-4">
            <div className="border-b border-[#3D3D3D] pb-2 flex items-center justify-between">
              <h3 className="font-serif text-base font-bold text-[#F7F3E6]">
                Active Broadcasts
              </h3>
              <span className="px-2 py-0.5 rounded-md bg-[#C19B48]/15 border border-[#C19B48]/30 text-[#C19B48] text-[10px] font-mono font-bold">
                {notices.length} Live
              </span>
            </div>

            {isLoading ? (
              <div className="py-8 flex flex-col items-center justify-center gap-2 text-[#A8A294]">
                <Loader2 className="w-5 h-5 animate-spin text-[#C19B48]" />
                <span className="text-xs">Loading live circulars...</span>
              </div>
            ) : notices.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#A8A294]">
                No active circulars broadcasted yet.
              </div>
            ) : (
              <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
                {notices.map((n) => (
                  <div
                    key={n._id}
                    className="p-4 rounded-xl bg-[#262626] border border-[#3D3D3D] hover:border-[#C19B48]/50 transition-all space-y-2 relative group"
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <span
                        className={`font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                          n.priority === 'urgent'
                            ? 'bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/30'
                            : 'bg-[#60A5FA]/20 text-[#60A5FA] border border-[#60A5FA]/30'
                        }`}
                      >
                        {n.priority}
                      </span>
                      <span className="text-xs font-mono text-[#C19B48]">
                        {n.circularNo}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-[#F7F3E6] leading-snug">
                      {n.title}
                    </h4>

                    <p className="text-[11px] text-[#A8A294] line-clamp-2 leading-relaxed">
                      {n.content}
                    </p>

                    <div className="flex items-center justify-between pt-1 text-[10px] text-[#A8A294] border-t border-[#333333]">
                      <span className="text-[#C19B48] font-medium truncate max-w-[160px]">
                        {n.targetCohorts}
                      </span>
                      <span>
                        {new Date(n.publishedAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                        })}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2 flex items-center justify-between gap-2 border-t border-[#333333]/80">
                      <button
                        type="button"
                        onClick={() => handleDownloadPdf(n)}
                        className="inline-flex items-center gap-1 text-[10px] text-[#C19B48] hover:text-[#D8B862] font-semibold transition-colors cursor-pointer"
                        title="Download Gazette PDF"
                      >
                        <Download className="w-3 h-3" />
                        <span>Gazette PDF</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteNotice(n._id, n.circularNo)}
                        disabled={deletingId === n._id}
                        className="inline-flex items-center gap-1 text-[10px] text-red-400 hover:text-red-300 transition-colors cursor-pointer disabled:opacity-50"
                        title="Withdraw circular"
                      >
                        {deletingId === n._id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Trash2 className="w-3 h-3" />
                        )}
                        <span>Withdraw</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

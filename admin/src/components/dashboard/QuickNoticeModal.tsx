import React, { useState } from 'react';
import { X, Bell, Send, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminDashboardApi } from '../../lib/adminDashboardApi';

interface QuickNoticeModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const QuickNoticeModal: React.FC<QuickNoticeModalProps> = ({
  onClose,
  onSuccess,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('General');
  const [priority, setPriority] = useState('normal');
  const [targetCohorts, setTargetCohorts] = useState('All Enrolled Candidates');
  const [submitting, setSubmitting] = useState(false);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error('Title and Content are required.');
      return;
    }

    try {
      setSubmitting(true);
      await adminDashboardApi.broadcastNotice({
        title: title.trim(),
        content: content.trim(),
        category,
        priority,
        targetCohorts,
      });
      toast.success('Circular published to student classroom portals!');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to publish circular.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] shadow-2xl overflow-hidden text-[#F7F3E6]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#3D3D3D] flex items-center justify-between bg-[#262626]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#C19B48]/15 border border-[#C19B48]/30 flex items-center justify-center text-[#C19B48]">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-sm font-bold text-[#F7F3E6]">
                Broadcast Notice / Circular
              </h3>
              <p className="text-[11px] text-[#A8A294]">
                Instant synchronization across student portals & notification center
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-[#3D3D3D] text-[#A8A294] hover:text-[#F7F3E6] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleBroadcast} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#A8A294] mb-1">
              Circular Title / Subject
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="e.g. Special Bare Act Revision Session on Monday"
              className="w-full px-3.5 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] text-xs focus:outline-none focus:border-[#C19B48]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#A8A294] mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] text-xs focus:outline-none focus:border-[#C19B48]"
              >
                <option value="General">General</option>
                <option value="Examination">Examination</option>
                <option value="Classroom Timetable">Classroom Timetable</option>
                <option value="Mains Test Series">Mains Test Series</option>
                <option value="Admissions">Admissions</option>
                <option value="Holiday">Holiday</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#A8A294] mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] text-xs focus:outline-none focus:border-[#C19B48]"
              >
                <option value="normal">Normal Priority</option>
                <option value="urgent">Urgent Circular (Alerts Student)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#A8A294] mb-1">
              Target Audience / Cohorts
            </label>
            <input
              type="text"
              value={targetCohorts}
              onChange={(e) => setTargetCohorts(e.target.value)}
              placeholder="e.g. All Enrolled Candidates, PCS-J Foundation"
              className="w-full px-3.5 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] text-xs focus:outline-none focus:border-[#C19B48]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#A8A294] mb-1">
              Circular Content & Instructions
            </label>
            <textarea
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              placeholder="Detailed notification text for candidates..."
              className="w-full px-3.5 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] text-xs focus:outline-none focus:border-[#C19B48] resize-none"
            />
          </div>

          {priority === 'urgent' && (
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2 text-xs text-amber-300">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Urgent priority generates high-visibility alert banner on student dashboard.</span>
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#3D3D3D]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#262626] hover:bg-[#333] border border-[#3D3D3D] text-xs font-medium text-[#A8A294] hover:text-[#F7F3E6] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-[#C19B48] hover:bg-[#D8B862] text-[#1E1E1E] text-xs font-bold transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? 'Broadcasting...' : 'Broadcast Circular'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { X, HelpCircle, Send, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminDashboardApi, type DashboardFacultyDoubt } from '../../lib/adminDashboardApi';

interface QuickDoubtReplyModalProps {
  doubt: DashboardFacultyDoubt;
  onClose: () => void;
  onSuccess: () => void;
}

export const QuickDoubtReplyModal: React.FC<QuickDoubtReplyModalProps> = ({
  doubt,
  onClose,
  onSuccess,
}) => {
  const [replyMessage, setReplyMessage] = useState(
    'Under the relevant statutory framework, constructive res judicata bars any ground of attack or defence which ought to have been raised. However, if the cause of action is genuinely distinct, Explanation IV to Section 11 does not create an absolute bar.'
  );
  const [submitting, setSubmitting] = useState(false);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim()) {
      toast.error('Please type your legal resolution.');
      return;
    }

    try {
      setSubmitting(true);
      await adminDashboardApi.quickReplyDoubt(doubt.id, {
        message: replyMessage.trim(),
      });
      toast.success(`Reply sent and doubt marked resolved for ${doubt.studentName}!`);
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to post reply.');
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
            <div className="w-8 h-8 rounded-lg bg-[#60A5FA]/15 border border-[#60A5FA]/30 flex items-center justify-center text-[#60A5FA]">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-sm font-bold text-[#F7F3E6]">
                  Reply to Student Query
                </h3>
                {doubt.priority === 'urgent' && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                    URGENT
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#A8A294]">
                {doubt.studentName} • Roll #{doubt.rollNumber} • {doubt.sectionTag}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-[#3D3D3D] text-[#A8A294] hover:text-[#F7F3E6] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleReply} className="p-6 space-y-4">
          {/* Query Box */}
          <div className="p-3.5 rounded-xl bg-[#262626] border border-[#3D3D3D] space-y-2">
            <div className="flex items-center justify-between text-[11px] text-[#A8A294]">
              <span className="font-semibold text-[#60A5FA]">{doubt.sectionTag}</span>
              <span>{doubt.timeAgo}</span>
            </div>
            <p className="text-xs text-[#F7F3E6] leading-relaxed italic">
              "{doubt.questionSnippet}"
            </p>
            {doubt.thread && doubt.thread.length > 1 && (
              <div className="pt-2 border-t border-[#3D3D3D] space-y-1.5 text-[11px] text-[#A8A294] max-h-28 overflow-y-auto">
                <span className="font-semibold text-[10px] uppercase text-[#C19B48]">Prior Messages:</span>
                {doubt.thread.map((msg, idx) => (
                  <div key={idx} className="p-2 rounded bg-[#1E1E1E]">
                    <span className="font-bold text-[#F7F3E6]">{msg.senderName}: </span>
                    <span>{msg.message}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-[#A8A294] mb-1">
              Faculty Legal Explanation & Solution
            </label>
            <textarea
              rows={4}
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              required
              placeholder="Cite bare act section, relevant Supreme Court ratio, or procedural exceptions..."
              className="w-full px-3.5 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] text-xs focus:outline-none focus:border-[#C19B48] resize-none"
            />
          </div>

          <div className="p-3 rounded-xl bg-[#34D399]/10 border border-[#34D399]/30 flex items-center gap-2 text-xs text-[#34D399]">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Posting will mark this query resolved and deliver notification to student's app.</span>
          </div>

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
              <span>{submitting ? 'Posting...' : 'Reply & Resolve'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

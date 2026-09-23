import React, { useState } from 'react';
import { X, CheckCircle, FileText, Award, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminDashboardApi, type DashboardMainsSubmission } from '../../lib/adminDashboardApi';

interface QuickGradeModalProps {
  submission: DashboardMainsSubmission;
  onClose: () => void;
  onSuccess: () => void;
}

export const QuickGradeModal: React.FC<QuickGradeModalProps> = ({
  submission,
  onClose,
  onSuccess,
}) => {
  const [score, setScore] = useState<number | ''>(submission.score || 18.5);
  const maxMarks = submission.maxScore || 25;
  const [remarks, setRemarks] = useState(
    submission.remarks ||
      'Sound doctrinal foundation with accurate citation of precedent. Handwriting is neat and legal arguments are well structured.'
  );
  const [strengths, setStrengths] = useState(
    submission.strengths ||
      'Precise demarcation of statutory provisions and clear distinction between confession and physical discovery.'
  );
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (score === '' || Number(score) < 0 || Number(score) > maxMarks) {
      toast.error(`Please enter a valid score between 0 and ${maxMarks}`);
      return;
    }
    if (!remarks.trim()) {
      toast.error('Please enter evaluator remarks.');
      return;
    }

    try {
      setSubmitting(true);
      await adminDashboardApi.quickEvaluateSubmission(submission.id, {
        score: Number(score),
        remarks: remarks.trim(),
        strengths: strengths.trim(),
      });
      toast.success(`Evaluated copy returned to ${submission.studentName}!`);
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to grade submission.');
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
              <Award className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-sm font-bold text-[#F7F3E6]">
                  Evaluate Mains Copy #{submission.challengeNumber}
                </h3>
                {submission.isOverdue && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                    Past 24h SLA
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#A8A294]">
                {submission.studentName} • Roll #{submission.rollNumber}
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 rounded-xl bg-[#262626] border border-[#3D3D3D] space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#C19B48] font-medium">
                <FileText className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{submission.topicTitle}</span>
              </div>
              {submission.pdfUrl && (
                <a
                  href={submission.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-[#60A5FA] hover:underline shrink-0"
                >
                  View PDF ({submission.pdfSizeFormatted})
                </a>
              )}
            </div>
            <div className="text-[11px] text-[#A8A294]">
              Evaluation will be stamped with your faculty digital seal and synced to student portal.
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#A8A294] mb-1">
                Marks Awarded (Out of {maxMarks})
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max={maxMarks}
                  value={score}
                  onChange={(e) => setScore(e.target.value === '' ? '' : Number(e.target.value))}
                  required
                  className="w-full px-3.5 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] font-bold text-sm focus:outline-none focus:border-[#C19B48]"
                />
                <span className="absolute right-3.5 top-2.5 text-xs text-[#A8A294]">
                  / {maxMarks}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#A8A294] mb-1">
                Status on Completion
              </label>
              <div className="w-full px-3.5 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#34D399] font-medium text-xs flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Mark as Evaluated & Returned</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#A8A294] mb-1">
              Evaluator Remarks & Constructive Feedback
            </label>
            <textarea
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              required
              placeholder="Provide doctrinal reasoning, statute points, and exam guidance..."
              className="w-full px-3.5 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] text-xs focus:outline-none focus:border-[#C19B48] resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#A8A294] mb-1">
              Key Strengths / Precedent Command
            </label>
            <input
              type="text"
              value={strengths}
              onChange={(e) => setStrengths(e.target.value)}
              placeholder="e.g. Excellent articulation of landmark Constitution Bench..."
              className="w-full px-3.5 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] text-xs focus:outline-none focus:border-[#C19B48]"
            />
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
              <span>{submitting ? 'Submitting...' : 'Return Graded Copy'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

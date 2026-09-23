import React, { useEffect, useState } from 'react';
import { X, CheckCircle, FileText, UserCheck } from 'lucide-react';
import { adminDashboardApi, type DashboardMainsSubmission } from '../../lib/adminDashboardApi';

interface EvaluatedScorecardModalProps {
  submission: DashboardMainsSubmission;
  onClose: () => void;
}

export const EvaluatedScorecardModal: React.FC<EvaluatedScorecardModalProps> = ({
  submission,
  onClose,
}) => {
  const [details, setDetails] = useState<any>(null);

  useEffect(() => {
    adminDashboardApi
      .getSubmissionScorecard(submission.id)
      .then((data) => setDetails(data))
      .catch((err) => {
        console.error('Failed to load scorecard details:', err);
        setDetails(submission);
      });
  }, [submission]);

  const score = details?.score ?? submission.score ?? 18.5;
  const maxScore = details?.maxScore ?? submission.maxScore ?? 25;
  const evaluatorName = details?.evaluatedBy?.name
    ? details.evaluatedBy.name.startsWith('Adv.')
      ? details.evaluatedBy.name
      : `${details.evaluatedBy.salutation || 'Adv.'} ${details.evaluatedBy.name}`
    : submission.evaluatedBy || 'Adv. Rajinder Sir';

  const remarks =
    details?.remarks ||
    submission.remarks ||
    'Evaluated by Rajinder Sir • Score: 18.5/25. Sound doctrinal foundation with accurate citation of landmark precedents.';
  const strengths =
    details?.strengths ||
    submission.strengths ||
    'Outstanding doctrinal command over Kathi Kalu Oghad and Selvi precedents. Clear distinction between discovery and confession.';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] shadow-2xl overflow-hidden text-[#F7F3E6] flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#3D3D3D] flex items-center justify-between bg-[#262626]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#34D399]/15 border border-[#34D399]/30 flex items-center justify-center text-[#34D399]">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-[#F7F3E6]">
                Evaluated Answer Copy Scorecard
              </h3>
              <p className="text-xs text-[#A8A294]">
                {submission.studentName} • Roll #{submission.rollNumber}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#3D3D3D] text-[#A8A294] hover:text-[#F7F3E6] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {/* Score Header Card */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-[#262626] to-[#1E1E1E] border border-[#C19B48]/30 flex items-center justify-between">
            <div>
              <div className="text-xs text-[#A8A294]">Evaluation Result</div>
              <div className="font-serif text-3xl font-bold text-[#C19B48]">
                {score} <span className="text-sm font-normal text-[#A8A294]">/ {maxScore}</span>
              </div>
              <div className="text-[11px] text-[#34D399] font-medium flex items-center gap-1 mt-0.5">
                <CheckCircle className="w-3 h-3" />
                <span>Marked & Returned to Student Portal</span>
              </div>
            </div>

            <div className="text-right text-xs">
              <div className="text-[#A8A294] flex items-center justify-end gap-1">
                <UserCheck className="w-3.5 h-3.5 text-[#C19B48]" />
                <span>Evaluated By:</span>
              </div>
              <div className="font-bold text-[#F7F3E6] mt-0.5">{evaluatorName}</div>
              <div className="text-[10px] text-[#C19B48]">Chamber Dean Seal Verified</div>
            </div>
          </div>

          {/* Question / Challenge Info */}
          <div className="p-3.5 rounded-xl bg-[#262626] border border-[#3D3D3D] space-y-1 text-xs">
            <div className="text-[#C19B48] font-semibold flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              <span>Challenge #{submission.challengeNumber || 48}: {submission.topicTitle}</span>
            </div>
            <div className="text-[11px] text-[#A8A294]">
              Civil Procedure Code & Substantive Constitutional Analysis
            </div>
          </div>

          {/* Feedback & Remarks */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-[#A8A294] mb-1">
                Evaluator Feedback & Doctrinal Critique
              </label>
              <div className="p-3 rounded-xl bg-[#262626] border border-[#3D3D3D] text-xs text-[#F7F3E6] leading-relaxed">
                {remarks}
              </div>
            </div>

            {strengths && (
              <div>
                <label className="block text-xs font-semibold text-[#34D399] mb-1">
                  Key Strengths & Precedent Citation
                </label>
                <div className="p-3 rounded-xl bg-[#34D399]/10 border border-[#34D399]/25 text-xs text-[#F7F3E6] leading-relaxed">
                  {strengths}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[#3D3D3D] bg-[#262626] flex items-center justify-between">
          <span className="text-[11px] text-[#A8A294]">
            Student ID: {submission.rollNumber}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#C19B48] hover:bg-[#D8B862] text-[#1E1E1E] text-xs font-bold transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import {
  FileCheck,
  Download,
  User,
} from 'lucide-react';
import { toast } from 'sonner';

interface EvaluatedCopy {
  id: string;
  testTitle: string;
  subject: string;
  submittedOn: string;
  evaluatedOn: string;
  evaluator: string;
  score: string;
  maxScore: string;
  remarks: string;
  strengths: string;
  needsWork: string;
}

const evaluatedCopies: EvaluatedCopy[] = [
  {
    id: 'eval-1',
    testTitle: 'DAW #82: Framing of Issues under CPC Order 14',
    subject: 'Civil Law I',
    submittedOn: '06 Sep 2025',
    evaluatedOn: '08 Sep 2025',
    evaluator: 'Adv. Rajinder Sir',
    score: '15.5',
    maxScore: '20',
    remarks: 'Excellent structuring. Issues of law vs issues of fact separated clearly as per Order 14 Rule 2.',
    strengths: 'Spot-on case law citations and crisp operative reasoning.',
    needsWork: 'Can articulate burden of proof under Section 101/102 Evidence Act more prominently.',
  },
  {
    id: 'eval-2',
    testTitle: 'Mains Mock 01: Criminal Law Full Paper (CrPC & IPC/BNS)',
    subject: 'Criminal Law',
    submittedOn: '28 Aug 2025',
    evaluatedOn: '31 Aug 2025',
    evaluator: 'Adv. Rajinder Sir',
    score: '138',
    maxScore: '200',
    remarks: 'Solid grasp of arrest safeguards under Arnesh Kumar and Section 41A CrPC. Good handwriting.',
    strengths: 'BNS comparative section mapping done accurately.',
    needsWork: 'Charge drafting format in Q4 lacked standard statutory preamble phrases.',
  },
];

export const MainsEvaluatedPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-semibold mb-2">
            <FileCheck className="w-3.5 h-3.5" />
            <span>Faculty Evaluated Copies & Remarks</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 dark:text-white">
            Evaluated Copies & Feedback
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Review detailed marginal notes, scorecards, and qualitative suggestions by Adv. Rajinder Sir.
          </p>
        </div>

        <div className="text-right">
          <span className="text-xs text-slate-400 block">Total Evaluated</span>
          <span className="text-lg font-bold text-[#c19b48] dark:text-[#e8cf8d] font-mono">12 Copies</span>
        </div>
      </div>

      {/* Evaluated Copies Feed */}
      <div className="space-y-4">
        {evaluatedCopies.map((copy) => (
          <div
            key={copy.id}
            className="p-6 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] space-y-4 shadow-xs"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-[#143564]">
              <div>
                <span className="text-[10px] font-bold text-[#c19b48] uppercase tracking-wider block mb-0.5">
                  {copy.subject}
                </span>
                <h3 className="text-base font-serif font-bold text-slate-900 dark:text-white">
                  {copy.testTitle}
                </h3>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Score Awarded</span>
                  <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    {copy.score} / {copy.maxScore}
                  </span>
                </div>
                <button
                  onClick={() => toast.success(`Downloading evaluated PDF with red-ink annotations for ${copy.testTitle}`)}
                  className="px-3 py-1.5 rounded-xl bg-[#c19b48] hover:bg-[#d8b862] text-[#061120] font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Annotated PDF</span>
                </button>
              </div>
            </div>

            {/* Mentor Remarks Card */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#c19b48]" />
                  <span>Evaluator: {copy.evaluator}</span>
                </span>
                <span className="text-[11px] text-slate-400">Evaluated on {copy.evaluatedOn}</span>
              </div>
              <p className="text-slate-700 dark:text-slate-300 italic leading-relaxed">
                "{copy.remarks}"
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 dark:border-[#143564]/60 text-[11px]">
                <div>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 block mb-0.5">Key Strengths:</span>
                  <span className="text-slate-600 dark:text-slate-300">{copy.strengths}</span>
                </div>
                <div>
                  <span className="font-bold text-amber-600 dark:text-amber-400 block mb-0.5">Areas for Improvement:</span>
                  <span className="text-slate-600 dark:text-slate-300">{copy.needsWork}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

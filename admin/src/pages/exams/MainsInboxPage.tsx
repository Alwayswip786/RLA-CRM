import React, { useState } from 'react';
import {
  FileCheck,
  Download,
  Upload,
  Clock,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface PendingCopy {
  id: string;
  studentName: string;
  rollNumber: string;
  batch: string;
  challengeTitle: string;
  challengeCode: string;
  submittedAt: string;
  fileSize: string;
  maxScore: number;
}

const PENDING_COPIES: PendingCopy[] = [
  {
    id: 'copy-01',
    studentName: 'Pooja Sharma',
    rollNumber: 'RLA-2026-042',
    batch: 'Morning Shift (Cohort A)',
    challengeTitle: 'CPC Sec 11 - Res Judicata vs Issue Estoppel in Civil Suits',
    challengeCode: 'DAW-2026-048',
    submittedAt: 'Today at 01:15 PM',
    fileSize: '4.2 MB PDF',
    maxScore: 25,
  },
  {
    id: 'copy-02',
    studentName: 'Rohan Verma',
    rollNumber: 'RLA-2026-089',
    batch: 'Morning Shift (Cohort A)',
    challengeTitle: 'CPC Sec 9 - Scope of Inherent Jurisdiction & Express Bars',
    challengeCode: 'DAW-2026-048',
    submittedAt: 'Today at 02:30 PM',
    fileSize: '3.8 MB PDF',
    maxScore: 25,
  },
  {
    id: 'copy-03',
    studentName: 'Tarun Saxena',
    rollNumber: 'RLA-2026-112',
    batch: 'Evening Shift (Cohort B)',
    challengeTitle: 'BNSS Section 35 vs Arnesh Kumar: Procedural Safeguards',
    challengeCode: 'DAW-2026-047',
    submittedAt: 'Yesterday at 08:15 PM',
    fileSize: '5.1 MB PDF',
    maxScore: 20,
  },
  {
    id: 'copy-04',
    studentName: 'Kavita Mehra',
    rollNumber: 'RLA-2026-063',
    batch: 'Weekend Fastrack (Cohort C)',
    challengeTitle: 'BNS Murder vs Culpable Homicide: Analytical Judgment Essay',
    challengeCode: 'DAW-2026-046',
    submittedAt: 'Yesterday at 09:40 PM',
    fileSize: '4.6 MB PDF',
    maxScore: 25,
  },
];

export const MainsInboxPage: React.FC = () => {
  const [copies, setCopies] = useState<PendingCopy[]>(PENDING_COPIES);
  const [activeGradingCopy, setActiveGradingCopy] = useState<PendingCopy | null>(null);
  const [score, setScore] = useState('');
  const [remarks, setRemarks] = useState('');

  const handleGradeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGradingCopy) return;

    toast.success(
      <div>
        <div className="font-semibold text-[#F7F3E6]">Evaluated copy returned to {activeGradingCopy.studentName}</div>
        <div className="text-xs text-[#A8A294] mt-0.5">Score: {score}/{activeGradingCopy.maxScore} • Remarks synchronized to Student Portal.</div>
      </div>
    );
    setCopies((prev) => prev.filter((c) => c.id !== activeGradingCopy.id));
    setActiveGradingCopy(null);
    setScore('');
    setRemarks('');
  };

  return (
    <div className="space-y-6 select-none">
      {/* Header */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F59E0B]/15 border border-[#F59E0B]/30 text-[#F59E0B] text-xs font-semibold">
            <FileCheck className="w-3.5 h-3.5" />
            <span>Mains Evaluation Desk</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#F7F3E6]">
            Pending Answer Sheets (PDF Inbox)
          </h1>
          <p className="text-xs text-[#A8A294] max-w-2xl leading-relaxed">
            Review and grade handwritten PDF answer sheets submitted for Daily Answer Writing (DAW). Annotate margins, input score rubrics, and upload evaluated copies.
          </p>
        </div>

        <div className="text-right shrink-0">
          <div className="text-xs text-[#A8A294]">Pending Evaluation:</div>
          <div className="font-serif text-2xl font-bold text-[#F59E0B]">
            {copies.length} Copies
          </div>
        </div>
      </div>

      {/* Grade Modal / Dialog */}
      {activeGradingCopy && (
        <div className="p-6 rounded-2xl bg-[#262626] border-2 border-[#C19B48]/50 space-y-4">
          <div className="flex items-center justify-between border-b border-[#3D3D3D] pb-3">
            <div>
              <h3 className="font-serif text-base font-bold text-[#F7F3E6]">
                Grading: {activeGradingCopy.studentName} ({activeGradingCopy.rollNumber})
              </h3>
              <p className="text-xs text-[#C19B48]">{activeGradingCopy.challengeTitle}</p>
            </div>
            <button
              onClick={() => setActiveGradingCopy(null)}
              className="text-xs text-[#A8A294] hover:text-[#F7F3E6]"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleGradeSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="text-[#A8A294] font-medium">
                Score (Out of {activeGradingCopy.maxScore})
              </label>
              <input
                type="number"
                step="0.5"
                required
                max={activeGradingCopy.maxScore}
                value={score}
                onChange={(e) => setScore(e.target.value)}
                placeholder="e.g. 18.5"
                className="w-full px-3.5 py-2 rounded-xl bg-[#1E1E1E] border border-[#3D3D3D] text-[#F7F3E6] focus:outline-hidden focus:border-[#C19B48]"
              />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-[#A8A294] font-medium">
                Faculty Remarks & Key Suggestions
              </label>
              <input
                type="text"
                required
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Good ratio citation. Strengthen structural reasoning on Explanations IV & VIII."
                className="w-full px-3.5 py-2 rounded-xl bg-[#1E1E1E] border border-[#3D3D3D] text-[#F7F3E6] focus:outline-hidden focus:border-[#C19B48]"
              />
            </div>

            <div className="sm:col-span-3 flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => toast('Downloaded student original PDF', { icon: '📄' })}
                className="px-3.5 py-2 rounded-xl bg-[#1E1E1E] hover:bg-[#2F2F2F] text-[#A8A294] hover:text-[#F7F3E6] border border-[#3D3D3D] transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>View PDF ({activeGradingCopy.fileSize})</span>
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#C19B48] hover:bg-[#D8B862] text-[#1E1E1E] font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Submit Score & Return Copy</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Copies Table */}
      <div className="rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#3D3D3D] bg-[#262626] text-[#A8A294] uppercase tracking-wider text-[10px] font-bold">
                <th className="py-3.5 px-4">Student & Roll No</th>
                <th className="py-3.5 px-4">Daily Challenge Code & Title</th>
                <th className="py-3.5 px-4">Batch Shift</th>
                <th className="py-3.5 px-4">Submission Time</th>
                <th className="py-3.5 px-4">File Size</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#3D3D3D]/60 text-[#F7F3E6]">
              {copies.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#34D399]">
                    All answer sheets evaluated! Zero copies pending in inbox.
                  </td>
                </tr>
              ) : (
                copies.map((copy) => (
                  <tr key={copy.id} className="hover:bg-[#2F2F2F]/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-sm text-[#F7F3E6]">{copy.studentName}</div>
                      <div className="font-mono text-[11px] text-[#A8A294]">{copy.rollNumber}</div>
                    </td>

                    <td className="py-3.5 px-4 max-w-[280px]">
                      <div className="font-medium text-[#F7F3E6] truncate">{copy.challengeTitle}</div>
                      <div className="font-mono text-[10px] text-[#C19B48]">{copy.challengeCode}</div>
                    </td>

                    <td className="py-3.5 px-4 text-xs text-[#A8A294]">{copy.batch}</td>

                    <td className="py-3.5 px-4 text-xs text-[#A8A294] flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#F59E0B]" />
                      <span>{copy.submittedAt}</span>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-[#A8A294]">
                      {copy.fileSize}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setActiveGradingCopy(copy)}
                        className="px-3 py-1.5 rounded-lg bg-[#C19B48] hover:bg-[#D8B862] text-[#1E1E1E] font-bold text-xs transition-colors cursor-pointer"
                      >
                        Grade Copy
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

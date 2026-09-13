import React from 'react';
import {
  Download,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface GradedCopy {
  id: string;
  studentName: string;
  rollNumber: string;
  challengeCode: string;
  challengeTitle: string;
  score: string;
  evaluatedBy: string;
  evaluatedDate: string;
  keyRemarks: string;
}

const GRADED_COPIES: GradedCopy[] = [
  {
    id: 'graded-01',
    studentName: 'Ananya Sen',
    rollNumber: 'RLA-2026-015',
    challengeCode: 'DAW-2026-048',
    challengeTitle: 'CPC Sec 11 - Res Judicata & Constructive Res Judicata',
    score: '21.5 / 25',
    evaluatedBy: 'Adv. Rajinder Sir',
    evaluatedDate: 'Today, 11:30 AM',
    keyRemarks: 'Outstanding framing of issues. Ratio citation of Forward Construction Co. is well reasoned.',
  },
  {
    id: 'graded-02',
    studentName: 'Pooja Sharma',
    rollNumber: 'RLA-2026-042',
    challengeCode: 'DAW-2026-047',
    challengeTitle: 'BNSS Section 35: Notice of Appearance Guidelines',
    score: '18.0 / 20',
    evaluatedBy: 'Adv. Sharma',
    evaluatedDate: 'Yesterday, 04:15 PM',
    keyRemarks: 'Good procedural flow. Highlight constitutional safeguards under Article 22 as well.',
  },
  {
    id: 'graded-03',
    studentName: 'Rohan Verma',
    rollNumber: 'RLA-2026-089',
    challengeCode: 'DAW-2026-046',
    challengeTitle: 'BNS Murder vs Culpable Homicide Distinction',
    score: '19.5 / 25',
    evaluatedBy: 'Adv. Rajinder Sir',
    evaluatedDate: '10 Sep 2026',
    keyRemarks: 'Substantial improvement in structure. Focus on Exceptions to Section 100.',
  },
];

export const MainsGradedPage: React.FC = () => {
  return (
    <div className="space-y-6 select-none">
      <div className="p-6 sm:p-8 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] space-y-1">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#34D399]/15 border border-[#34D399]/30 text-[#34D399] text-xs font-semibold">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Evaluated Answer Archive</span>
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#F7F3E6]">
          Graded Answer Copies & Feedback Archive
        </h1>
        <p className="text-xs text-[#A8A294] max-w-2xl leading-relaxed">
          Historical repository of evaluated student answer copies with marks scored, mentor margin annotations, and structural remarks.
        </p>
      </div>

      <div className="rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#3D3D3D] bg-[#262626] text-[#A8A294] uppercase tracking-wider text-[10px] font-bold">
                <th className="py-3.5 px-4">Student & Roll No</th>
                <th className="py-3.5 px-4">Challenge Title</th>
                <th className="py-3.5 px-4">Score Awarded</th>
                <th className="py-3.5 px-4">Evaluator Faculty</th>
                <th className="py-3.5 px-4 max-w-[260px]">Mentor Remarks</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#3D3D3D]/60 text-[#F7F3E6]">
              {GRADED_COPIES.map((copy) => (
                <tr key={copy.id} className="hover:bg-[#2F2F2F]/50 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-sm text-[#F7F3E6]">{copy.studentName}</div>
                    <div className="font-mono text-[11px] text-[#A8A294]">{copy.rollNumber}</div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-medium text-[#F7F3E6]">{copy.challengeTitle}</div>
                    <span className="font-mono text-[10px] text-[#C19B48]">{copy.challengeCode}</span>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-serif text-base font-bold text-[#34D399]">{copy.score}</div>
                    <div className="text-[10px] text-[#A8A294]">{copy.evaluatedDate}</div>
                  </td>

                  <td className="py-3.5 px-4 font-medium text-[#F7F3E6]">{copy.evaluatedBy}</td>

                  <td className="py-3.5 px-4 text-xs text-[#A8A294] max-w-[260px] truncate">
                    {copy.keyRemarks}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => toast.success(`Downloading checked PDF for ${copy.studentName}`)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#262626] hover:bg-[#C19B48] text-[#F7F3E6] hover:text-[#1E1E1E] border border-[#3D3D3D] text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Checked PDF</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

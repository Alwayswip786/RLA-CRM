import React from 'react';
import {
  CheckSquare,
  Plus,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';

interface QuestionItem {
  id: string;
  act: string;
  section: string;
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
}

const QUESTIONS_BANK: QuestionItem[] = [
  {
    id: 'mcq-01',
    act: 'Civil Procedure Code',
    section: 'Section 11 (Explanation IV)',
    questionText: 'Under the Code of Civil Procedure, 1908, constructive res judicata is embodied in:',
    options: [
      'Explanation I to Section 11',
      'Explanation IV to Section 11',
      'Explanation VI to Section 11',
      'Explanation VIII to Section 11',
    ],
    correctOptionIndex: 1,
    explanation: 'Explanation IV to Section 11 provides that any matter which might and ought to have been made ground of defence or attack shall be deemed to have been a matter directly and substantially in issue.',
  },
  {
    id: 'mcq-02',
    act: 'Civil Procedure Code',
    section: 'Section 10',
    questionText: 'Section 10 of the Code of Civil Procedure bars:',
    options: [
      'The institution of a subsequent suit',
      'The trial of a subsequent suit',
      'The execution of a decree',
      'The passing of an interim order',
    ],
    correctOptionIndex: 1,
    explanation: 'Section 10 only bars the trial of a suit and not the institution of the subsequent suit.',
  },
  {
    id: 'mcq-03',
    act: 'BNSS 2023',
    section: 'Section 35',
    questionText: 'Notice of appearance before a police officer is issued under which section of BNSS 2023?',
    options: [
      'Section 35',
      'Section 41A',
      'Section 50',
      'Section 57',
    ],
    correctOptionIndex: 0,
    explanation: 'Section 35 of the Bharatiya Nagarik Suraksha Sanhita replaces Section 41A of the CrPC, mandating notice for offences punishable with imprisonment up to 7 years.',
  },
];

export const TestsQuestionBankPage: React.FC = () => {
  return (
    <div className="space-y-6 select-none">
      <div className="p-6 sm:p-8 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C19B48]/15 border border-[#C19B48]/30 text-[#C19B48] text-xs font-semibold">
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Central MCQ Vault</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#F7F3E6]">
            Bare Act MCQ Question Bank
          </h1>
          <p className="text-xs text-[#A8A294] max-w-2xl leading-relaxed">
            Repository of 4,500+ past judicial prelims multiple-choice questions tagged section-by-section across CPC, BNSS, BNS, BSA, and Minor Acts.
          </p>
        </div>

        <button
          onClick={() => toast.info('MCQ Creator Modal')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C19B48] hover:bg-[#D8B862] text-[#1E1E1E] text-xs font-bold transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Bare Act MCQ</span>
        </button>
      </div>

      <div className="space-y-4">
        {QUESTIONS_BANK.map((mcq) => (
          <div
            key={mcq.id}
            className="p-6 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] hover:border-[#C19B48]/50 transition-colors space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-[#C19B48] bg-[#C19B48]/15 px-2 py-0.5 rounded border border-[#C19B48]/30">
                {mcq.act} • {mcq.section}
              </span>
              <span className="text-xs text-[#34D399] font-medium">Verified Judicial Key</span>
            </div>

            <h4 className="text-sm font-semibold text-[#F7F3E6] leading-relaxed">
              {mcq.questionText}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
              {mcq.options.map((opt, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                    idx === mcq.correctOptionIndex
                      ? 'bg-[#34D399]/15 border-[#34D399]/40 text-[#34D399] font-bold'
                      : 'bg-[#262626] border-[#3D3D3D] text-[#A8A294]'
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-[#1E1E1E] flex items-center justify-center text-[10px] shrink-0 font-mono">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span>{opt}</span>
                  {idx === mcq.correctOptionIndex && (
                    <CheckCircle2 className="w-4 h-4 ml-auto text-[#34D399]" />
                  )}
                </div>
              ))}
            </div>

            <div className="p-3 rounded-xl bg-[#262626] border border-[#3D3D3D] text-xs text-[#A8A294] space-y-1">
              <span className="text-[10px] uppercase font-bold text-[#C19B48]">Precedent & Explanation:</span>
              <p>{mcq.explanation}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

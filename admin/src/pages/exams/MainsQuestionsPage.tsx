import React from 'react';
import {
  FileText,
  Plus,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface MainsQuestion {
  id: string;
  code: string;
  title: string;
  subject: string;
  targetState: string;
  marks: number;
  wordLimit: string;
  hasModelAnswer: boolean;
}

const QUESTIONS: MainsQuestion[] = [
  {
    id: 'q-48',
    code: 'DAW-2026-048',
    title: 'Explain the doctrine of Constructive Res Judicata with special reference to Explanation IV to Section 11 CPC. Distinguish it from Issue Estoppel.',
    subject: 'Civil Procedure Code',
    targetState: 'Delhi Judicial Service (DJS)',
    marks: 25,
    wordLimit: '400 words',
    hasModelAnswer: true,
  },
  {
    id: 'q-47',
    code: 'DAW-2026-047',
    title: 'Critically analyze Section 35 of Bharatiya Nagarik Suraksha Sanhita (BNSS). Discuss the mandatory compliance rules laid down in Arnesh Kumar v. State of Bihar.',
    subject: 'BNSS 2023',
    targetState: 'Haryana Judicial Service (HCS)',
    marks: 20,
    wordLimit: '300 words',
    hasModelAnswer: true,
  },
  {
    id: 'q-46',
    code: 'DAW-2026-046',
    title: '"Every murder is culpable homicide, but every culpable homicide is not murder." Analyze this proposition in the light of Bharatiya Nyaya Sanhita (BNS) 2023.',
    subject: 'Bharatiya Nyaya Sanhita',
    targetState: 'UP PCS-J / MP Judiciary',
    marks: 25,
    wordLimit: '500 words',
    hasModelAnswer: true,
  },
];

export const MainsQuestionsPage: React.FC = () => {
  return (
    <div className="space-y-6 select-none">
      <div className="p-6 sm:p-8 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C19B48]/15 border border-[#C19B48]/30 text-[#C19B48] text-xs font-semibold">
            <FileText className="w-3.5 h-3.5" />
            <span>Subjective Question Bank</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#F7F3E6]">
            Daily Mains Question Bank & Model Answers
          </h1>
          <p className="text-xs text-[#A8A294] max-w-2xl leading-relaxed">
            Curate past judicial questions, set daily answer writing prompts, and attach comprehensive model answers prepared by Adv. Rajinder Sir.
          </p>
        </div>

        <button
          onClick={() => toast('New Question Prompt Creator', { icon: 'ℹ️' })}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C19B48] hover:bg-[#D8B862] text-[#1E1E1E] text-xs font-bold transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Post Mains Question</span>
        </button>
      </div>

      <div className="space-y-4">
        {QUESTIONS.map((q) => (
          <div
            key={q.id}
            className="p-6 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] hover:border-[#C19B48]/50 transition-colors space-y-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-[#C19B48] bg-[#C19B48]/15 px-2.5 py-0.5 rounded border border-[#C19B48]/30">
                  {q.code}
                </span>
                <span className="text-xs text-[#34D399] font-medium bg-[#34D399]/15 px-2 py-0.5 rounded">
                  {q.targetState}
                </span>
              </div>
              <span className="text-xs text-[#A8A294]">
                Marks: <strong className="text-[#F7F3E6]">{q.marks}</strong> • Word Limit: {q.wordLimit}
              </span>
            </div>

            <h3 className="font-serif text-base font-bold text-[#F7F3E6] leading-relaxed">
              {q.title}
            </h3>

            <div className="pt-3 border-t border-[#3D3D3D] flex items-center justify-between text-xs">
              <span className="text-[#A8A294]">Subject: {q.subject}</span>
              <button
                onClick={() => toast.success(`Viewing model answer for ${q.code}`)}
                className="text-[#C19B48] hover:text-[#E8CF8D] font-bold cursor-pointer"
              >
                View Model Answer Draft →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

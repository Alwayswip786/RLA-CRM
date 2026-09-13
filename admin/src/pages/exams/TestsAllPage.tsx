import React from 'react';
import {
  CheckSquare,
  Plus,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface MockTest {
  id: string;
  code: string;
  title: string;
  targetExam: string;
  totalQuestions: number;
  durationMinutes: number;
  negativeMarking: string;
  attemptsCount: number;
  avgScore: string;
  status: 'published' | 'draft';
}

const MOCK_TESTS: MockTest[] = [
  {
    id: 'test-01',
    code: 'RLA-MOCK-2026-08',
    title: 'All-India Full Judiciary Prelims Mock Test #8',
    targetExam: 'Delhi Judicial Services (DJS 2026)',
    totalQuestions: 150,
    durationMinutes: 120,
    negativeMarking: '-0.25 Marks',
    attemptsCount: 348,
    avgScore: '112.4 / 150',
    status: 'published',
  },
  {
    id: 'test-02',
    code: 'RLA-MOCK-2026-07',
    title: 'Civil Law Bare Act Marathon: CPC & Specific Relief Act',
    targetExam: 'Haryana PCS-J / Punjab Judiciary',
    totalQuestions: 100,
    durationMinutes: 90,
    negativeMarking: '-0.20 Marks',
    attemptsCount: 290,
    avgScore: '78.5 / 100',
    status: 'published',
  },
  {
    id: 'test-03',
    code: 'RLA-MOCK-2026-09',
    title: 'Criminal Law Special: BNSS, BNS & BSA Integrated Quiz',
    targetExam: 'UP PCS-J / MP Judiciary',
    totalQuestions: 100,
    durationMinutes: 90,
    negativeMarking: '-0.25 Marks',
    attemptsCount: 0,
    avgScore: '-',
    status: 'draft',
  },
];

export const TestsAllPage: React.FC = () => {
  return (
    <div className="space-y-6 select-none">
      <div className="p-6 sm:p-8 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C19B48]/15 border border-[#C19B48]/30 text-[#C19B48] text-xs font-semibold">
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Prelims Exam Builder</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#F7F3E6]">
            Mock Test Papers & Exam Manager
          </h1>
          <p className="text-xs text-[#A8A294] max-w-2xl leading-relaxed">
            Create timed online prelims tests, calibrate negative marking schemes, publish automated answer keys, and track live student percentiles.
          </p>
        </div>

        <button
          onClick={() => toast('New Mock Test Paper Creator Opened', { icon: 'ℹ️' })}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C19B48] hover:bg-[#D8B862] text-[#1E1E1E] text-xs font-bold transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create Mock Test</span>
        </button>
      </div>

      <div className="space-y-4">
        {MOCK_TESTS.map((test) => (
          <div
            key={test.id}
            className="p-6 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] hover:border-[#C19B48]/50 transition-colors space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-[#C19B48] bg-[#C19B48]/15 px-2.5 py-0.5 rounded border border-[#C19B48]/30">
                  {test.code}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    test.status === 'published'
                      ? 'bg-[#34D399]/20 text-[#34D399]'
                      : 'bg-[#A8A294]/20 text-[#A8A294]'
                  }`}
                >
                  {test.status}
                </span>
              </div>
              <span className="text-xs text-[#34D399] font-medium bg-[#34D399]/10 px-2 py-0.5 rounded border border-[#34D399]/30">
                {test.targetExam}
              </span>
            </div>

            <div>
              <h3 className="font-serif text-lg font-bold text-[#F7F3E6]">
                {test.title}
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-[#262626] border border-[#3D3D3D] text-xs">
              <div>
                <span className="text-[10px] text-[#A8A294] uppercase font-bold">Total MCQs</span>
                <div className="font-bold text-[#F7F3E6] font-serif">{test.totalQuestions} Questions</div>
              </div>
              <div>
                <span className="text-[10px] text-[#A8A294] uppercase font-bold">Duration</span>
                <div className="font-bold text-[#F7F3E6] font-serif">{test.durationMinutes} Minutes</div>
              </div>
              <div>
                <span className="text-[10px] text-[#A8A294] uppercase font-bold">Negative Marking</span>
                <div className="font-mono text-[#EF4444] font-bold">{test.negativeMarking}</div>
              </div>
              <div>
                <span className="text-[10px] text-[#A8A294] uppercase font-bold">Student Attempts</span>
                <div className="font-bold text-[#34D399] font-serif">{test.attemptsCount} Aspirants</div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 text-xs">
              <span className="text-[#A8A294]">
                Average Score: <strong className="text-[#F7F3E6]">{test.avgScore}</strong>
              </span>
              <button
                onClick={() => toast.success(`Viewing test paper & answer key for ${test.code}`)}
                className="text-[#C19B48] hover:text-[#E8CF8D] font-bold cursor-pointer flex items-center gap-1"
              >
                <span>Edit Test & Answer Key</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

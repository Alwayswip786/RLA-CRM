import React, { useState } from 'react';
import {
  CheckSquare,
  Clock,
  Award,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { toast } from 'sonner';

interface MockTest {
  id: string;
  title: string;
  syllabus: string;
  questionsCount: number;
  duration: string;
  negativeMarking: string;
  targetState: string;
  status: 'Live Now' | 'Scheduled' | 'Attempted';
  score?: string;
  rank?: string;
}

const mockTests: MockTest[] = [
  {
    id: 'mt-1',
    title: 'Delhi Judiciary (DJS) Full Mock 04',
    syllabus: 'Full Syllabus: CPC, CrPC/BNSS, BNS, Evidence, Constitution, Commercial Courts',
    questionsCount: 200,
    duration: '150 Mins',
    negativeMarking: '0.25 Mark',
    targetState: 'Delhi (DJS)',
    status: 'Live Now',
  },
  {
    id: 'mt-2',
    title: 'UP PCS-J Law Paper Mock 03',
    syllabus: 'Substantive & Procedural Law: IPC, CrPC, CPC, TPA, Contract, Partnership',
    questionsCount: 150,
    duration: '120 Mins',
    negativeMarking: '0.33 Mark',
    targetState: 'Uttar Pradesh',
    status: 'Scheduled',
  },
  {
    id: 'mt-3',
    title: 'Bhartiya Nyaya Sanhita (BNS) Master Mock',
    syllabus: '100 MCQs strictly focused on new BNS provisions and repealed IPC sections',
    questionsCount: 100,
    duration: '90 Mins',
    negativeMarking: '0.25 Mark',
    targetState: 'All-India',
    status: 'Attempted',
    score: '84/100',
    rank: 'AIR #14',
  },
];

export const MockSeriesPage: React.FC = () => {
  const [filterState, setFilterState] = useState<string>('all');

  const filtered = filterState === 'all'
    ? mockTests
    : mockTests.filter((m) => m.targetState.toLowerCase().includes(filterState.toLowerCase()));

  const handleStartTest = (test: MockTest) => {
    toast.success(`Initializing Exam Engine for ${test.title}`, {
      description: 'Fullscreen exam lock & webcam proctoring active.',
      duration: 3500,
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-[#c19b48]/15 text-[#c19b48] dark:text-[#e8cf8d] text-xs font-semibold mb-2">
            <Award className="w-3.5 h-3.5" />
            <span>All-India Ranking Mock Engine</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 dark:text-white">
            Prelims All-India Test Series
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real exam simulation with timer, negative marking, and instant detailed scorecards.
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filterState}
            onChange={(e) => setFilterState(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:border-[#c19b48]"
          >
            <option value="all">All Jurisdictions</option>
            <option value="delhi">Delhi (DJS)</option>
            <option value="uttar pradesh">Uttar Pradesh (UP PCS-J)</option>
            <option value="all-india">All-India Special</option>
          </select>
        </div>
      </div>

      {/* Tests Catalog */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((test) => (
          <div
            key={test.id}
            className="p-5 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] flex flex-col justify-between space-y-4 shadow-xs hover:border-[#c19b48]/60 transition-all"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase bg-slate-100 dark:bg-[#061120] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#143564]">
                  {test.targetState}
                </span>

                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    test.status === 'Live Now'
                      ? 'bg-red-500/15 text-red-500 border border-red-500/30 animate-pulse'
                      : test.status === 'Attempted'
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                      : 'bg-blue-500/15 text-blue-500 border border-blue-500/30'
                  }`}
                >
                  {test.status}
                </span>
              </div>

              <h3 className="text-base font-serif font-bold text-slate-900 dark:text-white">
                {test.title}
              </h3>

              <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                {test.syllabus}
              </p>

              <div className="grid grid-cols-2 gap-2 pt-2 text-[11px] text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1">
                  <CheckSquare className="w-3.5 h-3.5 text-[#c19b48]" />
                  <span>{test.questionsCount} Questions</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#c19b48]" />
                  <span>{test.duration}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-[#143564]">
              {test.status === 'Attempted' ? (
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Score / Rank</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                      {test.score} • {test.rank}
                    </span>
                  </div>
                  <button
                    onClick={() => toast.info('Loading full scorecard and question-by-question analysis...')}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#061120] hover:bg-[#c19b48] hover:text-[#061120] text-slate-800 dark:text-slate-200 font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Scorecard
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleStartTest(test)}
                  className="w-full py-2 px-3 rounded-xl bg-[#c19b48] hover:bg-[#d8b862] text-[#061120] font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span>{test.status === 'Live Now' ? 'Enter Live Exam Room' : 'Start Mock Practice'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

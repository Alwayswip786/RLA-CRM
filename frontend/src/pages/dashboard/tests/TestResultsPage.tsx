import React from 'react';
import {
  Award,
  TrendingUp,
  Target,
  CheckCircle,
  XCircle,
  Download,
} from 'lucide-react';
import { toast } from 'sonner';

export const TestResultsPage: React.FC = () => {
  const recentTests = [
    {
      id: 'res-1',
      title: 'Delhi Judiciary (DJS) Prelims Mock 03',
      date: '08 Sep 2025',
      score: '168.75 / 200',
      percentile: '98.4th',
      rank: 'AIR #14',
      correct: 174,
      incorrect: 21,
      unattempted: 5,
      accuracy: '89.2%',
    },
    {
      id: 'res-2',
      title: 'UP PCS-J Full Length Paper 2',
      date: '01 Sep 2025',
      score: '128.5 / 150',
      percentile: '96.1th',
      rank: 'AIR #28',
      correct: 132,
      incorrect: 11,
      unattempted: 7,
      accuracy: '92.3%',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-semibold mb-2">
            <Award className="w-3.5 h-3.5" />
            <span>Candidate Scorecard & Percentile Analytics</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 dark:text-white">
            Scorecards & All-India Rank Analysis
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time comparative benchmarks against toppers and judicial cutoff targets.
          </p>
        </div>

        <button
          onClick={() => toast.success('Comprehensive Candidate Performance Dossier downloaded')}
          className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#061120] hover:bg-[#c19b48] hover:text-[#061120] text-slate-800 dark:text-slate-200 font-semibold text-xs border border-slate-200 dark:border-[#143564] transition-colors flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>Export Performance PDF</span>
        </button>
      </div>

      {/* Aggregate Metrics Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564]">
          <span className="text-xs text-slate-500 dark:text-slate-400">Current All-India Standing</span>
          <div className="text-2xl font-bold text-[#c19b48] dark:text-[#e8cf8d] font-mono mt-1">AIR #14</div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Top 1.5% of 1,200+ aspirants</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564]">
          <span className="text-xs text-slate-500 dark:text-slate-400">Overall Accuracy Rate</span>
          <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono mt-1">87.4%</div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Target for DJS Prelims: 85%+</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564]">
          <span className="text-xs text-slate-500 dark:text-slate-400">Avg Time Per MCQ</span>
          <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono mt-1">42 Secs</div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Fast & confident pace</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564]">
          <span className="text-xs text-slate-500 dark:text-slate-400">Negative Marks Penalty</span>
          <div className="text-2xl font-bold text-red-500 font-mono mt-1">-5.25 Pts</div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Low risk tolerance</span>
        </div>
      </div>

      {/* Tests Breakdown List */}
      <div className="space-y-4">
        <h3 className="text-base font-serif font-bold text-slate-900 dark:text-white">
          Completed Test Reports
        </h3>

        {recentTests.map((t) => (
          <div
            key={t.id}
            className="p-5 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] space-y-4 shadow-xs"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-base font-serif font-bold text-slate-900 dark:text-white">
                  {t.title}
                </h4>
                <span className="text-xs text-slate-400">Attempted on {t.date}</span>
              </div>

              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-xl bg-amber-50 dark:bg-[#c19b48]/15 border border-amber-200 dark:border-[#c19b48]/40 text-[#c19b48] dark:text-[#e8cf8d] font-mono font-bold text-sm">
                  {t.rank}
                </span>
                <span className="px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-mono font-bold text-sm">
                  {t.score}
                </span>
              </div>
            </div>

            {/* Micro Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[10px]">Correct Answers</span>
                  <span className="font-bold text-slate-900 dark:text-white">{t.correct} MCQs</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[10px]">Negative Incurred</span>
                  <span className="font-bold text-slate-900 dark:text-white">{t.incorrect} MCQs</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] flex items-center gap-2">
                <Target className="w-4 h-4 text-[#c19b48] shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[10px]">Accuracy</span>
                  <span className="font-bold text-slate-900 dark:text-white">{t.accuracy}</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-500 shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[10px]">Percentile</span>
                  <span className="font-bold text-slate-900 dark:text-white">{t.percentile}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

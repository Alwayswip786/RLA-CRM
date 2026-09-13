import React from 'react';
import {
  Award,
  Trophy,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface RankEntry {
  rank: number;
  name: string;
  rollNumber: string;
  score: string;
  percentage: string;
  percentile: string;
  batch: string;
}

const LEADERBOARD: RankEntry[] = [
  {
    rank: 1,
    name: 'Ananya Sen',
    rollNumber: 'RLA-2026-015',
    score: '142.5 / 150',
    percentage: '95.0%',
    percentile: '99.98 %ile',
    batch: 'Evening Shift (Cohort B)',
  },
  {
    rank: 2,
    name: 'Pooja Sharma',
    rollNumber: 'RLA-2026-042',
    score: '138.0 / 150',
    percentage: '92.0%',
    percentile: '99.45 %ile',
    batch: 'Morning Shift (Cohort A)',
  },
  {
    rank: 3,
    name: 'Kavita Mehra',
    rollNumber: 'RLA-2026-063',
    score: '131.5 / 150',
    percentage: '87.6%',
    percentile: '98.10 %ile',
    batch: 'Weekend Fastrack (Cohort C)',
  },
  {
    rank: 4,
    name: 'Rohan Verma',
    rollNumber: 'RLA-2026-089',
    score: '124.0 / 150',
    percentage: '82.6%',
    percentile: '95.30 %ile',
    batch: 'Morning Shift (Cohort A)',
  },
];

export const TestsRankingsPage: React.FC = () => {
  return (
    <div className="space-y-6 select-none">
      <div className="p-6 sm:p-8 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C19B48]/15 border border-[#C19B48]/30 text-[#C19B48] text-xs font-semibold">
            <Trophy className="w-3.5 h-3.5" />
            <span>All-India Mock Leaderboard</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#F7F3E6]">
            All-India Rank Computation & Scorecards
          </h1>
          <p className="text-xs text-[#A8A294] max-w-2xl leading-relaxed">
            Automated rank computation, percentile normalization, and cut-off analysis across Delhi, Haryana, and UP judicial mock cohorts.
          </p>
        </div>

        <button
          onClick={() => toast.success('Re-computed All-India percentiles across 348 attempts')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C19B48] hover:bg-[#D8B862] text-[#1E1E1E] text-xs font-bold transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
        >
          <Award className="w-4 h-4" />
          <span>Recalculate Ranks</span>
        </button>
      </div>

      <div className="rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#3D3D3D] bg-[#262626] text-[#A8A294] uppercase tracking-wider text-[10px] font-bold">
                <th className="py-3.5 px-4">Rank</th>
                <th className="py-3.5 px-4">Candidate & Roll No</th>
                <th className="py-3.5 px-4">Score</th>
                <th className="py-3.5 px-4">Accuracy %</th>
                <th className="py-3.5 px-4">All-India Percentile</th>
                <th className="py-3.5 px-4">Cohort Batch</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#3D3D3D]/60 text-[#F7F3E6]">
              {LEADERBOARD.map((entry) => (
                <tr key={entry.rank} className="hover:bg-[#2F2F2F]/50 transition-colors">
                  <td className="py-3.5 px-4 font-bold">
                    <span
                      className={`w-7 h-7 rounded-lg inline-flex items-center justify-center font-serif text-xs ${
                        entry.rank === 1
                          ? 'bg-[#C19B48] text-[#1E1E1E]'
                          : entry.rank === 2
                          ? 'bg-slate-300 text-[#1E1E1E]'
                          : entry.rank === 3
                          ? 'bg-amber-700 text-white'
                          : 'bg-[#262626] text-[#A8A294]'
                      }`}
                    >
                      #{entry.rank}
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-sm text-[#F7F3E6]">{entry.name}</div>
                    <div className="font-mono text-[11px] text-[#A8A294]">{entry.rollNumber}</div>
                  </td>

                  <td className="py-3.5 px-4 font-serif font-bold text-sm text-[#F7F3E6]">
                    {entry.score}
                  </td>

                  <td className="py-3.5 px-4 text-[#34D399] font-semibold">{entry.percentage}</td>

                  <td className="py-3.5 px-4 font-mono font-bold text-xs text-[#C19B48]">
                    {entry.percentile}
                  </td>

                  <td className="py-3.5 px-4 text-xs text-[#A8A294]">{entry.batch}</td>

                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => toast(`Viewing scorecard for ${entry.name}`, { icon: '📊' })}
                      className="px-2.5 py-1 rounded-lg bg-[#262626] hover:bg-[#C19B48] text-[#F7F3E6] hover:text-[#1E1E1E] border border-[#3D3D3D] text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Scorecard
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

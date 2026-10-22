import React, { useState, useEffect } from 'react';
import {
  Users,
  Lock,
} from 'lucide-react';
import { toast } from '../../lib/toast';
import { fetchLiveTestCatalog, fetchLiveTestLeaderboard } from '../../services/liveTest.service';
import type { LiveLeaderboardData } from '../../types/liveTest.types';
import { PodiumSkeleton } from '../ui/skeleton';

export const LiveTestLeaderboard: React.FC = () => {
  const [selectedTestId, setSelectedTestId] = useState<string>('');
  const [leaderboardData, setLeaderboardData] = useState<LiveLeaderboardData | null>(null);
  const [isLoadingRanks, setIsLoadingRanks] = useState<boolean>(true);

  // Load tests catalog on mount to determine default live/attempted test
  useEffect(() => {
    const loadCatalog = async () => {
      try {
        const catalog = await fetchLiveTestCatalog();
        if (catalog.length > 0) {
          // Default to the first live or attempted test
          const defaultTest =
            catalog.find((t) => t.phase === 'live') ||
            catalog.find((t) => t.totalAttempted > 0) ||
            catalog[0];
          setSelectedTestId(defaultTest.id);
        } else {
          setIsLoadingRanks(false);
        }
      } catch (err) {
        console.error('Failed to load live test catalog:', err);
        toast.error('Failed to load test catalog for leaderboard.');
        setIsLoadingRanks(false);
      }
    };
    loadCatalog();
  }, []);

  // Fetch leaderboard whenever selected test changes
  useEffect(() => {
    if (!selectedTestId) return;

    const loadLeaderboard = async () => {
      try {
        setIsLoadingRanks(true);
        const data = await fetchLiveTestLeaderboard(selectedTestId);
        setLeaderboardData(data);
      } catch (err) {
        console.error('Failed to load leaderboard:', err);
        toast.error('Failed to load All-India standings.');
      } finally {
        setIsLoadingRanks(false);
      }
    };
    loadLeaderboard();
  }, [selectedTestId]);

  const rows = leaderboardData?.leaderboard || [];
  const top1 = rows[0];
  const top2 = rows[1];
  const top3 = rows[2];
  const currentUser = leaderboardData?.currentUserRank;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Loading Skeletons */}
      {isLoadingRanks && <PodiumSkeleton />}

      {/* Empty State */}
      {!isLoadingRanks && !leaderboardData && (
        <div className="py-16 text-center rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] space-y-3">
          <Users className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            No live test standings available
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            All-India rankings and merit percentiles will appear here once official mock tests are published.
          </p>
        </div>
      )}

      {/* Standings Content */}
      {!isLoadingRanks && leaderboardData && (
        <div className="space-y-6">
          {/* Top 3 Podium Showcase */}
          {rows.length >= 3 && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              {/* 2nd Place */}
              {top2 && (
                <div className="order-2 md:order-1 p-5 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] flex flex-col items-center text-center space-y-3 relative shadow-xs">
                  <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700/50 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-lg border-2 border-slate-300 dark:border-slate-600">
                    🥈
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Rank #2 • AIR
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                      {top2.name}
                    </h3>
                    <p className="text-[11px] font-mono text-slate-400">{top2.rollNumber}</p>
                  </div>
                  <div className="w-full pt-3 border-t border-slate-100 dark:border-[#143564] grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Score</span>
                      <span className="font-bold text-slate-900 dark:text-white font-mono">
                        {top2.score} pts
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Accuracy</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                        {top2.accuracy}%
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* 1st Place (Champion) */}
              {top1 && (
                <div className="order-1 md:order-2 p-6 rounded-2xl bg-amber-500/10 dark:bg-[#c19b48]/15 border-2 border-[#c19b48] flex flex-col items-center text-center space-y-3 relative shadow-md">
                  <div className="absolute -top-3 px-3 py-0.5 rounded-full bg-[#c19b48] text-[#061120] text-[10px] font-bold uppercase tracking-wider shadow-xs">
                    State Topper
                  </div>
                  <div className="w-14 h-14 rounded-full bg-amber-500/20 dark:bg-[#c19b48]/30 flex items-center justify-center text-2xl border-2 border-[#c19b48] mt-1">
                    🥇
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#c19b48] dark:text-[#e8cf8d]">
                      Rank #1 • AIR
                    </span>
                    <h3 className="text-base font-serif font-bold text-slate-900 dark:text-white mt-0.5">
                      {top1.name}
                    </h3>
                    <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                      {top1.rollNumber}
                    </p>
                  </div>
                  <div className="w-full pt-3 border-t border-[#c19b48]/30 grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                        Score
                      </span>
                      <span className="font-bold text-[#c19b48] dark:text-[#e8cf8d] font-mono text-sm">
                        {top1.score}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                        Accuracy
                      </span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                        {top1.accuracy}%
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                        Time
                      </span>
                      <span className="font-medium text-slate-700 dark:text-slate-300 font-mono">
                        {formatDuration(top1.durationUsedSeconds)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* 3rd Place */}
              {top3 && (
                <div className="order-3 p-5 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] flex flex-col items-center text-center space-y-3 relative shadow-xs">
                  <div className="w-12 h-12 rounded-full bg-amber-700/15 flex items-center justify-center text-amber-700 font-bold text-lg border-2 border-amber-700/30">
                    🥉
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Rank #3 • AIR
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                      {top3.name}
                    </h3>
                    <p className="text-[11px] font-mono text-slate-400">{top3.rollNumber}</p>
                  </div>
                  <div className="w-full pt-3 border-t border-slate-100 dark:border-[#143564] grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Score</span>
                      <span className="font-bold text-slate-900 dark:text-white font-mono">
                        {top3.score} pts
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Accuracy</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                        {top3.accuracy}%
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Full Rankings Table */}
          <div className="rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] overflow-hidden shadow-xs">
            <div className="p-3 sm:p-5 border-b border-slate-200 dark:border-[#143564] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="min-w-0 flex items-center gap-2">
                <Users className="w-4 h-4 text-[#c19b48]" />
                <span className="min-w-0 text-sm font-bold text-slate-900 dark:text-white break-words">
                  Official All-India Candidates ({leaderboardData.totalCandidates})
                </span>
              </div>
              {leaderboardData.isFrozen && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-500 text-xs font-semibold">
                  <Lock className="w-3 h-3" />
                  <span>Leaderboard Finalized</span>
                </span>
              )}
            </div>

            <div className="hidden xl:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-[#143564] bg-slate-50 dark:bg-[#061120] text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                    <th className="py-3 px-4">Rank</th>
                    <th className="py-3 px-4">Candidate & Roll No</th>
                    <th className="py-3 px-4">Score</th>
                    <th className="py-3 px-4">Accuracy</th>
                    <th className="py-3 px-4">Negative Deductions</th>
                    <th className="py-3 px-4">Time Taken</th>
                    <th className="py-3 px-4 text-right">Percentile</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#143564]/50">
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        No official attempts recorded yet for this exam.
                      </td>
                    </tr>
                  ) : (
                    rows.map((row) => (
                      <tr
                        key={row.attemptId}
                        className={`transition-colors ${
                          row.isCurrentUser
                            ? 'bg-emerald-500/10 dark:bg-emerald-500/15 font-semibold'
                            : 'hover:bg-slate-50/70 dark:hover:bg-[#143564]/20'
                        }`}
                      >
                        <td className="py-3.5 px-4 font-bold">
                          <div className="flex items-center gap-1.5">
                            {row.rank === 1 && '🥇'}
                            {row.rank === 2 && '🥈'}
                            {row.rank === 3 && '🥉'}
                            <span>#{row.rank}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-white">
                              {row.name}
                            </span>
                            {row.isCurrentUser && (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-500 text-white text-[9px] font-bold uppercase tracking-wider">
                                YOU
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 block">
                            {row.rollNumber}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                          {row.score} pts
                        </td>
                        <td className="py-3.5 px-4 font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                          {row.accuracy}%
                        </td>
                        <td className="py-3.5 px-4 font-mono text-red-500 font-medium">
                          -{row.negativeMarks} pts
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 font-mono">
                          {formatDuration(row.durationUsedSeconds)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-[#c19b48] dark:text-[#e8cf8d]">
                          {row.percentile} %ile
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile rankings: stacked rows keep every metric readable without a wide table. */}
            <div className="xl:hidden divide-y divide-slate-100 dark:divide-[#143564]/50">
              {rows.length === 0 ? (
                <p className="py-10 px-4 text-center text-xs text-slate-400">
                  No official attempts recorded yet for this exam.
                </p>
              ) : (
                rows.map((row) => (
                  <article
                    key={`mobile-${row.attemptId}`}
                    className={`p-3 sm:p-4 ${row.isCurrentUser ? 'bg-emerald-500/10 dark:bg-emerald-500/15' : ''}`}
                  >
                    <div className="grid grid-cols-[2.25rem_minmax(0,1fr)_auto] items-start gap-2.5">
                      <span className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-[#061120] flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-200">
                        #{row.rank}
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="min-w-0 break-words text-sm font-bold text-slate-900 dark:text-white">
                            {row.name}
                          </span>
                          {row.isCurrentUser && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500 text-white text-[9px] font-bold uppercase tracking-wider">
                              You
                            </span>
                          )}
                        </div>
                        <span className="mt-0.5 block break-words text-[10px] font-mono text-slate-400">
                          {row.rollNumber}
                        </span>
                      </div>
                      <div className="min-w-[4.25rem] text-right">
                        <span className="block text-[10px] text-slate-400">Score</span>
                        <span className="break-words font-mono text-xs font-bold text-slate-900 dark:text-white">
                          {row.score} pts
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 pl-[2.85rem] text-[11px]">
                      <div className="min-w-0">
                        <span className="block text-[10px] text-slate-400">Accuracy</span>
                        <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">{row.accuracy}%</span>
                      </div>
                      <div className="min-w-0">
                        <span className="block text-[10px] text-slate-400">Deductions</span>
                        <span className="font-mono font-semibold text-red-500">-{row.negativeMarks} pts</span>
                      </div>
                      <div className="min-w-0">
                        <span className="block text-[10px] text-slate-400">Time Taken</span>
                        <span className="font-mono text-slate-600 dark:text-slate-300">{formatDuration(row.durationUsedSeconds)}</span>
                      </div>
                      <div className="min-w-0">
                        <span className="block text-[10px] text-slate-400">Percentile</span>
                        <span className="font-mono font-semibold text-[#c19b48] dark:text-[#e8cf8d]">{row.percentile} %ile</span>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>

          {/* Sticky Pinned Current User Card */}
          {currentUser && (
            <div className="p-4 sm:p-5 rounded-2xl bg-emerald-700 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="min-w-0 flex items-start gap-3">
                <div className="w-10 h-10 shrink-0 rounded-xl bg-white/15 flex items-center justify-center font-bold text-base">
                  #{currentUser.rank}
                </div>
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="font-bold text-sm">Your Official Merit Rank</span>
                    <span className="w-fit text-[9px] px-2 py-1 rounded-full bg-white/15 uppercase font-bold leading-tight">
                      All-India Validated
                    </span>
                  </div>
                  <p className="text-xs text-emerald-100 leading-relaxed break-words">
                    Scored {currentUser.score} / {currentUser.maxScore} points with {currentUser.accuracy}% accuracy
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:flex sm:items-center gap-3 sm:gap-4 text-xs">
                <div>
                  <span className="text-[10px] text-emerald-200 block">Percentile</span>
                  <span className="font-bold text-sm font-mono">{currentUser.percentile}%ile</span>
                </div>
                <div className="sm:border-l border-white/20 sm:pl-4">
                  <span className="text-[10px] text-emerald-200 block">Total Candidates</span>
                  <span className="font-bold text-sm font-mono">{leaderboardData.totalCandidates}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Users,
  Lock,
} from 'lucide-react';
import { toast } from '../../lib/toast';
import { fetchLiveTestCatalog, fetchLiveTestLeaderboard } from '../../services/liveTest.service';
import type { LiveMockTestItem, LiveLeaderboardData } from '../../types/liveTest.types';
import { CustomSelect } from '../ui/CustomSelect';
import { PodiumSkeleton } from '../ui/skeleton';

export const LiveTestLeaderboard: React.FC = () => {
  const [tests, setTests] = useState<LiveMockTestItem[]>([]);
  const [selectedTestId, setSelectedTestId] = useState<string>('');
  const [leaderboardData, setLeaderboardData] = useState<LiveLeaderboardData | null>(null);
  const [isLoadingTests, setIsLoadingTests] = useState<boolean>(true);
  const [isLoadingRanks, setIsLoadingRanks] = useState<boolean>(false);

  // Load tests catalog on mount
  useEffect(() => {
    const loadCatalog = async () => {
      try {
        setIsLoadingTests(true);
        const catalog = await fetchLiveTestCatalog();
        setTests(catalog);
        if (catalog.length > 0) {
          // Default to the first live or attempted test
          const defaultTest =
            catalog.find((t) => t.phase === 'live') ||
            catalog.find((t) => t.totalAttempted > 0) ||
            catalog[0];
          setSelectedTestId(defaultTest.id);
        }
      } catch (err) {
        console.error('Failed to load live test catalog:', err);
        toast.error('Failed to load test catalog for leaderboard.');
      } finally {
        setIsLoadingTests(false);
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

  const selectedTest = tests.find((t) => t.id === selectedTestId);
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
      {/* Test Selector & Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-[#c19b48]/15 text-[#c19b48] dark:text-[#e8cf8d] text-xs font-semibold mb-2">
            <Trophy className="w-3.5 h-3.5" />
            <span>All-India Ranking Leaderboard</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 dark:text-white">
            {selectedTest ? selectedTest.title : 'Live Test Standings'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time merit list computed with official Judicial Commission negative marking and tie-breaking algorithms.
          </p>
        </div>

        {/* Test Dropdown Selector */}
        <div className="w-full sm:w-72 shrink-0">
          {isLoadingTests ? (
            <div className="h-10 w-full bg-slate-100 dark:bg-[#061120] rounded-xl animate-pulse" />
          ) : (
            <CustomSelect
              options={tests.map((test) => ({
                value: test.id,
                label: `${test.title} (${test.phase.toUpperCase()})`,
              }))}
              value={selectedTestId}
              onChange={(val) => setSelectedTestId(val)}
              placeholder="Select Mock Exam"
              searchable={tests.length > 5}
              sheetTitle="Select Exam Leaderboard"
              sheetSubtitle="Choose an All-India mock test to view standings"
            />
          )}
        </div>
      </div>

      {/* Loading Skeletons */}
      {isLoadingRanks && <PodiumSkeleton />}

      {/* Standings Content */}
      {!isLoadingRanks && leaderboardData && (
        <div className="space-y-6">
          {/* Top 3 Podium Showcase */}
          {rows.length >= 3 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-[#143564] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#c19b48]" />
                <span className="text-sm font-bold text-slate-900 dark:text-white">
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

            <div className="overflow-x-auto">
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
          </div>

          {/* Sticky Pinned Current User Card */}
          {currentUser && (
            <div className="p-4 rounded-2xl bg-emerald-600 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-bold text-base">
                  #{currentUser.rank}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">Your Official Merit Rank</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 uppercase font-bold">
                      All-India Validated
                    </span>
                  </div>
                  <p className="text-xs text-emerald-100 mt-0.5">
                    Scored {currentUser.score} / {currentUser.maxScore} points with {currentUser.accuracy}% accuracy
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div>
                  <span className="text-[10px] text-emerald-200 block">Percentile</span>
                  <span className="font-bold text-sm font-mono">{currentUser.percentile}%ile</span>
                </div>
                <div className="border-l border-white/20 pl-4">
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

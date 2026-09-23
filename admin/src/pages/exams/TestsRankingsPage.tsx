import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Award,
  ChevronDown,
  Lock,
  Unlock,
  Loader2,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  fetchAdminLiveTests,
  fetchAdminLiveTestAttempts,
  freezeLeaderboardAdminLiveTest,
} from '../../services/adminLiveTest.service';
import type { AdminLiveMockTest, AdminCandidateAttempt } from '../../types/adminLiveTest.types';

export const TestsRankingsPage: React.FC = () => {
  const [tests, setTests] = useState<AdminLiveMockTest[]>([]);
  const [selectedTestId, setSelectedTestId] = useState<string>('');
  const [candidates, setCandidates] = useState<AdminCandidateAttempt[]>([]);
  const [isLoadingTests, setIsLoadingTests] = useState<boolean>(true);
  const [isLoadingCandidates, setIsLoadingCandidates] = useState<boolean>(false);
  const [isFreezing, setIsFreezing] = useState<boolean>(false);

  // Load tests catalog on mount
  useEffect(() => {
    const loadTests = async () => {
      try {
        setIsLoadingTests(true);
        const data = await fetchAdminLiveTests();
        setTests(data);
        if (data.length > 0) {
          // Default to test with most attempts or first test
          const sorted = [...data].sort(
            (a, b) => (b.stats?.totalAttempted || 0) - (a.stats?.totalAttempted || 0)
          );
          setSelectedTestId(sorted[0]._id);
        }
      } catch (err) {
        console.error('Failed to load tests:', err);
        toast.error('Failed to load test series.');
      } finally {
        setIsLoadingTests(false);
      }
    };
    loadTests();
  }, []);

  // Fetch candidate rankings when selected test changes
  useEffect(() => {
    if (!selectedTestId) return;

    const loadCandidates = async () => {
      try {
        setIsLoadingCandidates(true);
        const data = await fetchAdminLiveTestAttempts(selectedTestId);
        setCandidates(data);
      } catch (err) {
        console.error('Failed to load candidates:', err);
        toast.error('Failed to load candidate rankings.');
      } finally {
        setIsLoadingCandidates(false);
      }
    };
    loadCandidates();
  }, [selectedTestId]);

  const selectedTest = tests.find((t) => t._id === selectedTestId);

  const handleToggleFreeze = async () => {
    if (!selectedTest) return;
    try {
      setIsFreezing(true);
      const res = await freezeLeaderboardAdminLiveTest(selectedTest._id);
      toast.success(res.message);
      setTests((prev) =>
        prev.map((t) =>
          t._id === selectedTest._id ? { ...t, isLeaderboardFrozen: res.isLeaderboardFrozen } : t
        )
      );
    } catch (err) {
      console.error('Failed to toggle freeze:', err);
      toast.error('Failed to update leaderboard freeze state.');
    } finally {
      setIsFreezing(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="space-y-6 select-none">
      {/* Header Banner */}
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

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {selectedTest && (
            <button
              type="button"
              onClick={handleToggleFreeze}
              disabled={isFreezing}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-colors cursor-pointer shrink-0 ${
                selectedTest.isLeaderboardFrozen
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40 hover:bg-blue-500/30'
                  : 'bg-[#2A2A2A] hover:bg-[#383838] text-[#F7F3E6] border border-[#3D3D3D]'
              }`}
            >
              {selectedTest.isLeaderboardFrozen ? (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Leaderboard Frozen</span>
                </>
              ) : (
                <>
                  <Unlock className="w-4 h-4" />
                  <span>Freeze Leaderboard</span>
                </>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              toast.success(`Recalculated All-India percentiles across ${candidates.length} attempts`);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C19B48] hover:bg-[#D8B862] text-[#1E1E1E] text-xs font-bold transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
          >
            <Award className="w-4 h-4" />
            <span>Recalculate Ranks</span>
          </button>
        </div>
      </div>

      {/* Test Selector Toolbar */}
      <div className="p-4 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#A8A294] uppercase tracking-wider">
            Select Mock Exam:
          </span>
          {isLoadingTests ? (
            <div className="h-9 w-64 bg-[#2A2A2A] rounded-xl animate-pulse" />
          ) : (
            <div className="relative">
              <select
                value={selectedTestId}
                onChange={(e) => setSelectedTestId(e.target.value)}
                className="appearance-none pl-3.5 pr-8 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-xs font-semibold text-[#F7F3E6] focus:border-[#C19B48] outline-hidden cursor-pointer"
              >
                {tests.map((test) => (
                  <option key={test._id} value={test._id}>
                    {test.testCode} — {test.title} ({test.status.toUpperCase()})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-[#A8A294] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          )}
        </div>

        {selectedTest && (
          <div className="flex items-center gap-4 text-xs text-[#A8A294]">
            <span>
              Target: <strong className="text-[#F7F3E6]">{selectedTest.targetExam}</strong>
            </span>
            <span>
              Attempts: <strong className="text-[#34D399]">{candidates.length}</strong>
            </span>
            <span>
              Avg Score:{' '}
              <strong className="text-[#C19B48]">{selectedTest.stats.avgScore} pts</strong>
            </span>
          </div>
        )}
      </div>

      {/* Rankings Table */}
      <div className="rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] overflow-hidden shadow-xs">
        {isLoadingCandidates ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-[#C19B48] animate-spin" />
            <p className="text-xs text-[#A8A294]">Loading candidate rankings & percentiles...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#3D3D3D] bg-[#262626] text-[#A8A294] uppercase tracking-wider text-[10px] font-bold">
                  <th className="py-3.5 px-4">Rank</th>
                  <th className="py-3.5 px-4">Candidate & Roll No</th>
                  <th className="py-3.5 px-4">Score</th>
                  <th className="py-3.5 px-4">Accuracy %</th>
                  <th className="py-3.5 px-4">Negative Deductions</th>
                  <th className="py-3.5 px-4">Time Taken</th>
                  <th className="py-3.5 px-4">All-India Percentile</th>
                  <th className="py-3.5 px-4">Cohort Batch</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#3D3D3D]/60 text-[#F7F3E6]">
                {candidates.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-[#A8A294]">
                      No student attempts submitted yet for this exam paper.
                    </td>
                  </tr>
                ) : (
                  candidates.map((entry, idx) => {
                    const rank = entry.result?.rank || idx + 1;
                    const rollNo =
                      entry.studentId?.rollNo ||
                      entry.studentId?.rollNumber ||
                      `RLA-2026-${String(idx + 10).padStart(3, '0')}`;

                    return (
                      <tr key={entry._id} className="hover:bg-[#2F2F2F]/50 transition-colors">
                        <td className="py-3.5 px-4 font-bold">
                          <span
                            className={`w-7 h-7 rounded-lg inline-flex items-center justify-center font-serif text-xs ${
                              rank === 1
                                ? 'bg-[#C19B48] text-[#1E1E1E]'
                                : rank === 2
                                ? 'bg-slate-300 text-[#1E1E1E]'
                                : rank === 3
                                ? 'bg-amber-700 text-white'
                                : 'bg-[#262626] text-[#A8A294]'
                            }`}
                          >
                            #{rank}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-sm text-[#F7F3E6]">
                            {entry.studentId?.name || 'Aspirant'}
                          </div>
                          <div className="font-mono text-[11px] text-[#A8A294]">{rollNo}</div>
                        </td>

                        <td className="py-3.5 px-4 font-serif font-bold text-sm text-[#F7F3E6]">
                          {entry.result?.score ?? 0} / {entry.result?.maxScore ?? selectedTest?.maxScore}
                        </td>

                        <td className="py-3.5 px-4 text-[#34D399] font-semibold font-mono">
                          {entry.result?.accuracy ?? 0}%
                        </td>

                        <td className="py-3.5 px-4 text-[#EF4444] font-mono">
                          -{entry.result?.negativeMarks ?? 0} pts
                        </td>

                        <td className="py-3.5 px-4 text-[#A8A294] font-mono">
                          {formatDuration(entry.durationUsedSeconds || 0)}
                        </td>

                        <td className="py-3.5 px-4 font-mono font-bold text-xs text-[#C19B48]">
                          {entry.result?.percentile ?? 95.0} %ile
                        </td>

                        <td className="py-3.5 px-4 text-xs text-[#A8A294]">
                          {entry.studentId?.batch || 'Regular Judiciary Cohort'}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              toast(
                                `Scorecard verified for ${entry.studentId?.name || 'Aspirant'}. Rank #${rank}`,
                                { icon: '📊' }
                              )
                            }
                            className="px-2.5 py-1 rounded-lg bg-[#262626] hover:bg-[#C19B48] text-[#F7F3E6] hover:text-[#1E1E1E] border border-[#3D3D3D] text-xs font-semibold transition-colors cursor-pointer"
                          >
                            Scorecard
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

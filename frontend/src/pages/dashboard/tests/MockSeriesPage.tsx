import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Clock,
  ArrowRight,
  Loader2,
  Trophy,
  History,
  Radio,
  ChevronRight,
  Calendar,
} from 'lucide-react';
import { toast } from '../../../lib/toast';
import { fetchLiveTestCatalog, startLiveTestSession } from '../../../services/liveTest.service';
import { useTestSessionStore } from '../../../store/useTestSessionStore';
import { TestRunnerInterface } from '../../../components/tests/TestRunnerInterface';
import { TestAutopsyDebrief } from '../../../components/tests/TestAutopsyDebrief';
import { LiveTestLeaderboard } from '../../../components/tests/LiveTestLeaderboard';
import { LiveTestHistoryList } from '../../../components/tests/LiveTestHistoryList';
import type { LiveMockTestItem } from '../../../types/liveTest.types';
import type { AutopsyReviewData } from '../../../types/testEngine.types';
import { TestCardSkeleton } from '../../../components/ui/skeleton';
import { SegmentedTabs } from '../../../components/ui/tabs';

type ActiveTab = 'hub' | 'leaderboard' | 'history';

export const MockSeriesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('hub');
  const [liveTests, setLiveTests] = useState<LiveMockTestItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLaunchingId, setIsLaunchingId] = useState<string | null>(null);
  const [activeReviewData, setActiveReviewData] = useState<AutopsyReviewData | null>(null);
  const [lastTick, setLastTick] = useState<number>(Date.now());

  const initSession = useTestSessionStore((state) => state.initSession);
  const currentSession = useTestSessionStore((state) => state.session);
  const clearSession = useTestSessionStore((state) => state.clearSession);

  // Live timer tick every 10 seconds to update countdown badges
  useEffect(() => {
    const interval = setInterval(() => {
      setLastTick(Date.now());
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadCatalog = async () => {
    try {
      setIsLoading(true);
      const data = await fetchLiveTestCatalog();
      setLiveTests(data);
    } catch (err) {
      console.error('Failed to load live test catalog:', err);
      toast.error('Failed to load All-India test series catalog.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCatalog();
  }, []);

  const handleStartLiveTest = async (test: LiveMockTestItem) => {
    try {
      setIsLaunchingId(test.id);
      const res = await startLiveTestSession(test.id);

      if (res.session) {
        initSession({
          ...res.session,
          isLive: true,
        });
        setActiveReviewData(null);
        toast.success(
          res.isResumed
            ? `Resuming Live Exam: ${test.title}`
            : `Entering Live Examination Room for ${test.title}`,
          {
            description: `Duration: ${test.durationFormatted}. Negative penalty: ${test.negativeMarkFormatted}.`,
          }
        );
      }
    } catch (err: any) {
      console.error('Failed to start live test:', err);
      toast.error(err?.response?.data?.message || 'Failed to enter exam room. Please check window timings.');
    } finally {
      setIsLaunchingId(null);
    }
  };

  // Helper to format countdown
  const formatCountdown = (countdownMs: number, phase: string) => {
    if (countdownMs <= 0 || !lastTick) return phase === 'closed' ? 'Window Closed' : 'Live Now';
    const totalMinutes = Math.floor(countdownMs / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  // If a test is actively running, render the full-screen exam engine
  if (currentSession) {
    return (
      <TestRunnerInterface
        isLiveMode={Boolean(currentSession.isLive)}
        onComplete={(review) => {
          clearSession();
          setActiveReviewData(review);
          loadCatalog();
        }}
        onExit={() => {
          clearSession();
          loadCatalog();
        }}
      />
    );
  }

  // If viewing post-test autopsy
  if (activeReviewData) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
        <TestAutopsyDebrief
          reviewData={activeReviewData}
          onRetakeOrReset={() => {
            setActiveReviewData(null);
            loadCatalog();
          }}
        />
      </div>
    );
  }

  const filtered = liveTests;

  const liveCount = liveTests.filter((t) => t.phase === 'live').length;

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Navigation Mode Pill Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* 3 Main Tabs */}
        <SegmentedTabs<ActiveTab>
          value={activeTab}
          onChange={setActiveTab}
          items={[
            {
              id: 'hub',
              label: 'Live Exam Hub',
              shortLabel: 'Exam Hub',
              icon: <Radio className="w-3.5 h-3.5" />,
              badge: liveCount > 0 ? `${liveCount} Live` : undefined,
              badgeVariant: liveCount > 0 ? 'danger' : undefined,
            },
            {
              id: 'leaderboard',
              label: 'All-India Standings',
              shortLabel: 'Standings',
              icon: <Trophy className="w-3.5 h-3.5" />,
            },
            {
              id: 'history',
              label: 'My Exam History',
              shortLabel: 'History',
              icon: <History className="w-3.5 h-3.5" />,
            },
          ]}
        />
      </div>

      {/* Tab 2: Leaderboard View */}
      {activeTab === 'leaderboard' && <LiveTestLeaderboard />}

      {/* Tab 3: History View */}
      {activeTab === 'history' && (
        <LiveTestHistoryList onOpenAutopsy={(review) => setActiveReviewData(review)} />
      )}

      {/* Tab 1: Live Exam Hub */}
      {activeTab === 'hub' && (
        <div className="space-y-6">

          {/* Loading Skeletons */}
          {isLoading && <TestCardSkeleton count={6} />}

          {/* Tests Catalog */}
          {!isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((test) => {
                const isAttempted = test.userStatus === 'completed';
                const isLive = test.phase === 'live';
                const isScheduled = test.phase === 'scheduled';

                return (
                  <div
                    key={test.id}
                    className="p-5 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] flex flex-col justify-between space-y-4 shadow-xs hover:border-[#c19b48]/60 transition-all"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase bg-slate-100 dark:bg-[#061120] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#143564]">
                          {test.targetState}
                        </span>

                        {/* Status Pills */}
                        {isAttempted ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                            Attempted
                          </span>
                        ) : isLive ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-red-500/15 text-red-500 border border-red-500/30 animate-pulse flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            <span>Live Now</span>
                          </span>
                        ) : isScheduled ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-blue-500/15 text-blue-500 border border-blue-500/30 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>Scheduled</span>
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
                            Closed
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-serif font-bold text-slate-900 dark:text-white line-clamp-1">
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
                          <span>{test.durationFormatted}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-[#143564]">
                      {isAttempted ? (
                        <div className="flex items-center justify-between text-xs">
                          <div>
                            <span className="text-slate-400 block text-[10px]">Score / Rank</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                              {test.officialScore} pts {test.officialRank ? `• AIR #${test.officialRank}` : ''}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleStartLiveTest(test)}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#061120] hover:bg-[#c19b48] hover:text-[#061120] text-slate-800 dark:text-slate-200 font-semibold text-xs transition-colors cursor-pointer"
                          >
                            Re-Attempt
                          </button>
                        </div>
                      ) : isScheduled ? (
                        <button
                          type="button"
                          onClick={() => {
                            toast.info(`Exam opens on ${new Date(test.windowStart).toLocaleString('en-IN')}`, {
                              description: 'You will receive an academy broadcast reminder when this exam goes live.',
                            });
                          }}
                          className="w-full py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-[#061120] text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200 dark:border-[#143564]"
                        >
                          <span>Starts in {formatCountdown(test.countdownMs, test.phase)}</span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleStartLiveTest(test)}
                          disabled={isLaunchingId === test.id}
                          className="w-full py-2.5 px-3 rounded-xl bg-[#c19b48] hover:bg-[#d8b862] text-[#061120] font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                        >
                          {isLaunchingId === test.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <span>
                                {isLive ? 'Enter Live Exam Room' : 'Start Mock Practice'}
                              </span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

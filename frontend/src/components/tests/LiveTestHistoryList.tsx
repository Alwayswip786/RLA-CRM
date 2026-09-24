import React, { useState, useEffect } from 'react';
import {
  Clock,
  ArrowRight,
  Loader2,
  FileSearch,
} from 'lucide-react';
import { toast } from '../../lib/toast';
import { fetchLiveTestHistory, fetchLiveTestAutopsy } from '../../services/liveTest.service';
import type { LiveTestHistoryItem } from '../../types/liveTest.types';
import type { AutopsyReviewData } from '../../types/testEngine.types';
import { TestHistoryCardSkeleton } from '../ui/skeleton';

interface LiveTestHistoryListProps {
  onOpenAutopsy: (data: AutopsyReviewData) => void;
}

export const LiveTestHistoryList: React.FC<LiveTestHistoryListProps> = ({ onOpenAutopsy }) => {
  const [history, setHistory] = useState<LiveTestHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingAutopsyId, setLoadingAutopsyId] = useState<string | null>(null);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        setIsLoading(true);
        const data = await fetchLiveTestHistory();
        setHistory(data);
      } catch (err) {
        console.error('Failed to load test history:', err);
        toast.error('Failed to load exam history records.');
      } finally {
        setIsLoading(false);
      }
    };
    loadHistory();
  }, []);

  const handleOpenAutopsy = async (attemptId: string) => {
    try {
      setLoadingAutopsyId(attemptId);
      const autopsyData = await fetchLiveTestAutopsy(attemptId);
      onOpenAutopsy(autopsyData);
    } catch (err) {
      console.error('Failed to load autopsy:', err);
      toast.error('Failed to open question autopsy.');
    } finally {
      setLoadingAutopsyId(null);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">

      {/* Loading Skeletons */}
      {isLoading && <TestHistoryCardSkeleton count={3} />}

      {/* Empty State */}
      {!isLoading && history.length === 0 && (
        <div className="py-16 text-center rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] space-y-3">
          <FileSearch className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            No live test attempts recorded yet
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Once you complete a live mock test from the Exam Hub, your scorecard and full question solutions will appear here.
          </p>
        </div>
      )}

      {/* History Grid */}
      {!isLoading && history.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {history.map((item) => (
            <div
              key={item.attemptId}
              className="p-5 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] flex flex-col justify-between space-y-4 shadow-xs hover:border-[#c19b48]/60 transition-all"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase bg-slate-100 dark:bg-[#061120] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#143564]">
                    {item.testCode}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(item.submittedAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                <h3 className="text-base font-serif font-bold text-slate-900 dark:text-white line-clamp-1">
                  {item.title}
                </h3>

                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                  {item.targetExam}
                </p>

                <div className="grid grid-cols-3 gap-2 pt-2 text-center">
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-[#061120]/70 border border-slate-100 dark:border-[#143564]/50">
                    <span className="text-[10px] text-slate-400 block">Score</span>
                    <span className="font-bold text-slate-900 dark:text-white font-mono text-xs">
                      {item.score} / {item.maxScore}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-[#061120]/70 border border-slate-100 dark:border-[#143564]/50">
                    <span className="text-[10px] text-slate-400 block">Accuracy</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono text-xs">
                      {item.accuracy}%
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-[#061120]/70 border border-slate-100 dark:border-[#143564]/50">
                    <span className="text-[10px] text-slate-400 block">All-India Rank</span>
                    <span className="font-bold text-[#c19b48] dark:text-[#e8cf8d] font-mono text-xs">
                      {item.rank ? `AIR #${item.rank}` : 'Practice'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-[#143564] flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{formatDuration(item.durationUsedSeconds)}</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenAutopsy(item.attemptId)}
                  disabled={loadingAutopsyId === item.attemptId}
                  className="px-3 py-1.5 rounded-xl bg-[#c19b48] hover:bg-[#d8b862] text-[#061120] font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {loadingAutopsyId === item.attemptId ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <span>Review Solutions</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

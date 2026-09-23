import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Play,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { toast } from '../../../lib/toast';
import {
  fetchBareActCatalogue,
  startTestSession,
  fetchActiveSession,
  resetBareActHistory,
} from '../../../services/testEngine.service';
import { useTestSessionStore } from '../../../store/useTestSessionStore';
import { TestRunnerInterface } from '../../../components/tests/TestRunnerInterface';
import { TestAutopsyDebrief } from '../../../components/tests/TestAutopsyDebrief';
import type { BareActCategory, AutopsyReviewData } from '../../../types/testEngine.types';
import { PracticeQuizCardSkeleton } from '../../../components/ui/skeleton';

export const PracticeQuizzesPage: React.FC = () => {
  const [categories, setCategories] = useState<BareActCategory[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeResumable, setActiveResumable] = useState<any | null>(null);
  const [activeReviewData, setActiveReviewData] = useState<AutopsyReviewData | null>(null);
  const [isLaunching, setIsLaunching] = useState<boolean>(false);

  const initSession = useTestSessionStore((state) => state.initSession);
  const currentSession = useTestSessionStore((state) => state.session);
  const clearSession = useTestSessionStore((state) => state.clearSession);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [cats, active] = await Promise.all([
        fetchBareActCatalogue(),
        fetchActiveSession(),
      ]);
      setCategories(cats);
      setActiveResumable(active);
    } catch (err) {
      console.error('Failed to load bare act catalogue:', err);
      toast.error('Failed to load Bare Act quiz catalogue.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStartSprint = async (actName?: string) => {
    try {
      setIsLaunching(true);
      const res = await startTestSession({
        actName,
        count: 20,
      });

      if (res.session) {
        initSession(res.session);
        setActiveReviewData(null);
        toast.success(
          res.isResumed
            ? 'Resumed your active Bare Act drill session!'
            : `Starting 20-Question Daily Sprint${actName ? ` on ${actName}` : ''}`,
          {
            description: '15 Minutes timer active. Review and autopsy available on submit.',
          }
        );
      }
    } catch (err) {
      console.error('Failed to launch practice sprint:', err);
      toast.error('Failed to launch sprint. Please try again.');
    } finally {
      setIsLaunching(false);
    }
  };

  const handleResetAct = async (actId: string, actName: string) => {
    try {
      await resetBareActHistory(actId);
      toast.success(`Reset attempt history for ${actName}`);
      loadData();
    } catch (err) {
      console.error('Reset failed:', err);
      toast.error('Failed to reset history.');
    }
  };

  // If a test is actively being taken, render the full Test Runner
  if (currentSession) {
    return (
      <TestRunnerInterface
        onComplete={(review) => {
          clearSession();
          setActiveReviewData(review);
          loadData();
        }}
        onExit={() => {
          clearSession();
          loadData();
        }}
      />
    );
  }

  // If viewing post-test autopsy debrief
  if (activeReviewData) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
        <TestAutopsyDebrief
          reviewData={activeReviewData}
          onRetakeOrReset={() => {
            setActiveReviewData(null);
            handleStartSprint();
          }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Active Session Resumption Pill */}
      {activeResumable && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2 text-xs text-amber-900 dark:text-amber-300">
            <Sparkles className="w-4 h-4 text-[#c19b48] shrink-0" />
            <span>
              <strong>Active Exam Session Found:</strong> {activeResumable.title} (
              {activeResumable.questions?.length} Questions)
            </span>
          </div>

          <button
            type="button"
            onClick={() => handleStartSprint()}
            className="px-4 py-2 rounded-xl bg-[#c19b48] hover:bg-[#d8b862] text-[#061120] font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
          >
            <span>Resume Test Session</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 text-xs font-semibold mb-2">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Chapter & Section Drill Engine</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 dark:text-white">
            Bare Act Practice Quizzes
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Master tricky Bare Act section numbers, exceptions, and illustrations with targeted daily sprints.
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleStartSprint()}
          disabled={isLaunching}
          className="px-4 py-2.5 rounded-xl bg-[#c19b48] hover:bg-[#d8b862] text-[#061120] font-bold text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-xs self-start sm:self-auto disabled:opacity-50"
        >
          {isLaunching ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-[#061120]" />
          )}
          <span>Quick 20-Question Mixed Sprint</span>
        </button>
      </div>

      {/* Loading Skeletons */}
      {isLoading && <PracticeQuizCardSkeleton count={6} />}

      {/* Grid of Dynamic Bare Act Quizzes */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {categories.map((item) => {
            const progressPercent =
              item.totalQuestions > 0
                ? Math.min(100, Math.round((item.completedQuestions / item.totalQuestions) * 100))
                : 0;

            return (
              <div
                key={item.id}
                className="p-5 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] space-y-4 shadow-xs hover:border-[#c19b48]/60 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#061120] text-slate-700 dark:text-slate-300 font-semibold border border-slate-200 dark:border-[#143564]">
                      {item.totalQuestions} Curated MCQs
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                      {item.accuracy} Accuracy
                    </span>
                  </div>

                  <h3 className="text-base font-serif font-bold text-slate-900 dark:text-white">
                    {item.bareAct}
                  </h3>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                      <span>Practiced: {item.completedQuestions} / {item.totalQuestions}</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-200">{progressPercent}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-[#061120] h-2 rounded-full overflow-hidden border border-slate-200 dark:border-[#143564]">
                      <div
                        className="h-full bg-gradient-to-r from-[#c19b48] to-[#e8cf8d] rounded-full transition-all"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-[#143564] flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => handleResetAct(item.id, item.bareAct)}
                    className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 inline-flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStartSprint(item.bareAct)}
                    disabled={isLaunching}
                    className="px-3.5 py-1.5 rounded-xl bg-[#0a1c36] dark:bg-[#143564] hover:bg-[#143564] text-white font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <span>Practice Sections</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

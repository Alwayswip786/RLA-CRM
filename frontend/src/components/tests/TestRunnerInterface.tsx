import React, { useState, useEffect, useRef } from 'react';
import {
  Clock,
  CheckSquare,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  RotateCcw,
  X,
  Grid3X3,
} from 'lucide-react';
import { toast } from '../../lib/toast';
import { apiClient } from '../../lib/apiClient';
import { useTestSessionStore } from '../../store/useTestSessionStore';
import { QuestionPalette } from './QuestionPalette';
import { submitTestSession } from '../../services/testEngine.service';
import {
  submitLiveTestSession,
  heartbeatLiveSession,
  recordAntiCheatEvent,
} from '../../services/liveTest.service';
import type { AutopsyReviewData } from '../../types/testEngine.types';

interface TestRunnerInterfaceProps {
  onComplete: (reviewData: AutopsyReviewData) => void;
  onExit: () => void;
  isLiveMode?: boolean;
}

export const TestRunnerInterface: React.FC<TestRunnerInterfaceProps> = ({
  onComplete,
  onExit,
  isLiveMode = false,
}) => {
  const session = useTestSessionStore((state) => state.session);
  const currentIndex = useTestSessionStore((state) => state.currentIndex);
  const answers = useTestSessionStore((state) => state.answers);
  const markedForReview = useTestSessionStore((state) => state.markedForReview);
  const timeRemainingSeconds = useTestSessionStore((state) => state.timeRemainingSeconds);
  const isSubmitting = useTestSessionStore((state) => state.isSubmitting);
  const selectOption = useTestSessionStore((state) => state.selectOption);
  const toggleMarkForReview = useTestSessionStore((state) => state.toggleMarkForReview);
  const clearResponse = useTestSessionStore((state) => state.clearResponse);
  const jumpToQuestion = useTestSessionStore((state) => state.jumpToQuestion);
  const tickTimer = useTestSessionStore((state) => state.tickTimer);
  const setIsSubmitting = useTestSessionStore((state) => state.setIsSubmitting);

  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState<boolean>(false);
  const [isPaletteDrawerOpen, setIsPaletteDrawerOpen] = useState<boolean>(false);
  const [starredQuestions, setStarredQuestions] = useState<Record<string, boolean>>({});

  const effectiveIsLive = Boolean(isLiveMode || session?.isLive);

  // Timer interval
  useEffect(() => {
    const timerId = setInterval(() => {
      tickTimer();
    }, 1000);

    return () => clearInterval(timerId);
  }, [tickTimer]);

  // Periodic heartbeat sync for live tests (every 30 seconds)
  useEffect(() => {
    if (!effectiveIsLive || !session) return;

    const heartbeatInterval = setInterval(async () => {
      try {
        const ping = await heartbeatLiveSession(session.id);
        if (ping.isExpired) {
          toast.error('Official test duration has expired. Submitting...');
          handleConfirmSubmit();
        }
      } catch (err) {
        console.warn('Heartbeat ping failed:', err);
      }
    }, 30000);

    return () => clearInterval(heartbeatInterval);
  }, [effectiveIsLive, session]);

  // Anti-cheat focus tracking for live competitive tests
  useEffect(() => {
    if (!effectiveIsLive || !session) return;

    const handleFocusLoss = () => {
      toast.warning('⚠️ Tab Switch Detected!', {
        description: 'Focus loss events are logged on your official All-India exam audit trail.',
      });
      recordAntiCheatEvent(session.id, 'window_blur', { timestamp: Date.now() }).catch(() => {});
    };

    window.addEventListener('blur', handleFocusLoss);
    return () => {
      window.removeEventListener('blur', handleFocusLoss);
    };
  }, [effectiveIsLive, session]);

  // Handle auto-submit when timer expires
  const autoSubmittedRef = useRef(false);
  useEffect(() => {
    if (timeRemainingSeconds <= 0 && session && !autoSubmittedRef.current) {
      autoSubmittedRef.current = true;
      toast.error('Time is up! Auto-submitting your test...');
      handleConfirmSubmit();
    }
  }, [timeRemainingSeconds, session]);

  if (!session || !session.questions || session.questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
          <h3 className="text-lg font-bold">No active session loaded</h3>
          <button
            onClick={onExit}
            className="px-4 py-2 rounded-xl bg-[#c19b48] text-[#061120] font-semibold text-xs"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentQItem = session.questions[currentIndex];
  const questionData = currentQItem?.question;
  const currentAnswer = answers[currentIndex];
  const isCurrentMarked = Boolean(markedForReview[currentIndex]);
  const totalQuestions = session.questions.length;

  // Format timer
  const hours = Math.floor(timeRemainingSeconds / 3600);
  const minutes = Math.floor((timeRemainingSeconds % 3600) / 60);
  const seconds = timeRemainingSeconds % 60;
  const timerFormatted = `${hours > 0 ? `${hours.toString().padStart(2, '0')}:` : ''}${minutes
    .toString()
    .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      jumpToQuestion(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      jumpToQuestion(currentIndex - 1);
    }
  };

  const handleConfirmSubmit = async () => {
    try {
      setIsSubmitting(true);
      const res = effectiveIsLive
        ? await submitLiveTestSession(session.id)
        : await submitTestSession(session.id);

      setIsSubmitModalOpen(false);
      toast.success(
        effectiveIsLive
          ? 'Live Examination submitted! Merit rank calculated.'
          : 'Test successfully submitted and evaluated!'
      );

      const reviewPayload = res?.review || {
        sessionId: session.id,
        title: session.title,
        testType: session.testType,
        targetExam: session.targetExam,
        submittedAt: new Date().toISOString(),
        resultSummary: res?.resultSummary,
        questions: [],
      };

      if (!reviewPayload.resultSummary && res?.resultSummary) {
        reviewPayload.resultSummary = res.resultSummary;
      }

      onComplete(reviewPayload);
    } catch (err) {
      console.error('Submission failed:', err);
      toast.error('Failed to submit test. Please check your network and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStar = async () => {
    if (!questionData) return;
    const isStarred = Boolean(starredQuestions[questionData._id]);
    setStarredQuestions({ ...starredQuestions, [questionData._id]: !isStarred });

    try {
      await apiClient.post('/bookmarks/toggle', {
        itemType: 'MCQ',
        itemId: questionData.code || questionData._id,
        title: questionData.questionText,
        source: `${questionData.actName} - ${questionData.sectionOrArticle || 'Section Question'}`,
        subject: questionData.subject,
        metadata: {
          options: questionData.options.map((opt: string, i: number) => ({
            key: ['A', 'B', 'C', 'D'][i],
            text: opt,
          })),
          correctOption: 'A', // placeholder before evaluation
          explanation: 'Question saved to vault for personal review.',
        },
      });
      toast.success(isStarred ? 'Question unstarred' : '⭐ Question bookmarked to personal vault!');
    } catch (err) {
      console.error('Failed to star question:', err);
      toast.error('Failed to update bookmark.');
    }
  };

  // Stats for submit modal
  const attemptedCount = Object.values(answers).filter((v) => v !== null && v !== undefined).length;
  const markedCount = Object.values(markedForReview).filter(Boolean).length;
  const unattemptedCount = totalQuestions - attemptedCount;

  return (
    <div className="fixed inset-0 z-50 bg-slate-100 dark:bg-[#061120] flex flex-col overflow-hidden select-none">
      {/* Top Exam Header */}
      <header className="shrink-0 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 px-3 py-2 sm:px-5 lg:flex lg:h-16 lg:gap-4 bg-white dark:bg-[#0a1c36] border-b border-slate-200 dark:border-[#143564] shadow-xs">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="text-[9px] sm:text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-[#c19b48] dark:text-[#e8cf8d] font-bold uppercase leading-tight">
              <span className="sm:hidden">{effectiveIsLive ? 'Live exam' : 'Mock test'}</span>
              <span className="hidden sm:inline">{effectiveIsLive ? 'All-India Live Examination' : session.testType === 'mock_series' ? 'All-India Prelims Mock' : 'Bare Act Daily Sprint'}</span>
            </span>
            {effectiveIsLive && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                <span>PROCTORED LIVE</span>
              </span>
            )}
          </div>
          <h2 className="text-sm sm:text-base font-serif font-bold text-slate-900 dark:text-white leading-tight break-words">
            {session.title}
          </h2>
        </div>

        {/* Exam timer */}
        <div
          className={`justify-self-end flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-2 sm:py-1.5 rounded-xl font-mono text-xs sm:text-base font-bold border transition-colors ${
            timeRemainingSeconds < 300
              ? 'bg-red-500/15 text-red-500 border-red-500/30 animate-pulse'
              : 'bg-slate-100 dark:bg-[#061120] text-slate-800 dark:text-slate-200 border-slate-200 dark:border-[#143564]'
          }`}
        >
          <Clock className="w-4 h-4 text-[#c19b48]" />
          <span>{timerFormatted}</span>
        </div>

        <div className="col-span-2 grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-2 lg:ml-auto lg:w-auto lg:grid-cols-1 lg:col-auto">
          <button
            type="button"
            onClick={() => setIsPaletteDrawerOpen(true)}
            className="lg:hidden min-w-0 w-full min-h-10 inline-flex items-center justify-between gap-2 px-2.5 rounded-xl bg-slate-100 dark:bg-[#061120] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#143564] text-[11px] font-semibold whitespace-nowrap"
            aria-label={`Open question palette, question ${currentIndex + 1} of ${totalQuestions}`}
          >
            <span className="min-w-0 inline-flex items-center gap-1.5">
              <Grid3X3 className="w-4 h-4 shrink-0 text-[#c19b48]" />
              <span className="shrink-0 whitespace-nowrap">Question Palette</span>
            </span>
            <span className="hidden min-[360px]:inline-flex shrink-0 rounded-md bg-slate-200/70 dark:bg-[#143564] px-1 py-0.5 font-mono text-[9px] text-slate-600 dark:text-slate-300">{currentIndex + 1}/{totalQuestions}</span>
          </button>
          <button
            type="button"
            onClick={() => setIsSubmitModalOpen(true)}
            className="min-h-10 px-2.5 sm:px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-xs cursor-pointer whitespace-nowrap"
          >
            Submit Test
          </button>
        </div>
      </header>

      {/* Main Examination Layout */}
      <div className="min-h-0 flex-1 flex overflow-hidden relative">
        {/* Subtle Watermark for live exam proctoring & leak prevention */}
        {effectiveIsLive && (
          <div className="absolute inset-0 pointer-events-none opacity-[0.025] dark:opacity-[0.035] overflow-hidden flex flex-wrap gap-20 p-8 text-xs font-mono font-bold select-none rotate-[-12deg] z-0">
            {Array.from({ length: 30 }).map((_, i) => (
              <span key={i}>RLA ALL-INDIA LIVE EXAM • ADV. RAJINDER SIR</span>
            ))}
          </div>
        )}

        {/* Left: Question Solving Workspace */}
        <main className="min-w-0 min-h-0 flex-1 flex flex-col overflow-hidden p-3 sm:p-6 lg:p-8 relative z-10">
          <div className="min-w-0 min-h-0 flex-1 max-w-3xl mx-auto w-full overflow-y-auto overscroll-contain pb-4 space-y-5 sm:space-y-6">
            {/* Question Info Bar */}
            <div className="border-b border-slate-200 dark:border-[#143564] pb-3 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-mono font-bold px-2.5 py-1.5 rounded-lg bg-[#0a1c36] text-white dark:bg-[#143564]">
                  Question {currentIndex + 1} of {totalQuestions}
                </span>
                <button
                  type="button"
                  onClick={handleToggleStar}
                  className={`w-9 h-9 shrink-0 rounded-lg text-xs font-medium border flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    questionData && starredQuestions[questionData._id]
                      ? 'bg-[#c19b48]/20 border-[#c19b48] text-[#c19b48]'
                      : 'border-slate-200 dark:border-[#143564] text-slate-500 hover:text-[#c19b48]'
                  }`}
                  title="Bookmark question to Starred Vault"
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Star Question</span>
                </button>
              </div>
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-semibold text-[#c19b48] dark:text-[#e8cf8d] leading-snug break-words">
                  {questionData?.actName}
                </p>
                {questionData?.sectionOrArticle && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug break-words">
                    {questionData.sectionOrArticle}
                  </p>
                )}
              </div>
            </div>

            {/* Question Text */}
            <div className="text-base sm:text-lg font-medium text-slate-900 dark:text-white leading-relaxed break-words">
              {questionData?.questionText}
            </div>

            {/* 4 Interactive Option Cards */}
            <div className="space-y-3 pt-1">
              {questionData?.options.map((optionText, optIndex) => {
                const isSelected = currentAnswer === optIndex;
                const optionLabel = ['A', 'B', 'C', 'D'][optIndex];

                return (
                  <button
                    key={optIndex}
                    type="button"
                    onClick={() => selectOption(currentIndex, optIndex)}
                    className={`w-full min-w-0 p-3.5 sm:p-4 rounded-2xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-[#c19b48]/15 border-[#c19b48] text-slate-900 dark:text-white font-semibold shadow-xs ring-2 ring-[#c19b48]/40'
                        : 'bg-white dark:bg-[#0a1c36] border-slate-200 dark:border-[#143564] text-slate-700 dark:text-slate-300 hover:border-[#c19b48]/50'
                    }`}
                  >
                    <div className="min-w-0 flex-1 flex items-start gap-3">
                      <span
                        className={`w-8 h-8 shrink-0 rounded-xl font-bold font-mono text-xs flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-[#c19b48] text-[#061120]'
                            : 'bg-slate-100 dark:bg-[#143564] text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {optionLabel}
                      </span>
                      <span className="min-w-0 flex-1 text-xs sm:text-sm leading-relaxed break-words">{optionText}</span>
                    </div>

                    <div className="shrink-0 pt-1">
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected
                            ? 'border-[#c19b48] bg-[#c19b48]'
                            : 'border-slate-300 dark:border-slate-600'
                        }`}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-[#061120]" />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom Controls Bar */}
          <div className="max-w-3xl mx-auto w-full shrink-0 pt-3 sm:pt-4 mt-2 sm:mt-4 border-t border-slate-200 dark:border-[#143564] bg-slate-100 dark:bg-[#061120] grid grid-cols-2 lg:grid-cols-4 gap-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] sm:pb-0">
              <button
                type="button"
                onClick={() => clearResponse(currentIndex)}
                disabled={currentAnswer === null || currentAnswer === undefined}
                className="w-full min-w-0 min-h-10 justify-center px-2 py-2 rounded-xl text-xs font-semibold bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 disabled:opacity-40 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>

              <button
                type="button"
                onClick={() => toggleMarkForReview(currentIndex)}
                aria-label={isCurrentMarked ? 'Remove review mark' : 'Mark for review'}
                className={`w-full min-w-0 min-h-10 justify-center px-2 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  isCurrentMarked
                    ? 'bg-purple-600 border-purple-600 text-white'
                    : 'bg-purple-50 dark:bg-purple-950/40 border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span className="lg:hidden">{isCurrentMarked ? 'Marked' : 'Review'}</span>
                <span className="hidden lg:inline">{isCurrentMarked ? 'Marked' : 'Mark for Review'}</span>
              </button>
              <button
                type="button"
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                className="w-full min-w-0 min-h-10 justify-center px-2 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#143564] disabled:opacity-40 transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <button
                type="button"
                onClick={handleNext}
                disabled={currentIndex === totalQuestions - 1}
                className="w-full min-w-0 min-h-10 justify-center px-2 py-2 rounded-xl text-xs font-semibold bg-[#c19b48] hover:bg-[#d8b862] text-[#061120] disabled:opacity-40 transition-colors flex items-center gap-1 cursor-pointer shadow-xs whitespace-nowrap"
              >
                <span>Save & Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
          </div>
        </main>

        {/* Right Desktop Sidebar: Question Palette */}
        <aside className="hidden lg:block w-80 p-5 bg-white dark:bg-[#0a1c36] border-l border-slate-200 dark:border-[#143564] overflow-y-auto">
          <QuestionPalette totalQuestions={totalQuestions} />
        </aside>
      </div>

      {/* Mobile Drawer: Question Palette */}
      {isPaletteDrawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-150">
          <div className="w-[min(92vw,24rem)] h-full min-h-0 bg-white dark:bg-[#0a1c36] p-4 flex flex-col overflow-hidden pb-[calc(env(safe-area-inset-bottom)+1rem)]">
            <div className="shrink-0 flex items-center justify-between gap-3 border-b border-slate-200 dark:border-[#143564] pb-3">
              <div className="min-w-0">
                <span className="block font-serif font-bold text-sm text-slate-900 dark:text-white">Question Palette</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Question {currentIndex + 1} of {totalQuestions}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsPaletteDrawerOpen(false)}
                className="w-9 h-9 shrink-0 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 flex items-center justify-center"
                aria-label="Close question palette"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto py-3">
              <QuestionPalette
                totalQuestions={totalQuestions}
                onSelectQuestion={() => setIsPaletteDrawerOpen(false)}
              />
            </div>

            <button
              type="button"
              onClick={() => {
                setIsPaletteDrawerOpen(false);
                setIsSubmitModalOpen(true);
              }}
              className="shrink-0 w-full min-h-11 mt-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors"
            >
              Submit Test
            </button>
          </div>
        </div>
      )}

      {/* Submit Confirmation Dialog */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center overflow-y-auto px-3 py-[max(0.75rem,env(safe-area-inset-top))] sm:p-4">
          <div className="my-auto max-h-[calc(100dvh-1.5rem)] w-full max-w-md overflow-y-auto bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] rounded-3xl p-4 sm:p-6 space-y-4 sm:space-y-5 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/10 text-[#c19b48] flex items-center justify-center">
                <CheckSquare className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-serif font-bold text-slate-900 dark:text-white">
                Are you ready to submit your test?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                You will not be able to modify your answers once submitted. Here is your current progress:
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] text-center text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block">Attempted</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono text-base">
                  {attemptedCount}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Review</span>
                <span className="font-bold text-purple-600 dark:text-purple-400 font-mono text-base">
                  {markedCount}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Unattempted</span>
                <span className="font-bold text-red-500 font-mono text-base">
                  {unattemptedCount}
                </span>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 pt-1 sm:pt-2">
              <button
                type="button"
                onClick={() => setIsSubmitModalOpen(false)}
                disabled={isSubmitting}
                className="w-full min-h-11 sm:flex-1 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-[#143564] text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-[#143564] transition-colors cursor-pointer whitespace-nowrap"
              >
                Return to Exam
              </button>

              <button
                type="button"
                onClick={handleConfirmSubmit}
                disabled={isSubmitting}
                className="w-full min-h-11 sm:flex-1 px-3 py-2.5 rounded-xl bg-[#c19b48] hover:bg-[#d8b862] text-[#061120] font-bold text-xs transition-colors cursor-pointer shadow-xs disabled:opacity-50 whitespace-nowrap"
              >
                {isSubmitting ? 'Evaluating...' : 'Confirm Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

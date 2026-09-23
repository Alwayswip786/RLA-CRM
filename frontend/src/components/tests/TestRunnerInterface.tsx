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
  Menu,
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
      <header className="h-16 px-4 sm:px-6 bg-white dark:bg-[#0a1c36] border-b border-slate-200 dark:border-[#143564] flex items-center justify-between gap-4 shrink-0 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsPaletteDrawerOpen(true)}
            className="lg:hidden p-2 rounded-xl bg-slate-100 dark:bg-[#061120] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#143564]"
            title="Open Question Palette"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-[#c19b48] dark:text-[#e8cf8d] font-bold uppercase">
                {effectiveIsLive ? 'All-India Live Examination' : session.testType === 'mock_series' ? 'All-India Prelims Mock' : 'Bare Act Daily Sprint'}
              </span>
              {effectiveIsLive && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  <span>PROCTORED LIVE</span>
                </span>
              )}
            </div>
            <h2 className="text-sm sm:text-base font-serif font-bold text-slate-900 dark:text-white line-clamp-1">
              {session.title}
            </h2>
          </div>
        </div>

        {/* Center: Live Timer */}
        <div
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-mono text-sm sm:text-base font-bold border transition-colors ${
            timeRemainingSeconds < 300
              ? 'bg-red-500/15 text-red-500 border-red-500/30 animate-pulse'
              : 'bg-slate-100 dark:bg-[#061120] text-slate-800 dark:text-slate-200 border-slate-200 dark:border-[#143564]'
          }`}
        >
          <Clock className="w-4 h-4 text-[#c19b48]" />
          <span>{timerFormatted}</span>
        </div>

        {/* Right: Submit Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsSubmitModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            Submit Test
          </button>
        </div>
      </header>

      {/* Main Examination Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Subtle Watermark for live exam proctoring & leak prevention */}
        {effectiveIsLive && (
          <div className="absolute inset-0 pointer-events-none opacity-[0.025] dark:opacity-[0.035] overflow-hidden flex flex-wrap gap-20 p-8 text-xs font-mono font-bold select-none rotate-[-12deg] z-0">
            {Array.from({ length: 30 }).map((_, i) => (
              <span key={i}>RLA ALL-INDIA LIVE EXAM • ADV. RAJINDER SIR</span>
            ))}
          </div>
        )}

        {/* Left: Question Solving Workspace */}
        <main className="flex-1 flex flex-col justify-between overflow-y-auto p-4 sm:p-6 lg:p-8 relative z-10">
          <div className="max-w-3xl mx-auto w-full space-y-6">
            {/* Question Info Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-[#143564] pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-[#0a1c36] text-white dark:bg-[#143564]">
                  Question {currentIndex + 1} of {totalQuestions}
                </span>
                <span className="text-xs font-semibold text-[#c19b48] dark:text-[#e8cf8d]">
                  {questionData?.actName}
                </span>
                {questionData?.sectionOrArticle && (
                  <span className="text-xs text-slate-400">
                    • {questionData.sectionOrArticle}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleStar}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors cursor-pointer ${
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
            </div>

            {/* Question Text */}
            <div className="text-base sm:text-lg font-medium text-slate-900 dark:text-white leading-relaxed">
              {questionData?.questionText}
            </div>

            {/* 4 Interactive Option Cards */}
            <div className="space-y-3 pt-2">
              {questionData?.options.map((optionText, optIndex) => {
                const isSelected = currentAnswer === optIndex;
                const optionLabel = ['A', 'B', 'C', 'D'][optIndex];

                return (
                  <button
                    key={optIndex}
                    type="button"
                    onClick={() => selectOption(currentIndex, optIndex)}
                    className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-[#c19b48]/15 border-[#c19b48] text-slate-900 dark:text-white font-semibold shadow-xs ring-2 ring-[#c19b48]/40'
                        : 'bg-white dark:bg-[#0a1c36] border-slate-200 dark:border-[#143564] text-slate-700 dark:text-slate-300 hover:border-[#c19b48]/50'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <span
                        className={`w-7 h-7 rounded-xl font-bold font-mono text-xs flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-[#c19b48] text-[#061120]'
                            : 'bg-slate-100 dark:bg-[#143564] text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {optionLabel}
                      </span>
                      <span className="text-xs sm:text-sm">{optionText}</span>
                    </div>

                    <div className="shrink-0 pl-2">
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
          <div className="max-w-3xl mx-auto w-full pt-4 sm:pt-6 mt-4 sm:mt-6 border-t border-slate-200 dark:border-[#143564] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => clearResponse(currentIndex)}
                disabled={currentAnswer === null || currentAnswer === undefined}
                className="flex-1 sm:flex-initial justify-center px-3 py-2.5 sm:py-2 rounded-xl text-xs font-semibold bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 disabled:opacity-40 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>

              <button
                type="button"
                onClick={() => toggleMarkForReview(currentIndex)}
                className={`flex-1 sm:flex-initial justify-center px-3 py-2.5 sm:py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer flex items-center gap-1.5 ${
                  isCurrentMarked
                    ? 'bg-purple-600 border-purple-600 text-white'
                    : 'bg-purple-50 dark:bg-purple-950/40 border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span className="truncate">{isCurrentMarked ? 'Marked' : 'Mark for Review'}</span>
              </button>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                className="flex-1 sm:flex-initial justify-center px-3.5 py-2.5 sm:py-2 rounded-xl text-xs font-semibold bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#143564] disabled:opacity-40 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <button
                type="button"
                onClick={handleNext}
                disabled={currentIndex === totalQuestions - 1}
                className="flex-1 sm:flex-initial justify-center px-4 py-2.5 sm:py-2 rounded-xl text-xs font-semibold bg-[#c19b48] hover:bg-[#d8b862] text-[#061120] disabled:opacity-40 transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
              >
                <span>Save & Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
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
          <div className="w-[82vw] max-w-76 h-full bg-white dark:bg-[#0a1c36] p-5 flex flex-col justify-between overflow-y-auto space-y-4 pb-safe">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#143564] pb-3">
              <span className="font-serif font-bold text-sm text-slate-900 dark:text-white">
                Question Palette
              </span>
              <button
                type="button"
                onClick={() => setIsPaletteDrawerOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <QuestionPalette
              totalQuestions={totalQuestions}
              onSelectQuestion={() => setIsPaletteDrawerOpen(false)}
            />

            <button
              type="button"
              onClick={() => {
                setIsPaletteDrawerOpen(false);
                setIsSubmitModalOpen(true);
              }}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors"
            >
              Submit Test
            </button>
          </div>
        </div>
      )}

      {/* Submit Confirmation Dialog */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] rounded-3xl p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-150">
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

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsSubmitModalOpen(false)}
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-[#143564] text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-[#143564] transition-colors cursor-pointer"
              >
                Return to Exam
              </button>

              <button
                type="button"
                onClick={handleConfirmSubmit}
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-[#c19b48] hover:bg-[#d8b862] text-[#061120] font-bold text-xs transition-colors cursor-pointer shadow-xs disabled:opacity-50"
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

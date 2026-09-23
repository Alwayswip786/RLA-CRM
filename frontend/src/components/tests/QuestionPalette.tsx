import React from 'react';
import { useTestSessionStore } from '../../store/useTestSessionStore';
import type { QuestionPaletteStatus } from '../../types/testEngine.types';

interface QuestionPaletteProps {
  totalQuestions: number;
  onSelectQuestion?: (index: number) => void;
}

export const QuestionPalette: React.FC<QuestionPaletteProps> = ({
  totalQuestions,
  onSelectQuestion,
}) => {
  const currentIndex = useTestSessionStore((state) => state.currentIndex);
  const answers = useTestSessionStore((state) => state.answers);
  const markedForReview = useTestSessionStore((state) => state.markedForReview);
  const visited = useTestSessionStore((state) => state.visited);
  const jumpToQuestion = useTestSessionStore((state) => state.jumpToQuestion);

  const getStatus = (idx: number): QuestionPaletteStatus => {
    const hasAnswer = answers[idx] !== null && answers[idx] !== undefined;
    const isMarked = Boolean(markedForReview[idx]);
    const isVis = Boolean(visited[idx]);

    if (hasAnswer && isMarked) return 'answered_and_marked';
    if (hasAnswer) return 'answered';
    if (isMarked) return 'marked_for_review';
    if (isVis) return 'unanswered';
    return 'not_visited';
  };

  // Compute counts
  let answeredCount = 0;
  let unansweredCount = 0;
  let markedCount = 0;
  let answeredAndMarkedCount = 0;
  let notVisitedCount = 0;

  for (let i = 0; i < totalQuestions; i++) {
    const s = getStatus(i);
    if (s === 'answered') answeredCount++;
    else if (s === 'unanswered') unansweredCount++;
    else if (s === 'marked_for_review') markedCount++;
    else if (s === 'answered_and_marked') answeredAndMarkedCount++;
    else notVisitedCount++;
  }

  const handleJump = (idx: number) => {
    jumpToQuestion(idx);
    if (onSelectQuestion) onSelectQuestion(idx);
  };

  return (
    <div className="space-y-4">
      {/* Legend Grid */}
      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] space-y-2 text-[11px]">
        <div className="text-xs font-serif font-bold text-slate-900 dark:text-white mb-2">
          Question Palette Legend
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-md bg-emerald-500 text-white text-[9px] font-bold flex items-center justify-center">
              {answeredCount}
            </span>
            <span className="text-slate-600 dark:text-slate-300">Answered</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-md bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
              {unansweredCount}
            </span>
            <span className="text-slate-600 dark:text-slate-300">Not Answered</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-md bg-purple-600 text-white text-[9px] font-bold flex items-center justify-center">
              {markedCount}
            </span>
            <span className="text-slate-600 dark:text-slate-300">Marked Review</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-md bg-purple-600 border border-emerald-400 text-white text-[9px] font-bold flex items-center justify-center">
              {answeredAndMarkedCount}
            </span>
            <span className="text-slate-600 dark:text-slate-300">Ans & Marked</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 pt-1 border-t border-slate-200 dark:border-[#143564]">
          <span className="w-3.5 h-3.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[9px] font-bold flex items-center justify-center">
            {notVisitedCount}
          </span>
          <span className="text-slate-500 dark:text-slate-400">Not Visited</span>
        </div>
      </div>

      {/* Interactive Question Jump Matrix */}
      <div className="space-y-1.5">
        <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          Jump to Question
        </div>
        <div className="grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-5 gap-1.5 max-h-72 overflow-y-auto pr-1">
          {Array.from({ length: totalQuestions }).map((_, idx) => {
            const status = getStatus(idx);
            const isCurrent = idx === currentIndex;

            let badgeClass = 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
            if (status === 'answered') {
              badgeClass = 'bg-emerald-500 text-white border-emerald-600 shadow-xs';
            } else if (status === 'unanswered') {
              badgeClass = 'bg-red-500 text-white border-red-600 shadow-xs';
            } else if (status === 'marked_for_review') {
              badgeClass = 'bg-purple-600 text-white border-purple-700 shadow-xs';
            } else if (status === 'answered_and_marked') {
              badgeClass = 'bg-purple-600 text-white border-2 border-emerald-400 shadow-xs ring-1 ring-emerald-400';
            }

            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleJump(idx)}
                className={`h-8 rounded-lg font-mono text-xs font-bold transition-all flex items-center justify-center cursor-pointer border ${badgeClass} ${
                  isCurrent
                    ? 'ring-2 ring-[#c19b48] scale-105 z-10'
                    : 'hover:opacity-90'
                }`}
                title={`Question ${idx + 1}: ${status.replace(/_/g, ' ')}`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

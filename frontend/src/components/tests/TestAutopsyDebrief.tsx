import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  CheckCircle,
  XCircle,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import type { AutopsyReviewData } from '../../types/testEngine.types';

interface TestAutopsyDebriefProps {
  reviewData: AutopsyReviewData;
  onRetakeOrReset?: () => void;
}

export const TestAutopsyDebrief: React.FC<TestAutopsyDebriefProps> = ({
  reviewData,
  onRetakeOrReset,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'correct' | 'incorrect' | 'unattempted'>('all');

  if (!reviewData) {
    return (
      <div className="p-8 text-center bg-white dark:bg-[#0a1c36] rounded-2xl border border-slate-200 dark:border-[#143564]">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">Exam completed</h3>
        <p className="text-xs text-slate-500 mt-1">Review details are being loaded.</p>
      </div>
    );
  }

  const summary = reviewData?.resultSummary || {
    totalQuestions: reviewData?.questions?.length || 0,
    attempted: 0,
    correct: 0,
    incorrect: 0,
    unattempted: reviewData?.questions?.length || 0,
    score: 0,
    maxScore: 100,
    accuracy: 0,
    avgTimePerMcq: 42,
    negativeMarks: 0,
    rank: 14,
    percentile: 98.4,
  };

  const filteredQuestions = (reviewData?.questions || []).filter((q) => {
    if (filterMode === 'correct') return q.isCorrect === true;
    if (filterMode === 'incorrect') return q.selectedOption !== null && q.selectedOption !== undefined && q.isCorrect === false;
    if (filterMode === 'unattempted') return q.selectedOption === null || q.selectedOption === undefined;
    return true;
  });

  const submittedDateFormatted = reviewData.submittedAt
    ? new Date(reviewData.submittedAt).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : new Date().toLocaleDateString('en-IN');

  return (
    <div className="w-full min-w-0 max-w-5xl mx-auto space-y-5 sm:space-y-6 animate-in fade-in duration-300">
      {/* Hero Debrief Banner */}
      <div className="min-w-0 p-4 sm:p-6 lg:p-8 rounded-3xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] shadow-sm relative overflow-hidden">
        <div className="flex min-w-0 flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
          <div className="min-w-0 space-y-2">
            <div className="max-w-full inline-flex items-center px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[#c19b48] dark:text-[#e8cf8d] text-xs font-semibold">
              <span className="break-words">Exam Autopsy & Comprehensive Debrief</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 dark:text-white break-words">
              {reviewData.title || 'Practice Quiz Sprint'}
            </h1>
            <div className="text-xs text-slate-500 dark:text-slate-400 break-words leading-relaxed space-y-0.5">
              <p>Submitted on {submittedDateFormatted}</p>
              <p>Performance synced to Scorecards & Rank Analysis</p>
            </div>
          </div>

          <div className="w-full md:w-auto grid grid-cols-1 sm:grid-cols-2 md:flex items-stretch gap-2 sm:gap-3">
            {onRetakeOrReset && (
              <button
                type="button"
                onClick={onRetakeOrReset}
                className="w-full min-h-11 md:w-auto px-3 sm:px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-[#061120] hover:bg-slate-200 dark:hover:bg-[#143564] text-slate-800 dark:text-slate-200 font-semibold text-xs border border-slate-200 dark:border-[#143564] transition-colors flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Practice Again</span>
              </button>
            )}

            <Link
              to="/dashboard/tests/results"
              className="w-full min-h-11 md:w-auto px-3 sm:px-4 py-2.5 rounded-xl bg-[#c19b48] hover:bg-[#d8b862] text-[#061120] font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm whitespace-nowrap"
            >
              <span>View All Scorecards</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* 4 Hero Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-5 sm:mt-6 pt-5 sm:pt-6 border-t border-slate-100 dark:border-[#143564]">
          <div className="min-w-0 p-2.5 sm:p-3.5 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564]">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Score Achieved</span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-[#c19b48] dark:text-[#e8cf8d] mt-0.5 leading-tight whitespace-nowrap">
              {summary.score}
            </div>
            <span className="text-[10px] text-slate-500">of {summary.maxScore} pts</span>
          </div>

          <div className="min-w-0 p-2.5 sm:p-3.5 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564]">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block">All-India Standing</span>
            <div className="text-lg sm:text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5 whitespace-nowrap">
              AIR #{summary.rank || 14}
            </div>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400">{summary.percentile || 98.4}th Percentile</span>
          </div>

          <div className="min-w-0 p-2.5 sm:p-3.5 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564]">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Accuracy Rate</span>
            <div className="text-lg sm:text-2xl font-bold font-mono text-slate-900 dark:text-white mt-0.5 whitespace-nowrap">
              {summary.accuracy}%
            </div>
            <span className="text-[10px] text-slate-500">
              {summary.correct} correct of {summary.attempted} attempted
            </span>
          </div>

          <div className="min-w-0 p-2.5 sm:p-3.5 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564]">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Negative Penalty</span>
            <div className="text-lg sm:text-2xl font-bold font-mono text-red-500 mt-0.5 whitespace-nowrap">
              -{summary.negativeMarks} Pts
            </div>
            <span className="text-[10px] text-slate-500">{summary.incorrect} wrong answers</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="min-w-0 flex flex-col gap-3 pt-1 sm:pt-2">
        <div className="min-w-0 flex flex-wrap items-center gap-2">
          <h3 className="min-w-0 text-base font-serif font-bold text-slate-900 dark:text-white break-words">
            Question-by-Question Solution Analysis
          </h3>
          <span className="shrink-0 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#143564] text-xs font-semibold text-slate-700 dark:text-slate-300">
            {filteredQuestions.length} Questions
          </span>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 p-1.5 rounded-xl bg-slate-100 dark:bg-[#061120] border border-slate-200 dark:border-[#143564]">
          {([
            ['all', 'All', summary.totalQuestions],
            ['correct', 'Correct', summary.correct],
            ['incorrect', 'Incorrect', summary.incorrect],
            ['unattempted', 'Skipped', summary.unattempted],
          ] as const).map(([id, label, count]) => (
            <button
              key={id}
              type="button"
              onClick={() => setFilterMode(id)}
              aria-pressed={filterMode === id}
              className={`min-w-0 min-h-10 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors sm:flex-1 sm:basis-0 ${
                filterMode === id
                  ? 'bg-[#c19b48] text-[#061120] shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-white/5'
              }`}
            >
              {label} ({count})
            </button>
          ))}
        </div>
      </div>

      {/* Questions Autopsy Feed */}
      <div className="min-w-0 space-y-4">
        {filteredQuestions.map((q, qIndex) => {
          const isAttempted = q.selectedOption !== null && q.selectedOption !== undefined;
          const isUserCorrect = q.isCorrect === true;
          return (
            <div
              key={q._id || qIndex}
              className="min-w-0 p-4 sm:p-5 lg:p-6 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] space-y-4 shadow-xs"
            >
              {/* Card Header */}
              <div className="min-w-0 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="max-w-full font-mono text-xs px-2.5 py-1 rounded-md bg-slate-100 dark:bg-[#061120] font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#143564] break-words">
                    Q{qIndex + 1} • {q.code}
                  </span>
                  {isAttempted ? (
                    isUserCorrect ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                        <CheckCircle className="w-3.5 h-3.5" /> Correct (+1.0)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-500/15 text-red-500 text-xs font-semibold">
                        <XCircle className="w-3.5 h-3.5" /> Incorrect (-0.25)
                      </span>
                    )
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-semibold">
                      Unattempted (0.0)
                    </span>
                  )}

                </div>
                <p className="text-sm font-semibold text-[#c19b48] dark:text-[#e8cf8d] break-words leading-snug">{q.actName}</p>
                {q.sectionOrArticle && <p className="text-xs text-slate-400 break-words leading-snug">{q.sectionOrArticle}</p>}
              </div>

              {/* Question Statement */}
              <div className="text-sm sm:text-base font-medium text-slate-900 dark:text-white leading-relaxed break-words [overflow-wrap:anywhere]">
                {q.questionText}
              </div>

              {/* 4 Options Matrix */}
              <div className="space-y-2">
                {q.options.map((optText, optIdx) => {
                  const isCorrectAnswer = optIdx === q.correctOptionIndex;
                  const isUserSelection = optIdx === q.selectedOption;

                  let optClass = 'bg-slate-50 dark:bg-[#061120] border-slate-200 dark:border-[#143564] text-slate-700 dark:text-slate-300';
                  if (isCorrectAnswer) {
                    optClass = 'bg-emerald-500/10 border-emerald-500 text-emerald-800 dark:text-emerald-300 font-semibold ring-1 ring-emerald-500/40';
                  } else if (isUserSelection && !isUserCorrect) {
                    optClass = 'bg-red-500/10 border-red-500 text-red-700 dark:text-red-300 font-semibold ring-1 ring-red-500/40';
                  }

                  return (
                    <div
                      key={optIdx}
                      aria-label={`Option ${['A', 'B', 'C', 'D'][optIdx]}${isCorrectAnswer ? ', correct answer' : ''}${isUserSelection ? ', your selection' : ''}`}
                      className={`min-w-0 p-3 rounded-xl border flex items-start gap-2.5 text-xs transition-all ${optClass}`}
                    >
                      <span className="w-5 h-5 shrink-0 rounded-full font-bold font-mono text-[10px] flex items-center justify-center bg-slate-200 dark:bg-[#143564] text-slate-800 dark:text-slate-200">
                        {['A', 'B', 'C', 'D'][optIdx]}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm leading-relaxed break-words [overflow-wrap:anywhere] whitespace-pre-wrap">{optText}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Legal Explanation Box */}
              <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-2 text-xs">
                <div className="font-serif font-bold text-amber-900 dark:text-[#e8cf8d] flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-[#c19b48]" />
                  <span>Statutory Analysis & Precedents</span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed break-words [overflow-wrap:anywhere] whitespace-pre-wrap">
                  {q.explanation}
                </p>
                {q.landmarkCases && q.landmarkCases.length > 0 && (
                  <div className="pt-2 border-t border-amber-500/15 flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      Citations:
                    </span>
                    {q.landmarkCases.map((caseItem: string, cIdx: number) => (
                      <span
                        key={cIdx}
                        className="px-2 py-0.5 rounded-md bg-white dark:bg-[#061120] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#143564] text-[10px] font-medium"
                      >
                        ⚖️ {caseItem}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

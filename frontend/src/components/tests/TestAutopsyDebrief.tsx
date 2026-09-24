import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  CheckCircle,
  XCircle,
  Bookmark,
  ArrowRight,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { toast } from '../../lib/toast';
import { apiClient } from '../../lib/apiClient';
import type { AutopsyReviewData } from '../../types/testEngine.types';
import { SegmentedTabs } from '../ui/tabs';

interface TestAutopsyDebriefProps {
  reviewData: AutopsyReviewData;
  onRetakeOrReset?: () => void;
}

export const TestAutopsyDebrief: React.FC<TestAutopsyDebriefProps> = ({
  reviewData,
  onRetakeOrReset,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'correct' | 'incorrect' | 'unattempted'>('all');
  const [bookmarkedIds, setBookmarkedIds] = useState<Record<string, boolean>>({});

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

  const handleToggleBookmark = async (q: any) => {
    const isBookmarked = Boolean(bookmarkedIds[q._id]);
    setBookmarkedIds({ ...bookmarkedIds, [q._id]: !isBookmarked });

    try {
      await apiClient.post('/bookmarks/toggle', {
        itemType: 'MCQ',
        itemId: q.code || q._id,
        title: q.questionText,
        source: `${q.actName} - ${q.sectionOrArticle || 'Section Question'}`,
        subject: q.subject,
        metadata: {
          options: (q.options || []).map((opt: string, i: number) => ({
            key: ['A', 'B', 'C', 'D'][i],
            text: opt,
          })),
          correctOption: ['A', 'B', 'C', 'D'][q.correctOptionIndex],
          explanation: q.explanation,
        },
      });
      toast.success(isBookmarked ? 'Removed from Starred Vault' : '⭐ Saved to Starred Questions & Vault');
    } catch (err) {
      console.error('Failed to star question:', err);
      toast.error('Failed to update bookmark.');
    }
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
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Hero Debrief Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[#c19b48] dark:text-[#e8cf8d] text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Exam Autopsy & Comprehensive Debrief</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 dark:text-white">
              {reviewData.title || 'Practice Quiz Sprint'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Submitted on {submittedDateFormatted} • Performance automatically synced to Scorecards & Rank Analysis
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {onRetakeOrReset && (
              <button
                type="button"
                onClick={onRetakeOrReset}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-[#061120] hover:bg-slate-200 dark:hover:bg-[#143564] text-slate-800 dark:text-slate-200 font-semibold text-xs border border-slate-200 dark:border-[#143564] transition-colors flex items-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Practice Again</span>
              </button>
            )}

            <Link
              to="/dashboard/tests/results"
              className="px-4 py-2.5 rounded-xl bg-[#c19b48] hover:bg-[#d8b862] text-[#061120] font-semibold text-xs transition-colors flex items-center gap-2 shadow-sm"
            >
              <span>View All Scorecards</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* 4 Hero Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-100 dark:border-[#143564]">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564]">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Score Achieved</span>
            <div className="text-2xl font-bold font-mono text-[#c19b48] dark:text-[#e8cf8d] mt-0.5">
              {summary.score} / {summary.maxScore}
            </div>
            <span className="text-[10px] text-slate-500">Max possible: {summary.maxScore} pts</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564]">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block">All-India Standing</span>
            <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
              AIR #{summary.rank || 14}
            </div>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400">{summary.percentile || 98.4}th Percentile</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564]">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Accuracy Rate</span>
            <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-0.5">
              {summary.accuracy}%
            </div>
            <span className="text-[10px] text-slate-500">
              {summary.correct} correct of {summary.attempted} attempted
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564]">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Negative Penalty</span>
            <div className="text-2xl font-bold font-mono text-red-500 mt-0.5">
              -{summary.negativeMarks} Pts
            </div>
            <span className="text-[10px] text-slate-500">{summary.incorrect} wrong answers</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-serif font-bold text-slate-900 dark:text-white">
            Question-by-Question Solution Analysis
          </h3>
          <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#143564] text-xs font-semibold text-slate-700 dark:text-slate-300">
            {filteredQuestions.length} Questions
          </span>
        </div>

        <SegmentedTabs<'all' | 'correct' | 'incorrect' | 'unattempted'>
          value={filterMode}
          onChange={setFilterMode}
          size="sm"
          items={[
            {
              id: 'all',
              label: `All (${summary.totalQuestions})`,
              shortLabel: `All (${summary.totalQuestions})`,
            },
            {
              id: 'correct',
              label: `Correct (${summary.correct})`,
              shortLabel: `Correct (${summary.correct})`,
              badgeVariant: 'success',
            },
            {
              id: 'incorrect',
              label: `Incorrect (${summary.incorrect})`,
              shortLabel: `Wrong (${summary.incorrect})`,
              badgeVariant: 'danger',
            },
            {
              id: 'unattempted',
              label: `Skipped (${summary.unattempted})`,
              shortLabel: `Skip (${summary.unattempted})`,
            },
          ]}
        />
      </div>

      {/* Questions Autopsy Feed */}
      <div className="space-y-4">
        {filteredQuestions.map((q, qIndex) => {
          const isAttempted = q.selectedOption !== null && q.selectedOption !== undefined;
          const isUserCorrect = q.isCorrect === true;
          const isStarred = Boolean(bookmarkedIds[q._id]);

          return (
            <div
              key={q._id || qIndex}
              className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] space-y-4 shadow-xs"
            >
              {/* Card Header */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-[#061120] font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#143564]">
                    Q{qIndex + 1} • {q.code}
                  </span>
                  <span className="text-xs font-semibold text-[#c19b48] dark:text-[#e8cf8d]">
                    {q.actName}
                  </span>
                  {q.sectionOrArticle && (
                    <span className="text-xs text-slate-400">
                      ({q.sectionOrArticle})
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
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

                  <button
                    type="button"
                    onClick={() => handleToggleBookmark(q)}
                    className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                      isStarred
                        ? 'bg-[#c19b48]/20 border-[#c19b48] text-[#c19b48]'
                        : 'border-slate-200 dark:border-[#143564] text-slate-400 hover:text-[#c19b48]'
                    }`}
                    title="Star question to personal revision vault"
                  >
                    <Bookmark className="w-4 h-4" fill={isStarred ? 'currentColor' : 'none'} />
                  </button>
                </div>
              </div>

              {/* Question Statement */}
              <div className="text-sm font-medium text-slate-900 dark:text-white leading-relaxed">
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
                      className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-all ${optClass}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-5 h-5 rounded-full font-bold font-mono text-[10px] flex items-center justify-center bg-slate-200 dark:bg-[#143564] text-slate-800 dark:text-slate-200">
                          {['A', 'B', 'C', 'D'][optIdx]}
                        </span>
                        <span>{optText}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {isUserSelection && (
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-200 dark:bg-[#143564] text-slate-700 dark:text-slate-200">
                            Your Choice
                          </span>
                        )}
                        {isCorrectAnswer && (
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500 text-white flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Correct Answer
                          </span>
                        )}
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
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
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

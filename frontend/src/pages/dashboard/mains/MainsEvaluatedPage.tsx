import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileCheck,
  Download,
  Award,
  Clock,
  Sparkles,
  CheckCircle2,
  Loader2,
  PenTool,
  BookOpen,
  X,
  XCircle,
  Lightbulb,
} from 'lucide-react';
import { toast } from '../../../lib/toast';
import {
  fetchMySubmissions,
  downloadSubmissionPdf,
  fetchSubmissionAutopsy,
} from '../../../services/mains.service';
import type { MainsSubmission } from '../../../types/mains.types';
import { EvaluatedSubmissionSkeleton } from '../../../components/ui/skeleton';

export const MainsEvaluatedPage: React.FC = () => {
  const navigate = useNavigate();

  const [submissions, setSubmissions] = useState<MainsSubmission[]>([]);
  const [counts, setCounts] = useState({ total: 0, pending: 0, evaluated: 0 });
  const [filterStatus, setFilterStatus] = useState<'all' | 'evaluated' | 'pending'>('evaluated');
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Comparative Autopsy Modal
  const [autopsySubmission, setAutopsySubmission] = useState<MainsSubmission | null>(null);
  const [, setIsLoadingAutopsy] = useState(false);

  const loadSubmissions = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetchMySubmissions(filterStatus === 'all' ? undefined : filterStatus);
      if (res.success) {
        setSubmissions(res.submissions);
        setCounts(res.counts);
      }
    } catch {
      toast.error('Failed to fetch evaluated answer copies.');
    } finally {
      setIsLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  const handleDownload = async (
    submissionId: string,
    type: 'student' | 'evaluated',
    filename: string
  ) => {
    try {
      setDownloadingId(`${submissionId}-${type}`);
      await downloadSubmissionPdf(submissionId, type, filename);
      toast.success(
        type === 'evaluated'
          ? 'Downloaded faculty-evaluated marked copy.'
          : 'Downloaded original submitted answer copy.'
      );
    } catch {
      toast.error('Failed to download answer sheet PDF.');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleOpenAutopsy = async (sub: MainsSubmission) => {
    try {
      setIsLoadingAutopsy(true);
      setAutopsySubmission(sub);
      const res = await fetchSubmissionAutopsy(sub._id);
      if (res.success && res.submission) {
        setAutopsySubmission(res.submission);
      }
    } catch {
      // Keep baseline submission
    } finally {
      setIsLoadingAutopsy(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200 pb-16">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-6 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-semibold mb-2">
            <FileCheck className="w-3.5 h-3.5" />
            <span>Faculty Evaluated Copies & Remarks</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 dark:text-white">
            Evaluated Copies & Feedback
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Review detailed marginal annotations, rubric scorecards, and model answer autopsy by Adv. Rajinder Sir.
          </p>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
          <div className="text-left sm:text-right">
            <span className="text-xs text-slate-400 block">Total Evaluated</span>
            <span className="text-xl font-bold text-[#c19b48] dark:text-[#e8cf8d] font-mono">
              {counts.evaluated} Copies
            </span>
          </div>

          <button
            onClick={() => navigate('/dashboard/mains/questions')}
            className="px-4 py-2 rounded-xl bg-[#c19b48] hover:bg-[#d8b862] text-[#061120] font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0"
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>Today's Daily Question</span>
          </button>
        </div>
      </div>

      {/* 2. Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-[#143564] pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setFilterStatus('evaluated')}
          className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
            filterStatus === 'evaluated'
              ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Evaluated Copies ({counts.evaluated})
        </button>
        <button
          onClick={() => setFilterStatus('pending')}
          className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
            filterStatus === 'pending'
              ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Pending Review ({counts.pending})
        </button>
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
            filterStatus === 'all'
              ? 'bg-slate-200 dark:bg-[#143564] text-slate-900 dark:text-white'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          All Submissions ({counts.total})
        </button>
      </div>

      {/* 3. Submissions Feed */}
      {isLoading ? (
        <EvaluatedSubmissionSkeleton count={3} />
      ) : submissions.length > 0 ? (
        <div className="space-y-4">
          {submissions.map((sub) => {
            const isEvaluated = sub.status === 'evaluated';
            const submittedDateStr = new Date(sub.submittedAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            });
            const evaluatedDateStr = sub.evaluatedAt
              ? new Date(sub.evaluatedAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              : null;

            return (
              <div
                key={sub._id}
                className="p-6 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] hover:border-[#c19b48]/40 transition-all duration-200 space-y-4 shadow-xs"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-[#143564]">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {sub.question?.challengeNumber && (
                        <span className="font-mono text-xs font-bold text-[#c19b48] bg-amber-50 dark:bg-[#c19b48]/15 px-2 py-0.5 rounded border border-[#c19b48]/30">
                          Challenge #{sub.question.challengeNumber}
                        </span>
                      )}
                      <span className="text-[10px] font-bold text-[#c19b48] uppercase tracking-wider">
                        {sub.question?.paper || sub.question?.subject || 'Judicial Studies'}
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                        {sub.question?.questionCode || 'DAW'}
                      </span>
                      {sub.version && sub.version > 1 && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 dark:bg-[#143564] text-slate-600 dark:text-slate-300 font-mono">
                          v{sub.version}
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-serif font-bold text-slate-900 dark:text-white leading-snug">
                      "{sub.question?.title}"
                    </h3>
                  </div>

                  {/* Score Badge */}
                  <div className="shrink-0 flex items-center gap-3">
                    {isEvaluated ? (
                      <div className="p-2.5 sm:p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/25 border border-emerald-200 dark:border-emerald-800 text-right">
                        <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold block uppercase tracking-wider">
                          Marks Awarded
                        </span>
                        <span className="text-xl sm:text-2xl font-bold text-emerald-700 dark:text-emerald-300 font-mono">
                          {sub.score} / {sub.maxScore || sub.question?.marks || 15}
                        </span>
                      </div>
                    ) : (
                      <div className="px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 text-xs font-bold flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Awaiting Faculty Review</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Evaluator & Submission Metadata Strip */}
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <span>Submitted: {submittedDateStr}</span>
                    {evaluatedDateStr && (
                      <>
                        <span>•</span>
                        <span>Evaluated: {evaluatedDateStr}</span>
                      </>
                    )}
                    {sub.isLate && (
                      <span className="text-red-500 font-bold">• Late Attempt</span>
                    )}
                  </div>

                  {sub.evaluatedBy && (
                    <span className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                      <Award className="w-3.5 h-3.5 text-[#c19b48]" />
                      <span>
                        Evaluator: {sub.evaluatedBy.salutation} {sub.evaluatedBy.name}
                      </span>
                    </span>
                  )}
                </div>

                {/* Rubric Breakdown (if available) */}
                {isEvaluated && sub.rubricBreakdown && sub.rubricBreakdown.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                    {sub.rubricBreakdown.map((rubric, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] space-y-1"
                      >
                        <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block truncate">
                          {rubric.label}
                        </span>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold font-mono text-[#c19b48]">
                            {rubric.score} / {rubric.maxScore}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {Math.round((rubric.score / rubric.maxScore) * 100)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Faculty Evaluation Breakdown */}
                {isEvaluated && (
                  <div className="space-y-3 pt-1">
                    {/* General Remarks */}
                    {sub.remarks && (
                      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] text-xs space-y-1">
                        <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-[#c19b48]" />
                          <span>Adv. Rajinder Sir's Judicial Appraisal:</span>
                        </span>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed italic">
                          "{sub.remarks}"
                        </p>
                      </div>
                    )}

                    {/* Strengths, Mistakes, and Action Points */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      {sub.strengths && (
                        <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/15 border border-emerald-200 dark:border-emerald-800/40 space-y-1">
                          <span className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Strengths Observed:</span>
                          </span>
                          <p className="text-slate-700 dark:text-slate-300">{sub.strengths}</p>
                        </div>
                      )}

                      {sub.mistakes && (
                        <div className="p-3 rounded-xl bg-red-50/60 dark:bg-red-950/15 border border-red-200 dark:border-red-800/40 space-y-1">
                          <span className="font-bold text-red-800 dark:text-red-300 flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5 text-red-600" />
                            <span>Critical Legal Errors:</span>
                          </span>
                          <p className="text-slate-700 dark:text-slate-300">{sub.mistakes}</p>
                        </div>
                      )}

                      {(sub.improvementPoints || sub.needsWork) && (
                        <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/15 border border-amber-200 dark:border-amber-800/40 space-y-1">
                          <span className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1">
                            <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                            <span>Actionable Directives:</span>
                          </span>
                          <p className="text-slate-700 dark:text-slate-300">
                            {sub.improvementPoints || sub.needsWork}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Footer Action Buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-[#143564]/60">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Autopsy / Model Answer Comparison Button */}
                    {isEvaluated && (
                      <button
                        type="button"
                        onClick={() => handleOpenAutopsy(sub)}
                        className="px-3.5 py-1.5 rounded-xl bg-[#c19b48] hover:bg-[#d8b862] text-[#061120] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Compare with Model Answer (Autopsy)</span>
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={downloadingId === `${sub._id}-student`}
                      onClick={() =>
                        handleDownload(sub._id, 'student', sub.studentPdf?.originalName || 'answer_copy.pdf')
                      }
                      className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#061120] hover:bg-slate-200 dark:hover:bg-[#143564] text-slate-800 dark:text-white text-xs font-semibold flex items-center gap-1.5 border border-slate-200 dark:border-[#143564] cursor-pointer"
                    >
                      {downloadingId === `${sub._id}-student` ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Download className="w-3.5 h-3.5" />
                      )}
                      <span>Original Copy</span>
                    </button>

                    {/* Evaluated Marked Copy */}
                    {sub.evaluatedPdf && (
                      <button
                        type="button"
                        disabled={downloadingId === `${sub._id}-evaluated`}
                        onClick={() =>
                          handleDownload(sub._id, 'evaluated', sub.evaluatedPdf!.originalName)
                        }
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                      >
                        {downloadingId === `${sub._id}-evaluated` ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <FileCheck className="w-3.5 h-3.5" />
                        )}
                        <span>Download Marked PDF</span>
                      </button>
                    )}
                  </div>

                  <span className="text-[11px] text-slate-400 font-mono">
                    ID: {sub._id.slice(-8)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="p-12 text-center bg-white dark:bg-[#0a1c36] rounded-2xl border border-slate-200 dark:border-[#143564] space-y-4">
          <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 flex items-center justify-center mx-auto">
            <FileCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-serif font-bold text-slate-900 dark:text-white">
              No evaluated copies found in this tab
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
              Submit today's Daily Mains Question to have your handwritten answer booklet evaluated with line-by-line faculty feedback.
            </p>
          </div>

          <button
            onClick={() => navigate('/dashboard/mains/questions')}
            className="px-4 py-2 rounded-xl bg-[#c19b48] hover:bg-[#d8b862] text-[#061120] font-bold text-xs transition-colors cursor-pointer shadow-xs"
          >
            Solve Today's Daily Question
          </button>
        </div>
      )}

      {/* 4. COMPARATIVE AUTOPSY MODAL */}
      {autopsySubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="max-w-4xl w-full max-h-[92dvh] overflow-y-auto rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] p-4 sm:p-6 space-y-5 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#143564]">
              <div>
                <span className="text-xs font-bold text-[#c19b48] uppercase tracking-wider">
                  Comparative Autopsy • Challenge #{autopsySubmission.question?.challengeNumber ?? 0}
                </span>
                <h3 className="font-serif text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                  Student Copy vs Official Model Answer
                </h3>
              </div>

              <button
                onClick={() => setAutopsySubmission(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scorecard Strip */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] flex items-center justify-between flex-wrap gap-3">
              <div>
                <span className="text-xs text-slate-400 block">Total Score</span>
                <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                  {autopsySubmission.score} / {autopsySubmission.maxScore || 15}
                </span>
              </div>

              {autopsySubmission.rubricBreakdown && autopsySubmission.rubricBreakdown.length > 0 && (
                <div className="flex items-center gap-3 flex-wrap">
                  {autopsySubmission.rubricBreakdown.map((r, idx) => (
                    <div key={idx} className="text-xs">
                      <span className="text-slate-400 block text-[10px]">{r.label}</span>
                      <strong className="text-slate-800 dark:text-slate-200 font-mono">
                        {r.score}/{r.maxScore}
                      </strong>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Side-by-Side Dual Column: Student Feedback vs Model Answer */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Left Column: Faculty Autopsy */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-[#c19b48]" />
                  <span>Adv. Rajinder Sir's Annotations</span>
                </h4>

                {autopsySubmission.remarks && (
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] text-xs">
                    <strong className="text-slate-900 dark:text-white block mb-1">Mentor Summary:</strong>
                    <p className="text-slate-600 dark:text-slate-300 italic leading-relaxed">
                      "{autopsySubmission.remarks}"
                    </p>
                  </div>
                )}

                {autopsySubmission.strengths && (
                  <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/15 border border-emerald-200 dark:border-emerald-800/40 text-xs">
                    <strong className="text-emerald-800 dark:text-emerald-300 block mb-1">Key Strengths:</strong>
                    <p className="text-slate-700 dark:text-slate-300">{autopsySubmission.strengths}</p>
                  </div>
                )}

                {autopsySubmission.mistakes && (
                  <div className="p-3 rounded-xl bg-red-50/50 dark:bg-red-950/15 border border-red-200 dark:border-red-800/40 text-xs">
                    <strong className="text-red-800 dark:text-red-300 block mb-1">Critical Errors:</strong>
                    <p className="text-slate-700 dark:text-slate-300">{autopsySubmission.mistakes}</p>
                  </div>
                )}

                {autopsySubmission.improvementPoints && (
                  <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/15 border border-amber-200 dark:border-amber-800/40 text-xs">
                    <strong className="text-amber-800 dark:text-amber-300 block mb-1">Directives for Next Test:</strong>
                    <p className="text-slate-700 dark:text-slate-300">{autopsySubmission.improvementPoints}</p>
                  </div>
                )}
              </div>

              {/* Right Column: Model Answer */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Academy Benchmark Model Answer</span>
                </h4>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] text-xs space-y-3">
                  {autopsySubmission.question?.modelAnswer ? (
                    <p className="text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed">
                      {autopsySubmission.question.modelAnswer}
                    </p>
                  ) : (
                    <p className="text-slate-400 italic">
                      Detailed model answer draft will be released shortly.
                    </p>
                  )}
                </div>

                {autopsySubmission.question?.guidelines && autopsySubmission.question.guidelines.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] text-xs space-y-1.5">
                    <strong className="text-slate-800 dark:text-slate-200 block">Structure & Case Law Key:</strong>
                    <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400">
                      {autopsySubmission.question.guidelines.map((g, idx) => (
                        <li key={idx}>{g}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between pt-3 border-t border-slate-100 dark:border-[#143564] gap-2.5">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() =>
                    handleDownload(
                      autopsySubmission._id,
                      'student',
                      autopsySubmission.studentPdf?.originalName || 'answer_copy.pdf'
                    )
                  }
                  className="flex-1 sm:flex-none px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#061120] text-slate-800 dark:text-white text-xs font-semibold flex items-center justify-center gap-1 border border-slate-200 dark:border-[#143564] cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download My Copy</span>
                </button>

                {autopsySubmission.evaluatedPdf && (
                  <button
                    type="button"
                    onClick={() =>
                      handleDownload(
                        autopsySubmission._id,
                        'evaluated',
                        autopsySubmission.evaluatedPdf!.originalName
                      )
                    }
                    className="flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <FileCheck className="w-3.5 h-3.5" />
                    <span>Download Marked Copy</span>
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setAutopsySubmission(null)}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-200 dark:bg-[#143564] text-slate-800 dark:text-white font-bold text-xs cursor-pointer text-center"
              >
                Close Autopsy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

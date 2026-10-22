import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Download,
  Award,
  Clock,
  CheckCircle2,
  Loader2,
  BookOpen,
  X,
  XCircle,
  Lightbulb,
  Eye,
} from 'lucide-react';
import { toast } from '../../../lib/toast';
import {
  fetchMySubmissions,
  downloadSubmissionPdf,
  fetchSubmissionAutopsy,
  fetchSubmissionPdfBlob,
  getSubmissionPdfStreamUrl,
} from '../../../services/mains.service';
import type { MainsSubmission } from '../../../types/mains.types';
import { EvaluatedSubmissionSkeleton } from '../../../components/ui/skeleton';
import { UniversalPdfModal } from '../../../components/pdf';

export const MainsEvaluatedPage: React.FC = () => {
  const navigate = useNavigate();

  const [submissions, setSubmissions] = useState<MainsSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // In-App PDF Viewer State
  const [viewingPdf, setViewingPdf] = useState<{
    url: string;
    title: string;
    subtitle: string;
    downloadFileName: string;
  } | null>(null);
  const [loadingPdfKey, setLoadingPdfKey] = useState<string | null>(null);

  // Comparative Autopsy Modal
  const [autopsySubmission, setAutopsySubmission] = useState<MainsSubmission | null>(null);
  const [, setIsLoadingAutopsy] = useState(false);

  const loadSubmissions = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetchMySubmissions();
      if (res.success) {
        setSubmissions(res.submissions);
      }
    } catch {
      toast.error('Failed to fetch evaluated answer copies.');
    } finally {
      setIsLoading(false);
    }
  }, []);

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

  const handleViewPdf = async (
    submissionId: string,
    type: 'student' | 'evaluated',
    title: string,
    subtitle: string,
    filename: string
  ) => {
    try {
      setLoadingPdfKey(`${submissionId}-${type}`);
      const blob = await fetchSubmissionPdfBlob(submissionId, type);
      const url = window.URL.createObjectURL(blob);
      setViewingPdf({
        url,
        title,
        subtitle,
        downloadFileName: filename,
      });
    } catch {
      const fallbackUrl = getSubmissionPdfStreamUrl(submissionId, type);
      setViewingPdf({
        url: fallbackUrl,
        title,
        subtitle,
        downloadFileName: filename,
      });
    } finally {
      setLoadingPdfKey(null);
    }
  };

  const handleClosePdf = () => {
    if (viewingPdf?.url && viewingPdf.url.startsWith('blob:')) {
      window.URL.revokeObjectURL(viewingPdf.url);
    }
    setViewingPdf(null);
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
    <div className={`max-w-7xl mx-auto animate-in fade-in duration-200 ${submissions.length > 0 ? 'space-y-6 pb-16' : ''}`}>
      {/* Submissions Feed */}

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
                className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] hover:border-[#c19b48]/40 transition-all duration-200 space-y-4 shadow-xs"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-[#143564]">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {sub.question?.challengeNumber && (
                        <span className="font-mono text-xs font-bold text-[#c19b48] bg-amber-50 dark:bg-[#c19b48]/15 px-2 py-0.5 rounded border border-[#c19b48]/30">
                          Challenge #{sub.question.challengeNumber}
                        </span>
                      )}
                      <span className="text-[10px] font-bold text-[#c19b48] uppercase tracking-wider">
                        {sub.question?.paper || sub.question?.subject || 'Judicial Studies'}
                      </span>
                      <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                        {sub.question?.questionCode || 'DAW'}
                      </span>
                      {sub.version && sub.version > 1 && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 dark:bg-[#143564] text-slate-600 dark:text-slate-300 font-mono">
                          v{sub.version}
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm sm:text-base font-serif font-bold text-slate-900 dark:text-white leading-relaxed">
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
                      <div className="px-2.5 sm:px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 text-[11px] sm:text-xs font-bold flex items-center gap-1.5 whitespace-nowrap">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Awaiting Faculty Review</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Evaluator & Submission Metadata Strip */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-slate-500 dark:text-slate-400 gap-2">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
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
                    <span className="inline-flex min-w-0 items-start gap-1 font-semibold text-slate-700 dark:text-slate-300">
                      <Award className="w-3.5 h-3.5 text-[#c19b48] shrink-0 mt-0.5" />
                      <span className="min-w-0 break-words">
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
                  <div className="flex w-full sm:w-auto items-center gap-2 flex-wrap">
                    {/* Autopsy / Model Answer Comparison Button */}
                    {isEvaluated && (
                      <button
                        type="button"
                        onClick={() => handleOpenAutopsy(sub)}
                        className="w-full sm:w-auto justify-center px-2.5 sm:px-3.5 py-2 sm:py-1.5 rounded-xl bg-[#c19b48] hover:bg-[#d8b862] text-[11px] sm:text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Compare with Model Answer (Autopsy)</span>
                      </button>
                    )}

                    {/* Evaluated Marked Copy - View & Download */}
                    {sub.evaluatedPdf && (
                      <div className="flex w-full sm:w-auto items-center gap-1.5">
                        <button
                          type="button"
                          disabled={loadingPdfKey === `${sub._id}-evaluated`}
                          onClick={() =>
                            handleViewPdf(
                              sub._id,
                              'evaluated',
                              `Evaluated Copy • Challenge #${sub.question?.challengeNumber ?? ''}`,
                              `${sub.question?.title || ''} • Score: ${sub.score}/${sub.maxScore || 15}`,
                              sub.evaluatedPdf!.originalName
                            )
                          }
                          className="flex-1 sm:flex-none justify-center whitespace-nowrap px-2.5 sm:px-3 py-2 sm:py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-[11px] sm:text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-60"
                        >
                          {loadingPdfKey === `${sub._id}-evaluated` ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                          <span>View Marked Copy</span>
                        </button>

                        <button
                          type="button"
                          disabled={downloadingId === `${sub._id}-evaluated`}
                          onClick={() =>
                            handleDownload(sub._id, 'evaluated', sub.evaluatedPdf!.originalName)
                          }
                          className="p-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors cursor-pointer"
                          title="Download Marked PDF"
                        >
                          {downloadingId === `${sub._id}-evaluated` ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Download className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    )}

                    {/* Student Original Copy - View & Download */}
                    <div className="flex w-full sm:w-auto items-center gap-1.5">
                      <button
                        type="button"
                        disabled={loadingPdfKey === `${sub._id}-student`}
                        onClick={() =>
                          handleViewPdf(
                            sub._id,
                            'student',
                            `Submitted Copy • Challenge #${sub.question?.challengeNumber ?? ''}`,
                            sub.question?.title || 'Daily Mains Answer Sheet',
                            sub.studentPdf?.originalName || 'answer_copy.pdf'
                          )
                        }
                        className="flex-1 sm:flex-none justify-center whitespace-nowrap px-2.5 sm:px-3 py-2 sm:py-1.5 rounded-xl bg-slate-100 dark:bg-[#061120] hover:bg-slate-200 dark:hover:bg-[#143564] text-[11px] sm:text-xs font-semibold flex items-center gap-1.5 border border-slate-200 dark:border-[#143564] cursor-pointer disabled:opacity-60"
                      >
                        {loadingPdfKey === `${sub._id}-student` ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Eye className="w-3.5 h-3.5" />
                        )}
                        <span>View Original</span>
                      </button>

                      <button
                        type="button"
                        disabled={downloadingId === `${sub._id}-student`}
                        onClick={() =>
                          handleDownload(sub._id, 'student', sub.studentPdf?.originalName || 'answer_copy.pdf')
                        }
                        className="p-1.5 rounded-xl bg-slate-100 dark:bg-[#061120] hover:bg-slate-200 dark:hover:bg-[#143564] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#143564] cursor-pointer"
                        title="Download Original PDF"
                      >
                        {downloadingId === `${sub._id}-student` ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Download className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
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
        <div className="min-h-[calc(100dvh-12rem)] flex flex-col items-center justify-center text-center space-y-4 py-8 px-4">
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-base sm:text-lg font-serif font-bold text-slate-900 dark:text-white">
              No evaluated copies yet
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Submit today&apos;s Daily Mains Question to have your handwritten answer booklet evaluated with line-by-line faculty feedback.
            </p>
          </div>

          <button
            onClick={() => navigate('/dashboard/mains/questions')}
            className="px-4 py-2.5 rounded-xl bg-[#c19b48] hover:bg-[#d8b862] text-[#061120] font-bold text-xs transition-colors cursor-pointer shadow-xs"
          >
            Solve Today&apos;s Daily Question
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
                {/* View Original Copy */}
                <button
                  type="button"
                  disabled={loadingPdfKey === `${autopsySubmission._id}-student`}
                  onClick={() =>
                    handleViewPdf(
                      autopsySubmission._id,
                      'student',
                      `Submitted Answer Copy • Challenge #${autopsySubmission.question?.challengeNumber ?? ''}`,
                      autopsySubmission.question?.title || 'Daily Mains Answer Sheet',
                      autopsySubmission.studentPdf?.originalName || 'answer_copy.pdf'
                    )
                  }
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#061120] text-slate-800 dark:text-white text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-200 dark:border-[#143564] cursor-pointer"
                >
                  {loadingPdfKey === `${autopsySubmission._id}-student` ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                  <span>View My Copy</span>
                </button>

                {/* View Marked Copy */}
                {autopsySubmission.evaluatedPdf && (
                  <button
                    type="button"
                    disabled={loadingPdfKey === `${autopsySubmission._id}-evaluated`}
                    onClick={() =>
                      handleViewPdf(
                        autopsySubmission._id,
                        'evaluated',
                        `Evaluated Marked Copy • Challenge #${autopsySubmission.question?.challengeNumber ?? ''}`,
                        `${autopsySubmission.question?.title || ''} • Score: ${autopsySubmission.score}/${autopsySubmission.maxScore || 15}`,
                        autopsySubmission.evaluatedPdf!.originalName
                      )
                    }
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    {loadingPdfKey === `${autopsySubmission._id}-evaluated` ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                    <span>View Marked Copy</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() =>
                    handleDownload(
                      autopsySubmission._id,
                      'student',
                      autopsySubmission.studentPdf?.originalName || 'answer_copy.pdf'
                    )
                  }
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#061120] text-slate-600 dark:text-slate-300 text-xs font-semibold flex items-center justify-center gap-1 border border-slate-200 dark:border-[#143564] cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
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

      {/* Reusable In-App Universal PDF Modal */}
      <UniversalPdfModal
        isOpen={!!viewingPdf}
        onClose={handleClosePdf}
        url={viewingPdf?.url || null}
        title={viewingPdf?.title || ''}
        subtitle={viewingPdf?.subtitle}
        downloadFileName={viewingPdf?.downloadFileName}
      />
    </div>
  );
};

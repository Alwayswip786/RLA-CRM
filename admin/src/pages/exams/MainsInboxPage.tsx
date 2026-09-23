import React, { useState, useEffect, useCallback } from 'react';
import {
  FileCheck,
  Download,
  Upload,
  Loader2,
  CheckCircle2,
  RefreshCw,
  Search,
  X,
  User,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  fetchPendingSubmissions,
  fetchAllQuestions,
  claimSubmission,
  evaluateSubmission,
  downloadCopyPdf,
} from '../../services/mains.service';
import type {
  MainsSubmissionAdmin,
  MainsQuestionAdmin,
  RubricScoreAdmin,
} from '../../types/mains.types';

export const MainsInboxPage: React.FC = () => {
  const [copies, setCopies] = useState<MainsSubmissionAdmin[]>([]);
  const [questions, setQuestions] = useState<MainsQuestionAdmin[]>([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState('all');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Active grading modal
  const [activeGradingCopy, setActiveGradingCopy] = useState<MainsSubmissionAdmin | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);

  // Rubrics
  const [rubrics, setRubrics] = useState<RubricScoreAdmin[]>([
    { criterion: 'legalDoctrine', label: 'Legal Doctrine & Constitutional Principles', score: 4, maxScore: 5 },
    { criterion: 'caseApplication', label: 'Case Law & Statutory Provisions Application', score: 3.5, maxScore: 5 },
    { criterion: 'structuringLanguage', label: 'Answer Structuring, Precision & Language', score: 3.5, maxScore: 5 },
  ]);

  const [score, setScore] = useState('11');
  const [remarks, setRemarks] = useState('');
  const [strengths, setStrengths] = useState('');
  const [mistakes, setMistakes] = useState('');
  const [improvementPoints, setImprovementPoints] = useState('');
  const [evaluatedFile, setEvaluatedFile] = useState<File | null>(null);
  const [isSubmittingGrade, setIsSubmittingGrade] = useState(false);

  // Load questions for dropdown filter
  useEffect(() => {
    fetchAllQuestions()
      .then((res) => {
        if (res.success) setQuestions(res.questions);
      })
      .catch(() => {});
  }, []);

  const loadPendingCopies = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetchPendingSubmissions(selectedQuestionId, search);
      if (res.success) {
        setCopies(res.submissions);
      }
    } catch {
      toast.error('Failed to load pending answer sheets.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedQuestionId, search]);

  useEffect(() => {
    loadPendingCopies();
  }, [loadPendingCopies]);

  // Update total score when rubrics change
  const handleRubricScoreChange = (index: number, val: number) => {
    const updated = [...rubrics];
    if (updated[index]) {
      updated[index].score = Math.min(updated[index].maxScore, Math.max(0, val));
      setRubrics(updated);
      const total = updated.reduce((sum, r) => sum + r.score, 0);
      setScore(String(total));
    }
  };

  const handleStartGrading = async (copy: MainsSubmissionAdmin) => {
    try {
      setIsClaiming(true);
      const claimRes = await claimSubmission(copy._id);
      if (claimRes.success) {
        setActiveGradingCopy(copy);
        // Reset rubric defaults
        const maxMarks = copy.question?.marks || 15;
        const perRubricMax = Math.round(maxMarks / 3);
        const initialRubrics: RubricScoreAdmin[] = [
          { criterion: 'legalDoctrine', label: 'Legal Doctrine & Constitutional Principles', score: Math.round(perRubricMax * 0.7 * 10) / 10, maxScore: perRubricMax },
          { criterion: 'caseApplication', label: 'Case Law & Statutory Provisions Application', score: Math.round(perRubricMax * 0.7 * 10) / 10, maxScore: perRubricMax },
          { criterion: 'structuringLanguage', label: 'Answer Structuring, Precision & Language', score: Math.round(perRubricMax * 0.7 * 10) / 10, maxScore: perRubricMax },
        ];
        setRubrics(initialRubrics);
        const total = initialRubrics.reduce((s, r) => s + r.score, 0);
        setScore(String(total));
        setRemarks('');
        setStrengths('');
        setMistakes('');
        setImprovementPoints('');
        setEvaluatedFile(null);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Could not claim copy for review.');
    } finally {
      setIsClaiming(false);
    }
  };

  const handleDownloadStudentCopy = async (copy: MainsSubmissionAdmin) => {
    try {
      await downloadCopyPdf(copy._id, 'student', copy.studentPdf?.originalName || 'answer_copy.pdf');
      toast.success(`Downloaded: ${copy.studentPdf?.originalName || 'answer_copy.pdf'}`);
    } catch {
      toast.error('Failed to download student copy.');
    }
  };

  const handleGradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGradingCopy) return;

    try {
      setIsSubmittingGrade(true);
      const res = await evaluateSubmission(
        activeGradingCopy._id,
        {
          score: parseFloat(score),
          rubricBreakdown: rubrics,
          remarks,
          strengths,
          mistakes,
          improvementPoints,
        },
        evaluatedFile || undefined
      );

      if (res.success) {
        toast.success(
          `Evaluated copy returned to ${activeGradingCopy.student?.name || 'Student'}. Synchronized to Student Portal!`
        );
        setCopies((prev) => prev.filter((c) => c._id !== activeGradingCopy._id));
        setActiveGradingCopy(null);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to submit evaluation.');
    } finally {
      setIsSubmittingGrade(false);
    }
  };

  return (
    <div className="space-y-6 select-none pb-12">
      {/* Header */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F59E0B]/15 border border-[#F59E0B]/30 text-[#F59E0B] text-xs font-semibold">
            <FileCheck className="w-3.5 h-3.5" />
            <span>Mains Evaluation Desk</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#F7F3E6]">
            Pending Answer Sheets & Evaluation Canvas
          </h1>
          <p className="text-xs text-[#A8A294] max-w-2xl leading-relaxed">
            Review handwritten PDF and scanned answer copies submitted by judicial aspirants. Input rubric scores, annotate legal errors, and return marked copies.
          </p>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <button
            onClick={loadPendingCopies}
            className="p-2 rounded-xl bg-[#262626] hover:bg-[#2F2F2F] text-[#A8A294] hover:text-[#F7F3E6] border border-[#3D3D3D] transition-colors cursor-pointer"
            title="Refresh Inbox"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#F59E0B]' : ''}`} />
          </button>

          <div className="text-right">
            <div className="text-xs text-[#A8A294]">Pending Evaluation:</div>
            <div className="font-serif text-2xl font-bold text-[#F59E0B]">
              {copies.length} Copies
            </div>
          </div>
        </div>
      </div>

      {/* Filter Ribbon */}
      <div className="p-4 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#A8A294] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student by name, roll no, or email..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-xs text-[#F7F3E6] placeholder:text-[#A8A294] focus:outline-none focus:border-[#C19B48]"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedQuestionId}
            onChange={(e) => setSelectedQuestionId(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-xs text-[#F7F3E6] focus:outline-none focus:border-[#C19B48] cursor-pointer"
          >
            <option value="all">All Daily Challenges</option>
            {questions.map((q) => (
              <option key={q._id} value={q._id}>
                #{q.challengeNumber ?? 0} {q.questionCode}: {q.paper}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Pending Queue Feed */}
      {isLoading ? (
        <div className="p-12 text-center bg-[#1E1E1E] rounded-2xl border border-[#3D3D3D]">
          <Loader2 className="w-6 h-6 animate-spin text-[#F59E0B] mx-auto mb-2" />
          <p className="text-xs text-[#A8A294]">Loading pending submissions...</p>
        </div>
      ) : copies.length > 0 ? (
        <div className="space-y-4">
          {copies.map((copy) => (
            <div
              key={copy._id}
              className="p-6 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] hover:border-[#C19B48]/50 transition-colors space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#2C2C2C]">
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-mono text-xs font-bold text-[#C19B48] bg-[#C19B48]/15 px-2.5 py-0.5 rounded border border-[#C19B48]/30">
                      #{copy.question?.challengeNumber ?? 0} • {copy.question?.questionCode}
                    </span>
                    <span className="text-xs text-[#34D399] font-medium bg-[#34D399]/15 px-2 py-0.5 rounded">
                      {copy.question?.paper || copy.question?.subject}
                    </span>
                    {copy.version && copy.version > 1 && (
                      <span className="px-1.5 py-0.2 rounded text-[10px] bg-blue-950/40 text-blue-400 border border-blue-800 font-mono font-bold">
                        v{copy.version} (Replaced Copy)
                      </span>
                    )}
                    {copy.isLate && (
                      <span className="px-1.5 py-0.2 rounded text-[10px] bg-red-950/40 text-red-400 border border-red-800 font-bold">
                        Late Attempt
                      </span>
                    )}
                  </div>

                  <h3 className="font-serif text-base font-bold text-[#F7F3E6] leading-snug">
                    "{copy.question?.title}"
                  </h3>
                </div>

                <div className="shrink-0">
                  <span className="text-xs text-[#A8A294]">
                    Max Marks: <strong className="text-[#F7F3E6]">{copy.question?.marks || 15}</strong>
                  </span>
                </div>
              </div>

              {/* Student Metadata */}
              <div className="flex items-center justify-between text-xs text-[#A8A294] flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5 text-[#F7F3E6] font-semibold">
                    <User className="w-3.5 h-3.5 text-[#C19B48]" />
                    <span>{copy.student?.name}</span>
                    <span className="font-mono text-[#A8A294]">({copy.student?.rollNo || 'Aspirant'})</span>
                  </span>

                  <span>•</span>
                  <span>Target: {copy.student?.targetExam || 'Judiciary'}</span>
                  <span>•</span>
                  <span>
                    Submitted: {new Date(copy.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {copy.status === 'under_review' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-950/40 text-amber-400 border border-amber-800">
                    Grading in progress by faculty
                  </span>
                )}
              </div>

              {/* Aspirant Submission Note */}
              {copy.notes && (
                <div className="p-3 rounded-xl bg-[#262626] border border-[#3D3D3D] text-xs text-[#A8A294] italic">
                  "{copy.notes}"
                </div>
              )}

              {/* Actions Footer */}
              <div className="pt-2 flex items-center justify-between gap-3 border-t border-[#2C2C2C] flex-wrap">
                <button
                  type="button"
                  onClick={() => handleDownloadStudentCopy(copy)}
                  className="px-3 py-1.5 rounded-xl bg-[#262626] hover:bg-[#333333] text-[#F7F3E6] text-xs font-semibold flex items-center gap-1.5 border border-[#3D3D3D] transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-[#C19B48]" />
                  <span>Download Student Answer Copy</span>
                </button>

                <button
                  type="button"
                  disabled={isClaiming}
                  onClick={() => handleStartGrading(copy)}
                  className="px-4 py-2 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-[#1E1E1E] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md disabled:opacity-50"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>Open Evaluation Canvas & Grade</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center bg-[#1E1E1E] rounded-2xl border border-[#3D3D3D] space-y-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
          <h3 className="font-serif text-base font-bold text-[#F7F3E6]">All Caught Up!</h3>
          <p className="text-xs text-[#A8A294]">
            No pending answer copies awaiting evaluation for the selected filters.
          </p>
        </div>
      )}

      {/* FULL EVALUATION CANVAS MODAL */}
      {activeGradingCopy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="max-w-4xl w-full max-h-[92vh] overflow-y-auto rounded-2xl bg-[#1E1E1E] border-2 border-[#C19B48]/50 p-6 sm:p-8 space-y-6 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#3D3D3D]">
              <div>
                <span className="text-xs font-bold text-[#C19B48] uppercase tracking-wider">
                  Grading: {activeGradingCopy.student?.name} ({activeGradingCopy.student?.rollNo})
                </span>
                <h3 className="font-serif text-lg font-bold text-[#F7F3E6] mt-0.5">
                  Challenge #{activeGradingCopy.question?.challengeNumber ?? 0} • {activeGradingCopy.question?.questionCode}
                </h3>
              </div>

              <button
                onClick={() => setActiveGradingCopy(null)}
                className="p-1.5 rounded-lg text-[#A8A294] hover:text-[#F7F3E6] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Problem Statement Strip */}
            <div className="p-4 rounded-xl bg-[#262626] border border-[#3D3D3D] space-y-1.5">
              <span className="text-[11px] font-semibold text-[#A8A294] block">
                {activeGradingCopy.question?.paper} • Max {activeGradingCopy.question?.marks || 15} Marks
              </span>
              <p className="text-xs font-serif text-[#F7F3E6] leading-relaxed">
                "{activeGradingCopy.question?.title}"
              </p>
            </div>

            {/* Evaluation Form */}
            <form onSubmit={handleGradeSubmit} className="space-y-5">
              {/* Rubric Breakdown Matrix */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#F7F3E6] uppercase tracking-wider">
                  Rubric Scoring Matrix
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {rubrics.map((r, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-[#262626] border border-[#3D3D3D] space-y-2">
                      <span className="text-xs font-semibold text-[#A8A294] block">
                        {r.label}
                      </span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max={r.maxScore}
                          value={r.score}
                          onChange={(e) => handleRubricScoreChange(idx, parseFloat(e.target.value) || 0)}
                          className="w-20 px-2 py-1.5 rounded-lg bg-[#1E1E1E] border border-[#3D3D3D] font-mono text-sm font-bold text-[#C19B48] focus:outline-none focus:border-[#C19B48]"
                        />
                        <span className="text-xs text-[#A8A294]">/ {r.maxScore} Marks</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Score Output */}
              <div className="p-3 rounded-xl bg-[#262626] border border-[#3D3D3D] flex items-center justify-between">
                <span className="text-xs font-bold text-[#F7F3E6]">Total Score Awarded:</span>
                <span className="font-mono text-xl font-bold text-[#F59E0B]">
                  {score} / {activeGradingCopy.question?.marks || 15}
                </span>
              </div>

              {/* Structured Feedback */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-emerald-400 mb-1">
                    Strengths Observed (Positive Feedback)
                  </label>
                  <textarea
                    rows={2}
                    value={strengths}
                    onChange={(e) => setStrengths(e.target.value)}
                    placeholder="e.g. Good command over Kathi Kalu Oghad, clear issue formulation."
                    className="w-full p-2.5 rounded-xl bg-[#262626] border border-[#3D3D3D] text-xs text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-red-400 mb-1">
                    Critical Legal Errors / Missed Ratios
                  </label>
                  <textarea
                    rows={2}
                    value={mistakes}
                    onChange={(e) => setMistakes(e.target.value)}
                    placeholder="e.g. Failed to distinguish discovery of fact from discovery of object."
                    className="w-full p-2.5 rounded-xl bg-[#262626] border border-[#3D3D3D] text-xs text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-amber-400 mb-1">
                    Actionable Improvement Directives
                  </label>
                  <textarea
                    rows={2}
                    value={improvementPoints}
                    onChange={(e) => setImprovementPoints(e.target.value)}
                    placeholder="e.g. Include Section 23 BSA comparative transition table in next test."
                    className="w-full p-2.5 rounded-xl bg-[#262626] border border-[#3D3D3D] text-xs text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#A8A294] mb-1">
                    General Mentor Appraisal (Adv. Rajinder Sir)
                  </label>
                  <textarea
                    rows={2}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="e.g. Good structural framework. Keep time discipline strict."
                    className="w-full p-2.5 rounded-xl bg-[#262626] border border-[#3D3D3D] text-xs text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
                  />
                </div>
              </div>

              {/* Upload Marked Copy PDF */}
              <div>
                <label className="block text-xs font-semibold text-[#A8A294] mb-1">
                  Upload Marked / Annotated Answer Copy (Optional PDF)
                </label>
                <div className="p-3 rounded-xl bg-[#262626] border border-dashed border-[#3D3D3D] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Upload className="w-4 h-4 text-[#C19B48]" />
                    <span className="text-xs text-[#A8A294]">
                      {evaluatedFile ? evaluatedFile.name : 'Select annotated PDF marked with digital pen...'}
                    </span>
                  </div>
                  <label className="px-3 py-1.5 rounded-lg bg-[#333333] hover:bg-[#3D3D3D] text-xs text-[#F7F3E6] font-semibold cursor-pointer">
                    Browse
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setEvaluatedFile(e.target.files[0]);
                          toast.success('Annotated PDF attached.');
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Actions Strip */}
              <div className="flex items-center justify-between pt-3 border-t border-[#3D3D3D]">
                <button
                  type="button"
                  onClick={() => handleDownloadStudentCopy(activeGradingCopy)}
                  className="px-3 py-1.5 rounded-xl bg-[#262626] hover:bg-[#333333] text-[#A8A294] text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Inspect Student Copy</span>
                </button>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveGradingCopy(null)}
                    className="px-4 py-2 rounded-xl bg-[#262626] hover:bg-[#333333] text-[#A8A294] text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmittingGrade}
                    className="px-6 py-2.5 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-[#1E1E1E] text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                  >
                    {isSubmittingGrade && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>Publish & Synchronize to Student Portal</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

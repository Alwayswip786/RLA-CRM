import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  BookOpen,
  UploadCloud,
  CheckCircle2,
  FileText,
  Loader2,
  Download,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  X,
  History,
  Search,
  Check,
  RefreshCw,
  Eye,
} from 'lucide-react';
import { toast } from '../../../lib/toast';
import { CustomSelect } from '../../../components/ui/CustomSelect';
import { MainsChallengeSkeleton, MainsArchiveCardSkeleton } from '../../../components/ui/skeleton';
import {
  fetchTodayChallenge,
  fetchChallengeArchive,
  fetchQuestionById,
  submitAnswerCopy,
  downloadSubmissionPdf,
  fetchSubmissionPdfBlob,
  getSubmissionPdfStreamUrl,
} from '../../../services/mains.service';
import { UniversalPdfModal } from '../../../components/pdf';
import { SegmentedTabs } from '../../../components/ui/tabs';
import type {
  MainsQuestion,
  MainsSubmission,
  DeadlineInfo,
} from '../../../types/mains.types';

const ARCHIVE_PAPER_OPTIONS = [
  { value: 'all', label: 'All Papers' },
  { value: 'Criminal Law & Procedure (Mains)', label: 'Criminal Law & Procedure' },
  { value: 'Civil Law & Procedure (Mains)', label: 'Civil Law & Procedure' },
  { value: 'Constitutional Law', label: 'Constitutional Law' },
  { value: 'Commercial & Corporate Laws', label: 'Commercial Laws' },
];

export const MainsQuestionsPage: React.FC = () => {
  const navigate = useNavigate();

  // Active Tab: 'today' | 'archive'
  const [activeTab, setActiveTab] = useState<'today' | 'archive'>('today');

  // Today's Challenge State
  const [question, setQuestion] = useState<MainsQuestion | null>(null);
  const [existingSubmission, setExistingSubmission] = useState<MainsSubmission | null>(null);
  const [deadlineInfo, setDeadlineInfo] = useState<DeadlineInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Upload State (Supports PDF or multiple images)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [studentNotes, setStudentNotes] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showReplaceForm, setShowReplaceForm] = useState(false);

  // Optional typed draft workspace toggle
  const [showDraftCanvas, setShowDraftCanvas] = useState(false);
  const [draftText, setDraftText] = useState('');

  // Past Archive State
  const [archiveQuestions, setArchiveQuestions] = useState<MainsQuestion[]>([]);
  const [archiveTotal, setArchiveTotal] = useState(0);
  const [archivePage, setArchivePage] = useState(1);
  const [archiveSearch, setArchiveSearch] = useState('');
  const [archivePaper, setArchivePaper] = useState('all');
  const [isLoadingArchive, setIsLoadingArchive] = useState(false);

  // Archive Question View Modal
  const [selectedArchiveQuestion, setSelectedArchiveQuestion] = useState<MainsQuestion | null>(null);
  const [, setIsLoadingDetail] = useState(false);

  // In-App PDF Viewer State
  const [viewingPdf, setViewingPdf] = useState<{
    url: string;
    title: string;
    subtitle: string;
    downloadFileName: string;
  } | null>(null);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);

  // Fetch active question and student's submission status
  const loadTodayData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetchTodayChallenge();
      if (res.success) {
        setQuestion(res.question);
        setExistingSubmission(res.submission);
        setDeadlineInfo(res.deadlineInfo || null);
      }
    } catch {
      toast.error('Failed to load today’s Daily Mains question.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch past challenges archive
  const loadArchiveData = useCallback(async () => {
    try {
      setIsLoadingArchive(true);
      const res = await fetchChallengeArchive({
        search: archiveSearch,
        paper: archivePaper,
        page: archivePage,
        limit: 12,
      });
      if (res.success) {
        setArchiveQuestions(res.questions);
        setArchiveTotal(res.totalCount);
      }
    } catch {
      toast.error('Failed to load past challenges archive.');
    } finally {
      setIsLoadingArchive(false);
    }
  }, [archiveSearch, archivePaper, archivePage]);

  useEffect(() => {
    if (activeTab === 'today') {
      loadTodayData();
    } else {
      loadArchiveData();
    }
  }, [activeTab, loadTodayData, loadArchiveData]);

  // File Handlers
  const handleFilesAdded = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files);
    // Check if mixing PDF and images
    const hasPdf = newFiles.some((f) => f.type === 'application/pdf');
    const hasImage = newFiles.some((f) => f.type.startsWith('image/'));

    if (hasPdf && hasImage) {
      toast.error('Please select either a single PDF document OR scanned page images.');
      return;
    }

    if (hasPdf) {
      // Allow single PDF
      setSelectedFiles([newFiles[0]!]);
      toast.success(`PDF selected: ${newFiles[0]!.name}`);
    } else {
      // Multiple images allowed (up to 10)
      const validImages = newFiles.filter((f) => f.type.startsWith('image/'));
      const combined = [...selectedFiles.filter((f) => f.type.startsWith('image/')), ...validImages].slice(0, 10);
      setSelectedFiles(combined);
      toast.success(`${combined.length} page image(s) attached.`);
    }
  };

  const handleFileDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    handleFilesAdded(e.dataTransfer.files);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFilesAdded(e.target.files);
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmitCopy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question) return;

    if (selectedFiles.length === 0) {
      toast.error('Please attach your scanned PDF or page images first.');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      const notesCombined = studentNotes || draftText ? `${studentNotes}\n${draftText}`.trim() : undefined;
      const res = await submitAnswerCopy(
        question._id,
        selectedFiles,
        notesCombined,
        (percent) => setUploadProgress(percent)
      );

      if (res.success) {
        toast.success(res.message || 'Answer Copy uploaded successfully!', {
          description: 'Assigned to Adv. Rajinder Sir for evaluation.',
          duration: 5000,
        });
        setExistingSubmission(res.submission);
        setSelectedFiles([]);
        setStudentNotes('');
        setShowReplaceForm(false);
        // Refresh streak and countdown
        loadTodayData();
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to submit answer copy.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDownloadCopy = async (sub: MainsSubmission) => {
    try {
      await downloadSubmissionPdf(sub._id, 'student', sub.studentPdf?.originalName || 'answer_copy.pdf');
      toast.success('Downloaded submitted answer copy.');
    } catch {
      toast.error('Failed to download copy.');
    }
  };

  const handleViewCopy = async (sub: MainsSubmission) => {
    try {
      setIsLoadingPdf(true);
      const filename = sub.studentPdf?.originalName || 'answer_copy.pdf';
      const blob = await fetchSubmissionPdfBlob(sub._id, 'student');
      const url = window.URL.createObjectURL(blob);
      setViewingPdf({
        url,
        title: `Submitted Copy • Challenge #${sub.question?.challengeNumber ?? ''}`,
        subtitle: sub.question?.title || 'Daily Mains Answer Sheet',
        downloadFileName: filename,
      });
    } catch {
      const fallbackUrl = getSubmissionPdfStreamUrl(sub._id, 'student');
      setViewingPdf({
        url: fallbackUrl,
        title: `Submitted Copy • Challenge #${sub.question?.challengeNumber ?? ''}`,
        subtitle: sub.question?.title || 'Daily Mains Answer Sheet',
        downloadFileName: sub.studentPdf?.originalName || 'answer_copy.pdf',
      });
    } finally {
      setIsLoadingPdf(false);
    }
  };

  const handleClosePdf = () => {
    if (viewingPdf?.url && viewingPdf.url.startsWith('blob:')) {
      window.URL.revokeObjectURL(viewingPdf.url);
    }
    setViewingPdf(null);
  };

  const handleOpenArchiveModal = async (q: MainsQuestion) => {
    try {
      setIsLoadingDetail(true);
      setSelectedArchiveQuestion(q);
      const res = await fetchQuestionById(q._id);
      if (res.success && res.question) {
        setSelectedArchiveQuestion(res.question);
      }
    } catch {
      // keep initial question
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const wordCount = draftText.trim() ? draftText.trim().split(/\s+/).length : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200 pb-16">

      {/* 2. Tabs Switcher */}
      <div className="pb-2 border-b border-slate-200 dark:border-[#143564]">
        <SegmentedTabs<'today' | 'archive'>
          value={activeTab}
          onChange={setActiveTab}
          size="sm"
          hideIconsOnMobile
          items={[
            {
              id: 'today',
              label: "Today's Challenge",
              shortLabel: 'Today',
              badgeVariant: 'pulse',
            },
            {
              id: 'archive',
              label: 'Past Challenges Archive',
              shortLabel: 'Archive',
              icon: <History className="w-3.5 h-3.5" />,
              badge: archiveTotal > 0 ? archiveTotal : undefined,
            },
          ]}
        />
      </div>

      {/* 3. TAB 1: TODAY'S CHALLENGE */}
      {activeTab === 'today' && (
        <div className="space-y-6">
          {isLoading ? (
            <MainsChallengeSkeleton />
          ) : question ? (
            <div className="space-y-6">
              {/* Challenge Card */}
              <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] space-y-4 shadow-xs">
                <div className="space-y-3 pb-4 border-b border-slate-100 dark:border-[#143564]">
                  <div className="space-y-2">
                    <span className="inline-flex max-w-full px-2.5 py-1 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-wider">
                      Today's Mains Challenge #{question.challengeNumber ?? 48}
                    </span>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {question.paper}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        {question.questionCode}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center whitespace-nowrap text-[11px] sm:text-xs font-bold px-3 py-1.5 rounded-full bg-[#0a1c36] dark:bg-[#143564] text-white">
                      {question.marks} Marks • Max {question.wordLimit} Words
                    </span>
                    <span
                      className={`inline-flex max-w-full items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-semibold border ${
                        deadlineInfo?.isPassed
                          ? 'bg-slate-100 dark:bg-slate-800/40 text-slate-500 border-slate-200 dark:border-slate-700'
                          : 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-200/60 dark:border-amber-900/40'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      <span>{deadlineInfo?.formattedText || 'Due in 3h 45m (11:59 PM)'}</span>
                    </span>
                  </div>
                </div>

                {/* Problem Statement */}
                <div className="space-y-2">
                  <p className="text-sm sm:text-base font-serif font-bold text-slate-900 dark:text-white leading-relaxed">
                    "{question.title}"
                  </p>
                </div>

                {/* Evaluator Commitment */}
                <div className="pt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between border-t border-slate-100 dark:border-[#143564]/60 flex-wrap gap-2">
                  <span>
                    Evaluator: <strong className="text-slate-800 dark:text-slate-200">{question.evaluatorName || 'Adv. Rajinder Sir'}</strong> • Detailed marginal feedback within {question.turnaroundHours ?? 24}h
                  </span>
                  <span className="text-[11px] text-[#c19b48] font-semibold">
                    {question.totalSubmissionsCount ?? 0} Aspirants Submitted Today
                  </span>
                </div>

                {/* Recommended Outline & Model Headings */}
                {question.guidelines && question.guidelines.length > 0 && (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] space-y-2 mt-4">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-[#c19b48]" />
                      <span>Recommended Legal Headings & Structural Guidance:</span>
                    </h4>
                    <ul className="text-xs text-slate-600 dark:text-slate-300 list-disc list-inside space-y-1">
                      {question.guidelines.map((guide, idx) => (
                        <li key={idx}>{guide}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Submission Section */}
              {existingSubmission && !showReplaceForm ? (
                /* Already Submitted State */
                <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] space-y-4 shadow-xs">
                  <div className="flex items-center justify-between gap-4 flex-wrap pb-3 border-b border-slate-100 dark:border-[#143564]">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          existingSubmission.status === 'evaluated'
                            ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600'
                            : 'bg-amber-50 dark:bg-amber-950/30 text-amber-600'
                        }`}
                      >
                        {existingSubmission.status === 'evaluated' ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          <Clock className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-serif font-bold text-slate-900 dark:text-white">
                            {existingSubmission.status === 'evaluated'
                              ? 'Answer Copy Evaluated by Faculty!'
                              : `Answer Copy Submitted (v${existingSubmission.version || 1})`}
                          </h3>
                          {existingSubmission.isLate && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 dark:bg-red-950/30 text-red-600 border border-red-200 dark:border-red-800">
                              Late Submission
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Submitted on{' '}
                          {new Date(existingSubmission.submittedAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {existingSubmission.status === 'evaluated' ? (
                        <button
                          onClick={() => navigate('/dashboard/mains/evaluated')}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                        >
                          <span>View Marks & Autopsy</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-500/15 text-[#c19b48] border border-amber-200 dark:border-[#c19b48]/30">
                            Under Faculty Evaluation
                          </span>
                          {!deadlineInfo?.isPassed && (
                            <button
                              type="button"
                              onClick={() => setShowReplaceForm(true)}
                              className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-[#143564] hover:bg-slate-300 dark:hover:bg-[#143564]/80 text-slate-800 dark:text-white text-xs font-semibold transition-colors cursor-pointer"
                            >
                              Replace Copy (v{(existingSubmission.version || 1) + 1})
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Submitted File Info */}
                  <div className="p-3 sm:p-4 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-2.5">
                      <FileText className="w-5 h-5 text-[#c19b48] shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-slate-900 dark:text-white block whitespace-normal [overflow-wrap:anywhere]">
                          {existingSubmission.studentPdf?.originalName || 'Answer Copy'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono block mt-1">
                          {existingSubmission.studentPdf?.sizeFormatted || 'Uploaded'} • {existingSubmission.fileType === 'images' ? 'Scanned Page Images' : 'PDF Document'}
                        </span>
                      </div>
                    </div>

                    <div className="flex w-full sm:w-auto items-center gap-2">
                      <button
                        type="button"
                        disabled={isLoadingPdf}
                        onClick={() => handleViewCopy(existingSubmission)}
                        className="min-w-0 flex-1 sm:flex-none justify-center whitespace-nowrap px-2.5 sm:px-3.5 py-2 sm:py-1.5 rounded-lg bg-[#c19b48] hover:bg-[#d8b862] text-[#061120] text-[11px] sm:text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-60"
                      >
                        {isLoadingPdf ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Eye className="w-3.5 h-3.5" />
                        )}
                        <span>View Submitted Copy</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDownloadCopy(existingSubmission)}
                        className="shrink-0 px-3 py-2 sm:py-1.5 rounded-lg bg-slate-200 dark:bg-[#143564] hover:bg-slate-300 dark:hover:bg-[#143564]/80 text-slate-800 dark:text-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        title="Download Submitted PDF"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Download</span>
                      </button>
                    </div>
                  </div>

                  {/* Previous Revisions */}
                  {existingSubmission.revisionHistory && existingSubmission.revisionHistory.length > 0 && (
                    <div className="text-[11px] text-slate-400">
                      <span>Previous versions archived: </span>
                      {existingSubmission.revisionHistory.map((rev, idx) => (
                        <span key={idx} className="font-mono text-[#c19b48] mr-2">
                          v{rev.version} ({new Date(rev.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                        </span>
                      ))}
                    </div>
                  )}

                  <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                    {existingSubmission.status === 'evaluated'
                      ? 'Your marks and margin annotations have been posted to Evaluated Copies.'
                      : 'Adv. Rajinder Sir reviews handwritten copies line-by-line within 24 hours.'}
                  </p>
                </div>
              ) : (
                /* Upload / Replacement Form */
                <form
                  onSubmit={handleSubmitCopy}
                  className="p-6 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] space-y-5 shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-serif font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <UploadCloud className="w-5 h-5 text-[#c19b48]" />
                        <span>
                          {showReplaceForm
                            ? `Replace Answer Copy (v${(existingSubmission?.version || 1) + 1})`
                            : 'Submit Handwritten Answer Sheet (PDF or Scanned Images)'}
                        </span>
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Write your answer on standard ruled judicial booklets, scan clearly, and upload as a PDF or multi-page image scan.
                      </p>
                    </div>

                    {showReplaceForm && (
                      <button
                        type="button"
                        onClick={() => setShowReplaceForm(false)}
                        className="text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                      >
                        Cancel Replacement
                      </button>
                    )}
                  </div>

                  {/* Drag & Drop Zone */}
                  <div>
                    <label
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handleFileDrop}
                      className="border-2 border-dashed border-slate-300 dark:border-[#143564] hover:border-[#c19b48] rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors group bg-slate-50/50 dark:bg-[#061120]/40"
                    >
                      <UploadCloud className="w-10 h-10 text-[#c19b48] group-hover:scale-110 transition-transform mb-3" />
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {selectedFiles.length > 0
                          ? `${selectedFiles.length} file(s) selected`
                          : 'Click to select or drag scanned PDF / page images here'}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        Accepted formats: PDF document (up to 35 MB) or up to 10 JPG/PNG page scans.
                      </span>
                      <input
                        type="file"
                        accept="application/pdf,image/jpeg,image/png,image/webp"
                        multiple
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>

                    {/* Selected Files List Preview */}
                    {selectedFiles.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {selectedFiles.map((file, idx) => (
                          <div
                            key={idx}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] text-xs"
                          >
                            {file.type === 'application/pdf' ? (
                              <FileText className="w-4 h-4 text-red-500" />
                            ) : (
                              <ImageIcon className="w-4 h-4 text-emerald-500" />
                            )}
                            <span className="text-slate-800 dark:text-slate-200 font-medium truncate max-w-[160px]">
                              {file.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                            </span>
                            <button
                              type="button"
                              onClick={() => removeFile(idx)}
                              className="text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                              title="Remove file"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Submission Notes */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Aspirant's Submission Notes & Timed Duration (Optional)
                    </label>
                    <input
                      type="text"
                      value={studentNotes}
                      onChange={(e) => setStudentNotes(e.target.value)}
                      placeholder="e.g. Attempted in 18 minutes. Focused on Kathi Kalu Oghad and Section 23 BSA."
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#c19b48]"
                    />
                  </div>

                  {/* Collapsible Draft Workspace */}
                  <div>
                    <button
                      type="button"
                      onClick={() => setShowDraftCanvas(!showDraftCanvas)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#c19b48] hover:underline cursor-pointer"
                    >
                      {showDraftCanvas ? (
                        <>
                          <ChevronUp className="w-3.5 h-3.5" />
                          <span>Hide Typed Legal Synopsis</span>
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3.5 h-3.5" />
                          <span>Attach Typed Synopsis / Key Authorities</span>
                        </>
                      )}
                    </button>

                    {showDraftCanvas && (
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span>Synopsis Workspace</span>
                          <span>{wordCount} / {question.wordLimit} Words</span>
                        </div>
                        <textarea
                          rows={4}
                          value={draftText}
                          onChange={(e) => setDraftText(e.target.value)}
                          placeholder="Optional: Outline main propositions or landmark authorities here..."
                          className="w-full p-3 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#c19b48]"
                        />
                      </div>
                    )}
                  </div>

                  {/* Upload Progress Bar */}
                  {isUploading && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-slate-500">
                        <span>Uploading answer copy...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#c19b48] transition-all duration-150"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Submit Action */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>
                        {showReplaceForm
                          ? 'Replacing this submission will archive your earlier copy.'
                          : 'You can update or replace your answer copy anytime before the deadline.'}
                      </span>
                    </div>

                    <button
                      type="submit"
                      disabled={isUploading || selectedFiles.length === 0}
                      className="px-6 py-2.5 rounded-xl bg-[#c19b48] hover:bg-[#d8b862] text-[#061120] font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      {isUploading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <UploadCloud className="w-4 h-4" />
                      )}
                      <span>
                        {showReplaceForm
                          ? `Publish Replacement (v${(existingSubmission?.version || 1) + 1})`
                          : 'Submit Copy for Faculty Evaluation'}
                      </span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <div className="p-12 text-center bg-white dark:bg-[#0a1c36] rounded-2xl border border-slate-200 dark:border-[#143564]">
              <p className="text-xs text-slate-400">No active Daily Mains Question found at this moment.</p>
            </div>
          )}
        </div>
      )}

      {/* 4. TAB 2: PAST CHALLENGES ARCHIVE */}
      {activeTab === 'archive' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={archiveSearch}
                onChange={(e) => {
                  setArchiveSearch(e.target.value);
                  setArchivePage(1);
                }}
                placeholder="Search by code, legal doctrine, or problem statement..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#c19b48]"
              />
            </div>

            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <CustomSelect
                value={archivePaper}
                onChange={(val) => {
                  setArchivePaper(val);
                  setArchivePage(1);
                }}
                options={ARCHIVE_PAPER_OPTIONS}
                sheetTitle="Filter by Paper"
                className="flex-1 sm:w-60"
              />

              <button
                onClick={loadArchiveData}
                className="p-2.5 rounded-xl bg-slate-100 dark:bg-[#061120] hover:bg-slate-200 dark:hover:bg-[#143564] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#143564] transition-colors cursor-pointer shrink-0"
                title="Refresh Archive"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingArchive ? 'animate-spin text-[#c19b48]' : ''}`} />
              </button>
            </div>
          </div>

          {/* Grid */}
          {isLoadingArchive && archiveQuestions.length === 0 ? (
            <MainsArchiveCardSkeleton count={4} />
          ) : archiveQuestions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {archiveQuestions.map((q) => (
                <div
                  key={q._id}
                  className="min-w-0 p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] hover:border-[#c19b48]/60 transition-all flex flex-col justify-between space-y-4 shadow-xs"
                >
                  <div className="space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0 flex flex-wrap items-center gap-2">
                        <span className="inline-flex shrink-0 items-center font-mono text-xs leading-none font-bold text-[#c19b48] bg-amber-50 dark:bg-[#c19b48]/15 px-2 py-1 rounded border border-[#c19b48]/30">
                          #{q.challengeNumber ?? 0}
                        </span>
                      </div>

                      {q.studentSubmission ? (
                        q.studentSubmission.status === 'evaluated' ? (
                          <span className="inline-flex shrink-0 items-center px-2.5 py-1 rounded-full text-[11px] leading-none font-bold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 border border-emerald-200 dark:border-emerald-800 gap-1">
                            <Check className="w-3 h-3" />
                            <span>Score: {q.studentSubmission.score}/{q.studentSubmission.maxScore}</span>
                          </span>
                        ) : (
                          <span className="inline-flex shrink-0 items-center px-2.5 py-1 rounded-full text-[11px] leading-none font-bold bg-amber-50 dark:bg-amber-950/30 text-amber-600 border border-amber-200 dark:border-amber-800">
                            Submitted
                          </span>
                        )
                      ) : (
                          <span className="inline-flex shrink-0 items-center px-2 py-1 rounded-full text-[11px] leading-none font-medium bg-slate-100 dark:bg-slate-800 text-slate-500">
                          Not Attempted
                        </span>
                      )}
                    </div>

                    <p className="min-w-0 text-xs font-bold text-slate-700 dark:text-slate-300 break-words [overflow-wrap:anywhere]">
                      {q.paper}
                    </p>

                    <p className="min-w-0 text-xs sm:text-sm font-serif font-bold text-slate-900 dark:text-white leading-relaxed break-words [overflow-wrap:anywhere]">
                      "{q.title}"
                    </p>

                    <div className="space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                      <p className="break-words">{q.subject}</p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="whitespace-nowrap">{q.marks} Marks</span>
                        <span className="whitespace-nowrap">{q.wordLimit} Words</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-[#143564] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <span className="text-[11px] text-slate-400">
                      {q.challengeDate ? new Date(q.challengeDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleOpenArchiveModal(q)}
                      className="w-full sm:w-auto inline-flex items-center justify-center text-center px-3 py-2 rounded-xl bg-slate-100 dark:bg-[#061120] hover:bg-[#c19b48] hover:text-[#061120] text-slate-700 dark:text-slate-300 font-semibold text-[11px] sm:text-xs leading-snug transition-colors cursor-pointer border border-slate-200 dark:border-[#143564]"
                    >
                      {q.isModelAnswerRevealed ? 'View Question & Model Answer →' : 'View Question Details →'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center bg-white dark:bg-[#0a1c36] rounded-2xl border border-slate-200 dark:border-[#143564]">
              <p className="text-xs text-slate-400">No past challenges found matching your filters.</p>
            </div>
          )}
        </div>
      )}

      {/* 5. MODAL: VIEW ARCHIVE CHALLENGE & MODEL ANSWER */}
      {selectedArchiveQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="max-w-2xl w-full max-h-[90dvh] overflow-y-auto rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] p-4 sm:p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#143564]">
              <div>
                <span className="text-xs font-bold text-[#c19b48] uppercase tracking-wider">
                  Challenge #{selectedArchiveQuestion.challengeNumber} • {selectedArchiveQuestion.paper}
                </span>
                <h3 className="font-serif text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                  {selectedArchiveQuestion.questionCode}
                </h3>
              </div>
              <button
                onClick={() => setSelectedArchiveQuestion(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Problem Statement */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] space-y-2">
              <span className="text-[11px] font-mono text-[#c19b48] font-bold block">
                {selectedArchiveQuestion.marks} Marks • Max {selectedArchiveQuestion.wordLimit} Words
              </span>
              <p className="text-sm font-serif font-bold text-slate-900 dark:text-white leading-relaxed">
                "{selectedArchiveQuestion.title}"
              </p>
            </div>

            {/* Guidelines */}
            {selectedArchiveQuestion.guidelines && selectedArchiveQuestion.guidelines.length > 0 && (
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Recommended Headings & Structure:
                </h4>
                <ul className="text-xs text-slate-600 dark:text-slate-400 list-disc list-inside space-y-1">
                  {selectedArchiveQuestion.guidelines.map((g, idx) => (
                    <li key={idx}>{g}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Model Answer (if released) */}
            {selectedArchiveQuestion.modelAnswer ? (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Official Model Answer Synopsis by Adv. Rajinder Sir:</span>
                  </h4>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                  {selectedArchiveQuestion.modelAnswer}
                </p>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#061120] text-center text-xs text-slate-400">
                <span>Model answer is released once faculty evaluation is complete.</span>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedArchiveQuestion(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-[#143564] text-slate-800 dark:text-white font-bold text-xs cursor-pointer"
              >
                Close
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

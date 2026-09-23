import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Plus,
  RefreshCw,
  Loader2,
  Calendar,
  Clock,
  Edit2,
  Archive,
  Eye,
  EyeOff,
  BookOpen,
  X,
  Users,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  fetchAllQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
} from '../../services/mains.service';
import type {
  MainsQuestionAdmin,
  ScheduleQuestionPayload,
} from '../../types/mains.types';

export const MainsQuestionsPage: React.FC = () => {
  const [questions, setQuestions] = useState<MainsQuestionAdmin[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State: Create or Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<MainsQuestionAdmin | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [challengeNumber, setChallengeNumber] = useState<number | ''>('');
  const [questionCode, setQuestionCode] = useState('');
  const [paper, setPaper] = useState('Criminal Law & Procedure (Mains)');
  const [subject, setSubject] = useState('');
  const [targetExam, setTargetExam] = useState('Delhi Judicial Service (DJS)');
  const [title, setTitle] = useState('');
  const [challengeDate, setChallengeDate] = useState('');
  const [submissionDeadline, setSubmissionDeadline] = useState('');
  const [marks, setMarks] = useState(15);
  const [wordLimit, setWordLimit] = useState(250);
  const [turnaroundHours, setTurnaroundHours] = useState(24);
  const [evaluatorName, setEvaluatorName] = useState('Adv. Rajinder Sir');
  const [guidelinesText, setGuidelinesText] = useState('');
  const [modelAnswer, setModelAnswer] = useState('');
  const [isModelAnswerPublished, setIsModelAnswerPublished] = useState(false);
  const [status, setStatus] = useState<'draft' | 'scheduled' | 'active' | 'archived'>('active');

  // Model Answer View Modal
  const [viewingModelAnswerQ, setViewingModelAnswerQ] = useState<MainsQuestionAdmin | null>(null);

  const loadQuestions = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetchAllQuestions();
      if (res.success) {
        setQuestions(res.questions);
      }
    } catch {
      toast.error('Failed to load Daily Mains questions.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  const openCreateModal = () => {
    setEditingQuestion(null);
    const nextNum = questions.length > 0
      ? Math.max(...questions.map((q) => q.challengeNumber || 0)) + 1
      : 48;
    setChallengeNumber(nextNum);
    setQuestionCode(`DAW-2026-${String(nextNum).padStart(3, '0')}`);
    setPaper('Criminal Law & Procedure (Mains)');
    setSubject('Indian Evidence Act / BSA 2023');
    setTargetExam('Delhi Judicial Service (DJS)');
    setTitle('');
    
    // Default challenge date: today
    const todayStr = new Date().toISOString().split('T')[0]!;
    setChallengeDate(todayStr);

    // Default deadline: today 11:59 PM
    const dl = new Date();
    dl.setHours(23, 59, 0, 0);
    setSubmissionDeadline(dl.toISOString().slice(0, 16));

    setMarks(15);
    setWordLimit(250);
    setTurnaroundHours(24);
    setEvaluatorName('Adv. Rajinder Sir');
    setGuidelinesText('Introduction: Core doctrine & statutory sections\nKey Judicial Ratios & Precedents\nApplication to Proposition & Comparative Evaluation\nConclusion with Practical Judicial Holding');
    setModelAnswer('');
    setIsModelAnswerPublished(false);
    setStatus('active');
    setIsModalOpen(true);
  };

  const openEditModal = (q: MainsQuestionAdmin) => {
    setEditingQuestion(q);
    setChallengeNumber(q.challengeNumber || '');
    setQuestionCode(q.questionCode);
    setPaper(q.paper || 'Criminal Law & Procedure (Mains)');
    setSubject(q.subject);
    setTargetExam(q.targetExam || 'All-India Judicial Services');
    setTitle(q.title);
    setChallengeDate(q.challengeDate ? q.challengeDate.split('T')[0]! : '');
    setSubmissionDeadline(q.submissionDeadline ? q.submissionDeadline.slice(0, 16) : '');
    setMarks(q.marks || 15);
    setWordLimit(q.wordLimit || 250);
    setTurnaroundHours(q.turnaroundHours || 24);
    setEvaluatorName(q.evaluatorName || 'Adv. Rajinder Sir');
    setGuidelinesText(q.guidelines ? q.guidelines.join('\n') : '');
    setModelAnswer(q.modelAnswer || '');
    setIsModelAnswerPublished(Boolean(q.isModelAnswerPublished));
    setStatus(q.status || 'active');
    setIsModalOpen(true);
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !subject.trim()) {
      toast.error('Please input problem statement title and subject category.');
      return;
    }

    try {
      setIsSubmitting(true);
      const guidelines = guidelinesText
        .split('\n')
        .map((g) => g.trim())
        .filter(Boolean);

      const payload: ScheduleQuestionPayload = {
        challengeNumber: Number(challengeNumber) || undefined,
        questionCode,
        paper,
        subject,
        targetExam,
        title,
        challengeDate: challengeDate ? new Date(challengeDate).toISOString() : undefined,
        submissionDeadline: submissionDeadline ? new Date(submissionDeadline).toISOString() : undefined,
        marks: Number(marks),
        wordLimit: Number(wordLimit),
        turnaroundHours: Number(turnaroundHours),
        evaluatorName,
        guidelines,
        modelAnswer,
        isModelAnswerPublished,
        status,
        isActive: status === 'active',
      };

      if (editingQuestion) {
        const res = await updateQuestion(editingQuestion._id, payload);
        if (res.success) {
          toast.success('Question updated successfully!');
          setIsModalOpen(false);
          loadQuestions();
        }
      } else {
        const res = await createQuestion(payload);
        if (res.success) {
          toast.success(res.message || 'Daily Challenge scheduled successfully!');
          setIsModalOpen(false);
          loadQuestions();
        }
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save question.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleModelAnswer = async (q: MainsQuestionAdmin) => {
    try {
      const nextState = !q.isModelAnswerPublished;
      const res = await updateQuestion(q._id, { isModelAnswerPublished: nextState });
      if (res.success) {
        toast.success(
          nextState
            ? `Model Answer released for Challenge #${q.challengeNumber}!`
            : `Model Answer hidden for Challenge #${q.challengeNumber}.`
        );
        loadQuestions();
      }
    } catch {
      toast.error('Failed to toggle model answer visibility.');
    }
  };

  const handleArchiveQuestion = async (id: string) => {
    if (!window.confirm('Are you sure you want to archive this question? Past student submissions will be preserved.')) {
      return;
    }

    try {
      const res = await deleteQuestion(id);
      if (res.success) {
        toast.success('Question archived successfully.');
        loadQuestions();
      }
    } catch {
      toast.error('Failed to archive question.');
    }
  };

  return (
    <div className="space-y-6 select-none pb-12">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C19B48]/15 border border-[#C19B48]/30 text-[#C19B48] text-xs font-semibold">
            <FileText className="w-3.5 h-3.5" />
            <span>Daily Challenge Manager (DAW)</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#F7F3E6]">
            Daily Mains Question Bank & Scheduling
          </h1>
          <p className="text-xs text-[#A8A294] max-w-2xl leading-relaxed">
            Create and schedule daily subjective problems, attach model answers prepared by Adv. Rajinder Sir, and monitor student submission volume.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={loadQuestions}
            className="p-2 rounded-xl bg-[#262626] hover:bg-[#2F2F2F] text-[#A8A294] hover:text-[#F7F3E6] border border-[#3D3D3D] transition-colors cursor-pointer"
            title="Refresh Question Bank"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#C19B48]' : ''}`} />
          </button>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C19B48] hover:bg-[#D8B862] text-[#1E1E1E] text-xs font-bold transition-colors cursor-pointer shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Daily Challenge</span>
          </button>
        </div>
      </div>

      {/* Questions Feed */}
      {isLoading ? (
        <div className="p-12 text-center bg-[#1E1E1E] rounded-2xl border border-[#3D3D3D]">
          <Loader2 className="w-6 h-6 animate-spin text-[#C19B48] mx-auto mb-2" />
          <p className="text-xs text-[#A8A294]">Loading Question Bank...</p>
        </div>
      ) : questions.length > 0 ? (
        <div className="space-y-4">
          {questions.map((q) => {
            const isModelPub = Boolean(q.isModelAnswerPublished);

            return (
              <div
                key={q._id}
                className="p-6 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] hover:border-[#C19B48]/50 transition-colors space-y-4"
              >
                {/* Header Strip */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#2C2C2C]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-[#C19B48] bg-[#C19B48]/15 px-2.5 py-0.5 rounded border border-[#C19B48]/30">
                      #{q.challengeNumber ?? 0} • {q.questionCode}
                    </span>
                    <span className="text-xs text-[#34D399] font-medium bg-[#34D399]/15 px-2.5 py-0.5 rounded">
                      {q.paper}
                    </span>
                    <span className="text-xs text-[#A8A294]">
                      {q.targetExam}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        q.status === 'active'
                          ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800'
                          : q.status === 'scheduled'
                          ? 'bg-amber-950/40 text-amber-400 border border-amber-800'
                          : 'bg-stone-800 text-stone-400'
                      }`}
                    >
                      {q.status}
                    </span>

                    <span className="text-xs text-[#A8A294]">
                      Marks: <strong className="text-[#F7F3E6]">{q.marks}</strong> • Word Limit: {q.wordLimit}
                    </span>
                  </div>
                </div>

                {/* Problem Statement */}
                <h3 className="font-serif text-base font-bold text-[#F7F3E6] leading-relaxed">
                  "{q.title}"
                </h3>

                {/* Submissions & Deadlines Strip */}
                <div className="flex items-center justify-between text-xs text-[#A8A294] flex-wrap gap-2 pt-1">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[#C19B48]" />
                      <span>
                        Date: {q.challengeDate ? new Date(q.challengeDate).toLocaleDateString('en-IN') : 'Today'}
                      </span>
                    </span>

                    {q.submissionDeadline && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>
                          Deadline: {new Date(q.submissionDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </span>
                    )}

                    <span className="flex items-center gap-1 text-[#F7F3E6] font-semibold">
                      <Users className="w-3.5 h-3.5 text-blue-400" />
                      <span>{q.totalSubmissionsCount || 0} Submissions ({q.evaluatedCount || 0} Evaluated)</span>
                    </span>
                  </div>

                  {/* Model Answer Status Badge */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleModelAnswer(q)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                        isModelPub
                          ? 'bg-emerald-950/30 border-emerald-700 text-emerald-400 hover:bg-emerald-950/50'
                          : 'bg-stone-800 border-[#3D3D3D] text-[#A8A294] hover:text-[#F7F3E6]'
                      }`}
                    >
                      {isModelPub ? <Eye className="w-3.5 h-3.5 text-emerald-400" /> : <EyeOff className="w-3.5 h-3.5" />}
                      <span>{isModelPub ? 'Model Answer Released' : 'Model Answer Hidden'}</span>
                    </button>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="pt-3 border-t border-[#2C2C2C] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    {q.modelAnswer && (
                      <button
                        onClick={() => setViewingModelAnswerQ(q)}
                        className="text-[#C19B48] hover:text-[#E8CF8D] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Inspect Model Answer Draft</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(q)}
                      className="px-3 py-1.5 rounded-lg bg-[#262626] hover:bg-[#333333] text-[#F7F3E6] text-xs font-semibold flex items-center gap-1.5 border border-[#3D3D3D] transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-[#C19B48]" />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => handleArchiveQuestion(q._id)}
                      className="px-3 py-1.5 rounded-lg bg-[#262626] hover:bg-red-950/40 text-red-400 text-xs font-semibold flex items-center gap-1.5 border border-[#3D3D3D] hover:border-red-800 transition-colors cursor-pointer"
                      title="Archive Challenge"
                    >
                      <Archive className="w-3.5 h-3.5" />
                      <span>Archive</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center bg-[#1E1E1E] rounded-2xl border border-[#3D3D3D]">
          <p className="text-xs text-[#A8A294]">No questions found in question bank. Click "Schedule Daily Challenge" to create one.</p>
        </div>
      )}

      {/* SCHEDULE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
          <div className="max-w-3xl w-full max-h-[90vh] overflow-y-auto rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#3D3D3D]">
              <div>
                <h3 className="font-serif text-xl font-bold text-[#F7F3E6]">
                  {editingQuestion ? `Edit Daily Challenge #${challengeNumber}` : 'Schedule Daily Mains Challenge'}
                </h3>
                <p className="text-xs text-[#A8A294] mt-0.5">
                  Set daily subjective problem statement, guidelines, marks, and model answer key.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-[#A8A294] hover:text-[#F7F3E6] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#A8A294] mb-1">
                    Challenge Number
                  </label>
                  <input
                    type="number"
                    value={challengeNumber}
                    onChange={(e) => setChallengeNumber(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                    placeholder="e.g. 48"
                    className="w-full px-3 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-xs text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#A8A294] mb-1">
                    Question Code
                  </label>
                  <input
                    type="text"
                    value={questionCode}
                    onChange={(e) => setQuestionCode(e.target.value)}
                    placeholder="e.g. DAW-2026-048"
                    className="w-full px-3 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-xs text-[#F7F3E6] uppercase focus:outline-none focus:border-[#C19B48]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#A8A294] mb-1">
                    Paper Classification
                  </label>
                  <select
                    value={paper}
                    onChange={(e) => setPaper(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-xs text-[#F7F3E6] focus:outline-none focus:border-[#C19B48] cursor-pointer"
                  >
                    <option value="Criminal Law & Procedure (Mains)">Criminal Law & Procedure (Mains)</option>
                    <option value="Civil Law & Procedure (Mains)">Civil Law & Procedure (Mains)</option>
                    <option value="Constitutional Law">Constitutional Law</option>
                    <option value="Commercial & Corporate Laws">Commercial & Corporate Laws</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#A8A294] mb-1">
                    Subject / Act
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Indian Evidence Act / BSA 2023"
                    className="w-full px-3 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-xs text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#A8A294] mb-1">
                    Target Exam / State
                  </label>
                  <input
                    type="text"
                    value={targetExam}
                    onChange={(e) => setTargetExam(e.target.value)}
                    placeholder="e.g. Delhi Judicial Service (DJS)"
                    className="w-full px-3 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-xs text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A8A294] mb-1">
                  Mains Problem Statement (Judicial Question)
                </label>
                <textarea
                  rows={4}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter the full problem statement as given in judicial examinations..."
                  className="w-full p-3 rounded-xl bg-[#262626] border border-[#3D3D3D] text-xs text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#A8A294] mb-1">
                    Marks Allocation
                  </label>
                  <input
                    type="number"
                    value={marks}
                    onChange={(e) => setMarks(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-xs text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#A8A294] mb-1">
                    Word Limit
                  </label>
                  <input
                    type="number"
                    value={wordLimit}
                    onChange={(e) => setWordLimit(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-xs text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#A8A294] mb-1">
                    Evaluation Turnaround
                  </label>
                  <input
                    type="number"
                    value={turnaroundHours}
                    onChange={(e) => setTurnaroundHours(Number(e.target.value))}
                    placeholder="Hours (default 24)"
                    className="w-full px-3 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-xs text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#A8A294] mb-1">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-xs text-[#F7F3E6] focus:outline-none focus:border-[#C19B48] cursor-pointer"
                  >
                    <option value="active">Active (Today's Challenge)</option>
                    <option value="scheduled">Scheduled for Later</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#A8A294] mb-1">
                    Scheduled Challenge Date
                  </label>
                  <input
                    type="date"
                    value={challengeDate}
                    onChange={(e) => setChallengeDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-xs text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#A8A294] mb-1">
                    Submission Deadline Cutoff
                  </label>
                  <input
                    type="datetime-local"
                    value={submissionDeadline}
                    onChange={(e) => setSubmissionDeadline(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-xs text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A8A294] mb-1">
                  Structural Guidance & Legal Headings (1 per line)
                </label>
                <textarea
                  rows={3}
                  value={guidelinesText}
                  onChange={(e) => setGuidelinesText(e.target.value)}
                  placeholder="Enter outline points separated by line breaks..."
                  className="w-full p-3 rounded-xl bg-[#262626] border border-[#3D3D3D] text-xs text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A8A294] mb-1">
                  Official Model Answer Synopsis
                </label>
                <textarea
                  rows={5}
                  value={modelAnswer}
                  onChange={(e) => setModelAnswer(e.target.value)}
                  placeholder="Draft the authoritative judicial answer synopsis with statutory citations and ratios..."
                  className="w-full p-3 rounded-xl bg-[#262626] border border-[#3D3D3D] text-xs text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
                />
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-[#262626] border border-[#3D3D3D]">
                <input
                  type="checkbox"
                  id="releaseModel"
                  checked={isModelAnswerPublished}
                  onChange={(e) => setIsModelAnswerPublished(e.target.checked)}
                  className="w-4 h-4 text-[#C19B48] rounded border-[#3D3D3D] cursor-pointer"
                />
                <label htmlFor="releaseModel" className="text-xs text-[#F7F3E6] cursor-pointer">
                  Release Model Answer immediately to students upon submission evaluation
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#3D3D3D]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#262626] hover:bg-[#333333] text-[#A8A294] text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-[#C19B48] hover:bg-[#D8B862] text-[#1E1E1E] text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingQuestion ? 'Update Challenge' : 'Schedule Challenge'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INSPECT MODEL ANSWER MODAL */}
      {viewingModelAnswerQ && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
          <div className="max-w-2xl w-full max-h-[85vh] overflow-y-auto rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#3D3D3D]">
              <div>
                <span className="text-xs font-bold text-[#C19B48] uppercase tracking-wider">
                  Model Answer Draft • #{viewingModelAnswerQ.challengeNumber}
                </span>
                <h3 className="font-serif text-base font-bold text-[#F7F3E6]">
                  {viewingModelAnswerQ.questionCode}
                </h3>
              </div>
              <button
                onClick={() => setViewingModelAnswerQ(null)}
                className="p-1.5 rounded-lg text-[#A8A294] hover:text-[#F7F3E6] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-[#262626] border border-[#3D3D3D] text-xs text-[#F7F3E6] whitespace-pre-line leading-relaxed">
              {viewingModelAnswerQ.modelAnswer || 'No model answer synopsis attached.'}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setViewingModelAnswerQ(null)}
                className="px-4 py-2 rounded-xl bg-[#262626] text-[#F7F3E6] text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

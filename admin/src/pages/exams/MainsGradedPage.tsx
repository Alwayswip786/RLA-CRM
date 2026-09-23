import React, { useState, useEffect, useCallback } from 'react';
import {
  Download,
  CheckCircle2,
  Search,
  Loader2,
  FileCheck,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  fetchGradedSubmissions,
  fetchAllQuestions,
  downloadCopyPdf,
} from '../../services/mains.service';
import type {
  MainsSubmissionAdmin,
  MainsQuestionAdmin,
} from '../../types/mains.types';

export const MainsGradedPage: React.FC = () => {
  const [submissions, setSubmissions] = useState<MainsSubmissionAdmin[]>([]);
  const [questions, setQuestions] = useState<MainsQuestionAdmin[]>([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    fetchAllQuestions()
      .then((res) => {
        if (res.success) setQuestions(res.questions);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const loadGraded = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetchGradedSubmissions(debouncedSearch, selectedQuestionId);
      if (res.success) {
        setSubmissions(res.submissions);
      }
    } catch {
      toast.error('Failed to load graded submissions.');
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, selectedQuestionId]);

  useEffect(() => {
    loadGraded();
  }, [loadGraded]);

  const handleDownload = async (
    id: string,
    type: 'student' | 'evaluated',
    filename: string
  ) => {
    try {
      await downloadCopyPdf(id, type, filename);
      toast.success(
        type === 'evaluated'
          ? 'Downloaded marked copy with annotations.'
          : 'Downloaded student original PDF.'
      );
    } catch {
      toast.error('Failed to download answer sheet PDF.');
    }
  };

  return (
    <div className="space-y-6 select-none pb-12">
      <div className="p-6 sm:p-8 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#34D399]/15 border border-[#34D399]/30 text-[#34D399] text-xs font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Evaluated Answer Archive</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#F7F3E6]">
            Graded Answer Copies & Feedback Archive
          </h1>
          <p className="text-xs text-[#A8A294] max-w-2xl leading-relaxed">
            Historical repository of evaluated student answer copies with marks scored, mentor margin annotations, rubric points, and structural remarks.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <select
            value={selectedQuestionId}
            onChange={(e) => setSelectedQuestionId(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-xs text-[#F7F3E6] focus:outline-none focus:border-[#C19B48] cursor-pointer"
          >
            <option value="all">All Challenges</option>
            {questions.map((q) => (
              <option key={q._id} value={q._id}>
                #{q.challengeNumber ?? 0} {q.questionCode}
              </option>
            ))}
          </select>

          <div className="relative w-60">
            <Search className="w-4 h-4 text-[#A8A294] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search student or code..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-xs text-[#F7F3E6] placeholder:text-[#A8A294] focus:outline-none focus:border-[#C19B48]"
            />
          </div>

          <button
            onClick={loadGraded}
            className="p-2 rounded-xl bg-[#262626] hover:bg-[#2F2F2F] text-[#A8A294] hover:text-[#F7F3E6] border border-[#3D3D3D] transition-colors cursor-pointer"
            title="Refresh Archive"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#34D399]' : ''}`} />
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#3D3D3D] bg-[#262626] text-[#A8A294] uppercase tracking-wider text-[10px] font-bold">
                <th className="py-3.5 px-4">Student & Roll No</th>
                <th className="py-3.5 px-4">Challenge</th>
                <th className="py-3.5 px-4">Score Awarded</th>
                <th className="py-3.5 px-4">Evaluator</th>
                <th className="py-3.5 px-4 max-w-[280px]">Mentor Remarks & Rubrics</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#3D3D3D]/60 text-[#F7F3E6]">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#A8A294]">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[#34D399]" />
                    <span>Loading evaluated copies...</span>
                  </td>
                </tr>
              ) : submissions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#A8A294]">
                    No evaluated answer copies found.
                  </td>
                </tr>
              ) : (
                submissions.map((sub) => {
                  const evaluatedDateStr = sub.evaluatedAt
                    ? new Date(sub.evaluatedAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : 'Recent';

                  return (
                    <tr key={sub._id} className="hover:bg-[#2F2F2F]/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-sm text-[#F7F3E6]">
                          {sub.student?.name || 'Aspirant'}
                        </div>
                        <div className="font-mono text-[11px] text-[#A8A294]">
                          {sub.student?.rollNo || sub.student?.email}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 max-w-[240px]">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="font-mono text-[10px] font-bold text-[#C19B48] bg-[#C19B48]/15 px-1.5 py-0.2 rounded">
                            #{sub.question?.challengeNumber ?? 0}
                          </span>
                          <span className="font-mono text-[10px] text-[#A8A294]">
                            {sub.question?.questionCode}
                          </span>
                        </div>
                        <div className="font-medium text-[#F7F3E6] truncate">
                          {sub.question?.title}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-serif text-base font-bold text-[#34D399]">
                          {sub.score} / {sub.maxScore || sub.question?.marks || 15}
                        </div>
                        <div className="text-[10px] text-[#A8A294]">{evaluatedDateStr}</div>
                      </td>

                      <td className="py-3.5 px-4 text-[#A8A294]">
                        {sub.evaluatedBy
                          ? `${sub.evaluatedBy.salutation || ''} ${sub.evaluatedBy.name}`
                          : 'Adv. Rajinder Sir'}
                      </td>

                      <td className="py-3.5 px-4 max-w-[280px]">
                        <div className="text-[#A8A294] line-clamp-2 italic mb-1">
                          &ldquo;{sub.remarks || 'Standard evaluation recorded.'}&rdquo;
                        </div>
                        {sub.rubricBreakdown && sub.rubricBreakdown.length > 0 && (
                          <div className="flex gap-1.5 flex-wrap">
                            {sub.rubricBreakdown.map((r, idx) => (
                              <span
                                key={idx}
                                className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#262626] text-[#C19B48] border border-[#3D3D3D]"
                              >
                                {r.label.slice(0, 12)}: {r.score}/{r.maxScore}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() =>
                              handleDownload(
                                sub._id,
                                'student',
                                sub.studentPdf?.originalName || 'answer_copy.pdf'
                              )
                            }
                            className="p-1.5 rounded-lg text-[#A8A294] hover:text-[#F7F3E6] hover:bg-[#2F2F2F] transition-colors cursor-pointer"
                            title="Download Student Copy"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>

                          {sub.evaluatedPdf && (
                            <button
                              onClick={() =>
                                handleDownload(
                                  sub._id,
                                  'evaluated',
                                  sub.evaluatedPdf!.originalName
                                )
                              }
                              className="px-2.5 py-1 rounded-lg bg-[#34D399]/20 border border-[#34D399]/40 text-[#34D399] font-semibold text-[11px] transition-colors cursor-pointer flex items-center gap-1"
                              title="Download Annotated Copy"
                            >
                              <FileCheck className="w-3 h-3" />
                              <span>Marked Copy</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

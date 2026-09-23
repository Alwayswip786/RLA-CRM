import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Plus,
  ArrowRight,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Loader2,
  X,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  fetchAdminLiveTests,
  createAdminLiveTest,
  togglePublishAdminLiveTest,
  freezeLeaderboardAdminLiveTest,
} from '../../services/adminLiveTest.service';
import type { AdminLiveMockTest, AdminCreateLiveTestPayload } from '../../types/adminLiveTest.types';

export const TestsAllPage: React.FC = () => {
  const [tests, setTests] = useState<AdminLiveMockTest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Form State
  const [formData, setFormData] = useState<AdminCreateLiveTestPayload>({
    testCode: '',
    title: '',
    targetExam: 'Delhi Judicial Services (DJS)',
    targetState: 'Delhi',
    syllabus: 'Full Syllabus: CPC, BNSS, BNS, Evidence, Constitution & Commercial Courts',
    windowStart: '',
    windowEnd: '',
    durationMinutes: 150,
    questionsCount: 200,
    maxScore: 200,
    marksPerCorrect: 1.0,
    negativeMarkWeight: 0.25,
    difficulty: 'hard',
  });

  const loadTests = async () => {
    try {
      setIsLoading(true);
      const data = await fetchAdminLiveTests();
      setTests(data);
    } catch (err) {
      console.error('Failed to load live tests:', err);
      toast.error('Failed to fetch mock tests catalog.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTests();
  }, []);

  const handleTogglePublish = async (test: AdminLiveMockTest) => {
    try {
      const res = await togglePublishAdminLiveTest(test._id);
      toast.success(res.message);
      setTests((prev) =>
        prev.map((t) => (t._id === test._id ? { ...t, isPublished: res.isPublished } : t))
      );
    } catch (err) {
      console.error('Failed to toggle publish:', err);
      toast.error('Failed to update publication status.');
    }
  };

  const handleToggleFreeze = async (test: AdminLiveMockTest) => {
    try {
      const res = await freezeLeaderboardAdminLiveTest(test._id);
      toast.success(res.message);
      setTests((prev) =>
        prev.map((t) =>
          t._id === test._id ? { ...t, isLeaderboardFrozen: res.isLeaderboardFrozen } : t
        )
      );
    } catch (err) {
      console.error('Failed to toggle leaderboard freeze:', err);
      toast.error('Failed to update leaderboard freeze state.');
    }
  };

  const handleCreateTest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      if (!formData.testCode || !formData.title || !formData.windowStart || !formData.windowEnd) {
        toast.error('Please complete all required fields.');
        return;
      }

      await createAdminLiveTest(formData);
      toast.success('Mock Test Paper scheduled & published successfully!');
      setIsModalOpen(false);
      loadTests();
    } catch (err: any) {
      console.error('Failed to create mock test:', err);
      toast.error(err?.response?.data?.message || 'Failed to schedule live mock test.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 select-none">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C19B48]/15 border border-[#C19B48]/30 text-[#C19B48] text-xs font-semibold">
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Prelims Exam Builder</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#F7F3E6]">
            Mock Test Papers & Exam Manager
          </h1>
          <p className="text-xs text-[#A8A294] max-w-2xl leading-relaxed">
            Create timed online prelims tests, calibrate negative marking schemes, publish automated answer keys, and track live student percentiles.
          </p>
        </div>

        <button
          onClick={() => {
            const now = new Date();
            const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
            const tomorrowEnd = new Date(now.getTime() + 32 * 60 * 60 * 1000);

            setFormData({
              testCode: `RLA-LIVE-${new Date().getFullYear()}-0${tests.length + 5}`,
              title: 'All-India Full Judiciary Prelims Mock',
              targetExam: 'Delhi Judicial Services (DJS)',
              targetState: 'Delhi',
              syllabus: 'Full Syllabus: CPC, BNSS, BNS, Evidence, Constitution & Commercial Courts',
              windowStart: tomorrow.toISOString().slice(0, 16),
              windowEnd: tomorrowEnd.toISOString().slice(0, 16),
              durationMinutes: 150,
              questionsCount: 200,
              maxScore: 200,
              marksPerCorrect: 1.0,
              negativeMarkWeight: 0.25,
              difficulty: 'hard',
            });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C19B48] hover:bg-[#D8B862] text-[#1E1E1E] text-xs font-bold transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create & Schedule Test</span>
        </button>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="p-6 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] space-y-4 animate-pulse h-48"
            >
              <div className="h-5 w-32 bg-[#2A2A2A] rounded" />
              <div className="h-7 w-64 bg-[#2A2A2A] rounded" />
              <div className="h-16 w-full bg-[#262626] rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Mock Tests List */}
      {!isLoading && (
        <div className="space-y-4">
          {tests.map((test) => (
            <div
              key={test._id}
              className="p-6 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] hover:border-[#C19B48]/50 transition-colors space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#C19B48] bg-[#C19B48]/15 px-2.5 py-0.5 rounded border border-[#C19B48]/30">
                    {test.testCode}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      test.status === 'live'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse'
                        : test.status === 'scheduled'
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : 'bg-slate-700/40 text-slate-400 border border-slate-600/30'
                    }`}
                  >
                    {test.status}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      test.isPublished
                        ? 'bg-[#34D399]/20 text-[#34D399] border border-[#34D399]/30'
                        : 'bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/30'
                    }`}
                  >
                    {test.isPublished ? 'Published' : 'Draft'}
                  </span>
                </div>
                <span className="text-xs text-[#34D399] font-medium bg-[#34D399]/10 px-2 py-0.5 rounded border border-[#34D399]/30">
                  {test.targetExam} • {test.targetState}
                </span>
              </div>

              <div>
                <h3 className="font-serif text-lg font-bold text-[#F7F3E6]">{test.title}</h3>
                <p className="text-xs text-[#A8A294] mt-1 leading-relaxed">{test.syllabus}</p>
              </div>

              {/* Timing & Meta Box */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-3.5 rounded-xl bg-[#262626] border border-[#3D3D3D] text-xs">
                <div>
                  <span className="text-[10px] text-[#A8A294] uppercase font-bold">Total MCQs</span>
                  <div className="font-bold text-[#F7F3E6] font-serif">
                    {test.questionsCount} Questions
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-[#A8A294] uppercase font-bold">Duration</span>
                  <div className="font-bold text-[#F7F3E6] font-serif">
                    {test.durationMinutes} Minutes
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-[#A8A294] uppercase font-bold">Negative Marking</span>
                  <div className="font-mono text-[#EF4444] font-bold">
                    -{test.negativeMarkWeight} Marks
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-[#A8A294] uppercase font-bold">Student Attempts</span>
                  <div className="font-bold text-[#34D399] font-serif">
                    {test.stats.totalAttempted} Candidates
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-[#A8A294] uppercase font-bold">Window Opening</span>
                  <div className="text-[11px] text-[#F7F3E6] font-mono">
                    {new Date(test.windowStart).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex flex-wrap items-center justify-between pt-1 gap-3 text-xs border-t border-[#2D2D2D]">
                <div className="flex items-center gap-4 text-[#A8A294]">
                  <span>
                    Average: <strong className="text-[#F7F3E6]">{test.stats.avgScore} pts</strong>
                  </span>
                  <span>
                    Top Score:{' '}
                    <strong className="text-[#C19B48]">{test.stats.topScore} pts</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleTogglePublish(test)}
                    className="px-3 py-1.5 rounded-lg bg-[#2A2A2A] hover:bg-[#383838] text-[#F7F3E6] font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    {test.isPublished ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{test.isPublished ? 'Unpublish' : 'Publish'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleFreeze(test)}
                    className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer ${
                      test.isLeaderboardFrozen
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : 'bg-[#2A2A2A] hover:bg-[#383838] text-[#F7F3E6]'
                    }`}
                  >
                    {test.isLeaderboardFrozen ? (
                      <Lock className="w-3.5 h-3.5" />
                    ) : (
                      <Unlock className="w-3.5 h-3.5" />
                    )}
                    <span>{test.isLeaderboardFrozen ? 'Ranks Frozen' : 'Freeze Ranks'}</span>
                  </button>

                  <a
                    href="/tests/rankings"
                    className="text-[#C19B48] hover:text-[#E8CF8D] font-bold flex items-center gap-1 ml-2"
                  >
                    <span>View Standings</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Live Test Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-xl bg-[#1E1E1E] border border-[#3D3D3D] rounded-3xl p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-150 my-8">
            <div className="flex items-center justify-between border-b border-[#3D3D3D] pb-4">
              <div>
                <h3 className="text-lg font-serif font-bold text-[#F7F3E6]">
                  Schedule New Live Mock Test
                </h3>
                <p className="text-xs text-[#A8A294]">
                  Define the availability window, question pool size, and negative penalty weight.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTest} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-[#A8A294] uppercase block mb-1">
                    Test Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.testCode}
                    onChange={(e) => setFormData({ ...formData, testCode: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-xs text-[#F7F3E6] font-mono focus:border-[#C19B48] outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#A8A294] uppercase block mb-1">
                    Target State *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.targetState}
                    onChange={(e) => setFormData({ ...formData, targetState: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-xs text-[#F7F3E6] focus:border-[#C19B48] outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#A8A294] uppercase block mb-1">
                  Test Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-xs text-[#F7F3E6] focus:border-[#C19B48] outline-hidden"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#A8A294] uppercase block mb-1">
                  Target Exam *
                </label>
                <input
                  type="text"
                  required
                  value={formData.targetExam}
                  onChange={(e) => setFormData({ ...formData, targetExam: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-xs text-[#F7F3E6] focus:border-[#C19B48] outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-[#A8A294] uppercase block mb-1">
                    Window Start Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.windowStart}
                    onChange={(e) => setFormData({ ...formData, windowStart: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-xs text-[#F7F3E6] focus:border-[#C19B48] outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#A8A294] uppercase block mb-1">
                    Window End Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.windowEnd}
                    onChange={(e) => setFormData({ ...formData, windowEnd: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-xs text-[#F7F3E6] focus:border-[#C19B48] outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-[#A8A294] uppercase block mb-1">
                    Questions *
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={300}
                    required
                    value={formData.questionsCount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        questionsCount: Number(e.target.value),
                        maxScore: Number(e.target.value) * formData.marksPerCorrect,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-xs text-[#F7F3E6] font-mono focus:border-[#C19B48] outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#A8A294] uppercase block mb-1">
                    Duration (Mins) *
                  </label>
                  <input
                    type="number"
                    min={15}
                    max={240}
                    required
                    value={formData.durationMinutes}
                    onChange={(e) =>
                      setFormData({ ...formData, durationMinutes: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-xs text-[#F7F3E6] font-mono focus:border-[#C19B48] outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#A8A294] uppercase block mb-1">
                    Negative Penalty *
                  </label>
                  <select
                    value={formData.negativeMarkWeight}
                    onChange={(e) =>
                      setFormData({ ...formData, negativeMarkWeight: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-xs text-[#F7F3E6] focus:border-[#C19B48] outline-hidden"
                  >
                    <option value={0.25}>-0.25 (1/4th)</option>
                    <option value={0.33}>-0.33 (1/3rd)</option>
                    <option value={0.20}>-0.20 (1/5th)</option>
                    <option value={0}>0.00 (No Negative)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#A8A294] uppercase block mb-1">
                  Syllabus Description *
                </label>
                <textarea
                  rows={2}
                  required
                  value={formData.syllabus}
                  onChange={(e) => setFormData({ ...formData, syllabus: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-xs text-[#F7F3E6] focus:border-[#C19B48] outline-hidden resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#3D3D3D]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#3D3D3D] text-xs font-semibold text-[#A8A294] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#C19B48] hover:bg-[#D8B862] text-[#1E1E1E] text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Schedule & Publish</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

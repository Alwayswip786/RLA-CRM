import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Scale,
  BookOpen,
  Award,
  FileCheck,
  Calendar,
  ArrowRight,
  TrendingUp,
  Play,
  UploadCloud,
  Clock,
  CheckCircle2,
  Bookmark,
  ChevronRight,
  MessageSquare,
  Flame,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '../store/useAuthStore';

interface StudentSession {
  name: string;
  rollNo: string;
  email?: string;
  phone?: string;
  targetExam: string;
}

export const DashboardPreview: React.FC = () => {
  const navigate = useNavigate();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const user = useAuthStore((state) => state.user);

  const student: StudentSession = {
    name: user?.name || 'Adv. Rohit Verma',
    rollNo: user?.rollNo || 'RLA2025019',
    targetExam: user?.targetExam || 'Judicial Services (PCS-J)',
  };

  const handleBookmarkToggle = () => {
    setIsBookmarked(!isBookmarked);
    toast.success(
      !isBookmarked
        ? 'Landmark Judgment saved to your Legal Vault'
        : 'Removed from Bookmarks Vault',
      { duration: 2500 }
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* 1. Hero Welcome & State Exam Countdowns Ticker */}
      <div className="relative rounded-2xl bg-gradient-to-r from-[#0a1c36] via-[#0e274b] to-[#143564] text-white border border-[#c19b48]/30 p-6 sm:p-8 shadow-xl overflow-hidden">
        {/* Background Roman Scales Watermark */}
        <div className="hidden lg:block absolute right-6 top-1/2 -translate-y-1/2 opacity-10 pointer-events-none select-none">
          <Scale className="w-56 h-56 text-[#c19b48]" />
        </div>

        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#c19b48]/20 border border-[#c19b48]/40 text-[#e8cf8d] text-xs font-semibold">
              <Scale className="w-3.5 h-3.5 text-[#c19b48]" />
              <span>Target: {student.targetExam}</span>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs text-slate-200">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Academic Session 2025–2026</span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-white leading-tight">
            Welcome to Your Legal Chambers, {student.name}
          </h1>
          <p className="text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
            Batch: <strong className="text-white">PCS-J Comprehensive Foundation 2025-26</strong> • Roll No:{' '}
            <strong className="text-[#e8cf8d] font-mono">{student.rollNo}</strong> • Mentor:{' '}
            <strong className="text-amber-300">Adv. Rajinder Sir</strong>
          </p>
        </div>
      </div>

      {/* 2. Core KPI Performance Ribbon (Uniform 4-Column Grid) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Attendance */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] shadow-xs transition-colors flex flex-col justify-between h-full">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
            <span className="font-medium">Chamber Attendance</span>
            <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-[#c19b48]/20">
              <Calendar className="w-4 h-4 text-[#c19b48]" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white font-serif">92.4%</div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>Eligible for Certificate & Tests</span>
          </div>
        </div>

        {/* Mains Evaluated */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] shadow-xs transition-colors flex flex-col justify-between h-full">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
            <span className="font-medium">Mains Copies Evaluated</span>
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/30">
              <FileCheck className="w-4 h-4 text-blue-500 dark:text-blue-400" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white font-serif">14 Copies</div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-slate-600 dark:text-slate-300">
            <span>Avg: <strong>72/100</strong> • Last: <strong>76/100</strong></span>
          </div>
        </div>

        {/* Prelims Accuracy */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] shadow-xs transition-colors flex flex-col justify-between h-full">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
            <span className="font-medium">Prelims Accuracy</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
              <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white font-serif">86.4%</div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-[#c19b48] dark:text-[#e8cf8d] font-semibold">
            <Flame className="w-3.5 h-3.5 text-[#c19b48] shrink-0" />
            <span>Cohort Standing: Rank #12</span>
          </div>
        </div>

        {/* Bare Acts Covered */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] shadow-xs transition-colors flex flex-col justify-between h-full">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
            <span className="font-medium">Bare Acts Covered</span>
            <div className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/30">
              <BookOpen className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white font-serif">8 / 14 Acts</div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-slate-600 dark:text-slate-300">
            <span>BNS, BNSS, BSA, CPC, ICA...</span>
          </div>
        </div>
      </div>

      {/* 3. Featured Spotlight: "Continue Where You Left Off" Active Course Player Card */}
      <div className="rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] p-5 sm:p-6 shadow-xs transition-colors">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-50 dark:bg-[#c19b48]/20 text-[#c19b48] dark:text-[#e8cf8d]">
              <Play className="w-4 h-4 fill-current" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Continue Learning
            </span>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            Last active 45 mins ago
          </span>
        </div>

        <div className="p-4 sm:p-5 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564]/70">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-3xl">
              <div className="inline-flex items-center gap-2">
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  Module 4 • Evidence Law
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Bharatiya Sakshya Adhiniyam, 2023
                </span>
              </div>
              <h3 className="font-serif text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                Lecture 14: Estoppel (Sec 115–117) vs Res Judicata (CPC Sec 11)
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Instructor: Adv. Rajinder Sir • Comprehensive comparison of rule of evidence vs rule of procedure with leading Supreme Court precedents.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/dashboard/courses/pcs-j-foundation/learn/bsa-14')}
              className="px-5 py-3 rounded-xl bg-[#c19b48] hover:bg-[#d8b862] text-[#061120] font-bold text-xs cursor-pointer transition-all flex items-center justify-center gap-2 shadow-sm shrink-0 self-start lg:self-auto"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Resume Lecture</span>
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-[#143564]/50">
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 mb-1.5">
              <span>Progress: <strong>28:14 / 54:00 mins</strong></span>
              <span className="font-semibold text-[#c19b48] dark:text-[#e8cf8d]">68% Completed</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-[#040b14] overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#c19b48] to-[#e8cf8d] rounded-full w-[68%]" />
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-xs pt-1">
          <span className="text-slate-500 dark:text-slate-400">
            Course: <strong>PCS-J Comprehensive Foundation 2025-26</strong>
          </span>
          <button
            type="button"
            onClick={() => navigate('/dashboard/courses/pcs-j-foundation')}
            className="text-[#c19b48] hover:text-[#a47d31] dark:hover:text-[#e8cf8d] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>Full Syllabus & Notes</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 4. Balanced Command Center Grid (Uniform 2-Column Modular Cards) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Row 1 Left: Today's Mains Answer Writing Challenge */}
        <div className="rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] p-5 sm:p-6 shadow-xs transition-colors flex flex-col justify-between h-full">
          <div>
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400">
                  <FileText className="w-4 h-4" />
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Today's Mains Challenge #48
                  </span>
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-semibold bg-amber-50 dark:bg-amber-950/30 px-2.5 py-1 rounded-lg border border-amber-200/60 dark:border-amber-900/40">
                <Clock className="w-3.5 h-3.5" />
                <span>Due in 3h 45m (11:59 PM)</span>
              </div>
            </div>

            {/* Question Box */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564]/70 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Paper: Criminal Law & Procedure (Mains)
                </span>
                <span className="px-2 py-0.5 rounded bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] font-mono text-[11px] text-[#c19b48] font-bold">
                  15 Marks • 250 Words
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-900 dark:text-slate-100 leading-relaxed font-serif">
                "Discuss the evidentiary admissibility of a statement leading to the discovery of a fact under Section 27 of the Indian Evidence Act, 1872 (now Section 23 of the Bharatiya Sakshya Adhiniyam, 2023). In light of landmark Supreme Court jurisprudence, examine whether Section 27 violates the fundamental right against self-incrimination guaranteed under Article 20(3) of the Constitution."
              </p>

              <div className="pt-2 text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-200/70 dark:border-[#143564]/60">
                Evaluator: <strong className="text-slate-800 dark:text-slate-200">Adv. Rajinder Sir</strong> • Detailed marginal feedback within 24h
              </div>
            </div>
          </div>

          {/* Footer Action Bar */}
          <div className="pt-4 mt-4 flex items-center justify-between gap-3 border-t border-slate-200 dark:border-[#143564]/60">
            <button
              type="button"
              onClick={() => navigate('/dashboard/mains/evaluated')}
              className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>Past Copies</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => navigate('/dashboard/mains/submit')}
              className="px-4 py-2 rounded-xl bg-[#c19b48] hover:bg-[#d8b862] text-[#061120] font-bold text-xs cursor-pointer transition-all flex items-center gap-1.5 shadow-xs"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Upload Answer Copy</span>
            </button>
          </div>
        </div>

        {/* Row 1 Right: Faculty Feedback & Copy Remarks */}
        <div className="rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] p-5 sm:p-6 shadow-xs transition-colors flex flex-col justify-between h-full">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Faculty Copy Remarks
                </span>
              </div>
              <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30 px-2.5 py-1 rounded-lg border border-purple-200/60 dark:border-purple-900/40">
                Mentor: Adv. Rajinder Sir
              </span>
            </div>

            {/* Content Box */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564]/70 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900 dark:text-white">
                  Criminal Law Mock Test #3
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-bold font-mono text-[11px]">
                  Score: 76 / 100
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 italic border-l-2 border-[#c19b48] pl-3 py-1 leading-relaxed bg-amber-50/40 dark:bg-amber-950/10 rounded-r-lg">
                "Impressive analysis of Section 300 CrPC harmonized with Article 20(2). Work on conciseness in Problem 3 to save time for procedural questions."
              </p>

              <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                <div className="p-2 rounded-lg bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564]">
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">Legal Doctrine</div>
                  <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">38 / 50</div>
                </div>
                <div className="p-2 rounded-lg bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564]">
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">Case Application</div>
                  <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">22 / 30</div>
                </div>
                <div className="p-2 rounded-lg bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564]">
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">Structuring</div>
                  <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">16 / 20</div>
                </div>
              </div>

              <div className="pt-2 text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-200/70 dark:border-[#143564]/60">
                Marked copy with handwritten margin feedback and model benchmark
              </div>
            </div>
          </div>

          {/* Footer Action Bar */}
          <div className="pt-4 mt-4 flex items-center justify-between gap-3 border-t border-slate-200 dark:border-[#143564]/60">
            <button
              type="button"
              onClick={() => navigate('/dashboard/mains/evaluated')}
              className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>All Evaluated Copies</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => navigate('/dashboard/mains/evaluated')}
              className="px-4 py-2 rounded-xl bg-white dark:bg-[#0a1c36] hover:bg-slate-100 dark:hover:bg-[#143564] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-[#143564] font-semibold text-xs cursor-pointer transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <FileText className="w-3.5 h-3.5 text-[#c19b48]" />
              <span>View Evaluated Copy PDF</span>
            </button>
          </div>
        </div>

        {/* Row 2 Left: Landmark Judgment & Legal Ratio of the Day */}
        <div className="rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] p-5 sm:p-6 shadow-xs transition-colors flex flex-col justify-between h-full">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400">
                  <Scale className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Landmark Judgment of the Day
                </span>
              </div>
              <button
                type="button"
                onClick={handleBookmarkToggle}
                className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                  isBookmarked
                    ? 'bg-[#c19b48]/20 border-[#c19b48] text-[#c19b48]'
                    : 'border-slate-200 dark:border-[#143564] text-slate-400 hover:text-slate-600 dark:hover:text-white'
                }`}
                title={isBookmarked ? 'Saved to Bookmarks' : 'Bookmark this case'}
              >
                <Bookmark className="w-4 h-4 fill-current" />
              </button>
            </div>

            {/* Content Box */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564]/70 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-serif font-bold text-slate-900 dark:text-white">
                  Selvi & Ors. v. State of Karnataka (2010) 7 SCC 263
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-[#0a1c36] text-slate-700 dark:text-slate-300 font-medium">
                  3-Judge Bench
                </span>
              </div>

              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed pt-1">
                <div className="flex items-start gap-2">
                  <span className="text-[#c19b48] font-bold shrink-0">•</span>
                  <span>
                    <strong>Article 20(3) Violation:</strong> Involuntary administration of Narco-Analysis, Polygraph (Lie-Detector), and BEAP tests violates the right against forced self-incrimination.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[#c19b48] font-bold shrink-0">•</span>
                  <span>
                    <strong>Article 21 & Privacy:</strong> Compelling an individual to undergo intrusive psychological interrogation is an invasion of mental privacy and bodily autonomy.
                  </span>
                </div>
              </div>

              {/* Cross References */}
              <div className="pt-2 flex flex-wrap items-center gap-1.5 border-t border-slate-200 dark:border-[#143564]/60">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300">
                  Art. 20(3)
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                  Sec 161 CrPC / Sec 175 BNSS
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                  Sec 27 IEA / Sec 23 BSA
                </span>
              </div>
            </div>
          </div>

          {/* Footer Action Bar */}
          <div className="pt-4 mt-4 flex items-center justify-between gap-3 border-t border-slate-200 dark:border-[#143564]/60">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Constitutional Criminal Jurisprudence
            </span>
            <button
              type="button"
              onClick={() => navigate('/dashboard/judgments')}
              className="text-xs font-semibold text-[#c19b48] hover:text-[#a47d31] dark:hover:text-[#e8cf8d] flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>Full Judgment Analysis</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Row 2 Right: Upcoming All-India Mock Series Card */}
        <div className="rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] p-5 sm:p-6 shadow-xs transition-colors flex flex-col justify-between h-full">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-[#c19b48]/20 text-[#c19b48] dark:text-[#e8cf8d]">
                  <Award className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  All-India Mock Series
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-950/30 px-2.5 py-1 rounded-lg border border-blue-200/60 dark:border-blue-900/40">
                <Calendar className="w-3.5 h-3.5" />
                <span>Sunday • 10:00 AM</span>
              </div>
            </div>

            {/* Content Box */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564]/70 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  BNS & Criminal Procedure Full Mock #4
                </h3>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-bold">
                  Prelims Simulation
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                100 MCQs with negative marking. Comprehensive coverage of Bharatiya Nyaya Sanhita general exceptions and BNSS arrest procedures.
              </p>

              <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                <div className="p-2 rounded-lg bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564]">
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">Questions</div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white font-mono">100 MCQs</div>
                </div>
                <div className="p-2 rounded-lg bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564]">
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">Duration</div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white font-mono">120 Mins</div>
                </div>
                <div className="p-2 rounded-lg bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564]">
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">Marking</div>
                  <div className="text-xs font-bold text-amber-600 dark:text-amber-400 font-mono">-0.25 Neg</div>
                </div>
              </div>

              <div className="pt-2 text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-200/70 dark:border-[#143564]/60">
                All-India percentile & comprehensive test analysis generated instantly
              </div>
            </div>
          </div>

          {/* Footer Action Bar */}
          <div className="pt-4 mt-4 flex items-center justify-between gap-3 border-t border-slate-200 dark:border-[#143564]/60">
            <button
              type="button"
              onClick={() => navigate('/dashboard/tests/mock-series')}
              className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>Full Test Calendar</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => navigate('/dashboard/tests/mock-series')}
              className="px-4 py-2 rounded-xl bg-[#c19b48] hover:bg-[#d8b862] text-[#061120] font-bold text-xs cursor-pointer transition-all flex items-center gap-1.5 shadow-xs"
            >
              <span>Enter Test Room</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
      </div>
  );
};

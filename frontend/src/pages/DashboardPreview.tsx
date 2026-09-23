import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Scale,
  FileCheck,
  ArrowRight,
  Play,
  UploadCloud,
  Clock,
  CheckCircle2,
  AlertCircle,
  Bookmark,
  ChevronRight,
  Flame,
  FileText,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { fetchDashboardKpiMetrics, type DashboardKpiMetricsData } from '../services/dashboard.service';
import { fetchTodayChallenge } from '../services/mains.service';
import type { MainsQuestion, MainsSubmission, DeadlineInfo } from '../types/mains.types';
import { fetchTodayDailyJudgement } from '../services/judgement.service';
import type { JudgementDigest } from '../types/judgement.types';
import { useBookmarkStore } from '../store/useBookmarkStore';
import { JudgementAnalysisModal } from '../components/judgement/JudgementAnalysisModal';
import { Skeleton, KpiCardSkeleton, MainsChallengeSkeleton } from '../components/ui/skeleton';
import { KpiCard, KpiGrid } from '../components/dashboard/KpiCard';

interface StudentSession {
  name: string;
  rollNo: string;
  email?: string;
  phone?: string;
  targetExam: string;
}

export const DashboardPreview: React.FC = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<DashboardKpiMetricsData | null>(null);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState<boolean>(true);
  const [todayChallenge, setTodayChallenge] = useState<MainsQuestion | null>(null);
  const [todaySubmission, setTodaySubmission] = useState<MainsSubmission | null>(null);
  const [deadlineInfo, setDeadlineInfo] = useState<DeadlineInfo | null>(null);
  const [isLoadingChallenge, setIsLoadingChallenge] = useState<boolean>(true);

  // Dynamic Landmark Judgment of the Day state
  const [dailyJudgement, setDailyJudgement] = useState<JudgementDigest | null>(null);
  const [isLoadingJudgement, setIsLoadingJudgement] = useState<boolean>(true);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState<boolean>(false);

  const { isBookmarked: checkBookmarked, toggleBookmark } = useBookmarkStore();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        setIsLoadingMetrics(true);
        setIsLoadingChallenge(true);
        setIsLoadingJudgement(true);
        const [kpiData, challengeRes, judgementRes] = await Promise.allSettled([
          fetchDashboardKpiMetrics(),
          fetchTodayChallenge(),
          fetchTodayDailyJudgement(),
        ]);

        if (isMounted) {
          if (kpiData.status === 'fulfilled') {
            setMetrics(kpiData.value);
          }
          if (challengeRes.status === 'fulfilled' && challengeRes.value.success) {
            setTodayChallenge(challengeRes.value.question);
            setTodaySubmission(challengeRes.value.submission);
            setDeadlineInfo(challengeRes.value.deadlineInfo || null);
          }
          if (judgementRes.status === 'fulfilled' && judgementRes.value.success) {
            setDailyJudgement(judgementRes.value.judgment);
          }
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        if (isMounted) {
          setIsLoadingMetrics(false);
          setIsLoadingChallenge(false);
          setIsLoadingJudgement(false);
        }
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const student: StudentSession = {
    name: user?.name || 'Adv. Rohit Verma',
    rollNo: user?.rollNo || 'RLA2025019',
    targetExam: user?.targetExam || 'Judicial Services (PCS-J)',
  };

  const isCaseBookmarked = dailyJudgement ? checkBookmarked(dailyJudgement._id) : false;

  const handleBookmarkToggle = async () => {
    if (!dailyJudgement) return;
    await toggleBookmark({
      itemType: 'Judgment',
      itemId: dailyJudgement._id,
      title: dailyJudgement.title,
      source: `${dailyJudgement.citation} | ${dailyJudgement.court}`,
      subject: dailyJudgement.category || dailyJudgement.subject || 'Constitutional Criminal Jurisprudence',
      annotation: dailyJudgement.summary ? dailyJudgement.summary.slice(0, 160) + '...' : '',
      tags: dailyJudgement.tags,
      metadata: {
        citation: dailyJudgement.citation,
        court: dailyJudgement.court,
        bench: dailyJudgement.benchStrength || dailyJudgement.bench,
        year: dailyJudgement.year,
        targetRoute: '/dashboard/judgments',
      },
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* 1. Hero Welcome & State Exam Countdowns Ticker */}
      <div className="relative rounded-2xl bg-gradient-to-r from-[#0a1c36] via-[#0e274b] to-[#143564] text-white border border-[#c19b48]/30 p-4 sm:p-8 shadow-xl overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-xl sm:text-3xl lg:text-4xl font-serif font-bold text-white leading-tight">
            Welcome to Your Legal Chambers, {student.name}
          </h1>
          <div className="flex flex-col gap-1 text-xs sm:text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
            <div>
              Batch: <strong className="text-white">PCS-J Comprehensive Foundation 2025-26</strong>
            </div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span>
                Roll No: <strong className="text-[#e8cf8d] font-mono">{student.rollNo}</strong>
              </span>
              <span className="text-slate-400">•</span>
              <span>
                Mentor: <strong className="text-amber-300">Adv. Rajinder Sir</strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Core KPI Performance Ribbon */}
      <KpiGrid>
        {isLoadingMetrics || !metrics ? (
          <KpiCardSkeleton count={4} />
        ) : (
          <>
            {/* Attendance */}
            <KpiCard
              title="Chamber Attendance"
              value={metrics.attendance.percentageFormatted}
              subtitle={metrics.attendance.statusText}
              icon={
                metrics.attendance.isEligible ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                )
              }
              subtitleColor={
                metrics.attendance.isEligible
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-amber-600 dark:text-amber-400'
              }
            />

            {/* Mains Copies */}
            <KpiCard
              title="Mains Copies"
              value={metrics.mains.evaluatedCopiesFormatted}
              subtitle={
                metrics.mains.evaluatedCopies > 0 ? (
                  <span>
                    Avg: <strong>{metrics.mains.averageScore}</strong> • Last: <strong>{metrics.mains.lastScore}</strong>
                  </span>
                ) : (
                  metrics.mains.subtitle
                )
              }
            />

            {/* Prelims Accuracy */}
            <KpiCard
              title="Prelims Accuracy"
              value={metrics.prelims.accuracyFormatted}
              subtitle={metrics.prelims.subtitle}
              icon={<Flame className="w-3.5 h-3.5 text-[#c19b48]" />}
              subtitleColor="text-[#c19b48] dark:text-[#e8cf8d] font-semibold"
            />

            {/* Bare Acts Covered */}
            <KpiCard
              title="Bare Acts"
              value={metrics.bareActs.displayValue}
              subtitle={metrics.bareActs.subtitle}
            />
          </>
        )}
      </KpiGrid>

      {/* 3. Featured Spotlight: "Continue Where You Left Off" Active Course Player Card */}
      <div className="rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] p-3.5 sm:p-5 md:p-6 shadow-xs transition-colors">
        {/* Header Row: Title & Activity Timestamp */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5 sm:mb-4">
          <div className="flex items-center gap-2 min-w-0">
            <span className="p-1.5 rounded-lg bg-amber-50 dark:bg-[#c19b48]/20 text-[#c19b48] dark:text-[#e8cf8d] shrink-0">
              <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 truncate">
              Continue Learning
            </span>
          </div>
          <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 shrink-0 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 inline-block animate-pulse" />
            <span className="whitespace-nowrap">Last active 45 mins ago</span>
          </span>
        </div>

        {/* Inner Card: Lecture Details, Action, Progress */}
        <div className="p-3.5 sm:p-4 md:p-5 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564]/70">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 sm:gap-4">
            {/* Left Column: Module, Subject, Title, Description */}
            <div className="space-y-2 sm:space-y-2.5 max-w-3xl min-w-0">
              {/* Module Badge & Subject (Wraps cleanly on mobile) */}
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shrink-0 tracking-wide">
                  Module 4 • Evidence Law
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium min-w-0 break-words">
                  Bharatiya Sakshya Adhiniyam, 2023
                </span>
              </div>

              {/* Lecture Title */}
              <h3 className="font-serif text-sm sm:text-base lg:text-lg font-bold text-slate-900 dark:text-white leading-snug break-words">
                Lecture 14: Estoppel (Sec 115–117) vs Res Judicata (CPC Sec 11)
              </h3>

              {/* Instructor & Description */}
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed break-words">
                Instructor: Adv. Rajinder Sir • Comprehensive comparison of rule of evidence vs rule of procedure with leading Supreme Court precedents.
              </p>
            </div>

            {/* Primary Action Button (Full-width touch target on mobile, auto-width on tablet/desktop) */}
            <button
              type="button"
              onClick={() => navigate('/dashboard/courses/pcs-j-foundation/learn/bsa-14')}
              className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 sm:py-3 rounded-xl bg-[#c19b48] hover:bg-[#d8b862] active:scale-[0.99] text-[#061120] font-bold text-xs sm:text-sm cursor-pointer transition-all flex items-center justify-center gap-2 shadow-sm shrink-0 self-stretch sm:self-start lg:self-center"
            >
              <Play className="w-4 h-4 fill-current shrink-0" />
              <span>Resume Lecture</span>
            </button>
          </div>

          {/* Progress Bar & Timestamp Row */}
          <div className="mt-3.5 sm:mt-4 pt-3 border-t border-slate-200 dark:border-[#143564]/50">
            <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs text-slate-600 dark:text-slate-400 mb-1.5">
              <span className="min-w-0 break-words">
                Progress: <strong className="text-slate-800 dark:text-slate-200 font-semibold font-mono">28:14 / 54:00 mins</strong>
              </span>
              <span className="font-bold font-mono text-[#c19b48] dark:text-[#e8cf8d] shrink-0">
                68% Completed
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-[#040b14] overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#c19b48] to-[#e8cf8d] rounded-full transition-all duration-500"
                style={{ width: '68%' }}
              />
            </div>
          </div>
        </div>

        {/* Footer: Course Context & Action Link (Stacked on mobile, row on tablet/desktop) */}
        <div className="mt-3.5 sm:mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 text-xs pt-0.5">
          <span className="text-slate-500 dark:text-slate-400 min-w-0 break-words">
            Course: <strong className="text-slate-800 dark:text-slate-200 font-semibold">PCS-J Comprehensive Foundation 2025-26</strong>
          </span>
          <button
            type="button"
            onClick={() => navigate('/dashboard/courses/pcs-j-foundation')}
            className="text-[#c19b48] hover:text-[#a47d31] dark:hover:text-[#e8cf8d] font-semibold text-xs inline-flex items-center gap-1 self-start sm:self-auto shrink-0 transition-colors cursor-pointer group"
          >
            <span>Full Syllabus & Notes</span>
            <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>

      {/* 4. Command Center: Mains Challenge & Landmark Judgment in Flex */}
      <div className="flex flex-col lg:flex-row gap-6 items-stretch">
        {/* Today's Mains Answer Writing Challenge */}
        <div className="flex-1 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] p-5 sm:p-6 shadow-xs transition-colors flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400">
                  <FileText className="w-4 h-4" />
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Today's Mains Challenge #{todayChallenge?.challengeNumber ?? 48}
                  </span>
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                </div>
              </div>
              <div
                className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border ${
                  deadlineInfo?.isPassed
                    ? 'text-slate-500 bg-slate-100 dark:bg-slate-800/40 border-slate-300 dark:border-slate-700'
                    : 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border-amber-200/60 dark:border-amber-900/40'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{deadlineInfo?.formattedText || 'Due in 3h 45m (11:59 PM)'}</span>
              </div>
            </div>

            {/* Question Box */}
            {isLoadingChallenge || !todayChallenge ? (
              <MainsChallengeSkeleton />
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564]/70 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Paper: {todayChallenge.paper || 'Criminal Law & Procedure (Mains)'}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] font-mono text-[11px] text-[#c19b48] font-bold">
                    {todayChallenge.marks ?? 15} Marks • {todayChallenge.wordLimit ?? 250} Words
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-900 dark:text-slate-100 leading-relaxed font-serif">
                  "{todayChallenge.title || 'Discuss the evidentiary admissibility of a statement leading to the discovery of a fact under Section 27 of the Indian Evidence Act, 1872 (now Section 23 of the Bharatiya Sakshya Adhiniyam, 2023).'}"
                </p>

                <div className="pt-2 text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-200/70 dark:border-[#143564]/60">
                  Evaluator: <strong className="text-slate-800 dark:text-slate-200">{todayChallenge.evaluatorName || 'Adv. Rajinder Sir'}</strong> • Detailed marginal feedback within {todayChallenge.turnaroundHours ?? 24}h
                </div>
              </div>
            )}
          </div>

          {/* Footer Action Bar */}
          <div className="pt-4 mt-4 flex flex-wrap items-center justify-between gap-2.5 border-t border-slate-200 dark:border-[#143564]/60">
            <button
              type="button"
              onClick={() => navigate('/dashboard/mains/evaluated')}
              className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>Past Copies</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            {todaySubmission?.status === 'evaluated' ? (
              <button
                type="button"
                onClick={() => navigate('/dashboard/mains/evaluated')}
                className="px-3.5 sm:px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer transition-all flex items-center gap-1.5 shadow-xs"
              >
                <FileCheck className="w-3.5 h-3.5 shrink-0" />
                <span>View Graded Copy ({todaySubmission.score}/{todaySubmission.maxScore})</span>
              </button>
            ) : todaySubmission ? (
              <button
                type="button"
                onClick={() => navigate('/dashboard/mains/questions')}
                className="px-3.5 sm:px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs cursor-pointer transition-all flex items-center gap-1.5 shadow-xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Copy Submitted (v{todaySubmission.version || 1}) • Replace</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/dashboard/mains/questions')}
                className="px-3.5 sm:px-4 py-2 rounded-xl bg-[#c19b48] hover:bg-[#d8b862] text-[#061120] font-bold text-xs cursor-pointer transition-all flex items-center gap-1.5 shadow-xs"
              >
                <UploadCloud className="w-3.5 h-3.5 shrink-0" />
                <span>Upload Answer Copy</span>
              </button>
            )}
          </div>
        </div>

        {/* Landmark Judgment & Legal Ratio of the Day */}
        <div className="flex-1 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] p-5 sm:p-6 shadow-xs transition-colors flex flex-col justify-between">
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
                  isCaseBookmarked
                    ? 'bg-[#c19b48]/20 border-[#c19b48] text-[#c19b48]'
                    : 'border-slate-200 dark:border-[#143564] text-slate-400 hover:text-slate-600 dark:hover:text-white'
                }`}
                title={isCaseBookmarked ? 'Saved in Starred Vault' : 'Bookmark this case'}
              >
                <Bookmark className="w-4 h-4 fill-current" />
              </button>
            </div>

            {/* Content Box */}
            {isLoadingJudgement ? (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564]/70 space-y-3" aria-hidden="true">
                <Skeleton className="h-5 w-3/4" />
                <div className="space-y-2 pt-1">
                  <Skeleton className="h-3.5 w-full" />
                  <Skeleton className="h-3.5 w-5/6" />
                </div>
                <div className="pt-2 flex gap-2 border-t border-slate-200 dark:border-[#143564]/60">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-28" />
                </div>
              </div>
            ) : dailyJudgement ? (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564]/70 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-serif font-bold text-slate-900 dark:text-white">
                    {dailyJudgement.title} {dailyJudgement.citation ? (dailyJudgement.title.includes(dailyJudgement.citation) ? '' : `${dailyJudgement.citation.startsWith('(') ? '' : '('}${dailyJudgement.citation}${dailyJudgement.citation.endsWith(')') ? '' : ')'}`) : ''}
                  </span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-[#0a1c36] text-slate-700 dark:text-slate-300 font-medium shrink-0">
                    {dailyJudgement.benchStrength || dailyJudgement.bench || '3-Judge Bench'}
                  </span>
                </div>

                {/* Key Principles / Bullets */}
                <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed pt-1">
                  {dailyJudgement.keyHoldings && dailyJudgement.keyHoldings.length > 0 ? (
                    dailyJudgement.keyHoldings.slice(0, 2).map((holding, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className="text-[#c19b48] font-bold shrink-0">•</span>
                        <span>
                          <strong>{holding.title.endsWith(':') ? holding.title : `${holding.title}:`}</strong> {holding.text}
                        </span>
                      </div>
                    ))
                  ) : dailyJudgement.ratioDecidendi && dailyJudgement.ratioDecidendi.length > 0 ? (
                    dailyJudgement.ratioDecidendi.slice(0, 2).map((ratio, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className="text-[#c19b48] font-bold shrink-0">•</span>
                        <span>
                          <strong>Holding #{idx + 1}:</strong> {ratio}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-500">{dailyJudgement.summary}</p>
                  )}
                </div>

                {/* Cross References Pills */}
                <div className="pt-2 flex flex-wrap items-center gap-1.5 border-t border-slate-200 dark:border-[#143564]/60">
                  {dailyJudgement.provisions && dailyJudgement.provisions.length > 0 ? (
                    dailyJudgement.provisions.map((p, idx) => {
                      const colorMap = {
                        amber: 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300',
                        blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
                        emerald: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
                        purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
                        slate: 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
                      };
                      const colorClass = p.badgeColor && colorMap[p.badgeColor] ? colorMap[p.badgeColor] : colorMap.amber;
                      return (
                        <span key={idx} className={`text-[10px] font-semibold px-2 py-0.5 rounded ${colorClass}`}>
                          {p.label}
                        </span>
                      );
                    })
                  ) : dailyJudgement.legalProvisions && dailyJudgement.legalProvisions.length > 0 ? (
                    dailyJudgement.legalProvisions.map((lp, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300"
                      >
                        {lp}
                      </span>
                    ))
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-400">
                No Landmark Judgment scheduled for today.
              </div>
            )}
          </div>

          {/* Footer Action Bar */}
          <div className="pt-3.5 sm:pt-4 mt-3.5 sm:mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 border-t border-slate-200 dark:border-[#143564]/60">
            <span className="text-xs text-slate-500 dark:text-slate-400 min-w-0 break-words leading-relaxed font-medium">
              {dailyJudgement?.category || dailyJudgement?.subject || 'Constitutional Criminal Jurisprudence'}
            </span>
            <button
              type="button"
              onClick={() => {
                if (dailyJudgement) {
                  setIsAnalysisModalOpen(true);
                } else {
                  navigate('/dashboard/judgments');
                }
              }}
              className="text-xs font-semibold text-[#c19b48] hover:text-[#a47d31] dark:hover:text-[#e8cf8d] inline-flex items-center gap-1.5 shrink-0 self-end sm:self-auto whitespace-nowrap transition-colors cursor-pointer group"
            >
              <span>Full Judgment Analysis</span>
              <ArrowRight className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Full Judgment Analysis Modal */}
      <JudgementAnalysisModal
        judgement={dailyJudgement}
        isOpen={isAnalysisModalOpen}
        onClose={() => setIsAnalysisModalOpen(false)}
      />
    </div>
  );
};

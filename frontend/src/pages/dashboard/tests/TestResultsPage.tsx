import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  TrendingUp,
  Target,
  CheckCircle,
  XCircle,
  Download,
  Sparkles,
  Search,
  BookOpen,
  ArrowRight,
  Clock,
  FileCheck2,
} from 'lucide-react';
import { toast } from '../../../lib/toast';
import { useAuthStore } from '../../../store/useAuthStore';
import {
  fetchMyTestAnalytics,
  exportPerformancePdf,
} from '../../../services/testAnalytics.service';
import type { TestAnalyticsResponse } from '../../../types/testAnalytics.types';
import { KpiCardSkeleton, TestResultCardSkeleton } from '../../../components/ui/skeleton';
import { KpiCard, KpiGrid } from '../../../components/dashboard/KpiCard';

export const TestResultsPage: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const [analytics, setAnalytics] = useState<TestAnalyticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    const loadAnalytics = async () => {
      try {
        setIsLoading(true);
        const data = await fetchMyTestAnalytics();
        if (isMounted) {
          setAnalytics(data);
        }
      } catch (err: any) {
        console.error('Failed to load test analytics:', err);
        toast.error('Failed to load your test scorecards. Please try again.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadAnalytics();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleExportPdf = () => {
    if (!analytics || !analytics.hasAttempts) {
      toast.info('No mock test attempts recorded yet. Attempt a test to export your dossier.');
      return;
    }

    try {
      setIsExporting(true);
      const studentDisplayName = user?.name || 'Adv. Rohit Verma';
      exportPerformancePdf(analytics, studentDisplayName);
      toast.success('Official Candidate Performance Dossier downloaded successfully!');
    } catch (err: any) {
      console.error('PDF export failed:', err);
      toast.error('Failed to generate PDF dossier. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const filteredReports = useMemo(() => {
    if (!analytics?.reports) return [];
    if (!searchQuery.trim()) return analytics.reports;
    const q = searchQuery.toLowerCase();
    return analytics.reports.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        (r.targetExam && r.targetExam.toLowerCase().includes(q))
    );
  }, [analytics?.reports, searchQuery]);

  const latestTest = analytics?.latestTest;
  const hasAttempts = Boolean(analytics?.hasAttempts && latestTest);

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-semibold mb-2">
            <Award className="w-3.5 h-3.5" />
            <span>Candidate Scorecard & Percentile Analytics</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 dark:text-white">
            Scorecards & All-India Rank Analysis
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time comparative benchmarks against toppers and judicial cutoff targets.
          </p>
        </div>

        <button
          onClick={handleExportPdf}
          disabled={isExporting}
          className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#061120] hover:bg-[#c19b48] hover:text-[#061120] text-slate-800 dark:text-slate-200 font-semibold text-xs border border-slate-200 dark:border-[#143564] transition-colors flex items-center gap-2 cursor-pointer self-start sm:self-auto disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          <span>{isExporting ? 'Generating Dossier...' : 'Export Performance PDF'}</span>
        </button>
      </div>

      {/* Latest Test Context Indicator Banner */}
      {hasAttempts && latestTest && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300">
          <div className="flex items-center gap-2 font-medium">
            <Sparkles className="w-4 h-4 text-[#c19b48] shrink-0" />
            <span>
              <strong>Latest Test Spotlight:</strong> {latestTest.title}
            </span>
          </div>
          <span className="text-slate-600 dark:text-slate-400 font-mono text-[11px]">
            Attempted: {new Date(latestTest.attemptedAt).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}{' '}
            • Score: {latestTest.scoreFormatted}
          </span>
        </div>
      )}

      {/* Aggregate Metrics Bar (Spotlighting Latest Test Score & Stats) */}
      <KpiGrid>
        {isLoading ? (
          <KpiCardSkeleton count={4} />
        ) : (
          <>
            {/* Card 1: All-India Standing */}
            <KpiCard
              title="Current All-India Standing"
              badge={
                hasAttempts ? (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-[#c19b48] dark:text-[#e8cf8d] font-semibold">
                    Latest
                  </span>
                ) : undefined
              }
              value={
                <span className="text-[#c19b48] dark:text-[#e8cf8d] font-mono">
                  {hasAttempts && latestTest ? `AIR #${latestTest.rank}` : '--'}
                </span>
              }
              subtitle={
                hasAttempts && latestTest
                  ? latestTest.percentileBand
                  : 'No mock tests attempted yet'
              }
              subtitleColor="text-emerald-600 dark:text-emerald-400 font-medium"
            />

            {/* Card 2: Overall Accuracy Rate */}
            <KpiCard
              title="Overall Accuracy Rate"
              badge={
                hasAttempts ? (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-[#c19b48] dark:text-[#e8cf8d] font-semibold">
                    Latest
                  </span>
                ) : undefined
              }
              value={
                <span className="font-mono">
                  {hasAttempts && latestTest ? latestTest.accuracyFormatted : '--'}
                </span>
              }
              subtitle={
                hasAttempts && latestTest
                  ? `Target for ${latestTest.targetExam || 'Prelims'}: 85%+`
                  : 'Target for Judicial Prelims: 85%+'
              }
              subtitleColor="text-slate-500 dark:text-slate-400"
            />

            {/* Card 3: Avg Time Per MCQ */}
            <KpiCard
              title="Avg Time Per MCQ"
              badge={
                hasAttempts ? (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-[#c19b48] dark:text-[#e8cf8d] font-semibold">
                    Latest
                  </span>
                ) : undefined
              }
              value={
                <span className="font-mono">
                  {hasAttempts && latestTest ? `${latestTest.avgTimePerMcq} Secs` : '--'}
                </span>
              }
              subtitle={
                hasAttempts && latestTest
                  ? latestTest.avgTimePerMcq <= 45
                    ? 'Fast & confident pace'
                    : 'Steady exam pace'
                  : 'Target pace: <50s / question'
              }
              subtitleColor="text-emerald-600 dark:text-emerald-400 font-medium"
            />

            {/* Card 4: Negative Marks Penalty */}
            <KpiCard
              title="Negative Marks Penalty"
              badge={
                hasAttempts ? (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-[#c19b48] dark:text-[#e8cf8d] font-semibold">
                    Latest
                  </span>
                ) : undefined
              }
              value={
                <span className="text-red-500 font-mono">
                  {hasAttempts && latestTest ? latestTest.negativeMarksFormatted : '0.00 Pts'}
                </span>
              }
              subtitle={
                hasAttempts && latestTest
                  ? `${latestTest.incorrect} incorrect questions`
                  : 'Zero penalty incurred'
              }
              subtitleColor="text-slate-500 dark:text-slate-400"
            />
          </>
        )}
      </KpiGrid>

      {/* Tests Breakdown List */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              Mock Tests History & Autopsy Reports
            </span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-[#061120] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#143564]">
              {filteredReports.length} {filteredReports.length === 1 ? 'Exam' : 'Exams'}
            </span>
          </div>

          {/* Search Filter for tests */}
          {analytics?.reports && analytics.reports.length > 2 && (
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search mock tests..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-[#c19b48]"
              />
            </div>
          )}
        </div>

        {/* Loading Skeletons */}
        {isLoading && <TestResultCardSkeleton count={3} />}

        {/* Brand New Student Zero-State */}
        {!isLoading && (!analytics?.hasAttempts || filteredReports.length === 0) && (
          <div className="p-8 sm:p-12 text-center rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] space-y-4 shadow-xs">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#c19b48]/10 text-[#c19b48] flex items-center justify-center">
              <FileCheck2 className="w-7 h-7" />
            </div>

            <div className="max-w-md mx-auto space-y-1.5">
              <h4 className="text-base sm:text-lg font-serif font-bold text-slate-900 dark:text-white">
                {searchQuery ? 'No Matching Tests Found' : 'No Test Scorecards Recorded Yet'}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {searchQuery
                  ? `No test attempts match your query "${searchQuery}". Clear your search to see all completed tests.`
                  : "You haven't attempted any All-India mock series or bare act practice quizzes yet. Take your first test to unlock your percentile standing, accuracy metrics, and All-India rank."}
              </p>
            </div>

            {!searchQuery && (
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Link
                  to="/dashboard/tests/mock-series"
                  className="px-4 py-2 rounded-xl bg-[#c19b48] hover:bg-[#d4ac55] text-[#061120] font-semibold text-xs transition-colors inline-flex items-center gap-2 shadow-sm"
                >
                  <Award className="w-4 h-4" />
                  <span>Start All-India Mock Series</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <Link
                  to="/dashboard/tests/practice"
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#061120] hover:bg-slate-200 dark:hover:bg-[#143564] text-slate-800 dark:text-slate-200 font-semibold text-xs border border-slate-200 dark:border-[#143564] transition-colors inline-flex items-center gap-2"
                >
                  <BookOpen className="w-4 h-4 text-[#c19b48]" />
                  <span>Bare Act Practice Quizzes</span>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Completed Tests List */}
        {!isLoading &&
          filteredReports.map((t) => (
            <div
              key={t.id}
              className="p-5 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] space-y-4 shadow-xs hover:border-[#c19b48]/40 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-base font-serif font-bold text-slate-900 dark:text-white">
                      {t.title}
                    </h4>
                    {t.targetExam && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-[#143564] text-slate-600 dark:text-slate-300">
                        {t.targetExam}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                    <span>Attempted on {t.dateFormatted}</span>
                    {t.timeSpentMinutes && (
                      <>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {t.timeSpentMinutes} Mins
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-xl bg-amber-50 dark:bg-[#c19b48]/15 border border-amber-200 dark:border-[#c19b48]/40 text-[#c19b48] dark:text-[#e8cf8d] font-mono font-bold text-sm">
                    {t.rank}
                  </span>
                  <span className="px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-mono font-bold text-sm">
                    {t.score}
                  </span>
                </div>
              </div>

              {/* Micro Stats Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  <div>
                    <span className="text-slate-400 block text-[10px]">Correct Answers</span>
                    <span className="font-bold text-slate-900 dark:text-white">{t.correct} MCQs</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <div>
                    <span className="text-slate-400 block text-[10px]">Negative Incurred</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {t.incorrect} MCQs ({t.negativeMarksFormatted})
                    </span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] flex items-center gap-2">
                  <Target className="w-4 h-4 text-[#c19b48] shrink-0" />
                  <div>
                    <span className="text-slate-400 block text-[10px]">Accuracy</span>
                    <span className="font-bold text-slate-900 dark:text-white">{t.accuracy}</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-500 shrink-0" />
                  <div>
                    <span className="text-slate-400 block text-[10px]">Percentile</span>
                    <span className="font-bold text-slate-900 dark:text-white">{t.percentile}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

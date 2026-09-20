import React, { useState, useEffect, useCallback } from 'react';
import {
  Scale,
  Sparkles,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  FileQuestion,
} from 'lucide-react';
import type {
  JudgementDigest,
  JudgementFilterParams,
} from '../../types/judgement.types';
import {
  fetchPublishedJudgements,
  fetchJudgementFilterMeta,
  fetchFeaturedJudgement,
} from '../../services/judgement.service';
import { JudgementFilterBar } from '../../components/judgement/JudgementFilterBar';
import { JudgementCard } from '../../components/judgement/JudgementCard';
import { JudgementViewerModal } from '../../components/judgement/JudgementViewerModal';

export const JudgmentsPage: React.FC = () => {
  const [judgements, setJudgements] = useState<JudgementDigest[]>([]);
  const [featured, setFeatured] = useState<JudgementDigest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);

  // Distinct filter options
  const [availableCourts, setAvailableCourts] = useState<string[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  const [availableImportances, setAvailableImportances] = useState<string[]>([]);

  // Active filters
  const [filters, setFilters] = useState<JudgementFilterParams>({
    court: 'all',
    year: 'all',
    subject: 'all',
    importance: 'all',
    search: '',
    sort: 'date_desc',
    page: 1,
    limit: 6,
  });

  // Active preview modal state
  const [selectedJudgement, setSelectedJudgement] = useState<JudgementDigest | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);

  // Load filter metadata on initial mount
  useEffect(() => {
    fetchJudgementFilterMeta()
      .then((res) => {
        if (res.success && res.meta) {
          setAvailableCourts(res.meta.courts || []);
          setAvailableYears(res.meta.years || []);
          setAvailableSubjects(res.meta.subjects || []);
          setAvailableImportances(res.meta.importances || []);
        }
      })
      .catch((err) => {
        console.error('Failed to load filter metadata:', err);
      });

    // Load featured judgement
    fetchFeaturedJudgement()
      .then((res) => {
        if (res.success && res.featured) {
          setFeatured(res.featured);
        }
      })
      .catch(() => {});
  }, []);

  // Fetch judgements whenever filters change
  const loadJudgements = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchPublishedJudgements(filters);
      if (res.success) {
        setJudgements(res.judgements);
        setTotalCount(res.total);
        setTotalPages(res.totalPages);
        setPage(res.page);
      }
    } catch (err: any) {
      console.error('Error fetching judgements:', err);
      setError(err?.response?.data?.message || 'Failed to load judgements from repository.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadJudgements();
  }, [loadJudgements]);

  const handleFilterChange = (newFilters: Partial<JudgementFilterParams>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      page: newFilters.page !== undefined ? newFilters.page : 1,
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      court: 'all',
      year: 'all',
      subject: 'all',
      importance: 'all',
      search: '',
      sort: 'date_desc',
      page: 1,
      limit: 6,
    });
  };

  const handleOpenPreview = (j: JudgementDigest) => {
    setSelectedJudgement(j);
    setViewerOpen(true);
  };

  const handleClosePreview = () => {
    setViewerOpen(false);
    setSelectedJudgement(null);
  };

  const handleDownloadSuccess = (judgementId: string) => {
    setJudgements((prev) =>
      prev.map((item) =>
        item._id === judgementId ? { ...item, downloadCount: item.downloadCount + 1 } : item
      )
    );
    if (featured && featured._id === judgementId) {
      setFeatured({ ...featured, downloadCount: featured.downloadCount + 1 });
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-[#c19b48]/15 text-[#c19b48] dark:text-[#e8cf8d] text-xs font-semibold mb-2 border border-amber-200/60 dark:border-[#c19b48]/30">
            <Scale className="w-3.5 h-3.5" />
            <span>Apex Court & High Courts Repository</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 dark:text-white">
            Landmark Judgement Digest
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Authoritative case law repository with 3-Point Ratio Decidendi for Mains answers, Coram,
            overruled precedents, and in-app range-streamed PDF reading.
          </p>
        </div>
      </div>

      {/* Featured Landmark Case of the Day (Spotlight Card) */}
      {featured && (
        <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent dark:from-[#c19b48]/15 dark:via-[#0a1c36] dark:to-[#061120] border border-amber-200 dark:border-[#c19b48]/40 space-y-3 relative overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#c19b48] text-[#061120] text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Precedent of the Day</span>
            </div>
            <span className="font-mono text-xs font-bold text-[#c19b48] dark:text-[#e8cf8d]">
              {featured.citation}
            </span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-3xl">
              <h2 className="text-lg sm:text-xl font-serif font-bold text-slate-900 dark:text-white">
                {featured.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
                {featured.summary}
              </p>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 pt-1">
                <span>
                  <strong>Bench:</strong> {featured.bench}
                </span>
                <span>•</span>
                <span>{featured.subject}</span>
                <span>•</span>
                <span>{featured.court}</span>
              </div>
            </div>

            <button
              onClick={() => handleOpenPreview(featured)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#c19b48] hover:bg-[#d4ae58] text-[#061120] font-bold text-xs sm:text-sm transition-colors shadow-md cursor-pointer shrink-0"
            >
              <BookOpen className="w-4 h-4" />
              <span>Read Full Digest</span>
            </button>
          </div>
        </div>
      )}

      {/* Filter Toolbar */}
      <JudgementFilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
        availableCourts={availableCourts}
        availableYears={availableYears}
        availableSubjects={availableSubjects}
        availableImportances={availableImportances}
        totalCount={totalCount}
      />

      {/* Loading Skeleton State */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-6 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] space-y-4 animate-pulse"
            >
              <div className="flex justify-between">
                <div className="h-5 w-24 bg-slate-200 dark:bg-slate-700 rounded-full" />
                <div className="h-5 w-28 bg-slate-200 dark:bg-slate-700 rounded" />
              </div>
              <div className="h-6 w-3/4 bg-slate-200 dark:bg-slate-700 rounded" />
              <div className="h-16 w-full bg-slate-100 dark:bg-slate-800 rounded-xl" />
              <div className="h-8 w-full bg-slate-200 dark:bg-slate-700 rounded-lg" />
            </div>
          ))}
        </div>
      )}

      {/* Error Alert */}
      {!loading && error && (
        <div className="p-6 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
          <h3 className="text-sm font-bold text-red-800 dark:text-red-300">{error}</h3>
          <button
            onClick={() => loadJudgements()}
            className="px-4 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty Search / Filter Results */}
      {!loading && !error && judgements.length === 0 && (
        <div className="p-12 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] text-center space-y-3">
          <FileQuestion className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="text-base font-serif font-bold text-slate-900 dark:text-white">
            No Landmark Judgements Found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            We couldn't find any precedents matching your active query or selected filters. Try
            adjusting search keywords or resetting court and subject filters.
          </p>
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 rounded-xl bg-[#c19b48] text-[#061120] text-xs font-bold hover:bg-[#d4ae58] transition-colors inline-block mt-2 cursor-pointer"
          >
            Reset All Filters
          </button>
        </div>
      )}

      {/* Precedents Grid */}
      {!loading && !error && judgements.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {judgements.map((j) => (
            <JudgementCard
              key={j._id}
              judgement={j}
              onPreview={handleOpenPreview}
              onDownloadComplete={handleDownloadSuccess}
            />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564]">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Page <strong className="text-slate-900 dark:text-white">{page}</strong> of{' '}
            <strong className="text-slate-900 dark:text-white">{totalPages}</strong>
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleFilterChange({ page: page - 1 })}
              disabled={page <= 1}
              className="p-2 rounded-lg bg-slate-100 dark:bg-[#061120] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#143564] disabled:opacity-40 hover:bg-[#c19b48] hover:text-[#061120] transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((num) => (
              <button
                key={num}
                onClick={() => handleFilterChange({ page: num })}
                className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  num === page
                    ? 'bg-[#c19b48] text-[#061120]'
                    : 'bg-slate-100 dark:bg-[#061120] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                {num}
              </button>
            ))}

            <button
              onClick={() => handleFilterChange({ page: page + 1 })}
              disabled={page >= totalPages}
              className="p-2 rounded-lg bg-slate-100 dark:bg-[#061120] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#143564] disabled:opacity-40 hover:bg-[#c19b48] hover:text-[#061120] transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Range-Streamed In-App PDF Viewer Modal */}
      <JudgementViewerModal
        judgement={selectedJudgement}
        isOpen={viewerOpen}
        onClose={handleClosePreview}
        onDownloaded={handleDownloadSuccess}
      />
    </div>
  );
};

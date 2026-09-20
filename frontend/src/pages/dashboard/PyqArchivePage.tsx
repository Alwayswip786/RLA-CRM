import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  FileQuestion,
  RotateCcw,
} from 'lucide-react';
import type { PyqPaper, PyqFilterParams } from '../../types/pyq.types';
import { fetchPublishedPyqs, fetchPyqFilterMeta } from '../../services/pyq.service';
import { PyqFilterBar } from '../../components/pyq/PyqFilterBar';
import { PyqPaperCard } from '../../components/pyq/PyqPaperCard';
import { PyqViewerModal } from '../../components/pyq/PyqViewerModal';

export const PyqArchivePage: React.FC = () => {
  const [papers, setPapers] = useState<PyqPaper[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [filters, setFilters] = useState<PyqFilterParams>({
    exam: 'all',
    year: 'all',
    stage: 'all',
    subject: 'all',
    search: '',
    sort: 'year_desc',
    page: 1,
    limit: 9,
  });

  // Dynamic filter options
  const [meta, setMeta] = useState<{
    exams: string[];
    years: number[];
    stages: string[];
    subjects: string[];
  }>({
    exams: [],
    years: [],
    stages: ['Prelims', 'Mains', 'Interview'],
    subjects: [],
  });

  // Active viewer paper
  const [activeViewerPaper, setActiveViewerPaper] = useState<PyqPaper | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  // Fetch filter metadata on mount
  useEffect(() => {
    fetchPyqFilterMeta()
      .then((res) => {
        if (res.success && res.meta) {
          setMeta(res.meta);
        }
      })
      .catch((err) => console.warn('Failed to load filter meta:', err));
  }, []);

  // Fetch published papers whenever filters change
  const loadPapers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchPublishedPyqs(filters);
      if (res.success) {
        setPapers(res.pyqs);
        setTotal(res.total);
        setTotalPages(res.totalPages);
      }
    } catch (err: any) {
      console.error('Failed to load PYQ papers:', err);
      setError(err?.response?.data?.message || 'Unable to connect to Judicial Vault. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadPapers();
  }, [loadPapers]);

  const handleOpenViewer = (paper: PyqPaper) => {
    setActiveViewerPaper(paper);
    setIsViewerOpen(true);
  };

  const handleCloseViewer = () => {
    setIsViewerOpen(false);
    setActiveViewerPaper(null);
  };

  const handleDownloadIncrement = (paperId: string) => {
    setPapers((prev) =>
      prev.map((p) => (p._id === paperId ? { ...p, downloadCount: p.downloadCount + 1 } : p))
    );
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setFilters((prev) => ({ ...prev, page: newPage }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="p-6 sm:p-7 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-xs">
        <div className="space-y-1.5 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#c19b48]/15 border border-[#c19b48]/30 text-[#c19b48] dark:text-[#e8cf8d] text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>State Judiciary Question Bank & Model Solutions</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 dark:text-white">
            Solved PYQ Archive (2015–2024)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Authentic official question papers across Delhi (DJS), Haryana (HCS), UP PCS-J, and MP CJ with complete step-by-step ratio analysis and model solutions prepared by senior academy faculty.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-start md:self-auto">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] text-center min-w-[110px]">
            <div className="text-xl font-mono font-bold text-[#c19b48] dark:text-[#e8cf8d]">
              {total}
            </div>
            <div className="text-[11px] text-slate-400 font-medium">Available Papers</div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <PyqFilterBar
        filters={filters}
        onChange={setFilters}
        availableExams={meta.exams}
        availableYears={meta.years}
        availableStages={meta.stages}
        totalResults={total}
      />

      {/* Main Content Area */}
      {loading ? (
        // Skeleton Loading State
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="p-6 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] space-y-4 animate-pulse"
            >
              <div className="flex justify-between items-center">
                <div className="h-5 w-24 bg-slate-200 dark:bg-[#143564] rounded-full" />
                <div className="h-5 w-16 bg-slate-200 dark:bg-[#143564] rounded" />
              </div>
              <div className="h-6 w-4/5 bg-slate-200 dark:bg-[#143564] rounded" />
              <div className="space-y-2">
                <div className="h-3 w-full bg-slate-200 dark:bg-[#143564] rounded" />
                <div className="h-3 w-3/4 bg-slate-200 dark:bg-[#143564] rounded" />
              </div>
              <div className="pt-4 border-t border-slate-100 dark:border-[#143564] flex justify-between">
                <div className="h-4 w-20 bg-slate-200 dark:bg-[#143564] rounded" />
                <div className="h-8 w-24 bg-slate-200 dark:bg-[#143564] rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        // Error State
        <div className="p-10 rounded-2xl bg-white dark:bg-[#0a1c36] border border-rose-200 dark:border-rose-950 text-center space-y-3">
          <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">{error}</p>
          <button
            onClick={loadPapers}
            className="px-4 py-2 rounded-xl bg-[#c19b48] text-[#061120] text-xs font-bold hover:bg-[#d8b862] transition-colors cursor-pointer"
          >
            Retry Loading
          </button>
        </div>
      ) : papers.length === 0 ? (
        // Empty State
        <div className="p-12 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] flex items-center justify-center mx-auto text-slate-400">
            <FileQuestion className="w-7 h-7 text-[#c19b48]" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-base font-serif font-bold text-slate-900 dark:text-white">
              No Solved Papers Found
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              We could not find any question papers matching your current search or filter criteria. Try adjusting the state or year filters.
            </p>
          </div>
          <button
            onClick={() =>
              setFilters({
                exam: 'all',
                year: 'all',
                stage: 'all',
                subject: 'all',
                search: '',
                sort: 'year_desc',
                page: 1,
              })
            }
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#061120] hover:bg-slate-200 dark:hover:bg-[#143564] text-xs font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#143564] transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All Filters</span>
          </button>
        </div>
      ) : (
        // Grid of Papers
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {papers.map((paper) => (
            <PyqPaperCard
              key={paper._id}
              paper={paper}
              onPreview={handleOpenViewer}
              onDownloadComplete={handleDownloadIncrement}
            />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {!loading && totalPages > 1 && (
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] flex items-center justify-between shadow-xs">
          <button
            onClick={() => handlePageChange((filters.page || 1) - 1)}
            disabled={(filters.page || 1) <= 1}
            className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-[#143564] disabled:opacity-40 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
            Page <strong className="text-slate-800 dark:text-white">{filters.page || 1}</strong> of{' '}
            <strong className="text-slate-800 dark:text-white">{totalPages}</strong>
          </span>

          <button
            onClick={() => handlePageChange((filters.page || 1) + 1)}
            disabled={(filters.page || 1) >= totalPages}
            className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-[#143564] disabled:opacity-40 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* In-App PDF Viewer Modal */}
      <PyqViewerModal
        paper={activeViewerPaper}
        isOpen={isViewerOpen}
        onClose={handleCloseViewer}
        onDownloaded={handleDownloadIncrement}
      />
    </div>
  );
};

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  FileQuestion,
  RotateCcw,
} from 'lucide-react';
import type { PyqPaper, PyqFilterParams } from '../../types/pyq.types';
import { fetchPublishedPyqs } from '../../services/pyq.service';
import { PyqPaperCard } from '../../components/pyq/PyqPaperCard';
import { PyqViewerModal } from '../../components/pyq/PyqViewerModal';
import { PyqCardSkeleton } from '../../components/ui/skeleton';

export const PyqArchivePage: React.FC = () => {
  const [papers, setPapers] = useState<PyqPaper[]>([]);
  const [page, setPage] = useState(1);
  const [, setTotalPages] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextPageError, setNextPageError] = useState<string | null>(null);

  // Filter state
  const [filters] = useState<PyqFilterParams>({
    exam: 'all',
    year: 'all',
    stage: 'all',
    subject: 'all',
    search: '',
    sort: 'year_desc',
    limit: 9,
  });

  // Active viewer paper
  const [activeViewerPaper, setActiveViewerPaper] = useState<PyqPaper | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  // Sentinel and fetch locks
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const isFetchingRef = useRef(false);
  const hasNextPageRef = useRef(false);
  const pageRef = useRef(1);

  // Keep refs in sync for observer callback
  useEffect(() => {
    hasNextPageRef.current = hasNextPage;
  }, [hasNextPage]);

  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  // Initial load
  const loadInitialPapers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setNextPageError(null);
      setPage(1);

      const res = await fetchPublishedPyqs({
        ...filters,
        page: 1,
      });

      if (res.success) {
        setPapers(res.pyqs);
        setTotalPages(res.totalPages);
        const hasNext = res.hasNextPage ?? (1 < res.totalPages);
        setHasNextPage(hasNext);
      }
    } catch (err: any) {
      console.error('Failed to load PYQ papers:', err);
      setError(
        err?.response?.data?.message || 'Unable to connect to Judicial Vault. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadInitialPapers();
  }, [loadInitialPapers]);

  // Fetch next page batch and append deduplicated items
  const fetchNextPage = useCallback(async () => {
    if (isFetchingRef.current || !hasNextPageRef.current) return;

    try {
      isFetchingRef.current = true;
      setIsFetchingNextPage(true);
      setNextPageError(null);

      const nextPage = pageRef.current + 1;
      const res = await fetchPublishedPyqs({
        ...filters,
        page: nextPage,
      });

      if (res.success) {
        setPapers((prev) => {
          const existingIds = new Set(prev.map((p) => p._id));
          const uniqueIncoming = res.pyqs.filter((p) => !existingIds.has(p._id));
          return [...prev, ...uniqueIncoming];
        });
        setPage(nextPage);
        setTotalPages(res.totalPages);
        const hasNext = res.hasNextPage ?? (nextPage < res.totalPages);
        setHasNextPage(hasNext);
      }
    } catch (err: any) {
      console.error('Failed to load next page of PYQs:', err);
      setNextPageError(
        err?.response?.data?.message || 'Could not load additional past papers. Tap to retry.'
      );
    } finally {
      isFetchingRef.current = false;
      setIsFetchingNextPage(false);
    }
  }, [filters]);

  // IntersectionObserver Sentinel (rootMargin: '280px 0px' for proactive pre-fetch)
  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || !hasNextPage || isFetchingNextPage || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries.some((entry) => entry.isIntersecting) &&
          !isFetchingRef.current &&
          hasNextPageRef.current
        ) {
          void fetchNextPage();
        }
      },
      { rootMargin: '280px 0px' }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, loading]);

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

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Main Content Area */}
      {loading ? (
        <PyqCardSkeleton count={6} />
      ) : error ? (
        // Error State
        <div className="p-10 rounded-2xl bg-white dark:bg-[#0a1c36] border border-rose-200 dark:border-rose-950 text-center space-y-3">
          <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">{error}</p>
          <button
            onClick={loadInitialPapers}
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
              No Solved Papers Available
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              There are currently no official previous year question papers published in the archive.
            </p>
          </div>
        </div>
      ) : (
        // Grid of Papers + Streaming Batches
        <div className="space-y-5">
          <div className="grid min-w-0 grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-5">
            {papers.map((paper) => (
              <PyqPaperCard
                key={paper._id}
                paper={paper}
                onPreview={handleOpenViewer}
                onDownloadComplete={handleDownloadIncrement}
              />
            ))}
          </div>

          {/* Next Batch Skeletons (Inline without resetting or jumping scroll) */}
          {isFetchingNextPage && (
            <div className="pt-2">
              <PyqCardSkeleton count={3} />
            </div>
          )}

          {/* Next Page Failure - Inline Retry Pill */}
          {nextPageError && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center justify-between gap-4 shadow-xs">
              <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                {nextPageError}
              </p>
              <button
                type="button"
                onClick={() => void fetchNextPage()}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            </div>
          )}

          {/* Invisible Sentinel Element for IntersectionObserver */}
          <div ref={loadMoreRef} className="h-6 w-full pointer-events-none" aria-hidden="true" />
        </div>
      )}

      {/* In-App PDF Viewer Modal (Edge-to-Edge Fullscreen on all devices) */}
      <PyqViewerModal
        paper={activeViewerPaper}
        isOpen={isViewerOpen}
        onClose={handleCloseViewer}
        onDownloaded={handleDownloadIncrement}
      />
    </div>
  );
};

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  AlertCircle,
  FileQuestion,
  RotateCcw,
} from 'lucide-react';
import type {
  JudgementDigest,
  JudgementFilterParams,
} from '../../types/judgement.types';
import { fetchPublishedJudgements } from '../../services/judgement.service';
import { JudgementCard } from '../../components/judgement/JudgementCard';
import { JudgementViewerModal } from '../../components/judgement/JudgementViewerModal';
import { JudgementCardSkeleton } from '../../components/ui/skeleton';

export const JudgmentsPage: React.FC = () => {
  const [judgements, setJudgements] = useState<JudgementDigest[]>([]);
  const [page, setPage] = useState(1);
  const [, setTotalPages] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextPageError, setNextPageError] = useState<string | null>(null);

  // Active filters
  const [filters] = useState<JudgementFilterParams>({
    court: 'all',
    year: 'all',
    subject: 'all',
    importance: 'all',
    search: '',
    sort: 'date_desc',
    limit: 6,
  });

  // Active preview modal state
  const [selectedJudgement, setSelectedJudgement] = useState<JudgementDigest | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);

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
  const loadInitialJudgements = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setNextPageError(null);
      setPage(1);

      const res = await fetchPublishedJudgements({
        ...filters,
        page: 1,
      });

      if (res.success) {
        setJudgements(res.judgements);
        setTotalPages(res.totalPages);
        const hasNext = res.hasNextPage ?? (1 < res.totalPages);
        setHasNextPage(hasNext);
      }
    } catch (err: any) {
      console.error('Error fetching judgements:', err);
      setError(err?.response?.data?.message || 'Failed to load judgements from repository.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadInitialJudgements();
  }, [loadInitialJudgements]);

  // Fetch next page batch and append deduplicated items
  const fetchNextPage = useCallback(async () => {
    if (isFetchingRef.current || !hasNextPageRef.current) return;

    try {
      isFetchingRef.current = true;
      setIsFetchingNextPage(true);
      setNextPageError(null);

      const nextPage = pageRef.current + 1;
      const res = await fetchPublishedJudgements({
        ...filters,
        page: nextPage,
      });

      if (res.success) {
        setJudgements((prev) => {
          const existingIds = new Set(prev.map((j) => j._id));
          const uniqueIncoming = res.judgements.filter((j) => !existingIds.has(j._id));
          return [...prev, ...uniqueIncoming];
        });
        setPage(nextPage);
        setTotalPages(res.totalPages);
        const hasNext = res.hasNextPage ?? (nextPage < res.totalPages);
        setHasNextPage(hasNext);
      }
    } catch (err: any) {
      console.error('Failed to load next page of judgements:', err);
      setNextPageError(
        err?.response?.data?.message || 'Could not load additional judgements. Tap to retry.'
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
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Loading Skeleton State */}
      {loading ? (
        <JudgementCardSkeleton count={4} />
      ) : error ? (
        // Error Alert
        <div className="p-6 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
          <h3 className="text-sm font-bold text-red-800 dark:text-red-300">{error}</h3>
          <button
            onClick={loadInitialJudgements}
            className="px-4 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : judgements.length === 0 ? (
        // Empty State
        <div className="p-12 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] text-center space-y-3">
          <FileQuestion className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="text-base font-serif font-bold text-slate-900 dark:text-white">
            No Landmark Judgements Found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            There are currently no official landmark judgements published in the repository.
          </p>
        </div>
      ) : (
        // Precedents Grid + Infinite Scroll Batches
        <div className="space-y-5">
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

          {/* Next Batch Skeletons (Inline without resetting or jumping scroll) */}
          {isFetchingNextPage && (
            <div className="pt-2">
              <JudgementCardSkeleton count={2} />
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

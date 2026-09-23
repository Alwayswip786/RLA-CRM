import React, { useState, useEffect, useCallback } from 'react';
import {
  BookOpen,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  FileQuestion,
  Download,
  Loader2,
} from 'lucide-react';
import type { BareActNote, BareActFilterParams } from '../../types/bareAct.types';
import {
  fetchPublishedNotes,
  fetchBareActFilterMeta,
  fetchFeaturedBareAct,
  downloadNotePdf,
} from '../../services/bareAct.service';
import { BareActFilterBar } from '../../components/bareact/BareActFilterBar';
import { BareActCard } from '../../components/bareact/BareActCard';
import { BareActViewerModal } from '../../components/bareact/BareActViewerModal';
import { toast } from '../../lib/toast';
import { BareActCardSkeleton } from '../../components/ui/skeleton';

export const BareActsPage: React.FC = () => {
  const [notes, setNotes] = useState<BareActNote[]>([]);
  const [featured, setFeatured] = useState<BareActNote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);

  // Filter metadata
  const [availableActs, setAvailableActs] = useState<string[]>([]);

  // Active filters
  const [filters, setFilters] = useState<BareActFilterParams>({
    category: 'all',
    actName: 'all',
    difficulty: 'all',
    search: '',
    sort: 'newest',
    page: 1,
    limit: 6,
  });

  // Viewer modal state
  const [selectedNote, setSelectedNote] = useState<BareActNote | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [spotlightDownloading, setSpotlightDownloading] = useState(false);

  // Load filter metadata & featured note on initial mount
  useEffect(() => {
    fetchBareActFilterMeta()
      .then((res) => {
        if (res.success) {
          setAvailableActs(res.acts || []);
        }
      })
      .catch((err) => console.error('Failed to load bare act filter meta:', err));

    fetchFeaturedBareAct()
      .then((res) => {
        if (res.success && res.note) {
          setFeatured(res.note);
        }
      })
      .catch((err) => console.error('Failed to load featured bare act note:', err));
  }, []);

  // Fetch published notes
  const loadNotes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchPublishedNotes(filters);
      if (res.success) {
        setNotes(res.notes);
        setTotalCount(res.total);
        setTotalPages(res.totalPages);
        setPage(res.page);
      }
    } catch (err: any) {
      console.error('Failed to fetch bare act notes:', err);
      setError(err?.response?.data?.message || 'Failed to load statutory decoding notes.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const handleFilterChange = (newFilters: Partial<BareActFilterParams>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      page: 1,
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      category: 'all',
      actName: 'all',
      difficulty: 'all',
      search: '',
      sort: 'newest',
      page: 1,
      limit: 6,
    });
  };

  const openViewer = (note: BareActNote) => {
    setSelectedNote(note);
    setViewerOpen(true);
  };

  const handleDownloadSpotlight = async () => {
    if (!featured) return;
    try {
      setSpotlightDownloading(true);
      await downloadNotePdf(
        featured._id,
        featured.pdfFile?.originalName || `${featured.actName}_Decoding.pdf`
      );
      toast.success(`Downloaded: ${featured.actName} Spotlight Notes`);
      setFeatured((prev) => (prev ? { ...prev, downloadCount: prev.downloadCount + 1 } : null));
    } catch {
      toast.error('Failed to download PDF document.');
    } finally {
      setSpotlightDownloading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-[#c19b48]/15 text-[#c19b48] dark:text-[#f3d999] text-xs font-semibold mb-2 border border-amber-200 dark:border-[#c19b48]/30">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Faculty Curated Statutory Repository</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 dark:text-white">
            Bare Act Decoding Notes
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Section-by-section statutory breakdown with comparative concordance charts and judicial exam illustrations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] text-center">
            <p className="text-[10px] uppercase font-bold text-slate-400">Total Notes</p>
            <p className="font-serif text-lg font-bold text-[#c19b48]">{totalCount}</p>
          </div>
        </div>
      </div>

      {/* 2. Spotlight Hero Banner: "Act in Focus" */}
      {featured && (
        <div className="p-6 sm:p-7 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent dark:from-[#c19b48]/15 dark:via-[#c19b48]/5 dark:to-[#0a1c36] border border-amber-300/40 dark:border-[#c19b48]/40 shadow-xs relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-2.5 max-w-2xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#c19b48] text-[#061120] shadow-xs">
                  <Sparkles className="w-3 h-3" />
                  Act in Focus
                </span>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-white dark:bg-[#061120] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#143564]">
                  {featured.category} • {featured.actYear}
                </span>
              </div>

              <h2 className="text-lg sm:text-xl font-serif font-bold text-slate-900 dark:text-white leading-snug">
                {featured.actName}
              </h2>

              <p className="text-xs font-semibold text-[#c19b48] dark:text-[#f3d999]">
                {featured.sectionsCovered} {featured.chapter ? `• ${featured.chapter}` : ''}
              </p>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
                {featured.description}
              </p>

              {/* High-yield highlights pills */}
              {featured.highlights && featured.highlights.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {featured.highlights.slice(0, 3).map((h, i) => (
                    <span
                      key={i}
                      className="text-[10px] px-2.5 py-0.5 rounded-md bg-white/80 dark:bg-[#061120]/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#143564]"
                    >
                      ✓ {h}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row md:flex-col items-stretch sm:items-center md:items-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => openViewer(featured)}
                className="px-5 py-2.5 rounded-xl bg-[#c19b48] hover:bg-[#d8b862] text-[#061120] font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                <BookOpen className="w-4 h-4" />
                <span>Read Online (TOC)</span>
              </button>

              <button
                type="button"
                disabled={spotlightDownloading}
                onClick={handleDownloadSpotlight}
                className="px-5 py-2.5 rounded-xl bg-white dark:bg-[#061120] hover:bg-slate-100 dark:hover:bg-[#143564] text-slate-800 dark:text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 border border-slate-200 dark:border-[#143564] cursor-pointer"
              >
                {spotlightDownloading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 text-[#c19b48]" />
                )}
                <span>Download PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Search & Faceted Filter Bar */}
      <BareActFilterBar
        filters={filters}
        availableActs={availableActs}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      {/* 4. Notes Grid / States */}
      {loading ? (
        <BareActCardSkeleton count={6} />
      ) : error ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#0a1c36] border border-rose-200 dark:border-rose-900/40 space-y-3">
          <AlertCircle className="w-8 h-8 mx-auto text-rose-500" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Unable to Load Notes</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">{error}</p>
          <button
            type="button"
            onClick={loadNotes}
            className="px-4 py-2 rounded-xl bg-[#c19b48] text-[#061120] font-bold text-xs cursor-pointer"
          >
            Retry Loading
          </button>
        </div>
      ) : notes.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] space-y-3">
          <FileQuestion className="w-8 h-8 mx-auto text-slate-400" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No Bare Act Notes Found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            No statutory notes matched your current search filters. Try selecting another category or clearing search terms.
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="px-4 py-2 rounded-xl bg-[#c19b48] text-[#061120] font-bold text-xs cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {notes.map((note) => (
            <BareActCard
              key={note._id}
              note={note}
              onPreview={openViewer}
              onDownloadComplete={(id) => {
                setNotes((prev) =>
                  prev.map((n) => (n._id === id ? { ...n, downloadCount: n.downloadCount + 1 } : n))
                );
              }}
            />
          ))}
        </div>
      )}

      {/* 5. Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] text-xs">
          <p className="text-slate-500 dark:text-slate-400">
            Showing <strong className="text-slate-900 dark:text-white">{notes.length}</strong> of{' '}
            <strong className="text-slate-900 dark:text-white">{totalCount}</strong> decoding notes (Page{' '}
            {page} of {totalPages})
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => handleFilterChange({ page: page - 1 })}
              className="p-2 rounded-xl bg-slate-50 dark:bg-[#061120] hover:bg-slate-100 dark:hover:bg-[#143564] text-slate-600 dark:text-slate-300 disabled:opacity-40 transition-colors border border-slate-200 dark:border-[#143564] cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono font-bold text-xs text-[#c19b48] px-2">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => handleFilterChange({ page: page + 1 })}
              className="p-2 rounded-xl bg-slate-50 dark:bg-[#061120] hover:bg-slate-100 dark:hover:bg-[#143564] text-slate-600 dark:text-slate-300 disabled:opacity-40 transition-colors border border-slate-200 dark:border-[#143564] cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 6. In-App Statutory Viewer Modal */}
      <BareActViewerModal
        note={selectedNote}
        isOpen={viewerOpen}
        onClose={() => {
          setViewerOpen(false);
          setSelectedNote(null);
        }}
        onDownloadComplete={(id) => {
          setNotes((prev) =>
            prev.map((n) => (n._id === id ? { ...n, downloadCount: n.downloadCount + 1 } : n))
          );
        }}
      />
    </div>
  );
};

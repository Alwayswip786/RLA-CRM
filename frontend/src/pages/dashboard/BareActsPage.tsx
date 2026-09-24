import React, { useState, useEffect, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  FileQuestion,
} from 'lucide-react';
import type { BareActNote, BareActFilterParams } from '../../types/bareAct.types';
import { fetchPublishedNotes } from '../../services/bareAct.service';
import { BareActCard } from '../../components/bareact/BareActCard';
import { BareActViewerModal } from '../../components/bareact/BareActViewerModal';
import { BareActCardSkeleton } from '../../components/ui/skeleton';

export const BareActsPage: React.FC = () => {
  const [notes, setNotes] = useState<BareActNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);

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

  // Fetch published notes
  const loadNotes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchPublishedNotes(filters);
      if (res.success) {
        setNotes(res.notes);
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

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({
      ...prev,
      page: newPage,
    }));
  };

  const openViewer = (note: BareActNote) => {
    setSelectedNote(note);
    setViewerOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Notes Grid / States */}
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
            There are currently no official statutory decoding notes published in the repository.
          </p>
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

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] text-xs">
          <p className="text-slate-500 dark:text-slate-400">
            Page <strong className="text-slate-900 dark:text-white">{page}</strong> of{' '}
            <strong className="text-slate-900 dark:text-white">{totalPages}</strong>
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => handlePageChange(page - 1)}
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
              onClick={() => handlePageChange(page + 1)}
              className="p-2 rounded-xl bg-slate-50 dark:bg-[#061120] hover:bg-slate-100 dark:hover:bg-[#143564] text-slate-600 dark:text-slate-300 disabled:opacity-40 transition-colors border border-slate-200 dark:border-[#143564] cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* In-App Statutory Viewer Modal */}
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

import React, { useState, useEffect, useCallback } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  CheckCircle,
  Clock,
  Download,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Scale,
  Loader2,
  FileText,
} from 'lucide-react';
import type {
  BareActNote,
  BareActAdminStats,
  BareActAdminFilterParams,
  ActCategory,
} from '../../types/bareAct.types';
import { fetchAllNotesAdmin } from '../../services/bareAct.service';
import { BareActAdminTable } from '../../components/bareact/BareActAdminTable';
import { UploadBareActModal } from '../../components/bareact/UploadBareActModal';
import { EditBareActModal } from '../../components/bareact/EditBareActModal';
import { BareActPreviewModal } from '../../components/bareact/BareActPreviewModal';

const CATEGORIES: ActCategory[] = [
  'New Criminal Laws',
  'Major Procedural Act',
  'Major Substantive Act',
  'Civil & Property Law',
  'Commercial & Corporate Law',
  'Local & Special Acts',
];

export const BareActsPage: React.FC = () => {
  const [notes, setNotes] = useState<BareActNote[]>([]);
  const [stats, setStats] = useState<BareActAdminStats>({
    totalNotes: 0,
    publishedCount: 0,
    draftCount: 0,
    totalDownloads: 0,
    totalViews: 0,
    uniqueActs: 0,
  });
  const [loading, setLoading] = useState(true);

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Filters state
  const [filters, setFilters] = useState<BareActAdminFilterParams>({
    category: 'all',
    status: 'all',
    search: '',
    sort: 'newest',
    page: 1,
    limit: 10,
  });

  // Modals state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<BareActNote | null>(null);
  const [previewingNote, setPreviewingNote] = useState<BareActNote | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchAllNotesAdmin(filters);
      if (res.success) {
        setNotes(res.notes);
        setStats(res.stats);
        setTotalCount(res.total);
        setTotalPages(res.totalPages);
        setPage(res.page);
      }
    } catch (err: any) {
      console.error('Failed to load bare act notes admin data:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFilterChange = (newFilters: Partial<BareActAdminFilterParams>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      page: 1, // reset to page 1 on filter change
    }));
  };

  const resetFilters = () => {
    setFilters({
      category: 'all',
      status: 'all',
      search: '',
      sort: 'newest',
      page: 1,
      limit: 10,
    });
  };

  return (
    <div className="space-y-6 select-none animate-in fade-in duration-200">
      {/* 1. Header Banner */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C19B48]/15 border border-[#C19B48]/30 text-[#C19B48] text-xs font-semibold">
            <Scale className="w-3.5 h-3.5" />
            <span>Statutory Knowledge Vault CMS</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#F7F3E6]">
            Bare Act Notes & Decoding Charts
          </h1>
          <p className="text-xs text-[#A8A294] max-w-2xl leading-relaxed">
            Upload authoritative section-by-section breakdown notes, comparative concordance charts (IPC vs BNS, CrPC vs BNSS, IEA vs BSA), and downloadable revision handbooks.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setUploadModalOpen(true)}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#C19B48] hover:bg-[#D8B862] text-[#1E1E1E] text-xs font-bold transition-all cursor-pointer shrink-0 shadow-lg hover:shadow-[#C19B48]/20 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Upload Notes PDF</span>
        </button>
      </div>

      {/* 2. Executive KPI Cards (5 Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Notes */}
        <div className="p-4 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#C19B48]">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-[#A8A294] tracking-wider">
              Total Notes
            </p>
            <p className="font-serif text-xl sm:text-2xl font-bold text-[#F7F3E6]">
              {stats.totalNotes}
            </p>
          </div>
        </div>

        {/* Published */}
        <div className="p-4 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-[#A8A294] tracking-wider">
              Published
            </p>
            <p className="font-serif text-xl sm:text-2xl font-bold text-emerald-400">
              {stats.publishedCount}
            </p>
          </div>
        </div>

        {/* Draft Queue */}
        <div className="p-4 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-[#A8A294] tracking-wider">
              Draft Queue
            </p>
            <p className="font-serif text-xl sm:text-2xl font-bold text-amber-400">
              {stats.draftCount}
            </p>
          </div>
        </div>

        {/* Student Downloads */}
        <div className="p-4 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-[#A8A294] tracking-wider">
              Downloads
            </p>
            <p className="font-serif text-xl sm:text-2xl font-bold text-[#F7F3E6]">
              {stats.totalDownloads}
            </p>
          </div>
        </div>

        {/* Unique Acts Decoded */}
        <div className="p-4 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] flex items-center gap-3 col-span-2 lg:col-span-1">
          <div className="p-2.5 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-[#A8A294] tracking-wider">
              Unique Acts
            </p>
            <p className="font-serif text-xl sm:text-2xl font-bold text-blue-400">
              {stats.uniqueActs}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Search & Refinement Bar */}
      <div className="p-4 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#A8A294] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => handleFilterChange({ search: e.target.value })}
            placeholder="Search notes, sections (e.g. § 100), tags..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] placeholder:text-[#666] focus:outline-none focus:border-[#C19B48]"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap sm:flex-nowrap justify-end">
          {/* Category */}
          <select
            value={filters.category}
            onChange={(e) => handleFilterChange({ category: e.target.value })}
            className="px-3 py-2.5 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] focus:outline-none focus:border-[#C19B48] cursor-pointer"
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Status */}
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange({ status: e.target.value as any })}
            className="px-3 py-2.5 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] focus:outline-none focus:border-[#C19B48] cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Drafts</option>
          </select>

          {/* Sort */}
          <select
            value={filters.sort}
            onChange={(e) => handleFilterChange({ sort: e.target.value as any })}
            className="px-3 py-2.5 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] focus:outline-none focus:border-[#C19B48] cursor-pointer"
          >
            <option value="newest">Newest First</option>
            <option value="popular">Most Downloaded</option>
            <option value="act_asc">Act Name (A-Z)</option>
            <option value="act_desc">Act Name (Z-A)</option>
            <option value="oldest">Oldest First</option>
          </select>

          {/* Reset button */}
          {(filters.category !== 'all' ||
            filters.status !== 'all' ||
            filters.search ||
            filters.sort !== 'newest') && (
            <button
              type="button"
              onClick={resetFilters}
              title="Reset all filters"
              className="p-2.5 rounded-xl bg-[#262626] hover:bg-[#3D3D3D] text-[#A8A294] hover:text-[#F7F3E6] border border-[#3D3D3D] transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 4. Table / Loading View */}
      {loading ? (
        <div className="p-16 text-center rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] space-y-3">
          <Loader2 className="w-8 h-8 mx-auto animate-spin text-[#C19B48]" />
          <p className="text-xs text-[#A8A294]">
            Retrieving statutory decoding notes from Knowledge Vault...
          </p>
        </div>
      ) : (
        <BareActAdminTable
          notes={notes}
          onRefresh={loadData}
          onEdit={(note) => setEditingNote(note)}
          onPreview={(note) => setPreviewingNote(note)}
        />
      )}

      {/* 5. Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] text-xs">
          <p className="text-[#A8A294]">
            Showing <strong className="text-[#F7F3E6]">{notes.length}</strong> of{' '}
            <strong className="text-[#F7F3E6]">{totalCount}</strong> decoding notes (Page{' '}
            {page} of {totalPages})
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setFilters((prev) => ({ ...prev, page: prev.page! - 1 }))}
              className="p-2 rounded-xl bg-[#262626] hover:bg-[#3D3D3D] text-[#A8A294] hover:text-[#F7F3E6] border border-[#3D3D3D] disabled:opacity-40 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono text-xs text-[#C19B48] px-2 font-bold">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setFilters((prev) => ({ ...prev, page: prev.page! + 1 }))}
              className="p-2 rounded-xl bg-[#262626] hover:bg-[#3D3D3D] text-[#A8A294] hover:text-[#F7F3E6] border border-[#3D3D3D] disabled:opacity-40 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 6. Modals */}
      <UploadBareActModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onSuccess={loadData}
      />

      <EditBareActModal
        note={editingNote}
        isOpen={!!editingNote}
        onClose={() => setEditingNote(null)}
        onSuccess={loadData}
      />

      <BareActPreviewModal
        note={previewingNote}
        isOpen={!!previewingNote}
        onClose={() => setPreviewingNote(null)}
      />
    </div>
  );
};

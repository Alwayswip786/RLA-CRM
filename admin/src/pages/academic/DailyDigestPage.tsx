import React, { useState, useEffect, useCallback } from 'react';
import {
  Newspaper,
  Plus,
  Search,
  CheckCircle,
  Clock,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Loader2,
  Sparkles,
} from 'lucide-react';
import type {
  DailyLegalDigestEdition,
  DailyDigestAdminStats,
  DailyDigestAdminFilterParams,
} from '../../types/dailyDigest.types';
import { fetchAllEditionsAdmin } from '../../services/dailyDigest.service';
import { EditionAdminTable } from '../../components/daily-digest/EditionAdminTable';
import { CreateEditionModal } from '../../components/daily-digest/CreateEditionModal';
import { EditEditionModal } from '../../components/daily-digest/EditEditionModal';

export const DailyDigestPage: React.FC = () => {
  const [editions, setEditions] = useState<DailyLegalDigestEdition[]>([]);
  const [stats, setStats] = useState<DailyDigestAdminStats>({
    totalEditions: 0,
    publishedCount: 0,
    draftCount: 0,
    scheduledCount: 0,
    totalReads: 0,
    totalBookmarks: 0,
  });
  const [loading, setLoading] = useState(true);

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [filters, setFilters] = useState<DailyDigestAdminFilterParams>({
    status: 'all',
    search: '',
    year: 'all',
    sort: 'newest',
    page: 1,
    limit: 10,
  });

  // Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingEditionId, setEditingEditionId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchAllEditionsAdmin(filters);
      if (res.success) {
        setEditions(res.editions);
        setStats(res.stats);
        setTotalCount(res.total);
        setTotalPages(res.totalPages);
        setPage(res.page);
      }
    } catch (err: any) {
      console.error('Failed to load daily digest admin editions:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFilterChange = (newFilters: Partial<DailyDigestAdminFilterParams>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      page: newFilters.page !== undefined ? newFilters.page : 1,
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      status: 'all',
      search: '',
      year: 'all',
      sort: 'newest',
      page: 1,
      limit: 10,
    });
  };

  return (
    <div className="space-y-6 select-none animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C19B48]/15 border border-[#C19B48]/30 text-[#C19B48] text-xs font-semibold">
            <Newspaper className="w-3.5 h-3.5" />
            <span>Judicial Ratio Decidendi Desk</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#F7F3E6]">
            Daily Legal Digest CMS & Case Briefs
          </h1>
          <p className="text-xs text-[#A8A294] max-w-2xl leading-relaxed">
            Curate and publish morning landmark ratios, Bare Act amendment updates, and high-yield case summaries directly to the student dashboard.
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C19B48] hover:bg-[#D8B862] text-[#1E1E1E] text-xs font-bold transition-colors cursor-pointer shrink-0 self-start sm:self-auto shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>Compose New Edition</span>
        </button>
      </div>

      {/* 4 Live KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Editions */}
        <div className="p-5 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#A8A294]">Total Editions</span>
            <div className="p-2 rounded-xl bg-[#C19B48]/15 text-[#C19B48]">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <p className="font-mono text-2xl sm:text-3xl font-bold text-[#F7F3E6]">
            {stats.totalEditions}
          </p>
          <span className="text-[10px] text-[#A8A294] block">Archived & Active Editions</span>
        </div>

        {/* Published in Portals */}
        <div className="p-5 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#A8A294]">Published in Portals</span>
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="font-mono text-2xl sm:text-3xl font-bold text-emerald-400">
            {stats.publishedCount}
          </p>
          <span className="text-[10px] text-[#A8A294] block">Live in Student Classrooms</span>
        </div>

        {/* Scheduled Broadcasts */}
        <div className="p-5 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#A8A294]">Scheduled Broadcasts</span>
            <div className="p-2 rounded-xl bg-blue-500/15 text-blue-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="font-mono text-2xl sm:text-3xl font-bold text-blue-400">
            {stats.scheduledCount}
          </p>
          <span className="text-[10px] text-[#A8A294] block">Queued for Morning Broadcast</span>
        </div>

        {/* Total Aspirant Reads */}
        <div className="p-5 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#A8A294]">Total Aspirant Reads</span>
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <p className="font-mono text-2xl sm:text-3xl font-bold text-amber-400">
            {stats.totalReads}
          </p>
          <span className="text-[10px] text-[#A8A294] block">
            Across {stats.totalBookmarks} bookmarked items
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#A8A294] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filters.search || ''}
              onChange={(e) => handleFilterChange({ search: e.target.value, page: 1 })}
              placeholder="Search by edition date (YYYY-MM-DD), title, legal maxim, or case..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-xs text-[#F7F3E6] placeholder-[#A8A294]/60 focus:outline-none focus:border-[#C19B48]"
            />
          </div>

          {/* Reset Filters */}
          <button
            onClick={handleResetFilters}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#262626] hover:bg-[#3D3D3D] text-[#A8A294] hover:text-[#F7F3E6] text-xs font-semibold transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* Status Filter */}
          <div>
            <label className="block text-[10px] font-semibold text-[#A8A294] mb-1">Status</label>
            <select
              value={filters.status || 'all'}
              onChange={(e) => handleFilterChange({ status: e.target.value, page: 1 })}
              className="w-full px-2.5 py-1.5 rounded-xl bg-[#262626] border border-[#3D3D3D] text-xs text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
            >
              <option value="all">All Statuses</option>
              <option value="published">Published Only</option>
              <option value="scheduled">Scheduled Only</option>
              <option value="draft">Drafts Only</option>
              <option value="archived">Archived Only</option>
            </select>
          </div>

          {/* Year Filter */}
          <div>
            <label className="block text-[10px] font-semibold text-[#A8A294] mb-1">Year</label>
            <select
              value={filters.year || 'all'}
              onChange={(e) => handleFilterChange({ year: e.target.value, page: 1 })}
              className="w-full px-2.5 py-1.5 rounded-xl bg-[#262626] border border-[#3D3D3D] text-xs text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
            >
              <option value="all">All Years</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
            </select>
          </div>

          {/* Sort Order */}
          <div>
            <label className="block text-[10px] font-semibold text-[#A8A294] mb-1">Sort Order</label>
            <select
              value={filters.sort || 'newest'}
              onChange={(e) => handleFilterChange({ sort: e.target.value as any, page: 1 })}
              className="w-full px-2.5 py-1.5 rounded-xl bg-[#262626] border border-[#3D3D3D] text-xs text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
            >
              <option value="newest">Newest Date First</option>
              <option value="oldest">Oldest Date First</option>
              <option value="popular">Most Student Reads</option>
            </select>
          </div>
        </div>
      </div>

      {/* Editions Table */}
      {loading ? (
        <div className="p-12 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] flex flex-col items-center justify-center gap-3 text-[#A8A294]">
          <Loader2 className="w-7 h-7 animate-spin text-[#C19B48]" />
          <p className="text-xs font-medium">Loading Daily Legal Digest editions...</p>
        </div>
      ) : (
        <EditionAdminTable
          editions={editions}
          onRefresh={loadData}
          onEdit={(ed) => setEditingEditionId(ed._id)}
        />
      )}

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D]">
          <span className="text-xs text-[#A8A294]">
            Showing <strong className="text-[#F7F3E6]">{editions.length}</strong> of{' '}
            <strong className="text-[#F7F3E6]">{totalCount}</strong> editions (Page {page} of{' '}
            {totalPages})
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleFilterChange({ page: page - 1 })}
              disabled={page <= 1}
              className="p-2 rounded-lg bg-[#262626] text-[#A8A294] hover:text-[#F7F3E6] disabled:opacity-40 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => handleFilterChange({ page: p })}
                className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  p === page
                    ? 'bg-[#C19B48] text-[#1E1E1E]'
                    : 'bg-[#262626] text-[#A8A294] hover:text-[#F7F3E6]'
                }`}
              >
                {p}
              </button>
            ))}

            <button
              onClick={() => handleFilterChange({ page: page + 1 })}
              disabled={page >= totalPages}
              className="p-2 rounded-lg bg-[#262626] text-[#A8A294] hover:text-[#F7F3E6] disabled:opacity-40 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Create Modal */}
      <CreateEditionModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={loadData}
      />

      {/* Edit Modal */}
      <EditEditionModal
        isOpen={!!editingEditionId}
        editionId={editingEditionId}
        onClose={() => setEditingEditionId(null)}
        onSuccess={loadData}
      />
    </div>
  );
};

import React, { useState, useEffect, useCallback } from 'react';
import {
  Gavel,
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
} from 'lucide-react';
import type {
  JudgementDigest,
  JudgementAdminStats,
  JudgementAdminFilterParams,
  CourtCategory,
  JudgementImportance,
} from '../../types/judgement.types';
import { fetchAllJudgementsAdmin } from '../../services/judgement.service';
import { JudgementAdminTable } from '../../components/judgement/JudgementAdminTable';
import { UploadJudgementModal } from '../../components/judgement/UploadJudgementModal';
import { EditJudgementModal } from '../../components/judgement/EditJudgementModal';

const COURTS: CourtCategory[] = [
  'Supreme Court of India',
  'Delhi High Court',
  'Bombay High Court',
  'Allahabad High Court',
  'Punjab & Haryana High Court',
  'Calcutta High Court',
  'Madras High Court',
  'Other High Courts',
];

const IMPORTANCES: JudgementImportance[] = [
  'Landmark',
  'Leading',
  'Recent / Overruling',
  'Standard',
];

export const JudgmentsPage: React.FC = () => {
  const [judgements, setJudgements] = useState<JudgementDigest[]>([]);
  const [stats, setStats] = useState<JudgementAdminStats>({
    totalPrecedents: 0,
    publishedCount: 0,
    draftCount: 0,
    totalDownloads: 0,
    totalViews: 0,
  });
  const [loading, setLoading] = useState(true);

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [filters, setFilters] = useState<JudgementAdminFilterParams>({
    court: 'all',
    importance: 'all',
    status: 'all',
    search: '',
    sort: 'newest',
    page: 1,
    limit: 10,
  });

  // Modals
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [editingJudgement, setEditingJudgement] = useState<JudgementDigest | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchAllJudgementsAdmin(filters);
      if (res.success) {
        setJudgements(res.judgements);
        setStats(res.stats);
        setTotalCount(res.total);
        setTotalPages(res.totalPages);
        setPage(res.page);
      }
    } catch (err: any) {
      console.error('Failed to load judgements admin data:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFilterChange = (newFilters: Partial<JudgementAdminFilterParams>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      page: newFilters.page !== undefined ? newFilters.page : 1,
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      court: 'all',
      importance: 'all',
      status: 'all',
      search: '',
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
            <Gavel className="w-3.5 h-3.5" />
            <span>Landmark Ratio & Case Law Repository CMS</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#F7F3E6]">
            Landmark Judgement Digest Vault
          </h1>
          <p className="text-xs text-[#A8A294] max-w-2xl leading-relaxed">
            Curate Supreme Court and High Court precedents, 3-point ratio decidendi for Mains, Coram,
            and manage PDF digest documents.
          </p>
        </div>

        <button
          onClick={() => setUploadModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C19B48] hover:bg-[#D8B862] text-[#1E1E1E] text-xs font-bold transition-colors cursor-pointer shrink-0 self-start sm:self-auto shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>Upload Landmark Case</span>
        </button>
      </div>

      {/* 4 Live KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Precedents */}
        <div className="p-5 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#A8A294]">Total Precedents</span>
            <div className="p-2 rounded-xl bg-[#C19B48]/15 text-[#C19B48]">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <p className="font-mono text-2xl sm:text-3xl font-bold text-[#F7F3E6]">
            {stats.totalPrecedents}
          </p>
          <span className="text-[10px] text-[#A8A294] block">Apex & High Court Precedents</span>
        </div>

        {/* Published Precedents */}
        <div className="p-5 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#A8A294]">Live in Student Vault</span>
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="font-mono text-2xl sm:text-3xl font-bold text-emerald-400">
            {stats.publishedCount}
          </p>
          <span className="text-[10px] text-[#A8A294] block">Available to Enrolled Students</span>
        </div>

        {/* Draft Precedents */}
        <div className="p-5 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#A8A294]">Drafts in Review</span>
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="font-mono text-2xl sm:text-3xl font-bold text-amber-400">
            {stats.draftCount}
          </p>
          <span className="text-[10px] text-[#A8A294] block">Under Faculty Review</span>
        </div>

        {/* Total Student Downloads */}
        <div className="p-5 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#A8A294]">Total PDF Downloads</span>
            <div className="p-2 rounded-xl bg-blue-500/15 text-blue-400">
              <Download className="w-4 h-4" />
            </div>
          </div>
          <p className="font-mono text-2xl sm:text-3xl font-bold text-blue-400">
            {stats.totalDownloads}
          </p>
          <span className="text-[10px] text-[#A8A294] block">
            Across {stats.totalViews} digest views
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
              placeholder="Search by case title, citation, legal section, judge or ratio..."
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          {/* Court Filter */}
          <div>
            <label className="block text-[10px] font-semibold text-[#A8A294] mb-1">Court</label>
            <select
              value={filters.court || 'all'}
              onChange={(e) => handleFilterChange({ court: e.target.value, page: 1 })}
              className="w-full px-2.5 py-1.5 rounded-xl bg-[#262626] border border-[#3D3D3D] text-xs text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
            >
              <option value="all">All Courts</option>
              {COURTS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Importance Filter */}
          <div>
            <label className="block text-[10px] font-semibold text-[#A8A294] mb-1">Precedent Type</label>
            <select
              value={filters.importance || 'all'}
              onChange={(e) => handleFilterChange({ importance: e.target.value, page: 1 })}
              className="w-full px-2.5 py-1.5 rounded-xl bg-[#262626] border border-[#3D3D3D] text-xs text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
            >
              <option value="all">All Types</option>
              {IMPORTANCES.map((imp) => (
                <option key={imp} value={imp}>
                  {imp}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[10px] font-semibold text-[#A8A294] mb-1">Status</label>
            <select
              value={filters.status || 'all'}
              onChange={(e) => handleFilterChange({ status: e.target.value as any, page: 1 })}
              className="w-full px-2.5 py-1.5 rounded-xl bg-[#262626] border border-[#3D3D3D] text-xs text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
            >
              <option value="all">All Statuses</option>
              <option value="published">Published Only</option>
              <option value="scheduled">Scheduled Only</option>
              <option value="draft">Drafts Only</option>
              <option value="archived">Archived Only</option>
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
              <option value="newest">Recently Uploaded</option>
              <option value="date_desc">Judgement Date (Newest)</option>
              <option value="date_asc">Judgement Date (Oldest)</option>
              <option value="popular">Most Downloaded</option>
              <option value="title_asc">Title (A - Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Judgements Data Table */}
      {loading ? (
        <div className="p-12 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] flex flex-col items-center justify-center gap-3 text-[#A8A294]">
          <Loader2 className="w-7 h-7 animate-spin text-[#C19B48]" />
          <p className="text-xs font-medium">Loading landmark precedents...</p>
        </div>
      ) : (
        <JudgementAdminTable
          judgements={judgements}
          onRefresh={loadData}
          onEdit={(j) => setEditingJudgement(j)}
        />
      )}

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D]">
          <span className="text-xs text-[#A8A294]">
            Showing <strong className="text-[#F7F3E6]">{judgements.length}</strong> of{' '}
            <strong className="text-[#F7F3E6]">{totalCount}</strong> precedents (Page {page} of{' '}
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

      {/* Upload Precedent Modal */}
      <UploadJudgementModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onSuccess={loadData}
      />

      {/* Edit Precedent Modal */}
      <EditJudgementModal
        judgement={editingJudgement}
        isOpen={!!editingJudgement}
        onClose={() => setEditingJudgement(null)}
        onSuccess={loadData}
      />
    </div>
  );
};

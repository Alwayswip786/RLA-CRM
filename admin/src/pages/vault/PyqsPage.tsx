import React, { useState, useEffect, useCallback } from 'react';
import {
  FolderArchive,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Loader2,
} from 'lucide-react';
import type { PyqPaper, PyqAdminFilterParams, PyqAdminStats } from '../../types/pyq.types';
import { fetchAllPyqsAdmin } from '../../services/pyq.service';
import { UploadPyqModal } from '../../components/pyq/UploadPyqModal';
import { EditPyqModal } from '../../components/pyq/EditPyqModal';
import { PyqAdminTable } from '../../components/pyq/PyqAdminTable';

const COMMON_EXAMS = [
  'Delhi Judicial Service (DJS)',
  'Delhi Higher Judicial Service (DHJS)',
  'Haryana Civil Services (Judicial)',
  'UP PCS-J Judicial Examination',
  'UP Higher Judicial Service (UP HJS)',
  'MP Civil Judge (MP CJ)',
  'Rajasthan Judicial Service (RJS)',
  'Himachal Pradesh Judicial Service (HPJS)',
  'Punjab Superior Judicial Services (PJS)',
];

export const PyqsPage: React.FC = () => {
  const [papers, setPapers] = useState<PyqPaper[]>([]);
  const [stats, setStats] = useState<PyqAdminStats>({
    totalPapers: 0,
    publishedCount: 0,
    draftCount: 0,
    totalDownloads: 0,
    totalViews: 0,
  });
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filters, setFilters] = useState<PyqAdminFilterParams>({
    exam: 'all',
    stage: 'all',
    status: 'all',
    search: '',
    sort: 'newest',
    page: 1,
    limit: 15,
  });

  // Modals
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [editingPaper, setEditingPaper] = useState<PyqPaper | null>(null);

  const loadPapers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchAllPyqsAdmin(filters);
      if (res.success) {
        setPapers(res.pyqs);
        setStats(res.stats);
        setTotal(res.total);
        setTotalPages(res.totalPages);
      }
    } catch (err: any) {
      console.error('Failed to load admin PYQs:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadPapers();
  }, [loadPapers]);

  return (
    <div className="space-y-6 select-none animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C19B48]/15 border border-[#C19B48]/30 text-[#C19B48] text-xs font-semibold">
            <FolderArchive className="w-3.5 h-3.5" />
            <span>State Judiciary Question Vault & Model Solutions</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#F7F3E6]">
            Solved PYQ Archive & Model Solutions
          </h1>
          <p className="text-xs text-[#A8A294] max-w-2xl leading-relaxed">
            Manage 10-year state judicial question papers (Delhi, Haryana, UP, MP) with official model answer scripts, ratio analyses, and live PDF downloads.
          </p>
        </div>

        <button
          onClick={() => setIsUploadOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C19B48] hover:bg-[#D8B862] text-[#1E1E1E] text-xs font-bold transition-colors cursor-pointer shrink-0 self-start sm:self-auto shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Upload Solved Paper</span>
        </button>
      </div>

      {/* 4 KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Papers */}
        <div className="p-5 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] space-y-1">
          <div className="flex items-center justify-between text-xs text-[#A8A294]">
            <span>Total Papers</span>
            <FileText className="w-4 h-4 text-[#C19B48]" />
          </div>
          <div className="text-2xl font-serif font-bold text-[#F7F3E6]">
            {stats.totalPapers}
          </div>
          <p className="text-[10px] text-[#A8A294]">Across all judicial state cadres</p>
        </div>

        {/* Published */}
        <div className="p-5 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] space-y-1">
          <div className="flex items-center justify-between text-xs text-[#A8A294]">
            <span>Published (Live)</span>
            <CheckCircle2 className="w-4 h-4 text-[#34D399]" />
          </div>
          <div className="text-2xl font-serif font-bold text-[#34D399]">
            {stats.publishedCount}
          </div>
          <p className="text-[10px] text-[#A8A294]">Accessible in Student Vault</p>
        </div>

        {/* Drafts */}
        <div className="p-5 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] space-y-1">
          <div className="flex items-center justify-between text-xs text-[#A8A294]">
            <span>Drafts / Review</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-serif font-bold text-amber-400">
            {stats.draftCount}
          </div>
          <p className="text-[10px] text-[#A8A294]">Under faculty peer-review</p>
        </div>

        {/* Downloads */}
        <div className="p-5 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] space-y-1">
          <div className="flex items-center justify-between text-xs text-[#A8A294]">
            <span>Student Downloads</span>
            <Download className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-serif font-bold text-blue-400">
            {stats.totalDownloads}
          </div>
          <p className="text-[10px] text-[#A8A294]">Cumulative downloads tracked</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-[#A8A294] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={filters.search || ''}
              onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
              placeholder="Search by title, subject, code, or topics..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#141414] border border-[#3D3D3D] text-xs text-[#F7F3E6] placeholder-[#A8A294] focus:outline-none focus:border-[#C19B48]"
            />
          </div>

          {/* Exam Filter */}
          <select
            value={filters.exam || 'all'}
            onChange={(e) => setFilters({ ...filters, exam: e.target.value, page: 1 })}
            className="px-3 py-2 rounded-xl bg-[#141414] border border-[#3D3D3D] text-xs text-[#F7F3E6] focus:outline-none focus:border-[#C19B48] cursor-pointer"
          >
            <option value="all">All Exams</option>
            {COMMON_EXAMS.map((ex) => (
              <option key={ex} value={ex}>
                {ex}
              </option>
            ))}
          </select>

          {/* Stage Filter */}
          <select
            value={filters.stage || 'all'}
            onChange={(e) => setFilters({ ...filters, stage: e.target.value, page: 1 })}
            className="px-3 py-2 rounded-xl bg-[#141414] border border-[#3D3D3D] text-xs text-[#F7F3E6] focus:outline-none focus:border-[#C19B48] cursor-pointer"
          >
            <option value="all">All Stages</option>
            <option value="Prelims">Prelims</option>
            <option value="Mains">Mains</option>
          </select>

          {/* Status Filter */}
          <select
            value={filters.status || 'all'}
            onChange={(e) => setFilters({ ...filters, status: e.target.value as any, page: 1 })}
            className="px-3 py-2 rounded-xl bg-[#141414] border border-[#3D3D3D] text-xs text-[#F7F3E6] focus:outline-none focus:border-[#C19B48] cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="published">Published Only</option>
            <option value="draft">Drafts Only</option>
          </select>

          {/* Reset */}
          {(filters.search || filters.exam !== 'all' || filters.stage !== 'all' || filters.status !== 'all') && (
            <button
              onClick={() =>
                setFilters({
                  exam: 'all',
                  stage: 'all',
                  status: 'all',
                  search: '',
                  sort: 'newest',
                  page: 1,
                })
              }
              className="p-2 rounded-xl bg-[#262626] text-[#A8A294] hover:text-[#F7F3E6] transition-colors cursor-pointer"
              title="Reset Filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <span className="text-xs font-mono text-[#A8A294]">
          Total: <strong className="text-[#F7F3E6]">{total}</strong> records
        </span>
      </div>

      {/* Main Table */}
      {loading ? (
        <div className="p-16 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-[#C19B48] animate-spin" />
          <p className="text-xs text-[#A8A294]">Loading judicial question bank records...</p>
        </div>
      ) : (
        <PyqAdminTable
          papers={papers}
          onRefresh={loadPapers}
          onEdit={(paper) => setEditingPaper(paper)}
        />
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="p-4 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] flex items-center justify-between">
          <button
            onClick={() => setFilters((prev) => ({ ...prev, page: (prev.page || 1) - 1 }))}
            disabled={(filters.page || 1) <= 1}
            className="px-3.5 py-1.5 rounded-xl bg-[#262626] border border-[#3D3D3D] text-xs font-semibold text-[#A8A294] hover:text-[#F7F3E6] disabled:opacity-40 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <span className="text-xs font-mono text-[#A8A294]">
            Page <strong className="text-[#F7F3E6]">{filters.page || 1}</strong> of{' '}
            <strong className="text-[#F7F3E6]">{totalPages}</strong>
          </span>

          <button
            onClick={() => setFilters((prev) => ({ ...prev, page: (prev.page || 1) + 1 }))}
            disabled={(filters.page || 1) >= totalPages}
            className="px-3.5 py-1.5 rounded-xl bg-[#262626] border border-[#3D3D3D] text-xs font-semibold text-[#A8A294] hover:text-[#F7F3E6] disabled:opacity-40 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Upload Paper Modal */}
      <UploadPyqModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={loadPapers}
      />

      {/* Edit Paper Modal */}
      <EditPyqModal
        paper={editingPaper}
        isOpen={editingPaper !== null}
        onClose={() => setEditingPaper(null)}
        onSuccess={loadPapers}
      />
    </div>
  );
};

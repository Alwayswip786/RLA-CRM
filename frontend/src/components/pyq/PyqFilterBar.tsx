import React from 'react';
import { Search, X, RotateCcw } from 'lucide-react';
import type { PyqFilterParams } from '../../types/pyq.types';

interface PyqFilterBarProps {
  filters: PyqFilterParams;
  onChange: (newFilters: PyqFilterParams) => void;
  availableExams: string[];
  availableYears: number[];
  availableStages: string[];
  totalResults: number;
}

export const PyqFilterBar: React.FC<PyqFilterBarProps> = ({
  filters,
  onChange,
  availableExams,
  availableYears,
  totalResults,
}) => {
  const isFiltered =
    (filters.search && filters.search.trim() !== '') ||
    (filters.exam && filters.exam !== 'all') ||
    (filters.year && filters.year !== 'all') ||
    (filters.stage && filters.stage !== 'all') ||
    (filters.sort && filters.sort !== 'year_desc');

  const handleReset = () => {
    onChange({
      search: '',
      exam: 'all',
      year: 'all',
      stage: 'all',
      sort: 'year_desc',
      page: 1,
    });
  };

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] space-y-4 shadow-xs">
      {/* Top row: Search input and quick sort */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={filters.search || ''}
            onChange={(e) => onChange({ ...filters, search: e.target.value, page: 1 })}
            placeholder="Search by topic, bare act section, or exam name (e.g. Res Judicata, CPC, DJS 2023)..."
            className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#c19b48] transition-colors"
          />
          {filters.search && (
            <button
              onClick={() => onChange({ ...filters, search: '', page: 1 })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-slate-400 hidden sm:inline">Sort:</span>
          <select
            value={filters.sort || 'year_desc'}
            onChange={(e) => onChange({ ...filters, sort: e.target.value as any, page: 1 })}
            className="px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:border-[#c19b48] cursor-pointer"
          >
            <option value="year_desc">Latest Exam Year</option>
            <option value="year_asc">Oldest Exam Year</option>
            <option value="popular">Most Downloaded</option>
            <option value="newest">Recently Uploaded</option>
            <option value="title_asc">Title (A to Z)</option>
          </select>
        </div>
      </div>

      {/* Bottom row: Faceted Selectors (State, Stage, Year) */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-[#143564]/50">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Exam / State */}
          <select
            value={filters.exam || 'all'}
            onChange={(e) => onChange({ ...filters, exam: e.target.value, page: 1 })}
            className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-[#c19b48] cursor-pointer"
          >
            <option value="all">All Judicial Exams</option>
            {availableExams.map((exam) => (
              <option key={exam} value={exam}>
                {exam}
              </option>
            ))}
          </select>

          {/* Year */}
          <select
            value={filters.year || 'all'}
            onChange={(e) => onChange({ ...filters, year: e.target.value, page: 1 })}
            className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-[#c19b48] cursor-pointer"
          >
            <option value="all">All Years</option>
            {availableYears.map((yr) => (
              <option key={yr} value={String(yr)}>
                {yr}
              </option>
            ))}
          </select>

          {/* Stage Pills */}
          <div className="flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-[#061120] border border-slate-200 dark:border-[#143564]">
            {(['all', 'Prelims', 'Mains'] as const).map((stage) => {
              const active = (filters.stage || 'all').toLowerCase() === stage.toLowerCase();
              return (
                <button
                  key={stage}
                  onClick={() => onChange({ ...filters, stage: stage === 'all' ? 'all' : stage, page: 1 })}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    active
                      ? 'bg-[#c19b48] text-[#061120] shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {stage === 'all' ? 'All Stages' : stage}
                </button>
              );
            })}
          </div>

          {/* Reset Filters */}
          {isFiltered && (
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Results Counter */}
        <span className="text-xs font-medium text-slate-400">
          Showing <strong className="text-slate-800 dark:text-white">{totalResults}</strong> papers
        </span>
      </div>
    </div>
  );
};

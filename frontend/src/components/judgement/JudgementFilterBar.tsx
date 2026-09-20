import React from 'react';
import { Search, RotateCcw } from 'lucide-react';
import type { JudgementFilterParams } from '../../types/judgement.types';

interface JudgementFilterBarProps {
  filters: JudgementFilterParams;
  onFilterChange: (filters: Partial<JudgementFilterParams>) => void;
  onReset: () => void;
  availableCourts: string[];
  availableYears: number[];
  availableSubjects: string[];
  availableImportances: string[];
  totalCount: number;
}

export const JudgementFilterBar: React.FC<JudgementFilterBarProps> = ({
  filters,
  onFilterChange,
  onReset,
  availableCourts,
  availableYears,
  availableSubjects,
  availableImportances,
  totalCount,
}) => {
  const isFiltered =
    (filters.court && filters.court !== 'all') ||
    (filters.year && filters.year !== 'all') ||
    (filters.subject && filters.subject !== 'all') ||
    (filters.importance && filters.importance !== 'all') ||
    (filters.search && filters.search.trim().length > 0) ||
    filters.sort !== 'date_desc';

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] space-y-4 shadow-xs">
      {/* Search Input and Top Row */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filters.search || ''}
            onChange={(e) => onFilterChange({ search: e.target.value, page: 1 })}
            placeholder="Search landmark cases by title, citation, section, or ratio decidendi..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#c19b48] transition-colors"
          />
        </div>

        {/* Results Counter & Reset Button */}
        <div className="flex items-center justify-between md:justify-end gap-3">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
            Showing <strong className="text-slate-900 dark:text-white">{totalCount}</strong> precedents
          </span>

          {isFiltered && (
            <button
              onClick={onReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-[#c19b48]/15 hover:bg-amber-100 dark:hover:bg-[#c19b48]/25 text-[#c19b48] dark:text-[#e8cf8d] text-xs font-semibold transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Dropdowns Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-1">
        {/* Court Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
            Court
          </label>
          <select
            value={filters.court || 'all'}
            onChange={(e) => onFilterChange({ court: e.target.value, page: 1 })}
            className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#c19b48] truncate"
          >
            <option value="all">All Courts</option>
            {availableCourts.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Subject Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
            Subject Area
          </label>
          <select
            value={filters.subject || 'all'}
            onChange={(e) => onFilterChange({ subject: e.target.value, page: 1 })}
            className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#c19b48] truncate"
          >
            <option value="all">All Subjects</option>
            {availableSubjects.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Importance Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
            Precedent Type
          </label>
          <select
            value={filters.importance || 'all'}
            onChange={(e) => onFilterChange({ importance: e.target.value, page: 1 })}
            className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#c19b48] truncate"
          >
            <option value="all">All Types</option>
            {availableImportances.map((imp) => (
              <option key={imp} value={imp}>
                {imp}
              </option>
            ))}
          </select>
        </div>

        {/* Year Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
            Year
          </label>
          <select
            value={filters.year || 'all'}
            onChange={(e) => onFilterChange({ year: e.target.value, page: 1 })}
            className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#c19b48]"
          >
            <option value="all">All Years</option>
            {availableYears.map((yr) => (
              <option key={yr} value={String(yr)}>
                {yr}
              </option>
            ))}
          </select>
        </div>

        {/* Sort By Filter */}
        <div className="col-span-2 sm:col-span-1">
          <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
            Sort Order
          </label>
          <select
            value={filters.sort || 'date_desc'}
            onChange={(e) =>
              onFilterChange({
                sort: e.target.value as any,
                page: 1,
              })
            }
            className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#c19b48]"
          >
            <option value="date_desc">Judgement Date (Newest first)</option>
            <option value="date_asc">Judgement Date (Oldest first)</option>
            <option value="popular">Most Downloaded</option>
            <option value="title_asc">Title (A - Z)</option>
            <option value="newest">Recently Added</option>
          </select>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { Search, RotateCcw } from 'lucide-react';
import type { JudgementFilterParams } from '../../types/judgement.types';
import { CustomSelect, type SelectOption } from '../ui/CustomSelect';

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
    (filters.sort && filters.sort !== 'date_desc') ||
    !!filters.search;

  const courtOptions: SelectOption[] = [
    { value: 'all', label: 'All Courts' },
    ...availableCourts.map((c) => ({ value: c, label: c })),
  ];

  const subjectOptions: SelectOption[] = [
    { value: 'all', label: 'All Subjects' },
    ...availableSubjects.map((s) => ({ value: s, label: s })),
  ];

  const importanceOptions: SelectOption[] = [
    { value: 'all', label: 'All Types' },
    ...availableImportances.map((imp) => ({ value: imp, label: imp })),
  ];

  const yearOptions: SelectOption[] = [
    { value: 'all', label: 'All Years' },
    ...availableYears.map((yr) => ({ value: String(yr), label: String(yr) })),
  ];

  const sortOptions: SelectOption[] = [
    { value: 'date_desc', label: 'Judgement Date (Newest first)' },
    { value: 'date_asc', label: 'Judgement Date (Oldest first)' },
    { value: 'popular', label: 'Most Downloaded' },
    { value: 'title_asc', label: 'Title (A - Z)' },
    { value: 'newest', label: 'Recently Added' },
  ];

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] space-y-3.5 shadow-xs">
      {/* Top Search & Filter Info Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-xl">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filters.search || ''}
            onChange={(e) => onFilterChange({ search: e.target.value, page: 1 })}
            placeholder="Search landmark rulings, judge names, keywords, or citations..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#c19b48]"
          />
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 text-xs">
          <span className="text-slate-500 dark:text-slate-400 font-medium">
            Found <strong className="text-slate-900 dark:text-white font-mono">{totalCount}</strong> Precedents
          </span>

          {isFiltered && (
            <button
              onClick={onReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-[#c19b48] hover:bg-slate-100 dark:hover:bg-[#143564]/50 transition-colors cursor-pointer"
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
          <CustomSelect
            label="Court"
            options={courtOptions}
            value={filters.court || 'all'}
            onChange={(val) => onFilterChange({ court: val, page: 1 })}
            placeholder="All Courts"
            searchable={true}
            sheetTitle="Select Court Jurisdiction"
          />
        </div>

        {/* Subject Filter */}
        <div>
          <CustomSelect
            label="Subject Area"
            options={subjectOptions}
            value={filters.subject || 'all'}
            onChange={(val) => onFilterChange({ subject: val, page: 1 })}
            placeholder="All Subjects"
            searchable={true}
            sheetTitle="Select Legal Subject"
          />
        </div>

        {/* Importance Filter */}
        <div>
          <CustomSelect
            label="Precedent Type"
            options={importanceOptions}
            value={filters.importance || 'all'}
            onChange={(val) => onFilterChange({ importance: val, page: 1 })}
            placeholder="All Types"
            sheetTitle="Select Precedent Type"
          />
        </div>

        {/* Year Filter */}
        <div>
          <CustomSelect
            label="Decision Year"
            options={yearOptions}
            value={filters.year || 'all'}
            onChange={(val) => onFilterChange({ year: val, page: 1 })}
            placeholder="All Years"
            searchable={true}
            sheetTitle="Filter by Year"
          />
        </div>

        {/* Sort By Filter */}
        <div className="col-span-2 sm:col-span-1">
          <CustomSelect
            label="Sort Order"
            options={sortOptions}
            value={filters.sort || 'date_desc'}
            onChange={(val) => onFilterChange({ sort: val as any, page: 1 })}
            placeholder="Sort Order"
            sheetTitle="Sort Precedents"
          />
        </div>
      </div>
    </div>
  );
};

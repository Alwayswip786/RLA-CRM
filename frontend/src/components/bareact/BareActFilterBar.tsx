import React from 'react';
import { Search, X, RotateCcw } from 'lucide-react';
import type { BareActFilterParams, ActCategory } from '../../types/bareAct.types';
import { CustomSelect, type SelectOption } from '../ui/CustomSelect';
import { ScrollableTabs } from '../ui/tabs';

interface BareActFilterBarProps {
  filters: BareActFilterParams;
  availableActs: string[];
  onChange: (newFilters: Partial<BareActFilterParams>) => void;
  onReset: () => void;
}

const CATEGORY_TABS: { label: string; shortLabel?: string; value: string }[] = [
  { label: 'All Categories', shortLabel: 'All', value: 'all' },
  { label: 'New Criminal Laws (BNS/BNSS/BSA)', shortLabel: 'Criminal Laws (BNS)', value: 'New Criminal Laws' },
  { label: 'Major Procedural (CPC/CrPC)', shortLabel: 'Procedural (CPC/CrPC)', value: 'Major Procedural Act' },
  { label: 'Major Substantive (IPC/Constitution)', shortLabel: 'Substantive (IPC)', value: 'Major Substantive Act' },
  { label: 'Civil & Property Law', shortLabel: 'Civil & Property', value: 'Civil & Property Law' },
  { label: 'Commercial & Corporate Law', shortLabel: 'Corporate Law', value: 'Commercial & Corporate Law' },
];

export const BareActFilterBar: React.FC<BareActFilterBarProps> = ({
  filters,
  availableActs,
  onChange,
  onReset,
}) => {
  const isFiltered =
    (filters.category && filters.category !== 'all') ||
    (filters.actName && filters.actName !== 'all') ||
    (filters.difficulty && filters.difficulty !== 'all') ||
    !!filters.search ||
    (filters.sort && filters.sort !== 'newest');

  const actOptions: SelectOption[] = [
    { value: 'all', label: 'All Specific Acts' },
    ...availableActs.map((act) => ({ value: act, label: act })),
  ];

  const difficultyOptions: SelectOption[] = [
    { value: 'all', label: 'All Difficulties' },
    { value: 'Prelims Booster', label: 'Prelims Booster' },
    { value: 'Mains Analytical', label: 'Mains Analytical' },
    { value: 'Comprehensive Mastery', label: 'Comprehensive Mastery' },
  ];

  const sortOptions: SelectOption[] = [
    { value: 'newest', label: 'Newest Uploads' },
    { value: 'popular', label: 'Most Downloaded' },
    { value: 'act_asc', label: 'Act Name (A-Z)' },
    { value: 'year_desc', label: 'Enactment Year' },
  ];

  return (
    <div className="space-y-4">
      {/* 1. Category Pill Tabs */}
      <ScrollableTabs<string>
        value={filters.category || 'all'}
        onChange={(val) =>
          onChange({ category: val === 'all' ? 'all' : (val as ActCategory) })
        }
        variant="pill"
        items={CATEGORY_TABS.map((tab) => ({
          id: tab.value,
          label: tab.label,
          shortLabel: tab.shortLabel,
        }))}
      />

      {/* 2. Search & Select Filters */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        {/* Search Input */}
        <div className="relative w-full md:w-80 lg:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filters.search || ''}
            onChange={(e) => onChange({ search: e.target.value })}
            placeholder="Search sections (e.g. § 100), Act, topics..."
            className="w-full pl-10 pr-9 py-2 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#c19b48]"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => onChange({ search: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdown Filters */}
        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap sm:flex-nowrap justify-start md:justify-end">
          {/* Act Selector */}
          {availableActs.length > 0 && (
            <div className="w-full sm:w-44">
              <CustomSelect
                options={actOptions}
                value={filters.actName || 'all'}
                onChange={(val) => onChange({ actName: val })}
                placeholder="Specific Act"
                searchable={true}
                sheetTitle="Select Bare Act"
                sheetSubtitle="Filter decoded sections by specific statute"
              />
            </div>
          )}

          {/* Difficulty */}
          <div className="w-[calc(50%-0.25rem)] sm:w-40">
            <CustomSelect
              options={difficultyOptions}
              value={filters.difficulty || 'all'}
              onChange={(val) => onChange({ difficulty: val })}
              placeholder="Difficulty"
              sheetTitle="Filter by Difficulty"
            />
          </div>

          {/* Sort */}
          <div className="w-[calc(50%-0.25rem)] sm:w-36">
            <CustomSelect
              options={sortOptions}
              value={filters.sort || 'newest'}
              onChange={(val) => onChange({ sort: val as any })}
              placeholder="Sort Order"
              sheetTitle="Sort Decoded Notes"
            />
          </div>

          {/* Reset button */}
          {isFiltered && (
            <button
              type="button"
              onClick={onReset}
              title="Reset all filters"
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-[#061120] hover:bg-slate-200 dark:hover:bg-[#143564] text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white border border-slate-200 dark:border-[#143564] transition-colors cursor-pointer shrink-0"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

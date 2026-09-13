import React, { useState } from 'react';
import {
  BookOpen,
  Download,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';

interface BareActNote {
  id: string;
  actTitle: string;
  category: 'Major Act' | 'Minor Act' | 'New Criminal Laws';
  description: string;
  pages: number;
  fileSize: string;
  lastUpdated: string;
  highlights: string[];
}

const bareActNotes: BareActNote[] = [
  {
    id: 'ba-1',
    actTitle: 'Bhartiya Nyaya Sanhita, 2023 (Complete Decoding)',
    category: 'New Criminal Laws',
    description: 'Comprehensive section-by-section transition table comparing IPC with BNS, newly introduced offences, terrorism, organized crime, and deleted sedition clause.',
    pages: 184,
    fileSize: '5.2 MB PDF',
    lastUpdated: '01 Sep 2025',
    highlights: ['IPC to BNS concordance chart', 'Landmark case laws incorporated', 'Handwritten model flowcharts'],
  },
  {
    id: 'ba-2',
    actTitle: 'Code of Civil Procedure, 1908 (Chambers Handbook)',
    category: 'Major Act',
    description: 'Line-by-line bare act analysis with Orders & Rules synopses. Specialized focus on Res Judicata, Pleadings, Execution of Decrees, and Appeals.',
    pages: 210,
    fileSize: '6.8 MB PDF',
    lastUpdated: '25 Aug 2025',
    highlights: ['Order 1 to 51 exhaustive commentary', 'Pleadings drafting formulas', 'Limitation timeline tables'],
  },
  {
    id: 'ba-3',
    actTitle: 'Bhartiya Nagarik Suraksha Sanhita, 2023 (BNSS)',
    category: 'New Criminal Laws',
    description: 'Detailed analysis of zero FIR, electronic summons, timeline mandates for framing charges and judgments, and custody limits under Section 187.',
    pages: 195,
    fileSize: '5.6 MB PDF',
    lastUpdated: '15 Aug 2025',
    highlights: ['Police custody vs Judicial custody analysis', 'Mandatory forensic investigation triggers', 'Summary trial expansion'],
  },
  {
    id: 'ba-4',
    actTitle: 'Constitution of India (Articles 1 to 395 Master Digest)',
    category: 'Major Act',
    description: 'Judicial services centric breakdown of Fundamental Rights, Directive Principles, Writ Jurisdictions, and Judicial Appointment mechanisms.',
    pages: 160,
    fileSize: '4.8 MB PDF',
    lastUpdated: '10 Aug 2025',
    highlights: ['Basic Structure Doctrine chronology', 'Writs distinction table', 'Emergency provisions summary'],
  },
];

export const BareActsPage: React.FC = () => {
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');

  const filtered = bareActNotes.filter((item) => {
    const matchesFilter = filter === 'all' || item.category.toLowerCase().includes(filter.toLowerCase());
    const matchesSearch = item.actTitle.toLowerCase().includes(search.toLowerCase()) || item.description.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-[#c19b48]/15 text-[#c19b48] dark:text-[#e8cf8d] text-xs font-semibold mb-2">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Faculty Curated Legal Repository</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 dark:text-white">
            Bare Act Decoding Notes
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Section-by-section breakdown with comparative charts and judicial exam illustrations.
          </p>
        </div>

        {/* Search & Filter */}
        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-[#c19b48]"
          >
            <option value="all">All Categories</option>
            <option value="new criminal laws">New Criminal Laws</option>
            <option value="major act">Major Acts</option>
            <option value="minor act">Minor Acts</option>
          </select>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Bare Acts..."
              className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#c19b48]"
            />
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filtered.map((note) => (
          <div
            key={note.id}
            className="p-6 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] space-y-4 shadow-xs flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase bg-amber-50 dark:bg-[#c19b48]/15 text-[#c19b48] dark:text-[#e8cf8d] border border-amber-200 dark:border-[#c19b48]/30">
                  {note.category}
                </span>
                <span className="text-slate-400 text-[11px]">Updated {note.lastUpdated}</span>
              </div>

              <h3 className="text-base font-serif font-bold text-slate-900 dark:text-white leading-snug">
                {note.actTitle}
              </h3>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {note.description}
              </p>

              {/* Highlights pills */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {note.highlights.map((h, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#061120] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#143564]"
                  >
                    ✓ {h}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-[#143564] flex items-center justify-between text-xs">
              <span className="text-slate-400 font-mono text-[11px]">
                {note.pages} Pages • {note.fileSize}
              </span>

              <button
                onClick={() => toast.success(`Downloaded: ${note.actTitle}`)}
                className="px-4 py-2 rounded-xl bg-[#c19b48] hover:bg-[#d8b862] text-[#061120] font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

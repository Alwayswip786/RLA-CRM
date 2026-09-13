import React, { useState } from 'react';
import {
  Bookmark,
  Trash2,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';

interface BookmarkItem {
  id: string;
  type: 'MCQ' | 'Judgment' | 'Bare Act Note';
  title: string;
  source: string;
  date: string;
  note: string;
}

const initialBookmarks: BookmarkItem[] = [
  {
    id: 'b-1',
    type: 'MCQ',
    title: 'Whether a decree passed by a court without territorial jurisdiction is a complete nullity or a mere irregularity?',
    source: 'CPC Section 21 & Kiran Singh v. Chaman Paswan (1954 SC)',
    date: '10 Sep 2025',
    note: 'Remember: Pecuniary and territorial defects must be raised at earliest opportunity; only subject-matter defect goes to root.',
  },
  {
    id: 'b-2',
    type: 'Judgment',
    title: 'Satender Kumar Antil v. CBI (2022) 10 SCC 51 - Comprehensive Bail Guidelines',
    source: 'Criminal Law / BNSS Section 479 & 480',
    date: '05 Sep 2025',
    note: 'Key test categorization of offences (A, B, C, D) for grant of bail without physical custody.',
  },
  {
    id: 'b-3',
    type: 'Bare Act Note',
    title: 'Comparative Table: Section 100 IPC vs Section 38 BNS (When right of private defence extends to causing death)',
    source: 'Bhartiya Nyaya Sanhita Module 2',
    date: '02 Sep 2025',
    note: 'Check the newly phrased 7th clause on acid attack and gang rape.',
  },
];

export const BookmarksPage: React.FC = () => {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>(initialBookmarks);
  const [search, setSearch] = useState('');

  const handleDelete = (id: string) => {
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
    toast.info('Item removed from Starred Vault');
  };

  const filtered = bookmarks.filter((b) =>
    b.title.toLowerCase().includes(search.toLowerCase()) ||
    b.source.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-[#c19b48]/15 text-[#c19b48] dark:text-[#e8cf8d] text-xs font-semibold mb-2">
            <Bookmark className="w-3.5 h-3.5" />
            <span>Personal Revision Vault</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 dark:text-white">
            Starred Questions & Legal Vault
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Fast access to bookmarked MCQs, contentious statutory sections, and high-yield judgments.
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter starred vault..."
            className="pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#c19b48]"
          />
        </div>
      </div>

      {/* Bookmarks List */}
      <div className="space-y-4">
        {filtered.length > 0 ? (
          filtered.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] space-y-3 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase bg-amber-50 dark:bg-[#c19b48]/15 text-[#c19b48] dark:text-[#e8cf8d] border border-amber-200 dark:border-[#c19b48]/30">
                    {item.type}
                  </span>
                  <span className="text-xs font-mono text-slate-400">{item.source}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400">{item.date}</span>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                    title="Remove from Vault"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <h3 className="text-sm sm:text-base font-serif font-bold text-slate-900 dark:text-white leading-relaxed">
                {item.title}
              </h3>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] text-xs">
                <span className="font-semibold text-slate-900 dark:text-white">Aspirant's Annotation: </span>
                <span className="text-slate-600 dark:text-slate-300 italic">{item.note}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="p-12 text-center text-xs text-slate-400 bg-white dark:bg-[#0a1c36] rounded-2xl border border-slate-200 dark:border-[#143564]">
            No starred items match your filter.
          </div>
        )}
      </div>
    </div>
  );
};

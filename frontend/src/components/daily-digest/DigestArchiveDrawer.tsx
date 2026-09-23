import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Calendar,
  Search,
  ChevronRight,
} from 'lucide-react';
import { fetchDailyDigestArchive } from '../../services/dailyDigest.service';
import type { DailyLegalDigestEdition } from '../../types/dailyDigest.types';
import { ArchiveItemSkeleton } from '../ui/skeleton';

interface DigestArchiveDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEdition: (edition: DailyLegalDigestEdition) => void;
}

export const DigestArchiveDrawer: React.FC<DigestArchiveDrawerProps> = ({
  isOpen,
  onClose,
  onSelectEdition,
}) => {
  const [editions, setEditions] = useState<DailyLegalDigestEdition[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState('all');

  const loadArchive = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchDailyDigestArchive({
        search: search.trim() || undefined,
        subject: subject !== 'all' ? subject : undefined,
        limit: 25,
      });
      if (res.success) {
        setEditions(res.editions);
      }
    } catch (err) {
      console.error('Failed to load digest archive:', err);
    } finally {
      setLoading(false);
    }
  }, [search, subject]);

  useEffect(() => {
    if (isOpen) {
      loadArchive();
    }
  }, [isOpen, loadArchive]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-[#0a1c36] h-full shadow-2xl border-l border-slate-200 dark:border-[#143564] flex flex-col">
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-[#143564] bg-slate-50/50 dark:bg-[#061120]">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#c19b48]" />
            <h3 className="font-serif font-bold text-sm text-slate-900 dark:text-white">
              Previous Daily Briefs Archive
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-slate-200 dark:border-[#143564] space-y-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search past rulings, maxims, topics..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#c19b48]"
            />
          </div>

          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#c19b48]"
          >
            <option value="all">All Subjects</option>
            <option value="Criminal Procedure">Criminal Procedure (BNSS / CrPC)</option>
            <option value="Constitutional Law">Constitutional Law</option>
            <option value="Bhartiya Nyaya Sanhita (BNS)">Bhartiya Nyaya Sanhita (BNS)</option>
            <option value="Civil Procedure">Civil Procedure Code (CPC)</option>
            <option value="Evidence Law">Evidence Law (BSA / IEA)</option>
          </select>
        </div>

        {/* Archive List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
          {loading ? (
            <ArchiveItemSkeleton count={4} />
          ) : editions.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              No daily briefs found matching your filter criteria.
            </div>
          ) : (
            editions.map((ed) => (
              <div
                key={ed._id}
                onClick={() => {
                  onSelectEdition(ed);
                  onClose();
                }}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] hover:border-[#c19b48] transition-all cursor-pointer group space-y-1.5"
              >
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-mono font-bold text-[#c19b48] bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded">
                    {ed.editionDateIST}
                  </span>
                  <span className="text-slate-400">
                    {ed.items.length} brief items
                  </span>
                </div>

                <h4 className="font-serif font-bold text-xs text-slate-900 dark:text-white group-hover:text-[#c19b48] transition-colors line-clamp-1">
                  {ed.title}
                </h4>

                {ed.featuredMaxim && (
                  <p className="text-[11px] font-serif italic text-slate-600 dark:text-slate-300 line-clamp-1">
                    ✨ {ed.featuredMaxim.latinText}
                  </p>
                )}

                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                  <span>{ed.curatedBy}</span>
                  <span className="flex items-center gap-0.5 text-[#c19b48] group-hover:translate-x-0.5 transition-transform">
                    <span>Open Brief</span>
                    <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

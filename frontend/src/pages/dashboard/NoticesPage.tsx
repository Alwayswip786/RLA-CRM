import React, { useState, useEffect, useMemo } from 'react';
import {
  BellRing,
  Filter,
  Download,
  Search,
  Loader2,
  Calendar,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '../../lib/apiClient';
import { generateNoticePdf } from '../../utils/noticePdfGenerator';
import { useNoticeStore } from '../../store/useNoticeStore';

interface Notice {
  _id: string;
  circularNo: string;
  title: string;
  category: string;
  priority: 'urgent' | 'normal';
  targetCohorts: string;
  publishedAt: string;
  content: string;
  issuedBy?: string;
  authorName?: string;
}

export const NoticesPage: React.FC = () => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const markAllAsRead = useNoticeStore((state) => state.markAllAsRead);
  const syncStoreNotices = useNoticeStore((state) => state.fetchNotices);

  // Fetch notices from live backend
  const fetchNotices = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.get('/notices');
      if (res.data?.notices) {
        setNotices(res.data.notices);
      }
      await syncStoreNotices();
      markAllAsRead();
    } catch (err) {
      console.error('Failed to fetch notices:', err);
      toast.error('Unable to load circulars. Please check your network connection.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
    markAllAsRead();
  }, []);

  // Filter notices by category and search query
  const filtered = useMemo(() => {
    return notices.filter((n) => {
      const matchesCategory =
        filter === 'all' || n.category.toLowerCase() === filter.toLowerCase();

      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        n.title.toLowerCase().includes(query) ||
        n.circularNo.toLowerCase().includes(query) ||
        n.content.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [notices, filter, searchQuery]);

  // Handle PDF Download
  const handleDownloadPdf = (item: Notice) => {
    try {
      generateNoticePdf(item);
      toast.success(`Official Circular ${item.circularNo} downloaded as PDF`, {
        description: 'Certified digital circular saved to your device.',
      });
    } catch (err) {
      console.error('PDF Generation failed:', err);
      toast.error('Failed to generate circular PDF.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564]">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#c19b48]/15 dark:bg-[#c19b48]/20 text-[#8c6d23] dark:text-[#e8cf8d] border border-[#c19b48]/30 text-xs font-semibold mb-2">
            <BellRing className="w-3.5 h-3.5 text-[#c19b48]" />
            <span>Official Academy Circulars • {notices.length} Promulgated</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 dark:text-white">
            Classroom Notice Board
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Verified judicial examination communications, class shifts, and administrative circulars.
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search circulars..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] text-xs text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-[#c19b48] w-40 sm:w-52 transition-all"
            />
          </div>

          {/* Category Filter Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] rounded-xl px-2.5 py-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-transparent text-xs text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all">All Circulars</option>
              <option value="examination">Examinations</option>
              <option value="classroom timetable">Classroom Timetable</option>
              <option value="mains test series">Mains Test Series</option>
              <option value="holiday">Holidays & Recess</option>
              <option value="admissions">Admissions</option>
              <option value="general">General</option>
            </select>
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={fetchNotices}
            disabled={isLoading}
            className="p-2 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] text-slate-600 dark:text-slate-300 hover:text-[#c19b48] transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh Notice Board"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#c19b48]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Notices Feed */}
      {isLoading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin text-[#c19b48]" />
          <span className="text-xs">Loading official academy notices...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] text-center space-y-2">
          <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="font-serif text-base font-bold text-slate-800 dark:text-slate-200">
            No Circulars Found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {searchQuery || filter !== 'all'
              ? 'No official announcements match your filter criteria.'
              : 'There are currently no active announcements on the notice board.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((item) => {
            const formattedDate = item.publishedAt
              ? new Date(item.publishedAt).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })
              : 'Official Record';

            const isUrgent = item.priority === 'urgent';

            return (
              <div
                key={item._id}
                className={`p-6 rounded-2xl bg-white dark:bg-[#0a1c36] border space-y-3.5 shadow-xs transition-all ${
                  isUrgent
                    ? 'border-[#c19b48]/80 dark:border-[#c19b48]/60 shadow-md ring-1 ring-[#c19b48]/20'
                    : 'border-slate-200 dark:border-[#143564]'
                }`}
              >
                {/* Meta Header */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase bg-slate-100 dark:bg-[#061120] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#143564]">
                      {item.category}
                    </span>

                    {isUrgent && (
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 font-bold border border-red-500/30 animate-pulse flex items-center gap-1">
                        <span>●</span>
                        <span>PRIORITY CIRCULAR</span>
                      </span>
                    )}

                    {item.targetCohorts && (
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 hidden sm:inline-block">
                        Cohort: <span className="font-semibold text-slate-700 dark:text-slate-300">{item.targetCohorts}</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-[#c19b48]">{item.circularNo}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>{formattedDate}</span>
                    </span>
                  </div>
                </div>

                {/* Circular Title */}
                <h3 className="text-base sm:text-lg font-serif font-bold text-slate-900 dark:text-white leading-snug">
                  {item.title}
                </h3>

                {/* Circular Body Content */}
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {item.content}
                </p>

                {/* Footer with Issuer & Action Button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-3 text-xs border-t border-slate-100 dark:border-[#143564]/80">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Issued by: <span className="font-medium text-slate-700 dark:text-slate-300">{item.issuedBy || 'Director Office, Rajinder Law Academy'}</span>
                  </span>

                  <button
                    type="button"
                    onClick={() => handleDownloadPdf(item)}
                    className="inline-flex items-center gap-1.5 text-xs text-[#c19b48] dark:text-[#e8cf8d] font-semibold hover:text-[#8b6b25] dark:hover:text-white transition-colors cursor-pointer self-start sm:self-auto bg-[#c19b48]/10 dark:bg-[#c19b48]/15 px-3 py-1.5 rounded-lg border border-[#c19b48]/30 hover:border-[#c19b48]/60 shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Official Gazette (PDF)</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

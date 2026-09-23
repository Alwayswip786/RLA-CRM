import React, { useState, useEffect } from 'react';
import {
  Download,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { toast } from '../../lib/toast';
import { apiClient } from '../../lib/apiClient';
import { generateNoticePdf } from '../../utils/noticePdfGenerator';
import { useNoticeStore } from '../../store/useNoticeStore';
import { NoticeCardSkeleton } from '../../components/ui/skeleton';

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
      {/* Notices Feed */}
      {isLoading && notices.length === 0 ? (
        <NoticeCardSkeleton count={4} />
      ) : notices.length === 0 ? (
        <div className="p-12 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] text-center space-y-2">
          <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="font-serif text-base font-bold text-slate-800 dark:text-slate-200">
            No Circulars Found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            There are currently no active announcements on the notice board.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {notices.map((item) => {
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

import React, { useState, useEffect, useCallback } from 'react';
import {
  Newspaper,
  Download,
  Bookmark,
  Sparkles,
  Share2,
  Calendar,
  Loader2,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import { toast } from '../../lib/toast';
import {
  fetchTodayDailyDigest,
  markDigestItemRead,
} from '../../services/dailyDigest.service';
import type {
  DailyLegalDigestEdition,
  IDigestItem,
} from '../../types/dailyDigest.types';
import { useBookmarkStore } from '../../store/useBookmarkStore';
import { generateDailyDigestPdf } from '../../utils/generateDailyDigestPdf';
import { DigestItemModal } from '../../components/daily-digest/DigestItemModal';
import { DigestArchiveDrawer } from '../../components/daily-digest/DigestArchiveDrawer';
import { DailyDigestSkeleton } from '../../components/ui/skeleton';

export const DailyDigestPage: React.FC = () => {
  const [edition, setEdition] = useState<DailyLegalDigestEdition | null>(null);
  const [loading, setLoading] = useState(true);
  const [readItemIds, setReadItemIds] = useState<string[]>([]);

  // Modals
  const [activeItem, setActiveItem] = useState<IDigestItem | null>(null);
  const [archiveDrawerOpen, setArchiveDrawerOpen] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Global bookmarks store
  const { isBookmarked, toggleBookmark, fetchBookmarkIds } = useBookmarkStore();

  const loadTodayDigest = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchTodayDailyDigest();
      if (res.success && res.edition) {
        setEdition(res.edition);
        setReadItemIds(res.readItemIds || []);
      }
    } catch (err) {
      console.error('Failed to load today daily digest:', err);
      toast.error('Failed to load Daily Legal Digest. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTodayDigest();
    fetchBookmarkIds();
  }, [loadTodayDigest, fetchBookmarkIds]);

  const handleToggleBookmark = async (e: React.MouseEvent, item: IDigestItem) => {
    e.stopPropagation();
    await toggleBookmark({
      itemType: 'Daily Digest',
      itemId: item.itemId,
      title: item.title,
      source: `${item.contentType} • ${edition?.editionDateIST || ''}`,
      subject: item.subject,
      metadata: {
        categoryBadge: item.categoryBadge,
        citation: item.citation,
        examinationTip: item.examinationTip,
      },
    });
  };

  const handleShare = (e: React.MouseEvent, item: IDigestItem) => {
    e.stopPropagation();
    const text = `${item.title}\n\n${item.citation ? `${item.citation}\n` : ''}${item.summary}\n\nJudicial Examination Tip: ${item.examinationTip}\n\nRead more on Rajinder Law Academy: ${window.location.href}`;

    if (navigator.share) {
      navigator.share({
        title: item.title,
        text,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      toast.success('Digest link & summary copied to clipboard!');
    }
  };

  const handleOpenItem = async (item: IDigestItem) => {
    setActiveItem(item);
    if (edition && !readItemIds.includes(item.itemId)) {
      try {
        const res = await markDigestItemRead(edition._id, item.itemId);
        if (res.success) {
          setReadItemIds(res.readItemIds);
        }
      } catch {
        // Silent fail for read tracking
      }
    }
  };

  const handleDownloadPdf = () => {
    if (!edition) return;
    try {
      setDownloadingPdf(true);
      toast.loading("Compiling Today's Legal Digest PDF...", { id: 'pdf-toast' });
      generateDailyDigestPdf(edition);
      toast.success("Today's Complete Legal Digest PDF downloaded!", { id: 'pdf-toast' });
    } catch (err) {
      console.error('PDF generation failed:', err);
      toast.error('Failed to generate PDF. Please try again.', { id: 'pdf-toast' });
    } finally {
      setDownloadingPdf(false);
    }
  };

  const formatDateDisplay = (dateString?: string) => {
    if (!dateString) return '';
    try {
      const parts = dateString.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        return d.toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
      }
      return dateString;
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return <DailyDigestSkeleton />;
  }

  if (!edition) {
    return (
      <div className="max-w-7xl mx-auto p-8 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] text-center space-y-4">
        <Newspaper className="w-10 h-10 text-[#c19b48] mx-auto" />
        <h2 className="text-lg font-serif font-bold text-slate-900 dark:text-white">
          No Daily Digest Scheduled Yet
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          The judicial faculty wing is currently curating today's morning legal ratio, Bare Act
          pointers, and Latin maxims. Please check back shortly.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200 select-none pb-12">
      {/* Header Action Buttons */}
      <div className="flex items-center justify-end gap-2.5">
        <button
          onClick={() => setArchiveDrawerOpen(true)}
          className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] text-slate-700 dark:text-slate-300 font-semibold text-xs hover:border-[#c19b48] transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          title="Browse previous daily briefs"
        >
          <Calendar className="w-3.5 h-3.5 text-[#c19b48]" />
          <span className="hidden sm:inline">Past Briefs</span>
        </button>

        <button
          onClick={handleDownloadPdf}
          disabled={downloadingPdf}
          className="px-4 py-2 rounded-xl bg-[#c19b48] hover:bg-[#d8b862] text-[#061120] font-bold text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
        >
          {downloadingPdf ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          <span>Download Today's Brief (PDF)</span>
        </button>
      </div>

      {/* 2. Featured Legal Maxim Hero Card */}
      {edition.featuredMaxim && (
        <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-[#0a1c36] via-[#0f294a] to-[#143564] text-white border border-[#c19b48]/40 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between text-xs text-[#e8cf8d]">
            <span className="flex items-center gap-1.5 font-bold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-[#c19b48]" />
              <span>Legal Maxim of the Day</span>
            </span>
            <span className="font-mono text-[11px] text-slate-300">
              {formatDateDisplay(edition.editionDateIST)}
            </span>
          </div>

          <h3 className="text-base sm:text-lg font-serif italic text-amber-200 font-medium">
            {edition.featuredMaxim.latinText}
          </h3>

          <p className="text-xs text-slate-200 leading-relaxed max-w-4xl">
            {edition.featuredMaxim.englishMeaning} {edition.featuredMaxim.jurisprudenceContext}
          </p>

          {edition.featuredMaxim.relevantProvisions &&
            edition.featuredMaxim.relevantProvisions.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {edition.featuredMaxim.relevantProvisions.map((prov, i) => (
                  <span
                    key={i}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-[#061120]/70 text-[#e8cf8d] border border-[#c19b48]/30 font-mono"
                  >
                    {prov}
                  </span>
                ))}
              </div>
            )}
        </div>
      )}

      {/* 3. Daily Content Articles Feed */}
      <div className="space-y-4">
        {edition.items.map((item) => {
          const bookmarked = isBookmarked(item.itemId);
          const isRead = readItemIds.includes(item.itemId);

          return (
            <div
              key={item.itemId}
              onClick={() => handleOpenItem(item)}
              className="p-5 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] space-y-3 shadow-xs hover:border-[#c19b48]/70 transition-all cursor-pointer group"
            >
              {/* Category & Action Row */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase bg-amber-50 dark:bg-[#c19b48]/15 text-[#c19b48] dark:text-[#e8cf8d] border border-amber-200 dark:border-[#c19b48]/30">
                    {item.categoryBadge}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    {item.subject}
                  </span>
                  {isRead && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-500 font-medium">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Read</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={(e) => handleToggleBookmark(e, item)}
                    className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                      bookmarked
                        ? 'bg-amber-50 text-[#c19b48] border-[#c19b48]'
                        : 'text-slate-400 border-slate-200 dark:border-[#143564] hover:text-[#c19b48]'
                    }`}
                    title={bookmarked ? 'Saved in Starred Vault' : 'Save to Starred Vault'}
                  >
                    <Bookmark className={`w-3.5 h-3.5 ${bookmarked ? 'fill-current' : ''}`} />
                  </button>

                  <button
                    onClick={(e) => handleShare(e, item)}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-[#143564] text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
                    title="Share brief"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Title Heading */}
              <h3 className="text-base font-serif font-bold text-slate-900 dark:text-white group-hover:text-[#c19b48] transition-colors leading-snug">
                {item.title}
              </h3>

              {/* Citation & Coram */}
              {item.citation && (
                <p className="text-xs font-mono font-bold text-[#c19b48] dark:text-[#e8cf8d]">
                  {item.citation}
                </p>
              )}

              {/* Summary Text */}
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {item.summary}
              </p>

              {/* Judicial Examination Tip Container */}
              {item.examinationTip && (
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] text-xs">
                  <span className="font-bold text-slate-900 dark:text-white">
                    Judicial Examination Tip:{' '}
                  </span>
                  <span className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    {item.examinationTip}
                  </span>
                </div>
              )}

              {/* Bottom Card Footer with Read Prompt */}
              <div className="flex items-center justify-between pt-1 text-[11px] text-[#c19b48] font-semibold">
                <span className="text-slate-400 font-normal">
                  {item.date || edition.editionDateIST}
                </span>
                <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  <span>Full Analysis & Provisions</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. Full Item Dossier Modal */}
      <DigestItemModal
        item={activeItem}
        isOpen={!!activeItem}
        onClose={() => setActiveItem(null)}
        editionDateIST={edition.editionDateIST}
      />

      {/* 5. Historical Archive Drawer */}
      <DigestArchiveDrawer
        isOpen={archiveDrawerOpen}
        onClose={() => setArchiveDrawerOpen(false)}
        onSelectEdition={(selected) => {
          setEdition(selected);
          toast.success(`Loaded Daily Legal Digest for ${selected.editionDateIST}`);
        }}
      />
    </div>
  );
};

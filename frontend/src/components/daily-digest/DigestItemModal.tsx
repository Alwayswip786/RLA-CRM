import React from 'react';
import {
  X,
  Bookmark,
  Share2,
  Calendar,
  Scale,
  FileText,
  Download,
  ExternalLink,
  BookOpen,
  HelpCircle,
  Gavel,
} from 'lucide-react';
import type { IDigestItem } from '../../types/dailyDigest.types';
import { useBookmarkStore } from '../../store/useBookmarkStore';
import { Link } from 'react-router-dom';
import { toast } from '../../lib/toast';

interface DigestItemModalProps {
  item: IDigestItem | null;
  isOpen: boolean;
  onClose: () => void;
  editionDateIST?: string;
}

export const DigestItemModal: React.FC<DigestItemModalProps> = ({
  item,
  isOpen,
  onClose,
  editionDateIST,
}) => {
  const { isBookmarked, toggleBookmark } = useBookmarkStore();

  if (!isOpen || !item) return null;

  const bookmarked = isBookmarked(item.itemId);

  const handleToggleBookmark = async () => {
    await toggleBookmark({
      itemType: 'Daily Digest',
      itemId: item.itemId,
      title: item.title,
      source: `${item.contentType} • ${editionDateIST || ''}`,
      subject: item.subject,
      metadata: {
        categoryBadge: item.categoryBadge,
        citation: item.citation,
        examinationTip: item.examinationTip,
      },
    });
  };

  const handleShare = async () => {
    const text = `${item.title}\n\n${item.citation ? `Citation: ${item.citation}\n` : ''}${item.summary}\n\nJudicial Examination Tip: ${item.examinationTip}\n\nRead on Rajinder Law Academy: ${window.location.href}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: item.title,
          text,
          url: window.location.href,
        });
      } catch {
        // Fallback
      }
    } else {
      navigator.clipboard.writeText(text);
      toast.success('Digest summary copied to clipboard!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl my-8 bg-white dark:bg-[#0a1c36] rounded-2xl border border-slate-200 dark:border-[#143564] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-[#143564] bg-slate-50/50 dark:bg-[#061120]">
          <div className="flex items-center gap-2">
            <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase bg-amber-50 dark:bg-[#c19b48]/15 text-[#c19b48] dark:text-[#e8cf8d] border border-amber-200 dark:border-[#c19b48]/30">
              {item.categoryBadge}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {item.subject}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleToggleBookmark}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                bookmarked
                  ? 'bg-amber-50 text-[#c19b48] border-[#c19b48]'
                  : 'text-slate-400 border-slate-200 dark:border-[#143564] hover:text-[#c19b48]'
              }`}
              title={bookmarked ? 'Remove from Starred Vault' : 'Save to Starred Vault'}
            >
              <Bookmark className="w-4 h-4 fill-current" />
            </button>

            <button
              onClick={handleShare}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-[#143564] text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
              title="Share brief"
            >
              <Share2 className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#143564] transition-colors cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {/* Title & Citation */}
          <div className="space-y-2">
            <h2 className="text-lg sm:text-xl font-serif font-bold text-slate-900 dark:text-white leading-snug">
              {item.title}
            </h2>

            {item.citation && (
              <p className="font-mono font-bold text-xs text-[#c19b48] dark:text-[#e8cf8d]">
                {item.citation}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 pt-1">
              {item.court && (
                <span className="flex items-center gap-1">
                  <Gavel className="w-3.5 h-3.5" />
                  <span>{item.court}</span>
                </span>
              )}
              {item.bench && (
                <span className="flex items-center gap-1">
                  <Scale className="w-3.5 h-3.5" />
                  <span>{item.bench}</span>
                </span>
              )}
              {item.date && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{item.date}</span>
                </span>
              )}
            </div>
          </div>

          {/* Legal Provisions Pills */}
          {item.legalProvisions && item.legalProvisions.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Applicable Statutory Provisions
              </span>
              <div className="flex flex-wrap gap-2">
                {item.legalProvisions.map((prov, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] text-slate-700 dark:text-slate-300 font-mono text-[11px]"
                  >
                    <BookOpen className="w-3 h-3 text-[#c19b48]" />
                    <strong className="text-slate-900 dark:text-white">{prov.sectionOrArticle}</strong>
                    {prov.actOrCode && (
                      <span className="text-slate-400 font-sans">({prov.actOrCode})</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Executive Ratio & Summary */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Ratio Decidendi / Legal Principle
            </span>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed bg-slate-50/70 dark:bg-[#061120]/70 p-4 rounded-xl border border-slate-200 dark:border-[#143564]">
              {item.summary}
            </p>
          </div>

          {/* Full Markdown Analysis (if available) */}
          {item.fullText && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Detailed Analytical Dossier
              </span>
              <div className="prose prose-xs dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line bg-slate-50 dark:bg-[#061120] p-4 rounded-xl border border-slate-200 dark:border-[#143564]">
                {item.fullText}
              </div>
            </div>
          )}

          {/* Judicial Examination Tip Container */}
          <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-500/30 text-xs space-y-1">
            <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300 font-bold uppercase tracking-wider text-[11px]">
              <HelpCircle className="w-4 h-4 text-[#c19b48]" />
              <span>Judicial Examination Directive (Mains / Prelims)</span>
            </div>
            <p className="text-slate-700 dark:text-slate-200 leading-relaxed">
              {item.examinationTip}
            </p>
          </div>

          {/* Cross Module Links: Related Landmark Judgment or Mains Question */}
          {(item.relatedJudgementId || item.relatedMainsId) && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] space-y-2.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Integrated Academy Modules
              </span>
              <div className="flex flex-wrap gap-3">
                {item.relatedJudgementId && typeof item.relatedJudgementId === 'object' && (
                  <Link
                    to="/dashboard/judgments"
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#c19b48]/15 border border-[#c19b48]/30 text-[#c19b48] hover:bg-[#c19b48]/25 text-xs font-semibold transition-colors"
                  >
                    <Scale className="w-3.5 h-3.5" />
                    <span>View in Landmark Judgement Vault</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                )}

                {item.relatedMainsId && typeof item.relatedMainsId === 'object' && (
                  <Link
                    to="/dashboard/mains"
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 hover:bg-blue-500/25 text-xs font-semibold transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Attempt in Daily Mains Clinic</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Source Reference & Attached PDF */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-[#143564] text-[11px] text-slate-500">
            <div>
              {item.sourceReference && (
                <span>
                  Source: <strong className="text-slate-700 dark:text-slate-300">{item.sourceReference}</strong>
                </span>
              )}
            </div>

            {item.pdfFile && (
              <a
                href={item.pdfFile.path}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[#c19b48] hover:underline font-semibold"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Attached PDF ({item.pdfFile.sizeFormatted})</span>
              </a>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end px-6 py-3 bg-slate-50/50 dark:bg-[#061120] border-t border-slate-200 dark:border-[#143564]">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-[#143564] text-slate-700 dark:text-white text-xs font-semibold hover:bg-slate-300 dark:hover:bg-[#1c4786] transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  X,
  Bookmark,
  Share2,
  Calendar,
  Scale,
  FileText,
  Download,
  ExternalLink,
  HelpCircle,
  Gavel,
  Eye,
} from 'lucide-react';
import type { IDigestItem } from '../../types/dailyDigest.types';
import { useBookmarkStore } from '../../store/useBookmarkStore';
import { Link } from 'react-router-dom';
import { toast } from '../../lib/toast';
import { UniversalPdfModal } from '../pdf';
import { API_BASE_URL } from '../../lib/apiClient';

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
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  if (!isOpen || !item) return null;

  const bookmarked = isBookmarked(item.itemId);

  const pdfUrl = item.pdfFile?.path
    ? item.pdfFile.path.startsWith('http://') ||
      item.pdfFile.path.startsWith('https://') ||
      item.pdfFile.path.startsWith('blob:')
      ? item.pdfFile.path
      : `${API_BASE_URL.replace(/\/api\/?$/, '')}${item.pdfFile.path.startsWith('/') ? '' : '/'}${item.pdfFile.path}`
    : null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-2 sm:p-4 overflow-hidden animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[calc(100dvh-1rem)] sm:max-h-[90dvh] min-h-0 my-auto bg-white dark:bg-[#0a1c36] rounded-2xl border border-slate-200 dark:border-[#143564] shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="relative shrink-0 px-4 py-3 pr-14 sm:px-6 sm:py-4 sm:pr-16 border-b border-slate-200 dark:border-[#143564] bg-slate-50/50 dark:bg-[#061120]">
          <div className="min-w-0 flex flex-col items-start gap-2">
            <span className="max-w-full text-[10px] px-2.5 py-1.5 rounded-full font-bold uppercase leading-tight text-center bg-amber-50 dark:bg-[#c19b48]/15 text-[#c19b48] dark:text-[#e8cf8d] border border-amber-200 dark:border-[#c19b48]/30">
              {item.categoryBadge}
            </span>

            <span className="min-w-0 text-xs text-slate-500 dark:text-slate-400 font-medium whitespace-normal break-words">
              {item.subject}
            </span>

            <div className="mt-1 flex items-center gap-3">
              <button
                onClick={handleToggleBookmark}
                className={`w-9 h-9 inline-flex items-center justify-center rounded-lg transition-colors cursor-pointer hover:bg-slate-100 dark:hover:bg-white/5 ${
                  bookmarked ? 'text-[#c19b48]' : 'text-slate-400 hover:text-[#c19b48]'
                }`}
                title={bookmarked ? 'Remove from Starred Vault' : 'Save to Starred Vault'}
                aria-label={bookmarked ? 'Remove from Starred Vault' : 'Save to Starred Vault'}
              >
                <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-current' : ''}`} />
              </button>

              <button
                onClick={handleShare}
                className="w-9 h-9 inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                title="Share brief"
                aria-label="Share brief"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <button
            onClick={onClose}
            className="absolute top-3 right-3 sm:top-4 sm:right-5 w-9 h-9 inline-flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            aria-label="Close digest details"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="min-w-0 flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-6 text-xs">
          {/* Title & Citation */}
          <div className="space-y-2">
            <h2 className="text-lg sm:text-xl font-serif font-bold text-slate-900 dark:text-white leading-snug">
              {item.title}
            </h2>

            {item.citation && (
              <p className="font-mono font-bold text-xs text-[#c19b48] dark:text-[#e8cf8d] break-words [overflow-wrap:anywhere]">
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
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                Applicable Statutory Provisions
              </span>
              <div className="space-y-2">
                {item.legalProvisions.map((prov, i) => (
                  <div
                    key={i}
                    className="min-w-0 flex flex-col gap-0.5 pl-3 py-1 border-l-2 border-[#c19b48]/50 whitespace-normal break-words [overflow-wrap:anywhere]"
                  >
                    <strong className="min-w-0 break-words font-mono text-[11px] text-slate-900 dark:text-white">{prov.sectionOrArticle}</strong>
                    {prov.actOrCode && (
                      <span className="min-w-0 break-words text-[11px] text-slate-500 dark:text-slate-400">{prov.actOrCode}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Executive Ratio & Summary */}
          <div className="space-y-2">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
              Ratio Decidendi / Legal Principle
            </span>
            <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed break-words [overflow-wrap:anywhere]">
              {item.summary}
            </p>
          </div>

          {/* Full Markdown Analysis (if available) */}
          {item.fullText && (
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                Detailed Analytical Dossier
              </span>
              <div className="prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line break-words [overflow-wrap:anywhere]">
                {item.fullText}
              </div>
            </div>
          )}

          {/* Judicial Examination Tip Container */}
          <div className="pl-3 py-1 border-l-2 border-amber-400/70 text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300 font-semibold text-[11px]">
              <HelpCircle className="w-4 h-4 text-[#c19b48]" />
              <span>Judicial Examination Directive (Mains / Prelims)</span>
            </div>
            <p className="text-slate-700 dark:text-slate-200 leading-relaxed break-words [overflow-wrap:anywhere]">
              {item.examinationTip}
            </p>
          </div>

          {/* Cross Module Links: Related Landmark Judgment or Mains Question */}
          {(item.relatedJudgementId || item.relatedMainsId) && (
            <div className="space-y-2.5">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                Integrated Academy Modules
              </span>
              <div className="flex flex-col sm:flex-row flex-wrap gap-2">
                {item.relatedJudgementId && typeof item.relatedJudgementId === 'object' && (
                  <Link
                    to="/dashboard/judgments"
                    className="inline-flex min-w-0 items-center gap-2 px-3 py-2 rounded-lg bg-[#c19b48]/10 text-[#c19b48] hover:bg-[#c19b48]/20 text-xs font-semibold transition-colors"
                  >
                    <Scale className="w-3.5 h-3.5" />
                    <span>View in Landmark Judgement Vault</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                )}

                {item.relatedMainsId && typeof item.relatedMainsId === 'object' && (
                  <Link
                    to="/dashboard/mains"
                    className="inline-flex min-w-0 items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 text-xs font-semibold transition-colors"
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-[#143564] text-[11px] text-slate-500">
            <div className="min-w-0 flex-1">
              {item.sourceReference && (
                <span className="break-words [overflow-wrap:anywhere]">
                  Source: <strong className="text-slate-700 dark:text-slate-300">{item.sourceReference}</strong>
                </span>
              )}
            </div>

            {item.pdfFile && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPdfModalOpen(true)}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-[#c19b48] font-semibold text-xs cursor-pointer transition-colors w-full sm:w-auto"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Read Attached PDF</span>
                </button>

                <a
                  href={pdfUrl || item.pdfFile.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
                  title="Direct Download"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>({item.pdfFile.sizeFormatted})</span>
                </a>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* In-App Universal PDF Modal */}
      {pdfUrl && (
        <UniversalPdfModal
          isOpen={isPdfModalOpen}
          onClose={() => setIsPdfModalOpen(false)}
          url={pdfUrl}
          title={item.title}
          subtitle={`${item.categoryBadge} • ${item.subject}`}
          downloadFileName={item.pdfFile?.originalName || `${item.title}.pdf`}
        />
      )}
    </div>
  );
};

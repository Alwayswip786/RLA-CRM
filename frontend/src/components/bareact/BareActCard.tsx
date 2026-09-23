import React, { useState } from 'react';
import {
  Download,
  BookOpen,
  FileText,
  Bookmark,
  CheckCircle2,
  Sparkles,
  Loader2,
  Gavel,
} from 'lucide-react';
import type { BareActNote } from '../../types/bareAct.types';
import { downloadNotePdf } from '../../services/bareAct.service';
import { toast } from '../../lib/toast';

import { useBookmarkStore } from '../../store/useBookmarkStore';

interface BareActCardProps {
  note: BareActNote;
  onPreview: (note: BareActNote) => void;
  onDownloadComplete?: (id: string) => void;
}

export const BareActCard: React.FC<BareActCardProps> = ({
  note,
  onPreview,
  onDownloadComplete,
}) => {
  const [downloading, setDownloading] = useState(false);
  const { isBookmarked, toggleBookmark } = useBookmarkStore();
  const bookmarked = isBookmarked(note._id);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      await downloadNotePdf(
        note._id,
        note.pdfFile?.originalName || `${note.actName}_Decoding.pdf`
      );
      toast.success(`Downloaded: ${note.actName} Decoding Notes`);
      onDownloadComplete?.(note._id);
    } catch {
      toast.error('Failed to download statutory decoding PDF.');
    } finally {
      setDownloading(false);
    }
  };

  const handleToggleBookmark = async () => {
    await toggleBookmark({
      itemType: 'Bare Act Note',
      itemId: note._id,
      title: note.title,
      source: `${note.actName} (${note.actYear}) — ${note.sectionsCovered}`,
      subject: note.category,
      annotation: note.description ? note.description.slice(0, 160) + '...' : '',
      tags: note.tags,
      metadata: {
        actName: note.actName,
        actYear: note.actYear,
        sectionsCovered: note.sectionsCovered,
        chapter: note.chapter,
        targetRoute: '/dashboard/bare-acts',
      },
    });
  };

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case 'New Criminal Laws':
        return 'bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/30';
      case 'Major Procedural Act':
        return 'bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/30';
      case 'Major Substantive Act':
        return 'bg-amber-50 dark:bg-[#c19b48]/15 text-[#c19b48] dark:text-[#f3d999] border-amber-200 dark:border-[#c19b48]/30';
      case 'Civil & Property Law':
        return 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] hover:border-[#c19b48]/50 transition-all duration-200 shadow-xs flex flex-col justify-between group space-y-4">
      {/* Top Header Row */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase border ${getCategoryBadgeColor(
                note.category
              )}`}
            >
              {note.category}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-[#061120] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-[#143564]">
              {note.actYear}
            </span>
            {note.isFeatured && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 dark:bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30">
                <Sparkles className="w-2.5 h-2.5" />
                Act in Focus
              </span>
            )}
          </div>

          {/* Bookmark Button */}
          <button
            type="button"
            onClick={handleToggleBookmark}
            title={bookmarked ? 'Remove from Starred Vault' : 'Save to Starred Vault'}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              bookmarked
                ? 'bg-[#c19b48]/20 border-[#c19b48]/40 text-[#c19b48]'
                : 'bg-slate-50 dark:bg-[#061120] border-slate-200 dark:border-[#143564] text-slate-400 hover:text-[#c19b48]'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${bookmarked ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Act Name & Sections Covered */}
        <div>
          <h3 className="text-base sm:text-lg font-serif font-bold text-slate-900 dark:text-white group-hover:text-[#c19b48] transition-colors leading-snug">
            {note.actName}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#c19b48] dark:text-[#e8cf8d]">
              <FileText className="w-3 h-3" />
              {note.sectionsCovered}
            </span>
            {note.chapter && (
              <span className="text-[10px] text-slate-400 dark:text-slate-400 truncate">
                • {note.chapter}
              </span>
            )}
          </div>
        </div>

        {/* Title */}
        <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 leading-snug">
          {note.title}
        </p>

        {/* Academic Overview */}
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">
          {note.description}
        </p>

        {/* Highlights Checklist */}
        {note.highlights && note.highlights.length > 0 && (
          <div className="space-y-1 pt-1">
            {note.highlights.slice(0, 3).map((hl, idx) => (
              <div
                key={idx}
                className="flex items-start gap-1.5 text-[11px] text-slate-600 dark:text-slate-300"
              >
                <CheckCircle2 className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" />
                <span className="line-clamp-1">{hl}</span>
              </div>
            ))}
          </div>
        )}

        {/* Section Breakdown Pills & Precedent Cross-links */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          {note.sectionBreakdown && note.sectionBreakdown.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-[#061120] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#143564]">
              <BookOpen className="w-2.5 h-2.5 text-[#c19b48]" />
              {note.sectionBreakdown.length} Sections Index (TOC)
            </span>
          )}
          {note.relatedJudgements && note.relatedJudgements.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/20">
              <Gavel className="w-2.5 h-2.5" />
              {note.relatedJudgements.length} Landmark Precedents
            </span>
          )}
          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 font-medium">
            {note.difficulty}
          </span>
        </div>
      </div>

      {/* Footer Strip with Action Buttons */}
      <div className="pt-4 border-t border-slate-100 dark:border-[#143564] space-y-3">
        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span className="font-mono">
            {note.pdfFile?.pageCount ? `${note.pdfFile.pageCount} pp • ` : ''}
            {note.pdfFile?.sizeFormatted}
          </span>
          <span className="truncate max-w-[160px]">
            {note.downloadCount || 0} Downloads
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Read Online in In-App PDF Viewer */}
          <button
            type="button"
            onClick={() => onPreview(note)}
            className="flex-1 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-[#061120] hover:bg-slate-200 dark:hover:bg-[#143564] text-slate-800 dark:text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 border border-slate-200 dark:border-[#143564] cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#c19b48]" />
            <span>Read Online</span>
          </button>

          {/* Download PDF */}
          <button
            type="button"
            disabled={downloading}
            onClick={handleDownload}
            className="px-4 py-2 rounded-xl bg-[#c19b48] hover:bg-[#d8b862] text-[#061120] font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
          >
            {downloading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>Download</span>
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  Download,
  BookOpen,
  Scale,
  Award,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Eye,
  Loader2,
} from 'lucide-react';
import type { JudgementDigest } from '../../types/judgement.types';
import { downloadJudgementPdf } from '../../services/judgement.service';
import { toast } from 'sonner';

interface JudgementCardProps {
  judgement: JudgementDigest;
  onPreview: (judgement: JudgementDigest) => void;
  onDownloadComplete?: (id: string) => void;
}

export const JudgementCard: React.FC<JudgementCardProps> = ({
  judgement,
  onPreview,
  onDownloadComplete,
}) => {
  const [downloading, setDownloading] = useState(false);
  const [expandedRatio, setExpandedRatio] = useState(true);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      await downloadJudgementPdf(judgement._id, judgement.pdfFile.originalName);
      toast.success(`Downloaded: ${judgement.pdfFile.originalName}`);
      onDownloadComplete?.(judgement._id);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to download Judgement PDF.');
    } finally {
      setDownloading(false);
    }
  };

  const getImportanceBadge = (importance: string) => {
    switch (importance) {
      case 'Landmark':
        return 'bg-amber-100 dark:bg-[#c19b48]/20 text-[#c19b48] dark:text-[#f3d999] border-amber-300 dark:border-[#c19b48]/40';
      case 'Leading':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700/40';
      case 'Recent / Overruling':
        return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/40';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700';
    }
  };

  const formattedDate = new Date(judgement.dateOfJudgement).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] hover:border-[#c19b48]/60 transition-all shadow-xs flex flex-col justify-between space-y-4 group">
      <div className="space-y-3.5">
        {/* Top Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border ${getImportanceBadge(
                judgement.importance
              )}`}
            >
              {judgement.importance}
            </span>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full font-medium bg-slate-100 dark:bg-[#061120] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#143564]">
              {judgement.court}
            </span>
          </div>

          <span className="font-mono text-xs font-bold text-[#c19b48] dark:text-[#e8cf8d] bg-[#c19b48]/10 px-2.5 py-0.5 rounded border border-[#c19b48]/20">
            {judgement.citation}
          </span>
        </div>

        {/* Case Title */}
        <div>
          <h3 className="text-base sm:text-lg font-serif font-bold text-slate-900 dark:text-white group-hover:text-[#c19b48] transition-colors leading-snug">
            {judgement.title}
          </h3>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mt-1">
            <span>
              <strong>Coram:</strong> {judgement.bench}
            </span>
            <span>•</span>
            <span>Decided: {formattedDate}</span>
            {judgement.subject && (
              <>
                <span>•</span>
                <span className="text-[#c19b48] dark:text-[#e8cf8d] font-medium">
                  {judgement.subject}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Executive Summary */}
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          {judgement.summary}
        </p>

        {/* 3-Point Ratio Decidendi Box */}
        {judgement.ratioDecidendi && judgement.ratioDecidendi.length > 0 && (
          <div className="rounded-xl bg-slate-50 dark:bg-[#061120]/70 border border-slate-200/80 dark:border-[#143564]/80 p-3 sm:p-4 space-y-2">
            <div
              className="flex items-center justify-between cursor-pointer select-none"
              onClick={() => setExpandedRatio(!expandedRatio)}
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                <Scale className="w-3.5 h-3.5 text-[#c19b48]" />
                <span>3-Point Ratio Decidendi (Mains Ready)</span>
              </div>
              <button
                type="button"
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                {expandedRatio ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {expandedRatio && (
              <ul className="space-y-2 pt-1">
                {judgement.ratioDecidendi.map((point, idx) => {
                  const romanNumerals = ['I', 'II', 'III', 'IV', 'V'];
                  const roman = romanNumerals[idx] || `${idx + 1}`;
                  return (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                      <span className="shrink-0 w-5 h-5 rounded-full bg-amber-100 dark:bg-[#c19b48]/20 text-[#c19b48] dark:text-[#e8cf8d] font-mono text-[10px] font-bold flex items-center justify-center mt-0.5">
                        {roman}
                      </span>
                      <span>{point}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        {/* Mains Utility Note */}
        {judgement.mainsUtility && (
          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50/50 dark:bg-[#c19b48]/10 border border-amber-200/60 dark:border-[#c19b48]/20 text-xs text-slate-700 dark:text-slate-300">
            <Award className="w-4 h-4 text-[#c19b48] shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-900 dark:text-white">Mains Answer Utility:</strong>{' '}
              {judgement.mainsUtility}
            </div>
          </div>
        )}

        {/* Overruled Precedents Banner */}
        {judgement.overruledPrecedents && (
          <div className="flex items-start gap-2 p-2 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-[11px] text-red-700 dark:text-red-400">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <div>
              <strong>Precedent Note:</strong> {judgement.overruledPrecedents}
            </div>
          </div>
        )}

        {/* Legal Provisions & Tags */}
        {((judgement.legalProvisions && judgement.legalProvisions.length > 0) ||
          (judgement.tags && judgement.tags.length > 0)) && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {judgement.legalProvisions?.map((prov, idx) => (
              <span
                key={`prov-${idx}`}
                className="text-[10px] px-2 py-0.5 rounded-md font-mono font-medium bg-amber-50 dark:bg-[#061120] text-[#c19b48] dark:text-[#e8cf8d] border border-amber-200/70 dark:border-[#c19b48]/30"
              >
                § {prov}
              </span>
            ))}
            {judgement.tags?.map((tag, idx) => (
              <span
                key={`tag-${idx}`}
                className="text-[10px] px-2 py-0.5 rounded-md font-medium bg-slate-50 dark:bg-[#061120]/80 text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-[#143564]/60"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Card Footer Actions & Stats */}
      <div className="pt-3 border-t border-slate-100 dark:border-[#143564]/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Download & View stats */}
        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <Download className="w-3 h-3 text-[#c19b48]" />
            <span>{judgement.downloadCount} downloads</span>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3 text-slate-400" />
            <span>{judgement.viewCount} views</span>
          </span>
          <span>•</span>
          <span className="font-mono text-slate-400">{judgement.pdfFile.sizeFormatted}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Read Digest Viewer */}
          <button
            type="button"
            onClick={() => onPreview(judgement)}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-[#061120] hover:bg-[#c19b48] hover:text-[#061120] text-slate-700 dark:text-slate-200 font-semibold text-xs border border-slate-200 dark:border-[#143564] transition-colors cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Read Digest</span>
          </button>

          {/* Download PDF */}
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#c19b48] hover:bg-[#d4ae58] text-[#061120] font-semibold text-xs transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
          >
            {downloading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>{downloading ? 'Downloading...' : 'Download PDF'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

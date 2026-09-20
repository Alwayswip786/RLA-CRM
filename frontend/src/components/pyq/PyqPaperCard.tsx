import React, { useState } from 'react';
import {
  Download,
  BookOpen,
  CheckCircle2,
  Clock,
  Award,
  Loader2,
} from 'lucide-react';
import type { PyqPaper } from '../../types/pyq.types';
import { downloadPyqPdf } from '../../services/pyq.service';
import { toast } from 'sonner';

interface PyqPaperCardProps {
  paper: PyqPaper;
  onPreview: (paper: PyqPaper) => void;
  onDownloadComplete?: (paperId: string) => void;
}

export const PyqPaperCard: React.FC<PyqPaperCardProps> = ({
  paper,
  onPreview,
  onDownloadComplete,
}) => {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      await downloadPyqPdf(paper._id, paper.pdfFile.originalName);
      toast.success(`Downloaded: ${paper.pdfFile.originalName}`);
      onDownloadComplete?.(paper._id);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to download paper.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] hover:border-[#c19b48]/60 transition-all shadow-xs flex flex-col justify-between space-y-4 group">
      <div className="space-y-3">
        {/* Top Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-slate-100 dark:bg-[#061120] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#143564]">
            {paper.exam}
          </span>
          <span className="font-mono text-xs font-bold text-[#c19b48] dark:text-[#e8cf8d] bg-[#c19b48]/10 px-2 py-0.5 rounded">
            {paper.year} • {paper.stage}
          </span>
        </div>

        {/* Paper Title */}
        <h3 className="text-base font-serif font-bold text-slate-900 dark:text-white group-hover:text-[#c19b48] transition-colors line-clamp-2">
          {paper.title}
        </h3>

        {/* Subject description */}
        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
          {paper.description || paper.subject}
        </p>

        {/* Topic Pills */}
        {paper.topics && paper.topics.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {paper.topics.slice(0, 3).map((topic, idx) => (
              <span
                key={idx}
                className="text-[10px] px-2 py-0.5 rounded-md bg-slate-50 dark:bg-[#061120]/80 text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-[#143564]/60 font-medium"
              >
                #{topic}
              </span>
            ))}
            {paper.topics.length > 3 && (
              <span className="text-[10px] px-1.5 py-0.5 text-slate-400 font-mono">
                +{paper.topics.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Faculty Model Answers Attribution */}
        <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium pt-1">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Solved by: {paper.solvedByFaculty}</span>
        </div>

        {/* Metadata stats bar */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-[#143564]/50">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Award className="w-3 h-3 text-[#c19b48]" />
              <span>{paper.totalMarks} Marks</span>
            </span>
            {paper.durationMinutes && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{paper.durationMinutes}m</span>
              </span>
            )}
          </div>
          <span className="font-mono text-[11px]">{paper.pdfFile.sizeFormatted}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-3 border-t border-slate-100 dark:border-[#143564]/60 flex items-center justify-between gap-2">
        <div className="text-[11px] text-slate-400 font-mono">
          {paper.downloadCount > 0 ? `${paper.downloadCount} downloads` : 'New paper'}
        </div>

        <div className="flex items-center gap-2">
          {/* Read Online Button */}
          <button
            onClick={() => onPreview(paper)}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#061120] hover:bg-slate-200 dark:hover:bg-[#143564] text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-200 dark:border-[#143564]"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#c19b48]" />
            <span>Read Online</span>
          </button>

          {/* Download Button */}
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="px-3 py-1.5 rounded-xl bg-[#c19b48] hover:bg-[#d8b862] text-[#061120] font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
          >
            {downloading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};

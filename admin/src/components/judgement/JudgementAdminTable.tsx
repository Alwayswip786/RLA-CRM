import React, { useState } from 'react';
import {
  Download,
  Edit2,
  Trash2,
  ExternalLink,
  Loader2,
  AlertCircle,
  Sparkles,
  Eye,
} from 'lucide-react';
import type { JudgementDigest } from '../../types/judgement.types';
import {
  togglePublishJudgement,
  deleteJudgement,
  downloadJudgementPdf,
  getDirectStreamUrl,
} from '../../services/judgement.service';
import { toast } from 'react-hot-toast';

interface JudgementAdminTableProps {
  judgements: JudgementDigest[];
  onRefresh: () => void;
  onEdit: (judgement: JudgementDigest) => void;
}

export const JudgementAdminTable: React.FC<JudgementAdminTableProps> = ({
  judgements,
  onRefresh,
  onEdit,
}) => {
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<JudgementDigest | null>(null);

  const handleTogglePublish = async (j: JudgementDigest) => {
    try {
      setTogglingId(j._id);
      const res = await togglePublishJudgement(j._id);
      if (res.success) {
        toast.success(res.message);
        onRefresh();
      }
    } catch (err: any) {
      toast.error('Failed to change publication status.');
    } finally {
      setTogglingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      setDeletingId(itemToDelete._id);
      const res = await deleteJudgement(itemToDelete._id);
      if (res.success) {
        toast.success('Judgement precedent and PDF files deleted permanently.');
        setItemToDelete(null);
        onRefresh();
      }
    } catch (err: any) {
      toast.error('Failed to delete judgement.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownload = async (j: JudgementDigest) => {
    try {
      toast.loading('Downloading Judgement PDF...', { id: 'download-toast' });
      await downloadJudgementPdf(j._id, j.pdfFile.originalName);
      toast.success(`Downloaded ${j.pdfFile.originalName}`, { id: 'download-toast' });
    } catch {
      toast.error('Download failed.', { id: 'download-toast' });
    }
  };

  const getImportanceBadge = (importance: string) => {
    switch (importance) {
      case 'Landmark':
        return 'bg-amber-500/20 text-[#C19B48] border-amber-500/40';
      case 'Leading':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/40';
      case 'Recent / Overruling':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/40';
    }
  };

  return (
    <>
      <div className="rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#F7F3E6]">
            {/* Table Head */}
            <thead className="bg-[#262626] border-b border-[#3D3D3D] text-[#A8A294] font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-3.5">Landmark Precedent</th>
                <th className="px-4 py-3.5">Court & Coram</th>
                <th className="px-4 py-3.5">Curator</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Metrics</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-[#3D3D3D]/60">
              {judgements.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[#A8A294]">
                    No landmark precedents found matching the selected filter criteria.
                  </td>
                </tr>
              ) : (
                judgements.map((j) => (
                  <tr key={j._id} className="hover:bg-[#262626]/50 transition-colors group">
                    {/* Precedent Name & Metadata */}
                    <td className="px-5 py-4 max-w-sm">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase border ${getImportanceBadge(
                              j.importance
                            )}`}
                          >
                            {j.importance}
                          </span>
                          <span className="font-mono text-[11px] font-bold text-[#C19B48]">
                            {j.citation}
                          </span>
                          {j.isFeatured && (
                            <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                              <Sparkles className="w-2.5 h-2.5" />
                              <span>Featured</span>
                            </span>
                          )}
                        </div>

                        <div className="font-serif font-bold text-sm text-[#F7F3E6] group-hover:text-[#C19B48] transition-colors line-clamp-1">
                          {j.title}
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-[#A8A294]">
                          <span className="truncate">{j.subject}</span>
                          <span>•</span>
                          <span>{j.year}</span>
                        </div>
                      </div>
                    </td>

                    {/* Court & Coram */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="space-y-0.5">
                        <span className="font-medium text-[#F7F3E6] block truncate max-w-[200px]">
                          {j.court}
                        </span>
                        <span className="text-[11px] text-[#A8A294] block truncate max-w-[200px]">
                          {j.bench}
                        </span>
                      </div>
                    </td>

                    {/* Curator */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="space-y-0.5">
                        <span className="text-xs text-[#F7F3E6] block">
                          {j.uploadedBy?.name || 'Academy Board'}
                        </span>
                        <span className="text-[10px] text-[#A8A294] block uppercase">
                          {j.uploadedBy?.role || 'Admin'}
                        </span>
                      </div>
                    </td>

                    {/* Status Toggle Button */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleTogglePublish(j)}
                        disabled={togglingId === j._id}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 ${
                          j.isPublished
                            ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/40'
                            : 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/40'
                        }`}
                        title="Click to toggle publication"
                      >
                        {togglingId === j._id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              j.isPublished ? 'bg-emerald-400' : 'bg-amber-400'
                            }`}
                          />
                        )}
                        <span>{j.isPublished ? 'Published' : 'Draft'}</span>
                      </button>
                    </td>

                    {/* Metrics */}
                    <td className="px-4 py-4 text-right whitespace-nowrap">
                      <div className="space-y-1 font-mono text-[11px]">
                        <div className="flex items-center justify-end gap-1 text-[#C19B48]">
                          <Download className="w-3 h-3" />
                          <span>{j.downloadCount}</span>
                        </div>
                        <div className="flex items-center justify-end gap-1 text-[#A8A294]">
                          <Eye className="w-3 h-3" />
                          <span>{j.viewCount} views</span>
                        </div>
                        <div className="text-[10px] text-[#A8A294]">
                          {j.pdfFile?.sizeFormatted}
                        </div>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Direct Stream Preview in New Window */}
                        <a
                          href={getDirectStreamUrl(j._id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg bg-[#262626] text-[#A8A294] hover:text-[#F7F3E6] hover:bg-[#3D3D3D] transition-colors"
                          title="Stream PDF in new tab"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>

                        {/* Download */}
                        <button
                          type="button"
                          onClick={() => handleDownload(j)}
                          className="p-1.5 rounded-lg bg-[#262626] text-[#A8A294] hover:text-[#C19B48] hover:bg-[#3D3D3D] transition-colors cursor-pointer"
                          title="Download PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit metadata / replace PDF */}
                        <button
                          type="button"
                          onClick={() => onEdit(j)}
                          className="p-1.5 rounded-lg bg-[#262626] text-[#A8A294] hover:text-[#F7F3E6] hover:bg-[#3D3D3D] transition-colors cursor-pointer"
                          title="Edit metadata / replace PDF"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => setItemToDelete(j)}
                          disabled={deletingId === j._id}
                          className="p-1.5 rounded-lg bg-[#262626] text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-colors cursor-pointer disabled:opacity-50"
                          title="Delete judgement"
                        >
                          {deletingId === j._id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-[#1E1E1E] rounded-2xl border border-red-500/40 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-2.5 rounded-xl bg-red-500/20 border border-red-500/30">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#F7F3E6]">Delete Precedent Record?</h3>
                <p className="text-xs text-[#A8A294]">Permanent physical and database deletion</p>
              </div>
            </div>

            <p className="text-xs text-[#F7F3E6] leading-relaxed">
              Are you sure you want to permanently delete{' '}
              <strong className="text-[#C19B48]">"{itemToDelete.title}"</strong> and its associated PDF
              storage files? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 rounded-xl bg-[#262626] text-[#A8A294] hover:text-[#F7F3E6] text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors shadow-md cursor-pointer"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

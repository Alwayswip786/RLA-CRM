import React, { useState } from 'react';
import {
  FileText,
  Download,
  Edit2,
  Trash2,
  ExternalLink,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import type { PyqPaper } from '../../types/pyq.types';
import {
  togglePublish,
  deletePyq,
  downloadPyqPdf,
  getDirectStreamUrl,
} from '../../services/pyq.service';
import { toast } from 'react-hot-toast';

interface PyqAdminTableProps {
  papers: PyqPaper[];
  onRefresh: () => void;
  onEdit: (paper: PyqPaper) => void;
}

export const PyqAdminTable: React.FC<PyqAdminTableProps> = ({
  papers,
  onRefresh,
  onEdit,
}) => {
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [paperToDelete, setPaperToDelete] = useState<PyqPaper | null>(null);

  const handleTogglePublish = async (paper: PyqPaper) => {
    try {
      setTogglingId(paper._id);
      const res = await togglePublish(paper._id);
      if (res.success) {
        toast.success(res.message);
        onRefresh();
      }
    } catch (err: any) {
      toast.error('Failed to change status.');
    } finally {
      setTogglingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!paperToDelete) return;
    try {
      setDeletingId(paperToDelete._id);
      const res = await deletePyq(paperToDelete._id);
      if (res.success) {
        toast.success('Paper and PDF files deleted permanently.');
        setPaperToDelete(null);
        onRefresh();
      }
    } catch (err: any) {
      toast.error('Failed to delete paper.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownload = async (paper: PyqPaper) => {
    try {
      toast.loading('Downloading solved PDF...', { id: 'download-toast' });
      await downloadPyqPdf(paper._id, paper.pdfFile.originalName);
      toast.success(`Downloaded ${paper.pdfFile.originalName}`, { id: 'download-toast' });
    } catch {
      toast.error('Download failed.', { id: 'download-toast' });
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
                <th className="px-5 py-3.5">Solved Paper</th>
                <th className="px-4 py-3.5">Exam & Stage</th>
                <th className="px-4 py-3.5">Author</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Metrics</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-[#3D3D3D]/60">
              {papers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[#A8A294]">
                    No question papers found matching the selected criteria.
                  </td>
                </tr>
              ) : (
                papers.map((paper) => (
                  <tr
                    key={paper._id}
                    className="hover:bg-[#262626]/50 transition-colors group"
                  >
                    {/* Title & Subject */}
                    <td className="px-5 py-4 max-w-sm">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#C19B48]/15 border border-[#C19B48]/30 flex items-center justify-center text-[#C19B48] shrink-0 mt-0.5">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 space-y-0.5">
                          <h4 className="font-serif font-bold text-sm text-[#F7F3E6] group-hover:text-[#C19B48] transition-colors truncate">
                            {paper.title}
                          </h4>
                          <p className="text-[11px] text-[#A8A294] truncate">
                            {paper.subject}
                          </p>
                          {paper.paperCode && (
                            <span className="inline-block font-mono text-[10px] text-slate-400 bg-[#141414] px-1.5 py-0.5 rounded border border-[#3D3D3D]">
                              {paper.paperCode}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Exam & Stage */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <span className="font-semibold text-xs text-[#F7F3E6] block">
                          {paper.exam}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] font-bold text-[#C19B48] bg-[#C19B48]/15 px-2 py-0.5 rounded border border-[#C19B48]/30">
                            {paper.year}
                          </span>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                              paper.stage === 'Mains'
                                ? 'bg-[#34D399]/15 text-[#34D399]'
                                : 'bg-blue-500/15 text-blue-400'
                            }`}
                          >
                            {paper.stage}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Author */}
                    <td className="px-4 py-4 max-w-[150px]">
                      <span className="text-xs text-[#A8A294] truncate block">
                        {paper.solvedByFaculty}
                      </span>
                    </td>

                    {/* Status & Quick Toggle */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={togglingId === paper._id}
                          onClick={() => handleTogglePublish(paper)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            paper.isPublished ? 'bg-[#34D399]' : 'bg-[#3D3D3D]'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                              paper.isPublished ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                        <span
                          className={`text-[11px] font-bold ${
                            paper.isPublished ? 'text-[#34D399]' : 'text-amber-400'
                          }`}
                        >
                          {paper.isPublished ? 'Published' : 'Draft'}
                        </span>
                      </div>
                    </td>

                    {/* Metrics */}
                    <td className="px-4 py-4 text-right whitespace-nowrap font-mono text-xs">
                      <div className="space-y-0.5 text-[#A8A294]">
                        <span className="text-[#F7F3E6] font-bold block">
                          {paper.downloadCount} dl
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {paper.pdfFile.sizeFormatted}
                        </span>
                      </div>
                    </td>

                    {/* Action buttons */}
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        {/* Preview raw stream in new tab */}
                        <a
                          href={getDirectStreamUrl(paper._id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Preview PDF"
                          className="p-1.5 rounded-lg bg-[#262626] hover:bg-[#3D3D3D] text-[#A8A294] hover:text-[#F7F3E6] border border-[#3D3D3D] transition-colors cursor-pointer"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>

                        {/* Download */}
                        <button
                          onClick={() => handleDownload(paper)}
                          title="Download PDF"
                          className="p-1.5 rounded-lg bg-[#262626] hover:bg-[#3D3D3D] text-[#A8A294] hover:text-[#F7F3E6] border border-[#3D3D3D] transition-colors cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit metadata & file */}
                        <button
                          onClick={() => onEdit(paper)}
                          title="Edit Paper"
                          className="p-1.5 rounded-lg bg-[#262626] hover:bg-[#C19B48]/20 text-[#A8A294] hover:text-[#C19B48] border border-[#3D3D3D] transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => setPaperToDelete(paper)}
                          title="Delete Paper"
                          className="p-1.5 rounded-lg bg-[#262626] hover:bg-rose-950/40 text-[#A8A294] hover:text-rose-400 border border-[#3D3D3D] transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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
      {paperToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#1E1E1E] border border-[#3D3D3D] rounded-2xl shadow-2xl p-6 space-y-4 text-[#F7F3E6]">
            <div className="w-12 h-12 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold font-serif text-[#F7F3E6]">
                Delete Solved PYQ Paper?
              </h3>
              <p className="text-xs text-[#A8A294] leading-relaxed">
                Are you sure you want to delete <strong className="text-white">"{paperToDelete.title}"</strong>? This will remove the database record and permanently delete the PDF file from server disk storage.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={deletingId !== null}
                onClick={() => setPaperToDelete(null)}
                className="px-4 py-2 rounded-xl bg-[#262626] hover:bg-[#333] text-xs font-semibold text-[#A8A294] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingId !== null}
                onClick={confirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                {deletingId !== null ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>Delete Permanently</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

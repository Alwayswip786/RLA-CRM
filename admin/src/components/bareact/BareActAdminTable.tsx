import React, { useState } from 'react';
import {
  Download,
  Edit2,
  Trash2,
  ExternalLink,
  Loader2,
  AlertCircle,
  Sparkles,
  BookOpen,
  Eye,
  FileText,
} from 'lucide-react';
import type { BareActNote } from '../../types/bareAct.types';
import {
  togglePublishNote,
  deleteNote,
  downloadNotePdf,
  getNoteDirectStreamUrl,
} from '../../services/bareAct.service';
import { toast } from 'react-hot-toast';

interface BareActAdminTableProps {
  notes: BareActNote[];
  onRefresh: () => void;
  onEdit: (note: BareActNote) => void;
  onPreview: (note: BareActNote) => void;
}

export const BareActAdminTable: React.FC<BareActAdminTableProps> = ({
  notes,
  onRefresh,
  onEdit,
  onPreview,
}) => {
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<BareActNote | null>(null);

  const handleTogglePublish = async (note: BareActNote) => {
    try {
      setTogglingId(note._id);
      const res = await togglePublishNote(note._id);
      if (res.success) {
        toast.success(res.message);
        onRefresh();
      }
    } catch {
      toast.error('Failed to change publication status.');
    } finally {
      setTogglingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      setDeletingId(itemToDelete._id);
      const res = await deleteNote(itemToDelete._id);
      if (res.success) {
        toast.success('Bare Act Note and PDF deleted permanently.');
        setItemToDelete(null);
        onRefresh();
      }
    } catch {
      toast.error('Failed to delete note.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownload = async (note: BareActNote) => {
    try {
      toast.loading('Downloading statutory decoding PDF...', { id: 'download-toast' });
      await downloadNotePdf(
        note._id,
        note.pdfFile?.originalName || `${note.actName}_Decoding.pdf`
      );
      toast.success('PDF download complete!', { id: 'download-toast' });
    } catch {
      toast.error('Failed to download PDF document.', { id: 'download-toast' });
    }
  };

  if (notes.length === 0) {
    return (
      <div className="p-12 text-center rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] space-y-3">
        <div className="w-12 h-12 mx-auto rounded-full bg-[#262626] border border-[#3D3D3D] flex items-center justify-center text-[#A8A294]">
          <BookOpen className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-[#F7F3E6]">No Bare Act Notes Found</h3>
        <p className="text-xs text-[#A8A294] max-w-md mx-auto">
          No statutory decoding notes match your active filter criteria. Adjust filters or upload a new Bare Act Note to populate the Knowledge Vault.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] overflow-hidden shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#3D3D3D] bg-[#262626]/60 text-[#A8A294] uppercase text-[10px] tracking-wider font-semibold">
              <th className="py-3.5 px-4">Act & Category</th>
              <th className="py-3.5 px-4">Scope & Title</th>
              <th className="py-3.5 px-4">Sections & TOC</th>
              <th className="py-3.5 px-4">Document Metrics</th>
              <th className="py-3.5 px-4">Engagement</th>
              <th className="py-3.5 px-4 text-center">Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2F2F2F]">
            {notes.map((note) => {
              const isToggling = togglingId === note._id;
              return (
                <tr
                  key={note._id}
                  className="hover:bg-[#262626]/50 transition-colors group"
                >
                  {/* Act & Category */}
                  <td className="py-4 px-4 align-top min-w-[220px]">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-serif font-bold text-sm text-[#F7F3E6] group-hover:text-[#C19B48] transition-colors">
                          {note.actName}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#262626] border border-[#3D3D3D] text-[#A8A294]">
                          {note.actYear}
                        </span>
                        {note.isFeatured && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            <Sparkles className="w-2.5 h-2.5" />
                            Spotlight
                          </span>
                        )}
                      </div>
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#C19B48]/15 border border-[#C19B48]/30 text-[#C19B48]">
                        {note.category}
                      </span>
                      {note.actNumber && (
                        <p className="text-[10px] text-[#A8A294]">{note.actNumber}</p>
                      )}
                    </div>
                  </td>

                  {/* Scope & Title */}
                  <td className="py-4 px-4 align-top min-w-[260px] max-w-[340px]">
                    <div className="space-y-1">
                      <p className="font-semibold text-xs text-[#F7F3E6] leading-snug line-clamp-2">
                        {note.title}
                      </p>
                      {note.chapter && (
                        <p className="text-[11px] text-[#C19B48] font-medium truncate">
                          {note.chapter}
                        </p>
                      )}
                      <p className="text-[10px] text-[#A8A294] font-mono">
                        {note.sectionsCovered}
                      </p>
                    </div>
                  </td>

                  {/* Sections & TOC */}
                  <td className="py-4 px-4 align-top min-w-[170px]">
                    <div className="space-y-1.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6]">
                        <FileText className="w-3 h-3 text-[#60A5FA]" />
                        {note.sectionBreakdown?.length || 0} Sections Decoded
                      </span>
                      {note.highlights && note.highlights.length > 0 && (
                        <p className="text-[10px] text-[#A8A294]">
                          {note.highlights.length} High-Yield Charts
                        </p>
                      )}
                      <span className="inline-block text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                        {note.difficulty}
                      </span>
                    </div>
                  </td>

                  {/* Document Metrics */}
                  <td className="py-4 px-4 align-top min-w-[160px]">
                    <div className="space-y-1 text-[11px] text-[#A8A294]">
                      <div className="font-mono text-[#F7F3E6] font-medium flex items-center gap-1.5">
                        <span>{note.pdfFile?.sizeFormatted || 'PDF'}</span>
                        {note.pdfFile?.pageCount ? (
                          <span>• {note.pdfFile.pageCount} pp</span>
                        ) : null}
                      </div>
                      <p className="text-[10px] truncate">By: {note.author}</p>
                      <p className="text-[9px] text-[#78716C]">
                        Updated {new Date(note.updatedAt || note.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </td>

                  {/* Engagement */}
                  <td className="py-4 px-4 align-top min-w-[120px]">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                        <Download className="w-3.5 h-3.5" />
                        <span>{note.downloadCount || 0}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-[#A8A294]">
                        <Eye className="w-3 h-3" />
                        <span>{note.viewCount || 0} views</span>
                      </div>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-4 px-4 align-top text-center min-w-[120px]">
                    <button
                      type="button"
                      disabled={isToggling}
                      onClick={() => handleTogglePublish(note)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition-colors cursor-pointer disabled:opacity-50 ${
                        note.isPublished
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                      }`}
                      title="Click to toggle Published / Draft status"
                    >
                      {isToggling ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            note.isPublished ? 'bg-emerald-400' : 'bg-amber-400'
                          }`}
                        />
                      )}
                      <span>{note.isPublished ? 'Published' : 'Draft'}</span>
                    </button>
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-4 align-top text-right min-w-[150px]">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* In-app Preview */}
                      <button
                        type="button"
                        onClick={() => onPreview(note)}
                        title="Read Online (In-App PDF Viewer)"
                        className="p-2 rounded-lg bg-[#262626] hover:bg-[#3D3D3D] text-[#A8A294] hover:text-[#F7F3E6] border border-[#3D3D3D] transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {/* Direct PDF Link */}
                      <a
                        href={getNoteDirectStreamUrl(note._id)}
                        target="_blank"
                        rel="noreferrer"
                        title="Open Raw PDF Stream in New Tab"
                        className="p-2 rounded-lg bg-[#262626] hover:bg-[#3D3D3D] text-[#A8A294] hover:text-[#60A5FA] border border-[#3D3D3D] transition-colors cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>

                      {/* Download */}
                      <button
                        type="button"
                        onClick={() => handleDownload(note)}
                        title="Download Document"
                        className="p-2 rounded-lg bg-[#262626] hover:bg-[#3D3D3D] text-[#A8A294] hover:text-emerald-400 border border-[#3D3D3D] transition-colors cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>

                      {/* Edit */}
                      <button
                        type="button"
                        onClick={() => onEdit(note)}
                        title="Edit Metadata & Replace PDF"
                        className="p-2 rounded-lg bg-[#262626] hover:bg-[#C19B48]/20 text-[#A8A294] hover:text-[#C19B48] border border-[#3D3D3D] hover:border-[#C19B48]/50 transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => setItemToDelete(note)}
                        title="Delete Note"
                        className="p-2 rounded-lg bg-[#262626] hover:bg-rose-500/20 text-[#A8A294] hover:text-rose-400 border border-[#3D3D3D] hover:border-rose-500/40 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal Dialog */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md p-6 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 rounded-full bg-rose-500/20 border border-rose-500/30">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#F7F3E6]">Delete Bare Act Note?</h3>
                <p className="text-xs text-[#A8A294]">This action is irreversible.</p>
              </div>
            </div>

            <p className="text-xs text-[#A8A294] leading-relaxed">
              Are you sure you want to permanently delete{' '}
              <strong className="text-[#F7F3E6]">"{itemToDelete.title}"</strong> ({itemToDelete.actName})?
              The statutory decoding note and associated physical PDF files will be purged from the server.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={!!deletingId}
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#A8A294] hover:text-[#F7F3E6] hover:bg-[#262626] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!!deletingId}
                onClick={confirmDelete}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
              >
                {deletingId ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirm Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

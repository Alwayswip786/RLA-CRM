import React, { useState } from 'react';
import {
  Edit2,
  Trash2,
  Eye,
  Calendar,
  Sparkles,
  Loader2,
  AlertCircle,
  X,
  BookOpen,
} from 'lucide-react';
import type { DailyLegalDigestEdition, DigestStatus } from '../../types/dailyDigest.types';
import { updateEditionStatusAdmin, deleteEditionAdmin } from '../../services/dailyDigest.service';
import { toast } from 'react-hot-toast';

interface EditionAdminTableProps {
  editions: DailyLegalDigestEdition[];
  onRefresh: () => void;
  onEdit: (edition: DailyLegalDigestEdition) => void;
}

const getTodayDateIST = (): string => {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
};

export const EditionAdminTable: React.FC<EditionAdminTableProps> = ({
  editions,
  onRefresh,
  onEdit,
}) => {
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<DailyLegalDigestEdition | null>(null);
  const [previewEdition, setPreviewEdition] = useState<DailyLegalDigestEdition | null>(null);

  const todayIST = getTodayDateIST();

  const handleStatusChange = async (edition: DailyLegalDigestEdition, newStatus: DigestStatus) => {
    try {
      setTogglingId(edition._id);
      const res = await updateEditionStatusAdmin(edition._id, newStatus);
      if (res.success) {
        toast.success(`Edition status updated to ${newStatus}`);
        onRefresh();
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update edition status.');
    } finally {
      setTogglingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      setDeletingId(itemToDelete._id);
      const res = await deleteEditionAdmin(itemToDelete._id);
      if (res.success) {
        toast.success(res.message);
        setItemToDelete(null);
        onRefresh();
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to delete edition.');
    } finally {
      setDeletingId(null);
    }
  };

  if (editions.length === 0) {
    return (
      <div className="p-12 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-[#C19B48]/10 text-[#C19B48] flex items-center justify-center mx-auto">
          <BookOpen className="w-6 h-6" />
        </div>
        <h3 className="font-serif text-base font-bold text-[#F7F3E6]">
          No Daily Legal Digest Editions Found
        </h3>
        <p className="text-xs text-[#A8A294] max-w-md mx-auto">
          No editions match the current search or filters. Click &quot;Compose New Edition&quot; to publish
          today&apos;s legal briefing to student classroom dashboards.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-2xl border border-[#3D3D3D] bg-[#1E1E1E]">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#262626] border-b border-[#3D3D3D] text-[#A8A294] font-semibold">
              <th className="py-3 px-4">Edition Date & ID</th>
              <th className="py-3 px-4">Title & Featured Maxim</th>
              <th className="py-3 px-4">Content Items</th>
              <th className="py-3 px-4">Curator</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-center">Reads</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#3D3D3D]">
            {editions.map((ed) => {
              const isToday = ed.editionDateIST === todayIST;

              return (
                <tr
                  key={ed._id}
                  className="hover:bg-[#262626]/50 transition-colors group"
                >
                  {/* Date & Badge */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-[#262626] border border-[#3D3D3D] text-[#C19B48]">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-[#F7F3E6] text-xs">
                            {ed.editionDateIST}
                          </span>
                          {isToday && (
                            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/20 border border-amber-500/40 text-amber-300">
                              TODAY
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-[#A8A294] block">
                          Edition #{ed.editionNumber || 1}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Title & Maxim */}
                  <td className="py-3.5 px-4 max-w-xs">
                    <div className="space-y-0.5">
                      <h4 className="font-serif font-bold text-[#F7F3E6] text-xs leading-snug line-clamp-1">
                        {ed.title}
                      </h4>
                      {ed.featuredMaxim?.latinText && (
                        <p className="text-[11px] text-[#C19B48] font-serif italic line-clamp-1 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 shrink-0" />
                          <span>{ed.featuredMaxim.latinText}</span>
                        </p>
                      )}
                    </div>
                  </td>

                  {/* Content Items */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      <span className="font-bold text-[#F7F3E6] text-[11px]">
                        {ed.items?.length || 0} Curated Items
                      </span>
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {ed.items?.slice(0, 2).map((item, idx) => (
                          <span
                            key={idx}
                            className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#262626] border border-[#3D3D3D] text-[#A8A294] truncate max-w-[120px]"
                            title={item.title}
                          >
                            {item.contentType}
                          </span>
                        ))}
                        {(ed.items?.length || 0) > 2 && (
                          <span className="px-1 py-0.5 rounded text-[9px] font-bold bg-[#C19B48]/15 text-[#C19B48]">
                            +{ed.items.length - 2} more
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Curator */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="font-medium text-[#F7F3E6] text-[11px]">
                      {ed.authorName || 'Adv. Rajinder Sir'}
                    </span>
                    <span className="block text-[10px] text-[#A8A294] truncate max-w-[120px]">
                      {ed.curatedBy || 'Faculty Wing'}
                    </span>
                  </td>

                  {/* Status Dropdown */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="relative inline-block">
                      <select
                        value={ed.status}
                        onChange={(e) => handleStatusChange(ed, e.target.value as DigestStatus)}
                        disabled={togglingId === ed._id}
                        className={`text-[11px] font-bold px-2 py-1 rounded-lg border appearance-none pr-6 cursor-pointer focus:outline-none transition-colors ${
                          ed.status === 'published'
                            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                            : ed.status === 'scheduled'
                            ? 'bg-blue-500/15 border-blue-500/30 text-blue-400'
                            : ed.status === 'draft'
                            ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                            : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                        }`}
                      >
                        <option value="published" className="bg-[#1E1E1E] text-emerald-400">
                          Published
                        </option>
                        <option value="scheduled" className="bg-[#1E1E1E] text-blue-400">
                          Scheduled
                        </option>
                        <option value="draft" className="bg-[#1E1E1E] text-amber-400">
                          Draft
                        </option>
                        <option value="archived" className="bg-[#1E1E1E] text-zinc-400">
                          Archived
                        </option>
                      </select>
                      {togglingId === ed._id && (
                        <Loader2 className="w-3 h-3 text-[#C19B48] animate-spin absolute right-1.5 top-1/2 -translate-y-1/2" />
                      )}
                    </div>
                  </td>

                  {/* Reads */}
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <span className="font-mono font-bold text-emerald-400">
                      {ed.totalReadsCount || 0}
                    </span>
                    <span className="block text-[10px] text-[#A8A294]">reads</span>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setPreviewEdition(ed)}
                        className="p-1.5 rounded-lg bg-[#262626] hover:bg-[#3D3D3D] text-[#A8A294] hover:text-[#F7F3E6] transition-colors cursor-pointer"
                        title="View Edition Dossier"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onEdit(ed)}
                        className="p-1.5 rounded-lg bg-[#262626] hover:bg-[#3D3D3D] text-[#A8A294] hover:text-[#C19B48] transition-colors cursor-pointer"
                        title="Edit Edition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setItemToDelete(ed)}
                        className="p-1.5 rounded-lg bg-[#262626] hover:bg-red-500/20 text-[#A8A294] hover:text-red-400 transition-colors cursor-pointer"
                        title="Delete Edition"
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

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-[#1E1E1E] rounded-2xl border border-[#3D3D3D] shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-red-500/15 text-red-400 border border-red-500/30">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-serif text-base font-bold text-[#F7F3E6]">
                  Delete Daily Legal Digest Edition?
                </h3>
                <p className="text-xs text-[#A8A294]">
                  Date: <strong className="text-[#F7F3E6]">{itemToDelete.editionDateIST}</strong>
                </p>
              </div>
            </div>

            <p className="text-xs text-[#A8A294] leading-relaxed">
              Are you sure you want to delete this edition? All associated read tracking and bookmarks
              for items in this edition will be affected. This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                disabled={deletingId === itemToDelete._id}
                className="px-4 py-2 rounded-xl bg-[#262626] hover:bg-[#3D3D3D] text-[#A8A294] hover:text-[#F7F3E6] text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deletingId === itemToDelete._id}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
              >
                {deletingId === itemToDelete._id ? (
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

      {/* Quick Preview Modal */}
      {previewEdition && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-[#1E1E1E] rounded-2xl border border-[#3D3D3D] shadow-2xl overflow-hidden my-8 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 bg-[#262626] border-b border-[#3D3D3D]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#C19B48]/15 text-[#C19B48]">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-base font-bold text-[#F7F3E6]">
                    Edition Preview: {previewEdition.editionDateIST}
                  </h3>
                  <p className="text-[11px] text-[#A8A294]">
                    {previewEdition.title} • {previewEdition.authorName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewEdition(null)}
                className="p-1.5 rounded-lg text-[#A8A294] hover:text-[#F7F3E6] hover:bg-[#3D3D3D] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              {/* Maxim */}
              {previewEdition.featuredMaxim && (
                <div className="p-4 rounded-xl bg-linear-to-r from-[#0C1E3A] via-[#102B52] to-[#0A1628] border border-[#C19B48]/30 space-y-2">
                  <span className="text-[10px] font-bold uppercase text-[#C19B48] tracking-wider">
                    Legal Maxim of the Day
                  </span>
                  <p className="font-serif italic text-base text-[#F7F3E6]">
                    {previewEdition.featuredMaxim.latinText}
                  </p>
                  <p className="text-xs text-[#E5D7B7]">
                    {previewEdition.featuredMaxim.englishMeaning}
                  </p>
                  <p className="text-[11px] text-[#A8A294]">
                    {previewEdition.featuredMaxim.jurisprudenceContext}
                  </p>
                </div>
              )}

              {/* Items List */}
              <div className="space-y-3 pt-2">
                <h4 className="font-bold text-[#C19B48] uppercase text-xs tracking-wider">
                  Curated Content Items ({previewEdition.items?.length || 0})
                </h4>

                {previewEdition.items?.map((item, idx) => (
                  <div
                    key={item.itemId || idx}
                    className="p-3.5 rounded-xl bg-[#262626] border border-[#3D3D3D] space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-[#C19B48]/15 text-[#C19B48] uppercase">
                        {item.categoryBadge || item.contentType}
                      </span>
                      {item.citation && (
                        <span className="font-mono text-[10px] text-[#A8A294]">
                          {item.citation}
                        </span>
                      )}
                    </div>
                    <h5 className="font-serif font-bold text-[#F7F3E6] text-xs">
                      {item.title}
                    </h5>
                    <p className="text-[11px] text-[#A8A294] leading-relaxed">
                      {item.summary}
                    </p>
                    {item.examinationTip && (
                      <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-200 text-[11px]">
                        <strong>Judicial Tip:</strong> {item.examinationTip}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

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
  Calendar,
  FileText,
  X,
} from 'lucide-react';
import type { JudgementDigest, JudgementStatus } from '../../types/judgement.types';
import {
  updateJudgementStatus,
  scheduleDailyJudgement,
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

const getTodayDateIST = (): string => {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
};

export const JudgementAdminTable: React.FC<JudgementAdminTableProps> = ({
  judgements,
  onRefresh,
  onEdit,
}) => {
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<JudgementDigest | null>(null);

  // Quick Schedule Modal State
  const [scheduleTarget, setScheduleTarget] = useState<JudgementDigest | null>(null);
  const [scheduleDate, setScheduleDate] = useState(getTodayDateIST());
  const [schedulePriority, setSchedulePriority] = useState(1);
  const [scheduleFeatured, setScheduleFeatured] = useState(true);
  const [scheduling, setScheduling] = useState(false);

  const todayIST = getTodayDateIST();

  const handleStatusChange = async (j: JudgementDigest, newStatus: JudgementStatus) => {
    try {
      setTogglingId(j._id);
      const res = await updateJudgementStatus(j._id, newStatus);
      if (res.success) {
        toast.success(`Case status changed to ${newStatus}`);
        onRefresh();
      }
    } catch {
      toast.error('Failed to change publication status.');
    } finally {
      setTogglingId(null);
    }
  };

  const handleOpenScheduleModal = (j: JudgementDigest) => {
    setScheduleTarget(j);
    setScheduleDate(j.dailyDateIST || todayIST);
    setSchedulePriority(j.priority || 1);
    setScheduleFeatured(j.isDailyFeatured ?? true);
  };

  const handleConfirmSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleTarget) return;

    try {
      setScheduling(true);
      const res = await scheduleDailyJudgement(scheduleTarget._id, {
        dailyDateIST: scheduleDate,
        priority: schedulePriority,
        isDailyFeatured: scheduleFeatured,
        status: 'published',
      });
      if (res.success) {
        toast.success(res.message);
        setScheduleTarget(null);
        onRefresh();
      }
    } catch {
      toast.error('Failed to schedule Landmark Judgment of the Day.');
    } finally {
      setScheduling(false);
    }
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      setDeletingId(itemToDelete._id);
      const res = await deleteJudgement(itemToDelete._id);
      if (res.success) {
        toast.success('Judgement precedent deleted permanently.');
        setItemToDelete(null);
        onRefresh();
      }
    } catch {
      toast.error('Failed to delete judgement.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownload = async (j: JudgementDigest) => {
    if (!j.pdfFile) {
      toast.error('No PDF document is attached to this case law.');
      return;
    }
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

  const getStatusBadge = (status?: JudgementStatus, isPub?: boolean) => {
    const s = status || (isPub ? 'published' : 'draft');
    switch (s) {
      case 'published':
        return {
          bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
          dot: 'bg-emerald-400',
          label: 'Published',
        };
      case 'scheduled':
        return {
          bg: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
          dot: 'bg-blue-400',
          label: 'Scheduled',
        };
      case 'draft':
        return {
          bg: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
          dot: 'bg-amber-400',
          label: 'Draft',
        };
      case 'archived':
        return {
          bg: 'bg-slate-500/20 text-slate-400 border-slate-500/40',
          dot: 'bg-slate-400',
          label: 'Archived',
        };
      default:
        return {
          bg: 'bg-slate-500/20 text-slate-400 border-slate-500/40',
          dot: 'bg-slate-400',
          label: 'Draft',
        };
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
                <th className="px-4 py-3.5">Daily Schedule</th>
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
                judgements.map((j) => {
                  const statusInfo = getStatusBadge(j.status, j.isPublished);
                  const isTodayDaily = j.dailyDateIST === todayIST;

                  return (
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
                            {j.isDailyFeatured && (
                              <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                                <Sparkles className="w-2.5 h-2.5" />
                                <span>Featured Daily</span>
                              </span>
                            )}
                          </div>

                          <div className="font-serif font-bold text-sm text-[#F7F3E6] group-hover:text-[#C19B48] transition-colors line-clamp-1">
                            {j.title}
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#A8A294]">
                            <span className="truncate max-w-[180px]">{j.category || j.subject}</span>
                            <span>•</span>
                            <span>{j.year}</span>
                            {j.pdfFile ? (
                              <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-400">
                                <FileText className="w-3 h-3" />
                                <span>PDF</span>
                              </span>
                            ) : (
                              <span className="text-[10px] text-amber-400/80">HTML Dossier</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Court & Coram */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="space-y-0.5">
                          <span className="font-medium text-[#F7F3E6] block truncate max-w-[200px]">
                            {j.court}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#262626] border border-[#3D3D3D] text-[#C19B48]">
                              {j.benchStrength || j.bench}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Daily Schedule */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          {j.dailyDateIST ? (
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold border ${
                                  isTodayDaily
                                    ? 'bg-amber-500/20 text-[#C19B48] border-amber-500/40 animate-pulse'
                                    : 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                                }`}
                              >
                                <Calendar className="w-3 h-3" />
                                <span>{j.dailyDateIST}</span>
                              </span>
                              {isTodayDaily && (
                                <span className="text-[9px] uppercase font-bold text-amber-400">
                                  Today
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[11px] text-[#A8A294]/60 italic">Not scheduled</span>
                          )}

                          <button
                            type="button"
                            onClick={() => handleOpenScheduleModal(j)}
                            className="text-[10px] text-[#C19B48] hover:underline cursor-pointer block"
                          >
                            Set Daily Schedule
                          </button>
                        </div>
                      </td>

                      {/* Status Selector Dropdown */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="relative inline-block">
                          {togglingId === j._id ? (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#262626] text-[#A8A294]">
                              <Loader2 className="w-3 h-3 animate-spin" />
                              <span>Updating...</span>
                            </div>
                          ) : (
                            <select
                              value={j.status || (j.isPublished ? 'published' : 'draft')}
                              onChange={(e) => handleStatusChange(j, e.target.value as JudgementStatus)}
                              className={`text-xs font-semibold px-2.5 py-1 rounded-full border cursor-pointer focus:outline-none appearance-none pr-6 bg-transparent ${statusInfo.bg}`}
                              style={{
                                backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'right 0.4rem center',
                                backgroundSize: '0.8em',
                              }}
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
                              <option value="archived" className="bg-[#1E1E1E] text-slate-400">
                                Archived
                              </option>
                            </select>
                          )}
                        </div>
                      </td>

                      {/* Metrics */}
                      <td className="px-4 py-4 text-right whitespace-nowrap">
                        <div className="space-y-1 font-mono text-[11px]">
                          <div className="flex items-center justify-end gap-1 text-[#C19B48]">
                            <Download className="w-3 h-3" />
                            <span>{j.downloadCount || 0}</span>
                          </div>
                          <div className="flex items-center justify-end gap-1 text-[#A8A294]">
                            <Eye className="w-3 h-3" />
                            <span>{j.viewCount || 0} views</span>
                          </div>
                          <div className="text-[10px] text-[#A8A294]">
                            {j.pdfFile?.sizeFormatted || 'No PDF'}
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Schedule as Daily */}
                          <button
                            type="button"
                            onClick={() => handleOpenScheduleModal(j)}
                            className="p-1.5 rounded-lg bg-[#262626] text-[#A8A294] hover:text-[#C19B48] hover:bg-[#3D3D3D] transition-colors cursor-pointer"
                            title="Schedule as Landmark Judgment of the Day"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                          </button>

                          {/* Direct Stream Preview in New Window */}
                          {j.pdfFile ? (
                            <a
                              href={getDirectStreamUrl(j._id)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg bg-[#262626] text-[#A8A294] hover:text-[#F7F3E6] hover:bg-[#3D3D3D] transition-colors"
                              title="Stream PDF in new tab"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          ) : (
                            <span
                              className="p-1.5 rounded-lg bg-[#262626] text-[#A8A294]/40 cursor-not-allowed"
                              title="No PDF attached"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </span>
                          )}

                          {/* Download */}
                          <button
                            type="button"
                            onClick={() => handleDownload(j)}
                            disabled={!j.pdfFile}
                            className={`p-1.5 rounded-lg bg-[#262626] transition-colors ${
                              j.pdfFile
                                ? 'text-[#A8A294] hover:text-[#C19B48] hover:bg-[#3D3D3D] cursor-pointer'
                                : 'text-[#A8A294]/40 cursor-not-allowed'
                            }`}
                            title={j.pdfFile ? 'Download PDF' : 'No PDF attached'}
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
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Schedule Modal */}
      {scheduleTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-[#1E1E1E] rounded-2xl border border-[#3D3D3D] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#3D3D3D]">
              <div className="flex items-center gap-2 text-[#C19B48]">
                <Calendar className="w-5 h-5" />
                <h3 className="font-serif font-bold text-base text-[#F7F3E6]">
                  Schedule Judgment of the Day
                </h3>
              </div>
              <button
                onClick={() => setScheduleTarget(null)}
                className="text-[#A8A294] hover:text-[#F7F3E6] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-[#262626] border border-[#3D3D3D] space-y-1">
              <p className="text-xs font-bold text-[#F7F3E6] line-clamp-1">
                {scheduleTarget.title}
              </p>
              <p className="text-[11px] font-mono text-[#C19B48]">
                {scheduleTarget.citation}
              </p>
            </div>

            <form onSubmit={handleConfirmSchedule} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#F7F3E6] mb-1">
                  Schedule Date (IST) <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
                />
                <span className="text-[10px] text-[#A8A294] mt-1 block">
                  Students logging in on this date will see this judgment on their dashboard.
                </span>
              </div>

              <div>
                <label className="block font-semibold text-[#F7F3E6] mb-1">
                  Priority (1-10)
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={schedulePriority}
                  onChange={(e) => setSchedulePriority(Number(e.target.value) || 1)}
                  className="w-full px-3 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={scheduleFeatured}
                  onChange={(e) => setScheduleFeatured(e.target.checked)}
                  className="rounded border-[#3D3D3D] text-[#C19B48] focus:ring-[#C19B48] w-4 h-4 bg-[#262626]"
                />
                <span className="text-[#C19B48] font-semibold text-xs">
                  Mark as Daily Featured Spotlight
                </span>
              </label>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setScheduleTarget(null)}
                  disabled={scheduling}
                  className="px-4 py-2 rounded-xl bg-[#262626] hover:bg-[#3D3D3D] text-[#A8A294] hover:text-[#F7F3E6] font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={scheduling}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#C19B48] hover:bg-[#D8B862] text-[#1E1E1E] font-bold transition-colors cursor-pointer"
                >
                  {scheduling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Calendar className="w-3.5 h-3.5" />}
                  <span>{scheduling ? 'Scheduling...' : 'Set as Judgment of Day'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-[#1E1E1E] rounded-2xl border border-[#3D3D3D] shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-2 rounded-xl bg-red-500/20 border border-red-500/40">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-base text-[#F7F3E6]">
                Delete Landmark Precedent?
              </h3>
            </div>

            <p className="text-xs text-[#A8A294] leading-relaxed">
              Are you sure you want to permanently delete{' '}
              <strong className="text-[#F7F3E6]">"{itemToDelete.title}"</strong> ({itemToDelete.citation})?
              This action cannot be undone and will remove the ratio decidendi and physical files from storage.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                disabled={deletingId !== null}
                className="px-4 py-2 rounded-xl bg-[#262626] hover:bg-[#3D3D3D] text-[#A8A294] hover:text-[#F7F3E6] text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deletingId !== null}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
              >
                {deletingId ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>{deletingId ? 'Deleting...' : 'Delete Case Law'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

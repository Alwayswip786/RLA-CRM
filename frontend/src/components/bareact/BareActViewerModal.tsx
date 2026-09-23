import React, { useState } from 'react';
import {
  X,
  ExternalLink,
  Download,
  BookOpen,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  FileText,
  Gavel,
  Bookmark,
} from 'lucide-react';
import type { BareActNote } from '../../types/bareAct.types';
import { getNoteDirectStreamUrl, downloadNotePdf } from '../../services/bareAct.service';
import { toast } from '../../lib/toast';
import { BottomSheet } from '../ui/BottomSheet';

interface BareActViewerModalProps {
  note: BareActNote | null;
  isOpen: boolean;
  onClose: () => void;
  onDownloadComplete?: (id: string) => void;
}

export const BareActViewerModal: React.FC<BareActViewerModalProps> = ({
  note,
  isOpen,
  onClose,
  onDownloadComplete,
}) => {
  const [zoom, setZoom] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeSidebarTab, setActiveSidebarTab] = useState<'toc' | 'cases'>('toc');
  const [showSidebar, setShowSidebar] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isMobileTocOpen, setIsMobileTocOpen] = useState(false);

  if (!isOpen || !note) return null;

  const pdfStreamUrl = getNoteDirectStreamUrl(note._id);

  const handleDownload = async () => {
    try {
      toast.loading('Downloading statutory decoding PDF...', { id: 'reader-download' });
      await downloadNotePdf(
        note._id,
        note.pdfFile?.originalName || `${note.actName}_Decoding.pdf`
      );
      toast.success(`Downloaded: ${note.actName} Decoding Notes`, { id: 'reader-download' });
      onDownloadComplete?.(note._id);
    } catch {
      toast.error('Failed to download PDF document.', { id: 'reader-download' });
    }
  };

  const handleToggleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    toast.success(
      isBookmarked
        ? `Removed "${note.actName}" from Starred Vault`
        : `Saved "${note.actName}" to your Starred Vault`
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className={`w-full rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] shadow-2xl overflow-hidden flex flex-col transition-all ${
          isFullscreen ? 'fixed inset-2 z-50 max-w-none h-[calc(100vh-1rem)]' : 'max-w-6xl h-[88vh]'
        }`}
      >
        {/* Top Navbar */}
        <div className="px-4 sm:px-5 py-3 border-b border-slate-200 dark:border-[#143564] bg-slate-50 dark:bg-[#061120] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-[#c19b48]/15 text-[#c19b48] dark:text-[#f3d999] border border-amber-200 dark:border-[#c19b48]/30 shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="font-serif font-bold text-sm text-slate-900 dark:text-white truncate">
                {note.title}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {note.actName} • {note.sectionsCovered} • {note.pdfFile?.sizeFormatted}
              </p>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Desktop Sidebar toggle */}
            {(note.sectionBreakdown?.length > 0 || (note.relatedJudgements && note.relatedJudgements.length > 0)) && (
              <>
                <button
                  type="button"
                  onClick={() => setShowSidebar(!showSidebar)}
                  className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                    showSidebar
                      ? 'bg-[#c19b48]/20 border-[#c19b48]/40 text-[#c19b48] dark:text-[#f3d999]'
                      : 'bg-white dark:bg-[#0a1c36] border-slate-200 dark:border-[#143564] text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Sections TOC</span>
                </button>

                {/* Mobile TOC Button (< 768px) */}
                <button
                  type="button"
                  onClick={() => setIsMobileTocOpen(true)}
                  className="md:hidden p-2 rounded-xl bg-[#c19b48]/15 border border-[#c19b48]/30 text-[#c19b48] dark:text-[#f3d999] transition-colors cursor-pointer"
                  title="Sections TOC"
                >
                  <FileText className="w-3.5 h-3.5" />
                </button>
              </>
            )}

            {/* Bookmark */}
            <button
              type="button"
              onClick={handleToggleBookmark}
              title={isBookmarked ? 'Remove Bookmark' : 'Star Note'}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                isBookmarked
                  ? 'bg-[#c19b48]/20 border-[#c19b48]/40 text-[#c19b48]'
                  : 'bg-white dark:bg-[#0a1c36] border-slate-200 dark:border-[#143564] text-slate-400 hover:text-[#c19b48]'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
            </button>

            {/* Zoom Controls */}
            <div className="hidden sm:flex items-center gap-1 bg-white dark:bg-[#0a1c36] p-1 rounded-xl border border-slate-200 dark:border-[#143564]">
              <button
                type="button"
                disabled={zoom <= 60}
                onClick={() => setZoom((z) => Math.max(60, z - 15))}
                className="p-1 rounded text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white disabled:opacity-40 cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] font-mono text-slate-700 dark:text-slate-300 w-9 text-center">
                {zoom}%
              </span>
              <button
                type="button"
                disabled={zoom >= 160}
                onClick={() => setZoom((z) => Math.min(160, z + 15))}
                className="p-1 rounded text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white disabled:opacity-40 cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Fullscreen (Desktop/Tablet) */}
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="hidden sm:inline-flex p-2 rounded-xl bg-white dark:bg-[#0a1c36] text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white border border-slate-200 dark:border-[#143564] transition-colors cursor-pointer"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>

            {/* Direct Link (Desktop/Tablet) */}
            <a
              href={pdfStreamUrl}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex p-2 rounded-xl bg-white dark:bg-[#0a1c36] text-slate-500 hover:text-blue-500 dark:text-slate-400 dark:hover:text-blue-400 border border-slate-200 dark:border-[#143564] transition-colors cursor-pointer"
              title="Open Raw PDF in New Tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            {/* Download */}
            <button
              type="button"
              onClick={handleDownload}
              className="p-2 rounded-xl bg-white dark:bg-[#0a1c36] text-slate-500 hover:text-emerald-500 dark:text-slate-400 dark:hover:text-emerald-400 border border-slate-200 dark:border-[#143564] transition-colors cursor-pointer"
              title="Download PDF Document"
            >
              <Download className="w-3.5 h-3.5" />
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white dark:bg-[#0a1c36] text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-rose-50 dark:hover:bg-rose-500/10 border border-slate-200 dark:border-[#143564] transition-colors cursor-pointer ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Reader Workspace with Collapsible TOC */}
        <div className="flex-1 flex overflow-hidden bg-slate-100 dark:bg-[#061120]">
          {/* Collapsible Sidebar */}
          {showSidebar && (
            <div className="hidden md:flex w-80 border-r border-slate-200 dark:border-[#143564] bg-white dark:bg-[#0a1c36] flex-col shrink-0 overflow-hidden">
              {/* Sidebar Tabs */}
              <div className="flex border-b border-slate-200 dark:border-[#143564] bg-slate-50 dark:bg-[#061120]">
                <button
                  type="button"
                  onClick={() => setActiveSidebarTab('toc')}
                  className={`flex-1 py-2.5 px-3 text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
                    activeSidebarTab === 'toc'
                      ? 'border-[#c19b48] text-[#c19b48] dark:text-[#f3d999]'
                      : 'border-transparent text-slate-500 dark:text-slate-400'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Sections ({note.sectionBreakdown?.length || 0})</span>
                </button>
                {note.relatedJudgements && note.relatedJudgements.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveSidebarTab('cases')}
                    className={`flex-1 py-2.5 px-3 text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
                      activeSidebarTab === 'cases'
                        ? 'border-[#c19b48] text-[#c19b48] dark:text-[#f3d999]'
                        : 'border-transparent text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    <Gavel className="w-3.5 h-3.5" />
                    <span>Cases ({note.relatedJudgements.length})</span>
                  </button>
                )}
              </div>

              {/* Sidebar Content */}
              <div className="p-3 space-y-2 overflow-y-auto flex-1">
                {/* TOC List */}
                {activeSidebarTab === 'toc' && (
                  <>
                    {note.sectionBreakdown && note.sectionBreakdown.length > 0 ? (
                      note.sectionBreakdown.map((sec, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] hover:border-[#c19b48]/60 transition-colors space-y-1 group"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-[#c19b48] dark:text-[#f3d999]">
                              {sec.sectionNumber}
                            </span>
                            {sec.pageNumber && (
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-200 dark:bg-[#143564] text-slate-600 dark:text-slate-300">
                                p. {sec.pageNumber}
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-medium text-slate-800 dark:text-white leading-snug">
                            {sec.heading}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 italic leading-relaxed">
                            {sec.keyTakeaway}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 text-center py-6">
                        No individual section breakdown available for this note.
                      </p>
                    )}
                  </>
                )}

                {/* Precedents Cross-links */}
                {activeSidebarTab === 'cases' && note.relatedJudgements && (
                  <div className="space-y-2">
                    {note.relatedJudgements.map((caseItem, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] space-y-1"
                      >
                        <span className="text-[10px] font-bold text-[#c19b48] uppercase">
                          {caseItem.court} ({caseItem.year})
                        </span>
                        <h5 className="font-serif font-bold text-xs text-slate-800 dark:text-white leading-snug">
                          {caseItem.title}
                        </h5>
                        <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                          {caseItem.citation}
                        </p>
                        {caseItem.summary && (
                          <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 pt-1">
                            {caseItem.summary}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Iframe Document Canvas */}
          <div className="flex-1 h-full overflow-auto p-2 sm:p-4 flex items-center justify-center">
            <iframe
              src={pdfStreamUrl}
              title={note.title}
              className="w-full h-full rounded-xl border border-slate-300 dark:border-[#143564] bg-white transition-transform duration-150 shadow-inner"
              style={{
                transform: `scale(${zoom / 100})`,
                transformOrigin: 'top center',
              }}
            />
          </div>
        </div>
      </div>

      {/* Mobile Sections TOC BottomSheet (< 768px) */}
      <BottomSheet
        isOpen={isMobileTocOpen}
        onClose={() => setIsMobileTocOpen(false)}
        title="Sections TOC & Case Laws"
        subtitle={`${note.actName} • ${note.sectionsCovered}`}
      >
        <div className="space-y-3 pb-4">
          <div className="flex border-b border-slate-200 dark:border-[#143564]">
            <button
              type="button"
              onClick={() => setActiveSidebarTab('toc')}
              className={`flex-1 py-2 px-3 text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
                activeSidebarTab === 'toc'
                  ? 'border-[#c19b48] text-[#c19b48] dark:text-[#f3d999]'
                  : 'border-transparent text-slate-500 dark:text-slate-400'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Sections ({note.sectionBreakdown?.length || 0})</span>
            </button>
            {note.relatedJudgements && note.relatedJudgements.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveSidebarTab('cases')}
                className={`flex-1 py-2 px-3 text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
                  activeSidebarTab === 'cases'
                    ? 'border-[#c19b48] text-[#c19b48] dark:text-[#f3d999]'
                    : 'border-transparent text-slate-500 dark:text-slate-400'
                }`}
              >
                <Gavel className="w-3.5 h-3.5" />
                <span>Cases ({note.relatedJudgements.length})</span>
              </button>
            )}
          </div>

          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {activeSidebarTab === 'toc' && (
              <>
                {note.sectionBreakdown && note.sectionBreakdown.length > 0 ? (
                  note.sectionBreakdown.map((sec, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-[#c19b48] dark:text-[#f3d999]">
                          {sec.sectionNumber}
                        </span>
                        {sec.pageNumber && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-200 dark:bg-[#143564] text-slate-600 dark:text-slate-300">
                            p. {sec.pageNumber}
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-medium text-slate-800 dark:text-white leading-snug">
                        {sec.heading}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 italic leading-relaxed">
                        {sec.keyTakeaway}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 text-center py-6">
                    No individual section breakdown available for this note.
                  </p>
                )}
              </>
            )}

            {activeSidebarTab === 'cases' && note.relatedJudgements && (
              <div className="space-y-2">
                {note.relatedJudgements.map((caseItem, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] space-y-1"
                  >
                    <span className="text-[10px] font-bold text-[#c19b48] uppercase">
                      {caseItem.court} ({caseItem.year})
                    </span>
                    <h5 className="font-serif font-bold text-xs text-slate-800 dark:text-white leading-snug">
                      {caseItem.title}
                    </h5>
                    <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                      {caseItem.citation}
                    </p>
                    {caseItem.summary && (
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 pt-1">
                        {caseItem.summary}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </BottomSheet>
    </div>
  );
};

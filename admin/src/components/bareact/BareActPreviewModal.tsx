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
} from 'lucide-react';
import type { BareActNote } from '../../types/bareAct.types';
import { getNoteDirectStreamUrl, downloadNotePdf } from '../../services/bareAct.service';
import { toast } from 'react-hot-toast';

interface BareActPreviewModalProps {
  note: BareActNote | null;
  isOpen: boolean;
  onClose: () => void;
}

export const BareActPreviewModal: React.FC<BareActPreviewModalProps> = ({
  note,
  isOpen,
  onClose,
}) => {
  const [zoom, setZoom] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showToc, setShowToc] = useState(true);

  if (!isOpen || !note) return null;

  const pdfStreamUrl = getNoteDirectStreamUrl(note._id);

  const handleDownload = async () => {
    try {
      toast.loading('Downloading Statutory PDF...', { id: 'preview-download' });
      await downloadNotePdf(
        note._id,
        note.pdfFile?.originalName || `${note.actName}_Decoding.pdf`
      );
      toast.success('Downloaded successfully!', { id: 'preview-download' });
    } catch {
      toast.error('Failed to download PDF.', { id: 'preview-download' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className={`w-full rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] shadow-2xl overflow-hidden flex flex-col transition-all ${
          isFullscreen ? 'fixed inset-2 z-50 max-w-none h-[calc(100vh-1rem)]' : 'max-w-6xl h-[88vh]'
        }`}
      >
        {/* Top Navbar */}
        <div className="px-5 py-3.5 border-b border-[#3D3D3D] bg-[#262626]/80 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-[#C19B48]/15 text-[#C19B48] border border-[#C19B48]/30 shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="font-serif font-bold text-sm text-[#F7F3E6] truncate">
                {note.title}
              </h3>
              <p className="text-[11px] text-[#A8A294] truncate">
                {note.actName} • {note.sectionsCovered} • {note.pdfFile?.sizeFormatted}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* TOC toggle */}
            {note.sectionBreakdown && note.sectionBreakdown.length > 0 && (
              <button
                type="button"
                onClick={() => setShowToc(!showToc)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                  showToc
                    ? 'bg-[#C19B48]/20 border-[#C19B48]/40 text-[#C19B48]'
                    : 'bg-[#262626] border-[#3D3D3D] text-[#A8A294] hover:text-[#F7F3E6]'
                }`}
              >
                <span>TOC Index ({note.sectionBreakdown.length})</span>
              </button>
            )}

            {/* Zoom Controls */}
            <div className="hidden sm:flex items-center gap-1 bg-[#1E1E1E] p-1 rounded-xl border border-[#3D3D3D]">
              <button
                type="button"
                disabled={zoom <= 60}
                onClick={() => setZoom((z) => Math.max(60, z - 15))}
                className="p-1 rounded text-[#A8A294] hover:text-[#F7F3E6] disabled:opacity-40 cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] font-mono text-[#F7F3E6] w-10 text-center">
                {zoom}%
              </span>
              <button
                type="button"
                disabled={zoom >= 160}
                onClick={() => setZoom((z) => Math.min(160, z + 15))}
                className="p-1 rounded text-[#A8A294] hover:text-[#F7F3E6] disabled:opacity-40 cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Fullscreen toggle */}
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-xl bg-[#1E1E1E] text-[#A8A294] hover:text-[#F7F3E6] border border-[#3D3D3D] transition-colors cursor-pointer"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>

            {/* Direct Link */}
            <a
              href={pdfStreamUrl}
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-xl bg-[#1E1E1E] text-[#A8A294] hover:text-[#60A5FA] border border-[#3D3D3D] transition-colors cursor-pointer"
              title="Open in Browser Native Tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            {/* Download */}
            <button
              type="button"
              onClick={handleDownload}
              className="p-2 rounded-xl bg-[#1E1E1E] text-[#A8A294] hover:text-emerald-400 border border-[#3D3D3D] transition-colors cursor-pointer"
              title="Download PDF Document"
            >
              <Download className="w-3.5 h-3.5" />
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-[#1E1E1E] text-[#A8A294] hover:text-[#F7F3E6] hover:bg-rose-500/20 hover:border-rose-500/30 border border-[#3D3D3D] transition-colors cursor-pointer ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Area with optional TOC Sidebar */}
        <div className="flex-1 flex overflow-hidden bg-[#121212]">
          {/* Collapsible TOC Sidebar */}
          {showToc && note.sectionBreakdown && note.sectionBreakdown.length > 0 && (
            <div className="w-72 border-r border-[#3D3D3D] bg-[#1E1E1E] flex flex-col shrink-0 overflow-hidden">
              <div className="p-3.5 border-b border-[#3D3D3D] flex items-center justify-between">
                <span className="text-xs font-bold text-[#F7F3E6] uppercase tracking-wider text-[10px]">
                  Section Breakdown Index
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#262626] text-[#C19B48]">
                  {note.sectionBreakdown.length} Sections
                </span>
              </div>
              <div className="p-3 space-y-2 overflow-y-auto flex-1">
                {note.sectionBreakdown.map((sec, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-[#262626] border border-[#3D3D3D] hover:border-[#C19B48]/50 transition-colors space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#C19B48]">{sec.sectionNumber}</span>
                      <span className="text-[10px] font-mono text-[#A8A294]">p. {sec.pageNumber}</span>
                    </div>
                    <p className="text-[11px] font-medium text-[#F7F3E6] leading-snug">{sec.heading}</p>
                    <p className="text-[10px] text-[#A8A294] italic leading-relaxed">{sec.keyTakeaway}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Iframe Document Canvas */}
          <div className="flex-1 h-full overflow-auto bg-[#262626] flex items-center justify-center p-2">
            <iframe
              src={pdfStreamUrl}
              title={note.title}
              className="w-full h-full rounded-xl border border-[#3D3D3D] bg-white transition-transform duration-150"
              style={{
                transform: `scale(${zoom / 100})`,
                transformOrigin: 'top center',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

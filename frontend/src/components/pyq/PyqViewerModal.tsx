import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Download,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  FileText,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import type { PyqPaper } from '../../types/pyq.types';
import { fetchPdfBlob, getDirectStreamUrl, downloadPyqPdf } from '../../services/pyq.service';
import { toast } from 'sonner';

interface PyqViewerModalProps {
  paper: PyqPaper | null;
  isOpen: boolean;
  onClose: () => void;
  onDownloaded?: (paperId: string) => void;
}

export const PyqViewerModal: React.FC<PyqViewerModalProps> = ({
  paper,
  isOpen,
  onClose,
  onDownloaded,
}) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !paper) {
      if (blobUrl) {
        window.URL.revokeObjectURL(blobUrl);
        setBlobUrl(null);
      }
      setLoading(true);
      setError(null);
      setZoomLevel(100);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    // Fetch PDF blob with Authorization header
    fetchPdfBlob(paper._id)
      .then((blob) => {
        if (!isMounted) return;
        const url = window.URL.createObjectURL(blob);
        setBlobUrl(url);
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Failed to load PDF preview:', err);
        // Fallback to direct streaming URL
        const fallbackUrl = getDirectStreamUrl(paper._id);
        setBlobUrl(fallbackUrl);
        setLoading(false);
      });

    return () => {
      isMounted = false;
      if (blobUrl && blobUrl.startsWith('blob:')) {
        window.URL.revokeObjectURL(blobUrl);
      }
    };
  }, [isOpen, paper]);

  // Keyboard shortcut: ESC to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !paper) return null;

  const handleDownload = async () => {
    try {
      setDownloading(true);
      await downloadPyqPdf(paper._id, paper.pdfFile.originalName);
      toast.success(`Downloaded ${paper.pdfFile.originalName}`);
      onDownloaded?.(paper._id);
    } catch (err: any) {
      toast.error('Failed to download PDF.');
    } finally {
      setDownloading(false);
    }
  };

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 25, 75));
  const handleZoomReset = () => setZoomLevel(100);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const directStreamUrl = getDirectStreamUrl(paper._id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4 animate-in fade-in duration-200">
      <div
        ref={containerRef}
        className="w-full h-full max-w-6xl max-h-[95vh] rounded-2xl bg-[#061120] border border-[#143564] shadow-2xl flex flex-col overflow-hidden text-slate-200"
      >
        {/* Modal Top Bar */}
        <div className="px-4 py-3 sm:px-6 bg-[#0a1c36] border-b border-[#143564] flex items-center justify-between gap-3 shrink-0">
          {/* Left: Document Info */}
          <div className="min-w-0 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#c19b48]/15 border border-[#c19b48]/30 flex items-center justify-center text-[#c19b48] shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-[#143564] text-[#e8cf8d] px-2 py-0.5 rounded">
                  {paper.exam}
                </span>
                <span className="text-xs font-mono font-semibold text-slate-300">
                  {paper.year} • {paper.stage}
                </span>
              </div>
              <h2 className="text-xs sm:text-sm font-serif font-bold text-white truncate max-w-md sm:max-w-xl">
                {paper.title}
              </h2>
            </div>
          </div>

          {/* Right: Controls & Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Zoom Controls (hidden on small mobile) */}
            <div className="hidden md:flex items-center bg-[#061120] border border-[#143564] rounded-xl p-0.5">
              <button
                onClick={handleZoomOut}
                title="Zoom Out"
                disabled={zoomLevel <= 75}
                className="p-1.5 text-slate-400 hover:text-white disabled:opacity-40 rounded-lg cursor-pointer"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleZoomReset}
                title="Reset Zoom"
                className="px-2 py-1 text-[11px] font-mono text-slate-300 hover:text-[#c19b48] cursor-pointer"
              >
                {zoomLevel}%
              </button>
              <button
                onClick={handleZoomIn}
                title="Zoom In"
                disabled={zoomLevel >= 200}
                className="p-1.5 text-slate-400 hover:text-white disabled:opacity-40 rounded-lg cursor-pointer"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Open in New Tab button */}
            <a
              href={directStreamUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Open raw PDF in new browser tab"
              className="p-2 rounded-xl bg-[#061120] hover:bg-[#143564] text-slate-300 hover:text-white border border-[#143564] transition-colors cursor-pointer hidden sm:flex items-center gap-1.5 text-xs"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden lg:inline text-[11px]">New Tab</span>
            </a>

            {/* Fullscreen button */}
            <button
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              className="p-2 rounded-xl bg-[#061120] hover:bg-[#143564] text-slate-300 hover:text-white border border-[#143564] transition-colors cursor-pointer hidden sm:block"
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>

            {/* Download Button */}
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="px-3.5 py-1.5 rounded-xl bg-[#c19b48] hover:bg-[#d8b862] text-[#061120] font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
            >
              {downloading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">Download</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Viewport Area */}
        <div className="relative flex-1 bg-[#061120] overflow-auto flex items-center justify-center">
          {loading && (
            <div className="flex flex-col items-center justify-center gap-3 p-8">
              <Loader2 className="w-8 h-8 text-[#c19b48] animate-spin" />
              <p className="text-xs text-slate-400 font-medium animate-pulse">
                Streaming model answer paper from faculty chamber...
              </p>
            </div>
          )}

          {error && (
            <div className="p-8 text-center space-y-3">
              <p className="text-sm text-rose-400">{error}</p>
              <button
                onClick={() => window.open(directStreamUrl, '_blank')}
                className="px-4 py-2 rounded-xl bg-[#c19b48] text-[#061120] text-xs font-bold"
              >
                Open in External Viewer
              </button>
            </div>
          )}

          {!loading && !error && blobUrl && (
            <div
              className="w-full h-full transition-transform origin-top flex items-center justify-center"
              style={{
                transform: `scale(${zoomLevel / 100})`,
                transformOrigin: 'top center',
              }}
            >
              <iframe
                src={`${blobUrl}#toolbar=1&navpanes=0&scrollbar=1`}
                title={paper.title}
                className="w-full h-full border-0 rounded-b-2xl bg-white"
              />
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="px-4 py-2 bg-[#0a1c36] border-t border-[#143564] flex items-center justify-between text-[11px] text-slate-400 shrink-0">
          <span>Official Solved Paper • Rajinder Law Academy</span>
          <span className="font-mono">
            {paper.pdfFile.sizeFormatted} • Solved by {paper.solvedByFaculty}
          </span>
        </div>
      </div>
    </div>
  );
};

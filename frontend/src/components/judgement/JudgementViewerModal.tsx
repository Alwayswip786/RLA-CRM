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
  Scale,
  Award,
} from 'lucide-react';
import type { JudgementDigest } from '../../types/judgement.types';
import {
  fetchJudgementPdfBlob,
  getJudgementDirectStreamUrl,
  downloadJudgementPdf,
} from '../../services/judgement.service';
import { toast } from 'sonner';

interface JudgementViewerModalProps {
  judgement: JudgementDigest | null;
  isOpen: boolean;
  onClose: () => void;
  onDownloaded?: (id: string) => void;
}

export const JudgementViewerModal: React.FC<JudgementViewerModalProps> = ({
  judgement,
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
  const [showNotesDrawer, setShowNotesDrawer] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !judgement) {
      if (blobUrl) {
        window.URL.revokeObjectURL(blobUrl);
        setBlobUrl(null);
      }
      setLoading(true);
      setError(null);
      setZoomLevel(100);
      setShowNotesDrawer(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    // Fetch PDF blob with Authorization header
    fetchJudgementPdfBlob(judgement._id)
      .then((blob) => {
        if (!isMounted) return;
        const url = window.URL.createObjectURL(blob);
        setBlobUrl(url);
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Failed to load Judgement PDF preview:', err);
        // Fallback to direct streaming URL
        const fallbackUrl = getJudgementDirectStreamUrl(judgement._id);
        setBlobUrl(fallbackUrl);
        setLoading(false);
      });

    return () => {
      isMounted = false;
      if (blobUrl && blobUrl.startsWith('blob:')) {
        window.URL.revokeObjectURL(blobUrl);
      }
    };
  }, [isOpen, judgement]);

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

  if (!isOpen || !judgement) return null;

  const handleDownload = async () => {
    try {
      setDownloading(true);
      await downloadJudgementPdf(judgement._id, judgement.pdfFile.originalName);
      toast.success(`Downloaded ${judgement.pdfFile.originalName}`);
      onDownloaded?.(judgement._id);
    } catch (err: any) {
      toast.error('Failed to download PDF.');
    } finally {
      setDownloading(false);
    }
  };

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 20, 200));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 20, 60));
  const handleResetZoom = () => setZoomLevel(100);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const openInNewTab = () => {
    const directUrl = getJudgementDirectStreamUrl(judgement._id);
    window.open(directUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-2 sm:p-4">
      <div
        ref={containerRef}
        className="flex flex-col w-full h-full max-w-6xl bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden"
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-900/95 border-b border-slate-700/80 gap-3">
          {/* Case Law Title & Metadata */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-amber-500/10 text-[#c19b48] border border-[#c19b48]/30 shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-serif font-bold text-white truncate">
                {judgement.title}
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="font-mono text-[#c19b48]">{judgement.citation}</span>
                <span>•</span>
                <span className="truncate">{judgement.court}</span>
                <span>•</span>
                <span>{judgement.bench}</span>
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Toggle Ratio / Headnote Drawer */}
            <button
              onClick={() => setShowNotesDrawer(!showNotesDrawer)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer hidden md:flex items-center gap-1.5 ${
                showNotesDrawer
                  ? 'bg-[#c19b48] text-[#061120] border-[#c19b48]'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>{showNotesDrawer ? 'Hide Notes' : 'Exam Notes'}</span>
            </button>

            {/* Zoom Controls */}
            <div className="hidden sm:flex items-center gap-1 bg-slate-800 rounded-lg p-1 border border-slate-700">
              <button
                onClick={handleZoomOut}
                disabled={zoomLevel <= 60}
                className="p-1 rounded hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={handleResetZoom}
                className="px-1.5 py-0.5 text-xs font-mono text-slate-300 hover:text-white"
                title="Reset Zoom"
              >
                {zoomLevel}%
              </button>
              <button
                onClick={handleZoomIn}
                disabled={zoomLevel >= 200}
                className="p-1 rounded hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            {/* Pop-out New Tab */}
            <button
              onClick={openInNewTab}
              className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700 transition-colors"
              title="Open in new window"
            >
              <ExternalLink className="w-4 h-4" />
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700 transition-colors hidden sm:block"
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Download Button */}
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#c19b48] hover:bg-[#d4ae58] text-[#061120] font-semibold text-xs transition-colors shadow-xs disabled:opacity-50"
            >
              {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{downloading ? 'Saving...' : 'Download'}</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-red-500/20 hover:border-red-500/40 border border-slate-700 transition-colors"
              title="Close modal (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Viewer Main Body */}
        <div className="relative flex-1 bg-slate-950 overflow-hidden flex">
          {/* Main PDF Frame */}
          <div className="flex-1 relative flex items-center justify-center overflow-auto p-2">
            {loading && (
              <div className="flex flex-col items-center justify-center gap-3 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-[#c19b48]" />
                <p className="text-sm font-medium">Streaming Judgement Digest PDF...</p>
              </div>
            )}

            {error && (
              <div className="flex flex-col items-center justify-center gap-3 text-red-400 p-6 text-center max-w-md">
                <FileText className="w-10 h-10 text-red-400" />
                <p className="text-sm font-semibold">{error}</p>
                <button
                  onClick={openInNewTab}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700"
                >
                  Open in New Tab
                </button>
              </div>
            )}

            {blobUrl && !loading && (
              <div
                className="w-full h-full flex justify-center transition-all duration-200"
                style={{
                  transform: `scale(${zoomLevel / 100})`,
                  transformOrigin: 'top center',
                }}
              >
                <iframe
                  src={`${blobUrl}#toolbar=0&navpanes=0&scrollbar=1`}
                  title={judgement.title}
                  className="w-full h-full rounded-lg border-0 shadow-lg bg-white"
                />
              </div>
            )}
          </div>

          {/* Exam Notes & Ratio Side Drawer */}
          {showNotesDrawer && (
            <div className="w-80 border-l border-slate-800 bg-slate-900/95 p-4 overflow-y-auto space-y-4 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#c19b48]">
                  Mains 3-Point Ratio
                </span>
                <ul className="mt-2 space-y-2.5">
                  {judgement.ratioDecidendi?.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-slate-300">
                      <span className="font-mono text-[#c19b48] font-bold">[{idx + 1}]</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {judgement.mainsUtility && (
                <div className="pt-3 border-t border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                    Mains Exam Utility
                  </span>
                  <p className="mt-1 text-slate-300 leading-relaxed">{judgement.mainsUtility}</p>
                </div>
              )}

              {judgement.overruledPrecedents && (
                <div className="pt-3 border-t border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-red-400">
                    Overruled Precedents
                  </span>
                  <p className="mt-1 text-slate-300 leading-relaxed">{judgement.overruledPrecedents}</p>
                </div>
              )}

              <div className="pt-3 border-t border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Judges on Coram
                </span>
                <p className="mt-1 text-slate-400 leading-relaxed">
                  {judgement.judges && judgement.judges.length > 0
                    ? judgement.judges.join(', ')
                    : 'Coram information available in full text.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

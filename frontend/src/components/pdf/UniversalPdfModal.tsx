import React, { useState, useEffect, useRef } from 'react';
import { UniversalPdfViewer } from './UniversalPdfViewer';
import { PdfViewerToolbar } from './PdfViewerToolbar';
import { BottomSheet } from '../ui/BottomSheet';
import { useIsDesktop } from '../../hooks/use-responsive';

export interface UniversalPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  source?: string | Blob | null;
  url?: string | Blob | null;
  title: string;
  subtitle?: string;
  badgeText?: string;
  onDownload?: () => void;
  downloading?: boolean;
  downloadFileName?: string;
  /**
   * Optional side-drawer content (Desktop split drawer + Mobile BottomSheet)
   * e.g. Mains Exam Notes, Ratio Decidendi, Bare Act Sections TOC
   */
  drawerTitle?: string;
  drawerContent?: React.ReactNode;
}

export const UniversalPdfModal: React.FC<UniversalPdfModalProps> = ({
  isOpen,
  onClose,
  source,
  url,
  title,
  subtitle,
  badgeText,
  onDownload,
  downloading = false,
  downloadFileName,
  drawerTitle = 'Document Notes',
  drawerContent,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDesktop = useIsDesktop(768);

  const activeSource = source || url;

  const [zoom, setZoom] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [targetPage, setTargetPage] = useState<number | undefined>(undefined);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  // Reset state on open/close
  useEffect(() => {
    if (!isOpen) {
      setZoom(1.0);
      setRotation(0);
      setCurrentPage(1);
      setTotalPages(1);
      setTargetPage(undefined);
      setIsDrawerOpen(false);
    }
  }, [isOpen]);

  // Keyboard shortcut listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isFullscreen) {
          document.exitFullscreen().catch(() => {});
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isFullscreen, onClose]);

  // Fullscreen toggle handler
  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const handleEffectiveDownload = onDownload
    ? onDownload
    : downloadFileName && activeSource
    ? () => {
        if (typeof activeSource === 'string') {
          const link = document.createElement('a');
          link.href = activeSource;
          link.download = downloadFileName;
          link.target = '_blank';
          document.body.appendChild(link);
          link.click();
          link.remove();
        } else if (activeSource instanceof Blob) {
          const blobUrl = window.URL.createObjectURL(activeSource);
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = downloadFileName;
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.URL.revokeObjectURL(blobUrl);
        }
      }
    : undefined;

  if (!isOpen || !activeSource) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs select-none p-0 md:p-4 animate-in fade-in duration-150"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="relative flex flex-col w-full h-[100dvh] md:h-[95vh] md:max-w-6xl lg:max-w-7xl bg-slate-900 md:rounded-2xl border-0 md:border md:border-slate-800 shadow-2xl overflow-hidden">
        {/* Responsive Toolbar */}
        <PdfViewerToolbar
          title={title}
          subtitle={subtitle}
          badgeText={badgeText}
          currentPage={currentPage}
          totalPages={totalPages}
          zoom={zoom}
          rotation={rotation}
          isFullscreen={isFullscreen}
          hasDrawer={Boolean(drawerContent)}
          drawerOpen={isDrawerOpen}
          drawerLabel={drawerTitle}
          onZoomIn={() => setZoom((prev) => Math.min(prev + 0.2, 2.5))}
          onZoomOut={() => setZoom((prev) => Math.max(prev - 0.2, 0.75))}
          onResetZoom={() => setZoom(1.0)}
          onRotate={() => setRotation((prev) => (prev + 90) % 360)}
          onToggleFullscreen={handleToggleFullscreen}
          onToggleDrawer={() => setIsDrawerOpen((prev) => !prev)}
          onDownload={handleEffectiveDownload}
          downloading={downloading}
          onClose={onClose}
          onPageJump={(p) => setTargetPage(p)}
        />

        {/* Main Document & Side Drawer Split */}
        <div className="relative flex-1 w-full h-full flex overflow-hidden bg-slate-950">
          {/* Universal PDF Canvas Engine */}
          <UniversalPdfViewer
            source={activeSource}
            title={title}
            zoom={zoom}
            rotation={rotation}
            targetPage={targetPage}
            onPageChange={(curr, total) => {
              setCurrentPage(curr);
              setTotalPages(total);
            }}
            onLoadSuccess={(total) => setTotalPages(total)}
            className="flex-1 w-full h-full"
          />

          {/* Desktop Auxiliary Notes / TOC Side Drawer */}
          {isDesktop && drawerContent && isDrawerOpen && (
            <aside className="w-80 lg:w-96 h-full border-l border-slate-800 bg-slate-900/95 overflow-y-auto p-4 space-y-4 text-xs animate-in slide-in-from-right duration-200">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h3 className="font-serif font-bold text-white text-sm tracking-wide">
                  {drawerTitle}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-800"
                >
                  Hide
                </button>
              </div>
              <div>{drawerContent}</div>
            </aside>
          )}
        </div>
      </div>

      {/* Mobile Auxiliary BottomSheet (< 768px) */}
      {!isDesktop && drawerContent && (
        <BottomSheet
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          title={drawerTitle}
          subtitle={title}
        >
          <div className="space-y-4 pb-6 max-h-[70vh] overflow-y-auto text-xs text-slate-300">
            {drawerContent}
          </div>
        </BottomSheet>
      )}
    </div>
  );
};

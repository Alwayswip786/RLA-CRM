import React, { useState } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Minimize2,
  Download,
  X,
  ChevronLeft,
  ChevronRight,
  Layers,
} from 'lucide-react';

export interface PdfViewerToolbarProps {
  title: string;
  subtitle?: string;
  badgeText?: string;
  currentPage: number;
  totalPages: number;
  zoom: number;
  rotation: number;
  isFullscreen: boolean;
  drawerOpen?: boolean;
  drawerLabel?: string;
  hasDrawer?: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onRotate: () => void;
  onToggleFullscreen: () => void;
  onToggleDrawer?: () => void;
  onDownload?: () => void;
  onClose: () => void;
  onPageJump?: (page: number) => void;
  downloading?: boolean;
}

export const PdfViewerToolbar: React.FC<PdfViewerToolbarProps> = ({
  title,
  subtitle,
  badgeText,
  currentPage,
  totalPages,
  zoom,
  rotation,
  isFullscreen,
  drawerOpen = false,
  drawerLabel = 'Notes & TOC',
  hasDrawer = false,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onRotate,
  onToggleFullscreen,
  onToggleDrawer,
  onDownload,
  onClose,
  onPageJump,
  downloading = false,
}) => {
  const [pageInput, setPageInput] = useState<string>('');
  const [isEditingPage, setIsEditingPage] = useState<boolean>(false);

  const handlePageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(pageInput, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= totalPages) {
      onPageJump?.(parsed);
    }
    setIsEditingPage(false);
    setPageInput('');
  };

  return (
    <header className="relative z-30 flex items-center justify-between px-3 sm:px-5 py-2.5 bg-slate-900 border-b border-slate-800 text-slate-100 shrink-0 gap-2 min-h-[52px] select-none">
      {/* Left: Document Title & Badge */}
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        {badgeText && (
          <span className="hidden sm:inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase bg-[#C19B48]/20 border border-[#C19B48]/40 text-[#E2BC5C] shrink-0">
            {badgeText}
          </span>
        )}
        <div className="min-w-0">
          <h2 className="text-xs sm:text-sm font-serif font-bold text-white truncate max-w-[200px] sm:max-w-md lg:max-w-xl" title={title}>
            {title}
          </h2>
          {subtitle && (
            <p className="text-[10px] text-slate-400 truncate hidden sm:block">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Center / Right: Paging, Zoom, Fullscreen, Download, Drawer & Close */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        {/* Page Navigation Controls */}
        {totalPages > 0 && (
          <div className="flex items-center gap-0.5 bg-slate-800/80 rounded-lg p-0.5 border border-slate-700/80 text-xs">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => onPageJump?.(Math.max(1, currentPage - 1))}
              className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              title="Previous Page"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            {isEditingPage ? (
              <form onSubmit={handlePageSubmit} className="inline-flex">
                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  autoFocus
                  value={pageInput}
                  onChange={(e) => setPageInput(e.target.value)}
                  onBlur={() => setIsEditingPage(false)}
                  className="w-8 px-1 py-0.5 text-center text-[11px] font-mono bg-slate-900 border border-[#C19B48] rounded text-white outline-none"
                />
              </form>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setPageInput(String(currentPage));
                  setIsEditingPage(true);
                }}
                className="px-1.5 py-0.5 font-mono text-[11px] text-slate-300 hover:text-white hover:bg-slate-700/50 rounded transition-colors whitespace-nowrap"
                title="Click to jump to page"
              >
                <span>{currentPage}</span>
                <span className="text-slate-500 mx-0.5">/</span>
                <span>{totalPages}</span>
              </button>
            )}

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => onPageJump?.(Math.min(totalPages, currentPage + 1))}
              className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              title="Next Page"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Zoom Controls (hidden on small mobile, accessible via pinch-to-zoom) */}
        <div className="hidden md:flex items-center gap-0.5 bg-slate-800/80 rounded-lg p-0.5 border border-slate-700/80 text-xs">
          <button
            type="button"
            onClick={onZoomOut}
            disabled={zoom <= 0.75}
            className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-30 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onResetZoom}
            className="px-1.5 py-0.5 font-mono text-[11px] text-slate-300 hover:text-white hover:bg-slate-700/50 rounded transition-colors"
            title="Reset to Fit Width"
          >
            {Math.round(zoom * 100)}%
          </button>

          <button
            type="button"
            onClick={onZoomIn}
            disabled={zoom >= 2.5}
            className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-30 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Rotate Button (Desktop & Tablet) */}
        <button
          type="button"
          onClick={onRotate}
          className="hidden sm:flex p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 transition-colors"
          title={`Rotate Document (Current: ${rotation}°)`}
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>

        {/* Fullscreen Toggle (Desktop/Tablet) */}
        <button
          type="button"
          onClick={onToggleFullscreen}
          className="hidden sm:flex p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 transition-colors"
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
        >
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>

        {/* Side Drawer Toggle (e.g. Notes or Table of Contents) */}
        {hasDrawer && onToggleDrawer && (
          <button
            type="button"
            onClick={onToggleDrawer}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border ${
              drawerOpen
                ? 'bg-[#C19B48] text-[#061120] border-[#C19B48]'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
            title={drawerLabel}
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{drawerLabel}</span>
          </button>
        )}

        {/* Download Button */}
        {onDownload && (
          <button
            type="button"
            onClick={onDownload}
            disabled={downloading}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-[#C19B48] to-[#9E7C2B] text-white hover:brightness-105 active:scale-[0.98] text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
            title="Download PDF Document"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{downloading ? 'Saving...' : 'Download'}</span>
          </button>
        )}

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 hover:text-red-400 text-slate-400 border border-slate-700 transition-colors cursor-pointer"
          title="Close Viewer (Esc)"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

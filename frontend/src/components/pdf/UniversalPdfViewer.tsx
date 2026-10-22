import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
import { pdfjsLib } from '../../lib/pdfjs';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';

export interface UniversalPdfViewerProps {
  /**
   * PDF source: can be a direct streaming URL, blob URL, or Blob instance
   */
  source: string | Blob;
  /**
   * Document title for accessibility and tooltips
   */
  title?: string;
  /**
   * Active zoom multiplier (1.0 = 100% Fit Width)
   */
  zoom?: number;
  /**
   * Rotation in degrees (0, 90, 180, 270)
   */
  rotation?: number;
  /**
   * Target page to scroll to (1-indexed)
   */
  targetPage?: number;
  /**
   * Callback on page change as user scrolls
   */
  onPageChange?: (currentPage: number, totalPages: number) => void;
  /**
   * Callback when document is successfully loaded
   */
  onLoadSuccess?: (totalPages: number) => void;
  /**
   * Callback on loading error
   */
  onLoadError?: (error: Error) => void;
  /**
   * Custom CSS classes for the outer container
   */
  className?: string;
  /**
   * Render custom toolbar or controls above the canvas
   */
  headerControls?: React.ReactNode;
  /**
   * Render custom bottom bar or floating pill
   */
  floatingControls?: React.ReactNode;
}

interface PageMeta {
  pageNumber: number;
  width: number;
  height: number;
  aspectRatio: number; // width / height
}

export const UniversalPdfViewer: React.FC<UniversalPdfViewerProps> = ({
  source,
  title = 'Document Preview',
  zoom = 1.0,
  rotation = 0,
  targetPage,
  onPageChange,
  onLoadSuccess,
  onLoadError,
  className = '',
  headerControls,
  floatingControls,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [pagesMeta, setPagesMeta] = useState<PageMeta[]>([]);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [, setCurrentPage] = useState<number>(1);
  const [visiblePages, setVisiblePages] = useState<Set<number>>(new Set([1]));

  // Pinch-to-zoom local state
  const [touchScale, setTouchScale] = useState<number>(1.0);
  const touchStartDistRef = useRef<number | null>(null);
  const lastTapRef = useRef<number>(0);

  // 1. Observe Container Width for dynamic Fit-to-Width
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateWidth = () => {
      // Deduct minimal padding (16px on mobile, 32px on desktop)
      const isMobile = window.innerWidth < 768;
      const padding = isMobile ? 8 : 24;
      const availableWidth = Math.max(el.clientWidth - padding, 280);
      setContainerWidth(availableWidth);
    };

    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(el);

    window.addEventListener('resize', updateWidth);
    window.addEventListener('orientationchange', updateWidth);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateWidth);
      window.removeEventListener('orientationchange', updateWidth);
    };
  }, []);

  // 2. Load PDF Document via PDF.js
  const loadPdf = useCallback(async () => {
    if (!source) return;

    setLoading(true);
    setError(null);

    try {
      let loadingTask;

      if (source instanceof Blob) {
        const arrayBuffer = await source.arrayBuffer();
        loadingTask = pdfjsLib.getDocument({
          data: new Uint8Array(arrayBuffer),
          cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@6.3.289/cmaps/',
          cMapPacked: true,
        });
      } else if (typeof source === 'string') {
        loadingTask = pdfjsLib.getDocument({
          url: source,
          cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@6.3.289/cmaps/',
          cMapPacked: true,
          withCredentials: false,
        });
      } else {
        throw new Error('Unsupported PDF source type');
      }

      const doc = await loadingTask.promise;
      setPdfDoc(doc);

      // Pre-calculate page aspect ratios from page 1 and sample pages
      const numPages = doc.numPages;
      const metas: PageMeta[] = [];

      for (let i = 1; i <= Math.min(numPages, 5); i++) {
        const page = await doc.getPage(i);
        const vp = page.getViewport({ scale: 1.0 });
        metas.push({
          pageNumber: i,
          width: vp.width,
          height: vp.height,
          aspectRatio: vp.width / vp.height,
        });
      }

      // If document has more pages, extrapolate initial aspect ratio for rest to load instantly
      const defaultAspect = metas[0]?.aspectRatio || 0.707; // standard A4
      const defaultW = metas[0]?.width || 595;
      const defaultH = metas[0]?.height || 842;

      const fullMetas: PageMeta[] = Array.from({ length: numPages }, (_, idx) => {
        const pageNumber = idx + 1;
        const existing = metas.find((m) => m.pageNumber === pageNumber);
        return (
          existing || {
            pageNumber,
            width: defaultW,
            height: defaultH,
            aspectRatio: defaultAspect,
          }
        );
      });

      setPagesMeta(fullMetas);
      setLoading(false);
      onLoadSuccess?.(numPages);
    } catch (err: any) {
      console.error('Failed to load PDF with PDF.js:', err);
      setError(err?.message || 'Failed to load PDF document.');
      setLoading(false);
      onLoadError?.(err);
    }
  }, [source, onLoadSuccess, onLoadError]);

  useEffect(() => {
    loadPdf();
  }, [loadPdf]);

  // 3. Scroll to Target Page when requested
  useEffect(() => {
    if (!targetPage || !scrollContainerRef.current) return;
    const pageEl = scrollContainerRef.current.querySelector(
      `[data-page-number="${targetPage}"]`
    );
    if (pageEl) {
      pageEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [targetPage]);

  // 4. Track Active Visible Page via IntersectionObserver
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer || pagesMeta.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const pageNum = Number(entry.target.getAttribute('data-page-number'));
          if (!pageNum) return;

          if (entry.isIntersecting) {
            setVisiblePages((prev) => {
              const next = new Set(prev);
              next.add(pageNum);
              // Pre-buffer adjacent pages
              if (pageNum > 1) next.add(pageNum - 1);
              if (pageNum < pagesMeta.length) next.add(pageNum + 1);
              return next;
            });

            // Update current reading page if page is largely visible
            if (entry.intersectionRatio >= 0.4) {
              setCurrentPage(pageNum);
              onPageChange?.(pageNum, pagesMeta.length);
            }
          }
        });
      },
      {
        root: scrollContainer,
        rootMargin: '200px 0px 200px 0px', // Buffer 200px ahead/behind
        threshold: [0.1, 0.4, 0.7],
      }
    );

    const pageElements = scrollContainer.querySelectorAll('[data-page-number]');
    pageElements.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
    };
  }, [pagesMeta, onPageChange]);

  // 5. Native Touch Pinch-to-Zoom & Double-Tap Listeners
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartDistRef.current = dist;
    } else if (e.touches.length === 1) {
      const now = Date.now();
      if (now - lastTapRef.current < 300) {
        // Double tap: toggle zoom between 1.0 (Fit Width) and 1.6 (Zoom in)
        setTouchScale((prev) => (prev > 1.2 ? 1.0 : 1.6));
      }
      lastTapRef.current = now;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchStartDistRef.current) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const ratio = dist / touchStartDistRef.current;
      setTouchScale((prev) => Math.min(Math.max(prev * ratio, 0.8), 2.5));
      touchStartDistRef.current = dist;
    }
  };

  const handleTouchEnd = () => {
    touchStartDistRef.current = null;
  };

  // Combined Zoom multiplier
  const effectiveZoom = useMemo(() => {
    return Math.max(0.75, zoom * touchScale);
  }, [zoom, touchScale]);

  return (
    <div
      ref={containerRef}
      aria-label={title}
      className={`relative w-full h-full flex flex-col bg-slate-900 text-slate-100 select-none overflow-hidden ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Optional Top Header Bar */}
      {headerControls}

      {/* Main Document Scroll Surface */}
      <div
        ref={scrollContainerRef}
        className="flex-1 w-full overflow-y-auto overflow-x-hidden relative flex flex-col items-center py-4 px-2 sm:px-4 space-y-4 touch-pan-y"
        style={{
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {/* Loading Spinner / Skeletons */}
        {loading && (
          <div className="w-full flex-1 flex flex-col items-center justify-center p-8 space-y-4">
            <Loader2 className="w-8 h-8 text-[#C19B48] animate-spin" />
            <p className="text-xs font-semibold text-slate-400 tracking-wide uppercase">
              Rendering Judicial Document...
            </p>
          </div>
        )}

        {/* Error Fallback */}
        {error && (
          <div className="w-full min-w-0 flex-1 flex flex-col items-center justify-center p-4 sm:p-8 text-center max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 shrink-0 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-white">Document Preview Failed</h4>
            <p className="w-full min-w-0 max-w-full px-1 text-[11px] sm:text-xs text-slate-400 leading-relaxed whitespace-pre-wrap break-all [overflow-wrap:anywhere]">
              {error}
            </p>
            <button
              type="button"
              onClick={loadPdf}
              className="mt-2 max-w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Rendering</span>
            </button>
          </div>
        )}

        {/* Page Canvases */}
        {!loading &&
          !error &&
          pdfDoc &&
          pagesMeta.map((pageMeta) => {
            const isPageVisible = visiblePages.has(pageMeta.pageNumber);
            // Calculate pixel dimensions for this page
            // If rotation is 90 or 270, swap aspect ratio
            const isRotatedQuarter = rotation === 90 || rotation === 270;
            const aspect = isRotatedQuarter
              ? 1 / pageMeta.aspectRatio
              : pageMeta.aspectRatio;

            // Fit-to-width width
            const baseWidth = containerWidth > 0 ? containerWidth : 360;
            const renderedWidth = Math.floor(baseWidth * effectiveZoom);
            const renderedHeight = Math.floor(renderedWidth / aspect);

            return (
              <div
                key={pageMeta.pageNumber}
                data-page-number={pageMeta.pageNumber}
                className="relative bg-white shadow-xl rounded-md transition-shadow duration-200 overflow-hidden flex items-center justify-center"
                style={{
                  width: `${renderedWidth}px`,
                  minHeight: `${renderedHeight}px`,
                  maxWidth: '100%',
                }}
              >
                {isPageVisible ? (
                  <PdfPageCanvas
                    pdfDoc={pdfDoc}
                    pageNumber={pageMeta.pageNumber}
                    containerWidth={renderedWidth}
                    rotation={rotation}
                  />
                ) : (
                  <div
                    className="w-full h-full flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-400 text-xs font-mono"
                    style={{ minHeight: `${renderedHeight}px` }}
                  >
                    <span>Page {pageMeta.pageNumber}</span>
                  </div>
                )}
              </div>
            );
          })}
      </div>

      {/* Optional Floating Bottom Controls (e.g. Page Pill / Zoom / TOC) */}
      {floatingControls}
    </div>
  );
};

// ============================================================================
// Sub-Component: High-DPI Canvas Page Renderer with Render-Task Cancellation
// ============================================================================

interface PdfPageCanvasProps {
  pdfDoc: PDFDocumentProxy;
  pageNumber: number;
  containerWidth: number;
  rotation: number;
}

const PdfPageCanvas: React.FC<PdfPageCanvasProps> = ({
  pdfDoc,
  pageNumber,
  containerWidth,
  rotation,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRendered, setIsRendered] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    let renderTask: any = null;

    const renderPage = async () => {
      if (!canvasRef.current) return;

      try {
        const page: PDFPageProxy = await pdfDoc.getPage(pageNumber);
        if (isCancelled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        // Base viewport at scale 1.0 with document rotation
        const initialViewport = page.getViewport({ scale: 1.0, rotation });

        // Fit width precisely to the measured container width
        const scale = containerWidth / initialViewport.width;
        const scaledViewport = page.getViewport({ scale, rotation });

        // High-DPI retina sharpness
        const dpr = Math.min(window.devicePixelRatio || 1, 2.5);

        canvas.width = Math.floor(scaledViewport.width * dpr);
        canvas.height = Math.floor(scaledViewport.height * dpr);

        // Logical CSS style dimensions to prevent oversized canvas clipping
        canvas.style.width = `${Math.floor(scaledViewport.width)}px`;
        canvas.style.height = `${Math.floor(scaledViewport.height)}px`;

        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) return;

        // Scale context by DPR
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        renderTask = page.render({
          canvasContext: ctx,
          viewport: scaledViewport,
          canvas: canvas,
        });

        await renderTask.promise;
        if (!isCancelled) {
          setIsRendered(true);
        }
      } catch (err: any) {
        // Ignore deliberate cancellation exceptions when user resizes/zooms quickly
        if (err?.name !== 'RenderingCancelledException') {
          console.error(`Error rendering page ${pageNumber}:`, err);
        }
      }
    };

    renderPage();

    return () => {
      isCancelled = true;
      if (renderTask && typeof renderTask.cancel === 'function') {
        renderTask.cancel();
      }
    };
  }, [pdfDoc, pageNumber, containerWidth, rotation]);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {!isRendered && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50 dark:bg-slate-800 animate-pulse">
          <span className="text-[10px] font-mono text-slate-400">Loading Page {pageNumber}...</span>
        </div>
      )}
      <canvas ref={canvasRef} className="block max-w-full h-auto mx-auto bg-white" />
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import type { PyqPaper } from '../../types/pyq.types';
import { fetchPdfBlob, getDirectStreamUrl, downloadPyqPdf } from '../../services/pyq.service';
import { toast } from '../../lib/toast';
import { UniversalPdfModal } from '../pdf';

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
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!isOpen || !paper) {
      if (blobUrl) {
        window.URL.revokeObjectURL(blobUrl);
        setBlobUrl(null);
      }
      return;
    }

    let isMounted = true;

    // Fetch PDF blob with Authorization header
    fetchPdfBlob(paper._id)
      .then((blob) => {
        if (!isMounted) return;
        const url = window.URL.createObjectURL(blob);
        setBlobUrl(url);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Failed to load PYQ PDF preview:', err);
        // Fallback to direct streaming URL
        const fallbackUrl = getDirectStreamUrl(paper._id);
        setBlobUrl(fallbackUrl);
      });

    return () => {
      isMounted = false;
      if (blobUrl && blobUrl.startsWith('blob:')) {
        window.URL.revokeObjectURL(blobUrl);
      }
    };
  }, [isOpen, paper]);

  if (!isOpen || !paper) return null;

  const handleDownload = async () => {
    try {
      setDownloading(true);
      await downloadPyqPdf(paper._id, paper.pdfFile.originalName);
      toast.success(`Downloaded ${paper.pdfFile.originalName}`);
      onDownloaded?.(paper._id);
    } catch {
      toast.error('Failed to download PDF.');
    } finally {
      setDownloading(false);
    }
  };

  const pdfSource = blobUrl || getDirectStreamUrl(paper._id);

  // Solved paper metadata drawer
  const drawerContent = (
    <div className="space-y-4 text-xs">
      <div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#C19B48]">
          Examination Metadata
        </span>
        <div className="mt-2 space-y-2 p-3 rounded-xl bg-slate-800/80 border border-slate-700/80">
          <div className="flex justify-between">
            <span className="text-slate-400">Jurisdiction / Exam:</span>
            <span className="font-semibold text-white">{paper.exam}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Exam Stage:</span>
            <span className="font-semibold text-white">{paper.stage}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Year:</span>
            <span className="font-semibold text-white">{paper.year}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Subject / Category:</span>
            <span className="font-semibold text-white">{paper.subject || 'All Subjects'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Total Marks:</span>
            <span className="font-semibold text-white">{paper.totalMarks || 'Standard'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Solved By:</span>
            <span className="font-semibold text-[#E2BC5C]">{paper.solvedByFaculty}</span>
          </div>
        </div>
      </div>

      {paper.description && (
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Paper Overview
          </span>
          <p className="mt-1 text-slate-300 leading-relaxed bg-slate-800/80 p-3 rounded-xl border border-slate-700/80">
            {paper.description}
          </p>
        </div>
      )}
    </div>
  );

  return (
    <UniversalPdfModal
      isOpen={isOpen}
      onClose={onClose}
      source={pdfSource}
      title={paper.title}
      subtitle={`${paper.exam} • ${paper.stage} • Year ${paper.year} • Solved by ${paper.solvedByFaculty}`}
      badgeText={`${paper.exam} ${paper.year}`}
      onDownload={handleDownload}
      downloading={downloading}
      drawerTitle="Paper Info"
      drawerContent={drawerContent}
    />
  );
};

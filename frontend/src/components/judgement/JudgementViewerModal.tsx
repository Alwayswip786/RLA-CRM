import React, { useState, useEffect } from 'react';
import type { JudgementDigest } from '../../types/judgement.types';
import {
  fetchJudgementPdfBlob,
  getJudgementDirectStreamUrl,
  downloadJudgementPdf,
} from '../../services/judgement.service';
import { toast } from '../../lib/toast';
import { UniversalPdfModal } from '../pdf';

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
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!isOpen || !judgement) {
      if (blobUrl) {
        window.URL.revokeObjectURL(blobUrl);
        setBlobUrl(null);
      }
      return;
    }

    let isMounted = true;

    // Fetch PDF blob with Authorization header
    fetchJudgementPdfBlob(judgement._id)
      .then((blob) => {
        if (!isMounted) return;
        const url = window.URL.createObjectURL(blob);
        setBlobUrl(url);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Failed to load Judgement PDF blob preview:', err);
        // Fallback to direct authenticated streaming URL
        const fallbackUrl = getJudgementDirectStreamUrl(judgement._id);
        setBlobUrl(fallbackUrl);
      });

    return () => {
      isMounted = false;
      if (blobUrl && blobUrl.startsWith('blob:')) {
        window.URL.revokeObjectURL(blobUrl);
      }
    };
  }, [isOpen, judgement]);

  if (!isOpen || !judgement) return null;

  const handleDownload = async () => {
    if (!judgement.pdfFile) {
      toast.info('No PDF document attached to this digest.');
      return;
    }
    try {
      setDownloading(true);
      await downloadJudgementPdf(judgement._id, judgement.pdfFile.originalName);
      toast.success(`Downloaded ${judgement.pdfFile.originalName}`);
      onDownloaded?.(judgement._id);
    } catch {
      toast.error('Failed to download PDF.');
    } finally {
      setDownloading(false);
    }
  };

  const pdfSource = blobUrl || getJudgementDirectStreamUrl(judgement._id);

  // Exam notes and ratio decidendi side drawer / bottom sheet
  const drawerContent = (
    <div className="space-y-4 text-xs">
      <div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#C19B48]">
          Mains 3-Point Ratio Decidendi
        </span>
        <ul className="mt-2 space-y-2.5">
          {judgement.ratioDecidendi?.map((point, idx) => (
            <li key={idx} className="flex items-start gap-2 text-slate-300">
              <span className="font-mono text-[#C19B48] font-bold">[{idx + 1}]</span>
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
            : 'Coram information available in full briefing.'}
        </p>
      </div>
    </div>
  );

  return (
    <UniversalPdfModal
      isOpen={isOpen}
      onClose={onClose}
      source={pdfSource}
      title={judgement.title}
      subtitle={`${judgement.citation} • ${judgement.court} • ${judgement.bench}`}
      badgeText="Landmark Ruling"
      onDownload={handleDownload}
      downloading={downloading}
      drawerTitle="Mains Notes & Ratio"
      drawerContent={drawerContent}
    />
  );
};

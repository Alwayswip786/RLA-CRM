import React, { useState } from 'react';
import { Gavel, BookOpen } from 'lucide-react';
import type { BareActNote } from '../../types/bareAct.types';
import { getNoteDirectStreamUrl, downloadNotePdf } from '../../services/bareAct.service';
import { toast } from '../../lib/toast';
import { UniversalPdfModal } from '../pdf';
import { UnderlineTabs } from '../ui/tabs';

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
  const [activeTab, setActiveTab] = useState<'toc' | 'cases'>('toc');
  const [downloading, setDownloading] = useState(false);

  if (!isOpen || !note) return null;

  const pdfStreamUrl = getNoteDirectStreamUrl(note._id);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      toast.loading('Downloading statutory decoding PDF...', { id: 'reader-download' });
      await downloadNotePdf(
        note._id,
        note.pdfFile?.originalName || `${note.actName}_Decoding.pdf`
      );
      toast.success(`Downloaded: ${note.actName} Decoding Notes`, { id: 'reader-download' });
      onDownloadComplete?.(note._id);
    } catch {
      toast.error('Failed to download PDF document.', { id: 'reader-download' });
    } finally {
      setDownloading(false);
    }
  };

  const drawerContent = (
    <div className="space-y-3">
      {/* Tabs */}
      <UnderlineTabs<'toc' | 'cases'>
        value={activeTab}
        onChange={setActiveTab}
        equalWidth={true}
        size="sm"
        items={[
          {
            id: 'toc',
            label: `TOC (${note.sectionBreakdown?.length || 0})`,
            icon: <BookOpen className="w-3.5 h-3.5" />,
          },
          ...(note.relatedJudgements && note.relatedJudgements.length > 0
            ? [
                {
                  id: 'cases' as const,
                  label: `Cases (${note.relatedJudgements.length})`,
                  icon: <Gavel className="w-3.5 h-3.5" />,
                },
              ]
            : []),
        ]}
      />

      {/* Tab Content */}
      <div className="space-y-2 pt-1">
        {activeTab === 'toc' && (
          <>
            {note.sectionBreakdown && note.sectionBreakdown.length > 0 ? (
              note.sectionBreakdown.map((sec, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[#C19B48]">
                      {sec.sectionNumber}
                    </span>
                    {sec.pageNumber && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-300">
                        p. {sec.pageNumber}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-medium text-slate-200 leading-snug">
                    {sec.heading}
                  </p>
                  {sec.keyTakeaway && (
                    <p className="text-[11px] text-slate-400 italic leading-relaxed">
                      {sec.keyTakeaway}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 text-center py-6">
                No section breakdown available.
              </p>
            )}
          </>
        )}

        {activeTab === 'cases' && note.relatedJudgements && (
          <div className="space-y-2">
            {note.relatedJudgements.map((caseItem, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-1"
              >
                <span className="text-[10px] font-bold text-[#C19B48] uppercase">
                  {caseItem.court} ({caseItem.year})
                </span>
                <h5 className="font-serif font-bold text-xs text-slate-200 leading-snug">
                  {caseItem.title}
                </h5>
                <p className="text-[10px] font-mono text-slate-400">
                  {caseItem.citation}
                </p>
                {caseItem.summary && (
                  <p className="text-[11px] text-slate-400 line-clamp-2 pt-0.5">
                    {caseItem.summary}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <UniversalPdfModal
      isOpen={isOpen}
      onClose={onClose}
      source={pdfStreamUrl}
      title={note.title}
      subtitle={`${note.actName} • ${note.sectionsCovered}`}
      badgeText="Bare Act Note"
      onDownload={handleDownload}
      downloading={downloading}
      drawerTitle="Sections TOC & Cases"
      drawerContent={drawerContent}
    />
  );
};

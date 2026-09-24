import React, { useState, useEffect } from 'react';
import {
  X,
  Scale,
  Bookmark,
  BookOpen,
  FileText,
  Award,
  Download,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import type { JudgementDigest } from '../../types/judgement.types';
import { useBookmarkStore } from '../../store/useBookmarkStore';
import {
  downloadJudgementPdf,
  fetchJudgementPdfBlob,
  getJudgementDirectStreamUrl,
} from '../../services/judgement.service';
import { toast } from '../../lib/toast';
import { DocumentViewerSkeleton } from '../ui/skeleton';
import { UniversalPdfViewer } from '../pdf';
import { ScrollableTabs } from '../ui/tabs';

interface JudgementAnalysisModalProps {
  judgement: JudgementDigest | null;
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'analysis' | 'holdings' | 'provisions' | 'exam' | 'pdf';

export const JudgementAnalysisModal: React.FC<JudgementAnalysisModalProps> = ({
  judgement,
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'analysis' | 'holdings' | 'provisions' | 'exam' | 'pdf'>('analysis');
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const { isBookmarked, toggleBookmark } = useBookmarkStore();

  useEffect(() => {
    if (!isOpen || !judgement) {
      if (pdfBlobUrl) {
        window.URL.revokeObjectURL(pdfBlobUrl);
        setPdfBlobUrl(null);
      }
      setActiveTab('analysis');
      return;
    }

    if (activeTab === 'pdf' && judgement.pdfFile && !pdfBlobUrl) {
      setLoadingPdf(true);
      fetchJudgementPdfBlob(judgement._id)
        .then((blob) => {
          const url = window.URL.createObjectURL(blob);
          setPdfBlobUrl(url);
          setLoadingPdf(false);
        })
        .catch(() => {
          const fallback = getJudgementDirectStreamUrl(judgement._id);
          setPdfBlobUrl(fallback);
          setLoadingPdf(false);
        });
    }
  }, [isOpen, judgement, activeTab, pdfBlobUrl]);

  // Handle ESC close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !judgement) return null;

  const bookmarked = isBookmarked(judgement._id);

  const handleBookmark = async () => {
    await toggleBookmark({
      itemType: 'Judgment',
      itemId: judgement._id,
      title: judgement.title,
      source: `${judgement.citation} | ${judgement.court}`,
      subject: judgement.category || judgement.subject || 'Constitutional Law',
      annotation: judgement.summary ? judgement.summary.slice(0, 160) + '...' : '',
      tags: judgement.tags,
      metadata: {
        citation: judgement.citation,
        court: judgement.court,
        bench: judgement.bench,
        year: judgement.year,
        targetRoute: '/dashboard/judgments',
      },
    });
  };

  const handleDownloadPdf = async () => {
    if (!judgement.pdfFile) {
      toast.info('This case is curated as a digital analytical dossier; no PDF file is attached.');
      return;
    }
    try {
      setDownloading(true);
      await downloadJudgementPdf(judgement._id, judgement.pdfFile.originalName || `${judgement.title}.pdf`);
      toast.success('Downloaded official judgment copy.');
    } catch {
      toast.error('Failed to download PDF.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-5xl max-h-[92dvh] flex flex-col rounded-2xl bg-white dark:bg-[#061120] border border-slate-200 dark:border-[#143564] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Ribbon */}
        <div className="flex items-start justify-between gap-3 sm:gap-4 p-3.5 sm:p-6 border-b border-slate-200 dark:border-[#143564]/80 bg-slate-50 dark:bg-[#0a1c36]">
          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">
                <Scale className="w-3.5 h-3.5" />
                <span>Landmark Judgment Analysis</span>
              </div>
              <span className="text-[10px] sm:text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-200 dark:bg-[#143564] text-slate-700 dark:text-slate-200 font-semibold">
                {judgement.benchStrength || judgement.bench || 'Division Bench'}
              </span>
              {judgement.overruledStatus?.status && (
                <span className="text-[10px] sm:text-[11px] px-2 py-0.5 rounded-md font-semibold bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/30">
                  {judgement.overruledStatus.status}
                </span>
              )}
            </div>

            <h2 className="text-base sm:text-2xl font-serif font-bold text-slate-900 dark:text-white leading-tight">
              {judgement.title} <span className="text-slate-500 dark:text-slate-400 text-sm sm:text-lg font-normal">({judgement.citation})</span>
            </h2>

            <div className="flex flex-wrap items-center gap-x-3 sm:gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
              <span>{judgement.court}</span>
              <span>•</span>
              <span>Decided: {new Date(judgement.dateOfJudgement).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              {judgement.category && (
                <>
                  <span>•</span>
                  <span className="text-[#c19b48] font-medium">{judgement.category}</span>
                </>
              )}
            </div>
          </div>

          {/* Top Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={handleBookmark}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                bookmarked
                  ? 'bg-[#c19b48]/20 border-[#c19b48] text-[#c19b48]'
                  : 'border-slate-200 dark:border-[#143564] text-slate-400 hover:text-slate-700 dark:hover:text-white'
              }`}
              title={bookmarked ? 'Saved in Starred Vault' : 'Save to Starred Vault'}
            >
              <Bookmark className="w-4 h-4 fill-current" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl border border-slate-200 dark:border-[#143564] text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#143564]/50 cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-3 sm:px-6 pt-3 bg-white dark:bg-[#061120]">
          <ScrollableTabs<TabType>
            value={activeTab}
            onChange={setActiveTab}
            variant="underline"
            items={[
              {
                id: 'analysis',
                label: 'Analytical Briefing',
                shortLabel: 'Briefing',
                icon: <FileText className="w-4 h-4" />,
              },
              {
                id: 'holdings',
                label: 'Key Holdings & Ratio',
                shortLabel: 'Holdings',
                icon: <Scale className="w-4 h-4" />,
              },
              {
                id: 'provisions',
                label: 'Provisions & Precedents',
                shortLabel: 'Precedents',
                icon: <BookOpen className="w-4 h-4" />,
              },
              {
                id: 'exam',
                label: 'Mains & Prelims Utility',
                shortLabel: 'Exam Utility',
                icon: <Award className="w-4 h-4" />,
              },
              ...(judgement.pdfFile
                ? [
                    {
                      id: 'pdf' as TabType,
                      label: 'Official PDF Reader',
                      shortLabel: 'PDF Reader',
                      icon: <Download className="w-4 h-4" />,
                    },
                  ]
                : []),
            ]}
          />
        </div>

        {/* Tab Content Body */}
        <div className="p-5 sm:p-7 overflow-y-auto flex-1 space-y-6 text-slate-700 dark:text-slate-200">
          {/* TAB 1: Analytical Briefing */}
          {activeTab === 'analysis' && (
            <div className="space-y-6">
              {/* Executive Summary Box */}
              <div className="p-4 sm:p-5 rounded-xl bg-amber-500/5 dark:bg-[#0a1c36] border border-[#c19b48]/30 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#c19b48]">Executive Case Summary</span>
                <p className="text-sm leading-relaxed text-slate-800 dark:text-slate-200 font-sans">
                  {judgement.summary}
                </p>
              </div>

              {/* Long-form Analytical Commentary */}
              {judgement.fullAnalysis ? (
                <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed space-y-4 whitespace-pre-line font-sans">
                  {judgement.fullAnalysis}
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Ratio Decidendi Summary</h3>
                  <ul className="space-y-2 list-disc pl-5 text-sm">
                    {judgement.ratioDecidendi.map((ratio, idx) => (
                      <li key={idx} className="leading-relaxed">{ratio}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Judges on Bench */}
              {judgement.judges && judgement.judges.length > 0 && (
                <div className="pt-4 border-t border-slate-200 dark:border-[#143564]/60">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
                    Hon'ble Judges on the Bench
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {judgement.judges.map((judge, idx) => (
                      <span key={idx} className="text-xs font-medium px-3 py-1 rounded-lg bg-slate-100 dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] text-slate-700 dark:text-slate-300">
                        {judge}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Key Holdings & Ratio */}
          {activeTab === 'holdings' && (
            <div className="space-y-5">
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#c19b48]">
                  Core Holdings & Legal Ratio
                </span>
                {judgement.keyHoldings && judgement.keyHoldings.length > 0 ? (
                  judgement.keyHoldings.map((h, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-slate-50 dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] space-y-1.5"
                    >
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                        <span className="text-[#c19b48] font-black text-lg">•</span>
                        <span>{h.title}</span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 pl-4 leading-relaxed">
                        {h.text}
                      </p>
                    </div>
                  ))
                ) : (
                  judgement.ratioDecidendi.map((r, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-slate-50 dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] space-y-1"
                    >
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                        <span className="text-[#c19b48] font-black">•</span>
                        <span>Holding Principle #{idx + 1}</span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 pl-4 leading-relaxed">
                        {r}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {judgement.overruledPrecedents && (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-xs sm:text-sm space-y-1 text-red-900 dark:text-red-300">
                  <strong className="block text-red-700 dark:text-red-400 uppercase text-xs font-bold tracking-wider">
                    Impact on Prior Precedents
                  </strong>
                  <p>{judgement.overruledPrecedents}</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Provisions & Precedents */}
          {activeTab === 'provisions' && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-3">
                  Relevant Articles, Sections & Dual New Acts
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {judgement.provisions && judgement.provisions.length > 0 ? (
                    judgement.provisions.map((p, idx) => {
                      const colorMap = {
                        amber: 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300/40',
                        blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300/40',
                        emerald: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-300/40',
                        purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-300/40',
                        slate: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300/40',
                      };
                      const colorClass = p.badgeColor ? colorMap[p.badgeColor] : colorMap.amber;
                      return (
                        <div key={idx} className={`px-3 py-1 rounded-lg border text-xs font-semibold ${colorClass}`}>
                          <span>{p.label}</span>
                          {p.actOrCode && <span className="opacity-70 text-[10px] ml-1.5">({p.actOrCode})</span>}
                        </div>
                      );
                    })
                  ) : (
                    judgement.legalProvisions.map((lp, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] text-xs font-semibold text-slate-700 dark:text-slate-300"
                      >
                        {lp}
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Related Precedents */}
              {judgement.relatedCases && judgement.relatedCases.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-[#143564]/60">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                    Precedent Lineage & Connected Case Law
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {judgement.relatedCases.map((rc, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] flex items-center justify-between gap-3"
                      >
                        <div>
                          <p className="text-xs font-serif font-bold text-slate-900 dark:text-white">{rc.title}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">{rc.citation}</p>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-slate-200 dark:bg-[#143564] text-slate-700 dark:text-slate-300">
                          {rc.relationship || 'Connected'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Mains & Prelims Utility */}
          {activeTab === 'exam' && (
            <div className="space-y-6">
              {/* Mains Drafting Blueprint Callout */}
              <div className="p-5 rounded-2xl bg-amber-500/10 dark:bg-[#c19b48]/10 border border-[#c19b48]/40 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#c19b48]">
                  <Award className="w-4 h-4" />
                  <span>Judiciary Mains Answer-Writing Application</span>
                </div>
                <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                  {judgement.examRelevance?.mainsPerspective || judgement.mainsUtility || (
                    'Cite this landmark precedent when framing answers on police interrogation limits under CrPC/BNSS and involuntary chemical/neurological testing under Article 20(3).'
                  )}
                </p>
              </div>

              {/* Prelims Quick Factoids */}
              {judgement.examRelevance?.prelimsFactoids && judgement.examRelevance.prelimsFactoids.length > 0 && (
                <div className="space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                    High-Yield Prelims Pointers
                  </span>
                  <div className="space-y-2">
                    {judgement.examRelevance.prelimsFactoids.map((fact, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{fact}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* PYQ References */}
              {judgement.examRelevance?.pyqReferences && judgement.examRelevance.pyqReferences.length > 0 && (
                <div className="pt-4 border-t border-slate-200 dark:border-[#143564]/60 space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                    Exam Chamber Appearances (Previous Year Questions)
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {judgement.examRelevance.pyqReferences.map((pyq, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-medium"
                      >
                        {pyq}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: PDF Reader */}
          {activeTab === 'pdf' && (
            <div className="space-y-4">
              {judgement.pdfFile ? (
                <>
                  <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-100 dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564]">
                    <div className="flex items-center gap-2 text-xs">
                      <FileText className="w-4 h-4 text-[#c19b48]" />
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{judgement.pdfFile.originalName}</span>
                      <span className="text-slate-500">({judgement.pdfFile.sizeFormatted})</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleDownloadPdf}
                      disabled={downloading}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#c19b48] hover:bg-[#a47d31] text-white text-xs font-semibold transition-colors cursor-pointer"
                    >
                      {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                      <span>Download PDF</span>
                    </button>
                  </div>

                  {loadingPdf ? (
                    <div className="h-[60vh] rounded-xl overflow-hidden border border-slate-200 dark:border-[#143564]">
                      <DocumentViewerSkeleton />
                    </div>
                  ) : pdfBlobUrl ? (
                    <div className="h-[65vh] rounded-xl border border-slate-200 dark:border-[#143564] overflow-hidden">
                      <UniversalPdfViewer
                        source={pdfBlobUrl}
                        title={judgement.title}
                        className="w-full h-full"
                      />
                    </div>
                  ) : (
                    <div className="h-48 flex items-center justify-center text-xs text-slate-400">
                      Unable to stream PDF preview. Please use the download button above.
                    </div>
                  )}
                </>
              ) : (
                <div className="p-8 text-center space-y-3">
                  <Scale className="w-12 h-12 text-[#c19b48] mx-auto opacity-70" />
                  <h4 className="text-base font-bold text-slate-800 dark:text-white">Curated Analytical Digest</h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    This landmark ruling is formatted as a structured high-yield digital briefing by Rajinder Law Academy faculty. All ratio decidendi and exam notes are available in the tabs above.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 px-6 border-t border-slate-200 dark:border-[#143564]/80 bg-slate-50 dark:bg-[#0a1c36] text-xs">
          <span className="text-slate-500 dark:text-slate-400">
            Source: {judgement.sourceReference || `${judgement.citation} • Supreme Court of India`}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-[#143564] hover:bg-slate-300 dark:hover:bg-[#1a427d] text-slate-800 dark:text-slate-200 font-semibold cursor-pointer transition-colors"
          >
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
};

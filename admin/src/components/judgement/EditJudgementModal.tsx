import React, { useState, useRef } from 'react';
import {
  X,
  FileText,
  Loader2,
  CheckCircle2,
  RefreshCw,
  Scale,
  Save,
  Upload,
  Calendar,
  Sparkles,
  BookOpen,
  Plus,
  Trash2,
} from 'lucide-react';
import type {
  JudgementDigest,
  CourtCategory,
  JudgementImportance,
  JudgementStatus,
  IKeyHolding,
  ILegalProvisionRef,
} from '../../types/judgement.types';
import {
  updateJudgement,
  replaceJudgementPdf,
} from '../../services/judgement.service';
import { toast } from 'react-hot-toast';

interface EditJudgementModalProps {
  judgement: JudgementDigest | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const COURTS: CourtCategory[] = [
  'Supreme Court of India',
  'Delhi High Court',
  'Bombay High Court',
  'Allahabad High Court',
  'Punjab & Haryana High Court',
  'Calcutta High Court',
  'Madras High Court',
  'Other High Courts',
];

const IMPORTANCES: JudgementImportance[] = [
  'Landmark',
  'Leading',
  'Recent / Overruling',
  'Standard',
];

const STATUS_OPTIONS: { label: string; value: JudgementStatus }[] = [
  { label: 'Published (Live in Vault)', value: 'published' },
  { label: 'Scheduled (Future Daily)', value: 'scheduled' },
  { label: 'Draft (In Faculty Review)', value: 'draft' },
  { label: 'Archived', value: 'archived' },
];

export const EditJudgementModal: React.FC<EditJudgementModalProps> = ({
  judgement,
  isOpen,
  onClose,
  onSuccess,
}) => {
  if (!isOpen || !judgement) return null;

  const [activeTab, setActiveTab] = useState<'metadata' | 'holdings' | 'dossier' | 'replace-file'>('metadata');

  // Metadata form states
  const [title, setTitle] = useState(judgement.title || '');
  const [citation, setCitation] = useState(judgement.citation || '');
  const [court, setCourt] = useState<CourtCategory>(judgement.court || 'Supreme Court of India');
  const [bench, setBench] = useState(judgement.bench || 'Division Bench (2 Judges)');
  const [benchStrength, setBenchStrength] = useState(judgement.benchStrength || judgement.bench || '3-Judge Bench');
  const [judges, setJudges] = useState(judgement.judges?.join(', ') || '');
  const [dateOfJudgement, setDateOfJudgement] = useState(
    judgement.dateOfJudgement ? new Date(judgement.dateOfJudgement).toISOString().split('T')[0] : ''
  );
  const [subject, setSubject] = useState(judgement.subject || '');
  const [category, setCategory] = useState(judgement.category || judgement.subject || '');
  const [sourceReference, setSourceReference] = useState(judgement.sourceReference || '');
  const [summary, setSummary] = useState(judgement.summary || '');

  // Scheduling & Status
  const [dailyDateIST, setDailyDateIST] = useState(
    judgement.dailyDateIST || new Date().toISOString().split('T')[0]
  );
  const [isDailyFeatured, setIsDailyFeatured] = useState(Boolean(judgement.isDailyFeatured));
  const [priority, setPriority] = useState(judgement.priority || 1);
  const [status, setStatus] = useState<JudgementStatus>(
    judgement.status || (judgement.isPublished ? 'published' : 'draft')
  );

  // Key Holdings
  const [keyHoldings, setKeyHoldings] = useState<IKeyHolding[]>(() => {
    if (judgement.keyHoldings && judgement.keyHoldings.length > 0) {
      return judgement.keyHoldings;
    }
    if (judgement.ratioDecidendi && judgement.ratioDecidendi.length > 0) {
      return judgement.ratioDecidendi.map((r, i) => ({
        title: `Holding ${i + 1}:`,
        text: r,
      }));
    }
    return [
      { title: 'Involuntary Administration:', text: '' },
      { title: 'Protection of Privacy:', text: '' },
      { title: 'Substantive Due Process:', text: '' },
    ];
  });

  // Legal Provisions
  const [provisions, setProvisions] = useState<ILegalProvisionRef[]>(() => {
    if (judgement.provisions && judgement.provisions.length > 0) {
      return judgement.provisions;
    }
    if (judgement.legalProvisions && judgement.legalProvisions.length > 0) {
      return judgement.legalProvisions.map((lp) => ({
        label: lp,
        actOrCode: '',
        badgeColor: 'amber' as const,
      }));
    }
    return [
      { label: 'Article 20(3)', actOrCode: 'Constitution of India, 1950', badgeColor: 'amber' },
    ];
  });

  // Markdown Dossier
  const [fullAnalysis, setFullAnalysis] = useState(judgement.fullAnalysis || '');

  const [mainsUtility, setMainsUtility] = useState(judgement.mainsUtility || '');
  const [overruledPrecedents, setOverruledPrecedents] = useState(judgement.overruledPrecedents || '');
  const [tags, setTags] = useState(judgement.tags?.join(', ') || '');
  const [importance, setImportance] = useState<JudgementImportance>(judgement.importance || 'Landmark');
  const [isFeatured, setIsFeatured] = useState(judgement.isFeatured || false);

  const [saving, setSaving] = useState(false);

  // File replacement states
  const [newFile, setNewFile] = useState<File | null>(null);
  const [replacing, setReplacing] = useState(false);
  const [replaceProgress, setReplaceProgress] = useState(0);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  // Holdings Handlers
  const handleAddHolding = () => {
    setKeyHoldings((prev) => [...prev, { title: '', text: '' }]);
  };

  const handleRemoveHolding = (index: number) => {
    setKeyHoldings((prev) => prev.filter((_, i) => i !== index));
  };

  const handleHoldingChange = (index: number, field: 'title' | 'text', val: string) => {
    setKeyHoldings((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  // Provisions Handlers
  const handleAddProvision = () => {
    setProvisions((prev) => [
      ...prev,
      { label: '', actOrCode: '', badgeColor: 'amber' },
    ]);
  };

  const handleRemoveProvision = (index: number) => {
    setProvisions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleProvisionChange = (
    index: number,
    field: keyof ILegalProvisionRef,
    val: string
  ) => {
    setProvisions((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const handleMetadataSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Case title is required.');
      return;
    }
    if (!citation.trim()) {
      toast.error('Legal citation is required.');
      return;
    }
    if (!summary.trim()) {
      toast.error('Executive summary is required.');
      return;
    }

    try {
      setSaving(true);
      const judgesArray = judges.split(',').map((j) => j.trim()).filter(Boolean);
      const tagsArray = tags.split(',').map((t) => t.trim()).filter(Boolean);

      const validHoldings = keyHoldings.filter((k) => k.title.trim() || k.text.trim());
      const validProvisions = provisions.filter((p) => p.label.trim());

      const res = await updateJudgement(judgement._id, {
        title: title.trim(),
        citation: citation.trim(),
        court,
        bench: bench.trim(),
        benchStrength: benchStrength.trim() || bench.trim(),
        judges: judgesArray,
        dateOfJudgement,
        subject: subject.trim(),
        category: category.trim() || subject.trim(),
        sourceReference: sourceReference.trim(),
        summary: summary.trim(),
        keyHoldings: validHoldings,
        ratioDecidendi: validHoldings.map((k) => `${k.title} ${k.text}`.trim()),
        provisions: validProvisions,
        legalProvisions: validProvisions.map((p) => p.label.trim()),
        fullAnalysis: fullAnalysis.trim(),
        status,
        dailyDateIST: dailyDateIST.trim(),
        isDailyFeatured,
        priority: Number(priority) || 1,
        isPublished: status === 'published',
        mainsUtility: mainsUtility.trim(),
        overruledPrecedents: overruledPrecedents.trim(),
        tags: tagsArray,
        importance,
        isFeatured,
      });

      if (res.success) {
        toast.success('Precedent metadata & holdings updated successfully!');
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update judgement.');
    } finally {
      setSaving(false);
    }
  };

  const handleFileReplace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFile) {
      toast.error('Please select a PDF document.');
      return;
    }

    try {
      setReplacing(true);
      setReplaceProgress(0);

      const res = await replaceJudgementPdf(judgement._id, newFile, (pct) => {
        setReplaceProgress(pct);
      });

      if (res.success) {
        toast.success('PDF document attached/replaced successfully!');
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to replace PDF file.');
    } finally {
      setReplacing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl my-8 bg-[#1E1E1E] rounded-2xl border border-[#3D3D3D] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#262626] border-b border-[#3D3D3D]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#C19B48]/15 text-[#C19B48] border border-[#C19B48]/30">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-serif font-bold text-[#F7F3E6]">
                Edit Landmark Judgement Precedent
              </h2>
              <p className="text-xs text-[#A8A294]">
                Update citation, bench strength, daily scheduling, holdings, and attached PDF
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={saving || replacing}
            className="p-1.5 rounded-lg text-[#A8A294] hover:text-[#F7F3E6] hover:bg-[#3D3D3D] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-4 px-6 border-b border-[#3D3D3D] bg-[#1E1E1E] overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('metadata')}
            className={`py-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'metadata'
                ? 'border-[#C19B48] text-[#C19B48]'
                : 'border-transparent text-[#A8A294] hover:text-[#F7F3E6]'
            }`}
          >
            Case Info & Scheduling
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('holdings')}
            className={`py-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'holdings'
                ? 'border-[#C19B48] text-[#C19B48]'
                : 'border-transparent text-[#A8A294] hover:text-[#F7F3E6]'
            }`}
          >
            Holdings & Provisions
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('dossier')}
            className={`py-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'dossier'
                ? 'border-[#C19B48] text-[#C19B48]'
                : 'border-transparent text-[#A8A294] hover:text-[#F7F3E6]'
            }`}
          >
            Full Analysis Dossier
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('replace-file')}
            className={`py-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'replace-file'
                ? 'border-[#C19B48] text-[#C19B48]'
                : 'border-transparent text-[#A8A294] hover:text-[#F7F3E6]'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>PDF Document File</span>
          </button>
        </div>

        {/* Tab 1: Case Info & Scheduling */}
        {activeTab === 'metadata' && (
          <form onSubmit={handleMetadataSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
            {/* Scheduling & Lifecycle Status Bar */}
            <div className="p-4 rounded-xl bg-[#262626] border border-[#3D3D3D] space-y-3">
              <div className="flex items-center gap-2 text-[#C19B48] font-bold text-xs">
                <Calendar className="w-4 h-4" />
                <span>Daily Judgment Scheduling & Lifecycle Status</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-semibold text-[#A8A294] mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as JudgementStatus)}
                    className="w-full px-3 py-2 rounded-xl bg-[#1E1E1E] border border-[#3D3D3D] text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#A8A294] mb-1">
                    Scheduled Date (IST)
                  </label>
                  <input
                    type="date"
                    value={dailyDateIST}
                    onChange={(e) => setDailyDateIST(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#1E1E1E] border border-[#3D3D3D] text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#A8A294] mb-1">
                    Featured Priority (1-10)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={priority}
                    onChange={(e) => setPriority(Number(e.target.value) || 1)}
                    className="w-full px-3 py-2 rounded-xl bg-[#1E1E1E] border border-[#3D3D3D] text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
                  />
                </div>

                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isDailyFeatured}
                      onChange={(e) => setIsDailyFeatured(e.target.checked)}
                      className="rounded border-[#3D3D3D] text-[#C19B48] focus:ring-[#C19B48] w-4 h-4 bg-[#1E1E1E]"
                    />
                    <span className="text-[#C19B48] font-semibold text-[11px]">
                      Featured Landmark of Day
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-[#F7F3E6] mb-1">
                  Case Name / Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#F7F3E6] mb-1">
                  Official Citation <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={citation}
                  onChange={(e) => setCitation(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#F7F3E6] mb-1">Court</label>
                <select
                  value={court}
                  onChange={(e) => setCourt(e.target.value as CourtCategory)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
                >
                  {COURTS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#F7F3E6] mb-1">
                  Bench Strength (Pill badge)
                </label>
                <input
                  type="text"
                  value={benchStrength}
                  onChange={(e) => setBenchStrength(e.target.value)}
                  placeholder="e.g. 3-Judge Bench"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#F7F3E6] mb-1">
                  Coram / Bench Composition
                </label>
                <input
                  type="text"
                  value={bench}
                  onChange={(e) => setBench(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#F7F3E6] mb-1">
                  Date of Judgement <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  value={dateOfJudgement}
                  onChange={(e) => setDateOfJudgement(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#F7F3E6] mb-1">
                  Jurisprudence Category
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Constitutional Criminal Jurisprudence"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#F7F3E6] mb-1">
                  Subject Area <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#F7F3E6] mb-1">Precedent Importance</label>
                <select
                  value={importance}
                  onChange={(e) => setImportance(e.target.value as JudgementImportance)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
                >
                  {IMPORTANCES.map((imp) => (
                    <option key={imp} value={imp}>
                      {imp}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-[#F7F3E6] mb-1">
                  Coram Judges (Comma or newline separated)
                </label>
                <input
                  type="text"
                  value={judges}
                  onChange={(e) => setJudges(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-[#F7F3E6] mb-1">
                  Source Reference & Official Link
                </label>
                <input
                  type="text"
                  value={sourceReference}
                  onChange={(e) => setSourceReference(e.target.value)}
                  placeholder="e.g. (2010) 7 SCC 263 | Supreme Court of India"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
                />
              </div>
            </div>

            {/* Executive Summary */}
            <div>
              <label className="block font-semibold text-[#F7F3E6] mb-1">
                Executive Case Summary <span className="text-red-400">*</span>
              </label>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={3}
                required
                className="w-full px-3.5 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
              />
            </div>

            {/* Mains Utility & Overruled */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-[#F7F3E6] mb-1">Mains Exam Utility Note</label>
                <textarea
                  value={mainsUtility}
                  onChange={(e) => setMainsUtility(e.target.value)}
                  rows={2}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#F7F3E6] mb-1">Overruled Precedents</label>
                <textarea
                  value={overruledPrecedents}
                  onChange={(e) => setOverruledPrecedents(e.target.value)}
                  rows={2}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
                />
              </div>
            </div>

            {/* Tags & Featured */}
            <div>
              <label className="block font-semibold text-[#F7F3E6] mb-1">
                Search Tags (Comma separated)
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
              />
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-[#3D3D3D]">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="rounded border-[#3D3D3D] text-[#C19B48] focus:ring-[#C19B48] w-4 h-4 bg-[#262626]"
                />
                <span className="text-[#C19B48] font-semibold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  Featured Precedent in Case Vault
                </span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#3D3D3D]">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-[#262626] hover:bg-[#3D3D3D] text-[#A8A294] hover:text-[#F7F3E6] font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#C19B48] hover:bg-[#D8B862] text-[#1E1E1E] font-bold transition-colors shadow-md disabled:opacity-50 cursor-pointer"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{saving ? 'Saving Changes...' : 'Save Case Information'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Holdings & Provisions */}
        {activeTab === 'holdings' && (
          <form onSubmit={handleMetadataSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
            {/* Holdings Section */}
            <div className="p-4 rounded-xl bg-[#262626] border border-[#3D3D3D] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="block font-bold text-[#C19B48] uppercase text-[11px] tracking-wider">
                    Key Legal Principles & Holdings (Reference UI Style)
                  </span>
                  <span className="text-[10px] text-[#A8A294]">
                    Amber bullet items with bold title prefix shown on student dashboard card
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleAddHolding}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#C19B48]/15 border border-[#C19B48]/30 text-[#C19B48] hover:bg-[#C19B48]/25 text-[11px] font-semibold cursor-pointer transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Holding</span>
                </button>
              </div>

              <div className="space-y-3">
                {keyHoldings.map((holding, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 bg-[#1E1E1E] p-3 rounded-xl border border-[#3D3D3D]"
                  >
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-[#C19B48] font-bold text-[10px] flex items-center justify-center shrink-0 mt-1">
                      {idx + 1}
                    </span>

                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={holding.title}
                        onChange={(e) => handleHoldingChange(idx, 'title', e.target.value)}
                        placeholder="Holding Title (e.g. Involuntary Administration:)"
                        className="w-full px-3 py-1.5 rounded-lg bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] font-semibold placeholder-[#A8A294]/60 focus:outline-none focus:border-[#C19B48]"
                      />
                      <textarea
                        value={holding.text}
                        onChange={(e) => handleHoldingChange(idx, 'text', e.target.value)}
                        rows={2}
                        placeholder="Detailed ratio / constitutional holding text..."
                        className="w-full px-3 py-1.5 rounded-lg bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] placeholder-[#A8A294]/60 focus:outline-none focus:border-[#C19B48]"
                      />
                    </div>

                    {keyHoldings.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveHolding(idx)}
                        className="p-1 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors mt-1 cursor-pointer"
                        title="Remove holding"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Provisions Section */}
            <div className="p-4 rounded-xl bg-[#262626] border border-[#3D3D3D] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="block font-bold text-[#C19B48] uppercase text-[11px] tracking-wider">
                    Relevant Articles / Sections / Acts (Dual-Law Badges)
                  </span>
                  <span className="text-[10px] text-[#A8A294]">
                    Renders dual-law badges with act or code reference on the student dashboard card
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleAddProvision}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#C19B48]/15 border border-[#C19B48]/30 text-[#C19B48] hover:bg-[#C19B48]/25 text-[11px] font-semibold cursor-pointer transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Provision</span>
                </button>
              </div>

              <div className="space-y-2">
                {provisions.map((prov, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 bg-[#1E1E1E] p-2 rounded-xl border border-[#3D3D3D]"
                  >
                    <input
                      type="text"
                      value={prov.label}
                      onChange={(e) => handleProvisionChange(idx, 'label', e.target.value)}
                      placeholder="e.g. Article 20(3) or Section 27"
                      className="w-40 px-3 py-1.5 rounded-lg bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] font-semibold placeholder-[#A8A294]/60 focus:outline-none focus:border-[#C19B48]"
                    />
                    <input
                      type="text"
                      value={prov.actOrCode || ''}
                      onChange={(e) => handleProvisionChange(idx, 'actOrCode', e.target.value)}
                      placeholder="Act / Description (e.g. Constitution of India, 1950)"
                      className="flex-1 px-3 py-1.5 rounded-lg bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] placeholder-[#A8A294]/60 focus:outline-none focus:border-[#C19B48]"
                    />
                    <select
                      value={prov.badgeColor || 'amber'}
                      onChange={(e) => handleProvisionChange(idx, 'badgeColor', e.target.value)}
                      className="w-28 px-2 py-1.5 rounded-lg bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
                    >
                      <option value="amber">Amber</option>
                      <option value="blue">Blue</option>
                      <option value="emerald">Emerald</option>
                      <option value="purple">Purple</option>
                      <option value="slate">Slate</option>
                    </select>

                    {provisions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveProvision(idx)}
                        className="p-1 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer"
                        title="Remove provision"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#3D3D3D]">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-[#262626] hover:bg-[#3D3D3D] text-[#A8A294] hover:text-[#F7F3E6] font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#C19B48] hover:bg-[#D8B862] text-[#1E1E1E] font-bold transition-colors shadow-md disabled:opacity-50 cursor-pointer"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{saving ? 'Saving...' : 'Save Holdings & Provisions'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: Full Dossier (Markdown) */}
        {activeTab === 'dossier' && (
          <form onSubmit={handleMetadataSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-[#F7F3E6]">
                  <BookOpen className="w-4 h-4 text-[#C19B48]" />
                  <span>Full Judgment Analysis Dossier (Markdown Supported)</span>
                </div>
                <span className="text-[10px] text-[#A8A294]">
                  Rendered in student modal under Analytical Briefing & Precedents
                </span>
              </div>
              <textarea
                value={fullAnalysis}
                onChange={(e) => setFullAnalysis(e.target.value)}
                rows={14}
                placeholder="## Analytical Briefing&#10;&#10;Explain the foundational facts, legal controversy, constitutional provisions examined, three-prong judicial test, and impact on modern jurisprudence..."
                className="w-full px-3.5 py-3 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] font-mono text-xs placeholder-[#A8A294]/60 focus:outline-none focus:border-[#C19B48] leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#3D3D3D]">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-[#262626] hover:bg-[#3D3D3D] text-[#A8A294] hover:text-[#F7F3E6] font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#C19B48] hover:bg-[#D8B862] text-[#1E1E1E] font-bold transition-colors shadow-md disabled:opacity-50 cursor-pointer"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{saving ? 'Saving...' : 'Save Dossier'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 4: PDF Document File (Replace / Attach) */}
        {activeTab === 'replace-file' && (
          <form onSubmit={handleFileReplace} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
            {/* Current File Information */}
            <div className="p-4 rounded-xl bg-[#262626] border border-[#3D3D3D] space-y-2">
              <span className="text-[10px] font-bold text-[#A8A294] uppercase tracking-wider block">
                Current PDF Document
              </span>
              {judgement.pdfFile ? (
                <div className="flex items-center justify-between text-[#F7F3E6]">
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="w-4 h-4 text-[#C19B48] shrink-0" />
                    <span className="font-mono truncate">{judgement.pdfFile.originalName}</span>
                  </div>
                  <span className="font-mono text-xs text-[#A8A294]">
                    {judgement.pdfFile.sizeFormatted}
                  </span>
                </div>
              ) : (
                <p className="text-amber-400/80 text-xs italic">
                  No PDF document is currently attached. Upload a file below to make the original court judgment downloadable.
                </p>
              )}
            </div>

            {/* Revised File Picker */}
            <div>
              <label className="block font-semibold text-[#F7F3E6] mb-1.5">
                Select {judgement.pdfFile ? 'Revised' : 'New'} Judgement PDF <span className="text-red-400">*</span>
              </label>
              <input
                ref={replaceInputRef}
                type="file"
                accept="application/pdf"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setNewFile(e.target.files[0]);
                  }
                }}
                className="hidden"
              />
              <div
                onClick={() => replaceInputRef.current?.click()}
                className="border-2 border-dashed border-[#3D3D3D] hover:border-[#C19B48] rounded-xl p-6 text-center cursor-pointer bg-[#262626] transition-colors"
              >
                {newFile ? (
                  <div className="flex items-center justify-center gap-3 text-emerald-400">
                    <CheckCircle2 className="w-6 h-6" />
                    <div className="text-left">
                      <p className="font-semibold text-sm text-[#F7F3E6]">{newFile.name}</p>
                      <p className="text-[11px] text-[#A8A294]">
                        {(newFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to upload
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-7 h-7 text-[#C19B48] mx-auto" />
                    <p className="text-[#F7F3E6] font-medium">Click to select PDF document</p>
                    <p className="text-[11px] text-[#A8A294]">PDF format up to 50MB</p>
                  </div>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            {replacing && (
              <div className="space-y-1.5 bg-[#262626] p-3 rounded-xl border border-[#3D3D3D]">
                <div className="flex justify-between text-[11px]">
                  <span className="text-[#C19B48] font-semibold">Uploading document...</span>
                  <span className="font-mono text-[#F7F3E6]">{replaceProgress}%</span>
                </div>
                <div className="w-full h-2 bg-[#1E1E1E] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#C19B48] transition-all duration-200"
                    style={{ width: `${replaceProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[#C19B48] text-[11px] leading-relaxed">
              <strong>Notice:</strong> Uploading or replacing this file will update the PDF document
              immediately for students accessing or downloading this landmark judgment.
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#3D3D3D]">
              <button
                type="button"
                onClick={onClose}
                disabled={replacing}
                className="px-4 py-2 rounded-xl bg-[#262626] hover:bg-[#3D3D3D] text-[#A8A294] hover:text-[#F7F3E6] font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={replacing || !newFile}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#C19B48] hover:bg-[#D8B862] text-[#1E1E1E] font-bold transition-colors shadow-md disabled:opacity-50 cursor-pointer"
              >
                {replacing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                <span>{replacing ? 'Uploading...' : 'Save PDF Document'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

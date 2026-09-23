import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Loader2,
  CheckCircle2,
  Scale,
  Plus,
  Trash2,
  Calendar,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { uploadJudgement } from '../../services/judgement.service';
import type {
  CourtCategory,
  JudgementImportance,
  JudgementStatus,
  IKeyHolding,
  ILegalProvisionRef,
} from '../../types/judgement.types';
import { toast } from 'react-hot-toast';

interface UploadJudgementModalProps {
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
  { label: 'Published (Live)', value: 'published' },
  { label: 'Scheduled (Future Daily)', value: 'scheduled' },
  { label: 'Draft (In Review)', value: 'draft' },
  { label: 'Archived', value: 'archived' },
];

const getTodayDateIST = (): string => {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
};

export const UploadJudgementModal: React.FC<UploadJudgementModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [citation, setCitation] = useState('');
  const [court, setCourt] = useState<CourtCategory>('Supreme Court of India');
  const [bench, setBench] = useState('Division Bench (2 Judges)');
  const [benchStrength, setBenchStrength] = useState('3-Judge Bench');
  const [judges, setJudges] = useState('');
  const [dateOfJudgement, setDateOfJudgement] = useState(getTodayDateIST());
  const [subject, setSubject] = useState('Constitutional Law');
  const [category, setCategory] = useState('Constitutional Criminal Jurisprudence');
  const [sourceReference, setSourceReference] = useState('');
  const [summary, setSummary] = useState('');

  // Daily Judgment of the Day Scheduling
  const [dailyDateIST, setDailyDateIST] = useState(getTodayDateIST());
  const [isDailyFeatured, setIsDailyFeatured] = useState(false);
  const [priority, setPriority] = useState(1);
  const [status, setStatus] = useState<JudgementStatus>('published');

  // Key Legal Principles / Holdings (Structured)
  const [keyHoldings, setKeyHoldings] = useState<IKeyHolding[]>([
    { title: 'Involuntary Administration:', text: '' },
    { title: 'Protection of Privacy:', text: '' },
    { title: 'Substantive Due Process:', text: '' },
  ]);

  // Relevant Articles / Sections / Acts (Structured)
  const [provisions, setProvisions] = useState<ILegalProvisionRef[]>([
    { label: 'Article 20(3)', actOrCode: 'Constitution of India, 1950', badgeColor: 'amber' },
    { label: 'Article 21', actOrCode: 'Right to Privacy & Due Process', badgeColor: 'blue' },
  ]);

  // Full In-Depth Analysis (Markdown)
  const [fullAnalysis, setFullAnalysis] = useState('');

  const [mainsUtility, setMainsUtility] = useState('');
  const [overruledPrecedents, setOverruledPrecedents] = useState('');
  const [tags, setTags] = useState('');
  const [importance, setImportance] = useState<JudgementImportance>('Landmark');
  const [isFeatured, setIsFeatured] = useState(false);

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const dropped = e.dataTransfer.files[0];
      if (dropped.type === 'application/pdf' || dropped.name.endsWith('.pdf')) {
        setFile(dropped);
      } else {
        toast.error('Only PDF documents (.pdf) are permitted.');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.type === 'application/pdf' || selected.name.endsWith('.pdf')) {
        setFile(selected);
      } else {
        toast.error('Only PDF documents (.pdf) are permitted.');
      }
    }
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Case name / title is required.');
      return;
    }
    if (!citation.trim()) {
      toast.error('Legal citation is required.');
      return;
    }
    if (!summary.trim()) {
      toast.error('Executive case summary is required.');
      return;
    }

    try {
      setUploading(true);
      setProgress(0);

      const formData = new FormData();
      // Optional PDF
      if (file) {
        formData.append('pdf', file);
      }

      formData.append('title', title.trim());
      formData.append('citation', citation.trim());
      formData.append('court', court);
      formData.append('bench', bench.trim());
      formData.append('benchStrength', benchStrength.trim() || bench.trim());
      formData.append('judges', judges.trim());
      formData.append('dateOfJudgement', dateOfJudgement);
      formData.append('subject', subject.trim());
      formData.append('category', category.trim() || subject.trim());
      formData.append('summary', summary.trim());
      formData.append('sourceReference', sourceReference.trim());

      // Key Holdings
      const validHoldings = keyHoldings.filter((k) => k.title.trim() || k.text.trim());
      formData.append('keyHoldings', JSON.stringify(validHoldings));
      formData.append(
        'ratioDecidendi',
        JSON.stringify(validHoldings.map((k) => `${k.title} ${k.text}`.trim()))
      );

      // Provisions
      const validProvisions = provisions.filter((p) => p.label.trim());
      formData.append('provisions', JSON.stringify(validProvisions));
      formData.append(
        'legalProvisions',
        validProvisions.map((p) => p.label.trim()).join(', ')
      );

      // Markdown Full Analysis
      formData.append('fullAnalysis', fullAnalysis.trim());

      // Scheduling & Status
      formData.append('status', status);
      formData.append('dailyDateIST', dailyDateIST.trim());
      formData.append('isDailyFeatured', String(isDailyFeatured));
      formData.append('priority', String(priority));
      formData.append('isPublished', String(status === 'published'));

      formData.append('mainsUtility', mainsUtility.trim());
      formData.append('overruledPrecedents', overruledPrecedents.trim());
      formData.append('tags', tags.trim());
      formData.append('importance', importance);
      formData.append('isFeatured', String(isFeatured));

      const res = await uploadJudgement(formData, (percent) => {
        setProgress(percent);
      });

      if (res.success) {
        toast.success('Landmark Judgement created successfully!');
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      console.error('Upload failed:', err);
      toast.error(err?.response?.data?.message || 'Failed to upload judgement.');
    } finally {
      setUploading(false);
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
                Upload Landmark Judgement & Daily Digest
              </h2>
              <p className="text-xs text-[#A8A294]">
                Authoritative precedent digest with holdings, legal provisions, scheduling, and optional PDF
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={uploading}
            className="p-1.5 rounded-lg text-[#A8A294] hover:text-[#F7F3E6] hover:bg-[#3D3D3D] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* Scheduling & Publication Status Bar */}
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

          {/* Optional File Drag-and-Drop Area */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-semibold text-[#F7F3E6]">
                Judgement PDF Document <span className="text-[#A8A294] font-normal">(Optional)</span>
              </label>
              {file && (
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="text-[11px] text-red-400 hover:underline cursor-pointer"
                >
                  Remove attached file
                </button>
              )}
            </div>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                dragActive
                  ? 'border-[#C19B48] bg-[#C19B48]/10'
                  : file
                  ? 'border-emerald-500/60 bg-emerald-950/10'
                  : 'border-[#3D3D3D] hover:border-[#C19B48]/50 bg-[#262626]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              {file ? (
                <div className="flex items-center justify-center gap-3 text-emerald-400">
                  <CheckCircle2 className="w-6 h-6" />
                  <div className="text-left">
                    <p className="font-semibold text-sm text-[#F7F3E6]">{file.name}</p>
                    <p className="text-[11px] text-[#A8A294]">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB • Ready to upload
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <Upload className="w-5 h-5 text-[#C19B48] mx-auto" />
                  <p className="text-[#F7F3E6] font-medium text-xs">
                    Drop Judgement PDF here or click to browse (Optional)
                  </p>
                  <p className="text-[10px] text-[#A8A294]">
                    If omitted, the case law will use the dynamic HTML brief and structured ratio
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Progress bar if uploading */}
          {uploading && (
            <div className="space-y-1.5 bg-[#262626] p-3 rounded-xl border border-[#3D3D3D]">
              <div className="flex justify-between text-[11px]">
                <span className="text-[#C19B48] font-semibold">Uploading document...</span>
                <span className="font-mono text-[#F7F3E6]">{progress}%</span>
              </div>
              <div className="w-full h-2 bg-[#1E1E1E] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#C19B48] transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Core Case Identification Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-[#F7F3E6] mb-1">
                Case Name / Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Selvi & Ors. v. State of Karnataka"
                required
                className="w-full px-3.5 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] placeholder-[#A8A294]/60 focus:outline-none focus:border-[#C19B48]"
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
                placeholder="e.g. (2010) 7 SCC 263"
                required
                className="w-full px-3.5 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] placeholder-[#A8A294]/60 focus:outline-none focus:border-[#C19B48]"
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
                placeholder="e.g. 3-Judge Bench or 5-Judge Constitution Bench"
                className="w-full px-3.5 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] placeholder-[#A8A294]/60 focus:outline-none focus:border-[#C19B48]"
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
                placeholder="e.g. 3-Judge Bench"
                className="w-full px-3.5 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] placeholder-[#A8A294]/60 focus:outline-none focus:border-[#C19B48]"
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
                className="w-full px-3.5 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] placeholder-[#A8A294]/60 focus:outline-none focus:border-[#C19B48]"
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
                placeholder="e.g. Constitutional Law / Evidence Act"
                required
                className="w-full px-3.5 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] placeholder-[#A8A294]/60 focus:outline-none focus:border-[#C19B48]"
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
                placeholder="e.g. K.G. Balakrishnan, C.J., R.V. Raveendran, J., J.M. Panchal, J."
                className="w-full px-3.5 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] placeholder-[#A8A294]/60 focus:outline-none focus:border-[#C19B48]"
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
                className="w-full px-3.5 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] placeholder-[#A8A294]/60 focus:outline-none focus:border-[#C19B48]"
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
              placeholder="Crisp high-level summary of dispute, contentions, and holding..."
              required
              className="w-full px-3.5 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] placeholder-[#A8A294]/60 focus:outline-none focus:border-[#C19B48]"
            />
          </div>

          {/* Key Legal Principles / Holdings (Reference UI Holding Bullets) */}
          <div className="p-4 rounded-xl bg-[#262626] border border-[#3D3D3D] space-y-3">
            <div className="flex items-center justify-between">
              <span className="block font-bold text-[#C19B48] uppercase text-[11px] tracking-wider">
                Key Legal Principles & Holdings (Formatted with Bold Title & Text)
              </span>
              <button
                type="button"
                onClick={handleAddHolding}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#C19B48]/15 border border-[#C19B48]/30 text-[#C19B48] hover:bg-[#C19B48]/25 text-[11px] font-semibold cursor-pointer transition-colors"
              >
                <Plus className="w-3 h-3" />
                <span>Add Holding</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {keyHoldings.map((holding, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 bg-[#1E1E1E] p-2.5 rounded-xl border border-[#3D3D3D]"
                >
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-[#C19B48] font-bold text-[10px] flex items-center justify-center shrink-0 mt-1">
                    {idx + 1}
                  </span>

                  <div className="flex-1 space-y-1.5">
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

          {/* Relevant Articles / Sections / Acts (Dual-law Provision Badges) */}
          <div className="p-4 rounded-xl bg-[#262626] border border-[#3D3D3D] space-y-3">
            <div className="flex items-center justify-between">
              <span className="block font-bold text-[#C19B48] uppercase text-[11px] tracking-wider">
                Relevant Articles / Sections / Acts (Dual-Law Badges)
              </span>
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

          {/* Full In-Depth Analysis (Markdown Dossier) */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-[#F7F3E6]">
              <BookOpen className="w-4 h-4 text-[#C19B48]" />
              <span>Full Judgment Analysis Dossier (Markdown Supported)</span>
            </div>
            <textarea
              value={fullAnalysis}
              onChange={(e) => setFullAnalysis(e.target.value)}
              rows={5}
              placeholder="Comprehensive analytical brief, ratio decidendi breakdown, constitutional matrix, landmark precedents comparison, and examination takeaways..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] font-mono text-xs placeholder-[#A8A294]/60 focus:outline-none focus:border-[#C19B48]"
            />
          </div>

          {/* Mains Answer Utility & Overruled Precedents */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-[#F7F3E6] mb-1">Mains Exam Utility Note</label>
              <textarea
                value={mainsUtility}
                onChange={(e) => setMainsUtility(e.target.value)}
                rows={2}
                placeholder="Direct application in Mains GS-II or Law Optional..."
                className="w-full px-3.5 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] placeholder-[#A8A294]/60 focus:outline-none focus:border-[#C19B48]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#F7F3E6] mb-1">Overruled Precedents</label>
              <textarea
                value={overruledPrecedents}
                onChange={(e) => setOverruledPrecedents(e.target.value)}
                rows={2}
                placeholder="e.g. Overruled or distinguished cases..."
                className="w-full px-3.5 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] placeholder-[#A8A294]/60 focus:outline-none focus:border-[#C19B48]"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block font-semibold text-[#F7F3E6] mb-1">
              Search Tags (Comma separated)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g. Article 20(3), Narco Analysis, Right to Silence, Selvi"
              className="w-full px-3.5 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] placeholder-[#A8A294]/60 focus:outline-none focus:border-[#C19B48]"
            />
          </div>

          {/* Precedent Spotlight Checkbox */}
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

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#3D3D3D]">
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="px-4 py-2 rounded-xl bg-[#262626] hover:bg-[#3D3D3D] text-[#A8A294] hover:text-[#F7F3E6] font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#C19B48] hover:bg-[#D8B862] text-[#1E1E1E] font-bold transition-colors shadow-md disabled:opacity-50 cursor-pointer"
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              <span>{uploading ? 'Saving Precedent...' : 'Save & Publish Precedent'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

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
} from 'lucide-react';
import type {
  JudgementDigest,
  CourtCategory,
  JudgementImportance,
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

export const EditJudgementModal: React.FC<EditJudgementModalProps> = ({
  judgement,
  isOpen,
  onClose,
  onSuccess,
}) => {
  if (!isOpen || !judgement) return null;

  const [activeTab, setActiveTab] = useState<'metadata' | 'replace-file'>('metadata');

  // Metadata form states
  const [title, setTitle] = useState(judgement.title);
  const [citation, setCitation] = useState(judgement.citation);
  const [court, setCourt] = useState<CourtCategory>(judgement.court);
  const [bench, setBench] = useState(judgement.bench || 'Division Bench (2 Judges)');
  const [judges, setJudges] = useState(judgement.judges?.join(', ') || '');
  const [dateOfJudgement, setDateOfJudgement] = useState(
    judgement.dateOfJudgement ? new Date(judgement.dateOfJudgement).toISOString().split('T')[0] : ''
  );
  const [subject, setSubject] = useState(judgement.subject);
  const [legalProvisions, setLegalProvisions] = useState(judgement.legalProvisions?.join(', ') || '');
  const [summary, setSummary] = useState(judgement.summary);
  const [ratio1, setRatio1] = useState(judgement.ratioDecidendi?.[0] || '');
  const [ratio2, setRatio2] = useState(judgement.ratioDecidendi?.[1] || '');
  const [ratio3, setRatio3] = useState(judgement.ratioDecidendi?.[2] || '');
  const [mainsUtility, setMainsUtility] = useState(judgement.mainsUtility || '');
  const [overruledPrecedents, setOverruledPrecedents] = useState(judgement.overruledPrecedents || '');
  const [tags, setTags] = useState(judgement.tags?.join(', ') || '');
  const [importance, setImportance] = useState<JudgementImportance>(judgement.importance);
  const [isFeatured, setIsFeatured] = useState(judgement.isFeatured);

  const [saving, setSaving] = useState(false);

  // File replacement states
  const [newFile, setNewFile] = useState<File | null>(null);
  const [replacing, setReplacing] = useState(false);
  const [replaceProgress, setReplaceProgress] = useState(0);
  const replaceInputRef = useRef<HTMLInputElement>(null);

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
      const ratioArray = [ratio1.trim(), ratio2.trim(), ratio3.trim()].filter(Boolean);
      const judgesArray = judges.split(',').map((j) => j.trim()).filter(Boolean);
      const provisionsArray = legalProvisions.split(',').map((p) => p.trim()).filter(Boolean);
      const tagsArray = tags.split(',').map((t) => t.trim()).filter(Boolean);

      const res = await updateJudgement(judgement._id, {
        title: title.trim(),
        citation: citation.trim(),
        court,
        bench: bench.trim(),
        judges: judgesArray,
        dateOfJudgement,
        subject: subject.trim(),
        legalProvisions: provisionsArray,
        summary: summary.trim(),
        ratioDecidendi: ratioArray,
        mainsUtility: mainsUtility.trim(),
        overruledPrecedents: overruledPrecedents.trim(),
        tags: tagsArray,
        importance,
        isFeatured,
      });

      if (res.success) {
        toast.success('Precedent metadata updated successfully!');
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
      toast.error('Please select a revised PDF document.');
      return;
    }

    try {
      setReplacing(true);
      setReplaceProgress(0);

      const res = await replaceJudgementPdf(judgement._id, newFile, (pct) => {
        setReplaceProgress(pct);
      });

      if (res.success) {
        toast.success('PDF document replaced successfully!');
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
      <div className="relative w-full max-w-3xl my-8 bg-[#1E1E1E] rounded-2xl border border-[#3D3D3D] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
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
                Update metadata, ratio points, or replace PDF document file
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={saving || replacing}
            className="p-1.5 rounded-lg text-[#A8A294] hover:text-[#F7F3E6] hover:bg-[#3D3D3D] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-4 px-6 border-b border-[#3D3D3D] bg-[#1E1E1E]">
          <button
            type="button"
            onClick={() => setActiveTab('metadata')}
            className={`py-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'metadata'
                ? 'border-[#C19B48] text-[#C19B48]'
                : 'border-transparent text-[#A8A294] hover:text-[#F7F3E6]'
            }`}
          >
            Case Metadata & 3-Point Ratio
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('replace-file')}
            className={`py-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'replace-file'
                ? 'border-[#C19B48] text-[#C19B48]'
                : 'border-transparent text-[#A8A294] hover:text-[#F7F3E6]'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Replace PDF Document</span>
          </button>
        </div>

        {/* Tab 1: Metadata Form */}
        {activeTab === 'metadata' && (
          <form onSubmit={handleMetadataSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
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
                  Coram Judges (Comma separated)
                </label>
                <input
                  type="text"
                  value={judges}
                  onChange={(e) => setJudges(e.target.value)}
                  placeholder="e.g. S.M. Sikri, C.J., H.R. Khanna, J."
                  className="w-full px-3.5 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-[#F7F3E6] mb-1">
                  Legal Provisions (Comma separated)
                </label>
                <input
                  type="text"
                  value={legalProvisions}
                  onChange={(e) => setLegalProvisions(e.target.value)}
                  placeholder="e.g. Article 368, Article 13"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#F7F3E6] mb-1">
                Executive Summary <span className="text-red-400">*</span>
              </label>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={3}
                required
                className="w-full px-3.5 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
              />
            </div>

            {/* 3-Point Ratio Decidendi */}
            <div className="p-4 rounded-xl bg-[#262626] border border-[#3D3D3D] space-y-3">
              <span className="block font-bold text-[#C19B48] uppercase text-[11px] tracking-wider">
                3-Point Ratio Decidendi
              </span>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#C19B48]/20 text-[#C19B48] font-mono font-bold text-[10px] flex items-center justify-center shrink-0">
                    I
                  </span>
                  <input
                    type="text"
                    value={ratio1}
                    onChange={(e) => setRatio1(e.target.value)}
                    placeholder="Point 1"
                    className="flex-1 px-3 py-1.5 rounded-lg bg-[#1E1E1E] border border-[#3D3D3D] text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#C19B48]/20 text-[#C19B48] font-mono font-bold text-[10px] flex items-center justify-center shrink-0">
                    II
                  </span>
                  <input
                    type="text"
                    value={ratio2}
                    onChange={(e) => setRatio2(e.target.value)}
                    placeholder="Point 2"
                    className="flex-1 px-3 py-1.5 rounded-lg bg-[#1E1E1E] border border-[#3D3D3D] text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#C19B48]/20 text-[#C19B48] font-mono font-bold text-[10px] flex items-center justify-center shrink-0">
                    III
                  </span>
                  <input
                    type="text"
                    value={ratio3}
                    onChange={(e) => setRatio3(e.target.value)}
                    placeholder="Point 3"
                    className="flex-1 px-3 py-1.5 rounded-lg bg-[#1E1E1E] border border-[#3D3D3D] text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
                  />
                </div>
              </div>
            </div>

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

            <div>
              <label className="block font-semibold text-[#F7F3E6] mb-1">Tags (Comma separated)</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
              />
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="rounded border-[#3D3D3D] text-[#C19B48] focus:ring-[#C19B48] w-4 h-4 bg-[#262626]"
                />
                <span className="text-[#C19B48] font-medium">Spotlight as Precedent of the Day</span>
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
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Replace PDF Document */}
        {activeTab === 'replace-file' && (
          <form onSubmit={handleFileReplace} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
            {/* Current File Information */}
            <div className="p-4 rounded-xl bg-[#262626] border border-[#3D3D3D] space-y-2">
              <span className="text-[#A8A294] font-semibold uppercase text-[10px] tracking-wider block">
                Current PDF Document on Disk
              </span>
              <div className="flex items-center justify-between text-[#F7F3E6]">
                <div className="flex items-center gap-2 truncate">
                  <FileText className="w-4 h-4 text-[#C19B48] shrink-0" />
                  <span className="font-mono truncate">{judgement.pdfFile?.originalName}</span>
                </div>
                <span className="font-mono text-xs text-[#A8A294]">
                  {judgement.pdfFile?.sizeFormatted}
                </span>
              </div>
            </div>

            {/* Revised File Picker */}
            <div>
              <label className="block font-semibold text-[#F7F3E6] mb-1.5">
                Select Revised Judgement PDF <span className="text-red-400">*</span>
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
                        {(newFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to replace
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-7 h-7 text-[#C19B48] mx-auto" />
                    <p className="text-[#F7F3E6] font-medium">Click to select revised PDF document</p>
                    <p className="text-[11px] text-[#A8A294]">PDF format up to 50MB</p>
                  </div>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            {replacing && (
              <div className="space-y-1.5 bg-[#262626] p-3 rounded-xl border border-[#3D3D3D]">
                <div className="flex justify-between text-[11px]">
                  <span className="text-[#C19B48] font-semibold">Replacing document...</span>
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
              <strong>Notice:</strong> Replacing this file will overwrite the existing PDF document
              permanently on disk. Students accessing or downloading this case law will receive the
              revised document immediately.
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
                <span>{replacing ? 'Uploading Replacement...' : 'Replace PDF File'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

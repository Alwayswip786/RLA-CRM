import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Loader2,
  CheckCircle2,
  Scale,
} from 'lucide-react';
import { uploadJudgement } from '../../services/judgement.service';
import type { CourtCategory, JudgementImportance } from '../../types/judgement.types';
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
  const [judges, setJudges] = useState('');
  const [dateOfJudgement, setDateOfJudgement] = useState(new Date().toISOString().split('T')[0]);
  const [subject, setSubject] = useState('Constitutional Law');
  const [legalProvisions, setLegalProvisions] = useState('');
  const [summary, setSummary] = useState('');
  // 3-Point Ratio Decidendi
  const [ratio1, setRatio1] = useState('');
  const [ratio2, setRatio2] = useState('');
  const [ratio3, setRatio3] = useState('');
  const [mainsUtility, setMainsUtility] = useState('');
  const [overruledPrecedents, setOverruledPrecedents] = useState('');
  const [tags, setTags] = useState('');
  const [importance, setImportance] = useState<JudgementImportance>('Landmark');
  const [isPublished, setIsPublished] = useState(true);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      toast.error('Please select or drop a Judgement PDF document.');
      return;
    }
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
      formData.append('pdf', file);
      formData.append('title', title.trim());
      formData.append('citation', citation.trim());
      formData.append('court', court);
      formData.append('bench', bench.trim());
      formData.append('judges', judges.trim());
      formData.append('dateOfJudgement', dateOfJudgement);
      formData.append('subject', subject.trim());
      formData.append('legalProvisions', legalProvisions.trim());
      formData.append('summary', summary.trim());

      const ratioDecidendiArray = [ratio1.trim(), ratio2.trim(), ratio3.trim()].filter(Boolean);
      formData.append('ratioDecidendi', JSON.stringify(ratioDecidendiArray));

      formData.append('mainsUtility', mainsUtility.trim());
      formData.append('overruledPrecedents', overruledPrecedents.trim());
      formData.append('tags', tags.trim());
      formData.append('importance', importance);
      formData.append('isPublished', String(isPublished));
      formData.append('isFeatured', String(isFeatured));

      const res = await uploadJudgement(formData, (percent) => {
        setProgress(percent);
      });

      if (res.success) {
        toast.success('Landmark Judgement uploaded successfully!');
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
      <div className="relative w-full max-w-3xl my-8 bg-[#1E1E1E] rounded-2xl border border-[#3D3D3D] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#262626] border-b border-[#3D3D3D]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#C19B48]/15 text-[#C19B48] border border-[#C19B48]/30">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-serif font-bold text-[#F7F3E6]">
                Upload Landmark Judgement Digest
              </h2>
              <p className="text-xs text-[#A8A294]">
                Authoritative precedent digest with 3-point ratio and Mains exam value-add
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={uploading}
            className="p-1.5 rounded-lg text-[#A8A294] hover:text-[#F7F3E6] hover:bg-[#3D3D3D] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {/* File Drag-and-Drop Area */}
          <div>
            <label className="block font-semibold text-[#F7F3E6] mb-1.5">
              Judgement Digest PDF Document <span className="text-red-400">*</span>
            </label>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
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
                <div className="space-y-2">
                  <Upload className="w-7 h-7 text-[#C19B48] mx-auto" />
                  <p className="text-[#F7F3E6] font-medium">
                    Click to browse or drag & drop Judgement PDF file here
                  </p>
                  <p className="text-[11px] text-[#A8A294]">PDF format up to 50MB</p>
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
                placeholder="e.g. Kesavananda Bharati v. State of Kerala"
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
                placeholder="e.g. (1973) 4 SCC 225 | AIR 1973 SC 1461"
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
                Coram / Bench Composition
              </label>
              <input
                type="text"
                value={bench}
                onChange={(e) => setBench(e.target.value)}
                placeholder="e.g. 13-Judge Constitutional Bench"
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
                Subject Area <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Constitutional Law / CrPC / CPC"
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
                placeholder="e.g. S.M. Sikri, C.J., H.R. Khanna, J., Y.V. Chandrachud, J."
                className="w-full px-3.5 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] placeholder-[#A8A294]/60 focus:outline-none focus:border-[#C19B48]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-[#F7F3E6] mb-1">
                Legal Provisions / Sections (Comma separated)
              </label>
              <input
                type="text"
                value={legalProvisions}
                onChange={(e) => setLegalProvisions(e.target.value)}
                placeholder="e.g. Article 368, Article 13, Section 41 CrPC"
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

          {/* 3-Point Ratio Decidendi Formulation */}
          <div className="p-4 rounded-xl bg-[#262626] border border-[#3D3D3D] space-y-3">
            <span className="block font-bold text-[#C19B48] uppercase text-[11px] tracking-wider">
              3-Point Ratio Decidendi (Formulated for Mains Answers)
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
                  placeholder="Point 1: Primary constitutional or statutory holding..."
                  className="flex-1 px-3 py-1.5 rounded-lg bg-[#1E1E1E] border border-[#3D3D3D] text-[#F7F3E6] placeholder-[#A8A294]/60 focus:outline-none focus:border-[#C19B48]"
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
                  placeholder="Point 2: Secondary holding / scope of limitation..."
                  className="flex-1 px-3 py-1.5 rounded-lg bg-[#1E1E1E] border border-[#3D3D3D] text-[#F7F3E6] placeholder-[#A8A294]/60 focus:outline-none focus:border-[#C19B48]"
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
                  placeholder="Point 3: Standard of scrutiny or binding guideline..."
                  className="flex-1 px-3 py-1.5 rounded-lg bg-[#1E1E1E] border border-[#3D3D3D] text-[#F7F3E6] placeholder-[#A8A294]/60 focus:outline-none focus:border-[#C19B48]"
                />
              </div>
            </div>
          </div>

          {/* Mains Answer Utility & Overruled Precedents */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-[#F7F3E6] mb-1">Mains Exam Utility Note</label>
              <textarea
                value={mainsUtility}
                onChange={(e) => setMainsUtility(e.target.value)}
                rows={2}
                placeholder="e.g. Directly cited in judicial mains paper for questions concerning Article 368 vs Article 13..."
                className="w-full px-3.5 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] placeholder-[#A8A294]/60 focus:outline-none focus:border-[#C19B48]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#F7F3E6] mb-1">Overruled Precedents</label>
              <textarea
                value={overruledPrecedents}
                onChange={(e) => setOverruledPrecedents(e.target.value)}
                rows={2}
                placeholder="e.g. Overruled I.C. Golaknath v. State of Punjab (1967)..."
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
              placeholder="e.g. Basic Structure, Judicial Review, Due Process"
              className="w-full px-3.5 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] placeholder-[#A8A294]/60 focus:outline-none focus:border-[#C19B48]"
            />
          </div>

          {/* Publication & Spotlight Toggles */}
          <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-[#3D3D3D]">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="rounded border-[#3D3D3D] text-[#C19B48] focus:ring-[#C19B48] w-4 h-4 bg-[#262626]"
              />
              <span className="text-[#F7F3E6] font-medium">Publish immediately to Student Vault</span>
            </label>

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
              <span>{uploading ? 'Publishing Precedent...' : 'Upload & Publish Precedent'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

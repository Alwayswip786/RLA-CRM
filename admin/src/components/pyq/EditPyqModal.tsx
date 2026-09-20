import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  FileEdit,
  FileText,
  UploadCloud,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import type { PyqPaper } from '../../types/pyq.types';
import { updatePyq, replacePyqPdf } from '../../services/pyq.service';
import { toast } from 'react-hot-toast';

interface EditPyqModalProps {
  paper: PyqPaper | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const COMMON_EXAMS = [
  'Delhi Judicial Service (DJS)',
  'Delhi Higher Judicial Service (DHJS)',
  'Haryana Civil Services (Judicial)',
  'UP PCS-J Judicial Examination',
  'UP Higher Judicial Service (UP HJS)',
  'MP Civil Judge (MP CJ)',
  'Rajasthan Judicial Service (RJS)',
  'Himachal Pradesh Judicial Service (HPJS)',
  'Punjab Superior Judicial Services (PJS)',
];

export const EditPyqModal: React.FC<EditPyqModalProps> = ({
  paper,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'metadata' | 'replace'>('metadata');

  // Metadata Form State
  const [title, setTitle] = useState('');
  const [exam, setExam] = useState('');
  const [year, setYear] = useState('');
  const [stage, setStage] = useState<'Prelims' | 'Mains'>('Mains');
  const [subject, setSubject] = useState('');
  const [paperCode, setPaperCode] = useState('');
  const [totalMarks, setTotalMarks] = useState('200');
  const [durationMinutes, setDurationMinutes] = useState('180');
  const [solvedByFaculty, setSolvedByFaculty] = useState('');
  const [description, setDescription] = useState('');
  const [topicsString, setTopicsString] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);

  // Replace PDF File State
  const [replacementFile, setReplacementFile] = useState<File | null>(null);
  const [replacing, setReplacing] = useState(false);
  const [replaceProgress, setReplaceProgress] = useState(0);

  // Metadata Saving State
  const [saving, setSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (paper) {
      setTitle(paper.title || '');
      setExam(paper.exam || COMMON_EXAMS[0]);
      setYear(String(paper.year || 2024));
      setStage(paper.stage === 'Prelims' ? 'Prelims' : 'Mains');
      setSubject(paper.subject || '');
      setPaperCode(paper.paperCode || '');
      setTotalMarks(String(paper.totalMarks || 200));
      setDurationMinutes(String(paper.durationMinutes || 180));
      setSolvedByFaculty(paper.solvedByFaculty || '');
      setDescription(paper.description || '');
      setTopicsString(Array.isArray(paper.topics) ? paper.topics.join(', ') : '');
      setIsFeatured(paper.isFeatured || false);
      setReplacementFile(null);
      setActiveTab('metadata');
    }
  }, [paper]);

  if (!isOpen || !paper) return null;

  const handleMetadataSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !subject.trim() || !year) {
      toast.error('Title, subject, and year are required.');
      return;
    }

    try {
      setSaving(true);
      const parsedTopics = topicsString
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await updatePyq(paper._id, {
        title: title.trim(),
        exam: exam.trim(),
        year: parseInt(year, 10),
        stage,
        subject: subject.trim(),
        paperCode: paperCode.trim() || undefined,
        totalMarks: parseInt(totalMarks, 10) || 200,
        durationMinutes: parseInt(durationMinutes, 10) || 180,
        solvedByFaculty: solvedByFaculty.trim(),
        description: description.trim(),
        topics: parsedTopics,
        isFeatured,
      });

      if (res.success) {
        toast.success('Metadata updated successfully!');
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      console.error('Update failed:', err);
      toast.error(err?.response?.data?.message || 'Failed to update metadata.');
    } finally {
      setSaving(false);
    }
  };

  const handleReplaceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replacementFile) {
      toast.error('Please select the revised PDF file.');
      return;
    }

    try {
      setReplacing(true);
      setReplaceProgress(0);

      const res = await replacePyqPdf(paper._id, replacementFile, (pct) => {
        setReplaceProgress(pct);
      });

      if (res.success) {
        toast.success('PDF document replaced successfully!');
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      console.error('Replacement failed:', err);
      toast.error(err?.response?.data?.message || 'Failed to replace PDF file.');
    } finally {
      setReplacing(false);
      setReplaceProgress(0);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[#1E1E1E] border border-[#3D3D3D] rounded-2xl shadow-2xl overflow-hidden my-auto text-[#F7F3E6]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#3D3D3D] flex items-center justify-between bg-[#262626]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#C19B48]/15 border border-[#C19B48]/30 flex items-center justify-center text-[#C19B48]">
              <FileEdit className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold text-[#F7F3E6]">Edit Solved PYQ Paper</h2>
              <p className="text-[11px] text-[#A8A294]">
                Update metadata or replace the model answer PDF document
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#A8A294] hover:text-[#F7F3E6] hover:bg-[#3D3D3D] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[#3D3D3D] bg-[#141414] px-6">
          <button
            type="button"
            onClick={() => setActiveTab('metadata')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'metadata'
                ? 'border-[#C19B48] text-[#C19B48]'
                : 'border-transparent text-[#A8A294] hover:text-[#F7F3E6]'
            }`}
          >
            Paper Metadata
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('replace')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'replace'
                ? 'border-[#C19B48] text-[#C19B48]'
                : 'border-transparent text-[#A8A294] hover:text-[#F7F3E6]'
            }`}
          >
            Replace PDF Document
          </button>
        </div>

        {/* Tab 1: Metadata Form */}
        {activeTab === 'metadata' && (
          <form onSubmit={handleMetadataSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#A8A294]">Paper Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#141414] border border-[#3D3D3D] text-xs text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#A8A294]">Exam Category *</label>
                <select
                  value={exam}
                  onChange={(e) => setExam(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-[#3D3D3D] text-xs text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
                >
                  {COMMON_EXAMS.map((ex) => (
                    <option key={ex} value={ex}>
                      {ex}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#A8A294]">Exam Stage *</label>
                <div className="flex gap-2 pt-0.5">
                  {(['Mains', 'Prelims'] as const).map((stg) => (
                    <button
                      key={stg}
                      type="button"
                      onClick={() => setStage(stg)}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        stage === stg
                          ? 'bg-[#C19B48] text-[#1E1E1E] border-[#C19B48]'
                          : 'bg-[#141414] text-[#A8A294] border-[#3D3D3D]'
                      }`}
                    >
                      {stg}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#A8A294]">Year *</label>
                <input
                  type="number"
                  required
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#141414] border border-[#3D3D3D] text-xs text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
                />
              </div>
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-semibold text-[#A8A294]">Subject *</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#141414] border border-[#3D3D3D] text-xs text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#A8A294]">Total Marks</label>
                <input
                  type="number"
                  value={totalMarks}
                  onChange={(e) => setTotalMarks(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#141414] border border-[#3D3D3D] text-xs text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#A8A294]">Paper Code</label>
                <input
                  type="text"
                  value={paperCode}
                  onChange={(e) => setPaperCode(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#141414] border border-[#3D3D3D] text-xs text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#A8A294]">Solved by Author</label>
              <input
                type="text"
                value={solvedByFaculty}
                onChange={(e) => setSolvedByFaculty(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#141414] border border-[#3D3D3D] text-xs text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#A8A294]">
                Topics & Precedents (comma separated)
              </label>
              <input
                type="text"
                value={topicsString}
                onChange={(e) => setTopicsString(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#141414] border border-[#3D3D3D] text-xs text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#A8A294]">Description</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#141414] border border-[#3D3D3D] text-xs text-[#F7F3E6] focus:outline-none focus:border-[#C19B48] resize-none"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-[#3D3D3D]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-[#262626] hover:bg-[#333] text-xs font-semibold text-[#A8A294] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-xl bg-[#C19B48] hover:bg-[#D8B862] text-xs font-bold text-[#1E1E1E] transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Replace PDF */}
        {activeTab === 'replace' && (
          <form onSubmit={handleReplaceSubmit} className="p-6 space-y-4">
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-bold text-amber-300">File Replacement Notice</p>
                <p className="text-amber-200/80 leading-relaxed">
                  Replacing the file will overwrite the existing PDF on disk. Existing download counts and student activity history for this paper will be preserved.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#141414] border border-[#3D3D3D] space-y-1 text-xs">
              <span className="text-[#A8A294]">Current Document:</span>
              <p className="font-mono font-bold text-[#F7F3E6]">{paper.pdfFile.originalName}</p>
              <p className="text-[11px] text-[#A8A294] font-mono">{paper.pdfFile.sizeFormatted}</p>
            </div>

            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files[0]) {
                  const f = e.dataTransfer.files[0];
                  if (f.type === 'application/pdf' || f.name.endsWith('.pdf')) {
                    setReplacementFile(f);
                  } else {
                    toast.error('Only PDF documents are allowed.');
                  }
                }
              }}
              className={`p-6 rounded-xl border-2 border-dashed transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-2 ${
                replacementFile
                  ? 'border-[#C19B48] bg-[#C19B48]/10'
                  : 'border-[#3D3D3D] hover:border-[#C19B48]/60 bg-[#141414]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={(e) => e.target.files?.[0] && setReplacementFile(e.target.files[0])}
                className="hidden"
              />
              {replacementFile ? (
                <>
                  <FileText className="w-8 h-8 text-[#C19B48]" />
                  <p className="text-xs font-bold text-[#F7F3E6]">{replacementFile.name}</p>
                  <p className="text-[11px] font-mono text-[#A8A294]">
                    {(replacementFile.size / (1024 * 1024)).toFixed(2)} MB PDF
                  </p>
                  <span className="text-[10px] text-[#C19B48] underline">Click to choose another</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-8 h-8 text-[#A8A294]" />
                  <p className="text-xs font-semibold text-[#F7F3E6]">
                    Drag & drop revised PDF here or <span className="text-[#C19B48] underline">browse</span>
                  </p>
                </>
              )}
            </div>

            {replacing && (
              <div className="p-3.5 rounded-xl bg-[#C19B48]/10 border border-[#C19B48]/30 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-[#C19B48]">
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Replacing file on disk...
                  </span>
                  <span className="font-mono">{replaceProgress}%</span>
                </div>
                <div className="w-full h-2 bg-[#141414] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#C19B48] transition-all duration-200"
                    style={{ width: `${replaceProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-[#3D3D3D]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-[#262626] hover:bg-[#333] text-xs font-semibold text-[#A8A294] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={replacing || !replacementFile}
                className="px-5 py-2 rounded-xl bg-[#C19B48] hover:bg-[#D8B862] text-xs font-bold text-[#1E1E1E] transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {replacing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                <span>Replace PDF File</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

import React, { useState, useRef } from 'react';
import {
  X,
  UploadCloud,
  FileText,
  Image,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { uploadPyq } from '../../services/pyq.service';
import { toast } from 'react-hot-toast';

interface UploadPyqModalProps {
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

export const UploadPyqModal: React.FC<UploadPyqModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [title, setTitle] = useState('');
  const [exam, setExam] = useState(COMMON_EXAMS[0]);
  const [customExam, setCustomExam] = useState('');
  const [year, setYear] = useState('2024');
  const [stage, setStage] = useState<'Prelims' | 'Mains'>('Mains');
  const [subject, setSubject] = useState('');
  const [paperCode, setPaperCode] = useState('');
  const [totalMarks, setTotalMarks] = useState('200');
  const [durationMinutes, setDurationMinutes] = useState('180');
  const [solvedByFaculty, setSolvedByFaculty] = useState('Adv. Rajinder Sir & Senior Faculty Board');
  const [description, setDescription] = useState('');
  const [topicsString, setTopicsString] = useState('');
  const [isPublished, setIsPublished] = useState(true);

  // Files
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const pdfInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handlePdfSelect = (file: File) => {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Only PDF documents (.pdf) are permitted.');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      toast.error('PDF file exceeds 50MB limit.');
      return;
    }
    setPdfFile(file);
  };

  const handleThumbSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are allowed for thumbnails.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Thumbnail exceeds 5MB limit.');
      return;
    }
    setThumbnailFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!pdfFile) {
      toast.error('Please select the Solved Question Paper PDF file.');
      return;
    }

    const finalExam = exam === 'Other' ? customExam.trim() : exam;
    if (!finalExam) {
      toast.error('Judicial exam name is required.');
      return;
    }

    if (!title.trim() || !subject.trim() || !year) {
      toast.error('Title, subject, and exam year are required.');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append('pdf', pdfFile);
      if (thumbnailFile) {
        formData.append('thumbnail', thumbnailFile);
      }

      formData.append('title', title.trim());
      formData.append('exam', finalExam);
      formData.append('year', year);
      formData.append('stage', stage);
      formData.append('subject', subject.trim());
      if (paperCode.trim()) formData.append('paperCode', paperCode.trim());
      formData.append('totalMarks', totalMarks);
      formData.append('durationMinutes', durationMinutes);
      formData.append('solvedByFaculty', solvedByFaculty.trim());
      formData.append('description', description.trim());
      formData.append('topics', topicsString.trim());
      formData.append('isPublished', String(isPublished));

      const res = await uploadPyq(formData, (pct) => {
        setUploadProgress(pct);
      });

      if (res.success) {
        toast.success('Solved PYQ paper uploaded successfully!');
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      console.error('Upload failed:', err);
      toast.error(err?.response?.data?.message || 'Failed to upload paper.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[#1E1E1E] border border-[#3D3D3D] rounded-2xl shadow-2xl overflow-hidden my-auto text-[#F7F3E6]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#3D3D3D] flex items-center justify-between bg-[#262626]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#C19B48]/15 border border-[#C19B48]/30 flex items-center justify-center text-[#C19B48]">
              <UploadCloud className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold text-[#F7F3E6]">
                Upload Solved Question Paper
              </h2>
              <p className="text-[11px] text-[#A8A294]">
                Upload PDF model answers with legal metadata & judicial classification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={uploading}
            className="p-1.5 rounded-lg text-[#A8A294] hover:text-[#F7F3E6] hover:bg-[#3D3D3D] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* PDF Dropzone */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#A8A294] flex items-center justify-between">
              <span>Solved PDF Document *</span>
              <span className="text-[11px] text-[#C19B48]">Max 50MB</span>
            </label>
            <div
              onClick={() => pdfInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files[0]) handlePdfSelect(e.dataTransfer.files[0]);
              }}
              className={`p-5 rounded-xl border-2 border-dashed transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-2 ${
                pdfFile
                  ? 'border-[#C19B48] bg-[#C19B48]/10'
                  : 'border-[#3D3D3D] hover:border-[#C19B48]/60 bg-[#141414]'
              }`}
            >
              <input
                ref={pdfInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={(e) => e.target.files?.[0] && handlePdfSelect(e.target.files[0])}
                className="hidden"
              />
              {pdfFile ? (
                <>
                  <FileText className="w-8 h-8 text-[#C19B48]" />
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-[#F7F3E6] truncate max-w-sm">
                      {pdfFile.name}
                    </p>
                    <p className="text-[11px] font-mono text-[#A8A294]">
                      {(pdfFile.size / (1024 * 1024)).toFixed(2)} MB PDF
                    </p>
                  </div>
                  <span className="text-[10px] text-[#C19B48] underline">Click to change file</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-8 h-8 text-[#A8A294]" />
                  <p className="text-xs font-semibold text-[#F7F3E6]">
                    Drag & drop PDF here or <span className="text-[#C19B48] underline">browse</span>
                  </p>
                  <p className="text-[10px] text-[#A8A294]">Official solved question paper PDF</p>
                </>
              )}
            </div>
          </div>

          {/* Paper Title */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#A8A294]">Paper Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. DJS 2023 Mains Civil Law I & II Model Solved Paper"
              className="w-full px-3.5 py-2 rounded-xl bg-[#141414] border border-[#3D3D3D] text-xs text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
            />
          </div>

          {/* Row: Exam & Stage */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#A8A294]">Judicial Exam Category *</label>
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
                <option value="Other">Other / Custom Exam</option>
              </select>
            </div>

            {exam === 'Other' && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#A8A294]">Specify Exam Name *</label>
                <input
                  type="text"
                  required
                  value={customExam}
                  onChange={(e) => setCustomExam(e.target.value)}
                  placeholder="e.g. Jharkhand Judicial Service"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#141414] border border-[#3D3D3D] text-xs text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
                />
              </div>
            )}

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

          {/* Row: Year & Subject */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#A8A294]">Year *</label>
              <input
                type="number"
                required
                min="2010"
                max="2035"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#141414] border border-[#3D3D3D] text-xs text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
              />
            </div>

            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-[#A8A294]">Subject / Law Syllabus *</label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Civil Law I (CPC, Contract, TPA, SRA)"
                className="w-full px-3.5 py-2 rounded-xl bg-[#141414] border border-[#3D3D3D] text-xs text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
              />
            </div>
          </div>

          {/* Row: Marks & Duration & Paper Code */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
              <label className="text-xs font-semibold text-[#A8A294]">Duration (Minutes)</label>
              <input
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#141414] border border-[#3D3D3D] text-xs text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#A8A294]">Paper Code (Optional)</label>
              <input
                type="text"
                value={paperCode}
                onChange={(e) => setPaperCode(e.target.value)}
                placeholder="e.g. DJS-M-2023-LAW1"
                className="w-full px-3.5 py-2 rounded-xl bg-[#141414] border border-[#3D3D3D] text-xs text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
              />
            </div>
          </div>

          {/* Solved by Faculty */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#A8A294]">Model Solutions Author</label>
            <input
              type="text"
              value={solvedByFaculty}
              onChange={(e) => setSolvedByFaculty(e.target.value)}
              placeholder="e.g. Adv. Rajinder Sir & Senior Faculty Board"
              className="w-full px-3.5 py-2 rounded-xl bg-[#141414] border border-[#3D3D3D] text-xs text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
            />
          </div>

          {/* Topics */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#A8A294]">
              Key Topics & Precedents (comma separated)
            </label>
            <input
              type="text"
              value={topicsString}
              onChange={(e) => setTopicsString(e.target.value)}
              placeholder="e.g. Section 11 Res Judicata, Mahboob Sahab, Order 39 Injunctions"
              className="w-full px-3.5 py-2 rounded-xl bg-[#141414] border border-[#3D3D3D] text-xs text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#A8A294]">Description & Overview</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Overview of the paper, examiner guidelines, model drafting pointers..."
              className="w-full px-3.5 py-2 rounded-xl bg-[#141414] border border-[#3D3D3D] text-xs text-[#F7F3E6] focus:outline-none focus:border-[#C19B48] resize-none"
            />
          </div>

          {/* Optional Thumbnail */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#A8A294]">
              Cover Thumbnail Image (Optional)
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => thumbInputRef.current?.click()}
                className="px-3 py-1.5 rounded-xl bg-[#141414] hover:bg-[#262626] text-xs text-[#A8A294] hover:text-[#F7F3E6] border border-[#3D3D3D] transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Image className="w-3.5 h-3.5" />
                <span>{thumbnailFile ? 'Change Cover' : 'Upload Image'}</span>
              </button>
              <input
                ref={thumbInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => e.target.files?.[0] && handleThumbSelect(e.target.files[0])}
                className="hidden"
              />
              {thumbnailFile && (
                <span className="text-xs text-[#34D399] truncate max-w-xs flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {thumbnailFile.name}
                </span>
              )}
            </div>
          </div>

          {/* Publish Toggle */}
          <div className="p-3 rounded-xl bg-[#141414] border border-[#3D3D3D] flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#F7F3E6]">Publish to Student Vault immediately</p>
              <p className="text-[11px] text-[#A8A294]">
                If unchecked, paper will be saved as a draft visible only to faculty
              </p>
            </div>
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="w-4 h-4 accent-[#C19B48] cursor-pointer"
            />
          </div>

          {/* Upload Progress Indicator */}
          {uploading && (
            <div className="p-3.5 rounded-xl bg-[#C19B48]/10 border border-[#C19B48]/30 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-[#C19B48]">
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Uploading & processing PDF paper...
                </span>
                <span className="font-mono">{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 bg-[#141414] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#C19B48] transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Submit Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-[#3D3D3D]">
            <button
              type="button"
              disabled={uploading}
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#262626] hover:bg-[#333] text-xs font-semibold text-[#A8A294] transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading || !pdfFile}
              className="px-5 py-2 rounded-xl bg-[#C19B48] hover:bg-[#D8B862] text-xs font-bold text-[#1E1E1E] transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>Upload Solved Paper</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

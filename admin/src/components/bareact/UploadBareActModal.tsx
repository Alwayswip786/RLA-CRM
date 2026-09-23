import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileText,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import type { ActCategory, NoteDifficulty, SectionBreakdown } from '../../types/bareAct.types';
import { uploadNote } from '../../services/bareAct.service';
import { toast } from 'react-hot-toast';

interface UploadBareActModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CATEGORIES: ActCategory[] = [
  'New Criminal Laws',
  'Major Procedural Act',
  'Major Substantive Act',
  'Civil & Property Law',
  'Commercial & Corporate Law',
  'Local & Special Acts',
];

const DIFFICULTIES: NoteDifficulty[] = [
  'Prelims Booster',
  'Mains Analytical',
  'Comprehensive Mastery',
];

export const UploadBareActModal: React.FC<UploadBareActModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File states
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [actName, setActName] = useState('');
  const [actYear, setActYear] = useState<number>(new Date().getFullYear());
  const [actNumber, setActNumber] = useState('');
  const [category, setCategory] = useState<ActCategory>('New Criminal Laws');
  const [chapter, setChapter] = useState('');
  const [sectionsCovered, setSectionsCovered] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<NoteDifficulty>('Mains Analytical');
  const [author, setAuthor] = useState('Adv. Rajinder Sir & Judicial Faculty');
  const [tagInput, setTagInput] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [pageCount, setPageCount] = useState<number>(0);

  // Highlights array
  const [highlights, setHighlights] = useState<string[]>([
    'Section-by-section concordance mapping table',
  ]);
  const [newHighlight, setNewHighlight] = useState('');

  // Section Breakdown TOC array
  const [sectionBreakdowns, setSectionBreakdowns] = useState<SectionBreakdown[]>([]);
  const [newSecNum, setNewSecNum] = useState('');
  const [newSecHeading, setNewSecHeading] = useState('');
  const [newSecTakeaway, setNewSecTakeaway] = useState('');
  const [newSecPage, setNewSecPage] = useState<number>(1);

  if (!isOpen) return null;

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelected = (file: File) => {
    if (file.type !== 'application/pdf') {
      setPdfError('Only PDF files (.pdf) are permitted.');
      return;
    }
    if (file.size > 60 * 1024 * 1024) {
      setPdfError('File size exceeds the 60MB limit.');
      return;
    }
    setPdfError(null);
    setPdfFile(file);

    // Auto-populate title if empty
    if (!title) {
      const cleanName = file.name.replace(/\.pdf$/i, '').replace(/[-_]/g, ' ');
      setTitle(cleanName);
    }
  };

  const addHighlight = () => {
    if (!newHighlight.trim()) return;
    setHighlights([...highlights, newHighlight.trim()]);
    setNewHighlight('');
  };

  const removeHighlight = (idx: number) => {
    setHighlights(highlights.filter((_, i) => i !== idx));
  };

  const addSectionBreakdown = () => {
    if (!newSecNum.trim() || !newSecHeading.trim() || !newSecTakeaway.trim()) {
      toast.error('Please fill in Section Number, Heading, and Key Takeaway.');
      return;
    }
    setSectionBreakdowns([
      ...sectionBreakdowns,
      {
        sectionNumber: newSecNum.trim(),
        heading: newSecHeading.trim(),
        keyTakeaway: newSecTakeaway.trim(),
        pageNumber: newSecPage || 1,
      },
    ]);
    setNewSecNum('');
    setNewSecHeading('');
    setNewSecTakeaway('');
    setNewSecPage(1);
  };

  const removeSectionBreakdown = (idx: number) => {
    setSectionBreakdowns(sectionBreakdowns.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdfFile) {
      setPdfError('Please select or drop a valid PDF document.');
      return;
    }

    if (!actName.trim() || !sectionsCovered.trim() || !title.trim() || !description.trim()) {
      toast.error('Please fill in all required fields.');
      return;
    }

    try {
      setIsSubmitting(true);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append('pdf', pdfFile);
      formData.append('actName', actName.trim());
      formData.append('actYear', String(actYear));
      if (actNumber.trim()) formData.append('actNumber', actNumber.trim());
      formData.append('category', category);
      if (chapter.trim()) formData.append('chapter', chapter.trim());
      formData.append('sectionsCovered', sectionsCovered.trim());
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('difficulty', difficulty);
      formData.append('author', author.trim());
      formData.append('isPublished', String(isPublished));
      formData.append('isFeatured', String(isFeatured));
      if (pageCount > 0) formData.append('pageCount', String(pageCount));

      // Array fields
      formData.append('highlights', JSON.stringify(highlights));
      formData.append('sectionBreakdown', JSON.stringify(sectionBreakdowns));

      const parsedTags = tagInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      formData.append('tags', JSON.stringify(parsedTags));

      const res = await uploadNote(formData, (progress) => {
        setUploadProgress(progress);
      });

      if (res.success) {
        toast.success('Bare Act Decoding Note successfully uploaded!');
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to upload Bare Act Note.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
      setUploadProgress(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-4xl my-8 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-[#3D3D3D] bg-[#262626]/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#C19B48]/15 border border-[#C19B48]/30 text-[#C19B48]">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold text-[#F7F3E6]">
                Upload Bare Act Decoding Note
              </h2>
              <p className="text-xs text-[#A8A294]">
                Publish authoritative statutory commentaries, transition charts & section-by-section TOC
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#A8A294] hover:text-[#F7F3E6] hover:bg-[#3D3D3D] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
          {/* PDF Dropzone */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-[#F7F3E6]">
              Statutory Notes PDF Document <span className="text-rose-400">*</span>
            </label>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-6 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-colors ${
                pdfFile
                  ? 'border-[#C19B48] bg-[#C19B48]/10'
                  : 'border-[#3D3D3D] hover:border-[#C19B48]/60 bg-[#262626]/40 hover:bg-[#262626]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleFileSelected(e.target.files[0]);
                }}
              />
              {pdfFile ? (
                <div className="flex items-center justify-center gap-3 text-[#F7F3E6]">
                  <FileText className="w-8 h-8 text-[#C19B48]" />
                  <div className="text-left">
                    <p className="font-semibold text-sm">{pdfFile.name}</p>
                    <p className="text-[11px] text-[#A8A294]">
                      {(pdfFile.size / (1024 * 1024)).toFixed(2)} MB • PDF Ready to Upload
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 text-[#A8A294]">
                  <Upload className="w-8 h-8 mx-auto text-[#A8A294]" />
                  <p className="font-semibold text-xs text-[#F7F3E6]">
                    Click to browse or drag and drop your statutory PDF here
                  </p>
                  <p className="text-[10px]">Supported format: PDF documents up to 60MB</p>
                </div>
              )}
            </div>
            {pdfError && (
              <p className="text-xs text-rose-400 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{pdfError}</span>
              </p>
            )}
          </div>

          {/* Core Statute Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-[11px] font-semibold text-[#A8A294]">
                Act Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={actName}
                onChange={(e) => setActName(e.target.value)}
                placeholder="e.g. Bharatiya Nyaya Sanhita, 2023"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] placeholder:text-[#666] focus:outline-none focus:border-[#C19B48]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-[#A8A294]">
                Enactment / Amendment Year <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                required
                min={1800}
                max={2035}
                value={actYear}
                onChange={(e) => setActYear(parseInt(e.target.value, 10) || 2023)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-[#A8A294]">
                Statutory Category <span className="text-rose-400">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ActCategory)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-[#A8A294]">
                Official Act Number (Optional)
              </label>
              <input
                type="text"
                value={actNumber}
                onChange={(e) => setActNumber(e.target.value)}
                placeholder="e.g. Act No. 45 of 2023"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] placeholder:text-[#666] focus:outline-none focus:border-[#C19B48]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-[#A8A294]">
                Target Exam Difficulty
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as NoteDifficulty)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
              >
                {DIFFICULTIES.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Scope, Chapter & Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-[#A8A294]">
                Chapter / Part (Optional)
              </label>
              <input
                type="text"
                value={chapter}
                onChange={(e) => setChapter(e.target.value)}
                placeholder="e.g. Chapter VI: Offences Affecting Human Body"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] placeholder:text-[#666] focus:outline-none focus:border-[#C19B48]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-[#A8A294]">
                Sections / Orders Covered <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={sectionsCovered}
                onChange={(e) => setSectionsCovered(e.target.value)}
                placeholder="e.g. Sections 100 to 146 (Mapping IPC 299 to 377)"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] placeholder:text-[#666] focus:outline-none focus:border-[#C19B48]"
              />
            </div>
          </div>

          {/* Title & Overview */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-[#A8A294]">
                Decoding Note Title <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Offences Affecting Life - BNS 2023 vs IPC 1860 Comparative Concordance & Flowcharts"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] placeholder:text-[#666] focus:outline-none focus:border-[#C19B48]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-[#A8A294]">
                Academic Synopsis & Overview <span className="text-rose-400">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed explanation of statutory concepts, legislative intent, comparison tables, and judicial trends..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] placeholder:text-[#666] focus:outline-none focus:border-[#C19B48] resize-none"
              />
            </div>
          </div>

          {/* High-Yield Highlights List */}
          <div className="space-y-2">
            <label className="block text-[11px] font-semibold text-[#A8A294]">
              High-Yield Key Highlights (Checklist)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newHighlight}
                onChange={(e) => setNewHighlight(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addHighlight();
                  }
                }}
                placeholder="e.g. Res Judicata Section 11: All 8 Explanations Simplified"
                className="flex-1 px-3.5 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] placeholder:text-[#666] focus:outline-none focus:border-[#C19B48]"
              />
              <button
                type="button"
                onClick={addHighlight}
                className="px-4 py-2 rounded-xl bg-[#3D3D3D] hover:bg-[#C19B48] text-[#F7F3E6] hover:text-[#1E1E1E] font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>

            {highlights.length > 0 && (
              <div className="space-y-1.5 pt-1">
                {highlights.map((hl, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-[#262626] border border-[#3D3D3D]"
                  >
                    <span className="text-[11px] text-[#F7F3E6]">✓ {hl}</span>
                    <button
                      type="button"
                      onClick={() => removeHighlight(idx)}
                      className="text-[#A8A294] hover:text-rose-400 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section Breakdown (TOC for in-app reader navigation) */}
          <div className="space-y-2 p-4 rounded-xl bg-[#262626]/60 border border-[#3D3D3D]">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-[#F7F3E6]">
                  Section Breakdown (Interactive Reader TOC)
                </h4>
                <p className="text-[10px] text-[#A8A294]">
                  Add key sections and exact page numbers so students can jump straight to them in the PDF viewer
                </p>
              </div>
            </div>

            {/* Input Row */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-2">
              <input
                type="text"
                value={newSecNum}
                onChange={(e) => setNewSecNum(e.target.value)}
                placeholder="Sec: Section 100"
                className="px-3 py-1.5 rounded-lg bg-[#1E1E1E] border border-[#3D3D3D] text-[#F7F3E6] placeholder:text-[#666] text-xs focus:outline-none focus:border-[#C19B48]"
              />
              <input
                type="text"
                value={newSecHeading}
                onChange={(e) => setNewSecHeading(e.target.value)}
                placeholder="Heading: Culpable Homicide"
                className="px-3 py-1.5 rounded-lg bg-[#1E1E1E] border border-[#3D3D3D] text-[#F7F3E6] placeholder:text-[#666] text-xs focus:outline-none focus:border-[#C19B48]"
              />
              <input
                type="text"
                value={newSecTakeaway}
                onChange={(e) => setNewSecTakeaway(e.target.value)}
                placeholder="Takeaway: 3 intent tiers"
                className="px-3 py-1.5 rounded-lg bg-[#1E1E1E] border border-[#3D3D3D] text-[#F7F3E6] placeholder:text-[#666] text-xs focus:outline-none focus:border-[#C19B48]"
              />
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  value={newSecPage}
                  onChange={(e) => setNewSecPage(parseInt(e.target.value, 10) || 1)}
                  placeholder="Page #"
                  className="w-16 px-2 py-1.5 rounded-lg bg-[#1E1E1E] border border-[#3D3D3D] text-[#F7F3E6] text-xs focus:outline-none focus:border-[#C19B48]"
                />
                <button
                  type="button"
                  onClick={addSectionBreakdown}
                  className="flex-1 py-1.5 px-3 rounded-lg bg-[#C19B48] hover:bg-[#D8B862] text-[#1E1E1E] font-bold text-xs transition-colors cursor-pointer"
                >
                  + Add
                </button>
              </div>
            </div>

            {/* List of sections */}
            {sectionBreakdowns.length > 0 && (
              <div className="space-y-1.5 pt-2 max-h-40 overflow-y-auto">
                {sectionBreakdowns.map((sec, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-2 p-2 rounded-lg bg-[#1E1E1E] border border-[#3D3D3D] text-[11px]"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-[#C19B48]">{sec.sectionNumber}</span>
                      <span className="text-[#F7F3E6]">{sec.heading}</span>
                      <span className="text-[#A8A294] italic">— {sec.keyTakeaway}</span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-[#262626] text-[#A8A294]">
                        p. {sec.pageNumber}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeSectionBreakdown(idx)}
                      className="text-[#A8A294] hover:text-rose-400 transition-colors cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Author, Tags, Page Count */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-[#A8A294]">
                Faculty / Author Attribution
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-[#A8A294]">
                Total Pages
              </label>
              <input
                type="number"
                min={0}
                value={pageCount}
                onChange={(e) => setPageCount(parseInt(e.target.value, 10) || 0)}
                placeholder="e.g. 184"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-[#A8A294]">
                Search Tags (comma separated)
              </label>
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="e.g. BNS, Homicide, CPC, Order 7"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] placeholder:text-[#666] focus:outline-none focus:border-[#C19B48]"
              />
            </div>
          </div>

          {/* Flags & Checkboxes */}
          <div className="flex items-center gap-6 pt-2 border-t border-[#3D3D3D]">
            <label className="flex items-center gap-2 text-xs font-semibold text-[#F7F3E6] cursor-pointer">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="w-4 h-4 rounded border-[#3D3D3D] text-[#C19B48] focus:ring-0 focus:ring-offset-0 bg-[#262626] cursor-pointer"
              />
              <span>Publish Immediately (Visible to Students)</span>
            </label>

            <label className="flex items-center gap-2 text-xs font-semibold text-[#F7F3E6] cursor-pointer">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="w-4 h-4 rounded border-[#3D3D3D] text-[#C19B48] focus:ring-0 focus:ring-offset-0 bg-[#262626] cursor-pointer"
              />
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Feature as "Act in Focus" on Student Portal</span>
            </label>
          </div>

          {/* Upload Progress Bar */}
          {uploadProgress !== null && (
            <div className="space-y-1.5 p-3 rounded-xl bg-[#262626] border border-[#3D3D3D]">
              <div className="flex justify-between text-[11px]">
                <span className="text-[#A8A294]">Uploading Document Payload...</span>
                <span className="font-mono text-[#C19B48] font-bold">{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#1E1E1E] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#C19B48] to-emerald-400 transition-all duration-150"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#3D3D3D]">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-[#A8A294] hover:text-[#F7F3E6] hover:bg-[#262626] transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#C19B48] hover:bg-[#D8B862] text-[#1E1E1E] transition-colors flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Uploading Note...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Publish Bare Act Note</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

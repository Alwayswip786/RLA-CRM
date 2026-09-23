import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  FileText,
  Upload,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Sliders,
} from 'lucide-react';
import type { BareActNote, ActCategory, NoteDifficulty, SectionBreakdown } from '../../types/bareAct.types';
import { updateNote, replaceNotePdf } from '../../services/bareAct.service';
import { toast } from 'react-hot-toast';

interface EditBareActModalProps {
  note: BareActNote | null;
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

export const EditBareActModal: React.FC<EditBareActModalProps> = ({
  note,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'metadata' | 'replacePdf'>('metadata');
  const replaceFileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [actName, setActName] = useState('');
  const [actYear, setActYear] = useState<number>(2023);
  const [actNumber, setActNumber] = useState('');
  const [category, setCategory] = useState<ActCategory>('New Criminal Laws');
  const [chapter, setChapter] = useState('');
  const [sectionsCovered, setSectionsCovered] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<NoteDifficulty>('Mains Analytical');
  const [author, setAuthor] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [pageCount, setPageCount] = useState<number>(0);

  // Highlights
  const [highlights, setHighlights] = useState<string[]>([]);
  const [newHighlight, setNewHighlight] = useState('');

  // Section Breakdown TOC
  const [sectionBreakdowns, setSectionBreakdowns] = useState<SectionBreakdown[]>([]);
  const [newSecNum, setNewSecNum] = useState('');
  const [newSecHeading, setNewSecHeading] = useState('');
  const [newSecTakeaway, setNewSecTakeaway] = useState('');
  const [newSecPage, setNewSecPage] = useState<number>(1);

  // Replace PDF states
  const [newPdfFile, setNewPdfFile] = useState<File | null>(null);
  const [replaceError, setReplaceError] = useState<string | null>(null);
  const [replaceProgress, setReplaceProgress] = useState<number | null>(null);
  const [isReplacing, setIsReplacing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (note) {
      setActName(note.actName || '');
      setActYear(note.actYear || 2023);
      setActNumber(note.actNumber || '');
      setCategory(note.category || 'New Criminal Laws');
      setChapter(note.chapter || '');
      setSectionsCovered(note.sectionsCovered || '');
      setTitle(note.title || '');
      setDescription(note.description || '');
      setDifficulty(note.difficulty || 'Mains Analytical');
      setAuthor(note.author || 'Adv. Rajinder Sir & Judicial Faculty');
      setTagInput(note.tags ? note.tags.join(', ') : '');
      setIsPublished(note.isPublished);
      setIsFeatured(note.isFeatured);
      setPageCount(note.pdfFile?.pageCount || 0);
      setHighlights(note.highlights ? [...note.highlights] : []);
      setSectionBreakdowns(note.sectionBreakdown ? [...note.sectionBreakdown] : []);
      setNewPdfFile(null);
      setReplaceError(null);
      setActiveTab('metadata');
    }
  }, [note]);

  if (!isOpen || !note) return null;

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
      toast.error('Please enter section number, heading, and key takeaway.');
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

  const handleUpdateMetadata = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const parsedTags = tagInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await updateNote(note._id, {
        actName: actName.trim(),
        actYear,
        actNumber: actNumber.trim(),
        category,
        chapter: chapter.trim(),
        sectionsCovered: sectionsCovered.trim(),
        title: title.trim(),
        description: description.trim(),
        difficulty,
        author: author.trim(),
        highlights,
        sectionBreakdown: sectionBreakdowns,
        tags: parsedTags,
        isPublished,
        isFeatured,
        pageCount,
      });

      if (res.success) {
        toast.success('Bare Act Note metadata successfully updated!');
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update note.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReplacePdf = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPdfFile) {
      setReplaceError('Please choose a replacement PDF file.');
      return;
    }

    try {
      setIsReplacing(true);
      setReplaceProgress(0);

      const res = await replaceNotePdf(note._id, newPdfFile, (percent) => {
        setReplaceProgress(percent);
      });

      if (res.success) {
        toast.success('PDF document replaced successfully!');
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to replace PDF.');
    } finally {
      setIsReplacing(false);
      setReplaceProgress(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-4xl my-8 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-[#3D3D3D] bg-[#262626]/70 flex items-center justify-between">
          <div>
            <h2 className="font-serif text-lg font-bold text-[#F7F3E6]">
              Edit Bare Act Note
            </h2>
            <p className="text-xs text-[#A8A294]">
              {note.actName} ({note.sectionsCovered})
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#A8A294] hover:text-[#F7F3E6] hover:bg-[#3D3D3D] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[#3D3D3D] bg-[#262626]/40 px-6">
          <button
            type="button"
            onClick={() => setActiveTab('metadata')}
            className={`py-3 px-4 font-semibold text-xs flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'metadata'
                ? 'border-[#C19B48] text-[#C19B48]'
                : 'border-transparent text-[#A8A294] hover:text-[#F7F3E6]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Metadata & Sections TOC</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('replacePdf')}
            className={`py-3 px-4 font-semibold text-xs flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'replacePdf'
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
          <form onSubmit={handleUpdateMetadata} className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1 md:col-span-2">
                <label className="block text-[11px] font-semibold text-[#A8A294]">Act Name</label>
                <input
                  type="text"
                  required
                  value={actName}
                  onChange={(e) => setActName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-[#A8A294]">Year</label>
                <input
                  type="number"
                  required
                  value={actYear}
                  onChange={(e) => setActYear(parseInt(e.target.value, 10) || 2023)}
                  className="w-full px-3 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-[#A8A294]">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ActCategory)}
                  className="w-full px-3 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-[#A8A294]">Act Number</label>
                <input
                  type="text"
                  value={actNumber}
                  onChange={(e) => setActNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-[#A8A294]">Difficulty</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as NoteDifficulty)}
                  className="w-full px-3 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
                >
                  {DIFFICULTIES.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-[#A8A294]">Chapter / Part</label>
                <input
                  type="text"
                  value={chapter}
                  onChange={(e) => setChapter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-[#A8A294]">Sections Covered</label>
                <input
                  type="text"
                  required
                  value={sectionsCovered}
                  onChange={(e) => setSectionsCovered(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-[#A8A294]">Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-[#A8A294]">Academic Synopsis</label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] focus:outline-none focus:border-[#C19B48] resize-none"
              />
            </div>

            {/* Highlights Editor */}
            <div className="space-y-2">
              <label className="block text-[11px] font-semibold text-[#A8A294]">Key Highlights</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newHighlight}
                  onChange={(e) => setNewHighlight(e.target.value)}
                  placeholder="Add high-yield bullet point..."
                  className="flex-1 px-3 py-1.5 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] text-xs focus:outline-none focus:border-[#C19B48]"
                />
                <button
                  type="button"
                  onClick={addHighlight}
                  className="px-3 py-1.5 rounded-xl bg-[#3D3D3D] hover:bg-[#C19B48] text-[#F7F3E6] hover:text-[#1E1E1E] font-bold text-xs transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>

              {highlights.length > 0 && (
                <div className="space-y-1 pt-1">
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

            {/* Section Breakdown TOC */}
            <div className="space-y-2 p-4 rounded-xl bg-[#262626]/60 border border-[#3D3D3D]">
              <h4 className="text-xs font-bold text-[#F7F3E6]">Section Breakdown TOC</h4>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <input
                  type="text"
                  value={newSecNum}
                  onChange={(e) => setNewSecNum(e.target.value)}
                  placeholder="Section (e.g. Sec 11)"
                  className="px-2.5 py-1.5 rounded-lg bg-[#1E1E1E] border border-[#3D3D3D] text-[#F7F3E6] text-xs focus:outline-none focus:border-[#C19B48]"
                />
                <input
                  type="text"
                  value={newSecHeading}
                  onChange={(e) => setNewSecHeading(e.target.value)}
                  placeholder="Heading (e.g. Res Judicata)"
                  className="px-2.5 py-1.5 rounded-lg bg-[#1E1E1E] border border-[#3D3D3D] text-[#F7F3E6] text-xs focus:outline-none focus:border-[#C19B48]"
                />
                <input
                  type="text"
                  value={newSecTakeaway}
                  onChange={(e) => setNewSecTakeaway(e.target.value)}
                  placeholder="Key Takeaway / Formula"
                  className="px-2.5 py-1.5 rounded-lg bg-[#1E1E1E] border border-[#3D3D3D] text-[#F7F3E6] text-xs focus:outline-none focus:border-[#C19B48]"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    value={newSecPage}
                    onChange={(e) => setNewSecPage(parseInt(e.target.value, 10) || 1)}
                    placeholder="Page"
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

              {sectionBreakdowns.length > 0 && (
                <div className="space-y-1.5 pt-2 max-h-36 overflow-y-auto">
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

            {/* Checkboxes */}
            <div className="flex items-center gap-6 pt-2 border-t border-[#3D3D3D]">
              <label className="flex items-center gap-2 text-xs font-semibold text-[#F7F3E6] cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="w-4 h-4 rounded border-[#3D3D3D] text-[#C19B48] focus:ring-0 focus:ring-offset-0 bg-[#262626] cursor-pointer"
                />
                <span>Published (Visible to Students)</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-semibold text-[#F7F3E6] cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="w-4 h-4 rounded border-[#3D3D3D] text-[#C19B48] focus:ring-0 focus:ring-offset-0 bg-[#262626] cursor-pointer"
                />
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Feature as "Act in Focus"</span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#3D3D3D]">
              <button
                type="button"
                disabled={isSaving}
                onClick={onClose}
                className="px-5 py-2 rounded-xl text-xs font-semibold text-[#A8A294] hover:text-[#F7F3E6] hover:bg-[#262626] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2 rounded-xl text-xs font-bold bg-[#C19B48] hover:bg-[#D8B862] text-[#1E1E1E] transition-colors flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Replace PDF Form */}
        {activeTab === 'replacePdf' && (
          <form onSubmit={handleReplacePdf} className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
            <div className="p-4 rounded-xl bg-[#262626] border border-[#3D3D3D] space-y-2">
              <p className="text-[11px] text-[#A8A294]">Currently Attached Document:</p>
              <div className="flex items-center gap-3 text-[#F7F3E6]">
                <FileText className="w-6 h-6 text-[#C19B48]" />
                <div>
                  <p className="font-semibold text-xs">{note.pdfFile?.originalName}</p>
                  <p className="text-[10px] text-[#A8A294]">
                    Size: {note.pdfFile?.sizeFormatted} • {note.pdfFile?.pageCount || 0} Pages
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[#F7F3E6]">
                Select Replacement PDF Document
              </label>
              <div
                onClick={() => replaceFileInputRef.current?.click()}
                className={`p-8 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-colors ${
                  newPdfFile
                    ? 'border-[#C19B48] bg-[#C19B48]/10'
                    : 'border-[#3D3D3D] hover:border-[#C19B48]/60 bg-[#262626]/40 hover:bg-[#262626]'
                }`}
              >
                <input
                  ref={replaceFileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      const f = e.target.files[0];
                      if (f.type !== 'application/pdf') {
                        setReplaceError('Only PDF files are allowed.');
                        return;
                      }
                      setReplaceError(null);
                      setNewPdfFile(f);
                    }
                  }}
                />
                {newPdfFile ? (
                  <div className="flex items-center justify-center gap-3 text-[#F7F3E6]">
                    <FileText className="w-8 h-8 text-emerald-400" />
                    <div className="text-left">
                      <p className="font-semibold text-sm">{newPdfFile.name}</p>
                      <p className="text-[11px] text-[#A8A294]">
                        {(newPdfFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to Replace
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 text-[#A8A294]">
                    <Upload className="w-8 h-8 mx-auto text-[#A8A294]" />
                    <p className="font-semibold text-xs text-[#F7F3E6]">
                      Click to choose replacement PDF
                    </p>
                    <p className="text-[10px]">Maximum allowed size: 60MB</p>
                  </div>
                )}
              </div>
              {replaceError && (
                <p className="text-xs text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{replaceError}</span>
                </p>
              )}
            </div>

            {replaceProgress !== null && (
              <div className="space-y-1.5 p-3 rounded-xl bg-[#262626] border border-[#3D3D3D]">
                <div className="flex justify-between text-[11px]">
                  <span className="text-[#A8A294]">Uploading Replacement PDF...</span>
                  <span className="font-mono text-[#C19B48] font-bold">{replaceProgress}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#1E1E1E] overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#C19B48] to-emerald-400 transition-all duration-150"
                    style={{ width: `${replaceProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#3D3D3D]">
              <button
                type="button"
                disabled={isReplacing}
                onClick={onClose}
                className="px-5 py-2 rounded-xl text-xs font-semibold text-[#A8A294] hover:text-[#F7F3E6] hover:bg-[#262626] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isReplacing || !newPdfFile}
                className="px-6 py-2 rounded-xl text-xs font-bold bg-[#C19B48] hover:bg-[#D8B862] text-[#1E1E1E] transition-colors flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
              >
                {isReplacing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                <span>Replace PDF Document</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

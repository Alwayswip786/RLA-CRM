import React, { useState, useEffect } from 'react';
import {
  X,
  Send,
  Loader2,
} from 'lucide-react';
import { toast } from '../../lib/toast';
import { apiClient } from '../../lib/apiClient';
import { CustomSelect } from '../ui/CustomSelect';
import type { DoubtQuery, DoubtCategory, DoubtPriority } from '../../types/doubt.types';

export interface SubmitDoubtModalProps {
  isOpen: boolean;
  onClose: () => void;
  onQueryCreated: (newQuery: DoubtQuery) => void;
}

export const SubmitDoubtModal: React.FC<SubmitDoubtModalProps> = ({
  isOpen,
  onClose,
  onQueryCreated,
}) => {
  const [subject, setSubject] = useState('Code of Civil Procedure');
  const [bareActSection, setBareActSection] = useState('');
  const [title, setTitle] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [category, setCategory] = useState<DoubtCategory>('Bare Act Interpretation');
  const [priority, setPriority] = useState<DoubtPriority>('normal');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !questionText.trim()) {
      toast.error('Please provide a query title and detailed description.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await apiClient.post('/doubts', {
        subject,
        bareActSection: bareActSection.trim() || undefined,
        title: title.trim(),
        initialQuestion: questionText.trim(),
        category,
        priority,
      });

      if (res.data?.query) {
        toast.success(`Legal Query ${res.data.query.queryNumber} submitted!`, {
          description: 'Adv. Rajinder Sir and the faculty wing will review shortly.',
        });
        onQueryCreated(res.data.query);
        // Reset form
        setTitle('');
        setQuestionText('');
        setBareActSection('');
        setSubject('Code of Civil Procedure');
        setCategory('Bare Act Interpretation');
        setPriority('normal');
        onClose();
      }
    } catch (err: any) {
      console.error('Failed to submit doubt:', err);
      toast.error(err.response?.data?.message || 'Failed to submit legal query.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center sm:p-4 sm:bg-black/75 sm:backdrop-blur-sm animate-in fade-in duration-150">
      {/* Backdrop click dismiss on tablet/desktop */}
      <div className="hidden sm:block fixed inset-0" onClick={onClose} aria-hidden="true" />

      {/* Main Modal Card (Full screen on mobile, centered dialog on desktop) */}
      <div className="relative w-full h-[100dvh] sm:h-auto sm:max-h-[90vh] sm:max-w-xl bg-white dark:bg-[#0a1c36] sm:border sm:border-slate-200/90 dark:sm:border-[#c19b48]/35 sm:rounded-2xl sm:shadow-2xl overflow-hidden z-10 text-slate-800 dark:text-slate-100 flex flex-col">
        {/* Top Navbar */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 dark:border-[#143564] shrink-0 bg-slate-50/70 dark:bg-[#061120]/60 flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-serif font-bold text-slate-900 dark:text-white">
            Submit New Legal Query
          </h3>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#143564] transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5">
          {/* Subject Area */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Subject Area <span className="text-[#c19b48]">*</span>
            </label>
            <CustomSelect
              options={[
                { value: 'Code of Civil Procedure', label: 'Code of Civil Procedure (CPC)' },
                { value: 'Bhartiya Nyaya Sanhita (BNS)', label: 'Bhartiya Nyaya Sanhita (BNS)' },
                { value: 'Bhartiya Nagarik Suraksha Sanhita (BNSS)', label: 'Bhartiya Nagarik Suraksha Sanhita (BNSS)' },
                { value: 'Indian Evidence Act / BSA', label: 'Indian Evidence Act / BSA' },
                { value: 'Constitution of India', label: 'Constitution of India' },
                { value: 'Contract & Specific Relief', label: 'Contract & Specific Relief Act' },
                { value: 'Limitation Act & Transfer of Property', label: 'Limitation & TPA' },
              ]}
              value={subject}
              onChange={(val) => setSubject(val)}
              placeholder="Select Subject Area"
              sheetTitle="Select Legal Subject Area"
            />
          </div>

          {/* Bare Act Section (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Specific Bare Act Provision / Section (Optional)
            </label>
            <input
              type="text"
              value={bareActSection}
              onChange={(e) => setBareActSection(e.target.value)}
              placeholder="e.g. Section 11 CPC or Section 111 BNS"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#c19b48]"
            />
          </div>

          {/* Question Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Question Title / Legal Issue <span className="text-[#c19b48]">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Res Judicata applicability between co-defendants"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#c19b48]"
            />
          </div>

          {/* Detailed Question Text */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Detailed Question or Case Scenario <span className="text-[#c19b48]">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="State the factual proposition, contradictory High Court judgments, or legal ambiguity..."
              className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#c19b48] leading-relaxed resize-none"
            />
          </div>

          {/* Category & Priority Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Category
              </label>
              <CustomSelect
                options={[
                  { value: 'Bare Act Interpretation', label: 'Bare Act Interpretation' },
                  { value: 'Mains Answer Drafting', label: 'Mains Answer Drafting' },
                  { value: 'Case Law & Precedent', label: 'Case Law & Precedent' },
                  { value: 'Procedural Practice', label: 'Procedural Practice' },
                  { value: 'General Legal Doubt', label: 'General Legal Doubt' },
                ]}
                value={category}
                onChange={(val) => setCategory(val as DoubtCategory)}
                placeholder="Category"
                sheetTitle="Select Query Category"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Priority
              </label>
              <CustomSelect
                options={[
                  { value: 'normal', label: 'Standard Priority' },
                  { value: 'urgent', label: 'Urgent (Exam Doubt)' },
                ]}
                value={priority}
                onChange={(val) => setPriority(val as DoubtPriority)}
                placeholder="Priority"
                sheetTitle="Select Query Priority"
              />
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-3 sm:pt-4 flex items-center justify-end gap-2.5 sm:gap-3 border-t border-slate-200 dark:border-[#143564]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 sm:px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 sm:px-6 py-2.5 rounded-xl bg-[#c19b48] hover:bg-[#d8b862] text-[#061120] font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Query to Faculty</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

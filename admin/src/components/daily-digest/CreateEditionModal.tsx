import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Calendar,
  Sparkles,
  Loader2,
  Newspaper,
  BookOpen,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { createEditionAdmin } from '../../services/dailyDigest.service';
import type {
  DigestContentType,
  DigestStatus,
  IDigestItem,
  IFeaturedMaxim,
} from '../../types/dailyDigest.types';

interface CreateEditionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CONTENT_TYPES: DigestContentType[] = [
  'Supreme Court Ruling',
  'High Court Ruling',
  'Legal Maxim',
  'Legislative Amendment',
  'Bare Act Update',
  'Exam Insight',
];

const getTodayDateIST = (): string => {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
};

export const CreateEditionModal: React.FC<CreateEditionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [editionDateIST, setEditionDateIST] = useState(getTodayDateIST());
  const [editionNumber, setEditionNumber] = useState(1);
  const [title, setTitle] = useState('Daily Legal Digest & Case Law Brief');
  const [subtitle, setSubtitle] = useState(
    'Stay ahead with daily judgments, Bare Act comparative pointers, and Latin maxims.'
  );
  const [curatedBy, setCuratedBy] = useState('Curated Daily by Faculty Wing');
  const [authorName, setAuthorName] = useState('Adv. Rajinder Sir');
  const [status, setStatus] = useState<DigestStatus>('published');

  // Featured Maxim
  const [featuredMaxim, setFeaturedMaxim] = useState<IFeaturedMaxim>({
    latinText: '"Actus non facit reum, nisi mens sit rea"',
    englishMeaning: 'An act does not make a person guilty unless the mind is also guilty.',
    jurisprudenceContext:
      'Fundamental principle of penal jurisprudence embodied under BNS General Exceptions and Section 21 of BNS.',
    subject: 'Penal Jurisprudence',
  });

  // Content Items
  const [items, setItems] = useState<IDigestItem[]>([
    {
      itemId: 'item-1',
      contentType: 'Supreme Court Ruling',
      categoryBadge: 'SUPREME COURT RULING',
      badgeColor: 'amber',
      subject: 'Criminal Procedure',
      title: 'Section 482 CrPC Power Cannot Be Exercised Mechanically To Stifle Legitimate Prosecution',
      citation: '2025 INSC 142 • 3-Judge Bench (CJI Bench)',
      summary:
        'The Apex Court held that while the High Court has inherent powers to prevent abuse of the process of law, such powers must be exercised ex debito justitiae and not to hold a mini-trial at the threshold of framing charges.',
      examinationTip:
        'Vital for Mains Criminal Procedure answer on quashing of FIRs under BNSS 528 / CrPC 482.',
      order: 1,
    },
    {
      itemId: 'item-2',
      contentType: 'Legal Maxim',
      categoryBadge: 'LEGAL MAXIM',
      badgeColor: 'amber',
      subject: 'Constitutional Law',
      title: 'Nemo debet bis vexari pro una et eadem causa',
      citation: 'Constitutional Common Law Principle',
      summary:
        'No man should be twice harassed for one and the same cause. Corresponds directly with Section 300 of the CrPC, Section 337 BNSS, and Article 20(2) of the Indian Constitution.',
      examinationTip:
        'Distinguish between Double Jeopardy (criminal conviction) and departmental inquiry proceedings.',
      order: 2,
    },
  ]);

  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleAddItem = () => {
    const newItem: IDigestItem = {
      itemId: `item-${Date.now()}`,
      contentType: 'Supreme Court Ruling',
      categoryBadge: 'SUPREME COURT RULING',
      badgeColor: 'amber',
      subject: 'Constitutional Law',
      title: '',
      citation: '',
      summary: '',
      examinationTip: '',
      order: items.length + 1,
    };
    setItems((prev) => [...prev, newItem]);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof IDigestItem, value: any) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      if (field === 'contentType') {
        copy[index].categoryBadge = String(value).toUpperCase();
      }
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editionDateIST.trim()) {
      toast.error('Edition Date (IST) is required.');
      return;
    }
    if (!featuredMaxim.latinText.trim() || !featuredMaxim.englishMeaning.trim()) {
      toast.error('Legal Maxim of the Day is required.');
      return;
    }
    if (items.length === 0) {
      toast.error('Please add at least one content item to this edition.');
      return;
    }

    try {
      setSaving(true);
      const res = await createEditionAdmin({
        editionDateIST: editionDateIST.trim(),
        editionNumber: Number(editionNumber) || 1,
        title: title.trim(),
        subtitle: subtitle.trim(),
        curatedBy: curatedBy.trim(),
        authorName: authorName.trim(),
        featuredMaxim,
        items,
        status,
      });

      if (res.success) {
        toast.success(res.message);
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create edition.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl my-8 bg-[#1E1E1E] rounded-2xl border border-[#3D3D3D] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#262626] border-b border-[#3D3D3D]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#C19B48]/15 text-[#C19B48] border border-[#C19B48]/30">
              <Newspaper className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-serif font-bold text-[#F7F3E6]">
                Compose Daily Legal Digest & Case Law Brief
              </h2>
              <p className="text-xs text-[#A8A294]">
                Curate Latin maxims, Apex Court rulings, Bare Act amendments, and Mains tips
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={saving}
            className="p-1.5 rounded-lg text-[#A8A294] hover:text-[#F7F3E6] hover:bg-[#3D3D3D] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* 1. Edition Header & Scheduling Controls */}
          <div className="p-4 rounded-xl bg-[#262626] border border-[#3D3D3D] space-y-3">
            <div className="flex items-center gap-2 text-[#C19B48] font-bold text-xs">
              <Calendar className="w-4 h-4" />
              <span>Edition Metadata & Broadcast Lifecycle</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block font-semibold text-[#A8A294] mb-1">
                  Edition Date (IST) <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  value={editionDateIST}
                  onChange={(e) => setEditionDateIST(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-[#1E1E1E] border border-[#3D3D3D] text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#A8A294] mb-1">Edition #</label>
                <input
                  type="number"
                  min="1"
                  value={editionNumber}
                  onChange={(e) => setEditionNumber(Number(e.target.value) || 1)}
                  className="w-full px-3 py-2 rounded-xl bg-[#1E1E1E] border border-[#3D3D3D] text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#A8A294] mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as DigestStatus)}
                  className="w-full px-3 py-2 rounded-xl bg-[#1E1E1E] border border-[#3D3D3D] text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
                >
                  <option value="published">Published (Live in Portals)</option>
                  <option value="scheduled">Scheduled (Future Date)</option>
                  <option value="draft">Draft (Faculty Review)</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#A8A294] mb-1">Author / Curator</label>
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="e.g. Adv. Rajinder Sir"
                  className="w-full px-3 py-2 rounded-xl bg-[#1E1E1E] border border-[#3D3D3D] text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-[#A8A294] mb-1">Edition Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-[#1E1E1E] border border-[#3D3D3D] text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-[#A8A294] mb-1">Curated By Tagline</label>
                <input
                  type="text"
                  value={curatedBy}
                  onChange={(e) => setCuratedBy(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#1E1E1E] border border-[#3D3D3D] text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
                />
              </div>

              <div className="sm:col-span-4">
                <label className="block font-semibold text-[#A8A294] mb-1">Edition Subtitle / Banner Description</label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="e.g. Stay ahead with daily judgments, Bare Act comparative pointers, and Latin maxims."
                  className="w-full px-3 py-2 rounded-xl bg-[#1E1E1E] border border-[#3D3D3D] text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
                />
              </div>
            </div>
          </div>

          {/* 2. Featured Legal Maxim of the Day */}
          <div className="p-4 rounded-xl bg-[#262626] border border-[#3D3D3D] space-y-3">
            <div className="flex items-center gap-2 text-[#C19B48] font-bold text-xs">
              <Sparkles className="w-4 h-4" />
              <span>Legal Maxim of the Day (Navy Gradient Banner)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-[#F7F3E6] mb-1">
                  Latin Maxim in Quotes <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={featuredMaxim.latinText}
                  onChange={(e) =>
                    setFeaturedMaxim((prev) => ({ ...prev, latinText: e.target.value }))
                  }
                  placeholder='e.g. "Actus non facit reum, nisi mens sit rea"'
                  required
                  className="w-full px-3.5 py-2 rounded-xl bg-[#1E1E1E] border border-[#3D3D3D] text-[#F7F3E6] font-serif italic text-sm focus:outline-none focus:border-[#C19B48]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-[#F7F3E6] mb-1">
                  English Literal Meaning <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={featuredMaxim.englishMeaning}
                  onChange={(e) =>
                    setFeaturedMaxim((prev) => ({ ...prev, englishMeaning: e.target.value }))
                  }
                  placeholder="e.g. An act does not make a person guilty unless the mind is also guilty."
                  required
                  className="w-full px-3.5 py-2 rounded-xl bg-[#1E1E1E] border border-[#3D3D3D] text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#A8A294] mb-1">
                  Jurisprudence Context & BNS / IPC Mapping
                </label>
                <input
                  type="text"
                  value={featuredMaxim.jurisprudenceContext}
                  onChange={(e) =>
                    setFeaturedMaxim((prev) => ({ ...prev, jurisprudenceContext: e.target.value }))
                  }
                  placeholder="e.g. Embodied under BNS General Exceptions and Section 21 BNS."
                  className="w-full px-3.5 py-2 rounded-xl bg-[#1E1E1E] border border-[#3D3D3D] text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#A8A294] mb-1">Subject Category</label>
                <input
                  type="text"
                  value={featuredMaxim.subject || 'Penal Jurisprudence'}
                  onChange={(e) =>
                    setFeaturedMaxim((prev) => ({ ...prev, subject: e.target.value }))
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-[#1E1E1E] border border-[#3D3D3D] text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
                />
              </div>
            </div>
          </div>

          {/* 3. Daily Content Items Builder */}
          <div className="p-4 rounded-xl bg-[#262626] border border-[#3D3D3D] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="block font-bold text-[#C19B48] uppercase text-xs tracking-wider">
                  Curated Content Blocks ({items.length})
                </span>
                <span className="text-[11px] text-[#A8A294]">
                  Supreme Court Rulings, High Court Decisions, Maxims, and BNS Amendments
                </span>
              </div>

              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#C19B48] hover:bg-[#D8B862] text-[#1E1E1E] font-bold text-xs cursor-pointer transition-colors shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-4">
              {items.map((item, idx) => (
                <div
                  key={item.itemId || idx}
                  className="p-4 rounded-xl bg-[#1E1E1E] border border-[#3D3D3D] space-y-3 relative group"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-[#3D3D3D]">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#C19B48]/20 text-[#C19B48] font-bold text-[10px] flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-[#F7F3E6] text-xs">
                        Item #{idx + 1}: {item.contentType}
                      </span>
                    </div>

                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="p-1 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold text-[#A8A294] mb-1">Content Type</label>
                      <select
                        value={item.contentType}
                        onChange={(e) =>
                          handleItemChange(idx, 'contentType', e.target.value as DigestContentType)
                        }
                        className="w-full px-3 py-1.5 rounded-lg bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
                      >
                        {CONTENT_TYPES.map((ct) => (
                          <option key={ct} value={ct}>
                            {ct}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-[#A8A294] mb-1">
                        Category Pill Badge
                      </label>
                      <input
                        type="text"
                        value={item.categoryBadge}
                        onChange={(e) => handleItemChange(idx, 'categoryBadge', e.target.value)}
                        placeholder="e.g. SUPREME COURT RULING"
                        className="w-full px-3 py-1.5 rounded-lg bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] uppercase focus:outline-none focus:border-[#C19B48]"
                      >
                      </input>
                    </div>

                    <div>
                      <label className="block font-semibold text-[#A8A294] mb-1">
                        Subject / Act Tag
                      </label>
                      <input
                        type="text"
                        value={item.subject}
                        onChange={(e) => handleItemChange(idx, 'subject', e.target.value)}
                        placeholder="e.g. Criminal Procedure or BNS"
                        className="w-full px-3 py-1.5 rounded-lg bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-[#F7F3E6] mb-1">
                        Headline / Title <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => handleItemChange(idx, 'title', e.target.value)}
                        placeholder="e.g. Section 482 CrPC Power Cannot Be Exercised Mechanically..."
                        required
                        className="w-full px-3 py-1.5 rounded-lg bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] font-semibold focus:outline-none focus:border-[#C19B48]"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-[#A8A294] mb-1">
                        Citation & Bench
                      </label>
                      <input
                        type="text"
                        value={item.citation || ''}
                        onChange={(e) => handleItemChange(idx, 'citation', e.target.value)}
                        placeholder="e.g. 2025 INSC 142 • 3-Judge Bench"
                        className="w-full px-3 py-1.5 rounded-lg bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] font-mono text-[11px] focus:outline-none focus:border-[#C19B48]"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block font-semibold text-[#F7F3E6] mb-1">
                        Ratio Summary / Holding Analysis <span className="text-red-400">*</span>
                      </label>
                      <textarea
                        rows={3}
                        value={item.summary}
                        onChange={(e) => handleItemChange(idx, 'summary', e.target.value)}
                        placeholder="Concise legal explanation and holding of the Court or provision analysis..."
                        required
                        className="w-full px-3 py-2 rounded-lg bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] focus:outline-none focus:border-[#C19B48] leading-relaxed"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block font-semibold text-amber-300 mb-1">
                        Judicial Examination Tip (Mains / Prelims Directive){' '}
                        <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={item.examinationTip}
                        onChange={(e) => handleItemChange(idx, 'examinationTip', e.target.value)}
                        placeholder="e.g. Vital for Mains Criminal Procedure answer on quashing under BNSS 528 / CrPC 482."
                        required
                        className="w-full px-3 py-2 rounded-lg bg-[#262626] border border-amber-500/30 text-amber-100 placeholder:text-amber-300/40 focus:outline-none focus:border-[#C19B48]"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
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
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookOpen className="w-4 h-4" />}
              <span>{saving ? 'Publishing Edition...' : 'Save & Broadcast Edition'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

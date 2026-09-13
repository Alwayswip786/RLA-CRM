import React, { useState } from 'react';
import {
  Newspaper,
  Send,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface DigestEntry {
  id: string;
  title: string;
  category: string;
  publishDate: string;
  ratioSummary: string;
  author: string;
  readsCount: number;
}

const PAST_DIGESTS: DigestEntry[] = [
  {
    id: 'digest-01',
    title: 'Defect of Jurisdiction vs Irregular Exercise of Jurisdiction',
    category: 'Civil Procedure Code (Section 21)',
    publishDate: 'Today, 06:00 AM',
    ratioSummary: 'Kiran Singh v. Chaman Paswan: A decree passed by a court without inherent jurisdiction is a nullity and its invalidity could be set up whenever and wherever it is sought to be enforced.',
    author: 'Adv. Rajinder Sir',
    readsCount: 394,
  },
  {
    id: 'digest-02',
    title: 'Constructive Res Judicata Applicability to Execution Proceedings',
    category: 'CPC Order 21 & Sec 11',
    publishDate: 'Yesterday, 06:00 AM',
    ratioSummary: 'Principles of res judicata apply equally to execution proceedings between the same decree holder and judgment debtor once issues have been determined.',
    author: 'Adv. Rajinder Sir',
    readsCount: 422,
  },
  {
    id: 'digest-03',
    title: 'Arrest Guidelines under BNSS Section 35: Mandatory Notice',
    category: 'BNSS 2023 / Criminal Law',
    publishDate: '11 Sep 2026',
    ratioSummary: 'Police officer must record reasons in writing when arrest is not made for offences punishable up to 7 years, continuing the Arnesh Kumar doctrine into the new Sanhita.',
    author: 'Adv. Sharma',
    readsCount: 480,
  },
];

export const DailyDigestPage: React.FC = () => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Civil Procedure Code');
  const [ratioText, setRatioText] = useState('');

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !ratioText) {
      toast.error('Please enter title and ratio summary');
      return;
    }
    toast.success(
      <div>
        <div className="font-semibold text-[#F7F3E6]">Daily Legal Digest Published to Student Classroom Portals</div>
        <div className="text-xs text-[#A8A294] mt-0.5">"{title}" has been broadcast to all enrolled cohorts.</div>
      </div>
    );
    setTitle('');
    setRatioText('');
  };

  return (
    <div className="space-y-6 select-none">
      {/* Header */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] space-y-1">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold">
          <Newspaper className="w-3.5 h-3.5" />
          <span>Judicial Ratio Decidendi Desk</span>
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#F7F3E6]">
          Daily Legal Digest CMS & Case Briefs
        </h1>
        <p className="text-xs text-[#A8A294] max-w-2xl leading-relaxed">
          Curate and publish morning landmark ratios, Bare Act amendment updates, and high-yield case summaries directly to the student dashboard.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Publisher Form */}
        <div className="lg:col-span-2 space-y-4">
          <form onSubmit={handlePublish} className="p-6 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] space-y-4">
            <h3 className="font-serif text-base font-bold text-[#F7F3E6] border-b border-[#3D3D3D] pb-2 flex items-center justify-between">
              <span>Publish Tomorrow's Morning Brief</span>
              <span className="text-xs text-[#C19B48]">Goes Live at 06:00 AM</span>
            </h3>

            <div className="space-y-1.5 text-xs">
              <label className="text-[#A8A294] font-medium">Digest Headline / Legal Issue</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Scope of Inherent Powers under Section 151 CPC"
                className="w-full px-3.5 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] placeholder-[#A8A294] focus:outline-hidden focus:border-[#C19B48]"
              />
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="text-[#A8A294] font-medium">Bare Act / Subject Tag</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] focus:outline-hidden focus:border-[#C19B48] cursor-pointer"
              >
                <option value="Civil Procedure Code">Civil Procedure Code (CPC)</option>
                <option value="BNSS">BNSS (Criminal Procedure)</option>
                <option value="BNS">Bharatiya Nyaya Sanhita (BNS)</option>
                <option value="BSA">Bharatiya Sakshya Adhiniyam (BSA)</option>
                <option value="Constitutional Law">Constitutional Law</option>
              </select>
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="text-[#A8A294] font-medium">Ratio Decidendi / 3-Point Summary</label>
              <textarea
                rows={4}
                value={ratioText}
                onChange={(e) => setRatioText(e.target.value)}
                placeholder="Cite landmark precedent, facts, and the held ratio that students should memorize for Mains..."
                className="w-full px-3.5 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] placeholder-[#A8A294] focus:outline-hidden focus:border-[#C19B48]"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-[#A8A294]">
                Author will be tagged as: <strong className="text-[#F7F3E6]">Adv. Rajinder Sir</strong>
              </span>
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#C19B48] hover:bg-[#D8B862] text-[#1E1E1E] text-xs font-bold transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Publish Daily Digest</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right 1 Col: Past Digests */}
        <div className="space-y-4">
          <div className="p-6 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] space-y-4">
            <h3 className="font-serif text-base font-bold text-[#F7F3E6] border-b border-[#3D3D3D] pb-2">
              Recent Broadcast History
            </h3>
            <div className="space-y-3">
              {PAST_DIGESTS.map((digest) => (
                <div
                  key={digest.id}
                  className="p-3.5 rounded-xl bg-[#262626] border border-[#3D3D3D] hover:border-[#C19B48]/40 transition-colors space-y-2"
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold text-[#C19B48] bg-[#C19B48]/15 px-2 py-0.5 rounded">
                      {digest.category}
                    </span>
                    <span className="text-[#A8A294]">{digest.publishDate}</span>
                  </div>
                  <h4 className="text-xs font-bold text-[#F7F3E6] leading-snug">
                    {digest.title}
                  </h4>
                  <p className="text-[11px] text-[#A8A294] line-clamp-2">
                    {digest.ratioSummary}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-[#A8A294] pt-1">
                    <span>{digest.author}</span>
                    <span className="text-[#34D399] font-semibold">{digest.readsCount} reads</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

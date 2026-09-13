import React, { useState } from 'react';
import {
  Newspaper,
  Download,
  Bookmark,
  Sparkles,
  Share2,
} from 'lucide-react';
import { toast } from 'sonner';

interface DigestItem {
  id: string;
  category: 'Supreme Court Ruling' | 'Legal Maxim' | 'Legislative Amendment' | 'Bare Act Point';
  title: string;
  citation?: string;
  summary: string;
  keyTakeaway: string;
  subject: string;
  date: string;
}

const digestData: DigestItem[] = [
  {
    id: 'd-1',
    category: 'Supreme Court Ruling',
    title: 'Section 482 CrPC Power Cannot Be Exercised Mechanically To Stifle Legitimate Prosecution',
    citation: '2025 INSC 142 • 3-Judge Bench (CJI Bench)',
    summary: 'The Apex Court held that while the High Court has inherent powers to prevent abuse of the process of law, such powers must be exercised ex debito justitiae and not to hold a mini-trial at the threshold of framing charges.',
    keyTakeaway: 'Vital for Mains Criminal Procedure answer on quashing of FIRs under BNSS 528 / CrPC 482.',
    subject: 'Criminal Procedure',
    date: '12 Sep 2025',
  },
  {
    id: 'd-2',
    category: 'Legal Maxim',
    title: 'Nemo debet bis vexari pro una et eadem causa',
    summary: 'No man should be twice harassed for one and the same cause. Corresponds directly with Section 300 of the CrPC, Section 337 BNSS, and Article 20(2) of the Indian Constitution.',
    keyTakeaway: 'Distinguish between Double Jeopardy (criminal conviction) and departmental inquiry proceedings.',
    subject: 'Constitutional Law',
    date: '12 Sep 2025',
  },
  {
    id: 'd-3',
    category: 'Legislative Amendment',
    title: 'Key Differences: Organised Crime in BNS (Section 111) vs State Anti-Gangster Acts',
    summary: 'Analysis of Section 111 Bhartiya Nyaya Sanhita which introduces a standalone penal provision for continuing unlawful activity by syndicates without needing state sanction pre-requisites.',
    keyTakeaway: 'Expected 10-marker in upcoming DJS / UP Mains examination.',
    subject: 'Bhartiya Nyaya Sanhita (BNS)',
    date: '11 Sep 2025',
  },
];

export const DailyDigestPage: React.FC = () => {
  const [bookmarked, setBookmarked] = useState<Record<string, boolean>>({});

  const toggleBookmark = (id: string) => {
    setBookmarked((prev) => {
      const next = !prev[id];
      if (next) toast.success('Added to your Personal Starred Vault');
      else toast.info('Removed from Vault');
      return { ...prev, [id]: next };
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-[#c19b48]/15 text-[#c19b48] dark:text-[#e8cf8d] text-xs font-semibold mb-2">
            <Newspaper className="w-3.5 h-3.5" />
            <span>Curated Daily by Faculty Wing</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 dark:text-white">
            Daily Legal Digest & Case Law Brief
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Stay ahead with daily judgments, Bare Act comparative pointers, and Latin maxims.
          </p>
        </div>

        <button
          onClick={() => toast.success("Today's Complete Legal Digest PDF downloaded (1.4 MB)")}
          className="px-4 py-2 rounded-xl bg-[#c19b48] hover:bg-[#d8b862] text-[#061120] font-semibold text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-xs self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>Download Today's Brief (PDF)</span>
        </button>
      </div>

      {/* Featured Maxim Box */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-[#0a1c36] to-[#143564] text-white border border-[#c19b48]/40 shadow-sm space-y-2">
        <div className="flex items-center justify-between text-xs text-[#e8cf8d]">
          <span className="flex items-center gap-1 font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-[#c19b48]" />
            <span>Legal Maxim of the Day</span>
          </span>
          <span className="font-mono text-[11px]">12 September 2025</span>
        </div>
        <h3 className="text-base sm:text-lg font-serif italic text-amber-200">
          "Actus non facit reum, nisi mens sit rea"
        </h3>
        <p className="text-xs text-slate-200 leading-relaxed max-w-3xl">
          An act does not make a person guilty unless the mind is also guilty. Fundamental principle of penal jurisprudence embodied under BNS General Exceptions and Section 21 of BNS.
        </p>
      </div>

      {/* Daily Articles Feed */}
      <div className="space-y-4">
        {digestData.map((item) => (
          <div
            key={item.id}
            className="p-5 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] space-y-3 shadow-xs hover:border-[#c19b48]/60 transition-all"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase bg-amber-50 dark:bg-[#c19b48]/15 text-[#c19b48] dark:text-[#e8cf8d] border border-amber-200 dark:border-[#c19b48]/30">
                  {item.category}
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  {item.subject}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleBookmark(item.id)}
                  className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                    bookmarked[item.id]
                      ? 'bg-amber-50 text-[#c19b48] border-[#c19b48]'
                      : 'text-slate-400 border-slate-200 dark:border-[#143564] hover:text-[#c19b48]'
                  }`}
                  title="Bookmark"
                >
                  <Bookmark className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => toast.success('Link copied to clipboard!')}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-[#143564] text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
                  title="Share"
                >
                  <Share2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <h3 className="text-base font-serif font-bold text-slate-900 dark:text-white">
              {item.title}
            </h3>

            {item.citation && (
              <p className="text-xs font-mono text-[#c19b48] dark:text-[#e8cf8d]">
                {item.citation}
              </p>
            )}

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {item.summary}
            </p>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] text-xs">
              <span className="font-semibold text-slate-900 dark:text-white">Judicial Examination Tip: </span>
              <span className="text-slate-600 dark:text-slate-300">{item.keyTakeaway}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

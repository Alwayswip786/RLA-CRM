import React, { useState } from 'react';
import {
  Scale,
  Search,
  Download,
} from 'lucide-react';
import { toast } from 'sonner';

interface Judgment {
  id: string;
  caseTitle: string;
  citation: string;
  bench: string;
  subject: string;
  year: number;
  ratio: string;
  importance: string;
}

const judgments: Judgment[] = [
  {
    id: 'j-1',
    caseTitle: 'Kesavananda Bharati v. State of Kerala',
    citation: '(1973) 4 SCC 225',
    bench: '13-Judge Constitutional Bench',
    subject: 'Constitutional Law',
    year: 1973,
    ratio: 'Parliament cannot alter the Basic Structure of the Indian Constitution under Article 368 amending power.',
    importance: 'Most cited constitutional precedent in judicial mains examinations.',
  },
  {
    id: 'j-2',
    caseTitle: 'Maneka Gandhi v. Union of India',
    citation: '(1978) 1 SCC 248',
    bench: '7-Judge Bench',
    subject: 'Fundamental Rights / Article 21',
    year: 1978,
    ratio: 'Procedure established by law under Article 21 must be just, fair, and reasonable, incorporating American Due Process.',
    importance: 'Mandatory citation for any Article 14, 19, or 21 analytical essay.',
  },
  {
    id: 'j-3',
    caseTitle: 'Arnesh Kumar v. State of Bihar',
    citation: '(2014) 8 SCC 273',
    bench: '2-Judge Bench',
    subject: 'Criminal Procedure Code (CrPC / BNSS)',
    year: 2014,
    ratio: 'Mandatory guidelines for arrest under Section 41 CrPC in offences punishable with imprisonment up to 7 years.',
    importance: 'Repeatedly asked in Prelims section 41A and Mains bail problems.',
  },
  {
    id: 'j-4',
    caseTitle: 'Dhulabhai v. State of Madhya Pradesh',
    citation: 'AIR 1969 SC 78',
    bench: '5-Judge Constitution Bench',
    subject: 'Code of Civil Procedure (CPC Section 9)',
    year: 1969,
    ratio: 'Enunciated the definitive 7 principles governing exclusion of jurisdiction of civil courts.',
    importance: 'Benchmark question for Section 9 in civil law paper.',
  },
];

export const JudgmentsPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');

  const filtered = judgments.filter((j) => {
    const matchesSubject = selectedSubject === 'all' || j.subject.toLowerCase().includes(selectedSubject.toLowerCase());
    const matchesSearch = j.caseTitle.toLowerCase().includes(search.toLowerCase()) || j.ratio.toLowerCase().includes(search.toLowerCase());
    return matchesSubject && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-[#c19b48]/15 text-[#c19b48] dark:text-[#e8cf8d] text-xs font-semibold mb-2">
            <Scale className="w-3.5 h-3.5" />
            <span>Apex Court Case Law Archive</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 dark:text-white">
            Landmark Judgments Digest
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Searchable repository with bench strength, ratio decidendi, and Mains exam answer utility.
          </p>
        </div>

        {/* Search & Subject Filter */}
        <div className="flex items-center gap-2">
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-[#c19b48]"
          >
            <option value="all">All Subjects</option>
            <option value="constitutional">Constitutional Law</option>
            <option value="criminal">Criminal Law</option>
            <option value="civil">Civil Procedure</option>
          </select>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search case name or ratio..."
              className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#c19b48]"
            />
          </div>
        </div>
      </div>

      {/* Judgments Cards */}
      <div className="space-y-4">
        {filtered.map((j) => (
          <div
            key={j.id}
            className="p-6 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] space-y-3 shadow-xs hover:border-[#c19b48]/60 transition-all"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase bg-amber-50 dark:bg-[#c19b48]/15 text-[#c19b48] dark:text-[#e8cf8d] border border-amber-200 dark:border-[#c19b48]/30">
                  {j.subject}
                </span>
                <span className="text-xs font-mono text-slate-400">{j.bench}</span>
              </div>
              <span className="text-xs font-mono font-bold text-[#c19b48] dark:text-[#e8cf8d]">
                {j.citation}
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-serif font-bold text-slate-900 dark:text-white">
              {j.caseTitle}
            </h3>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] text-xs space-y-1">
              <span className="font-bold text-slate-900 dark:text-white block">Ratio Decidendi:</span>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed italic">
                "{j.ratio}"
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-xs">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                <strong>Mains Utility:</strong> {j.importance}
              </span>

              <button
                onClick={() => toast.success(`Downloaded headnote brief for ${j.caseTitle}`)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#061120] hover:bg-[#c19b48] hover:text-[#061120] text-slate-700 dark:text-slate-300 font-semibold text-xs border border-slate-200 dark:border-[#143564] transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3 h-3" />
                <span>Download Brief</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

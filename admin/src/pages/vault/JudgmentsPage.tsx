import React from 'react';
import {
  Gavel,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';

interface LandmarkCase {
  id: string;
  caseTitle: string;
  citation: string;
  bench: string;
  subject: string;
  threePointRatio: string[];
}

const CASES: LandmarkCase[] = [
  {
    id: 'case-01',
    caseTitle: 'Kiran Singh & Ors. v. Chaman Paswan & Ors.',
    citation: '1954 AIR 340, 1955 SCR 117',
    bench: 'Hon\'ble Supreme Court (4-Judge Bench)',
    subject: 'Civil Procedure Code (Section 21)',
    threePointRatio: [
      'A decree passed by a court without inherent jurisdiction is a nullity and its invalidity can be challenged at any stage, even in collateral proceedings.',
      'Defect of pecuniary or territorial jurisdiction does not go to the root of the court\'s competence unless prejudice has been caused to the merits.',
      'Section 21 CPC limits appellate or revisional interference regarding territorial/pecuniary objections unless raised at the earliest opportunity.',
    ],
  },
  {
    id: 'case-02',
    caseTitle: 'Arnesh Kumar v. State of Bihar & Anr.',
    citation: '(2014) 8 SCC 273',
    bench: 'Hon\'ble Supreme Court (2-Judge Bench)',
    subject: 'Criminal Procedure / BNSS Section 35',
    threePointRatio: [
      'Arrest should not be made routinely upon registration of a case punishable with imprisonment up to 7 years.',
      'Magistrate must verify the satisfaction recorded by the police officer before authorizing further detention under Section 167 CrPC (now BNSS).',
      'Failure to adhere to mandatory notice of appearance guidelines renders police officers liable to departmental inquiry and contempt of court.',
    ],
  },
];

export const JudgmentsPage: React.FC = () => {
  return (
    <div className="space-y-6 select-none">
      <div className="p-6 sm:p-8 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C19B48]/15 border border-[#C19B48]/30 text-[#C19B48] text-xs font-semibold">
            <Gavel className="w-3.5 h-3.5" />
            <span>Landmark Ratio Repository</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#F7F3E6]">
            Landmark Judgments Digest CMS
          </h1>
          <p className="text-xs text-[#A8A294] max-w-2xl leading-relaxed">
            Curate 3-point ratio summaries of Supreme Court and High Court precedents essential for judicial mains and interview preparation.
          </p>
        </div>

        <button
          onClick={() => toast.info('New Judgment Entry Creator')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C19B48] hover:bg-[#D8B862] text-[#1E1E1E] text-xs font-bold transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Landmark Case</span>
        </button>
      </div>

      <div className="space-y-4">
        {CASES.map((item) => (
          <div
            key={item.id}
            className="p-6 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] hover:border-[#C19B48]/50 transition-colors space-y-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="font-mono text-xs font-bold text-[#C19B48] bg-[#C19B48]/15 px-2.5 py-0.5 rounded border border-[#C19B48]/30">
                {item.subject}
              </span>
              <span className="font-mono text-xs text-[#A8A294]">{item.citation}</span>
            </div>

            <div>
              <h3 className="font-serif text-lg font-bold text-[#F7F3E6]">
                {item.caseTitle}
              </h3>
              <p className="text-xs text-[#A8A294] mt-0.5">Coram: {item.bench}</p>
            </div>

            <div className="p-4 rounded-xl bg-[#262626] border border-[#3D3D3D] space-y-2">
              <span className="text-[10px] uppercase font-bold text-[#C19B48]">
                3-Point Ratio Decidendi (For Mains Formulation):
              </span>
              <ul className="space-y-1.5 text-xs text-[#F7F3E6] list-disc list-inside">
                {item.threePointRatio.map((point, i) => (
                  <li key={i} className="leading-relaxed">{point}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

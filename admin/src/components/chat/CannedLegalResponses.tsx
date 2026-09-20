import React, { useState } from 'react';
import { ChevronDown, Sparkles, Scale, Check } from 'lucide-react';

export interface CannedResponse {
  id: string;
  category: string;
  title: string;
  precedent: string;
  citation: string;
  text: string;
}

export const CANNED_LEGAL_RESPONSES: CannedResponse[] = [
  {
    id: 'cpc-res-judicata',
    category: 'Code of Civil Procedure',
    title: 'Res Judicata between Co-Defendants',
    precedent: 'Mahboob Sahab v. Syed Ismail (1995) 1 SCC 693',
    citation: 'Section 11 CPC',
    text:
      'As authoritatively held in Mahboob Sahab v. Syed Ismail (1995 SC), for res judicata to operate between co-defendants, three cumulative conditions must be satisfied:\n1. There must be a conflict of interest between the co-defendants;\n2. It must be necessary to decide this conflict in order to grant the plaintiff the relief claimed; and\n3. The question must have been actually and finally decided between them.\nIf no relief was claimed inter-se and no determination was necessary, subsequent proceedings between co-defendants are not barred.',
  },
  {
    id: 'bnss-arrest-notice',
    category: 'BNSS 2023 / Criminal Procedure',
    title: 'Section 35 BNSS Mandatory Notice of Appearance',
    precedent: 'Arnesh Kumar v. State of Bihar (2014) 8 SCC 273',
    citation: 'Section 35 BNSS (Old Section 41A CrPC)',
    text:
      'Under Section 35 of the Bharatiya Nagarik Suraksha Sanhita (BNSS), issuance of notice of appearance is mandatory for offences punishable with imprisonment up to 7 years. Arrest cannot be effected routinely unless the investigating officer records in writing reasons satisfying Section 35(1)(b) (e.g. credible apprehension of witness tampering or flight risk). Failure to comply renders the officer liable for departmental inquiry and contempt under Arnesh Kumar guidelines.',
  },
  {
    id: 'bns-organized-crime',
    category: 'Bhartiya Nyaya Sanhita',
    title: 'Section 111 BNS Organized Crime Sentencing',
    precedent: 'Statutory Interpretation of Section 111(2)(a) BNS',
    citation: 'Section 111(2)(a) BNS 2023',
    text:
      'Under Section 111(2)(a) of the Bhartiya Nyaya Sanhita (BNS), if an act of organized crime results in the death of any person, the statute specifies death or imprisonment for life, and a mandatory minimum fine of ₹10,00,000. The trial court has no discretion to sentence below life imprisonment when death has resulted.',
  },
  {
    id: 'cpc-written-statement',
    category: 'Code of Civil Procedure',
    title: 'Order VIII Rule 1 CPC 90-Day WS Condonation',
    precedent: 'Salem Advocate Bar Association v. Union of India (2005) 6 SCC 344',
    citation: 'Order VIII Rule 1 CPC',
    text:
      'The Supreme Court in Salem Advocate Bar Association held that the 90-day outer limit for filing a written statement under Order VIII Rule 1 CPC is directory and not mandatory in ordinary civil suits. In exceptional and grave circumstances, the court possesses inherent power under Section 151 CPC to extend time, provided cogent reasons are recorded and adequate costs are awarded.',
  },
  {
    id: 'bsa-confession',
    category: 'Bharatiya Sakshya Adhiniyam / Evidence',
    title: 'Confession to Police Officer & Digital Recording',
    precedent: 'Statutory Inadmissibility u/s 23 BSA (Old Section 25 IEA)',
    citation: 'Section 23 BSA 2023',
    text:
      'Under Section 23 of the Bharatiya Sakshya Adhiniyam (BSA), no confession made to a police officer can be proved against an accused. The fact that the confession was captured on body-worn camera, CCTV, or smartphone video does not dilute this absolute statutory exclusion. Electronic records of police confessions remain inadmissible.',
  },
  {
    id: 'crpc-quashing-fir',
    category: 'BNSS 2023 / Criminal Procedure',
    title: 'Section 528 BNSS Inherent Powers & Quashing Guidelines',
    precedent: 'State of Haryana v. Bhajan Lal 1992 Supp (1) SCC 335',
    citation: 'Section 528 BNSS (Old Section 482 CrPC)',
    text:
      'The High Court can exercise inherent powers under Section 528 BNSS to quash an FIR only within the 7 illustrative categories set out in Bhajan Lal:\n1. Allegations in FIR even if taken at face value do not prima facie constitute any offence;\n2. Allegations are so absurd and inherently improbable that no prudent person can reach a just conclusion;\n3. The criminal proceeding is manifestly attended with mala fides or instituted with an ulterior motive for wreaking vengeance.',
  },
];

interface CannedLegalResponsesProps {
  onSelectResponse: (text: string) => void;
}

export const CannedLegalResponses: React.FC<CannedLegalResponsesProps> = ({ onSelectResponse }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleSelect = (r: CannedResponse) => {
    onSelectResponse(r.text);
    setCopiedId(r.id);
    setTimeout(() => {
      setCopiedId(null);
      setIsOpen(false);
    }, 400);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#262626] hover:bg-[#333333] border border-[#3D3D3D] text-xs font-semibold text-[#C19B48] transition-colors cursor-pointer"
        title="Insert Landmark Judicial Citation"
      >
        <Sparkles className="w-3.5 h-3.5" />
        <span>Canned Legal Precedents</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-96 max-h-80 overflow-y-auto rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] shadow-2xl p-2 space-y-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="p-2 border-b border-[#3D3D3D] flex items-center justify-between text-[11px] text-[#A8A294]">
            <span className="font-serif font-bold text-[#F7F3E6] flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-[#C19B48]" />
              <span>Supreme Court Landmark Citations</span>
            </span>
            <span>Click to insert</span>
          </div>

          <div className="space-y-1">
            {CANNED_LEGAL_RESPONSES.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => handleSelect(r)}
                className="w-full text-left p-2.5 rounded-xl hover:bg-[#2A2A2A] border border-transparent hover:border-[#C19B48]/30 transition-all cursor-pointer space-y-1 group"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-[#F7F3E6] group-hover:text-[#C19B48]">
                  <span>{r.title}</span>
                  {copiedId === r.id ? (
                    <Check className="w-3.5 h-3.5 text-[#34D399]" />
                  ) : (
                    <span className="text-[10px] text-[#A8A294] font-mono">{r.citation}</span>
                  )}
                </div>
                <div className="text-[11px] text-[#A8A294] line-clamp-1 italic font-serif">
                  {r.precedent}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

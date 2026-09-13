import React from 'react';
import {
  Scale,
  Plus,
  Download,
} from 'lucide-react';
import { toast } from 'sonner';

interface BareActNote {
  id: string;
  actTitle: string;
  sectionsCovered: string;
  category: string;
  author: string;
  downloadsCount: number;
  pdfSize: string;
  lastUpdated: string;
}

const NOTES: BareActNote[] = [
  {
    id: 'note-01',
    actTitle: 'Civil Procedure Code, 1908',
    sectionsCovered: 'Section 9 to 14: Jurisdiction, Res Sub Judice & Res Judicata Flowcharts',
    category: 'Procedural Law',
    author: 'Adv. Rajinder Sir',
    downloadsCount: 512,
    pdfSize: '6.4 MB PDF',
    lastUpdated: '10 Sep 2026',
  },
  {
    id: 'note-02',
    actTitle: 'Bharatiya Nagarik Suraksha Sanhita, 2023',
    sectionsCovered: 'Section 35 to 60: Arrest, Bail & Preventive Actions Master Table',
    category: 'Criminal Procedure',
    author: 'Adv. Sharma',
    downloadsCount: 480,
    pdfSize: '5.2 MB PDF',
    lastUpdated: '08 Sep 2026',
  },
  {
    id: 'note-03',
    actTitle: 'Bharatiya Nyaya Sanhita, 2023',
    sectionsCovered: 'Section 100 to 110: Offences Against Human Body vs Old IPC Mapping',
    category: 'Substantive Criminal Law',
    author: 'Adv. Rajinder Sir',
    downloadsCount: 640,
    pdfSize: '7.8 MB PDF',
    lastUpdated: '05 Sep 2026',
  },
  {
    id: 'note-04',
    actTitle: 'Bharatiya Sakshya Adhiniyam, 2023',
    sectionsCovered: 'Section 22 to 27: Relevancy of Confessions & Electronic Evidence',
    category: 'Law of Evidence',
    author: 'Adv. Gupta',
    downloadsCount: 390,
    pdfSize: '4.8 MB PDF',
    lastUpdated: '02 Sep 2026',
  },
];

export const BareActsPage: React.FC = () => {
  return (
    <div className="space-y-6 select-none">
      <div className="p-6 sm:p-8 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C19B48]/15 border border-[#C19B48]/30 text-[#C19B48] text-xs font-semibold">
            <Scale className="w-3.5 h-3.5" />
            <span>Statutory Knowledge Vault</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#F7F3E6]">
            Bare Act Notes & Decoding Charts CMS
          </h1>
          <p className="text-xs text-[#A8A294] max-w-2xl leading-relaxed">
            Upload authoritative section-by-section breakdown notes, comparative mapping tables (IPC vs BNS, CrPC vs BNSS), and downloadable memory charts.
          </p>
        </div>

        <button
          onClick={() => toast.info('Upload Bare Act Note PDF')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C19B48] hover:bg-[#D8B862] text-[#1E1E1E] text-xs font-bold transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Upload Notes PDF</span>
        </button>
      </div>

      <div className="space-y-4">
        {NOTES.map((note) => (
          <div
            key={note.id}
            className="p-6 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] hover:border-[#C19B48]/50 transition-colors space-y-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#C19B48] bg-[#C19B48]/15 px-2.5 py-0.5 rounded border border-[#C19B48]/30">
                  {note.actTitle}
                </span>
                <span className="text-xs text-[#A8A294] bg-[#262626] px-2 py-0.5 rounded border border-[#3D3D3D]">
                  {note.category}
                </span>
              </div>
              <span className="text-xs text-[#34D399] font-medium">
                {note.downloadsCount} Student Downloads
              </span>
            </div>

            <h3 className="font-serif text-base font-bold text-[#F7F3E6]">
              {note.sectionsCovered}
            </h3>

            <div className="pt-3 border-t border-[#3D3D3D] flex items-center justify-between text-xs text-[#A8A294]">
              <span>Authored by: <strong className="text-[#F7F3E6]">{note.author}</strong> • Updated {note.lastUpdated}</span>
              <button
                onClick={() => toast.success(`Downloading ${note.pdfSize}`)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#262626] hover:bg-[#C19B48] text-[#F7F3E6] hover:text-[#1E1E1E] border border-[#3D3D3D] font-semibold transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{note.pdfSize}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

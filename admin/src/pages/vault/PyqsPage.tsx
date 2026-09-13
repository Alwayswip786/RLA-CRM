import React from 'react';
import {
  FolderArchive,
  Download,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';

interface PyqPaper {
  id: string;
  stateExam: string;
  year: number;
  stage: 'Prelims' | 'Mains';
  paperName: string;
  totalMarks: number;
  solvedByFaculty: string;
  fileSize: string;
}

const PYQ_LIST: PyqPaper[] = [
  {
    id: 'pyq-01',
    stateExam: 'Delhi Judicial Service (DJS)',
    year: 2024,
    stage: 'Mains',
    paperName: 'Civil Law I (CPC, Contract, TPA, SRA) Solved with Model Ratios',
    totalMarks: 200,
    solvedByFaculty: 'Adv. Rajinder Sir',
    fileSize: '8.4 MB PDF',
  },
  {
    id: 'pyq-02',
    stateExam: 'Delhi Judicial Service (DJS)',
    year: 2024,
    stage: 'Prelims',
    paperName: 'DJS Preliminary Examination Full Solved Question Paper',
    totalMarks: 200,
    solvedByFaculty: 'Faculty Board',
    fileSize: '5.2 MB PDF',
  },
  {
    id: 'pyq-03',
    stateExam: 'Haryana Civil Services (Judicial)',
    year: 2023,
    stage: 'Mains',
    paperName: 'Civil Law & Criminal Law Combined Solved Archive',
    totalMarks: 400,
    solvedByFaculty: 'Adv. Sharma & Adv. Rajinder Sir',
    fileSize: '12.1 MB PDF',
  },
  {
    id: 'pyq-04',
    stateExam: 'UP PCS-J Judicial Examination',
    year: 2023,
    stage: 'Mains',
    paperName: 'Substantive Law & Procedure and Evidence Solved Compilation',
    totalMarks: 400,
    solvedByFaculty: 'Adv. Rajinder Sir',
    fileSize: '10.5 MB PDF',
  },
];

export const PyqsPage: React.FC = () => {
  return (
    <div className="space-y-6 select-none">
      <div className="p-6 sm:p-8 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C19B48]/15 border border-[#C19B48]/30 text-[#C19B48] text-xs font-semibold">
            <FolderArchive className="w-3.5 h-3.5" />
            <span>State Judiciary Archives</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#F7F3E6]">
            Solved PYQ Archive & Model Solutions
          </h1>
          <p className="text-xs text-[#A8A294] max-w-2xl leading-relaxed">
            Manage 10-year solved state judicial papers (Delhi, Haryana, UP, MP) with official model answer scripts prepared by senior academy faculty.
          </p>
        </div>

        <button
          onClick={() => toast.info('Upload Solved Paper PDF Modal')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C19B48] hover:bg-[#D8B862] text-[#1E1E1E] text-xs font-bold transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Upload Solved Paper</span>
        </button>
      </div>

      <div className="space-y-4">
        {PYQ_LIST.map((paper) => (
          <div
            key={paper.id}
            className="p-6 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] hover:border-[#C19B48]/50 transition-colors space-y-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-[#C19B48] bg-[#C19B48]/15 px-2.5 py-0.5 rounded border border-[#C19B48]/30">
                  {paper.stateExam} ({paper.year})
                </span>
                <span className="text-xs text-[#34D399] bg-[#34D399]/15 px-2 py-0.5 rounded font-semibold">
                  {paper.stage} Stage
                </span>
              </div>
              <span className="text-xs text-[#A8A294]">
                Marks: <strong className="text-[#F7F3E6]">{paper.totalMarks}</strong>
              </span>
            </div>

            <h3 className="font-serif text-base font-bold text-[#F7F3E6]">
              {paper.paperName}
            </h3>

            <div className="pt-3 border-t border-[#3D3D3D] flex items-center justify-between text-xs text-[#A8A294]">
              <span>Prepared & Solved by: <strong className="text-[#F7F3E6]">{paper.solvedByFaculty}</strong></span>
              <button
                onClick={() => toast.success(`Downloading ${paper.fileSize}`)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#262626] hover:bg-[#C19B48] text-[#F7F3E6] hover:text-[#1E1E1E] border border-[#3D3D3D] font-semibold transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Solved PDF ({paper.fileSize})</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  FolderArchive,
  Download,
} from 'lucide-react';
import { toast } from 'sonner';

interface PyqPaper {
  id: string;
  state: string;
  stage: 'Prelims' | 'Mains';
  year: number;
  subject: string;
  totalMarks: number;
  solutionsProvided: boolean;
  fileSize: string;
}

const pyqPapers: PyqPaper[] = [
  {
    id: 'pyq-1',
    state: 'Delhi (DJS)',
    stage: 'Prelims',
    year: 2023,
    subject: 'Complete Law & General Knowledge Paper',
    totalMarks: 200,
    solutionsProvided: true,
    fileSize: '4.2 MB PDF',
  },
  {
    id: 'pyq-2',
    state: 'Delhi (DJS)',
    stage: 'Mains',
    year: 2023,
    subject: 'Civil Law I, Civil Law II & Criminal Law',
    totalMarks: 600,
    solutionsProvided: true,
    fileSize: '8.6 MB PDF',
  },
  {
    id: 'pyq-3',
    state: 'Uttar Pradesh (UP PCS-J)',
    stage: 'Prelims',
    year: 2023,
    subject: 'Paper II: Law (150 Questions)',
    totalMarks: 300,
    solutionsProvided: true,
    fileSize: '3.8 MB PDF',
  },
  {
    id: 'pyq-4',
    state: 'Haryana (HCS Judicial)',
    stage: 'Prelims',
    year: 2024,
    subject: 'Law Objective Paper (125 MCQs)',
    totalMarks: 500,
    solutionsProvided: true,
    fileSize: '3.5 MB PDF',
  },
  {
    id: 'pyq-5',
    state: 'Madhya Pradesh (MP CJ)',
    stage: 'Prelims',
    year: 2023,
    subject: 'Online Prelims Exam Paper with Answer Key',
    totalMarks: 150,
    solutionsProvided: true,
    fileSize: '2.9 MB PDF',
  },
];

export const PyqArchivePage: React.FC = () => {
  const [selectedState, setSelectedState] = useState('all');
  const [selectedStage, setSelectedStage] = useState('all');

  const filtered = pyqPapers.filter((p) => {
    const matchesState = selectedState === 'all' || p.state.toLowerCase().includes(selectedState.toLowerCase());
    const matchesStage = selectedStage === 'all' || p.stage.toLowerCase() === selectedStage.toLowerCase();
    return matchesState && matchesStage;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-[#c19b48]/15 text-[#c19b48] dark:text-[#e8cf8d] text-xs font-semibold mb-2">
            <FolderArchive className="w-3.5 h-3.5" />
            <span>10-Year Judicial Question Bank</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 dark:text-white">
            PYQ Solved Archive (2015–2024)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Official question papers with authentic step-by-step solutions drafted by Rajinder Law Academy faculty.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-[#c19b48]"
          >
            <option value="all">All States</option>
            <option value="delhi">Delhi (DJS)</option>
            <option value="uttar pradesh">Uttar Pradesh (UP PCS-J)</option>
            <option value="haryana">Haryana (HCS)</option>
            <option value="madhya pradesh">Madhya Pradesh (MP CJ)</option>
          </select>

          <select
            value={selectedStage}
            onChange={(e) => setSelectedStage(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-[#c19b48]"
          >
            <option value="all">All Stages</option>
            <option value="prelims">Prelims</option>
            <option value="mains">Mains</option>
          </select>
        </div>
      </div>

      {/* Grid of Papers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((paper) => (
          <div
            key={paper.id}
            className="p-5 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] space-y-3 shadow-xs hover:border-[#c19b48]/60 transition-all flex flex-col justify-between"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase bg-slate-100 dark:bg-[#061120] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#143564]">
                  {paper.state}
                </span>
                <span className="font-mono text-xs font-bold text-[#c19b48] dark:text-[#e8cf8d]">
                  {paper.year} • {paper.stage}
                </span>
              </div>

              <h3 className="text-base font-serif font-bold text-slate-900 dark:text-white">
                {paper.subject}
              </h3>

              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between pt-1">
                <span>Marks: {paper.totalMarks}</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  ✓ Model Solutions Included
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-[#143564] flex items-center justify-between text-xs">
              <span className="text-slate-400 font-mono text-[11px]">{paper.fileSize}</span>
              <button
                onClick={() => toast.success(`Downloading ${paper.state} ${paper.year} Paper with Solutions`)}
                className="px-3 py-1.5 rounded-lg bg-[#c19b48] hover:bg-[#d8b862] text-[#061120] font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

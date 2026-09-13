import React, { useState } from 'react';
import {
  BellRing,
  Filter,
  Download,
} from 'lucide-react';
import { toast } from 'sonner';

interface Notice {
  id: string;
  title: string;
  category: 'Examination' | 'Classroom Shift' | 'Admissions' | 'Holiday';
  date: string;
  content: string;
  isImportant?: boolean;
  circularNo: string;
}

const noticesData: Notice[] = [
  {
    id: 'n-1',
    title: 'Delhi Judicial Services (DJS) 2025 Preliminary Exam Notification Released',
    category: 'Examination',
    date: '11 Sep 2025',
    circularNo: 'RLA/CIR/2025/112',
    isImportant: true,
    content: 'Delhi High Court has officially released the advertisement for 53 vacancies in DJS. Special 45-day crash revision batch commences this Monday at Rajinder Law Academy.',
  },
  {
    id: 'n-2',
    title: 'Evening Shift CPC Timing Adjusted for Live Interactive Bare Act Workshop',
    category: 'Classroom Shift',
    date: '10 Sep 2025',
    circularNo: 'RLA/CIR/2025/110',
    content: 'The evening lecture on Code of Civil Procedure will begin at 5:00 PM instead of 5:30 PM to accommodate 30 minutes of live drafting practice.',
  },
  {
    id: 'n-3',
    title: 'Autumn Court Recess & Special Bare Act Doubt Clinics Schedule',
    category: 'Holiday',
    date: '05 Sep 2025',
    circularNo: 'RLA/CIR/2025/104',
    content: 'Regular offline classes will remain suspended for 3 days during the festive break. Online mock test portal and library chambers will remain fully operational 24/7.',
  },
];

export const NoticesPage: React.FC = () => {
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all'
    ? noticesData
    : noticesData.filter((n) => n.category.toLowerCase() === filter.toLowerCase());

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 text-xs font-semibold mb-2">
            <BellRing className="w-3.5 h-3.5" />
            <span>Official Academy Circulars</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 dark:text-white">
            Classroom Notice Board
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Verified official communications, test dates, and administrative circulars.
          </p>
        </div>

        {/* Filter Dropdown */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-[#c19b48]"
          >
            <option value="all">All Circulars</option>
            <option value="examination">Examinations</option>
            <option value="classroom shift">Classroom Shifts</option>
            <option value="holiday">Holidays & Recess</option>
          </select>
        </div>
      </div>

      {/* Notices Feed */}
      <div className="space-y-4">
        {filtered.map((item) => (
          <div
            key={item.id}
            className={`p-6 rounded-2xl bg-white dark:bg-[#0a1c36] border space-y-3 shadow-xs transition-all ${
              item.isImportant
                ? 'border-[#c19b48] shadow-sm'
                : 'border-slate-200 dark:border-[#143564]'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase bg-slate-100 dark:bg-[#061120] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#143564]">
                  {item.category}
                </span>

                {item.isImportant && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/15 text-red-500 font-bold border border-red-500/30 animate-pulse">
                    PRIORITY CIRCULAR
                  </span>
                )}
              </div>

              <span className="text-xs font-mono text-slate-400">
                {item.circularNo} • {item.date}
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-serif font-bold text-slate-900 dark:text-white">
              {item.title}
            </h3>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {item.content}
            </p>

            <div className="flex items-center justify-between pt-2 text-xs border-t border-slate-100 dark:border-[#143564]">
              <span className="text-[11px] text-slate-400">Issued by: Director Office, Rajinder Law Academy</span>
              <button
                onClick={() => toast.success(`Official Circular ${item.circularNo} downloaded as PDF`)}
                className="inline-flex items-center gap-1 text-[11px] text-[#c19b48] dark:text-[#e8cf8d] font-semibold hover:underline cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Official Gazette</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

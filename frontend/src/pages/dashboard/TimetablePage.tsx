import React, { useState } from 'react';
import {
  Clock,
  User,
  MapPin,
  CalendarCheck,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';

interface Slot {
  time: string;
  subject: string;
  topic: string;
  faculty: string;
  room: string;
  type: 'Major Act' | 'Minor Act' | 'Test Series' | 'Doubt Session';
}

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const scheduleData: Record<string, Slot[]> = {
  Monday: [
    {
      time: '08:30 AM - 10:30 AM',
      subject: 'Code of Civil Procedure (CPC)',
      topic: 'Pleadings, Plaint & Written Statement (Order 6 & 8)',
      faculty: 'Adv. Rajinder Sir',
      room: 'Chamber 101',
      type: 'Major Act',
    },
    {
      time: '11:00 AM - 01:00 PM',
      subject: 'Bhartiya Nyaya Sanhita (BNS)',
      topic: 'Homicide, Murder & Culpable Homicide (Sec 100 to 105)',
      faculty: 'Adv. Rajinder Sir',
      room: 'Chamber 101',
      type: 'Major Act',
    },
    {
      time: '02:00 PM - 03:30 PM',
      subject: 'Weekly Prelims Speed Test',
      topic: '100 MCQs - IPC vs BNS Comparative Assessment',
      faculty: 'Exam Cell',
      room: 'Computer Lab B',
      type: 'Test Series',
    },
  ],
  Tuesday: [
    {
      time: '08:30 AM - 10:30 AM',
      subject: 'Code of Civil Procedure (CPC)',
      topic: 'Summons, Appearance of Parties & Ex-Parte Decrees',
      faculty: 'Adv. Rajinder Sir',
      room: 'Chamber 101',
      type: 'Major Act',
    },
    {
      time: '11:00 AM - 01:00 PM',
      subject: 'Bhartiya Nagarik Suraksha Sanhita (BNSS)',
      topic: 'FIR, Investigation & Powers of Police (Sec 173 to 190)',
      faculty: 'Adv. Rajinder Sir',
      room: 'Chamber 101',
      type: 'Major Act',
    },
    {
      time: '03:00 PM - 04:30 PM',
      subject: 'Mains Daily Answer Writing (DAW)',
      topic: 'Drafting Charges & Framing of Issues workshop',
      faculty: 'Adv. Vikramjit Singh',
      room: 'Chamber 104',
      type: 'Minor Act',
    },
  ],
  Wednesday: [
    {
      time: '08:30 AM - 10:30 AM',
      subject: 'Indian Evidence Act / BSA',
      topic: 'Dying Declaration & Admissions (Sec 26 to 32)',
      faculty: 'Adv. Neha Sharma',
      room: 'Chamber 102',
      type: 'Major Act',
    },
    {
      time: '11:00 AM - 01:00 PM',
      subject: 'Constitution of India',
      topic: 'Writ Jurisdictions: Habeas Corpus & Mandamus',
      faculty: 'Adv. Rajinder Sir',
      room: 'Chamber 101',
      type: 'Major Act',
    },
    {
      time: '04:00 PM - 05:30 PM',
      subject: 'Mentorship & 1-on-1 Doubts',
      topic: 'Case Law Citation clinic with Academic Director',
      faculty: 'Adv. Rajinder Sir',
      room: 'Director Chamber',
      type: 'Doubt Session',
    },
  ],
  Thursday: [
    {
      time: '08:30 AM - 10:30 AM',
      subject: 'Code of Civil Procedure (CPC)',
      topic: 'Execution of Decrees (Order 21 Deep Dive)',
      faculty: 'Adv. Rajinder Sir',
      room: 'Chamber 101',
      type: 'Major Act',
    },
    {
      time: '11:00 AM - 01:00 PM',
      subject: 'Specific Relief Act (SRA)',
      topic: 'Injunctions & Specific Performance of Contract',
      faculty: 'Adv. Vikramjit Singh',
      room: 'Chamber 103',
      type: 'Minor Act',
    },
  ],
  Friday: [
    {
      time: '08:30 AM - 10:30 AM',
      subject: 'Limitation Act, 1963',
      topic: 'Condonation of Delay (Section 5 & Legal Disability Sec 6)',
      faculty: 'Adv. Neha Sharma',
      room: 'Chamber 102',
      type: 'Minor Act',
    },
    {
      time: '11:00 AM - 01:00 PM',
      subject: 'Constitution of India',
      topic: 'Basic Structure Doctrine & Judicial Review',
      faculty: 'Adv. Rajinder Sir',
      room: 'Chamber 101',
      type: 'Major Act',
    },
  ],
  Saturday: [
    {
      time: '09:00 AM - 12:00 PM',
      subject: 'All-India Prelims Mock Test',
      topic: 'Full Length 200 Questions Mock (Simulated DJS/UP PCS-J)',
      faculty: 'Test Evaluation Cell',
      room: 'Main Examination Hall',
      type: 'Test Series',
    },
    {
      time: '01:00 PM - 03:00 PM',
      subject: 'Mock Paper Post-Mortem & Analysis',
      topic: 'Line-by-line solution discussion with Rajinder Sir',
      faculty: 'Adv. Rajinder Sir',
      room: 'Chamber 101',
      type: 'Major Act',
    },
  ],
};

export const TimetablePage: React.FC = () => {
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [activeShift, setActiveShift] = useState<'morning' | 'evening'>('morning');

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-[#c19b48]/15 text-[#c19b48] dark:text-[#e8cf8d] text-xs font-semibold mb-2">
            <CalendarCheck className="w-3.5 h-3.5" />
            <span>Academic Schedule 2025-26</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 dark:text-white">
            Batch Timetable & Shift Schedule
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Foundation Judicial Services Batch (Morning 8:30 AM & Evening 5:00 PM Shifts)
          </p>
        </div>

        {/* Shift Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setActiveShift('morning');
              toast.info('Viewing Morning Shift (Chamber Batch A)');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              activeShift === 'morning'
                ? 'bg-[#0a1c36] dark:bg-[#143564] text-white border-[#c19b48]/60 shadow-xs'
                : 'bg-white dark:bg-[#061120] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-[#143564]'
            }`}
          >
            Morning Shift (8:30 AM)
          </button>
          <button
            onClick={() => {
              setActiveShift('evening');
              toast.info('Viewing Evening Shift (Chamber Batch B)');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              activeShift === 'evening'
                ? 'bg-[#0a1c36] dark:bg-[#143564] text-white border-[#c19b48]/60 shadow-xs'
                : 'bg-white dark:bg-[#061120] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-[#143564]'
            }`}
          >
            Evening Shift (5:00 PM)
          </button>
        </div>
      </div>

      {/* Days Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {days.map((d) => (
          <button
            key={d}
            onClick={() => setSelectedDay(d)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              selectedDay === d
                ? 'bg-[#c19b48] text-[#061120] shadow-md'
                : 'bg-white dark:bg-[#0a1c36] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#143564] hover:bg-slate-100 dark:hover:bg-white/5'
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      {/* Slots List for Selected Day */}
      <div className="space-y-4">
        {scheduleData[selectedDay]?.map((slot, index) => (
          <div
            key={index}
            className="p-5 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs hover:border-[#c19b48]/60 transition-all"
          >
            <div className="space-y-2 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-[#061120] text-slate-800 dark:text-slate-200 text-xs font-mono font-semibold border border-slate-200 dark:border-[#143564]">
                  <Clock className="w-3 h-3 text-[#c19b48]" />
                  {slot.time}
                </span>

                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    slot.type === 'Major Act'
                      ? 'bg-amber-500/15 text-[#c19b48] dark:text-[#e8cf8d] border border-amber-500/30'
                      : slot.type === 'Test Series'
                      ? 'bg-red-500/15 text-red-500 border border-red-500/30'
                      : 'bg-blue-500/15 text-blue-500 border border-blue-500/30'
                  }`}
                >
                  {slot.type}
                </span>
              </div>

              <h3 className="text-base font-serif font-bold text-slate-900 dark:text-white">
                {slot.subject}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {slot.topic}
              </p>
            </div>

            <div className="flex flex-wrap md:flex-col items-start md:items-end justify-between md:justify-center gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-[#143564]">
              <div className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#c19b48]" />
                <span className="font-semibold">{slot.faculty}</span>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{slot.room}</span>
              </div>
              <button
                onClick={() => toast.success(`Lecture reminder set for ${slot.subject} (${selectedDay})`)}
                className="mt-1 px-3 py-1 rounded-lg bg-slate-100 dark:bg-[#061120] hover:bg-[#c19b48] hover:text-[#061120] text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-200 dark:border-[#143564] transition-all cursor-pointer flex items-center gap-1"
              >
                <CheckCircle2 className="w-3 h-3" />
                <span>Set Alert</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  Users,
  Calendar,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';

interface BoardMember {
  name: string;
  role: string;
  bio: string;
}

const boardMembers: BoardMember[] = [
  {
    name: 'Hon’ble Justice (Retd.) S. K. Pathak',
    role: 'Former High Court Judge',
    bio: 'Presided over landmark civil and constitutional appellate benches for 18 years.',
  },
  {
    name: 'Adv. Rajinder Sir',
    role: 'Founding Director & Judicial Mentor',
    bio: 'Mentored over 500+ serving judges across Delhi, UP, Haryana, and MP judicial cadres.',
  },
  {
    name: 'Dr. Meenakshi Sundaram',
    role: 'Clinical Psychologist & Personality Assessor',
    bio: 'Specialist in judicial demeanor, stress tolerance, and candidate situational judgment.',
  },
];

export const InterviewChamberPage: React.FC = () => {
  const [selectedSlot, setSelectedSlot] = useState<string>('slot-1');

  const handleBookInterview = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Mock Interview Slot reserved with Judicial Board!', {
      description: 'Panel confirmation & board briefing packet will be sent via WhatsApp.',
      duration: 4000,
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] space-y-2">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-500/15 text-purple-600 dark:text-purple-300 text-xs font-semibold">
          <Users className="w-3.5 h-3.5" />
          <span>Judicial Personality & Viva-Voce Chamber</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 dark:text-white">
          Mock Interview Chamber
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Simulate the High Court viva-voce board with retired judges, senior counsel, and forensic psychological mentors.
        </p>
      </div>

      {/* Board Members Section */}
      <div className="space-y-4">
        <h3 className="text-base font-serif font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#c19b48]" />
          <span>Distinguished Judicial Interview Panel</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {boardMembers.map((member, i) => (
            <div
              key={i}
              className="p-5 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] space-y-2.5 shadow-xs"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/20 text-purple-600 dark:text-purple-300 flex items-center justify-center font-bold text-sm font-serif">
                {member.name.split(' ').pop()?.charAt(0) || 'J'}
              </div>
              <h4 className="text-sm font-serif font-bold text-slate-900 dark:text-white">
                {member.name}
              </h4>
              <span className="text-[11px] font-semibold text-[#c19b48] dark:text-[#e8cf8d] block">
                {member.role}
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {member.bio}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Booking Form */}
      <form onSubmit={handleBookInterview} className="p-6 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] space-y-5 shadow-xs">
        <div>
          <h3 className="text-base font-serif font-bold text-slate-900 dark:text-white mb-1">
            Reserve Your 1-on-1 Mock Interview Slot
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Each candidate undergoes a 30-minute mock viva-voce followed by 15 minutes of individual constructive debrief.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className={`p-4 rounded-xl border cursor-pointer transition-all ${
            selectedSlot === 'slot-1'
              ? 'border-[#c19b48] bg-amber-50/50 dark:bg-[#c19b48]/10'
              : 'border-slate-200 dark:border-[#143564] bg-slate-50 dark:bg-[#061120]'
          }`}>
            <input
              type="radio"
              name="slot"
              value="slot-1"
              checked={selectedSlot === 'slot-1'}
              onChange={() => setSelectedSlot('slot-1')}
              className="hidden"
            />
            <span className="text-xs font-bold text-slate-900 dark:text-white block">Saturday, 10:00 AM</span>
            <span className="text-[11px] text-[#c19b48] block mt-0.5">Physical Board Room / Zoom</span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block mt-1">2 Slots Open</span>
          </label>

          <label className={`p-4 rounded-xl border cursor-pointer transition-all ${
            selectedSlot === 'slot-2'
              ? 'border-[#c19b48] bg-amber-50/50 dark:bg-[#c19b48]/10'
              : 'border-slate-200 dark:border-[#143564] bg-slate-50 dark:bg-[#061120]'
          }`}>
            <input
              type="radio"
              name="slot"
              value="slot-2"
              checked={selectedSlot === 'slot-2'}
              onChange={() => setSelectedSlot('slot-2')}
              className="hidden"
            />
            <span className="text-xs font-bold text-slate-900 dark:text-white block">Sunday, 02:00 PM</span>
            <span className="text-[11px] text-[#c19b48] block mt-0.5">High Court Simulation</span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block mt-1">1 Slot Open</span>
          </label>

          <label className={`p-4 rounded-xl border cursor-pointer transition-all ${
            selectedSlot === 'slot-3'
              ? 'border-[#c19b48] bg-amber-50/50 dark:bg-[#c19b48]/10'
              : 'border-slate-200 dark:border-[#143564] bg-slate-50 dark:bg-[#061120]'
          }`}>
            <input
              type="radio"
              name="slot"
              value="slot-3"
              checked={selectedSlot === 'slot-3'}
              onChange={() => setSelectedSlot('slot-3')}
              className="hidden"
            />
            <span className="text-xs font-bold text-slate-900 dark:text-white block">Tuesday, 06:00 PM</span>
            <span className="text-[11px] text-[#c19b48] block mt-0.5">Online Executive Chamber</span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block mt-1">3 Slots Open</span>
          </label>
        </div>

        <button
          type="submit"
          className="px-6 py-2.5 rounded-xl bg-[#c19b48] hover:bg-[#d8b862] text-[#061120] font-semibold text-xs transition-colors cursor-pointer shadow-xs flex items-center gap-2"
        >
          <Calendar className="w-4 h-4" />
          <span>Confirm Interview Reservation</span>
        </button>
      </form>
    </div>
  );
};

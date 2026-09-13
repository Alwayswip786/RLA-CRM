import React from 'react';
import {
  Calendar,
  Clock,
  Plus,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface TimeSlot {
  time: string;
  subject: string;
  faculty: string;
  batch: string;
  room: string;
  type: 'lecture' | 'mains' | 'live';
}

const SCHEDULE: { day: string; slots: TimeSlot[] }[] = [
  {
    day: 'Monday',
    slots: [
      {
        time: '08:00 AM – 10:30 AM',
        subject: 'Civil Procedure Code (CPC Section 9 to 14)',
        faculty: 'Adv. Rajinder Sir',
        batch: 'Morning Shift (Cohort A)',
        room: 'Chamber Hall A',
        type: 'lecture',
      },
      {
        time: '11:00 AM – 01:00 PM',
        subject: 'Daily Answer Writing (DAW #48 Review)',
        faculty: 'Adv. Rajinder Sir',
        batch: 'Morning Shift (Cohort A)',
        room: 'Hall A / Virtual',
        type: 'mains',
      },
      {
        time: '05:00 PM – 07:00 PM',
        subject: 'BNSS & Criminal Procedure Code',
        faculty: 'Adv. Sharma',
        batch: 'Evening Shift (Cohort B)',
        room: 'Chamber Hall B',
        type: 'live',
      },
    ],
  },
  {
    day: 'Tuesday',
    slots: [
      {
        time: '08:00 AM – 10:30 AM',
        subject: 'Civil Procedure Code (Order 14 Framing of Issues)',
        faculty: 'Adv. Rajinder Sir',
        batch: 'Morning Shift (Cohort A)',
        room: 'Chamber Hall A',
        type: 'lecture',
      },
      {
        time: '05:00 PM – 07:00 PM',
        subject: 'Bharatiya Nyaya Sanhita (Murder vs Culpable Homicide)',
        faculty: 'Adv. Sharma',
        batch: 'Evening Shift (Cohort B)',
        room: 'Chamber Hall B',
        type: 'lecture',
      },
    ],
  },
  {
    day: 'Wednesday',
    slots: [
      {
        time: '08:00 AM – 10:30 AM',
        subject: 'Bharatiya Sakshya Adhiniyam (Confessions & Admissions)',
        faculty: 'Adv. Gupta',
        batch: 'Morning Shift (Cohort A)',
        room: 'Chamber Hall A',
        type: 'lecture',
      },
      {
        time: '05:00 PM – 07:30 PM',
        subject: 'CPC Pleadings & Plaint Drafting Workshop',
        faculty: 'Adv. Rajinder Sir',
        batch: 'Evening Shift (Cohort B)',
        room: 'Chamber Hall B',
        type: 'live',
      },
    ],
  },
];

export const TimetablePage: React.FC = () => {
  return (
    <div className="space-y-6 select-none">
      {/* Header */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C19B48]/15 border border-[#C19B48]/30 text-[#C19B48] text-xs font-semibold">
            <Calendar className="w-3.5 h-3.5" />
            <span>Academic Scheduler</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#F7F3E6]">
            Timetable & Shift Planner
          </h1>
          <p className="text-xs text-[#A8A294] max-w-2xl leading-relaxed">
            Organize faculty slots, classroom allocations, live stream sync, and morning/evening shift rotations across all active batches.
          </p>
        </div>

        <button
          onClick={() => toast('Schedule Time Slot Wizard', { icon: 'ℹ️' })}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C19B48] hover:bg-[#D8B862] text-[#1E1E1E] text-xs font-bold transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Lecture Slot</span>
        </button>
      </div>

      {/* Schedule by Day */}
      <div className="space-y-4">
        {SCHEDULE.map((daySchedule) => (
          <div
            key={daySchedule.day}
            className="p-5 sm:p-6 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] space-y-3"
          >
            <div className="flex items-center justify-between border-b border-[#3D3D3D] pb-2">
              <h3 className="font-serif text-base font-bold text-[#F7F3E6] flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#C19B48]" />
                {daySchedule.day}
              </h3>
              <span className="text-xs text-[#A8A294]">
                {daySchedule.slots.length} Scheduled Sessions
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              {daySchedule.slots.map((slot, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl bg-[#262626] border border-[#3D3D3D] hover:border-[#C19B48]/50 transition-colors space-y-2.5"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-mono text-[#E8CF8D] font-bold flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#C19B48]" />
                      {slot.time}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                        slot.type === 'live'
                          ? 'bg-red-500/20 text-red-400'
                          : slot.type === 'mains'
                          ? 'bg-[#F59E0B]/20 text-[#F59E0B]'
                          : 'bg-[#34D399]/20 text-[#34D399]'
                      }`}
                    >
                      {slot.type}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-[#F7F3E6] leading-snug">
                      {slot.subject}
                    </h4>
                    <p className="text-[11px] text-[#C19B48] mt-0.5">
                      Faculty: {slot.faculty}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[#3D3D3D] flex items-center justify-between text-[10px] text-[#A8A294]">
                    <span>{slot.batch}</span>
                    <span className="text-[#F7F3E6]">{slot.room}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

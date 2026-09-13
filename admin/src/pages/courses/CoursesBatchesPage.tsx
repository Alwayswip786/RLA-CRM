import React from 'react';
import {
  Calendar,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';

interface BatchCard {
  id: string;
  name: string;
  code: string;
  shiftTiming: string;
  classroomRoom: string;
  capacity: number;
  enrolled: number;
  attendanceRate: number;
  leadFaculty: string;
  currentSubject: string;
  status: 'active' | 'upcoming';
}

const BATCHES: BatchCard[] = [
  {
    id: 'batch-morning',
    name: 'Morning Judiciary Foundation Cohort A',
    code: 'RLA-2026-M1',
    shiftTiming: '08:00 AM – 01:00 PM (Mon to Fri)',
    classroomRoom: 'Executive Chamber Hall A (Offline & 4K Stream)',
    capacity: 200,
    enrolled: 185,
    attendanceRate: 92.4,
    leadFaculty: 'Adv. Rajinder Sir',
    currentSubject: 'Civil Procedure Code (Part XVI: Res Judicata)',
    status: 'active',
  },
  {
    id: 'batch-evening',
    name: 'Evening Judiciary Foundation Cohort B',
    code: 'RLA-2026-E1',
    shiftTiming: '05:00 PM – 09:00 PM (Mon to Fri)',
    classroomRoom: 'Chamber Hall B (Offline & Live Zoom)',
    capacity: 160,
    enrolled: 145,
    attendanceRate: 88.0,
    leadFaculty: 'Adv. Sharma',
    currentSubject: 'Bharatiya Nagarik Suraksha Sanhita (BNSS)',
    status: 'active',
  },
  {
    id: 'batch-weekend',
    name: 'Weekend Fastrack Judiciary Cohort C',
    code: 'RLA-2026-W1',
    shiftTiming: '09:00 AM – 05:00 PM (Sat & Sun)',
    classroomRoom: 'Virtual HD Studio & Lecture Theatre 1',
    capacity: 120,
    enrolled: 98,
    attendanceRate: 94.2,
    leadFaculty: 'Adv. Rajinder Sir & Special Guest Benches',
    currentSubject: 'Constitutional Law & Minor Acts Fastrack',
    status: 'active',
  },
];

export const CoursesBatchesPage: React.FC = () => {
  return (
    <div className="space-y-6 select-none">
      {/* Header */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C19B48]/15 border border-[#C19B48]/30 text-[#C19B48] text-xs font-semibold">
            <Calendar className="w-3.5 h-3.5" />
            <span>Classroom Shift Allocation</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#F7F3E6]">
            Active Batches & Shifts Manager
          </h1>
          <p className="text-xs text-[#A8A294] max-w-2xl leading-relaxed">
            Oversee physical classroom hall capacities, morning and evening batch rotations, live streaming feeds, and daily student attendance rates.
          </p>
        </div>

        <button
          onClick={() => toast.info('New Batch Creation Wizard')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C19B48] hover:bg-[#D8B862] text-[#1E1E1E] text-xs font-bold transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Launch New Batch</span>
        </button>
      </div>

      {/* Batches Cards */}
      <div className="space-y-4">
        {BATCHES.map((batch) => (
          <div
            key={batch.id}
            className="p-6 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] hover:border-[#C19B48]/50 transition-colors space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-[#C19B48] bg-[#C19B48]/15 px-2.5 py-0.5 rounded border border-[#C19B48]/30 font-bold">
                    {batch.code}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#34D399]/15 text-[#34D399] uppercase">
                    {batch.status}
                  </span>
                </div>
                <h3 className="font-serif text-lg font-bold text-[#F7F3E6]">
                  {batch.name}
                </h3>
                <p className="text-xs text-[#A8A294]">
                  Room: <strong className="text-[#F7F3E6]">{batch.classroomRoom}</strong>
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs shrink-0">
                <div className="text-right">
                  <div className="text-[10px] text-[#A8A294] uppercase font-bold">Seat Capacity</div>
                  <div className="font-serif text-lg font-bold text-[#F7F3E6]">
                    {batch.enrolled} / {batch.capacity}
                  </div>
                  <div className="text-[10px] text-[#34D399]">
                    {Math.round((batch.enrolled / batch.capacity) * 100)}% Occupied
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] text-[#A8A294] uppercase font-bold">Attendance</div>
                  <div className="font-serif text-lg font-bold text-[#34D399]">
                    {batch.attendanceRate}%
                  </div>
                  <div className="text-[10px] text-[#A8A294]">Turnstile Verified</div>
                </div>
              </div>
            </div>

            {/* Current Lesson Snapshot */}
            <div className="p-3.5 rounded-xl bg-[#262626] border border-[#3D3D3D] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase text-[#A8A294] font-bold">Ongoing Subject / Section:</span>
                <div className="font-semibold text-[#F7F3E6]">{batch.currentSubject}</div>
                <div className="text-[11px] text-[#C19B48]">Faculty: {batch.leadFaculty}</div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-[#A8A294] font-mono">{batch.shiftTiming}</span>
                <button
                  onClick={() => toast.success(`Viewing roster for ${batch.name}`)}
                  className="px-3 py-1.5 rounded-lg bg-[#C19B48]/15 hover:bg-[#C19B48]/30 border border-[#C19B48]/40 text-[#E8CF8D] text-xs font-semibold cursor-pointer shrink-0"
                >
                  Manage Batch Roster
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

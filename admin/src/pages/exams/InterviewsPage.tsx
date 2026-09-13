import React from 'react';
import {
  Award,
  Clock,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';

interface InterviewSlot {
  id: string;
  candidateName: string;
  rollNumber: string;
  targetService: string;
  scheduledSlot: string;
  boardPanellists: string;
  room: string;
  status: 'scheduled' | 'completed' | 'in_chamber';
}

const SLOTS: InterviewSlot[] = [
  {
    id: 'int-01',
    candidateName: 'Pooja Sharma',
    rollNumber: 'RLA-2026-042',
    targetService: 'Delhi Judicial Services (DJS Interview Board)',
    scheduledSlot: 'Tomorrow, 10:30 AM',
    boardPanellists: 'Adv. Rajinder Sir & Retd. Justice H.S. Verma',
    room: 'Executive Board Room 1',
    status: 'scheduled',
  },
  {
    id: 'int-02',
    candidateName: 'Ananya Sen',
    rollNumber: 'RLA-2026-015',
    targetService: 'Haryana Judicial Service (HCS Interview Board)',
    scheduledSlot: 'Tomorrow, 11:45 AM',
    boardPanellists: 'Adv. Rajinder Sir & Senior Advocate M.L. Kaushik',
    room: 'Executive Board Room 1',
    status: 'scheduled',
  },
  {
    id: 'int-03',
    candidateName: 'Rohan Verma',
    rollNumber: 'RLA-2026-089',
    targetService: 'UP PCS-J Interview Mock',
    scheduledSlot: 'Yesterday, 04:00 PM',
    boardPanellists: 'Adv. Rajinder Sir & Adv. Sharma',
    room: 'Executive Board Room 2',
    status: 'completed',
  },
];

export const InterviewsPage: React.FC = () => {
  return (
    <div className="space-y-6 select-none">
      <div className="p-6 sm:p-8 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-semibold">
            <Award className="w-3.5 h-3.5" />
            <span>Judicial Interview Chamber</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#F7F3E6]">
            Mock Interview Board & Slot Scheduler
          </h1>
          <p className="text-xs text-[#A8A294] max-w-2xl leading-relaxed">
            Schedule 1-on-1 mock interviews with Adv. Rajinder Sir and retired High Court judges, manage board panels, and generate detailed personality feedback cards.
          </p>
        </div>

        <button
          onClick={() => toast.info('New Interview Slot Scheduling Modal')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C19B48] hover:bg-[#D8B862] text-[#1E1E1E] text-xs font-bold transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Open Interview Slot</span>
        </button>
      </div>

      <div className="space-y-4">
        {SLOTS.map((slot) => (
          <div
            key={slot.id}
            className="p-6 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] hover:border-[#C19B48]/50 transition-colors space-y-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="font-serif text-lg font-bold text-[#F7F3E6]">
                    {slot.candidateName}
                  </h3>
                  <span className="font-mono text-xs text-[#A8A294] bg-[#262626] px-2 py-0.5 rounded border border-[#3D3D3D]">
                    {slot.rollNumber}
                  </span>
                </div>
                <p className="text-xs text-[#C19B48] font-medium">{slot.targetService}</p>
              </div>

              <span
                className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${
                  slot.status === 'scheduled'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : 'bg-[#34D399]/20 text-[#34D399] border border-[#34D399]/30'
                }`}
              >
                {slot.status}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-[#262626] border border-[#3D3D3D] text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#A8A294]">Interview Board Panel:</span>
                <div className="font-semibold text-[#F7F3E6] mt-0.5">{slot.boardPanellists}</div>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#A8A294]">Scheduled Slot & Room:</span>
                <div className="font-mono text-[#E8CF8D] font-bold mt-0.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#C19B48]" />
                  <span>{slot.scheduledSlot} • {slot.room}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-1 text-xs">
              <button
                onClick={() => toast.success(`Viewing evaluation card for ${slot.candidateName}`)}
                className="px-3.5 py-1.5 rounded-lg bg-[#262626] hover:bg-[#C19B48] text-[#F7F3E6] hover:text-[#1E1E1E] border border-[#3D3D3D] font-semibold transition-colors cursor-pointer"
              >
                Open Evaluation Scorecard
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

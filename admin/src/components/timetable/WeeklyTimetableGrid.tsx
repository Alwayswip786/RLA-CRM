import React, { useState } from 'react';
import {
  Clock,
  User,
  MapPin,
  Calendar,
  AlertTriangle,
  Trash2,
  Loader2,
  Plus,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { deleteSlotAdmin } from '../../services/timetable.service';
import type { AdminSlot, DayOfWeek } from '../../types/timetable.types';

interface WeeklyTimetableGridProps {
  weeklySlots: Record<string, AdminSlot[]>;
  onRefresh: () => void;
  onAddSlotForDay: (day: DayOfWeek) => void;
  onOverrideSlot: (slot: AdminSlot) => void;
}

const DAYS: DayOfWeek[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export const WeeklyTimetableGrid: React.FC<WeeklyTimetableGridProps> = ({
  weeklySlots,
  onRefresh,
  onAddSlotForDay,
  onOverrideSlot,
}) => {
  const [selectedDay, setSelectedDay] = useState<DayOfWeek | 'All'>('All');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (slot: AdminSlot) => {
    if (!window.confirm(`Are you sure you want to delete lecture "${slot.subject}"?`)) {
      return;
    }

    try {
      setDeletingId(slot._id);
      const res = await deleteSlotAdmin(slot._id);
      if (res.success) {
        toast.success(res.message);
        onRefresh();
      }
    } catch {
      toast.error('Failed to delete slot.');
    } finally {
      setDeletingId(null);
    }
  };

  const daysToRender = selectedDay === 'All' ? DAYS : [selectedDay];

  return (
    <div className="space-y-4">
      {/* Day Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setSelectedDay('All')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            selectedDay === 'All'
              ? 'bg-[#C19B48] text-[#1E1E1E] font-bold shadow-md'
              : 'bg-[#262626] text-[#A8A294] hover:text-[#F7F3E6] border border-[#3D3D3D]'
          }`}
        >
          Full Week (All Days)
        </button>

        {DAYS.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setSelectedDay(d)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 ${
              selectedDay === d
                ? 'bg-[#C19B48] text-[#1E1E1E] font-bold shadow-md'
                : 'bg-[#262626] text-[#A8A294] hover:text-[#F7F3E6] border border-[#3D3D3D]'
            }`}
          >
            {d} ({(weeklySlots[d] || []).length})
          </button>
        ))}
      </div>

      {/* Days Grid / List */}
      <div className="space-y-4">
        {daysToRender.map((day) => {
          const slots = weeklySlots[day] || [];

          return (
            <div
              key={day}
              className="p-5 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] space-y-3"
            >
              <div className="flex items-center justify-between border-b border-[#3D3D3D] pb-2">
                <h3 className="font-serif text-sm font-bold text-[#F7F3E6] flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#C19B48]" />
                  <span>{day}</span>
                  <span className="text-xs text-[#A8A294] font-normal">
                    ({slots.length} scheduled lecture{slots.length !== 1 ? 's' : ''})
                  </span>
                </h3>

                <button
                  type="button"
                  onClick={() => onAddSlotForDay(day)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#262626] hover:bg-[#3D3D3D] text-[#C19B48] text-xs font-semibold border border-[#3D3D3D] transition-colors cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Slot</span>
                </button>
              </div>

              {slots.length === 0 ? (
                <p className="text-xs text-[#A8A294] italic py-2">
                  No lectures scheduled for {day} in this shift.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                  {slots.map((slot) => (
                    <div
                      key={slot._id}
                      className="p-4 rounded-xl bg-[#262626] border border-[#3D3D3D] hover:border-[#C19B48]/50 transition-colors flex flex-col justify-between space-y-2.5"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-mono text-[#E8CF8D] font-bold flex items-center gap-1">
                            <Clock className="w-3 h-3 text-[#C19B48]" />
                            {slot.timeFormatted}
                          </span>

                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                              slot.sessionType === 'Test Series'
                                ? 'bg-red-500/20 text-red-400'
                                : slot.sessionType === 'Doubt Session'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : slot.sessionType === 'Minor Act'
                                ? 'bg-blue-500/20 text-blue-400'
                                : 'bg-amber-500/20 text-[#E8CF8D]'
                            }`}
                          >
                            {slot.sessionType}
                          </span>
                        </div>

                        <h4 className="text-xs font-bold text-[#F7F3E6] leading-snug">
                          {slot.subject}
                        </h4>
                        <p className="text-[11px] text-[#A8A294] line-clamp-2">{slot.topic}</p>
                      </div>

                      <div className="pt-2 border-t border-[#3D3D3D] flex items-center justify-between text-[10px]">
                        <div className="space-y-0.5">
                          <span className="text-[#C19B48] flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {slot.facultyName}
                          </span>
                          <span className="text-[#A8A294] flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {slot.roomName}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onOverrideSlot(slot)}
                            className="p-1.5 rounded-lg bg-[#1E1E1E] hover:bg-amber-500/20 text-[#A8A294] hover:text-amber-300 transition-colors cursor-pointer"
                            title="Reschedule or Cancel this Lecture"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(slot)}
                            disabled={deletingId === slot._id}
                            className="p-1.5 rounded-lg bg-[#1E1E1E] hover:bg-red-500/20 text-[#A8A294] hover:text-red-400 transition-colors cursor-pointer"
                            title="Delete Slot"
                          >
                            {deletingId === slot._id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

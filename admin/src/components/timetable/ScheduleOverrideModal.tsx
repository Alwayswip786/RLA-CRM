import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  Loader2,
  Send,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { createOverrideAdmin } from '../../services/timetable.service';
import type { AdminSlot } from '../../types/timetable.types';

interface ScheduleOverrideModalProps {
  isOpen: boolean;
  batchId: string;
  shiftId: string;
  slot?: AdminSlot | null;
  onClose: () => void;
  onSuccess: () => void;
}

const getTodayDateIST = (): string => {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
};

export const ScheduleOverrideModal: React.FC<ScheduleOverrideModalProps> = ({
  isOpen,
  batchId,
  shiftId,
  slot,
  onClose,
  onSuccess,
}) => {
  const [dateIST, setDateIST] = useState(getTodayDateIST());
  const [overrideType, setOverrideType] = useState<
    'rescheduled' | 'cancelled' | 'holiday' | 'special_session'
  >('rescheduled');
  const [newStartTime, setNewStartTime] = useState(slot?.startTime || '11:30');
  const [newEndTime, setNewEndTime] = useState(slot?.endTime || '13:30');
  const [newRoomName, setNewRoomName] = useState(slot?.roomName || 'Chamber 104');
  const [reason, setReason] = useState('Division Bench Special Mention at High Court');
  const [notifyStudents, setNotifyStudents] = useState(true);
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error('Please state the reason for this schedule override.');
      return;
    }

    try {
      setSaving(true);
      const res = await createOverrideAdmin({
        dateIST,
        batchId,
        shiftId,
        slotId: slot?._id,
        overrideType,
        newStartTime: overrideType === 'rescheduled' ? newStartTime : undefined,
        newEndTime: overrideType === 'rescheduled' ? newEndTime : undefined,
        newTimeFormatted:
          overrideType === 'rescheduled' ? `${newStartTime} - ${newEndTime}` : undefined,
        newRoomName: overrideType === 'rescheduled' ? newRoomName : undefined,
        reason: reason.trim(),
        notifyStudents,
      });

      if (res.success) {
        toast.success(res.message);
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to apply schedule override.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#1E1E1E] rounded-2xl border border-[#3D3D3D] shadow-2xl overflow-hidden my-8 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#262626] border-b border-[#3D3D3D]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-serif font-bold text-[#F7F3E6]">
                Schedule Exception & Override Desk
              </h2>
              <p className="text-xs text-[#A8A294]">
                Reschedule, cancel classes, or declare academy holidays
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={saving}
            className="p-1.5 rounded-lg text-[#A8A294] hover:text-[#F7F3E6] hover:bg-[#3D3D3D] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Target Slot (if selected) */}
          {slot && (
            <div className="p-3 rounded-xl bg-[#262626] border border-[#3D3D3D] space-y-1">
              <span className="text-[10px] font-bold text-[#C19B48] uppercase">
                Selected Class Slot
              </span>
              <p className="font-serif font-bold text-[#F7F3E6] text-xs">
                {slot.subject} ({slot.dayOfWeek}, {slot.timeFormatted})
              </p>
              <p className="text-[11px] text-[#A8A294]">
                Faculty: {slot.facultyName} • {slot.roomName}
              </p>
            </div>
          )}

          {/* Action Type & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#A8A294] mb-1">Override Action</label>
              <select
                value={overrideType}
                onChange={(e) => setOverrideType(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
              >
                <option value="rescheduled">Reschedule Class (New Time/Room)</option>
                <option value="cancelled">Cancel Class for Date</option>
                <option value="holiday">Declare Whole-Day Holiday / Recess</option>
                <option value="special_session">Special Ad-Hoc Session</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[#A8A294] mb-1">
                Effective Date (IST) <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={dateIST}
                onChange={(e) => setDateIST(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
              />
            </div>
          </div>

          {/* Reschedule Details */}
          {overrideType === 'rescheduled' && (
            <div className="p-3.5 rounded-xl bg-[#262626] border border-[#3D3D3D] space-y-3">
              <span className="block font-bold text-[#C19B48] text-xs">
                New Time & Chamber Allocation
              </span>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#A8A294] mb-1">New Start Time</label>
                  <input
                    type="time"
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    required
                    className="w-full px-3 py-1.5 rounded-lg bg-[#1E1E1E] border border-[#3D3D3D] text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#A8A294] mb-1">New End Time</label>
                  <input
                    type="time"
                    value={newEndTime}
                    onChange={(e) => setNewEndTime(e.target.value)}
                    required
                    className="w-full px-3 py-1.5 rounded-lg bg-[#1E1E1E] border border-[#3D3D3D] text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block font-semibold text-[#A8A294] mb-1">
                    Relocated Chamber / Room
                  </label>
                  <input
                    type="text"
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    placeholder="e.g. Chamber 104"
                    className="w-full px-3 py-1.5 rounded-lg bg-[#1E1E1E] border border-[#3D3D3D] text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="block font-semibold text-[#F7F3E6] mb-1">
              Official Reason / Notice Text <span className="text-red-400">*</span>
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Adv. Rajinder Sir arguing before the High Court Full Bench..."
              required
              className="w-full px-3 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] focus:outline-none focus:border-[#C19B48] leading-relaxed"
            />
          </div>

          {/* Broadcast Notice Toggle */}
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#262626] border border-[#3D3D3D]">
            <input
              type="checkbox"
              id="notifyStudents"
              checked={notifyStudents}
              onChange={(e) => setNotifyStudents(e.target.checked)}
              className="w-4 h-4 rounded text-[#C19B48] focus:ring-0 cursor-pointer"
            />
            <label htmlFor="notifyStudents" className="text-xs text-[#F7F3E6] cursor-pointer">
              Broadcast Official Circular Notice to Enrolled Students
            </label>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#3D3D3D]">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-[#262626] hover:bg-[#3D3D3D] text-[#A8A294] hover:text-[#F7F3E6] font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#C19B48] hover:bg-[#D8B862] text-[#1E1E1E] font-bold transition-colors shadow-md disabled:opacity-50 cursor-pointer"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>{saving ? 'Applying Override...' : 'Apply Schedule Override'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

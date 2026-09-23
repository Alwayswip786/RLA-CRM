import React, { useState } from 'react';
import {
  X,
  Plus,
  Clock,
  AlertTriangle,
  Loader2,
  Calendar,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { createSlotAdmin, checkConflictsAdmin } from '../../services/timetable.service';
import type {
  DayOfWeek,
  SessionType,
  AdminRoom,
  AdminFaculty,
  ConflictCheckItem,
} from '../../types/timetable.types';

interface CreateSlotModalProps {
  isOpen: boolean;
  batchId: string;
  shiftId: string;
  rooms: AdminRoom[];
  facultyList: AdminFaculty[];
  onClose: () => void;
  onSuccess: () => void;
}

const DAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SESSION_TYPES: SessionType[] = [
  'Major Act',
  'Minor Act',
  'Test Series',
  'Doubt Session',
  'Special Lecture',
];

export const CreateSlotModal: React.FC<CreateSlotModalProps> = ({
  isOpen,
  batchId,
  shiftId,
  rooms,
  facultyList,
  onClose,
  onSuccess,
}) => {
  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek>('Monday');
  const [startTime, setStartTime] = useState('08:30');
  const [endTime, setEndTime] = useState('10:30');
  const [sessionType, setSessionType] = useState<SessionType>('Major Act');
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [facultyId, setFacultyId] = useState('');
  const [facultyName, setFacultyName] = useState('Adv. Rajinder Sir');
  const [roomId, setRoomId] = useState('');
  const [roomName, setRoomName] = useState('Chamber 101');

  const [checkingConflict, setCheckingConflict] = useState(false);
  const [conflicts, setConflicts] = useState<ConflictCheckItem[]>([]);
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleFacultyChange = (id: string) => {
    setFacultyId(id);
    const found = facultyList.find((f) => f._id === id);
    if (found) {
      setFacultyName(found.name);
    }
  };

  const handleRoomChange = (id: string) => {
    setRoomId(id);
    const found = rooms.find((r) => r._id === id);
    if (found) {
      setRoomName(found.name);
    }
  };

  const handleCheckConflicts = async () => {
    try {
      setCheckingConflict(true);
      const res = await checkConflictsAdmin({
        batchId,
        shiftId,
        dayOfWeek,
        startTime,
        endTime,
        facultyId: facultyId || undefined,
        roomId: roomId || undefined,
      });

      if (res.hasConflict) {
        setConflicts(res.conflicts);
        toast.error('Scheduling conflict detected!');
      } else {
        setConflicts([]);
        toast.success('No scheduling conflicts detected.');
      }
    } catch {
      toast.error('Failed to run conflict check.');
    } finally {
      setCheckingConflict(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !topic.trim()) {
      toast.error('Please enter subject title and topic description.');
      return;
    }

    try {
      setSaving(true);
      const res = await createSlotAdmin({
        batchId,
        shiftId,
        dayOfWeek,
        startTime,
        endTime,
        sessionType,
        subject: subject.trim(),
        topic: topic.trim(),
        facultyId: facultyId || undefined,
        facultyName,
        roomId: roomId || undefined,
        roomName,
        overrideConflict: conflicts.length > 0,
      });

      if (res.success) {
        toast.success(res.message);
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create slot.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#1E1E1E] rounded-2xl border border-[#3D3D3D] shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#262626] border-b border-[#3D3D3D]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#C19B48]/15 text-[#C19B48] border border-[#C19B48]/30">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-serif font-bold text-[#F7F3E6]">
                Schedule New Lecture Slot
              </h2>
              <p className="text-xs text-[#A8A294]">
                Allocate faculty, classroom chamber, and curriculum topic
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
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {/* Day & Shift */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#A8A294] mb-1">Day of Week</label>
              <select
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(e.target.value as DayOfWeek)}
                className="w-full px-3 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
              >
                {DAYS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[#A8A294] mb-1">Session Category</label>
              <select
                value={sessionType}
                onChange={(e) => setSessionType(e.target.value as SessionType)}
                className="w-full px-3 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
              >
                {SESSION_TYPES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Time Window */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-[#262626] border border-[#3D3D3D]">
            <div>
              <label className="block font-semibold text-[#A8A294] mb-1">Start Time (24h)</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full px-3 py-1.5 rounded-lg bg-[#1E1E1E] border border-[#3D3D3D] text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#A8A294] mb-1">End Time (24h)</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="w-full px-3 py-1.5 rounded-lg bg-[#1E1E1E] border border-[#3D3D3D] text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
              />
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={handleCheckConflicts}
                disabled={checkingConflict}
                className="w-full py-2 rounded-lg bg-[#3D3D3D] hover:bg-[#4D4D4D] text-[#F7F3E6] font-semibold text-[11px] transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                {checkingConflict ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Clock className="w-3.5 h-3.5 text-[#C19B48]" />
                )}
                <span>Check Conflicts</span>
              </button>
            </div>
          </div>

          {/* Conflict Warnings Banner */}
          {conflicts.length > 0 && (
            <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-200 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Scheduling Collision Warnings ({conflicts.length})</span>
              </div>
              {conflicts.map((c, i) => (
                <p key={i} className="text-[11px] text-amber-200/90 leading-relaxed pl-6">
                  • {c.message}
                </p>
              ))}
            </div>
          )}

          {/* Subject & Topic */}
          <div className="space-y-3">
            <div>
              <label className="block font-semibold text-[#F7F3E6] mb-1">
                Subject Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Code of Civil Procedure (CPC)"
                required
                className="w-full px-3.5 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] font-semibold focus:outline-none focus:border-[#C19B48]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#F7F3E6] mb-1">
                Topic & Order / Section Reference <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Pleadings, Plaint & Written Statement (Order 6 & 8)"
                required
                className="w-full px-3.5 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
              />
            </div>
          </div>

          {/* Faculty & Room Allocation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#A8A294] mb-1">Faculty Assignment</label>
              {facultyList.length > 0 ? (
                <select
                  value={facultyId}
                  onChange={(e) => handleFacultyChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
                >
                  <option value="">Select Faculty...</option>
                  {facultyList.map((f) => (
                    <option key={f._id} value={f._id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={facultyName}
                  onChange={(e) => setFacultyName(e.target.value)}
                  placeholder="e.g. Adv. Rajinder Sir"
                  className="w-full px-3 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
                />
              )}
            </div>

            <div>
              <label className="block font-semibold text-[#A8A294] mb-1">
                Classroom / Chamber Allocation
              </label>
              {rooms.length > 0 ? (
                <select
                  value={roomId}
                  onChange={(e) => handleRoomChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
                >
                  <option value="">Select Chamber Room...</option>
                  {rooms.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.name} ({r.capacity} seats)
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="e.g. Chamber 101"
                  className="w-full px-3 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
                />
              )}
            </div>
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
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              <span>{saving ? 'Creating Slot...' : 'Commit Lecture Slot'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

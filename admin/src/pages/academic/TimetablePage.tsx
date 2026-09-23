import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  Clock,
  Plus,
  AlertTriangle,
  User,
  MapPin,
  Loader2,
  CalendarCheck,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  fetchWeeklyGridAdmin,
  fetchAllBatchesAdmin,
} from '../../services/timetable.service';
import type {
  AdminBatch,
  AdminRoom,
  AdminFaculty,
  AdminSlot,
} from '../../types/timetable.types';
import { WeeklyTimetableGrid } from '../../components/timetable/WeeklyTimetableGrid';
import { CreateSlotModal } from '../../components/timetable/CreateSlotModal';
import { ScheduleOverrideModal } from '../../components/timetable/ScheduleOverrideModal';

export const TimetablePage: React.FC = () => {
  const [batches, setBatches] = useState<AdminBatch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [selectedShiftId, setSelectedShiftId] = useState<string>('shift-morning');

  const [activeBatch, setActiveBatch] = useState<AdminBatch | null>(null);
  const [rooms, setRooms] = useState<AdminRoom[]>([]);
  const [facultyList, setFacultyList] = useState<AdminFaculty[]>([]);
  const [weeklySlots, setWeeklySlots] = useState<Record<string, AdminSlot[]>>({});
  const [stats, setStats] = useState({
    totalWeeklySlots: 0,
    activeChambers: 0,
    facultyCount: 0,
    overridesCount: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [selectedSlotForOverride, setSelectedSlotForOverride] = useState<AdminSlot | null>(null);

  // Load batches list on mount
  useEffect(() => {
    loadBatches();
  }, []);

  const loadBatches = async () => {
    try {
      const res = await fetchAllBatchesAdmin();
      if (res.success && res.batches.length > 0) {
        setBatches(res.batches);
        const primary = res.batches.find((b) => b.status === 'active') || res.batches[0];
        setSelectedBatchId(primary._id);
        if (primary.shifts.length > 0) {
          setSelectedShiftId(primary.defaultShiftId || primary.shifts[0].shiftId);
        }
      }
    } catch {
      toast.error('Failed to load batches.');
    }
  };

  const loadGrid = useCallback(async () => {
    if (!selectedBatchId) return;
    try {
      setLoading(true);
      const res = await fetchWeeklyGridAdmin(selectedBatchId, selectedShiftId);
      if (res.success) {
        setActiveBatch(res.batch);
        setRooms(res.rooms);
        setFacultyList(res.facultyList);
        setWeeklySlots(res.weeklySlots);
        setStats(res.stats);
      }
    } catch (err: any) {
      console.error('Failed to load weekly grid:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedBatchId, selectedShiftId]);

  useEffect(() => {
    if (selectedBatchId) {
      loadGrid();
    }
  }, [loadGrid, selectedBatchId, selectedShiftId]);

  const handleBatchChange = (batchId: string) => {
    setSelectedBatchId(batchId);
    const b = batches.find((item) => item._id === batchId);
    if (b && b.shifts.length > 0) {
      setSelectedShiftId(b.defaultShiftId || b.shifts[0].shiftId);
    }
  };

  return (
    <div className="space-y-6 select-none animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C19B48]/15 border border-[#C19B48]/30 text-[#C19B48] text-xs font-semibold">
            <Calendar className="w-3.5 h-3.5" />
            <span>Academic Scheduler & Shift Planner</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#F7F3E6]">
            Timetable & Shift Planner
          </h1>
          <p className="text-xs text-[#A8A294] max-w-2xl leading-relaxed">
            Organize faculty slots, classroom chamber allocations, and morning/evening shift rotations across active judicial batches.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              setSelectedSlotForOverride(null);
              setOverrideModalOpen(true);
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#262626] hover:bg-[#3D3D3D] text-[#E8CF8D] text-xs font-semibold border border-[#3D3D3D] transition-colors cursor-pointer"
          >
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Schedule Override / Holiday</span>
          </button>

          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#C19B48] hover:bg-[#D8B862] text-[#1E1E1E] text-xs font-bold transition-colors cursor-pointer shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Add Lecture Slot</span>
          </button>
        </div>
      </div>

      {/* 4 Live KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Weekly Slots */}
        <div className="p-5 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#A8A294]">Weekly Lectures</span>
            <div className="p-2 rounded-xl bg-[#C19B48]/15 text-[#C19B48]">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="font-mono text-2xl sm:text-3xl font-bold text-[#F7F3E6]">
            {stats.totalWeeklySlots}
          </p>
          <span className="text-[10px] text-[#A8A294] block">In Selected Shift</span>
        </div>

        {/* Active Chambers */}
        <div className="p-5 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#A8A294]">Active Chambers</span>
            <div className="p-2 rounded-xl bg-blue-500/15 text-blue-400">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
          <p className="font-mono text-2xl sm:text-3xl font-bold text-blue-400">
            {stats.activeChambers}
          </p>
          <span className="text-[10px] text-[#A8A294] block">Classroom Chambers & Labs</span>
        </div>

        {/* Faculty Deployed */}
        <div className="p-5 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#A8A294]">Faculty Deployed</span>
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400">
              <User className="w-4 h-4" />
            </div>
          </div>
          <p className="font-mono text-2xl sm:text-3xl font-bold text-emerald-400">
            {stats.facultyCount}
          </p>
          <span className="text-[10px] text-[#A8A294] block">Senior Faculty & Mentors</span>
        </div>

        {/* Scheduled Overrides */}
        <div className="p-5 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#A8A294]">Exceptions / Overrides</span>
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="font-mono text-2xl sm:text-3xl font-bold text-amber-400">
            {stats.overridesCount}
          </p>
          <span className="text-[10px] text-[#A8A294] block">Rescheduled or Cancelled</span>
        </div>
      </div>

      {/* Batch & Shift Selector Toolbar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Batch Dropdown */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full md:w-auto">
          <label className="text-xs font-semibold text-[#A8A294]">Target Batch:</label>
          <select
            value={selectedBatchId}
            onChange={(e) => handleBatchChange(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-xs text-[#F7F3E6] font-semibold focus:outline-none focus:border-[#C19B48]"
          >
            {batches.map((b) => (
              <option key={b._id} value={b._id}>
                {b.name} ({b.code})
              </option>
            ))}
          </select>
        </div>

        {/* Shift Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-[#A8A294]">Shift:</span>
          {activeBatch?.shifts?.map((s) => (
            <button
              key={s.shiftId}
              type="button"
              onClick={() => setSelectedShiftId(s.shiftId)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                selectedShiftId === s.shiftId
                  ? 'bg-[#C19B48] text-[#1E1E1E] font-bold shadow-md'
                  : 'bg-[#262626] text-[#A8A294] hover:text-[#F7F3E6] border border-[#3D3D3D]'
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      {/* Weekly Matrix Grid */}
      {loading ? (
        <div className="p-12 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] flex flex-col items-center justify-center gap-3 text-[#A8A294]">
          <Loader2 className="w-7 h-7 animate-spin text-[#C19B48]" />
          <p className="text-xs font-medium">Loading weekly timetable grid...</p>
        </div>
      ) : (
        <WeeklyTimetableGrid
          weeklySlots={weeklySlots}
          onRefresh={loadGrid}
          onAddSlotForDay={() => setCreateModalOpen(true)}
          onOverrideSlot={(slot) => {
            setSelectedSlotForOverride(slot);
            setOverrideModalOpen(true);
          }}
        />
      )}

      {/* Create Slot Modal */}
      <CreateSlotModal
        isOpen={createModalOpen}
        batchId={selectedBatchId}
        shiftId={selectedShiftId}
        rooms={rooms}
        facultyList={facultyList}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={loadGrid}
      />

      {/* Schedule Override Modal */}
      <ScheduleOverrideModal
        isOpen={overrideModalOpen}
        batchId={selectedBatchId}
        shiftId={selectedShiftId}
        slot={selectedSlotForOverride}
        onClose={() => {
          setOverrideModalOpen(false);
          setSelectedSlotForOverride(null);
        }}
        onSuccess={loadGrid}
      />
    </div>
  );
};

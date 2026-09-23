import React, { useState, useEffect, useCallback } from 'react';
import {
  Clock,
  User,
  MapPin,
  CalendarCheck,
  Download,
  Loader2,
  Calendar,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { toast } from '../../lib/toast';
import {
  fetchMySchedule,
  switchActiveShift,
  downloadIcalSchedule,
} from '../../services/timetable.service';
import type {
  TimetableHeader,
  DaySchedule,
  DayOfWeek,
  BatchShift,
} from '../../types/timetable.types';
import { ClassAlertButton } from '../../components/timetable/ClassAlertButton';
import { NextClassHeroBanner } from '../../components/timetable/NextClassHeroBanner';
import { TimetableSlotSkeleton } from '../../components/ui/skeleton';

const DAYS: DayOfWeek[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export const TimetablePage: React.FC = () => {
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('Monday');
  const [activeShiftId, setActiveShiftId] = useState<string>('shift-morning');
  const [headerInfo, setHeaderInfo] = useState<TimetableHeader | null>(null);
  const [daySchedule, setDaySchedule] = useState<DaySchedule | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [switchingShift, setSwitchingShift] = useState<boolean>(false);
  const [downloadingIcal, setDownloadingIcal] = useState<boolean>(false);

  const loadSchedule = useCallback(
    async (day: DayOfWeek, shiftId?: string) => {
      try {
        setLoading(true);
        const res = await fetchMySchedule({
          dayOfWeek: day,
          shiftId: shiftId || activeShiftId,
        });

        if (res.success) {
          setHeaderInfo(res.header);
          setDaySchedule(res.schedule);
          if (res.header.activeShiftId) {
            setActiveShiftId(res.header.activeShiftId);
          }
        }
      } catch (err: any) {
        console.error('Failed to load timetable:', err);
        toast.error('Failed to load batch timetable.');
      } finally {
        setLoading(false);
      }
    },
    [activeShiftId]
  );

  useEffect(() => {
    loadSchedule(selectedDay);
  }, [loadSchedule, selectedDay]);

  const handleShiftChange = async (shift: BatchShift) => {
    if (shift.shiftId === activeShiftId) return;

    try {
      setSwitchingShift(true);
      const res = await switchActiveShift(shift.shiftId);
      if (res.success) {
        setActiveShiftId(shift.shiftId);
        toast.info(`Viewing ${shift.name}`);
        await loadSchedule(selectedDay, shift.shiftId);
      }
    } catch (err: any) {
      toast.error('Failed to switch shift.');
    } finally {
      setSwitchingShift(false);
    }
  };

  const handleDownloadCalendar = async () => {
    try {
      setDownloadingIcal(true);
      await downloadIcalSchedule(activeShiftId);
      toast.success('Academic timetable calendar (.ics) downloaded.');
    } catch {
      toast.error('Failed to download calendar.');
    } finally {
      setDownloadingIcal(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200 select-none">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-[#c19b48]/15 text-[#c19b48] dark:text-[#e8cf8d] text-xs font-semibold mb-2">
            <CalendarCheck className="w-3.5 h-3.5" />
            <span>{headerInfo?.sessionName || 'Academic Schedule 2025–26'}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 dark:text-white">
            Batch Timetable & Shift Schedule
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {headerInfo?.subtitle ||
              'Foundation Judicial Services Batch (Morning 8:30 AM & Evening 5:00 PM Shifts)'}
          </p>
        </div>

        {/* Right Action Controls: Shift Toggle & iCal Download */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Shift Toggles */}
          {headerInfo?.shifts?.map((shift) => (
            <button
              key={shift.shiftId}
              onClick={() => handleShiftChange(shift)}
              disabled={switchingShift}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                activeShiftId === shift.shiftId
                  ? 'bg-[#0a1c36] dark:bg-[#143564] text-white border-[#c19b48]/60 shadow-xs font-bold'
                  : 'bg-white dark:bg-[#061120] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-[#143564] hover:border-[#c19b48]/40'
              }`}
            >
              {shift.name}
            </button>
          ))}

          {/* Add to Calendar Button */}
          <button
            onClick={handleDownloadCalendar}
            disabled={downloadingIcal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#061120] hover:bg-[#c19b48] hover:text-[#061120] text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-[#143564] transition-all cursor-pointer"
            title="Download iCalendar file to sync with Apple/Google Calendar"
          >
            {downloadingIcal ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5 text-[#c19b48]" />
            )}
            <span>Add to Calendar</span>
          </button>
        </div>
      </div>

      {/* Next Class Hero Banner (Smart Ticker) */}
      <NextClassHeroBanner />

      {/* Days Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {DAYS.map((d) => (
          <button
            key={d}
            onClick={() => setSelectedDay(d)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              selectedDay === d
                ? 'bg-[#c19b48] text-[#061120] shadow-md font-bold'
                : 'bg-white dark:bg-[#0a1c36] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#143564] hover:bg-slate-100 dark:hover:bg-white/5'
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      {/* Slots List or Loading / Holiday State */}
      {loading ? (
        <TimetableSlotSkeleton count={3} />
      ) : daySchedule?.isHoliday ? (
        <div className="p-8 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 text-center space-y-2">
          <div className="w-10 h-10 rounded-full bg-amber-500/15 text-[#c19b48] flex items-center justify-center mx-auto">
            <Calendar className="w-5 h-5" />
          </div>
          <h3 className="font-serif text-base font-bold text-amber-900 dark:text-amber-200">
            Academy Holiday / Recess
          </h3>
          <p className="text-xs text-amber-700 dark:text-amber-300/80 max-w-md mx-auto">
            {daySchedule.holidayReason ||
              'No classes scheduled for today in observance of Academy Holiday / Court Recess.'}
          </p>
        </div>
      ) : (daySchedule?.slots?.length ?? 0) === 0 ? (
        <div className="p-10 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] text-center space-y-2">
          <CalendarCheck className="w-8 h-8 text-[#c19b48] mx-auto opacity-70" />
          <h3 className="font-serif text-sm font-bold text-slate-800 dark:text-slate-200">
            No Lectures Scheduled for {selectedDay}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            There are no active classes in this shift. Check other shifts or days.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {daySchedule?.slots.map((slot) => {
            const isCancelled = slot.isCancelled;
            const isRescheduled = slot.isRescheduled;

            return (
              <div
                key={slot.slotId}
                className={`p-5 rounded-2xl bg-white dark:bg-[#0a1c36] border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs ${
                  isCancelled
                    ? 'border-red-300 dark:border-red-900/50 bg-red-50/20 opacity-80'
                    : isRescheduled
                    ? 'border-amber-400/60 dark:border-amber-500/40 shadow-sm'
                    : 'border-slate-200 dark:border-[#143564] hover:border-[#c19b48]/60'
                }`}
              >
                <div className="space-y-2 flex-1">
                  {/* Overrides Alerts */}
                  {isCancelled && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-[11px] font-semibold border border-red-200 dark:border-red-800/40 mb-1">
                      <AlertTriangle className="w-3 h-3 text-red-500" />
                      <span>Cancelled: {slot.cancellationReason || 'Lecture cancelled by faculty.'}</span>
                    </div>
                  )}

                  {isRescheduled && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 text-[11px] font-semibold border border-amber-300 dark:border-amber-700/40 mb-1">
                      <Sparkles className="w-3 h-3 text-[#c19b48]" />
                      <span>
                        Rescheduled: Originally {slot.originalTime}. {slot.rescheduleReason || ''}
                      </span>
                    </div>
                  )}

                  {/* Time and Category Badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-mono font-semibold border ${
                        isCancelled
                          ? 'line-through text-slate-400 bg-slate-100 dark:bg-[#061120] border-slate-200 dark:border-slate-800'
                          : 'bg-slate-100 dark:bg-[#061120] text-slate-800 dark:text-slate-200 border-slate-200 dark:border-[#143564]'
                      }`}
                    >
                      <Clock className="w-3 h-3 text-[#c19b48]" />
                      {slot.time}
                    </span>

                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        slot.type === 'Major Act'
                          ? 'bg-amber-500/15 text-[#c19b48] dark:text-[#e8cf8d] border border-amber-500/30'
                          : slot.type === 'Test Series'
                          ? 'bg-red-500/15 text-red-500 border border-red-500/30'
                          : slot.type === 'Doubt Session'
                          ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                          : slot.type === 'Special Lecture'
                          ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                          : 'bg-blue-500/15 text-blue-500 border border-blue-500/30'
                      }`}
                    >
                      {slot.type}
                    </span>
                  </div>

                  {/* Subject Headline */}
                  <h3
                    className={`text-base font-serif font-bold ${
                      isCancelled
                        ? 'line-through text-slate-400 dark:text-slate-500'
                        : 'text-slate-900 dark:text-white'
                    }`}
                  >
                    {slot.subject}
                  </h3>

                  {/* Topic Description */}
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {slot.topic}
                  </p>
                </div>

                {/* Right Column Details & Set Alert Action */}
                <div className="flex flex-wrap md:flex-col items-start md:items-end justify-between md:justify-center gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-[#143564] shrink-0">
                  <div className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#c19b48]" />
                    <span className="font-semibold">{slot.faculty}</span>
                  </div>

                  <div className="text-[11px] text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{slot.room}</span>
                  </div>

                  {!isCancelled && (
                    <ClassAlertButton
                      slotId={slot.slotId}
                      subject={slot.subject}
                      dayOfWeek={selectedDay}
                      isAlertSet={slot.isAlertSet}
                      batchId={headerInfo?.batchId}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { Clock, MapPin, User, Sparkles, Radio } from 'lucide-react';
import { fetchUpcomingClass } from '../../services/timetable.service';
import type { ResolvedSlot } from '../../types/timetable.types';
import { HeroBannerSkeleton } from '../ui/skeleton';

export const NextClassHeroBanner: React.FC = () => {
  const [upcoming, setUpcoming] = useState<ResolvedSlot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUpcoming();
    const interval = setInterval(loadUpcoming, 60_000);
    return () => clearInterval(interval);
  }, []);

  const loadUpcoming = async () => {
    try {
      const res = await fetchUpcomingClass();
      if (res.success) {
        setUpcoming(res.upcomingClass);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <HeroBannerSkeleton />;
  if (!upcoming) return null;

  const isOngoing = upcoming.status === 'ongoing';

  return (
    <div
      className={`p-4 sm:p-5 rounded-2xl border transition-all ${
        isOngoing
          ? 'bg-gradient-to-r from-emerald-950/40 via-[#0a1c36] to-[#0a1c36] border-emerald-500/40 shadow-md'
          : 'bg-gradient-to-r from-[#0a1c36] via-[#102b52] to-[#0a1c36] border-[#c19b48]/30 shadow-md'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {isOngoing ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold uppercase tracking-wider animate-pulse">
                <Radio className="w-3 h-3 text-emerald-400" />
                <span>Class in Progress (Now)</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-[#e8cf8d] text-[10px] font-bold uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-[#c19b48]" />
                <span>Next Scheduled Session</span>
              </span>
            )}

            <span className="font-mono text-xs text-white/90 flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#c19b48]" />
              {upcoming.time}
            </span>
          </div>

          <h3 className="font-serif text-base sm:text-lg font-bold text-white leading-snug">
            {upcoming.subject}
          </h3>
          <p className="text-xs text-slate-300 line-clamp-1">{upcoming.topic}</p>
        </div>

        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/10 shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-200">
            <User className="w-3.5 h-3.5 text-[#c19b48]" />
            <span className="font-semibold">{upcoming.faculty}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-amber-300/90 font-medium">
            <MapPin className="w-3.5 h-3.5" />
            <span>{upcoming.room}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

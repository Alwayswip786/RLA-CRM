import React, { useEffect, useState } from 'react';
import { X, Clock, Users, Building, ShieldCheck, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { adminDashboardApi, type BatchShiftInfo } from '../../lib/adminDashboardApi';

interface ShiftPlanModalProps {
  onClose: () => void;
}

export const ShiftPlanModal: React.FC<ShiftPlanModalProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const [data, setData] = useState<BatchShiftInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminDashboardApi
      .getBatchShifts()
      .then((res) => setData(res))
      .catch((err) => console.error('Failed to load batch shifts:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] shadow-2xl overflow-hidden text-[#F7F3E6] flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#3D3D3D] flex items-center justify-between bg-[#262626]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#C19B48]/15 border border-[#C19B48]/30 flex items-center justify-center text-[#C19B48]">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-[#F7F3E6]">
                Academic Shift Structure & Chamber Allocation
              </h3>
              <p className="text-xs text-[#A8A294]">
                Batch cohorts, classroom shifts, seat capacity, and chamber room planning
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#3D3D3D] text-[#A8A294] hover:text-[#F7F3E6] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {loading ? (
            <div className="py-12 text-center text-xs text-[#A8A294] animate-pulse">
              Loading active shift schedules and chamber configurations...
            </div>
          ) : (
            <>
              {/* Batch Overview Cards */}
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-[#A8A294]">
                  <span className="font-semibold uppercase tracking-wider text-[#C19B48]">
                    Active Batch Shifts (Today: {data?.batches?.length || 2} Active Cohorts)
                  </span>
                  <span>Target: {data?.batches?.[0]?.targetExam || 'Delhi Judicial Service (DJS) & PCS-J'}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Morning Shift Card */}
                  <div className="p-4 rounded-xl bg-[#262626] border border-[#3D3D3D] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#C19B48]/15 text-[#C19B48] border border-[#C19B48]/30">
                        MORNING SHIFT
                      </span>
                      <span className="text-xs text-[#A8A294] flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        Cap: {data?.batches?.[0]?.shifts?.[0]?.capacity || 120}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-sm text-[#F7F3E6]">8:30 AM – 1:30 PM</h4>
                      <p className="text-xs text-[#A8A294]">
                        Major Substantive Law: Civil Procedure Code & Constitution
                      </p>
                    </div>

                    <div className="pt-2 border-t border-[#3D3D3D] flex items-center justify-between text-[11px] text-[#A8A294]">
                      <span>Chamber Hall A</span>
                      <span className="text-[#34D399] font-medium">Shift Active</span>
                    </div>
                  </div>

                  {/* Evening Shift Card */}
                  <div className="p-4 rounded-xl bg-[#262626] border border-[#3D3D3D] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#60A5FA]/15 text-[#60A5FA] border border-[#60A5FA]/30">
                        EVENING SHIFT
                      </span>
                      <span className="text-xs text-[#A8A294] flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        Cap: {data?.batches?.[0]?.shifts?.[1]?.capacity || 100}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-sm text-[#F7F3E6]">5:00 PM – 8:30 PM</h4>
                      <p className="text-xs text-[#A8A294]">
                        Procedural & Criminal Sanhitas: BNSS & Evidence Laws
                      </p>
                    </div>

                    <div className="pt-2 border-t border-[#3D3D3D] flex items-center justify-between text-[11px] text-[#A8A294]">
                      <span>Chamber Hall A / Virtual Room 2</span>
                      <span className="text-[#F59E0B] font-medium">Starts 5:00 PM</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chamber Rooms */}
              <div className="p-4 rounded-xl bg-[#262626] border border-[#3D3D3D] space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#F7F3E6]">
                  <Building className="w-4 h-4 text-[#C19B48]" />
                  <span>Physical Judicial Chamber Wing Allocation</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                  {(data?.rooms && data.rooms.length > 0
                    ? data.rooms
                    : [
                        { name: 'Chamber Hall A', capacity: 60, facilities: ['Smart Display'] },
                        { name: 'Virtual Room 2', capacity: 100, facilities: ['Zoom SDK'] },
                        { name: 'Library Pod B', capacity: 30, facilities: ['Mains Writing'] },
                      ]
                  ).map((r, i) => (
                    <div key={i} className="p-2.5 rounded-lg bg-[#1E1E1E] border border-[#3D3D3D]">
                      <div className="font-bold text-[#F7F3E6]">{r.name}</div>
                      <div className="text-[10px] text-[#A8A294]">
                        {r.capacity ? `${r.capacity} Seats` : ''}
                        {r.facilities?.length ? ` • ${r.facilities.slice(0, 1).join(', ')}` : ''}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shift Switching Policy Banner */}
              <div className="p-3.5 rounded-xl bg-[#C19B48]/10 border border-[#C19B48]/30 flex items-start gap-2.5 text-xs text-[#E8CF8D]">
                <ShieldCheck className="w-4 h-4 shrink-0 text-[#C19B48] mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-semibold text-[#F7F3E6]">Flexible Shift Switching Policy Active:</span>
                  <p className="text-[11px] text-[#A8A294] leading-relaxed">
                    Working advocates and enrolled judicial candidates can attend identical substantive law modules in either shift without academic attendance penalty.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[#3D3D3D] bg-[#262626] flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#2F2F2F] hover:bg-[#3D3D3D] text-[#A8A294] hover:text-[#F7F3E6] text-xs font-medium transition-colors cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={() => {
              onClose();
              navigate('/timetable');
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#C19B48] hover:bg-[#D8B862] text-[#1E1E1E] text-xs font-bold transition-colors cursor-pointer shadow"
          >
            <span>Manage Weekly Timetable</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

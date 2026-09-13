import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Phone,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface DemoBooking {
  id: string;
  candidateName: string;
  phone: string;
  courseDemo: string;
  scheduledTime: string;
  shift: string;
  faculty: string;
  status: 'confirmed' | 'attended' | 'converted' | 'no_show';
  streamUrl: string;
}

const INITIAL_DEMOS: DemoBooking[] = [
  {
    id: 'demo-101',
    candidateName: 'Priyanka Chawla',
    phone: '+91 98990 77123',
    courseDemo: 'CPC Section 9 to 14: Inherent Powers & Jurisdiction',
    scheduledTime: 'Today at 05:00 PM',
    shift: 'Evening Shift Hall A',
    faculty: 'Adv. Rajinder Sir',
    status: 'confirmed',
    streamUrl: 'https://live.rajinderlawacademy.com/stream/demo-cpc-5pm',
  },
  {
    id: 'demo-102',
    candidateName: 'Ankit Deshmukh',
    phone: '+91 97180 55432',
    courseDemo: 'BNSS Sec 35 vs Arnesh Kumar Guidelines',
    scheduledTime: 'Today at 07:00 PM',
    shift: 'Evening Cohort B',
    faculty: 'Adv. Sharma',
    status: 'confirmed',
    streamUrl: 'https://live.rajinderlawacademy.com/stream/demo-bnss-7pm',
  },
  {
    id: 'demo-103',
    candidateName: 'Tarun Saxena',
    phone: '+91 98112 00981',
    courseDemo: 'Judicial Foundation: Comprehensive Orientation',
    scheduledTime: 'Yesterday at 11:00 AM',
    shift: 'Morning Shift Hall A',
    faculty: 'Adv. Rajinder Sir',
    status: 'attended',
    streamUrl: '#',
  },
  {
    id: 'demo-104',
    candidateName: 'Kritika Roy',
    phone: '+91 94120 77890',
    courseDemo: 'Mains Answer Writing (DAW) Live Workshop',
    scheduledTime: 'Yesterday at 04:00 PM',
    shift: 'Special Session',
    faculty: 'Adv. Rajinder Sir',
    status: 'converted',
    streamUrl: '#',
  },
];

export const LeadsDemosPage: React.FC = () => {
  const [demos, setDemos] = useState<DemoBooking[]>(INITIAL_DEMOS);

  const handleStatusChange = (id: string, newStatus: DemoBooking['status']) => {
    setDemos((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: newStatus } : d))
    );
    toast.success(`Demo status updated to ${newStatus.toUpperCase()}`);
  };

  return (
    <div className="space-y-6 select-none">
      {/* Header */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F59E0B]/15 border border-[#F59E0B]/30 text-[#F59E0B] text-xs font-semibold">
            <Calendar className="w-3.5 h-3.5" />
            <span>Trial Class Operations</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#F7F3E6]">
            Trial & Demo Class Registrations
          </h1>
          <p className="text-xs text-[#A8A294] max-w-2xl leading-relaxed">
            Monitor aspirants attending live judicial demo sessions. Send automated classroom links, track lecture attendance, and initiate admissions follow-ups.
          </p>
        </div>

        <div className="text-right shrink-0">
          <div className="text-xs text-[#A8A294]">Today's Trial Seats:</div>
          <div className="font-serif text-2xl font-bold text-[#C19B48]">4 Confirmed</div>
        </div>
      </div>

      {/* Demos Table */}
      <div className="rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#3D3D3D] bg-[#262626] text-[#A8A294] uppercase tracking-wider text-[10px] font-bold">
                <th className="py-3.5 px-4">Candidate & Phone</th>
                <th className="py-3.5 px-4">Trial Lecture Title</th>
                <th className="py-3.5 px-4">Scheduled Slot & Shift</th>
                <th className="py-3.5 px-4">Faculty In Charge</th>
                <th className="py-3.5 px-4">Trial Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#3D3D3D]/60 text-[#F7F3E6]">
              {demos.map((demo) => (
                <tr key={demo.id} className="hover:bg-[#2F2F2F]/50 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-sm text-[#F7F3E6]">{demo.candidateName}</div>
                    <div className="text-[11px] text-[#A8A294] flex items-center gap-1">
                      <Phone className="w-3 h-3 text-[#C19B48]" />
                      <span>{demo.phone}</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 max-w-[260px]">
                    <div className="font-medium text-[#F7F3E6] truncate">{demo.courseDemo}</div>
                    <div className="text-[11px] text-[#C19B48]">WebRTC Classroom Hall</div>
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="font-bold text-[#F7F3E6] flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#C19B48]" />
                      <span>{demo.scheduledTime}</span>
                    </div>
                    <div className="text-[11px] text-[#A8A294]">{demo.shift}</div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="font-medium text-[#F7F3E6]">{demo.faculty}</span>
                  </td>

                  <td className="py-3.5 px-4">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${
                        demo.status === 'confirmed'
                          ? 'bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/30'
                          : demo.status === 'attended'
                          ? 'bg-[#60A5FA]/20 text-[#60A5FA] border border-[#60A5FA]/30'
                          : demo.status === 'converted'
                          ? 'bg-[#34D399]/20 text-[#34D399] border border-[#34D399]/30'
                          : 'bg-[#EF4444]/20 text-[#EF4444]'
                      }`}
                    >
                      {demo.status}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {demo.status === 'confirmed' && (
                        <button
                          onClick={() => handleStatusChange(demo.id, 'attended')}
                          className="px-2.5 py-1 rounded-lg bg-[#262626] hover:bg-[#34D399] text-[#F7F3E6] hover:text-[#1E1E1E] border border-[#3D3D3D] font-semibold text-xs transition-colors cursor-pointer"
                        >
                          Mark Attended
                        </button>
                      )}
                      {demo.status === 'attended' && (
                        <button
                          onClick={() => handleStatusChange(demo.id, 'converted')}
                          className="px-2.5 py-1 rounded-lg bg-[#C19B48] hover:bg-[#D8B862] text-[#1E1E1E] font-bold text-xs transition-colors cursor-pointer"
                        >
                          Admit Student
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

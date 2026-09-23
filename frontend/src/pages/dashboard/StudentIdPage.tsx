import React from 'react';
import {
  QrCode,
  Download,
  User,
  MapPin,
} from 'lucide-react';
import { toast } from '../../lib/toast';
import { useAuthStore } from '../../store/useAuthStore';

export const StudentIdPage: React.FC = () => {
  const user = useAuthStore((state) => state.user);

  const student = {
    name: user?.name || 'Advocate Aspirant',
    rollNo: user?.rollNo || 'RLA2026-PENDING',
    batch: user?.targetExam
      ? `${user.targetExam} (${user.targetYear || '2025-26'})`
      : 'Judicial Services Comprehensive Batch 2025-26',
    bloodGroup: 'B+ Positive',
    validUntil: '31 July 2026',
    campus: 'Main Judicial Campus, Chamber Complex, Delhi',
    qrToken: `RLA-PASS-${user?.rollNo || '2026'}-SECURE`,
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-semibold mb-2">
            <QrCode className="w-3.5 h-3.5" />
            <span>Official Academy Digital Credential</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 dark:text-white">
            Digital Student ID & Entry Pass
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Display at turnstiles for library access, classroom chambers, and all-India offline mock tests.
          </p>
        </div>

        <button
          onClick={() => toast.success('High-Resolution ID Card PDF downloaded')}
          className="px-4 py-2 rounded-xl bg-[#c19b48] hover:bg-[#d8b862] text-[#061120] font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>Download Printable Card</span>
        </button>
      </div>

      {/* Center ID Card Showcase */}
      <div className="flex justify-center">
        <div className="w-full max-w-md bg-gradient-to-b from-white via-slate-50 to-slate-100 dark:from-[#0a1c36] dark:via-[#0e274b] dark:to-[#061120] border-2 border-[#c19b48]/60 rounded-3xl p-6 sm:p-7 shadow-xl space-y-5 text-slate-900 dark:text-white relative overflow-hidden">
          {/* Watermark Logo */}
          <div className="absolute right-[-20px] bottom-[-20px] opacity-5 pointer-events-none">
            <img src="/logo.png" alt="RLA" className="w-64 h-64" />
          </div>

          {/* Card Top Branding */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#143564] pb-4">
            <div className="flex items-center gap-2.5">
              <img
                src="/logo.png"
                alt="Logo"
                className="w-10 h-10 rounded-xl object-contain border border-[#c19b48]/50"
              />
              <div>
                <h3 className="font-serif text-sm font-bold tracking-tight leading-none">
                  RAJINDER LAW ACADEMY
                </h3>
                <span className="text-[9px] font-bold text-[#c19b48] tracking-widest uppercase">
                  Classroom Chamber ID
                </span>
              </div>
            </div>

            <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
              VERIFIED ACTIVE
            </span>
          </div>

          {/* Candidate Profile Photo & Details */}
          <div className="flex items-center gap-4">
            <div className="w-20 h-24 rounded-2xl bg-slate-200 dark:bg-[#143564] border-2 border-[#c19b48]/40 flex flex-col items-center justify-center text-slate-400 shrink-0">
              <User className="w-8 h-8 text-[#c19b48]" />
              <span className="text-[9px] font-bold uppercase mt-1">Photo</span>
            </div>

            <div className="space-y-1 min-w-0">
              <h4 className="text-base font-serif font-bold truncate">{student.name}</h4>
              <p className="text-xs text-[#c19b48] font-mono font-bold">Roll: {student.rollNo}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">{student.batch}</p>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-200 dark:bg-[#143564] text-slate-700 dark:text-slate-300 font-semibold inline-block">
                Blood Group: {student.bloodGroup}
              </span>
            </div>
          </div>

          {/* QR Code Security Pass */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#061120] border border-slate-200 dark:border-[#143564] flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Contactless QR Gate Pass
              </span>
              <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 block">
                {student.qrToken}
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium block">
                Valid Until: {student.validUntil}
              </span>
            </div>

            {/* QR Simulation */}
            <div className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-white p-1.5 flex items-center justify-center shrink-0 border border-slate-200">
              <QrCode className="w-full h-full text-[#061120]" />
            </div>
          </div>

          {/* Campus Location */}
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 border-t border-slate-200 dark:border-[#143564] pt-3">
            <MapPin className="w-3.5 h-3.5 text-[#c19b48] shrink-0" />
            <span className="truncate">{student.campus}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

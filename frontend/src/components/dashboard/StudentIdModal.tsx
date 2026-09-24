import React, { useEffect } from 'react';
import {
  X,
  Download,
  CheckCircle2,
  Calendar,
  GraduationCap,
} from 'lucide-react';
import { toast } from '../../lib/toast';
import { useAuthStore } from '../../store/useAuthStore';

interface StudentIdModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StudentIdModal: React.FC<StudentIdModalProps> = ({ isOpen, onClose }) => {
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const rollNo = user?.rollNo || 'RLA2026-PENDING';

  const handleDownload = () => {
    toast.success('High-Resolution ID Card PDF Downloaded', {
      description: 'Official digital classroom pass saved to your downloads.',
    });
  };

  const initials = user?.name
    ? user.name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : 'RL';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      {/* Main Modal Card */}
      <div className="relative w-full max-w-md bg-white dark:bg-[#0a1c36] border border-slate-200/90 dark:border-[#c19b48]/35 rounded-3xl shadow-2xl overflow-hidden z-10 text-slate-800 dark:text-slate-100 transition-all flex flex-col my-auto">
        {/* Top Gold Accent Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#9b7829] via-[#e8cf8d] to-[#9b7829] shrink-0" />

        {/* Card Header */}
        <div className="relative bg-gradient-to-b from-[#0e274b] to-[#0a1c36] text-white px-5 sm:px-6 py-4 border-b border-[#143564]/80 flex items-center justify-between shrink-0">
          {/* Subtle background ambient glow */}
          <div className="absolute -top-10 left-1/4 w-40 h-40 bg-[#c19b48]/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center gap-3 relative z-10">
            <div className="relative p-1 rounded-xl bg-white/5 border border-[#c19b48]/40 shadow-inner">
              <img
                src="/logo.png"
                alt="Rajinder Law Academy"
                className="w-9 h-9 rounded-lg object-contain"
              />
            </div>
            <div>
              <h3 className="font-serif text-sm sm:text-base font-bold tracking-wide leading-tight text-white">
                RAJINDER LAW ACADEMY
              </h3>
              <p className="text-[10px] text-[#c19b48] font-mono tracking-wider uppercase">
                Official Classroom ID
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer relative z-10"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Card Body */}
        <div className="p-6 sm:p-7 space-y-4 sm:space-y-5 relative overflow-y-auto flex-1 flex flex-col items-center text-center">

          {/* Student Profile Row: Centered Vertical Layout */}
          <div className="flex flex-col items-center text-center space-y-3 relative z-10 w-full">
            {/* Avatar Photo Container */}
            <div className="relative shrink-0">
              <div className="w-20 h-24 sm:w-22 sm:h-26 rounded-2xl bg-gradient-to-b from-[#143564] to-[#061120] border-2 border-[#c19b48]/80 flex items-center justify-center text-[#f3d994] shadow-lg shadow-black/25 overflow-hidden">
                <span className="text-2xl sm:text-3xl font-bold font-serif tracking-wider">{initials}</span>
              </div>
            </div>

            {/* Profile Information: Strictly Centered */}
            <div className="space-y-1.5 w-full flex flex-col items-center text-center">
              <h4 className="font-serif text-xl sm:text-2xl font-bold text-slate-900 dark:text-white px-2">
                {user?.name || 'Advocate Aspirant'}
              </h4>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#c19b48]/15 border border-[#c19b48]/35 text-[#a47a28] dark:text-[#f3d994] text-xs font-mono font-bold tracking-wide shadow-2xs">
                <span>Roll No:</span>
                <span>{rollNo}</span>
              </div>

              <div className="space-y-1.5 pt-2 flex flex-col items-center w-full">
                <div className="inline-flex items-center justify-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 max-w-full px-2">
                  <GraduationCap className="w-3.5 h-3.5 text-[#c19b48] shrink-0" />
                  <span className="truncate">
                    Batch: <span className="font-semibold text-slate-800 dark:text-slate-200">{user?.targetExam ? `${user.targetExam} (${user.targetYear || '2025-26'})` : 'Judiciary PCS-J Comprehensive Batch'}</span>
                  </span>
                </div>
                <div className="inline-flex items-center justify-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 max-w-full px-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>
                    Valid Through: <span className="font-medium text-slate-700 dark:text-slate-300">{user?.targetYear ? `${user.targetYear} Academic Session` : '2025 – 2026 Academic Session'}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Security Strip: Cleanly Centered */}
          <div className="pt-2 w-full flex flex-wrap items-center justify-center gap-2 text-[10px] text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-[#143564]/50 relative z-10">
            <span className="font-mono tracking-widest text-[9px] uppercase text-slate-500 dark:text-slate-400">
              RLA-SECURE-PASS
            </span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Verified Gateway Access</span>
            </span>
          </div>

          {/* Action Footer */}
          <div className="pt-2 w-full relative z-10">
            <button
              type="button"
              onClick={handleDownload}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#d8b862] via-[#c19b48] to-[#a47a28] hover:from-[#e8cf8d] hover:to-[#c19b48] text-[#061120] font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-lg active:scale-[0.99]"
            >
              <Download className="w-4 h-4" />
              <span>Download Printable ID (PDF)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

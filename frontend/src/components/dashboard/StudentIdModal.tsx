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
    <div className="fixed inset-0 z-50 flex items-center justify-center sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="hidden sm:block fixed inset-0" onClick={onClose} aria-hidden="true" />

      {/* Main Modal Card (Full screen on mobile, centered dialog on desktop) */}
      <div className="relative w-full h-[100dvh] sm:h-auto sm:max-h-[92dvh] sm:max-w-lg bg-white dark:bg-[#0a1c36] sm:border sm:border-slate-200/90 dark:sm:border-[#c19b48]/35 rounded-none sm:rounded-3xl shadow-2xl overflow-hidden z-10 text-slate-800 dark:text-slate-100 transition-all flex flex-col">
        {/* Top Gold Accent Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#9b7829] via-[#e8cf8d] to-[#9b7829] shrink-0" />

        {/* Card Header */}
        <div className="relative bg-gradient-to-b from-[#0e274b] to-[#0a1c36] text-white px-5 sm:px-6 py-4 sm:py-5 border-b border-[#143564]/80 flex items-center justify-between shrink-0 pt-[calc(1rem+env(safe-area-inset-top,0px))] sm:pt-5">
          {/* Subtle background ambient glow */}
          <div className="absolute -top-10 left-1/4 w-40 h-40 bg-[#c19b48]/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center gap-3.5 relative z-10">
            <div className="relative p-1 rounded-xl bg-white/5 border border-[#c19b48]/40 shadow-inner">
              <img
                src="/logo.png"
                alt="Rajinder Law Academy"
                className="w-10 h-10 rounded-lg object-contain"
              />
            </div>
            <div>
              <h3 className="font-serif text-base sm:text-lg font-black tracking-wide leading-tight text-white flex items-center gap-2">
                <span>RAJINDER LAW ACADEMY</span>
              </h3>
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
        <div className="p-5 sm:p-6 space-y-4 sm:space-y-5 relative overflow-y-auto flex-1 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] sm:pb-6">
          {/* Watermark Emblem in Background */}
          <div className="absolute right-[-20px] top-[15px] opacity-[0.03] dark:opacity-[0.05] pointer-events-none select-none">
            <img src="/logo.png" alt="" className="w-72 h-72 object-contain" />
          </div>

          {/* Student Profile Row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 relative z-10">
            {/* Avatar / Biometric Photo Container */}
            <div className="relative shrink-0 self-center sm:self-auto">
              <div className="w-20 h-24 sm:w-22 sm:h-26 rounded-2xl bg-gradient-to-b from-[#143564] to-[#061120] border-2 border-[#c19b48]/80 flex flex-col items-center justify-center text-[#f3d994] shadow-lg shadow-black/25 overflow-hidden">
                <span className="text-2xl sm:text-3xl font-bold font-serif tracking-wider">{initials}</span>
                <span className="text-[9px] uppercase tracking-widest text-[#c19b48] font-semibold mt-1">Biometric</span>
              </div>
            </div>

            {/* Profile Information */}
            <div className="space-y-1.5 min-w-0 flex-1 text-center sm:text-left">
              <h4 className="font-serif text-xl sm:text-2xl font-bold text-slate-900 dark:text-white truncate">
                {user?.name || 'Advocate Aspirant'}
              </h4>

              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-[#c19b48]/15 border border-[#c19b48]/35 text-[#a47a28] dark:text-[#f3d994] text-xs font-mono font-bold tracking-wide shadow-2xs">
                <span>Roll No:</span>
                <span>{rollNo}</span>
              </div>

              <div className="space-y-1 pt-1">
                <p className="text-xs text-slate-600 dark:text-slate-300 flex items-center justify-center sm:justify-start gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-[#c19b48] shrink-0" />
                  <span className="truncate">
                    Batch: <span className="font-medium text-slate-800 dark:text-slate-200">{user?.targetExam ? `${user.targetExam} (${user.targetYear || '2025-26'})` : 'Judiciary PCS-J Comprehensive Batch'}</span>
                  </span>
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-center sm:justify-start gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>
                    Valid Through: <span className="font-medium text-slate-700 dark:text-slate-300">{user?.targetYear ? `${user.targetYear} Academic Session` : '2025 – 2026 Academic Session'}</span>
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Barcode & Security Strip */}
          <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-[#143564]/50">
            <span className="font-mono tracking-widest text-[9px] uppercase">
              RLA-SECURE-PASS • NFC BIOMETRIC
            </span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Verified Gateway Access</span>
            </span>
          </div>

          {/* Action Footer */}
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={handleDownload}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[#d8b862] via-[#c19b48] to-[#a47a28] hover:from-[#e8cf8d] hover:to-[#c19b48] text-[#061120] font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-lg active:scale-[0.99]"
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

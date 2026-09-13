import React from 'react';
import { X, QrCode, Download, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface StudentIdModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StudentIdModal: React.FC<StudentIdModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleDownload = () => {
    toast.success('Digital Student ID Card downloaded (PDF)');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-md bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] rounded-2xl shadow-2xl overflow-hidden z-10 text-slate-800 dark:text-slate-100">
        {/* Card Header */}
        <div className="bg-[#0a1c36] text-white p-5 border-b border-[#143564] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Rajinder Law Academy"
              className="w-10 h-10 rounded-xl object-contain border border-[#c19b48]/40"
            />
            <div>
              <h3 className="font-serif text-base font-bold leading-tight">
                RAJINDER LAW ACADEMY
              </h3>
              <p className="text-[10px] text-[#e8cf8d] uppercase tracking-widest font-semibold">
                Classroom Identity Card & Gate Pass
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Card Body */}
        <div className="p-6 space-y-5">
          <div className="flex items-start gap-4">
            <div className="w-20 h-24 rounded-xl bg-[#061120] border-2 border-[#c19b48]/60 flex flex-col items-center justify-center text-[#e8cf8d] shrink-0 overflow-hidden shadow-md">
              <span className="text-2xl font-bold font-serif">RV</span>
              <span className="text-[9px] uppercase tracking-wider text-slate-400 mt-1">Photo</span>
            </div>

            <div className="space-y-1 min-w-0">
              <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                Active Enrolled Student
              </span>
              <h4 className="font-serif text-lg font-bold text-slate-900 dark:text-white truncate">
                Adv. Rohit Verma
              </h4>
              <p className="text-xs text-[#c19b48] font-mono font-bold">
                Roll No: RLA2025019
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Batch: Judiciary PCS-J (Morning Shift)
              </p>
              <p className="text-[11px] text-slate-400">
                Valid Through: 2025 - 2026 Academic Session
              </p>
            </div>
          </div>

          {/* QR Code Gate Pass Area */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                <QrCode className="w-4 h-4 text-[#c19b48]" />
                <span>Turnstile Access QR</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                Scan this dynamic QR code at the academy reception turnstiles to register offline attendance.
              </p>
              <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold pt-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Verified Biometric Gateway</span>
              </div>
            </div>

            {/* QR Mockup */}
            <div className="w-20 h-20 bg-white p-2 rounded-lg border-2 border-[#143564] shrink-0 flex items-center justify-center shadow-xs">
              <QrCode className="w-16 h-16 text-[#061120]" />
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={handleDownload}
              className="flex-1 py-2.5 px-4 rounded-xl bg-[#c19b48] hover:bg-[#d8b862] text-[#061120] font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
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

import React, { useState } from 'react';
import {
  X,
  QrCode,
  Download,
  CheckCircle2,
  ShieldCheck,
  Calendar,
  GraduationCap,
  Copy,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '../../store/useAuthStore';

interface StudentIdModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StudentIdModal: React.FC<StudentIdModalProps> = ({ isOpen, onClose }) => {
  const user = useAuthStore((state) => state.user);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const rollNo = user?.rollNo || 'RLA2026-PENDING';
  const qrPassToken = `RLA-PASS-${rollNo}-SECURE`;

  const handleDownload = () => {
    toast.success('High-Resolution ID Card PDF Downloaded', {
      description: 'Official digital classroom pass saved to your downloads.',
    });
  };

  const handleCopyPassId = () => {
    navigator.clipboard.writeText(qrPassToken);
    setCopied(true);
    toast.success('Security Pass Token Copied', {
      description: qrPassToken,
    });
    setTimeout(() => setCopied(false), 2000);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      {/* Main Modal Card */}
      <div className="relative w-full max-w-lg bg-white dark:bg-[#0a1c36] border border-slate-200/90 dark:border-[#c19b48]/35 rounded-3xl shadow-2xl overflow-hidden z-10 text-slate-800 dark:text-slate-100 transition-all">
        {/* Top Gold Accent Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#9b7829] via-[#e8cf8d] to-[#9b7829]" />

        {/* Card Header */}
        <div className="relative bg-gradient-to-b from-[#0e274b] to-[#0a1c36] text-white px-6 py-4 sm:py-5 border-b border-[#143564]/80 flex items-center justify-between">
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
              <p className="text-[10px] text-[#e8cf8d] uppercase tracking-widest font-semibold flex items-center gap-1.5 mt-0.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Classroom Identity Card & Gate Pass</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer relative z-10"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Card Body */}
        <div className="p-6 space-y-5 relative">
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
              {/* Active Clearance Indicator */}
              <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 border-2 border-white dark:border-[#0a1c36] shadow-sm">
                <CheckCircle2 className="w-3.5 h-3.5" />
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

          {/* Contactless QR Gate Pass Area */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-50 to-slate-100/70 dark:from-[#061120] dark:to-[#091b35] border border-slate-200 dark:border-[#143564] shadow-xs relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1.5 flex-1 min-w-0 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                <ShieldCheck className="w-4 h-4 text-[#c19b48]" />
                <span>Turnstile Access QR</span>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-semibold tracking-wide ml-1">
                  ● ACTIVE
                </span>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                Scan this dynamic QR code at the academy reception turnstiles to register offline attendance.
              </p>

              <div className="flex items-center justify-center sm:justify-start gap-2 pt-0.5">
                <span className="text-[10px] font-mono text-[#c19b48] dark:text-[#e8cf8d] bg-[#c19b48]/10 px-2.5 py-0.5 rounded-md border border-[#c19b48]/20 truncate">
                  {qrPassToken}
                </span>
                <button
                  type="button"
                  onClick={handleCopyPassId}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  title="Copy pass token"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Stylized QR Pass Frame with Scanner Reticles */}
            <div className="relative group shrink-0">
              <div className="w-22 h-22 bg-white p-2 rounded-xl border border-slate-300 dark:border-[#c19b48]/40 shadow-xs flex flex-col items-center justify-center relative overflow-hidden">
                {/* Corner decorative scanner reticles */}
                <div className="absolute top-1 left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-[#c19b48]" />
                <div className="absolute top-1 right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-[#c19b48]" />
                <div className="absolute bottom-1 left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-[#c19b48]" />
                <div className="absolute bottom-1 right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-[#c19b48]" />

                <QrCode className="w-16 h-16 text-[#061120]" />
              </div>
              <p className="text-[9px] text-center text-slate-400 dark:text-slate-500 mt-1 font-mono tracking-widest uppercase">
                ENTRY GATE
              </p>
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

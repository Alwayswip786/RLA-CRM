import React, { useState } from 'react';
import {
  User,
  Mail,
  Phone,
  Scale,
  Calendar,
  Save,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';

export const ProfilePage: React.FC = () => {
  const [name, setName] = useState('Adv. Rohit Verma');
  const [email, setEmail] = useState('rohit.verma@example.com');
  const [phone, setPhone] = useState('9876543210');
  const [targetExam, setTargetExam] = useState('Judicial Services (PCS-J)');
  const [targetState, setTargetState] = useState('Delhi (DJS)');
  const [targetYear, setTargetYear] = useState('2026');

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      name,
      email,
      phone,
      targetExam,
      targetState,
      targetYear,
    };
    localStorage.setItem('rla_student_session', JSON.stringify(updated));
    toast.success('Student KYC Profile updated successfully!');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] space-y-2">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#c19b48]/15 text-[#c19b48] dark:text-[#e8cf8d] text-xs font-semibold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Candidate Information & KYC</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 dark:text-white">
          Student Profile & Judicial Preferences
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Manage your verified academy details, target jurisdiction, and exam session.
        </p>
      </div>

      {/* Form Card */}
      <form onSubmit={handleSaveProfile} className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] space-y-6 shadow-xs">
        <div className="flex items-center gap-4 pb-6 border-b border-slate-100 dark:border-[#143564]">
          <div className="w-16 h-16 rounded-2xl bg-[#c19b48]/20 border-2 border-[#c19b48]/40 text-[#c19b48] dark:text-[#e8cf8d] flex items-center justify-center font-bold text-xl font-serif">
            RV
          </div>
          <div>
            <h3 className="text-lg font-serif font-bold text-slate-900 dark:text-white">{name}</h3>
            <span className="text-xs text-[#c19b48] font-mono font-semibold">Roll: RLA2025019</span>
            <span className="text-slate-400 text-xs block mt-0.5">Enrolled: Judicial Foundation 2025-26</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Candidate Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-9 pr-3 py-2 sm:py-2.5 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#c19b48]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Registered WhatsApp Mobile
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-9 pr-3 py-2 sm:py-2.5 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#c19b48]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Registered Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 sm:py-2.5 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#c19b48]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Target Judicial Focus
            </label>
            <div className="relative">
              <Scale className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                value={targetExam}
                onChange={(e) => setTargetExam(e.target.value)}
                className="w-full pl-9 pr-3 py-2 sm:py-2.5 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#c19b48]"
              >
                <option value="Judicial Services (PCS-J)">Judicial Services (PCS-J)</option>
                <option value="Higher Judicial Services (HJS)">Higher Judicial Services (HJS)</option>
                <option value="Assistant Public Prosecutor (APP/ADA)">Assistant Public Prosecutor (APP/ADA)</option>
                <option value="CLAT PG / Judicial LLM">CLAT PG / Judicial LLM</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              State / Jurisdiction
            </label>
            <div className="relative">
              <Scale className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                value={targetState}
                onChange={(e) => setTargetState(e.target.value)}
                className="w-full pl-9 pr-3 py-2 sm:py-2.5 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#c19b48]"
              >
                <option value="Delhi (DJS)">Delhi Judicial Services (DJS)</option>
                <option value="Uttar Pradesh (UP PCS-J)">Uttar Pradesh PCS-J</option>
                <option value="Haryana (HCS Judicial)">Haryana HCS Judicial</option>
                <option value="Madhya Pradesh (MP CJ)">Madhya Pradesh Civil Judge</option>
                <option value="Rajasthan (RJS)">Rajasthan Judicial Services (RJS)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Target Examination Year
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                value={targetYear}
                onChange={(e) => setTargetYear(e.target.value)}
                className="w-full pl-9 pr-3 py-2 sm:py-2.5 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#c19b48]"
              >
                <option value="2025">2025</option>
                <option value="2026">2026</option>
                <option value="2027">2027</option>
              </select>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-[#143564] flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-[#c19b48] hover:bg-[#d8b862] text-[#061120] font-semibold text-xs sm:text-sm transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Save className="w-4 h-4" />
            <span>Save Profile Changes</span>
          </button>
        </div>
      </form>
    </div>
  );
};

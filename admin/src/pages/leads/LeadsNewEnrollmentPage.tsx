import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export const LeadsNewEnrollmentPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    college: 'Campus Law Centre (CLC), Delhi University',
    courseId: 'djs-foundation',
    batchShift: 'Morning Shift (Cohort A)',
    feePlan: 'installments',
    rfidCard: 'GATE-A-' + Math.floor(100 + Math.random() * 900),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.phone) {
      toast.error('Please enter student name and phone number');
      return;
    }

    toast.success(
      <div>
        <div className="font-semibold text-[#F7F3E6]">Student Enrolled Successfully!</div>
        <div className="text-xs text-[#A8A294] mt-0.5">Assigned Roll #RLA-2026-{Math.floor(100 + Math.random() * 900)} to {formData.fullName}. RFID Gate pass active.</div>
      </div>
    );
    navigate('/students/roster');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 select-none">
      {/* Header */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] space-y-1">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#34D399]/15 border border-[#34D399]/30 text-[#34D399] text-xs font-semibold">
          <GraduationCap className="w-3.5 h-3.5" />
          <span>Institutional Admissions Portal</span>
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#F7F3E6]">
          Direct Student Admission Form
        </h1>
        <p className="text-xs text-[#A8A294] leading-relaxed">
          Issue formal roll numbers, allocate classroom shift batches, generate fee installment schedules, and authorize campus turnstile RFID gate passes.
        </p>
      </div>

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="p-6 sm:p-8 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] space-y-6">
        {/* Section 1: Personal Details */}
        <div className="space-y-4">
          <h3 className="font-serif text-base font-bold text-[#F7F3E6] border-b border-[#3D3D3D] pb-2">
            1. Aspirant Personal & Academic Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="text-[#A8A294] font-medium">Full Name (As per LL.B Degree)</label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="e.g. Adv. Saurabh Trivedi"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] placeholder-[#A8A294] focus:outline-hidden focus:border-[#C19B48]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[#A8A294] font-medium">Phone Number (WhatsApp Active)</label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98112 00000"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] placeholder-[#A8A294] focus:outline-hidden focus:border-[#C19B48]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[#A8A294] font-medium">Email Address</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="saurabh.t@law.du.ac.in"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] placeholder-[#A8A294] focus:outline-hidden focus:border-[#C19B48]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[#A8A294] font-medium">Law School / LL.B College</label>
              <input
                type="text"
                value={formData.college}
                onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] focus:outline-hidden focus:border-[#C19B48]"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Course & Batch Allocation */}
        <div className="space-y-4">
          <h3 className="font-serif text-base font-bold text-[#F7F3E6] border-b border-[#3D3D3D] pb-2">
            2. Course & Batch Shift Selection
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="text-[#A8A294] font-medium">Enrolled Judicial Course</label>
              <select
                value={formData.courseId}
                onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] focus:outline-hidden focus:border-[#C19B48] cursor-pointer"
              >
                <option value="djs-foundation">Judicial Services (PCS-J) Comprehensive Foundation</option>
                <option value="cpc-chambers">Civil Procedure Code (CPC) & Pleadings Drafting</option>
                <option value="bns-mastery">Bhartiya Nyaya Sanhita (BNS) & Criminal Law</option>
                <option value="constitution-bench">Constitution Law & Constitutional Benches</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[#A8A294] font-medium">Classroom Batch Shift</label>
              <select
                value={formData.batchShift}
                onChange={(e) => setFormData({ ...formData, batchShift: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] focus:outline-hidden focus:border-[#C19B48] cursor-pointer"
              >
                <option value="Morning Shift (Cohort A)">Morning Shift (Cohort A) • 08:00 AM - 01:00 PM</option>
                <option value="Evening Shift (Cohort B)">Evening Shift (Cohort B) • 05:00 PM - 09:00 PM</option>
                <option value="Weekend Fastrack (Cohort C)">Weekend Fastrack (Cohort C) • Sat & Sun</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Fee Payment & Turnstile Card */}
        <div className="space-y-4">
          <h3 className="font-serif text-base font-bold text-[#F7F3E6] border-b border-[#3D3D3D] pb-2">
            3. Fee Structure & RFID Turnstile Gate Pass
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="text-[#A8A294] font-medium">Fee Payment Plan</label>
              <select
                value={formData.feePlan}
                onChange={(e) => setFormData({ ...formData, feePlan: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] focus:outline-hidden focus:border-[#C19B48] cursor-pointer"
              >
                <option value="lump_sum">Full Payment (₹1,45,000 - 10% Foundation Grant)</option>
                <option value="installments">3 Installments Plan (₹50,000 / installment)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[#A8A294] font-medium">Assigned Campus RFID Gate Pass ID</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={formData.rfidCard}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#262626] border border-[#3D3D3D] font-mono text-[#E8CF8D] focus:outline-hidden"
                />
                <span className="text-[10px] text-[#34D399] shrink-0 font-semibold bg-[#34D399]/15 px-2 py-1 rounded">
                  Turnstile Active
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Bar */}
        <div className="pt-4 border-t border-[#3D3D3D] flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/leads/pipeline')}
            className="px-4 py-2.5 rounded-xl bg-[#262626] hover:bg-[#2F2F2F] text-[#A8A294] hover:text-[#F7F3E6] text-xs font-medium border border-[#3D3D3D] transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#C19B48] hover:bg-[#D8B862] text-[#1E1E1E] text-xs font-bold transition-colors cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Complete Admission & Issue Roll Number</span>
          </button>
        </div>
      </form>
    </div>
  );
};

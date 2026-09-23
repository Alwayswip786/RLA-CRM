import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  Scale,
  Calendar,
  Save,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Loader2,
  BookOpen,
} from 'lucide-react';
import { toast } from '../../lib/toast';
import { useAuthStore } from '../../store/useAuthStore';
import { apiClient } from '../../lib/apiClient';
import { CustomSelect } from '../../components/ui/CustomSelect';

const SALUTATION_OPTIONS = [
  { value: 'Adv.', label: 'Advocate (Adv.)' },
  { value: 'Mr.', label: 'Mr.' },
  { value: 'Ms.', label: 'Ms.' },
  { value: 'Dr.', label: 'Dr.' },
];

const ACADEMIC_STATUS_OPTIONS = [
  { value: 'Full-Time Aspirant', label: 'Full-Time Aspirant (Dedicated Prep)' },
  { value: 'Class 11 Student', label: 'Class 11 Student (Foundation & CLAT)' },
  { value: 'Class 12 Student', label: 'Class 12 Student (Senior Secondary / Boards)' },
];

const TARGET_EXAM_OPTIONS = [
  { value: 'Delhi Judicial Service (DJS)', label: 'Delhi Judicial Service (DJS)' },
  { value: 'UP PCS (Judicial)', label: 'UP PCS (Judicial)' },
  { value: 'Haryana Civil Judge (HCS-J)', label: 'Haryana Civil Judge (HCS-J)' },
  { value: 'Rajasthan Judicial Service (RJS)', label: 'Rajasthan Judicial Service (RJS)' },
  { value: 'MP Civil Judge (MP-CJ)', label: 'MP Civil Judge (MP-CJ)' },
  { value: 'Bihar Judicial Service (BPSC-J)', label: 'Bihar Judicial Service (BPSC-J)' },
  { value: 'Higher Judicial Services (HJS)', label: 'Higher Judicial Services (HJS)' },
  { value: 'Assistant Public Prosecutor (APP/ADA)', label: 'Assistant Public Prosecutor (APP/ADA)' },
  { value: 'CLAT PG / Judicial LLM', label: 'CLAT PG / Judicial LLM' },
];

const TARGET_STATE_OPTIONS = [
  { value: 'Delhi / NCR', label: 'Delhi / NCR' },
  { value: 'Uttar Pradesh', label: 'Uttar Pradesh' },
  { value: 'Haryana', label: 'Haryana' },
  { value: 'Punjab', label: 'Punjab' },
  { value: 'Rajasthan', label: 'Rajasthan' },
  { value: 'Madhya Pradesh', label: 'Madhya Pradesh' },
  { value: 'Bihar', label: 'Bihar' },
  { value: 'Himachal Pradesh', label: 'Himachal Pradesh' },
  { value: 'Uttarakhand', label: 'Uttarakhand' },
  { value: 'All-India Judicial Services', label: 'All-India Judicial Services' },
];

const TARGET_YEAR_OPTIONS = [
  { value: '2025', label: 'Target 2025' },
  { value: '2025-2026', label: 'Target 2025–2026' },
  { value: '2026-2027', label: 'Target 2026–2027' },
];

export const ProfilePage: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const updateProfile = useAuthStore((state) => state.updateProfile);

  // Profile Form State
  const [salutation, setSalutation] = useState<'Adv.' | 'Mr.' | 'Ms.' | 'Dr.'>(
    (user?.salutation as 'Adv.' | 'Mr.' | 'Ms.' | 'Dr.') || 'Adv.'
  );
  const [name, setName] = useState(() => {
    if (!user?.name) return '';
    return user.name.replace(/^(Adv\.|Mr\.|Ms\.|Dr\.)\s*/, '');
  });
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [academicStatus, setAcademicStatus] = useState(
    user?.academicStatus || 'Full-Time Aspirant'
  );
  const [targetExam, setTargetExam] = useState(user?.targetExam || 'Delhi Judicial Service (DJS)');
  const [targetState, setTargetState] = useState(user?.targetState || 'Delhi / NCR');
  const [targetYear, setTargetYear] = useState(user?.targetYear || '2025-2026');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password Form State
  const hasExistingPassword = user?.hasPassword !== false;
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Re-sync local form states if user store updates
  useEffect(() => {
    if (user) {
      if (user.salutation) setSalutation(user.salutation as 'Adv.' | 'Mr.' | 'Ms.' | 'Dr.');
      if (user.name) {
        setName(user.name.replace(/^(Adv\.|Mr\.|Ms\.|Dr\.)\s*/, ''));
      }
      if (user.email) setEmail(user.email);
      if (user.phone) setPhone(user.phone);
      if (user.academicStatus) setAcademicStatus(user.academicStatus);
      if (user.targetExam) setTargetExam(user.targetExam);
      if (user.targetState) setTargetState(user.targetState);
      if (user.targetYear) setTargetYear(user.targetYear);
    }
  }, [user]);

  // Compute initials dynamically from full name
  const initials = (name || user?.name || 'Advocate')
    .replace(/^(Adv\.|Mr\.|Ms\.|Dr\.)\s*/, '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase() || 'RL';

  // 1. Save Profile Changes
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.replace(/^(Adv\.|Mr\.|Ms\.|Dr\.)\s*/, '').trim();
    if (!cleanName) {
      toast.error('Candidate name cannot be empty.');
      return;
    }

    const finalFullName = `${salutation} ${cleanName}`;

    setIsSavingProfile(true);
    try {
      const response = await apiClient.patch('/auth/profile', {
        salutation,
        name: finalFullName,
        phone: phone.trim(),
        academicStatus,
        targetExam,
        targetState,
        targetYear,
      });

      const updatedUser = response.data?.user;
      updateProfile({
        salutation: updatedUser?.salutation || salutation,
        name: updatedUser?.name || finalFullName,
        phone: updatedUser?.phone || phone,
        academicStatus: updatedUser?.academicStatus || academicStatus,
        targetExam: updatedUser?.targetExam || targetExam,
        targetState: updatedUser?.targetState || targetState,
        targetYear: updatedUser?.targetYear || targetYear,
      });

      toast.success('Student KYC Profile updated successfully!', {
        description: 'Your profile and judicial preferences are saved.',
      });
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to update profile. Please try again.';
      toast.error('Update Failed', { description: msg });
    } finally {
      setIsSavingProfile(false);
    }
  };

  // 2. Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (hasExistingPassword && !currentPassword) {
      toast.error('Please enter your current password.');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match. Please verify.');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const response = await apiClient.post('/auth/change-password', {
        currentPassword: hasExistingPassword ? currentPassword : '',
        newPassword,
      });

      if (response.data?.user) {
        updateProfile({
          hasPassword: true,
        });
      }

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      toast.success('Security Password Updated!', {
        description: 'Your new credentials are now active for both Roll No. and Email login.',
      });
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to update password. Please try again.';
      toast.error('Password Update Failed', { description: msg });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-start gap-3.5 animate-in fade-in duration-200">
      {/* Card 1: Student Profile Form */}
      <form
        onSubmit={handleSaveProfile}
        className="flex-1 lg:flex-[1.15] w-full p-4 sm:p-5 lg:p-6 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] space-y-5 shadow-xs"
      >
        <div className="flex items-center gap-4 pb-6 border-b border-slate-100 dark:border-[#143564]">
          <div className="w-16 h-16 rounded-2xl bg-[#c19b48]/20 border-2 border-[#c19b48]/40 text-[#c19b48] dark:text-[#e8cf8d] flex items-center justify-center font-bold text-xl font-serif shrink-0">
            {initials}
          </div>
          <div>
            <h3 className="text-lg font-serif font-bold text-slate-900 dark:text-white">
              {name ? `${salutation} ${name}`.trim() : (user?.name || 'Advocate Aspirant')}
            </h3>
            <div className="flex flex-wrap items-center gap-2 mt-0.5">
              <span className="text-xs text-[#c19b48] font-mono font-bold bg-[#c19b48]/10 px-2 py-0.5 rounded-md border border-[#c19b48]/20">
                Roll No: {user?.rollNo || 'RLA2026-PENDING'}
              </span>
              <span className="text-slate-400 text-xs">
                • {academicStatus || user?.academicStatus || 'Full-Time Aspirant'}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Professional Title / Salutation */}
          <CustomSelect
            label="Professional Title / Salutation"
            value={salutation}
            onChange={(val) => setSalutation(val as 'Adv.' | 'Mr.' | 'Ms.' | 'Dr.')}
            options={SALUTATION_OPTIONS}
            sheetTitle="Select Professional Title"
          />

          {/* Candidate Legal Name */}
          <div>
            <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Candidate Legal Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rohit Verma"
                className="w-full pl-9 pr-3 py-2 sm:py-2.5 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#c19b48]"
              />
            </div>
          </div>

          {/* Registered Email (Protected) */}
          <div className="col-span-full">
            <div className="flex items-center justify-between gap-2 flex-wrap mb-1.5">
              <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300">
                Registered Institutional Email
              </label>
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold shrink-0">
                <CheckCircle2 className="w-3 h-3" />
                Verified
              </span>
            </div>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                disabled
                value={email}
                title="Your verified email is locked to your student record."
                className="w-full pl-9 pr-3 py-2 sm:py-2.5 rounded-xl bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-[#143564] text-xs sm:text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed select-none truncate"
              />
            </div>
          </div>

          {/* Registered WhatsApp Phone */}
          <div>
            <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Registered WhatsApp Mobile
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                placeholder="e.g. 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-9 pr-3 py-2 sm:py-2.5 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#c19b48]"
              />
            </div>
          </div>

          {/* Academic Background / Status */}
          <CustomSelect
            label="Academic Background / Status"
            icon={<BookOpen className="w-4 h-4" />}
            value={academicStatus}
            onChange={(val) => setAcademicStatus(val)}
            options={ACADEMIC_STATUS_OPTIONS}
            sheetTitle="Select Academic Background"
          />

          {/* Target Judicial Focus */}
          <CustomSelect
            label="Target Judicial Focus"
            icon={<Scale className="w-4 h-4" />}
            value={targetExam}
            onChange={(val) => setTargetExam(val)}
            options={TARGET_EXAM_OPTIONS}
            searchable
            sheetTitle="Target Judicial Focus"
          />

          {/* State / Jurisdiction */}
          <CustomSelect
            label="State / Jurisdiction"
            icon={<Scale className="w-4 h-4" />}
            value={targetState}
            onChange={(val) => setTargetState(val)}
            options={TARGET_STATE_OPTIONS}
            searchable
            sheetTitle="State / Jurisdiction"
          />

          {/* Target Examination Year */}
          <CustomSelect
            label="Target Examination Year"
            icon={<Calendar className="w-4 h-4" />}
            value={targetYear}
            onChange={(val) => setTargetYear(val)}
            options={TARGET_YEAR_OPTIONS}
            sheetTitle="Target Examination Year"
          />
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-[#143564] flex justify-end">
          <button
            type="submit"
            disabled={isSavingProfile}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#c19b48] hover:bg-[#d8b862] disabled:opacity-60 text-[#061120] font-semibold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            {isSavingProfile ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving to Cloud...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Profile Changes</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Card 2: Security & Password Management */}
      <form
        onSubmit={handleChangePassword}
        className="flex-1 w-full p-4 sm:p-5 lg:p-6 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] space-y-5 shadow-xs"
      >
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-[#143564]">
          <div className="w-10 h-10 rounded-xl bg-[#c19b48]/15 text-[#c19b48] dark:text-[#e8cf8d] flex items-center justify-center shrink-0">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-serif font-bold text-slate-900 dark:text-white">
              {hasExistingPassword ? 'Change Security Password' : 'Set Account Password'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {hasExistingPassword
                ? 'Update your classroom login password. This will apply to both your sequential Roll No. and Email login.'
                : 'You signed in via Google OAuth. Setting a password allows logging in with your sequential Roll Number directly.'}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Current Password (only if user already has one) */}
          {hasExistingPassword && (
            <div>
              <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Current Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2 sm:py-2.5 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#c19b48]"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 2xl:grid-cols-2 gap-3.5">
            {/* New Password */}
            <div>
              <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                New Password (min. 8 characters)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2 sm:py-2.5 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#c19b48]"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2 sm:py-2.5 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#c19b48]"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-[#143564] flex flex-col sm:flex-row lg:flex-col 2xl:flex-row items-stretch sm:items-center lg:items-start 2xl:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            <AlertCircle className="w-3.5 h-3.5 text-[#c19b48] shrink-0" />
            <span>Updating your password will refresh your active session.</span>
          </div>

          <button
            type="submit"
            disabled={isUpdatingPassword}
            className="w-full sm:w-auto lg:w-full 2xl:w-auto px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-[#c19b48] dark:hover:bg-[#d8b862] text-white dark:text-[#061120] font-semibold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-60 shrink-0"
          >
            {isUpdatingPassword ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Updating Password...</span>
              </>
            ) : (
              <>
                <KeyRound className="w-4 h-4" />
                <span>Update Password</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

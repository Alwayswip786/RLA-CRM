import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Scale,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  BookOpen,
  School,
  MapPin,
  Calendar,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import { useAuthStore } from '../../store/useAuthStore';
import { apiClient } from '../../lib/apiClient';

// Target Judicial Examination Options
const TARGET_EXAMS = [
  { id: 'djs', name: 'Delhi Judicial Service', code: 'DJS', state: 'Delhi / NCR', badge: 'High Court of Delhi' },
  { id: 'uppcsj', name: 'UP PCS (Judicial)', code: 'UP PCS-J', state: 'Uttar Pradesh', badge: 'Allahabad High Court' },
  { id: 'hcs', name: 'Haryana Civil Judge', code: 'HCS-J', state: 'Haryana', badge: 'Punjab & Haryana HC' },
  { id: 'rjs', name: 'Rajasthan Judicial Service', code: 'RJS', state: 'Rajasthan', badge: 'Rajasthan High Court' },
  { id: 'mpcj', name: 'MP Civil Judge', code: 'MP-CJ', state: 'Madhya Pradesh', badge: 'MP High Court' },
  { id: 'bpcsj', name: 'Bihar Judicial Service', code: 'BPSC-J', state: 'Bihar', badge: 'Patna High Court' },
];

const TARGET_STATES = [
  'Delhi / NCR',
  'Uttar Pradesh',
  'Haryana',
  'Punjab',
  'Rajasthan',
  'Madhya Pradesh',
  'Bihar',
  'Himachal Pradesh',
  'Uttarakhand',
  'All-India Judicial Services',
];

const TARGET_YEARS = [
  { value: '2025', label: 'Target 2025', desc: 'Upcoming prelims / mains' },
  { value: '2025-2026', label: 'Target 2025–26', desc: 'Foundation comprehensive' },
  { value: '2026-2027', label: 'Target 2026–27', desc: 'Long-term 2-year roadmap' },
];

const BACKGROUND_OPTIONS = [
  {
    id: 'aspirant',
    label: 'Full-Time Aspirant',
    desc: 'Dedicated full-time preparation for state judicial examinations',
    icon: BookOpen,
  },
  {
    id: 'class_11',
    label: 'Class 11 Student',
    desc: 'Secondary school student preparing early for Law Foundation & CLAT',
    icon: School,
  },
  {
    id: 'class_12',
    label: 'Class 12 Student',
    desc: 'Senior secondary student balancing Board exams & CLAT UG Entrance',
    icon: School,
  },
];

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const completeOnboarding = useAuthStore((state) => state.completeOnboarding);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [salutation, setSalutation] = useState<'Adv.' | 'Mr.' | 'Ms.' | 'Dr.'>('Adv.');

  // Pre-fill initial name
  const [fullName, setFullName] = useState(() => {
    if (!user?.name || user.name.startsWith('Candidate ') || user.name.includes('@')) {
      return '';
    }
    return user.name.replace(/^(Adv\.|Mr\.|Ms\.|Dr\.)\s*/, '');
  });

  // Step 2 State
  const [selectedExamCode, setSelectedExamCode] = useState('DJS');
  const [targetExam, setTargetExam] = useState('Delhi Judicial Service (DJS)');
  const [targetState, setTargetState] = useState('Delhi / NCR');
  const [targetYear, setTargetYear] = useState('2025-2026');

  // Step 3 State
  const [background, setBackground] = useState('Full-Time Aspirant');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle Exam Selection
  const handleSelectExam = (exam: typeof TARGET_EXAMS[0]) => {
    setSelectedExamCode(exam.code);
    setTargetExam(`${exam.name} (${exam.code})`);
    setTargetState(exam.state);
  };

  // Step 1 Validation
  const handleNextFromStep1 = () => {
    if (!fullName.trim()) {
      toast.error('Name Required', { description: 'Please enter your full legal candidate name.' });
      return;
    }
    if (fullName.trim().length < 3) {
      toast.error('Invalid Name', { description: 'Name should be at least 3 characters long.' });
      return;
    }
    setStep(2);
  };

  // Step 2 Next
  const handleNextFromStep2 = () => {
    if (!targetExam) {
      toast.error('Exam Required', { description: 'Please select your target judicial examination.' });
      return;
    }
    setStep(3);
  };

  // Final Submit
  const handleCompleteAndEnterDashboard = async () => {
    setIsSubmitting(true);
    const finalName = `${salutation} ${fullName.trim()}`;

    try {
      const response = await apiClient.patch('/auth/onboarding', {
        salutation,
        name: finalName,
        targetExam,
        targetState,
        targetYear,
        academicStatus: background,
      });

      const updatedUser = response.data?.user;

      completeOnboarding({
        name: updatedUser?.name || finalName,
        salutation: updatedUser?.salutation || salutation,
        targetExam: updatedUser?.targetExam || targetExam,
        targetState: updatedUser?.targetState || targetState,
        targetYear: updatedUser?.targetYear || targetYear,
        academicStatus: updatedUser?.academicStatus || background,
      });

      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.5 },
          colors: ['#c19b48', '#d8b862', '#143564', '#061120', '#ffffff'],
        });
      } catch {
        // Safe fallback
      }

      toast.success('Onboarding Completed!', {
        description: `Welcome to Rajinder Law Academy, ${finalName}! Your customized classroom is ready.`,
        duration: 5000,
      });

      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setIsSubmitting(false);
      const msg = err?.response?.data?.message || 'Failed to save profile. Please try again.';
      toast.error('Onboarding Error', { description: msg });
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between items-center bg-[#F7F3E6] dark:bg-[#040B14] text-slate-900 dark:text-slate-100 font-sans transition-colors px-4 py-6 sm:px-6 sm:py-8 overflow-y-auto">
      {/* Centered Luxury Onboarding Card */}
      <div className="w-full max-w-[620px] my-auto bg-white dark:bg-[#0A1C36] border border-slate-200 dark:border-[#143564] rounded-2xl p-5 sm:p-7 shadow-xl shrink-0 transition-colors">
        {/* Brand Header & Step Progress Tracker */}
        <div className="mb-6">
          <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-[#143564]/80">
            <div>
              <span className="block font-serif text-sm font-bold tracking-tight text-slate-900 dark:text-white leading-none">
                RAJINDER LAW ACADEMY
              </span>
              <span className="block text-[8px] font-bold text-[#c19b48] tracking-widest uppercase mt-0.5">
                JUDICIAL SERVICES CLASSROOM ONBOARDING
              </span>
            </div>

            {/* Step Counter Pill */}
            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span className="text-[#a07c2b] dark:text-[#e8cf8d]">Step {step}</span>
              <span className="text-slate-400">of 3</span>
            </div>
          </div>

          {/* Animated 3-Segment Progress Bar */}
          <div className="mt-4 grid grid-cols-3 gap-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="space-y-1">
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    s <= step
                      ? 'bg-[#c19b48]'
                      : 'bg-slate-200 dark:bg-[#061120]'
                  }`}
                />
                <span className="block text-[10px] font-medium text-slate-500 dark:text-slate-400">
                  {s === 1 ? '1. Identity' : s === 2 ? '2. Target Exam' : '3. Preferences'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Step-by-Step Forms */}
        <AnimatePresence mode="wait">
          {/* ========================================================= */}
          {/* STEP 1: CANDIDATE IDENTITY & MISSING CONTACT DETAILS      */}
          {/* ========================================================= */}
          {step === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div>
                <h2 className="text-lg sm:text-xl font-serif font-bold text-slate-900 dark:text-white leading-snug">
                  Welcome! Establish your candidate identity
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Your legal name will be printed on your Academy ID Card, Mains DAW Evaluated Copies, and Mock Test Merit Lists.
                </p>
              </div>

              {/* Salutation / Title Selector */}
              <div>
                <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Professional Title / Salutation <span className="text-red-500 font-bold">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {(['Adv.', 'Mr.', 'Ms.', 'Dr.'] as const).map((title) => (
                    <button
                      key={title}
                      type="button"
                      onClick={() => setSalutation(title)}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        salutation === title
                          ? 'bg-[#c19b48] text-[#061120] font-bold shadow-xs'
                          : 'bg-slate-100 dark:bg-[#061120] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#143564] hover:bg-slate-200/80 dark:hover:bg-[#0c203b]'
                      }`}
                    >
                      {title}
                    </button>
                  ))}
                </div>
              </div>

              {/* Full Legal Name */}
              <div>
                <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Candidate Full Legal Name <span className="text-red-500 font-bold">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                    <User className="w-4 h-4" strokeWidth={1.75} />
                  </div>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Rohit Verma"
                    autoFocus
                    className="w-full pl-9 pr-3 py-2 sm:py-2.5 rounded-xl bg-slate-50 dark:bg-[#061120]/80 border border-slate-200 dark:border-[#143564] text-xs sm:text-sm font-normal text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-[#c19b48] transition-all"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleNextFromStep1}
                  className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-[#c19b48] hover:bg-[#d8b862] text-[#061120] font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <span>Next: Target Examination</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ========================================================= */}
          {/* STEP 2: TARGET JUDICIAL EXAMINATION & JURISDICTION        */}
          {/* ========================================================= */}
          {step === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div>
                <h2 className="text-lg sm:text-xl font-serif font-bold text-slate-900 dark:text-white leading-snug">
                  Select your Target Judicial Examination
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  We configure your syllabus progress radar, local bare acts, and prelims test series to your chosen state.
                </p>
              </div>

              {/* Exam Visual Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[260px] overflow-y-auto pr-1">
                {TARGET_EXAMS.map((exam) => {
                  const isSelected = selectedExamCode === exam.code;
                  return (
                    <div
                      key={exam.id}
                      onClick={() => handleSelectExam(exam)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-2.5 ${
                        isSelected
                          ? 'border-[#c19b48] bg-[#c19b48]/10 dark:bg-[#c19b48]/15 shadow-xs'
                          : 'border-slate-200 dark:border-[#143564] bg-slate-50 dark:bg-[#061120] hover:border-[#c19b48]/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                            isSelected
                              ? 'bg-[#c19b48] text-[#061120]'
                              : 'bg-slate-200 dark:bg-[#0a1c36] text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <Scale className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {exam.name}
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                            {exam.badge}
                          </p>
                        </div>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-[#c19b48] shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Target State & Target Year in 2 Columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                {/* State Jurisdiction Dropdown */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    State / Jurisdiction <span className="text-red-500 font-bold">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                      <MapPin className="w-4 h-4" strokeWidth={1.75} />
                    </div>
                    <select
                      value={targetState}
                      onChange={(e) => setTargetState(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 sm:py-2.5 rounded-xl bg-slate-50 dark:bg-[#061120]/80 border border-slate-200 dark:border-[#143564] text-xs sm:text-sm font-normal text-slate-900 dark:text-white focus:outline-none focus:border-[#c19b48] transition-all cursor-pointer"
                    >
                      {TARGET_STATES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Target Year Selector */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Target Exam Year <span className="text-red-500 font-bold">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                      <Calendar className="w-4 h-4" strokeWidth={1.75} />
                    </div>
                    <select
                      value={targetYear}
                      onChange={(e) => setTargetYear(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 sm:py-2.5 rounded-xl bg-slate-50 dark:bg-[#061120]/80 border border-slate-200 dark:border-[#143564] text-xs sm:text-sm font-normal text-slate-900 dark:text-white focus:outline-none focus:border-[#c19b48] transition-all cursor-pointer"
                    >
                      {TARGET_YEARS.map((yr) => (
                        <option key={yr.value} value={yr.value}>
                          {yr.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="py-2.5 sm:py-3 px-4 rounded-xl border border-slate-200 dark:border-[#143564] bg-slate-100 dark:bg-[#061120] text-slate-700 dark:text-slate-300 font-semibold text-xs sm:text-sm hover:bg-slate-200 dark:hover:bg-[#0c203b] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={handleNextFromStep2}
                  className="flex-1 py-2.5 sm:py-3 px-4 rounded-xl bg-[#c19b48] hover:bg-[#d8b862] text-[#061120] font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <span>Next: Candidate Profile</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ========================================================= */}
          {/* STEP 3: CANDIDATE BACKGROUND & MEDIUM OF INSTRUCTION      */}
          {/* ========================================================= */}
          {step === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div>
                <h2 className="text-lg sm:text-xl font-serif font-bold text-slate-900 dark:text-white leading-snug">
                  Current Academic &amp; Legal Status
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Helps Adv. Rajinder Sir &amp; evaluating faculty personalize your daily study routine, syllabus pacing, and exam mentoring.
                </p>
              </div>

              {/* Candidate Background Selection */}
              <div>
                <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-2">
                  What best describes your current student or professional status? <span className="text-red-500 font-bold">*</span>
                </label>
                <div className="space-y-2.5">
                  {BACKGROUND_OPTIONS.map((opt) => {
                    const isSelected = background === opt.label;
                    const IconComponent = opt.icon;
                    return (
                      <div
                        key={opt.id}
                        onClick={() => setBackground(opt.label)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'border-[#c19b48] bg-[#c19b48]/10 dark:bg-[#c19b48]/15 shadow-xs'
                            : 'border-slate-200 dark:border-[#143564] bg-slate-50 dark:bg-[#061120] hover:border-[#c19b48]/60'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                              isSelected
                                ? 'bg-[#c19b48] text-[#061120]'
                                : 'bg-slate-200 dark:bg-[#0a1c36] text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <IconComponent className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white">
                              {opt.label}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              {opt.desc}
                            </p>
                          </div>
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-[#c19b48] shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="py-2.5 sm:py-3 px-4 rounded-xl border border-slate-200 dark:border-[#143564] bg-slate-100 dark:bg-[#061120] text-slate-700 dark:text-slate-300 font-semibold text-xs sm:text-sm hover:bg-slate-200 dark:hover:bg-[#0c203b] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleCompleteAndEnterDashboard}
                  className="flex-1 py-2.5 sm:py-3 px-4 rounded-xl bg-[#c19b48] hover:bg-[#d8b862] text-[#061120] font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-[#061120] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Enter Classroom Dashboard</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <footer className="mt-6 mb-2 text-center text-[11px] text-slate-500 shrink-0">
        <p>© {new Date().getFullYear()} Rajinder Law Academy • Judicial Services Examination Portal</p>
      </footer>
    </div>
  );
};

export default OnboardingPage;

import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Gavel,
  Calendar,
  MapPin,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { AuthLayout } from '../../layouts/AuthLayout';
import { CustomSelect, type SelectOption } from '../../components/ui/CustomSelect';

const TARGET_EXAM_OPTIONS: SelectOption[] = [
  { value: 'Judicial Services (PCS-J)', label: 'PCS-J Foundation', description: 'Civil & Criminal Major Acts' },
  { value: 'Delhi Judicial Services (DJS)', label: 'Delhi Judicial (DJS)', description: 'Delhi PCS-J Prelims & Mains' },
  { value: 'UP PCS-J', label: 'UP PCS-J', description: 'Uttar Pradesh Judicial Services' },
  { value: 'Haryana Judicial Services (HJS)', label: 'Haryana (HCS-Judicial)', description: 'Haryana Civil Services Judicial' },
  { value: 'CLAT (UG / PG)', label: 'CLAT (UG / PG)', description: 'Target NLU Entrance Batch' },
  { value: 'Assistant Prosecution Officer (APO/APP)', label: 'APO / APP', description: 'Assistant Prosecution Officer' },
  { value: 'UGC-NET (Law)', label: 'UGC-NET (Law)', description: 'Assistant Professor & JRF' },
  { value: 'Other State Judiciary', label: 'Other Judiciary', description: 'Rajasthan, MP, Bihar & Other States' },
];

const TARGET_YEAR_OPTIONS: SelectOption[] = [
  { value: '2025', label: 'Target 2025' },
  { value: '2025-2026', label: 'Target 2025-26' },
  { value: '2026-2027', label: 'Target 2026-27' },
];

const TARGET_STATE_OPTIONS: SelectOption[] = [
  { value: 'Delhi / NCR', label: 'Delhi / NCR' },
  { value: 'Uttar Pradesh', label: 'Uttar Pradesh' },
  { value: 'Haryana', label: 'Haryana' },
  { value: 'Punjab', label: 'Punjab' },
  { value: 'Rajasthan', label: 'Rajasthan' },
  { value: 'Madhya Pradesh', label: 'Madhya Pradesh' },
  { value: 'Bihar', label: 'Bihar' },
  { value: 'Other / All India', label: 'Other / All India' },
];

// Zod Schema with custom validation for matching passwords
const signupSchema = z
  .object({
    fullName: z.string().min(2, 'Please enter your full legal name'),
    email: z.string().email('Please enter a valid email address'),
    phone: z
      .string()
      .regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian WhatsApp mobile number'),
    targetExam: z.string().min(1, 'Please select your target examination'),
    targetYear: z.string().min(1, 'Please select your target examination year'),
    targetState: z.string().min(1, 'Please select your target state / jurisdiction'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Must contain at least one special character'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    agreeTerms: z.boolean().refine((val) => val === true, {
      message: 'You must accept the Academy Terms & Code of Conduct',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type SignupFormData = z.infer<typeof signupSchema>;

export const Signup: React.FC = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      targetExam: '',
      targetYear: '',
      targetState: '',
      password: '',
      confirmPassword: '',
      agreeTerms: false,
    },
  });

  const passwordValue = watch('password', '');

  // Calculate Password Strength
  const passwordStrength = useMemo(() => {
    let score = 0;
    if (passwordValue.length >= 8) score += 25;
    if (/[A-Z]/.test(passwordValue)) score += 25;
    if (/[0-9]/.test(passwordValue)) score += 25;
    if (/[^A-Za-z0-9]/.test(passwordValue)) score += 25;
    return score;
  }, [passwordValue]);

  const strengthLabel = useMemo(() => {
    if (passwordStrength === 0) return { text: '', color: 'bg-slate-700' };
    if (passwordStrength <= 25) return { text: 'Weak', color: 'bg-red-500' };
    if (passwordStrength <= 50) return { text: 'Fair', color: 'bg-amber-500' };
    if (passwordStrength <= 75) return { text: 'Good', color: 'bg-blue-500' };
    return { text: 'Strong', color: 'bg-emerald-500' };
  }, [passwordStrength]);

  const onSubmit = async (data: SignupFormData) => {
    // Simulate student registration API
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Save session
    localStorage.setItem(
      'rla_student_session',
      JSON.stringify({
        name: data.fullName,
        email: data.email,
        phone: data.phone,
        targetExam: data.targetExam,
        targetState: data.targetState,
        rollNo: 'RLA' + Math.floor(100000 + Math.random() * 900000),
        isLoggedIn: true,
        loginTime: new Date().toISOString(),
      })
    );

    toast.success('Registration Successful!', {
      description: `Welcome to Rajinder Law Academy, ${data.fullName}! Your student profile has been created.`,
      duration: 5000,
    });

    navigate('/dashboard');
  };

  return (
    <AuthLayout
      title="Create Student Account"
      subtitle="Register for batch admissions, classroom lectures & all-India mock tests."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5 sm:space-y-4">
        {/* Row 1: Candidate Full Name (Full Width) */}
        <div>
          <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Candidate Full Name <span className="text-[#c19b48]">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
              <User className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <input
              type="text"
              {...register('fullName')}
              placeholder="e.g. Adv. Rohit Verma"
              className={`w-full pl-9 pr-3 py-2 sm:py-2.5 rounded-xl bg-slate-50 dark:bg-[#061120]/80 border text-xs sm:text-sm font-normal text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none transition-all ${
                errors.fullName
                  ? 'border-red-500 focus:border-red-500 bg-red-50 dark:bg-red-950/10'
                  : 'border-slate-200 dark:border-[#143564] focus:border-[#c19b48]'
              }`}
            />
          </div>
          {errors.fullName && (
            <p className="text-red-500 dark:text-red-400 text-[11px] mt-1 leading-tight">{errors.fullName.message}</p>
          )}
        </div>

        {/* Row 2: Email Address & WhatsApp Mobile (2 Columns) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
          <div>
            <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Email Address <span className="text-[#c19b48]">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                <Mail className="w-4 h-4" strokeWidth={1.75} />
              </div>
              <input
                type="email"
                {...register('email')}
                placeholder="student@example.com"
                className={`w-full pl-9 pr-3 py-2 sm:py-2.5 rounded-xl bg-slate-50 dark:bg-[#061120]/80 border text-xs sm:text-sm font-normal text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none transition-all ${
                  errors.email
                    ? 'border-red-500 focus:border-red-500 bg-red-50 dark:bg-red-950/10'
                    : 'border-slate-200 dark:border-[#143564] focus:border-[#c19b48]'
                }`}
              />
            </div>
            {errors.email && (
              <p className="text-red-500 dark:text-red-400 text-[11px] mt-1 leading-tight">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              WhatsApp Mobile <span className="text-[#c19b48]">*</span>
            </label>
            <div className="flex">
              <span className="inline-flex items-center px-2.5 rounded-l-xl border border-r-0 border-slate-200 dark:border-[#143564] bg-slate-100 dark:bg-[#061120] text-slate-600 dark:text-slate-400 text-xs sm:text-sm font-normal">
                <Phone className="w-4 h-4 mr-1 text-slate-400 dark:text-slate-500 shrink-0" strokeWidth={1.75} />
                +91
              </span>
              <input
                type="tel"
                maxLength={10}
                {...register('phone')}
                placeholder="9876543210"
                className={`w-full px-3 py-2 sm:py-2.5 rounded-r-xl bg-slate-50 dark:bg-[#061120]/80 border text-xs sm:text-sm font-normal text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none transition-all ${
                  errors.phone
                    ? 'border-red-500 focus:border-red-500 bg-red-50 dark:bg-red-950/10'
                    : 'border-slate-200 dark:border-[#143564] focus:border-[#c19b48]'
                }`}
              />
            </div>
            {errors.phone && (
              <p className="text-red-500 dark:text-red-400 text-[11px] mt-1 leading-tight">{errors.phone.message}</p>
            )}
          </div>
        </div>

        {/* Row 3: Target Law Examination (Full Width) */}
        <div>
          <Controller
            name="targetExam"
            control={control}
            render={({ field }) => (
              <CustomSelect
                label="Target Law Examination"
                required
                value={field.value}
                onChange={field.onChange}
                options={TARGET_EXAM_OPTIONS}
                placeholder="Select target examination"
                icon={<Gavel className="w-4 h-4" strokeWidth={1.75} />}
                error={errors.targetExam?.message}
                sheetTitle="Target Law Examination"
                sheetSubtitle="Choose your primary judicial or law entrance focus"
              />
            )}
          />
        </div>

        {/* Row 4: Target Year & Jurisdiction / State (2 Columns) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
          <div>
            <Controller
              name="targetYear"
              control={control}
              render={({ field }) => (
                <CustomSelect
                  label="Target Year"
                  required
                  value={field.value}
                  onChange={field.onChange}
                  options={TARGET_YEAR_OPTIONS}
                  placeholder="Select year"
                  icon={<Calendar className="w-4 h-4" strokeWidth={1.75} />}
                  error={errors.targetYear?.message}
                  sheetTitle="Target Examination Year"
                  sheetSubtitle="Select batch admission academic year"
                />
              )}
            />
          </div>

          <div>
            <Controller
              name="targetState"
              control={control}
              render={({ field }) => (
                <CustomSelect
                  label="State / Jurisdiction"
                  required
                  value={field.value}
                  onChange={field.onChange}
                  options={TARGET_STATE_OPTIONS}
                  placeholder="Select state"
                  icon={<MapPin className="w-4 h-4" strokeWidth={1.75} />}
                  error={errors.targetState?.message}
                  sheetTitle="State / Jurisdiction"
                  sheetSubtitle="Select state judicial syllabus focus"
                />
              )}
            />
          </div>
        </div>

        {/* Row 5: Create Password & Confirm Password (2 Columns) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
          <div>
            <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Create Password <span className="text-[#c19b48]">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                <Lock className="w-4 h-4" strokeWidth={1.75} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                placeholder="Min. 8 chars"
                className={`w-full pl-9 pr-9 py-2 sm:py-2.5 rounded-xl bg-slate-50 dark:bg-[#061120]/80 border text-xs sm:text-sm font-normal text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none transition-all ${
                  errors.password
                    ? 'border-red-500 focus:border-red-500 bg-red-50 dark:bg-red-950/10'
                    : 'border-slate-200 dark:border-[#143564] focus:border-[#c19b48]'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" strokeWidth={1.75} /> : <Eye className="w-4 h-4" strokeWidth={1.75} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 dark:text-red-400 text-[11px] mt-1 leading-tight">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Confirm Password <span className="text-[#c19b48]">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                <Lock className="w-4 h-4" strokeWidth={1.75} />
              </div>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                {...register('confirmPassword')}
                placeholder="Re-enter password"
                className={`w-full pl-9 pr-9 py-2 sm:py-2.5 rounded-xl bg-slate-50 dark:bg-[#061120]/80 border text-xs sm:text-sm font-normal text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none transition-all ${
                  errors.confirmPassword
                    ? 'border-red-500 focus:border-red-500 bg-red-50 dark:bg-red-950/10'
                    : 'border-slate-200 dark:border-[#143564] focus:border-[#c19b48]'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" strokeWidth={1.75} /> : <Eye className="w-4 h-4" strokeWidth={1.75} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-red-500 dark:text-red-400 text-[11px] mt-1 leading-tight">{errors.confirmPassword.message}</p>
            )}
          </div>
        </div>

        {/* Compact Password Strength Bar (only if password entered) */}
        {passwordValue && (
          <div className="space-y-1 pt-0.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500 dark:text-slate-400">Strength:</span>
              <span
                className={`font-semibold ${
                  passwordStrength <= 25
                    ? 'text-red-500 dark:text-red-400'
                    : passwordStrength <= 50
                    ? 'text-amber-500 dark:text-amber-400'
                    : passwordStrength <= 75
                    ? 'text-blue-500 dark:text-blue-400'
                    : 'text-emerald-500 dark:text-emerald-400'
                }`}
              >
                {strengthLabel.text}
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-[#061120] rounded-full h-1 overflow-hidden border border-slate-300 dark:border-[#143564]">
              <div
                className={`h-full transition-all duration-300 ${strengthLabel.color}`}
                style={{ width: `${passwordStrength}%` }}
              />
            </div>
          </div>
        )}

        {/* Terms Checkbox */}
        <div className="pt-1">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              {...register('agreeTerms')}
              className="w-4 h-4 rounded bg-white dark:bg-[#061120] border-slate-300 dark:border-[#143564] text-[#c19b48] focus:ring-0 cursor-pointer"
            />
            <span className="leading-snug">
              I accept the Academy{' '}
              <a href="#terms" className="text-[#c19b48] hover:underline font-semibold">
                Terms of Admission
              </a>{' '}
              & code of conduct.
            </span>
          </label>
          {errors.agreeTerms && (
            <p className="text-red-500 dark:text-red-400 text-[11px] mt-1 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />
              <span>{errors.agreeTerms.message}</span>
            </p>
          )}
        </div>

        {/* Submit CTA */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full mt-1.5 py-2.5 sm:py-3 px-4 rounded-xl bg-[#c19b48] hover:bg-[#d8b862] text-[#061120] font-semibold text-xs sm:text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer font-sans"
        >
          {isSubmitting ? (
            <div className="w-4 h-4 border-2 border-[#061120] border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <span>Complete Student Registration</span>
              <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
            </>
          )}
        </button>
      </form>

      {/* Switch to Login */}
      <div className="mt-4 pt-3.5 border-t border-slate-200 dark:border-[#143564]/60 text-center text-xs text-slate-600 dark:text-slate-400">
        <p>
          Already enrolled?{' '}
          <Link
            to="/login"
            className="text-[#c19b48] hover:text-[#d8b862] font-semibold hover:underline inline-flex items-center gap-1"
          >
            <span>Sign In to Classroom</span>
            <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};

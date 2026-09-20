import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { FcGoogle } from 'react-icons/fc';
import { AuthLayout } from '../../layouts/AuthLayout';
import { apiClient } from '../../lib/apiClient';
import { loginWithGoogle } from '../../lib/auth.utils';

// Schema for Email Registration
const emailSignupSchema = z
  .object({
    email: z.string().email('Please enter a valid email address'),
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

type EmailSignupFormData = z.infer<typeof emailSignupSchema>;

// Schema for Mobile Registration (OTP verified on next step)
const mobileSignupSchema = z.object({
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian WhatsApp mobile number'),
  agreeTerms: z.boolean().refine((val) => val === true, {
    message: 'You must accept the Academy Terms & Code of Conduct',
  }),
});

type MobileSignupFormData = z.infer<typeof mobileSignupSchema>;

export const Signup: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'email' | 'mobile'>('email');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form 1: Email Registration
  const {
    register: registerEmail,
    handleSubmit: handleEmailSubmit,
    watch: watchEmail,
    formState: { errors: emailErrors, isSubmitting: isEmailSubmitting },
  } = useForm<EmailSignupFormData>({
    resolver: zodResolver(emailSignupSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      agreeTerms: false,
    },
  });

  // Form 2: Mobile Registration
  const {
    register: registerMobile,
    handleSubmit: handleMobileSubmit,
    formState: { errors: mobileErrors, isSubmitting: isMobileSubmitting },
  } = useForm<MobileSignupFormData>({
    resolver: zodResolver(mobileSignupSchema),
    defaultValues: {
      phone: '',
      agreeTerms: false,
    },
  });

  const emailPasswordValue = watchEmail('password', '');

  // Calculate Password Strength for Email tab
  const passwordStrength = useMemo(() => {
    let score = 0;
    if (emailPasswordValue.length >= 8) score += 25;
    if (/[A-Z]/.test(emailPasswordValue)) score += 25;
    if (/[0-9]/.test(emailPasswordValue)) score += 25;
    if (/[^A-Za-z0-9]/.test(emailPasswordValue)) score += 25;
    return score;
  }, [emailPasswordValue]);

  const strengthLabel = useMemo(() => {
    if (passwordStrength === 0) return { text: '', color: 'bg-slate-700' };
    if (passwordStrength <= 25) return { text: 'Weak', color: 'bg-red-500' };
    if (passwordStrength <= 50) return { text: 'Fair', color: 'bg-amber-500' };
    if (passwordStrength <= 75) return { text: 'Good', color: 'bg-blue-500' };
    return { text: 'Strong', color: 'bg-emerald-500' };
  }, [passwordStrength]);

  const onEmailSubmit = async (data: EmailSignupFormData) => {
    try {
      const response = await apiClient.post('/auth/register-email', {
        email: data.email,
        password: data.password,
      });

      sessionStorage.setItem('rla_pending_email', data.email);

      toast.info('Verification Code Sent!', {
        description: response.data?.message || `A 6-digit verification code has been sent to ${data.email}`,
        duration: 5000,
      });

      navigate('/email-verification', { state: { email: data.email } });
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Failed to dispatch verification code. Please try again.';
      toast.error('Registration Error', { description: msg });
    }
  };

  const onMobileSubmit = async (data: MobileSignupFormData) => {
    await new Promise((resolve) => setTimeout(resolve, 400));

    sessionStorage.setItem('rla_pending_mobile', data.phone);

    toast.info('OTP Sent!', {
      description: `A 6-digit verification code has been sent to +91 ${data.phone}`,
      duration: 4000,
    });

    navigate('/mobile-verification', { state: { phone: data.phone } });
  };

  const handleGoogleAuth = () => {
    loginWithGoogle();
  };

  const isSubmitting = activeTab === 'email' ? isEmailSubmitting : isMobileSubmitting;

  return (
    <AuthLayout
      title="Create Student Account"
      subtitle="Register for batch admissions, classroom lectures & all-India mock tests."
    >
      {/* Registration Mode Tabs */}
      <div className="flex rounded-xl bg-slate-100 dark:bg-[#061120] p-1 border border-slate-200 dark:border-[#143564] mb-3.5 sm:mb-4">
        <button
          type="button"
          onClick={() => setActiveTab('email')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'email'
              ? 'bg-[#c19b48] text-[#061120] font-bold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          <span>Register with Email</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('mobile')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'mobile'
              ? 'bg-[#c19b48] text-[#061120] font-bold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Phone className="w-3.5 h-3.5" />
          <span>Register with Mobile No.</span>
        </button>
      </div>

      {activeTab === 'email' ? (
        <form onSubmit={handleEmailSubmit(onEmailSubmit)} className="space-y-3.5 sm:space-y-4">
          {/* Email Address */}
          <div>
            <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Email Address <span className="text-red-500 font-bold">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                <Mail className="w-4 h-4" strokeWidth={1.75} />
              </div>
              <input
                type="email"
                {...registerEmail('email')}
                placeholder="student@example.com"
                className={`w-full pl-9 pr-3 py-2 sm:py-2.5 rounded-xl bg-slate-50 dark:bg-[#061120]/80 border text-xs sm:text-sm font-normal text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none transition-all ${
                  emailErrors.email
                    ? 'border-red-500 focus:border-red-500 bg-red-50 dark:bg-red-950/10'
                    : 'border-slate-200 dark:border-[#143564] focus:border-[#c19b48]'
                }`}
              />
            </div>
            {emailErrors.email && (
              <p className="text-red-500 dark:text-red-400 text-[11px] mt-1 leading-tight">{emailErrors.email.message}</p>
            )}
          </div>

          {/* Create Password (Full Width) */}
          <div>
            <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Create Password <span className="text-red-500 font-bold">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                <Lock className="w-4 h-4" strokeWidth={1.75} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                {...registerEmail('password')}
                placeholder="Min. 8 chars"
                className={`w-full pl-9 pr-9 py-2 sm:py-2.5 rounded-xl bg-slate-50 dark:bg-[#061120]/80 border text-xs sm:text-sm font-normal text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none transition-all ${
                  emailErrors.password
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
            {emailErrors.password && (
              <p className="text-red-500 dark:text-red-400 text-[11px] mt-1 leading-tight">{emailErrors.password.message}</p>
            )}
          </div>

          {/* Confirm Password (Full Width) */}
          <div>
            <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Confirm Password <span className="text-red-500 font-bold">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                <Lock className="w-4 h-4" strokeWidth={1.75} />
              </div>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                {...registerEmail('confirmPassword')}
                placeholder="Re-enter password"
                className={`w-full pl-9 pr-9 py-2 sm:py-2.5 rounded-xl bg-slate-50 dark:bg-[#061120]/80 border text-xs sm:text-sm font-normal text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none transition-all ${
                  emailErrors.confirmPassword
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
            {emailErrors.confirmPassword && (
              <p className="text-red-500 dark:text-red-400 text-[11px] mt-1 leading-tight">{emailErrors.confirmPassword.message}</p>
            )}
          </div>

          {/* Compact Password Strength Bar */}
          {emailPasswordValue && (
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
                {...registerEmail('agreeTerms')}
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
            {emailErrors.agreeTerms && (
              <p className="text-red-500 dark:text-red-400 text-[11px] mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />
                <span>{emailErrors.agreeTerms.message}</span>
              </p>
            )}
          </div>

          {/* Submit CTA */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-1.5 py-2.5 sm:py-3 px-4 rounded-xl bg-[#c19b48] hover:bg-[#d8b862] text-[#061120] font-semibold text-xs sm:text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer font-sans shadow-sm"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-[#061120] border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Continue to Email Verification</span>
                <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
              </>
            )}
          </button>
        </form>
      ) : (
        <form onSubmit={handleMobileSubmit(onMobileSubmit)} className="space-y-3.5 sm:space-y-4">
          {/* WhatsApp Mobile */}
          <div>
            <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              WhatsApp Mobile Number <span className="text-red-500 font-bold">*</span>
            </label>
            <div className="flex">
              <span className="inline-flex items-center px-2.5 rounded-l-xl border border-r-0 border-slate-200 dark:border-[#143564] bg-slate-100 dark:bg-[#061120] text-slate-600 dark:text-slate-400 text-xs sm:text-sm font-normal">
                <Phone className="w-4 h-4 mr-1 text-slate-400 dark:text-slate-500 shrink-0" strokeWidth={1.75} />
                +91
              </span>
              <input
                type="tel"
                maxLength={10}
                {...registerMobile('phone')}
                placeholder="9876543210"
                className={`w-full px-3 py-2 sm:py-2.5 rounded-r-xl bg-slate-50 dark:bg-[#061120]/80 border text-xs sm:text-sm font-normal text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none transition-all ${
                  mobileErrors.phone
                    ? 'border-red-500 focus:border-red-500 bg-red-50 dark:bg-red-950/10'
                    : 'border-slate-200 dark:border-[#143564] focus:border-[#c19b48]'
                }`}
              />
            </div>
            {mobileErrors.phone && (
              <p className="text-red-500 dark:text-red-400 text-[11px] mt-1 leading-tight">{mobileErrors.phone.message}</p>
            )}
          </div>

          {/* Terms Checkbox */}
          <div className="pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                {...registerMobile('agreeTerms')}
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
            {mobileErrors.agreeTerms && (
              <p className="text-red-500 dark:text-red-400 text-[11px] mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />
                <span>{mobileErrors.agreeTerms.message}</span>
              </p>
            )}
          </div>

          {/* Submit CTA */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-1.5 py-2.5 sm:py-3 px-4 rounded-xl bg-[#c19b48] hover:bg-[#d8b862] text-[#061120] font-semibold text-xs sm:text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer font-sans shadow-sm"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-[#061120] border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Continue to Mobile Verification</span>
                <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
              </>
            )}
          </button>
        </form>
      )}

      {/* Google Authentication - Only available on Email registration */}
      {activeTab === 'email' && (
        <>
          {/* Divider */}
          <div className="relative my-3 sm:my-3.5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-[#143564]" />
            </div>
            <div className="relative flex justify-center text-[11px]">
              <span className="bg-white dark:bg-[#0a1c36] px-2.5 text-slate-400 dark:text-slate-500 font-medium">
                or continue with
              </span>
            </div>
          </div>

          {/* Continue with Google Button */}
          <button
            type="button"
            onClick={handleGoogleAuth}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:border-slate-300 dark:border-[#143564] dark:hover:border-[#1e457e] bg-white dark:bg-[#061120] hover:bg-slate-50/80 dark:hover:bg-[#0c203b] text-slate-700 dark:text-slate-200 font-semibold text-xs sm:text-sm transition-all shadow-xs flex items-center justify-center gap-2.5 cursor-pointer active:scale-[0.99]"
          >
            <FcGoogle className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
            <span>Continue with Google</span>
          </button>
        </>
      )}

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

export default Signup;

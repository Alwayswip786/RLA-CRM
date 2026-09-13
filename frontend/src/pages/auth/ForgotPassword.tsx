import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { AuthLayout } from '../../layouts/AuthLayout';

// Step 1: Request OTP
const requestOtpSchema = z.object({
  identifier: z.string().min(4, 'Please enter your registered Email or 10-digit WhatsApp number'),
});

type RequestOtpFormData = z.infer<typeof requestOtpSchema>;

// Step 2: Reset Password
const resetPasswordSchema = z
  .object({
    otp: z.string().length(6, 'Please enter the 6-digit OTP'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [targetIdentifier, setTargetIdentifier] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);

  // Form 1
  const {
    register: registerRequest,
    handleSubmit: handleRequestSubmit,
    formState: { errors: requestErrors, isSubmitting: isRequestSubmitting },
  } = useForm<RequestOtpFormData>({
    resolver: zodResolver(requestOtpSchema),
  });

  // Form 2
  const {
    register: registerReset,
    handleSubmit: handleResetSubmit,
    formState: { errors: resetErrors, isSubmitting: isResetSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onRequestOtp = async (data: RequestOtpFormData) => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    setTargetIdentifier(data.identifier);
    setCurrentStep(2);

    toast.info('Verification Code Dispatched', {
      description: `6-digit reset OTP sent to ${data.identifier}. (Use test code: 123456)`,
    });

    let count = 30;
    const interval = setInterval(() => {
      count -= 1;
      setResendTimer(count);
      if (count <= 0) clearInterval(interval);
    }, 1000);
  };

  const onResetPassword = async (_data: ResetPasswordFormData) => {
    await new Promise((resolve) => setTimeout(resolve, 900));

    toast.success('Password Reset Successful!', {
      description: 'Your student account password has been updated. You can now sign in.',
    });

    navigate('/login');
  };

  return (
    <AuthLayout
      title={currentStep === 1 ? 'Reset Your Password' : 'Set New Password'}
      subtitle={
        currentStep === 1
          ? 'Enter your registered email or WhatsApp mobile number to receive a secure recovery code.'
          : `Enter the 6-digit OTP sent to ${targetIdentifier} and choose a strong password.`
      }
    >
      {currentStep === 1 ? (
        <form onSubmit={handleRequestSubmit(onRequestOtp)} className="space-y-3.5 sm:space-y-4">
          <div>
            <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Registered Email or Mobile Number <span className="text-[#c19b48]">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                <Mail className="w-4 h-4" strokeWidth={1.75} />
              </div>
              <input
                type="text"
                {...registerRequest('identifier')}
                placeholder="student@example.com or 9876543210"
                className={`w-full pl-9 pr-3 py-2 sm:py-2.5 rounded-xl bg-slate-50 dark:bg-[#061120]/80 border text-xs sm:text-sm font-normal text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none transition-all ${
                  requestErrors.identifier
                    ? 'border-red-500 focus:border-red-500 bg-red-50 dark:bg-red-950/10'
                    : 'border-slate-200 dark:border-[#143564] focus:border-[#c19b48]'
                }`}
              />
            </div>
            {requestErrors.identifier && (
              <p className="text-red-500 dark:text-red-400 text-[11px] mt-1 leading-tight">{requestErrors.identifier.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isRequestSubmitting}
            className="w-full mt-1.5 py-2.5 sm:py-3 px-4 rounded-xl bg-[#c19b48] hover:bg-[#d8b862] text-[#061120] font-semibold text-xs sm:text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer font-sans"
          >
            {isRequestSubmitting ? (
              <div className="w-4 h-4 border-2 border-[#061120] border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Send 6-Digit OTP</span>
                <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
              </>
            )}
          </button>
        </form>
      ) : (
        <form onSubmit={handleResetSubmit(onResetPassword)} className="space-y-3.5 sm:space-y-4">
          {/* OTP Code */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300">
                6-Digit Security Code <span className="text-[#c19b48]">*</span>
              </label>
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="text-[11px] text-[#c19b48] hover:underline font-medium cursor-pointer"
              >
                Change Contact
              </button>
            </div>
            <input
              type="text"
              maxLength={6}
              {...registerReset('otp')}
              placeholder="e.g. 123456"
              className={`w-full px-3 py-2 sm:py-2.5 rounded-xl bg-slate-50 dark:bg-[#061120]/80 border text-center tracking-[0.4em] text-base font-mono text-slate-900 dark:text-white focus:outline-none transition-all ${
                resetErrors.otp
                  ? 'border-red-500 focus:border-red-500 bg-red-50 dark:bg-red-950/10'
                  : 'border-slate-200 dark:border-[#143564] focus:border-[#c19b48]'
              }`}
            />
            {resetErrors.otp && (
              <p className="text-red-500 dark:text-red-400 text-[11px] mt-1 text-center leading-tight">{resetErrors.otp.message}</p>
            )}
          </div>

          {/* 2-Column Grid for Passwords */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
            <div>
              <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                New Password <span className="text-[#c19b48]">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <Lock className="w-4 h-4" strokeWidth={1.75} />
                </div>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  {...registerReset('newPassword')}
                  placeholder="Min. 8 chars"
                  className={`w-full pl-9 pr-9 py-2 sm:py-2.5 rounded-xl bg-slate-50 dark:bg-[#061120]/80 border text-xs sm:text-sm font-normal text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none transition-all ${
                    resetErrors.newPassword
                      ? 'border-red-500 focus:border-red-500 bg-red-50 dark:bg-red-950/10'
                      : 'border-slate-200 dark:border-[#143564] focus:border-[#c19b48]'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" strokeWidth={1.75} /> : <Eye className="w-4 h-4" strokeWidth={1.75} />}
                </button>
              </div>
              {resetErrors.newPassword && (
                <p className="text-red-500 dark:text-red-400 text-[11px] mt-1 leading-tight">{resetErrors.newPassword.message}</p>
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
                  {...registerReset('confirmPassword')}
                  placeholder="Re-enter password"
                  className={`w-full pl-9 pr-9 py-2 sm:py-2.5 rounded-xl bg-slate-50 dark:bg-[#061120]/80 border text-xs sm:text-sm font-normal text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none transition-all ${
                    resetErrors.confirmPassword
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
              {resetErrors.confirmPassword && (
                <p className="text-red-500 dark:text-red-400 text-[11px] mt-1 leading-tight">{resetErrors.confirmPassword.message}</p>
              )}
            </div>
          </div>

          {/* Resend Helper */}
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-0.5">
            <span>Didn't receive code?</span>
            <button
              type="button"
              disabled={resendTimer > 0}
              onClick={() => onRequestOtp({ identifier: targetIdentifier })}
              className="text-[#c19b48] hover:underline disabled:opacity-50 disabled:no-underline cursor-pointer font-semibold"
            >
              {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
            </button>
          </div>

          {/* Submit Reset */}
          <button
            type="submit"
            disabled={isResetSubmitting}
            className="w-full mt-1.5 py-2.5 sm:py-3 px-4 rounded-xl bg-[#c19b48] hover:bg-[#d8b862] text-[#061120] font-semibold text-xs sm:text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer font-sans"
          >
            {isResetSubmitting ? (
              <div className="w-4 h-4 border-2 border-[#061120] border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" strokeWidth={1.75} />
                <span>Update Password & Continue</span>
              </>
            )}
          </button>
        </form>
      )}

      {/* Back to Login Link */}
      <div className="mt-3.5 sm:mt-4 pt-3 sm:pt-3.5 border-t border-slate-200 dark:border-[#143564]/60 text-center">
        <Link
          to="/login"
          className="text-xs text-slate-500 dark:text-slate-400 hover:text-[#c19b48] inline-flex items-center gap-1.5 transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
          <span>Back to Classroom Sign In</span>
        </Link>
      </div>
    </AuthLayout>
  );
};

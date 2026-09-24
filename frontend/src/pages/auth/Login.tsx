import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Lock, Phone, ArrowRight, User, ShieldCheck } from 'lucide-react';
import { toast } from '../../lib/toast';
import { FcGoogle } from 'react-icons/fc';
import { AuthLayout } from '../../layouts/AuthLayout';
import { useAuthStore } from '../../store/useAuthStore';
import { apiClient } from '../../lib/apiClient';
import { loginWithGoogle } from '../../lib/auth.utils';
import { SegmentedTabs } from '../../components/ui/tabs';

// Schema for Password Login
const passwordLoginSchema = z.object({
  identifier: z.string().min(3, 'Please enter your Roll No., Email or Mobile number'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
});

type PasswordLoginFormData = z.infer<typeof passwordLoginSchema>;

// Schema for OTP Login
const otpLoginSchema = z.object({
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian WhatsApp mobile number'),
  otp: z.string().length(6, 'Please enter the 6-digit OTP').optional(),
});

type OtpLoginFormData = z.infer<typeof otpLoginSchema>;

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((state) => state.login);
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  const [activeTab, setActiveTab] = useState<'password' | 'otp'>('password');
  const [showPassword, setShowPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);

  // Form 1: Password Login
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors, isSubmitting: isPasswordSubmitting },
  } = useForm<PasswordLoginFormData>({
    resolver: zodResolver(passwordLoginSchema),
    defaultValues: {
      identifier: '',
      password: '',
      rememberMe: true,
    },
  });

  // Form 2: OTP Login
  const {
    register: registerOtp,
    handleSubmit: handleOtpSubmit,
    watch: watchOtp,
    formState: { errors: otpErrors, isSubmitting: isOtpSubmitting },
  } = useForm<OtpLoginFormData>({
    resolver: zodResolver(otpLoginSchema),
    defaultValues: {
      phone: '',
      otp: '',
    },
  });

  const onPasswordLogin = async (data: PasswordLoginFormData) => {
    try {
      const response = await apiClient.post('/auth/login', {
        identifier: data.identifier,
        password: data.password,
      });

      const { user, accessToken, redirectTo } = response.data;

      login(
        {
          _id: user._id,
          name: user.name,
          salutation: user.salutation,
          rollNo: user.rollNo,
          email: user.email,
          phone: user.phone,
          targetExam: user.targetExam,
          targetState: user.targetState,
          targetYear: user.targetYear,
          academicStatus: user.academicStatus,
          themePreference: user.themePreference || 'light',
          isLoggedIn: true,
          needsOnboarding: user.needsOnboarding ?? false,
        },
        accessToken
      );

      toast.success('Welcome back, Counsel!', {
        description: `Successfully signed in as ${user.name} (${user.rollNo}).`,
      });

      const targetRoute = user.needsOnboarding ? '/onboarding' : (redirectTo || from || '/dashboard');
      navigate(targetRoute, { replace: true });
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Login failed. Please check your credentials and try again.';
      toast.error('Authentication Failed', { description: msg });
    }
  };

  const handleSendOtp = async () => {
    const phone = watchOtp('phone');
    if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
      toast.error('Invalid Mobile Number', {
        description: 'Please enter a valid 10-digit Indian mobile number to receive OTP.',
      });
      return;
    }

    setOtpSent(true);
    toast.info('OTP Sent to WhatsApp / SMS', {
      description: `6-digit security code dispatched to +91 ${phone}. (Use test code: 123456)`,
    });

    // Simple countdown timer
    let count = 30;
    const interval = setInterval(() => {
      count -= 1;
      setResendTimer(count);
      if (count <= 0) {
        clearInterval(interval);
      }
    }, 1000);
  };

  const onOtpLogin = async (data: OtpLoginFormData) => {
    if (!data.otp || data.otp.length !== 6) {
      toast.error('Please enter the 6-digit OTP received on your mobile.');
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 800));

    login({
      phone: data.phone,
      name: 'Candidate ' + data.phone.slice(-4),
      rollNo: 'RLA-M' + data.phone.slice(-4),
      targetExam: 'Judicial Services (PCS-J)',
      isLoggedIn: true,
      loginTime: new Date().toISOString(),
    });

    toast.success('Mobile Verified Successfully!', {
      description: 'Logged in to your Law Classroom Portal.',
    });

    navigate(from, { replace: true });
  };

  const handleGoogleAuth = () => {
    loginWithGoogle();
  };

  return (
    <AuthLayout
      title="Student Classroom Sign In"
      subtitle="Enter your credentials to access your judicial batches, notes & test series."
    >
      {/* Login Mode Tabs */}
      <SegmentedTabs<'password' | 'otp'>
        value={activeTab}
        onChange={setActiveTab}
        className="mb-3 sm:mb-3.5"
        items={[
          {
            id: 'password',
            label: 'Roll No. / Password',
            shortLabel: 'Password',
            icon: <Lock className="w-3.5 h-3.5" />,
          },
          {
            id: 'otp',
            label: 'Login with OTP',
            shortLabel: 'OTP Login',
            icon: <Phone className="w-3.5 h-3.5" />,
          },
        ]}
      />

      {/* Tab 1: Password Login Form */}
      {activeTab === 'password' && (
        <form onSubmit={handlePasswordSubmit(onPasswordLogin)} className="space-y-3.5 sm:space-y-4">
          {/* Identifier Input */}
          <div>
            <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Roll Number / Email / WhatsApp Mobile <span className="text-red-500 font-bold">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                <User className="w-4 h-4" strokeWidth={1.75} />
              </div>
              <input
                type="text"
                {...registerPassword('identifier')}
                placeholder="e.g. RLA2025019 or student@gmail.com"
                className={`w-full pl-9 pr-3 py-2 sm:py-2.5 rounded-xl bg-slate-50 dark:bg-[#061120]/80 border text-xs sm:text-sm font-normal text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none transition-all ${
                  passwordErrors.identifier
                    ? 'border-red-500 focus:border-red-500 bg-red-50 dark:bg-red-950/10'
                    : 'border-slate-200 dark:border-[#143564] focus:border-[#c19b48]'
                }`}
              />
            </div>
            {passwordErrors.identifier && (
              <p className="text-red-500 dark:text-red-400 text-[11px] mt-1 leading-tight">{passwordErrors.identifier.message}</p>
            )}
          </div>

          {/* Password Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300">
                Password <span className="text-red-500 font-bold">*</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-[11px] text-[#c19b48] hover:text-[#d8b862] hover:underline transition-colors font-medium"
              >
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                <Lock className="w-4 h-4" strokeWidth={1.75} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                {...registerPassword('password')}
                placeholder="••••••••••••"
                className={`w-full pl-9 pr-9 py-2 sm:py-2.5 rounded-xl bg-slate-50 dark:bg-[#061120]/80 border text-xs sm:text-sm font-normal text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none transition-all ${
                  passwordErrors.password
                    ? 'border-red-500 focus:border-red-500 bg-red-50 dark:bg-red-950/10'
                    : 'border-slate-200 dark:border-[#143564] focus:border-[#c19b48]'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" strokeWidth={1.75} /> : <Eye className="w-4 h-4" strokeWidth={1.75} />}
              </button>
            </div>
            {passwordErrors.password && (
              <p className="text-red-500 dark:text-red-400 text-[11px] mt-1 leading-tight">{passwordErrors.password.message}</p>
            )}
          </div>

          {/* Remember Me */}
          <div className="flex items-center pt-0.5">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                {...registerPassword('rememberMe')}
                className="w-4 h-4 rounded bg-white dark:bg-[#061120] border-slate-300 dark:border-[#143564] text-[#c19b48] focus:ring-0 cursor-pointer"
              />
              <span>Remember this device</span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isPasswordSubmitting}
            className="w-full mt-1.5 py-2.5 sm:py-3 px-4 rounded-xl bg-[#c19b48] hover:bg-[#d8b862] text-[#061120] font-semibold text-xs sm:text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer font-sans"
          >
            {isPasswordSubmitting ? (
              <div className="w-4 h-4 border-2 border-[#061120] border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Enter Classroom Portal</span>
                <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
              </>
            )}
          </button>
        </form>
      )}

      {/* Tab 2: OTP Login Form */}
      {activeTab === 'otp' && (
        <form onSubmit={handleOtpSubmit(onOtpLogin)} className="space-y-3.5 sm:space-y-4">
          <div>
            <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Registered WhatsApp Mobile Number <span className="text-red-500 font-bold">*</span>
            </label>
            <div className="flex">
              <span className="inline-flex items-center px-2.5 rounded-l-xl border border-r-0 border-slate-200 dark:border-[#143564] bg-slate-100 dark:bg-[#061120] text-slate-600 dark:text-slate-400 text-xs sm:text-sm font-normal">
                <Phone className="w-4 h-4 mr-1 text-slate-400 dark:text-slate-500 shrink-0" strokeWidth={1.75} />
                +91
              </span>
              <input
                type="tel"
                maxLength={10}
                {...registerOtp('phone')}
                placeholder="9876543210"
                className={`w-full px-3 py-2 sm:py-2.5 rounded-r-xl bg-slate-50 dark:bg-[#061120]/80 border text-xs sm:text-sm font-normal text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none transition-all ${
                  otpErrors.phone
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-slate-200 dark:border-[#143564] focus:border-[#c19b48]'
                }`}
              />
            </div>
            {otpErrors.phone && (
              <p className="text-red-500 dark:text-red-400 text-[11px] mt-1 leading-tight">{otpErrors.phone.message}</p>
            )}
          </div>

          {!otpSent ? (
            <button
              type="button"
              onClick={handleSendOtp}
              className="w-full mt-1.5 py-2.5 sm:py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-900 dark:bg-[#143564] dark:hover:bg-[#1c4988] text-white font-semibold text-xs sm:text-sm transition-all border border-slate-700 dark:border-[#2560b0]/40 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Phone className="w-4 h-4 text-[#c19b48]" strokeWidth={1.75} />
              <span>Send 6-Digit OTP</span>
            </button>
          ) : (
            <div className="space-y-3 sm:space-y-3.5 pt-0.5">
              <div>
                <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Enter 6-Digit Security Code <span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  maxLength={6}
                  {...registerOtp('otp')}
                  placeholder="e.g. 123456"
                  className="w-full px-3 py-2 sm:py-2.5 rounded-xl bg-slate-50 dark:bg-[#061120]/80 border border-slate-200 dark:border-[#143564] text-center tracking-[0.4em] text-base font-mono text-slate-900 dark:text-white focus:outline-none focus:border-[#c19b48]"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Code sent via SMS & WhatsApp</span>
                <button
                  type="button"
                  disabled={resendTimer > 0}
                  onClick={handleSendOtp}
                  className="text-[#c19b48] hover:underline disabled:opacity-50 disabled:no-underline cursor-pointer font-semibold"
                >
                  {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
                </button>
              </div>

              <button
                type="submit"
                disabled={isOtpSubmitting}
                className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-[#c19b48] hover:bg-[#d8b862] text-[#061120] font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer font-sans"
              >
                {isOtpSubmitting ? (
                  <div className="w-4 h-4 border-2 border-[#061120] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" strokeWidth={1.75} />
                    <span>Verify & Sign In</span>
                  </>
                )}
              </button>
            </div>
          )}
        </form>
      )}

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

      {/* Switch to Signup */}
      <div className="mt-3.5 sm:mt-4 pt-3 sm:pt-3.5 border-t border-slate-200 dark:border-[#143564]/60 text-center text-xs text-slate-600 dark:text-slate-400">
        <p>
          New candidate?{' '}
          <Link
            to="/signup"
            className="text-[#c19b48] hover:text-[#d8b862] font-semibold hover:underline inline-flex items-center gap-1"
          >
            <span>Register for Student Access</span>
            <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Lock, User, Phone, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { AuthLayout } from '../../layouts/AuthLayout';

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
  const [activeTab, setActiveTab] = useState<'password' | 'otp'>('password');
  const [showPassword, setShowPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);

  // Form 1: Password Login
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    setValue: setPasswordValue,
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
    // Simulated API authentication call
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Save mock student auth in localStorage
    localStorage.setItem(
      'rla_student_session',
      JSON.stringify({
        identifier: data.identifier,
        name: 'Adv. Rohit Verma',
        rollNo: 'RLA2025019',
        targetExam: 'Judicial Services (PCS-J)',
        isLoggedIn: true,
        loginTime: new Date().toISOString(),
      })
    );

    toast.success('Welcome back, Counsel!', {
      description: 'Successfully signed in to Rajinder Law Academy Classroom Portal.',
    });

    navigate('/dashboard');
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

    localStorage.setItem(
      'rla_student_session',
      JSON.stringify({
        phone: data.phone,
        name: 'Candidate ' + data.phone.slice(-4),
        rollNo: 'RLA-M' + data.phone.slice(-4),
        targetExam: 'Judicial Services (PCS-J)',
        isLoggedIn: true,
        loginTime: new Date().toISOString(),
      })
    );

    toast.success('Mobile Verified Successfully!', {
      description: 'Logged in to your Law Classroom Portal.',
    });

    navigate('/dashboard');
  };

  const fillDemoCredentials = () => {
    setPasswordValue('identifier', 'RLA2025019');
    setPasswordValue('password', 'Judiciary@2025');
    toast.success('Demo Student Credentials Populated');
  };

  return (
    <AuthLayout
      title="Student Classroom Sign In"
      subtitle="Enter your credentials to access your judicial batches, notes & test series."
    >
      {/* Login Mode Tabs */}
      <div className="flex rounded-xl bg-slate-100 dark:bg-[#061120] p-1 border border-slate-200 dark:border-[#143564] mb-3 sm:mb-3.5">
        <button
          type="button"
          onClick={() => setActiveTab('password')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'password'
              ? 'bg-[#c19b48] text-[#061120] font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Roll No. / Password</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('otp')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'otp'
              ? 'bg-[#c19b48] text-[#061120] font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Phone className="w-3.5 h-3.5" />
          <span>Login with OTP</span>
        </button>
      </div>

      {/* Tab 1: Password Login Form */}
      {activeTab === 'password' && (
        <form onSubmit={handlePasswordSubmit(onPasswordLogin)} className="space-y-3.5 sm:space-y-4">
          {/* Identifier Input */}
          <div>
            <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Roll Number / Email / WhatsApp Mobile <span className="text-[#c19b48]">*</span>
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
                Password <span className="text-[#c19b48]">*</span>
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
          <div className="flex items-center justify-between pt-0.5">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                {...registerPassword('rememberMe')}
                className="w-4 h-4 rounded bg-white dark:bg-[#061120] border-slate-300 dark:border-[#143564] text-[#c19b48] focus:ring-0 cursor-pointer"
              />
              <span>Remember this device</span>
            </label>

            <button
              type="button"
              onClick={fillDemoCredentials}
              className="text-xs text-[#a47d31] dark:text-[#e8cf8d] hover:text-[#835f21] dark:hover:text-white flex items-center gap-1 transition-colors cursor-pointer font-semibold"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#c19b48]" />
              <span>Demo Credentials</span>
            </button>
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
              Registered WhatsApp Mobile Number <span className="text-[#c19b48]">*</span>
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
                  Enter 6-Digit Security Code <span className="text-[#c19b48]">*</span>
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

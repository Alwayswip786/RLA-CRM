import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Phone, ArrowRight, ShieldCheck, RotateCcw, Edit2, AlertCircle } from 'lucide-react';
import { toast } from '../../lib/toast';
import { AuthLayout } from '../../layouts/AuthLayout';
import { useAuthStore } from '../../store/useAuthStore';

export const MobileVerification: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((state) => state.login);

  // Retrieve phone from navigation state or sessionStorage
  const statePhone = (location.state as { phone?: string })?.phone;
  const [phone] = useState<string>(() => {
    return statePhone || sessionStorage.getItem('rla_pending_mobile') || '9876543210';
  });

  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState(30);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus on first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Countdown timer for resend
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Auto-verify when all 6 digits are entered
  useEffect(() => {
    const code = otp.join('');
    if (code.length === 6 && !isVerifying) {
      executeVerification(code);
    }
  }, [otp]);

  const handleDigitChange = (index: number, value: string) => {
    // Only accept numeric digit
    const cleaned = value.replace(/\D/g, '');
    if (!cleaned && value !== '') return;

    const newOtp = [...otp];

    if (cleaned.length > 1) {
      // Handle multi-character input (e.g. autofill)
      const digits = cleaned.slice(0, 6).split('');
      for (let i = 0; i < 6; i++) {
        newOtp[i] = digits[i] || '';
      }
      setOtp(newOtp);
      const nextIdx = Math.min(digits.length, 5);
      inputRefs.current[nextIdx]?.focus();
      setError('');
      return;
    }

    newOtp[index] = cleaned;
    setOtp(newOtp);
    setError('');

    // Auto-advance to next input
    if (cleaned && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pastedData) return;

    const newOtp = [...otp];
    pastedData.split('').forEach((char, i) => {
      if (i < 6) newOtp[i] = char;
    });
    setOtp(newOtp);
    setError('');
    const nextIdx = Math.min(pastedData.length, 5);
    inputRefs.current[nextIdx]?.focus();
  };

  const handleResendOtp = () => {
    if (resendTimer > 0) return;
    setResendTimer(30);
    setOtp(['', '', '', '', '', '']);
    inputRefs.current[0]?.focus();
    toast.success('New OTP Sent!', {
      description: `A fresh 6-digit verification code was sent to +91 ${phone}`,
    });
  };

  const fillDemoOtp = () => {
    setOtp(['1', '2', '3', '4', '5', '6']);
    setError('');
    toast.success('Demo OTP Populated (123456)');
  };

  const executeVerification = async (codeToVerify: string) => {
    if (codeToVerify.length < 6 || isVerifying) return;

    setIsVerifying(true);
    setError('');

    await new Promise((resolve) => setTimeout(resolve, 600));

    login({
      name: 'Candidate ' + phone.slice(-4),
      phone: phone,
      email: '',
      targetExam: 'Judicial Services (PCS-J)',
      targetState: 'Delhi / NCR',
      rollNo: 'RLA-M' + phone.slice(-4),
      isLoggedIn: true,
      needsOnboarding: true,
      loginTime: new Date().toISOString(),
    });

    sessionStorage.removeItem('rla_pending_mobile');
    setIsVerifying(false);

    toast.success('Mobile Verified Successfully!', {
      description: 'Welcome to Rajinder Law Academy! Your student account is now active.',
      duration: 5000,
    });

    navigate('/onboarding');
  };

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const code = otp.join('');

    if (code.length < 6) {
      setError('Please enter all 6 digits of the verification code.');
      return;
    }

    executeVerification(code);
  };

  return (
    <AuthLayout
      title="Verify Mobile Number"
      subtitle="Enter the 6-digit verification code sent to your WhatsApp number to activate your account."
    >
      {/* Target Phone Card */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#c19b48]/15 flex items-center justify-center text-[#c19b48] shrink-0">
            <Phone className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
              Code sent to
            </p>
            <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white font-mono truncate">
              +91 {phone}
            </p>
          </div>
        </div>
        <Link
          to="/signup"
          className="text-xs font-semibold text-[#c19b48] hover:text-[#d8b862] hover:underline flex items-center gap-1 shrink-0 ml-2"
        >
          <Edit2 className="w-3 h-3" />
          <span>Change</span>
        </Link>
      </div>

      <form onSubmit={handleVerify} className="space-y-4">
        {/* 6-Digit OTP Boxes */}
        <div>
          <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-2.5 text-center">
            Enter 6-Digit Security Code <span className="text-red-500 font-bold">*</span>
          </label>
          <div className="flex items-center justify-between gap-2 sm:gap-2.5 max-w-[360px] mx-auto">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className={`w-11 h-12 sm:w-12 sm:h-13 rounded-xl bg-slate-50 dark:bg-[#061120] border text-center text-lg sm:text-xl font-bold font-mono text-slate-900 dark:text-white focus:outline-none transition-all ${
                  error
                    ? 'border-red-500 focus:border-red-500 bg-red-50/50 dark:bg-red-950/10'
                    : digit
                    ? 'border-[#c19b48] bg-[#c19b48]/5 dark:bg-[#c19b48]/10'
                    : 'border-slate-200 dark:border-[#143564] focus:border-[#c19b48]'
                }`}
              />
            ))}
          </div>
          {error && (
            <p className="text-red-500 dark:text-red-400 text-[11px] mt-2 text-center flex items-center justify-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{error}</span>
            </p>
          )}
        </div>

        {/* Resend Timer & Quick Demo Fill */}
        <div className="pt-1 flex flex-col items-center gap-2">
          {resendTimer > 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
              Resend code in{' '}
              <span className="font-semibold text-[#c19b48] font-mono">
                00:{resendTimer < 10 ? `0${resendTimer}` : resendTimer}
              </span>
            </p>
          ) : (
            <button
              type="button"
              onClick={handleResendOtp}
              className="text-xs font-semibold text-[#c19b48] hover:text-[#d8b862] hover:underline flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Resend OTP via WhatsApp</span>
            </button>
          )}

          <button
            type="button"
            onClick={fillDemoOtp}
            className="text-[11px] text-slate-400 hover:text-[#c19b48] transition-colors cursor-pointer"
          >
            Auto-fill demo OTP (123456)
          </button>
        </div>

        {/* Verify CTA */}
        <button
          type="submit"
          disabled={isVerifying}
          className="w-full mt-2 py-2.5 sm:py-3 px-4 rounded-xl bg-[#c19b48] hover:bg-[#d8b862] text-[#061120] font-semibold text-xs sm:text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer font-sans shadow-sm"
        >
          {isVerifying ? (
            <div className="w-4 h-4 border-2 border-[#061120] border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <ShieldCheck className="w-4 h-4" />
              <span>Verify &amp; Access Classroom</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Back to Registration */}
      <div className="mt-4 pt-3.5 border-t border-slate-200 dark:border-[#143564]/60 text-center text-xs text-slate-600 dark:text-slate-400">
        <p>
          Entered wrong number?{' '}
          <Link
            to="/signup"
            className="text-[#c19b48] hover:text-[#d8b862] font-semibold hover:underline inline-flex items-center gap-1"
          >
            <span>Back to Registration</span>
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};

export default MobileVerification;

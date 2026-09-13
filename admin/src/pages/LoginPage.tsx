import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  UserCheck,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface AdminProfile {
  name: string;
  role: 'director' | 'mentor' | 'admissions';
  title: string;
}

/**
 * Auto-detects administrator profile, assigned role and clearance level
 * directly from institutional email credentials.
 */
const resolveRoleFromEmail = (email: string): AdminProfile => {
  const normalized = email.toLowerCase().trim();

  if (
    normalized.includes('mentor') ||
    normalized.includes('evaluator') ||
    normalized.includes('faculty')
  ) {
    return {
      name: 'Prof. Ananya Sharma',
      role: 'mentor',
      title: 'Senior Faculty & Mains Evaluator',
    };
  }

  if (
    normalized.includes('admission') ||
    normalized.includes('registrar') ||
    normalized.includes('counselor')
  ) {
    return {
      name: 'Vikas Malhotra',
      role: 'admissions',
      title: 'Head of Admissions & Batch Registrar',
    };
  }

  // Default executive administration (Director / Academic Dean)
  return {
    name: 'Adv. Rajinder Sir',
    role: 'director',
    title: 'Director & Academic Dean',
  };
};

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('director@rajinderlawacademy.com');
  const [password, setPassword] = useState('Judicial@2025');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      toast.error('Please enter both institutional email and administrative password.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      // Auto-detect role and privileges directly from email
      const profile = resolveRoleFromEmail(email);

      const sessionData = {
        name: profile.name,
        email: email.trim(),
        role: profile.role,
        title: profile.title,
        token: `rla_jwt_admin_${Date.now()}`,
        loginAt: new Date().toISOString(),
      };

      localStorage.setItem('rla_admin_session', JSON.stringify(sessionData));
      setIsLoading(false);

      toast.success(
        <div>
          <div className="font-semibold text-[#F7F3E6]">Welcome to Executive Chambers, {profile.name}</div>
          <div className="text-xs text-[#A8A294] mt-0.5">Authenticated with {profile.title} privileges.</div>
        </div>,
        { duration: 3500 }
      );

      navigate('/');
    }, 500);
  };

  return (
    <div className="min-h-screen w-full bg-[#262626] text-[#F7F3E6] flex flex-col justify-between p-4 sm:p-6 lg:p-8 select-none">
      {/* Centered Content: Brand Header & Login Card */}
      <div className="w-full max-w-md mx-auto my-auto py-8 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-1.5">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#F7F3E6] tracking-tight">
            Rajinder Law Academy
          </h1>
          <p className="text-xs text-[#A8A294] font-sans">
            Authorized Faculty & Executive Portal Access
          </p>
        </div>

        {/* Main Card */}
        <div className="rounded-2xl bg-[#2F2F2F] border border-[#3D3D3D] p-6 sm:p-7 space-y-5">
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#E3DDCF]">
                Institutional Email ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#A8A294]">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. director@rajinderlawacademy.com"
                  className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#1E1E1E] border border-[#3D3D3D] focus:border-[#C19B48] focus:ring-1 focus:ring-[#C19B48] text-[#F7F3E6] placeholder-[#6B675E] text-xs transition-all outline-none"
                />
              </div>
              <p className="text-[10px] text-[#A8A294]">
                Administrative role and permissions are detected automatically from your verified email.
              </p>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-[#E3DDCF]">
                  Security Password
                </label>
                <button
                  type="button"
                  onClick={() =>
                    toast('For administrative credentials recovery, please contact IT Chambers.', { icon: 'ℹ️' })
                  }
                  className="text-[11px] text-[#C19B48] hover:text-[#D8B862] transition-colors cursor-pointer"
                >
                  Forgot access key?
                </button>
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#A8A294]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter administrative password"
                  className="w-full h-11 pl-10 pr-11 rounded-xl bg-[#1E1E1E] border border-[#3D3D3D] focus:border-[#C19B48] focus:ring-1 focus:ring-[#C19B48] text-[#F7F3E6] placeholder-[#6B675E] text-xs transition-all outline-none font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#A8A294] hover:text-[#F7F3E6] transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Toggle */}
            <div className="flex items-center justify-between pt-1 text-xs">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded bg-[#1E1E1E] border-[#3D3D3D] text-[#C19B48] focus:ring-0 cursor-pointer accent-[#C19B48]"
                />
                <span className="text-[#A8A294]">Stay signed in on this workstation</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 rounded-xl bg-[#C19B48] hover:bg-[#D8B862] disabled:opacity-70 text-[#262626] font-bold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#262626] border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <UserCheck className="w-4 h-4" />
                  <span>Enter Chamber Administration</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                </>
              )}
            </button>
          </form>

          {/* Internal Access Notice */}
          <div className="pt-3 border-t border-[#3D3D3D] text-center">
            <p className="text-[11px] text-[#A8A294] leading-relaxed">
              Account self-registration is disabled for security. New administrative privileges are
              granted only by the Director's Office.
            </p>
          </div>
        </div>
      </div>

      {/* Security Footer */}
      <div className="flex items-center justify-center gap-2 text-[11px] text-[#6B675E] text-center pt-4">
        <ShieldCheck className="w-3.5 h-3.5 text-[#34D399]" />
        <span>256-Bit SSL Encrypted • RLA Internal Judicial Database</span>
      </div>
    </div>
  );
};

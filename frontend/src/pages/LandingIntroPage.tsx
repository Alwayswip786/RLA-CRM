import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { ThemeSwitcher } from '../components/dashboard/ThemeSwitcher';
import { useAuthStore } from '../store/useAuthStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { cn } from '../utils/cn';

export function LandingIntroPage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  const banner = useSettingsStore((state) => state.banner);
  const settings = useSettingsStore((state) => state.settings);
  const fetchPublicSettings = useSettingsStore((state) => state.fetchPublicSettings);

  useEffect(() => {
    fetchPublicSettings();
  }, [fetchPublicSettings]);

  return (
    <div className="relative min-h-[100dvh] w-full overflow-hidden bg-[#F7F3E6] dark:bg-[#040B14] text-slate-900 dark:text-slate-100 font-sans transition-colors selection:bg-[#C19B48]/20 selection:text-[#C19B48]">
      {/* ========================================================= */}
      {/* DESKTOP VIEW (hidden on mobile, flex on md and above)      */}
      {/* ========================================================= */}
      <section className="relative hidden min-h-[100dvh] w-full overflow-hidden md:flex flex-col justify-between">
        {/* Soft Ambient Radial Light Behind the Dashboard Mockup */}
        <div className="pointer-events-none absolute inset-y-0 right-0 w-[58%] bg-[radial-gradient(circle_at_53%_48%,rgba(193,155,72,0.14),rgba(247,243,230,0.55)_35%,transparent_70%)] dark:bg-[radial-gradient(circle_at_53%_48%,rgba(193,155,72,0.16),rgba(10,28,54,0.55)_35%,transparent_70%)]" />

        {/* Admissions Announcement Banner (Dynamic from Admin Settings) */}
        {banner?.enabled && (
          <div
            className={cn(
              'relative z-30 w-full border-b py-1.5 px-4 text-center text-xs font-medium shrink-0 transition-colors',
              banner.theme === 'gold' &&
                'bg-[#c19b48]/12 dark:bg-[#061120] border-[#c19b48]/25 dark:border-[#143564] text-slate-700 dark:text-slate-300',
              banner.theme === 'urgent' &&
                'bg-rose-500/10 dark:bg-rose-950/40 border-rose-500/30 text-rose-700 dark:text-rose-300',
              banner.theme === 'blue' &&
                'bg-blue-500/10 dark:bg-blue-950/40 border-blue-500/30 text-blue-700 dark:text-blue-300',
              banner.theme === 'emerald' &&
                'bg-emerald-500/10 dark:bg-emerald-950/40 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
            )}
          >
            <div className="max-w-[1440px] mx-auto flex items-center justify-center gap-2.5">
              <span
                className={cn(
                  'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
                  banner.theme === 'gold' && 'bg-[#c19b48] text-[#061120]',
                  banner.theme === 'urgent' && 'bg-rose-500 text-white',
                  banner.theme === 'blue' && 'bg-blue-500 text-white',
                  banner.theme === 'emerald' && 'bg-emerald-500 text-white'
                )}
              >
                {banner.badgeText || 'ADMISSIONS 2025–26'}
              </span>
              <span className="truncate">
                {banner.message}
              </span>
              {banner.actionLink && (
                <button
                  type="button"
                  onClick={() => {
                    if (banner.actionLink?.startsWith('http')) {
                      window.open(banner.actionLink, '_blank');
                    } else {
                      navigate(banner.actionLink!);
                    }
                  }}
                  className="font-bold underline text-xs hover:opacity-80 transition-opacity ml-1 cursor-pointer shrink-0"
                >
                  {banner.actionText || 'Enroll Now →'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Top Navigation Bar: Logo on Left, ThemeSwitcher + Login CTA on Right */}
        <header className="relative z-30 flex items-center justify-between w-full max-w-[1440px] mx-auto px-8 pt-5 lg:px-12 lg:pt-6 xl:px-16 xl:pt-6 shrink-0">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => navigate('/')}>
            <img
              src="/logo.png"
              alt="Rajinder Law Academy"
              className="w-11 h-11 rounded-xl object-contain border border-[#C19B48]/50 shadow-sm group-hover:scale-105 transition-transform"
            />
            <div>
              <span className="block font-serif text-lg font-bold tracking-tight text-slate-900 dark:text-white leading-none">
                RAJINDER LAW
              </span>
              <span className="block text-[9px] font-bold text-[#C19B48] tracking-widest uppercase mt-1">
                ACADEMY • JUDICIAL SERVICES
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <ThemeSwitcher />
          </div>
        </header>

        {/* Center Grid Split */}
        <div className="mx-auto grid min-h-[calc(100dvh-120px)] w-full max-w-[1440px] grid-cols-[52%_48%] items-center gap-4 px-8 pb-6 lg:grid-cols-[46%_54%] lg:gap-6 lg:px-12 xl:grid-cols-[45%_55%] xl:gap-8 xl:px-16 flex-1">
          {/* Left Column: Hero Copy, Value Proposition & CTA Buttons */}
          <div className="relative z-30 max-w-[520px]">
            {/* Main Headline */}
            <h1 className="text-[44px] lg:text-[50px] xl:text-[54px] font-serif font-bold leading-[1.04] tracking-[-0.035em] text-slate-950 dark:text-white">
              Study smarter.<br />
              <span className="text-[#C19B48] dark:text-[#E2BC5C]">Rank higher.</span>
            </h1>

            {/* Subtext */}
            <p className="mt-5 text-[16px] font-medium text-slate-600 dark:text-slate-300 leading-relaxed max-w-[460px]">
              Comprehensive judicial examination coaching built for DJS, UP PCS-J, Haryana, Rajasthan &amp; Higher Judicial Services.
            </p>

            {/* Target Judicial State Badges */}
            <div className="mt-4 flex flex-wrap items-center gap-1.5 max-w-[480px]">
              {[
                { code: 'DJS', name: 'Delhi' },
                { code: 'UP PCS-J', name: 'Uttar Pradesh' },
                { code: 'HCS', name: 'Haryana' },
                { code: 'RJS', name: 'Rajasthan' },
                { code: 'HJS', name: 'Higher Judiciary' },
              ].map((badge) => (
                <span
                  key={badge.code}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-white/80 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] text-slate-700 dark:text-slate-300 shadow-2xs hover:border-[#C19B48]/60 transition-colors"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C19B48]" />
                  <span className="font-bold text-[#A07C2B] dark:text-[#E2BC5C]">{badge.code}</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">{badge.name}</span>
                </span>
              ))}
            </div>

            {/* CTA Action Buttons */}
            <div className="mt-8 flex w-full max-w-[380px] flex-col gap-3.5 lg:max-w-[420px] xl:max-w-[440px]">
              {isAuthenticated ? (
                <>
                  <button
                    type="button"
                    onClick={() => navigate('/dashboard')}
                    className="h-[52px] w-full cursor-pointer rounded-[14px] bg-gradient-to-r from-[#C19B48] via-[#B68F3A] to-[#9E7C2B] px-7 text-[15px] font-bold uppercase tracking-[0.12em] text-white shadow-[0_10px_24px_rgba(193,155,72,0.3)] hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                  >
                    <span>Go to Classroom</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                    Signed in as <span className="font-semibold text-slate-700 dark:text-slate-200">{user?.name || 'Enrolled Student'}</span> ({user?.rollNo || 'RLA Student'})
                  </p>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => navigate('/signup')}
                    className="h-[52px] w-full cursor-pointer rounded-[14px] bg-gradient-to-r from-[#C19B48] via-[#B68F3A] to-[#9E7C2B] px-7 text-[15px] font-bold uppercase tracking-[0.12em] text-white shadow-[0_10px_24px_rgba(193,155,72,0.3)] hover:brightness-105 active:scale-[0.99] transition-all"
                  >
                    Get Started
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="h-[52px] w-full cursor-pointer rounded-[14px] border-2 border-[#C19B48] bg-white dark:bg-[#0A1C36] px-7 text-[15px] font-bold uppercase tracking-[0.08em] text-[#A07C2B] dark:text-[#E2BC5C] hover:bg-[#C19B48]/10 dark:hover:bg-[#C19B48]/20 active:scale-[0.99] transition-all"
                  >
                    I Already Have An Account
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Right Column: RLA Judicial Mentors Brand Showcase */}
          <div className="relative z-20 flex items-center justify-center w-full max-w-[680px] xl:max-w-[720px] self-center justify-self-end">
            <motion.img
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              src="/authSeniors.png"
              alt="Rajinder Law Academy Judicial Mentors"
              className="w-full h-auto max-h-[calc(100vh-140px)] object-contain select-none pointer-events-none drop-shadow-[0_20px_45px_rgba(0,0,0,0.2)]"
              draggable={false}
              loading="eager"
            />
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* MOBILE VIEW (flex on mobile, hidden on md and above)      */}
      {/* ========================================================= */}
      <section className="relative z-10 flex min-h-[100dvh] w-full flex-col justify-between overflow-hidden bg-[#F7F3E6] dark:bg-[#040B14] px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-3 text-center md:hidden transition-colors">
        {/* Mobile Admissions Ribbon (Dynamic from Admin Settings) */}
        {banner?.enabled && (
          <div
            className={cn(
              'w-full -mx-5 px-4 py-1.5 border-b text-[10px] font-medium flex items-center justify-center gap-1.5 mb-3 transition-colors',
              banner.theme === 'gold' &&
                'bg-[#c19b48]/15 dark:bg-[#061120] border-[#c19b48]/25 dark:border-[#143564] text-slate-700 dark:text-slate-300',
              banner.theme === 'urgent' &&
                'bg-rose-500/15 dark:bg-rose-950/40 border-rose-500/30 text-rose-700 dark:text-rose-300',
              banner.theme === 'blue' &&
                'bg-blue-500/15 dark:bg-blue-950/40 border-blue-500/30 text-blue-700 dark:text-blue-300',
              banner.theme === 'emerald' &&
                'bg-emerald-500/15 dark:bg-emerald-950/40 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
            )}
          >
            <span
              className={cn(
                'font-bold uppercase tracking-wider text-[9px] px-1.5 py-0.2 rounded',
                banner.theme === 'gold' && 'bg-[#c19b48] text-[#061120]',
                banner.theme === 'urgent' && 'bg-rose-500 text-white',
                banner.theme === 'blue' && 'bg-blue-500 text-white',
                banner.theme === 'emerald' && 'bg-emerald-500 text-white'
              )}
            >
              {banner.badgeText || 'ADMISSIONS'}
            </span>
            <span className="truncate">{banner.message}</span>
          </div>
        )}

        {/* Mobile Top Header */}
        <div className="flex items-center justify-between w-full mb-2 shrink-0">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt="Rajinder Law Academy"
              className="w-8 h-8 rounded-lg object-contain border border-[#C19B48]/50"
            />
            <div className="text-left">
              <span className="block font-serif text-sm font-bold tracking-tight text-slate-900 dark:text-white leading-none">
                RAJINDER LAW
              </span>
              <span className="block text-[7px] font-bold text-[#C19B48] tracking-widest uppercase mt-0.5">
                ACADEMY • JUDICIARY
              </span>
            </div>
          </div>
          <ThemeSwitcher />
        </div>

        {/* Law Mascots from Login Screen in Mobile Banner */}
        <div className="relative w-full max-w-[320px] mx-auto h-[160px] my-auto flex items-center justify-center">
          <img
            src="/authSeniors.png"
            alt="Rajinder Law Academy Judicial Mascots"
            className="w-full h-full object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.12)] pointer-events-none"
            loading="eager"
          />
        </div>

        {/* Mobile Hero Text */}
        <div className="my-auto py-2">
          <h1 className="text-[30px] sm:text-[34px] font-serif font-bold leading-[1.08] text-slate-900 dark:text-white">
            Study smarter.<br />
            <span className="text-[#C19B48] dark:text-[#E2BC5C]">Rank higher.</span>
          </h1>
          <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
            Engineered for Civil Judge (Junior Division) &amp; Higher Judicial Services examinations.
          </p>
          {/* Mobile Exam Badges (Dynamic from Settings) */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 mt-2.5 max-w-xs mx-auto">
            {(settings?.supportedExams || ['DJS', 'UP PCS-J', 'HCS', 'RJS', 'HJS']).map((code) => (
              <span
                key={code}
                className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white/80 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] text-slate-700 dark:text-slate-300"
              >
                {code}
              </span>
            ))}
          </div>
        </div>

        {/* Mobile Action Buttons */}
        <div className="w-full flex flex-col gap-3 shrink-0 pt-2">
          {isAuthenticated ? (
            <>
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="h-[52px] w-full rounded-2xl bg-gradient-to-r from-[#C19B48] to-[#9E7C2B] text-white text-[14px] font-bold uppercase tracking-wider shadow-[0_8px_20px_rgba(193,155,72,0.3)] hover:brightness-105 active:scale-[0.985] transition-all flex items-center justify-center gap-2"
              >
                <span>Go to Classroom</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center">
                Signed in as <span className="font-semibold text-slate-700 dark:text-slate-200">{user?.name || 'Enrolled Student'}</span>
              </p>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => navigate('/signup')}
                className="h-[52px] w-full rounded-2xl bg-gradient-to-r from-[#C19B48] to-[#9E7C2B] text-white text-[14px] font-bold uppercase tracking-wider shadow-[0_8px_20px_rgba(193,155,72,0.3)] hover:brightness-105 active:scale-[0.985] transition-all"
              >
                Get Started
              </button>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="h-[52px] w-full rounded-2xl border-2 border-[#C19B48] bg-white dark:bg-[#0A1C36] text-[#A07C2B] dark:text-[#E2BC5C] text-[14px] font-bold uppercase tracking-wider hover:bg-[#C19B48]/10 active:scale-[0.985] transition-all"
              >
                I Already Have An Account
              </button>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

export default LandingIntroPage;

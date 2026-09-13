import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ThemeSwitcher } from '../components/dashboard/ThemeSwitcher';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen lg:h-screen lg:max-h-screen w-full flex bg-[#F7F3E6] dark:bg-[#061120] text-slate-900 dark:text-slate-100 font-sans transition-colors overflow-x-hidden">
      {/* Left Column: Brand Showcase (Desktop only - 50% split) */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between h-full max-h-screen relative overflow-hidden bg-white dark:bg-[#0a1c36] border-r border-slate-200 dark:border-[#143564]/50 transition-colors">
        {/* Brand Header: Logo on Top Left Corner + ThemeSwitcher on Top Right Corner */}
        <div className="relative z-10 flex items-center justify-between w-full px-6 pt-5 pb-2 shrink-0">
          <Link to="/" className="inline-flex items-center gap-3 group">
            <img
              src="/logo.png"
              alt="Rajinder Law Academy"
              className="w-11 h-11 rounded-xl object-contain border border-[#c19b48]/40 group-hover:scale-105 transition-transform"
            />
          </Link>

          {/* Theme Switcher on the top right corner of the first panel */}
          <div className="flex items-center gap-2">
            <ThemeSwitcher />
          </div>
        </div>

        {/* Center Showcase: Auth Seniors Illustration */}
        <div className="relative z-10 my-auto flex-1 flex flex-col items-center justify-center p-6 xl:p-8 overflow-hidden">
          <motion.img
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            src="/authSeniors.png"
            alt="Rajinder Law Academy - Future Judges & Advocates"
            className="w-full max-w-[620px] h-auto max-h-[calc(100vh-130px)] object-contain select-none pointer-events-none"
          />
        </div>
      </div>

      {/* Right Column: Interactive Form Container (50% split - smooth full scroll) */}
      <div className="w-full lg:w-1/2 flex flex-col items-center h-full min-h-screen lg:min-h-0 overflow-y-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8 bg-[#F7F3E6]/70 dark:bg-[#061120] transition-colors">
        {/* Mobile Header with Theme Switcher */}
        <div className="lg:hidden flex items-center justify-between w-full max-w-[500px] mb-4 shrink-0">
          <div className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="Rajinder Law Academy"
              className="w-7 h-7 rounded-lg object-contain border border-[#c19b48]/40"
            />
            <div>
              <h1 className="font-serif text-xs font-bold text-slate-900 dark:text-white leading-none">
                RAJINDER LAW
              </h1>
              <p className="text-[8px] font-semibold text-[#c19b48] tracking-widest uppercase mt-0.5">
                Classroom Portal
              </p>
            </div>
          </div>

          <ThemeSwitcher />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-[500px] my-auto bg-white dark:bg-[#0a1c36]/90 border border-slate-200 dark:border-[#143564] rounded-2xl p-4 sm:p-6 backdrop-blur-xl relative transition-colors shadow-lg shrink-0"
        >
          {/* Header */}
          <div className="mb-3.5 sm:mb-4">
            <h2 className="text-base sm:text-lg font-serif font-bold text-slate-900 dark:text-white leading-snug">{title}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">{subtitle}</p>
          </div>

          {/* Dynamic Auth Form */}
          {children}
        </motion.div>

        {/* Disclaimer / Privacy */}
        <div className="mt-4 mb-2 text-center text-[10px] text-slate-500 shrink-0">
          <p>© {new Date().getFullYear()} Rajinder Law Academy. All Rights Reserved.</p>
          <div className="mt-0.5 flex items-center justify-center gap-2.5 text-[10px] text-slate-400 dark:text-slate-500">
            <a href="#terms" className="hover:text-[#c19b48] transition-colors">Terms of Service</a>
            <span>•</span>
            <a href="#privacy" className="hover:text-[#c19b48] transition-colors">Privacy Policy</a>
            <span>•</span>
            <a href="#security" className="hover:text-[#c19b48] transition-colors">Student Guidelines</a>
          </div>
        </div>
      </div>
    </div>
  );
};

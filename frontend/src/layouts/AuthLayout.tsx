import React from 'react';
import { motion } from 'framer-motion';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen w-full flex flex-col justify-between items-center bg-[#F7F3E6] dark:bg-[#061120] text-slate-900 dark:text-slate-100 font-sans transition-colors px-4 py-6 sm:px-6 sm:py-8 overflow-y-auto">
      {/* Centered Form Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-[500px] my-auto bg-white dark:bg-[#0a1c36]/90 border border-slate-200 dark:border-[#143564] rounded-2xl p-5 sm:p-7 backdrop-blur-xl relative transition-colors shadow-lg shrink-0"
      >
        {/* Header */}
        <div className="mb-4 sm:mb-5">
          <h2 className="text-lg sm:text-xl font-serif font-bold text-slate-900 dark:text-white leading-snug">
            {title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 leading-normal">
            {subtitle}
          </p>
        </div>

        {/* Dynamic Auth Form */}
        {children}
      </motion.div>

      {/* Disclaimer / Privacy */}
      <footer className="mt-6 mb-2 text-center text-[11px] text-slate-500 shrink-0">
        <p>© {new Date().getFullYear()} Rajinder Law Academy. All Rights Reserved.</p>
        <div className="mt-1 flex items-center justify-center gap-2.5 text-[11px] text-slate-400 dark:text-slate-500">
          <a href="#terms" className="hover:text-[#c19b48] transition-colors">Terms of Service</a>
          <span>•</span>
          <a href="#privacy" className="hover:text-[#c19b48] transition-colors">Privacy Policy</a>
          <span>•</span>
          <a href="#security" className="hover:text-[#c19b48] transition-colors">Student Guidelines</a>
        </div>
      </footer>
    </div>
  );
};

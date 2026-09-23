import React, { useState } from 'react';
import { Sun, Moon, Monitor, Check } from 'lucide-react';
import { useThemeStore, type ThemeMode } from '../../store/useThemeStore';
import { cn } from '../../utils/cn';
import { toast } from '../../lib/toast';

export const ThemeSwitcher: React.FC = () => {
  const { theme, resolvedTheme, toggleThemeWithTransition, setThemeWithTransition } = useThemeStore();
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Smooth circular reveal transition expanding organically from the toggle button
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    toggleThemeWithTransition({ x, y });
  };

  const handleSelectTheme = (mode: ThemeMode, e?: React.MouseEvent) => {
    let origin: { x: number; y: number } | 'center' = 'center';
    if (e) {
      origin = { x: e.clientX, y: e.clientY };
    }
    setThemeWithTransition(mode, origin);
    setIsOpen(false);
    toast.success(
      mode === 'dark'
        ? 'Chamber Dark Mode Activated'
        : mode === 'light'
        ? 'Daylight Study Mode Activated'
        : 'System Sync Mode Activated',
      { duration: 2000 }
    );
  };

  return (
    <div className="relative">
      {/* Trigger Button: 1-click quick toggle from center, or right-click for options */}
      <button
        type="button"
        onClick={handleToggle}
        onContextMenu={(e) => {
          e.preventDefault();
          setIsOpen(!isOpen);
        }}
        title={`Current: ${theme.toUpperCase()} (Click to toggle with circular ripple)`}
        aria-label="Toggle theme"
        className={cn(
          'p-1.5 sm:p-2 rounded-xl border transition-all cursor-pointer relative group flex items-center justify-center shrink-0',
          resolvedTheme === 'dark'
            ? 'bg-[#061120] border-[#143564] text-[#e8cf8d] hover:border-[#c19b48]/60 hover:bg-[#0a1c36]'
            : 'bg-slate-100 border-slate-300 text-amber-600 hover:border-amber-400 hover:bg-slate-200'
        )}
      >
        {resolvedTheme === 'dark' ? (
          <Sun className="w-4 h-4 text-[#c19b48] group-hover:rotate-45 transition-transform duration-300" />
        ) : (
          <Moon className="w-4 h-4 text-blue-600 group-hover:-rotate-12 transition-transform duration-300" />
        )}
      </button>

      {/* Dropdown Options (when open) */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-38 rounded-xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] shadow-2xl p-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-xs">
            <button
              onClick={(e) => handleSelectTheme('light', e)}
              className={cn(
                'w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer text-left',
                theme === 'light'
                  ? 'text-[#c19b48] font-bold bg-[#c19b48]/10'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#143564]/50'
              )}
            >
              <div className="flex items-center gap-2">
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>Light</span>
              </div>
              {theme === 'light' && <Check className="w-3 h-3 text-[#c19b48]" />}
            </button>

            <button
              onClick={(e) => handleSelectTheme('dark', e)}
              className={cn(
                'w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer text-left',
                theme === 'dark'
                  ? 'text-[#c19b48] font-bold bg-[#c19b48]/10'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#143564]/50'
              )}
            >
              <div className="flex items-center gap-2">
                <Moon className="w-3.5 h-3.5 text-blue-400" />
                <span>Dark</span>
              </div>
              {theme === 'dark' && <Check className="w-3 h-3 text-[#c19b48]" />}
            </button>

            <button
              onClick={(e) => handleSelectTheme('system', e)}
              className={cn(
                'w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer text-left',
                theme === 'system'
                  ? 'text-[#c19b48] font-bold bg-[#c19b48]/10'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#143564]/50'
              )}
            >
              <div className="flex items-center gap-2">
                <Monitor className="w-3.5 h-3.5 text-slate-400" />
                <span>System</span>
              </div>
              {theme === 'system' && <Check className="w-3 h-3 text-[#c19b48]" />}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

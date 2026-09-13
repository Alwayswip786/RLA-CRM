import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  maxHeight?: string;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  className = '',
  maxHeight = 'max-h-[85vh]',
}) => {
  // Lock body scroll when open
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end">
          {/* Backdrop Blur Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            aria-hidden="true"
          />

          {/* iOS Bottom Sheet Card */}
          <motion.div
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={(_, info) => {
              // Swipe down threshold or fast downward velocity
              if (info.offset.y > 90 || info.velocity.y > 350) {
                onClose();
              }
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className={`relative w-full bg-white dark:bg-[#0a1c36] text-slate-900 dark:text-slate-100 rounded-t-[28px] border-t border-slate-200/80 dark:border-[#143564] shadow-2xl overflow-hidden flex flex-col z-10 pb-6 ${maxHeight} ${className}`}
          >
            {/* iOS Pill Grab Handle Bar */}
            <div className="pt-2.5 pb-1 shrink-0 flex justify-center cursor-grab active:cursor-grabbing">
              <div className="w-10 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 transition-colors" />
            </div>

            {/* Sheet Header */}
            {(title || subtitle) && (
              <div className="px-5 pt-1 pb-3 border-b border-slate-100 dark:border-[#143564]/60 flex items-center justify-between shrink-0">
                <div className="min-w-0 pr-3">
                  {title && (
                    <h3 className="font-serif text-base font-bold text-slate-900 dark:text-white truncate">
                      {title}
                    </h3>
                  )}
                  {subtitle && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                      {subtitle}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-full bg-slate-100 dark:bg-[#061120] text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors shrink-0"
                  aria-label="Close sheet"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Sheet Scrollable Content */}
            <div className="overflow-y-auto no-scrollbar flex-1 px-4 py-3">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

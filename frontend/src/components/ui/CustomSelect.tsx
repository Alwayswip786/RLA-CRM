import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check, Search } from 'lucide-react';
import { BottomSheet } from './BottomSheet';
import { useIsDesktop } from '../../hooks/use-responsive';

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  badge?: string;
  icon?: React.ReactNode;
}

export interface CustomSelectProps {
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  error?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  name?: string;
  searchable?: boolean;
  sheetTitle?: string;
  sheetSubtitle?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  label,
  required = false,
  error,
  icon,
  disabled = false,
  className = '',
  name,
  searchable = false,
  sheetTitle,
  sheetSubtitle,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number; width: number }>({
    top: 0,
    left: 0,
    width: 0,
  });

  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const isDesktop = useIsDesktop(1024);

  // Selected Option Object
  const selectedOption = options.find((opt) => opt.value === value);

  // Calculate and update desktop floating popover position
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const menuHeight = 220; // estimated max height
    const flip = spaceBelow < menuHeight && rect.top > menuHeight;

    let top = rect.bottom + window.scrollY + 4;
    if (flip) {
      // Flip to above if not enough space below
      top = rect.top + window.scrollY - menuHeight - 4;
    }

    setIsFlipped(flip);
    setMenuPosition({
      top,
      left: rect.left + window.scrollX,
      width: rect.width,
    });
  }, []);

  // Update position synchronously on open, or via layout effect on scroll / resize
  useLayoutEffect(() => {
    if (!isOpen || !isDesktop) return;

    updatePosition();
    const handleScrollOrResize = () => updatePosition();

    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen, isDesktop, updatePosition]);

  // Synchronous toggle to eliminate initial render at (0, 0)
  const handleToggle = () => {
    if (disabled) return;
    if (!isOpen && isDesktop && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const menuHeight = 220;
      const flip = spaceBelow < menuHeight && rect.top > menuHeight;
      let top = rect.bottom + window.scrollY + 4;
      if (flip) {
        top = rect.top + window.scrollY - menuHeight - 4;
      }
      setIsFlipped(flip);
      setMenuPosition({
        top,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
    setIsOpen((prev) => !prev);
  };

  // Click outside listener for desktop popover
  useEffect(() => {
    if (!isOpen || !isDesktop) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isDesktop]);

  const handleSelect = (optionValue: string) => {
    onChange?.(optionValue);
    setIsOpen(false);
    setSearchQuery('');
  };

  // Filter options if searchable is enabled or search query exists
  const filteredOptions = searchQuery.trim()
    ? options.filter(
        (opt) =>
          opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          opt.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options;

  // Auto-enable search bar if more than 7 options
  const shouldShowSearch = searchable || options.length > 7;

  return (
    <div className={className}>
      {/* Optional Top Label */}
      {label && (
        <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          {label} {required && <span className="text-red-500 font-bold">*</span>}
        </label>
      )}

      {/* Hidden input to ensure native form serialization if needed */}
      {name && <input type="hidden" name={name} value={value || ''} />}

      {/* Trigger Button Wrapper */}
      <div className="relative">
        <button
          ref={triggerRef}
          type="button"
          disabled={disabled}
          onClick={handleToggle}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          className={`w-full flex items-center justify-between text-left py-2 sm:py-2.5 pr-3 rounded-xl border text-xs sm:text-sm font-normal transition-all cursor-pointer select-none ${
            icon ? 'pl-9' : 'pl-3'
          } ${
            disabled
              ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
              : error
              ? 'border-red-500 bg-red-50/50 dark:bg-red-950/20 text-red-900 dark:text-red-200'
              : isOpen
              ? 'border-[#c19b48] ring-1 ring-[#c19b48]/30 bg-white dark:bg-[#061120]'
              : 'border-slate-200 dark:border-[#143564] hover:border-[#c19b48]/60 bg-slate-50 dark:bg-[#061120]/80 text-slate-900 dark:text-white'
          }`}
        >
          {/* Selected Label or Placeholder */}
          <span
            className={`truncate block pr-2 ${
              selectedOption ? 'text-slate-900 dark:text-white font-normal' : 'text-slate-400 dark:text-slate-500 font-normal'
            }`}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>

          {/* Trailing Chevron Icon */}
          <ChevronDown
            className={`w-4 h-4 shrink-0 text-slate-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-[#c19b48]' : ''
            }`}
            strokeWidth={1.75}
          />
        </button>

        {/* Leading Icon: perfectly centered within the button */}
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
            {icon}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-red-500 dark:text-red-400 text-[11px] mt-1 leading-tight">{error}</p>
      )}

      {/* ---------------------------------------------------- */}
      {/* 1. DESKTOP VIEW: Floating Popover Menu via Portal    */}
      {/* ---------------------------------------------------- */}
      {isDesktop &&
        isOpen &&
        menuPosition.width > 0 &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: 'absolute',
              top: `${menuPosition.top}px`,
              left: `${menuPosition.left}px`,
              width: `${menuPosition.width}px`,
            }}
            className={`z-[9999] bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] rounded-xl shadow-2xl overflow-hidden p-1 text-slate-900 dark:text-slate-100 animate-in fade-in zoom-in-95 duration-150 ${
              isFlipped ? 'origin-bottom' : 'origin-top'
            }`}
          >
            {/* Desktop Optional Search */}
            {shouldShowSearch && (
              <div className="p-1.5 border-b border-slate-100 dark:border-[#143564]/50">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" strokeWidth={1.75} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter options..."
                    className="w-full bg-slate-50 dark:bg-[#061120] text-xs pl-7 pr-2 py-1 rounded-md border border-slate-200 dark:border-[#143564] focus:outline-none focus:border-[#c19b48]"
                  />
                </div>
              </div>
            )}

            {/* Desktop Options List */}
            <div className="max-h-52 overflow-y-auto no-scrollbar space-y-0.5 p-0.5">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt) => {
                  const isSelected = opt.value === value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleSelect(opt.value)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer text-left ${
                        isSelected
                          ? 'bg-[#c19b48]/15 text-[#c19b48] dark:text-[#e8cf8d] font-semibold'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#143564]/50'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                          <span className="truncate">{opt.label}</span>
                          {opt.badge && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-[#c19b48] font-bold">
                              {opt.badge}
                            </span>
                          )}
                        </div>
                        {opt.description && (
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                            {opt.description}
                          </p>
                        )}
                      </div>

                      {isSelected && <Check className="w-3.5 h-3.5 text-[#c19b48] shrink-0" strokeWidth={1.75} />}
                    </button>
                  );
                })
              ) : (
                <div className="py-4 text-center text-[11px] text-slate-400">No matching options</div>
              )}
            </div>
          </div>,
          document.body
        )}

      {/* ---------------------------------------------------- */}
      {/* 2. MOBILE & TABLET VIEW: iOS Bottom Sheet Drawer     */}
      {/* ---------------------------------------------------- */}
      {!isDesktop && (
        <BottomSheet
          isOpen={isOpen}
          onClose={() => {
            setIsOpen(false);
            setSearchQuery('');
          }}
          title={sheetTitle || label || placeholder}
          subtitle={sheetSubtitle || 'Tap to select an option or drag down to close'}
        >
          {/* iOS Search Bar */}
          {shouldShowSearch && (
            <div className="mb-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search in options..."
                  className="w-full bg-slate-100 dark:bg-[#061120] text-xs sm:text-sm pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-[#143564] focus:outline-none focus:border-[#c19b48]"
                />
              </div>
            </div>
          )}

          {/* iOS List of Options */}
          <div className="divide-y divide-slate-100 dark:divide-[#143564]/40">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full flex items-center justify-between py-3 px-3 transition-colors cursor-pointer text-left rounded-xl active:bg-slate-100 dark:active:bg-[#143564]/60 ${
                      isSelected
                        ? 'bg-[#c19b48]/10 text-[#c19b48] dark:text-[#e8cf8d]'
                        : 'text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <div className="min-w-0 pr-3">
                      <div className="flex items-center gap-2">
                        {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                        <span className={`text-xs sm:text-sm ${isSelected ? 'font-bold' : 'font-medium'}`}>
                          {opt.label}
                        </span>
                        {opt.badge && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-[#c19b48] font-bold">
                            {opt.badge}
                          </span>
                        )}
                      </div>
                      {opt.description && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {opt.description}
                        </p>
                      )}
                    </div>

                    {/* iOS Radio-Check Indicator */}
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                        isSelected
                          ? 'border-[#c19b48] bg-[#c19b48] text-[#061120]'
                          : 'border-slate-300 dark:border-slate-600 bg-transparent'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                No matching options found for "{searchQuery}".
              </div>
            )}
          </div>
        </BottomSheet>
      )}
    </div>
  );
};

import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { ScrollableTabsProps, TabItem } from './types';

export function ScrollableTabs<T extends string = string>({
  items,
  value,
  onChange,
  className = '',
  variant = 'pill',
  size = 'md',
  autoCenter = true,
  showGradients = true,
  ariaLabel = 'Scrollable tabs',
}: ScrollableTabsProps<T>): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScrollAffordance = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 6);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 6);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    checkScrollAffordance();
    el.addEventListener('scroll', checkScrollAffordance, { passive: true });
    window.addEventListener('resize', checkScrollAffordance);

    return () => {
      el.removeEventListener('scroll', checkScrollAffordance);
      window.removeEventListener('resize', checkScrollAffordance);
    };
  }, [checkScrollAffordance, items]);

  // Auto-scroll active item into center view
  useEffect(() => {
    if (!autoCenter) return;
    const activeIndex = items.findIndex((item) => item.id === value);
    if (activeIndex !== -1 && tabRefs.current[activeIndex]) {
      tabRefs.current[activeIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [value, autoCenter, items]);

  const sizeClasses = {
    sm: variant === 'pill' ? 'px-3 py-1.5 text-xs min-h-[36px]' : 'px-3 pb-2 text-xs min-h-[36px]',
    md: variant === 'pill' ? 'px-3.5 sm:px-4 py-2 text-xs font-semibold min-h-[40px]' : 'px-3 sm:px-4 pb-2.5 text-xs font-semibold min-h-[40px]',
    lg: variant === 'pill' ? 'px-4 sm:px-5 py-2.5 text-sm font-bold min-h-[44px]' : 'px-4 sm:px-5 pb-3 text-sm font-semibold min-h-[44px]',
  }[size];

  return (
    <div className={`relative max-w-full ${className}`}>
      {/* Left Scroll Gradient Cue */}
      {showGradients && canScrollLeft && (
        <div
          aria-hidden="true"
          className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white dark:from-[#061120] to-transparent pointer-events-none z-10 transition-opacity duration-200"
        />
      )}

      {/* Scrollable Container */}
      <div
        ref={containerRef}
        role="tablist"
        aria-label={ariaLabel}
        className={`flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar scroll-smooth select-none ${
          variant === 'underline' ? 'border-b border-slate-200 dark:border-[#143564]/60' : 'pb-1'
        }`}
      >
        {items.map((item: TabItem<T>, index: number) => {
          const isActive = value === item.id;

          const pillClasses = isActive
            ? 'bg-[#c19b48] text-[#061120] border-[#c19b48] shadow-xs font-bold'
            : 'bg-white dark:bg-[#0a1c36] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-[#143564] hover:border-[#c19b48]/50 hover:text-slate-900 dark:hover:text-white';

          const underlineClasses = isActive
            ? 'border-b-2 border-[#c19b48] text-[#c19b48] dark:text-[#f3d999] font-bold'
            : 'border-b-2 border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200';

          return (
            <button
              key={item.id}
              ref={(el) => {
                tabRefs.current[index] = el;
              }}
              role="tab"
              type="button"
              aria-selected={isActive}
              disabled={item.disabled}
              onClick={() => !item.disabled && onChange(item.id)}
              className={`flex items-center justify-center gap-1.5 sm:gap-2 shrink-0 whitespace-nowrap transition-all cursor-pointer ${sizeClasses} ${
                variant === 'pill' ? `rounded-xl border ${pillClasses}` : underlineClasses
              } ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {/* Pulse Indicator */}
              {item.badgeVariant === 'pulse' && (
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
              )}

              {/* Icon */}
              {item.icon && <span className="shrink-0">{item.icon}</span>}

              {/* Responsive Short Label */}
              {item.shortLabel ? (
                <>
                  <span className="sm:hidden">{item.shortLabel}</span>
                  <span className="hidden sm:inline">{item.label}</span>
                </>
              ) : (
                <span>{item.label}</span>
              )}

              {/* Badge */}
              {item.badge !== undefined && item.badge !== null && item.badge !== '' && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold shrink-0 transition-colors ${
                    isActive && variant === 'pill'
                      ? 'bg-[#061120]/15 text-[#061120]'
                      : item.badgeVariant === 'danger'
                      ? 'bg-red-500 text-white'
                      : item.badgeVariant === 'gold'
                      ? 'bg-[#c19b48]/20 text-[#c19b48] dark:text-[#f3d999]'
                      : 'bg-slate-100 dark:bg-[#143564] text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Right Scroll Gradient Cue */}
      {showGradients && canScrollRight && (
        <div
          aria-hidden="true"
          className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-[#061120] to-transparent pointer-events-none z-10 transition-opacity duration-200"
        />
      )}
    </div>
  );
}

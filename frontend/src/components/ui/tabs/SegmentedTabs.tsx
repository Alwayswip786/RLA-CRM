import React from 'react';
import type { SegmentedTabsProps, TabItem } from './types';

export function SegmentedTabs<T extends string = string>({
  items,
  value,
  onChange,
  className = '',
  size = 'md',
  fullWidthMobile = true,
  hideIconsOnMobile = false,
  ariaLabel = 'Navigation tabs',
}: SegmentedTabsProps<T>): React.ReactElement {
  // Determine grid columns on mobile based on items length
  const gridColsClass =
    items.length === 2
      ? 'grid-cols-2'
      : items.length === 3
      ? 'grid-cols-3'
      : items.length === 4
      ? 'grid-cols-4'
      : 'grid-flow-col auto-cols-fr';

  const sizeClasses = {
    sm: 'px-2.5 py-1.5 text-[11px] min-h-[36px]',
    md: 'px-3 sm:px-4 py-2 text-xs min-h-[40px]',
    lg: 'px-4 sm:px-5 py-2.5 text-sm min-h-[44px]',
  }[size];

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`p-1 rounded-xl bg-slate-100 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] ${
        fullWidthMobile ? `w-full grid ${gridColsClass} sm:inline-flex sm:w-auto` : 'inline-flex'
      } items-center gap-1 transition-colors ${className}`}
    >
      {items.map((item: TabItem<T>) => {
        const isActive = value === item.id;

        return (
          <button
            key={item.id}
            role="tab"
            type="button"
            aria-selected={isActive}
            disabled={item.disabled}
            onClick={() => !item.disabled && onChange(item.id)}
            className={`flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg font-semibold whitespace-nowrap transition-all cursor-pointer select-none shrink-0 ${
              fullWidthMobile ? 'w-full sm:w-auto' : ''
            } ${sizeClasses} ${
              isActive
                ? 'bg-[#c19b48] text-[#061120] font-bold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/5'
            } ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {/* Pulse Indicator */}
            {item.badgeVariant === 'pulse' && (
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
            )}

            {/* Icon */}
            {item.icon && (
              <span className={`shrink-0 ${hideIconsOnMobile ? 'hidden sm:inline-flex' : ''}`}>
                {item.icon}
              </span>
            )}

            {/* Label with Responsive Short-Label Fallback */}
            {item.shortLabel ? (
              <>
                <span className="sm:hidden truncate">{item.shortLabel}</span>
                <span className="hidden sm:inline truncate">{item.label}</span>
              </>
            ) : (
              <span className="truncate">{item.label}</span>
            )}

            {/* Numeric / Text Badge */}
            {item.badge !== undefined && item.badge !== null && item.badge !== '' && (
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 transition-colors ${
                  isActive
                    ? 'bg-[#061120]/15 text-[#061120]'
                    : item.badgeVariant === 'danger'
                    ? 'bg-red-500 text-white'
                    : item.badgeVariant === 'gold'
                    ? 'bg-[#c19b48]/20 text-[#c19b48] dark:text-[#f3d999]'
                    : 'bg-slate-200 dark:bg-[#143564] text-slate-700 dark:text-slate-300'
                }`}
              >
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

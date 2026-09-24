import React from 'react';
import type { UnderlineTabsProps, TabItem } from './types';

export function UnderlineTabs<T extends string = string>({
  items,
  value,
  onChange,
  className = '',
  equalWidth = false,
  size = 'md',
  ariaLabel = 'Navigation tabs',
}: UnderlineTabsProps<T>): React.ReactElement {
  const sizeClasses = {
    sm: 'py-2 px-3 text-xs min-h-[38px]',
    md: 'py-2.5 px-4 text-xs sm:text-sm font-medium min-h-[42px]',
  }[size];

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`flex items-center ${
        equalWidth ? 'w-full' : 'gap-4 sm:gap-6'
      } border-b border-slate-200 dark:border-[#16253d] shrink-0 ${className}`}
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
            className={`flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap select-none ${
              equalWidth ? 'flex-1' : ''
            } ${sizeClasses} ${
              isActive
                ? 'border-[#c19b48] text-[#c19b48] dark:text-[#e8cf8d] font-bold'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            } ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {item.icon && <span className="shrink-0">{item.icon}</span>}

            {item.shortLabel ? (
              <>
                <span className="sm:hidden truncate">{item.shortLabel}</span>
                <span className="hidden sm:inline truncate">{item.label}</span>
              </>
            ) : (
              <span className="truncate">{item.label}</span>
            )}

            {item.badge !== undefined && item.badge !== null && item.badge !== '' && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold shrink-0 transition-colors ${
                  isActive
                    ? 'bg-[#c19b48] text-[#061120]'
                    : 'bg-slate-200 dark:bg-[#16253d] text-slate-600 dark:text-slate-400'
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

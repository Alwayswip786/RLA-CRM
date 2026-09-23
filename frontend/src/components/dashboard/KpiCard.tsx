import React from 'react';
import { cn } from '../../utils/cn';

interface KpiCardProps {
  title: string;
  value: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  subtitleColor?: string;
  badge?: React.ReactNode;
  className?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  subtitleColor = 'text-slate-600 dark:text-slate-300',
  badge,
  className = '',
}) => {
  return (
    <div
      className={cn(
        'p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] shadow-xs transition-colors flex flex-col justify-between h-full min-h-[105px] sm:min-h-[120px]',
        className
      )}
    >
      <div className="flex items-center justify-between gap-1.5 mb-1 sm:mb-1.5">
        <span className="text-[11px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 break-words leading-tight">
          {title}
        </span>
        {badge}
      </div>

      <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white font-serif tracking-tight leading-tight my-1 sm:my-1.5 break-words">
        {value}
      </div>

      {subtitle && (
        <div className={cn('flex items-start gap-1.5 text-[11px] sm:text-xs font-medium leading-snug mt-1 sm:mt-1.5 min-w-0 break-words', subtitleColor)}>
          {icon && <span className="shrink-0 mt-0.5">{icon}</span>}
          <div className="min-w-0 flex-1 break-words">{subtitle}</div>
        </div>
      )}
    </div>
  );
};

export const KpiGrid: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return (
    <div className={cn('grid grid-cols-1 min-[440px]:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 lg:gap-6', className)}>
      {children}
    </div>
  );
};

import React from 'react';
import { cn } from '../../../utils/cn';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  variant?: 'rectangular' | 'rounded' | 'circular';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'rounded',
  ...props
}) => {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'animate-pulse bg-slate-200/80 dark:bg-[#102444]/60 border border-slate-300/30 dark:border-[#143564]/40 motion-reduce:animate-none select-none pointer-events-none',
        variant === 'circular' && 'rounded-full',
        variant === 'rounded' && 'rounded-xl',
        variant === 'rectangular' && 'rounded-none',
        className
      )}
      {...props}
    />
  );
};

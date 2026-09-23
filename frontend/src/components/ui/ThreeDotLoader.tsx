import React from 'react';

interface ThreeDotLoaderProps {
  label?: string;
  accessibleText?: string;
  className?: string;
}

export const ThreeDotLoader: React.FC<ThreeDotLoaderProps> = ({
  label,
  accessibleText = 'Verifying Judicial Session...',
  className = '',
}) => {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center select-none ${className}`}
    >
      {/* 3-Dot Sequential Harmonic Wave */}
      <div className="flex items-center gap-2" aria-hidden="true">
        <span
          className="w-1.5 h-1.5 rounded-full bg-[#c19b48] dark:bg-[#e8cf8d] animate-ai-dot"
          style={{ animationDelay: '0s' }}
        />
        <span
          className="w-1.5 h-1.5 rounded-full bg-[#c19b48] dark:bg-[#e8cf8d] animate-ai-dot"
          style={{ animationDelay: '0.18s' }}
        />
        <span
          className="w-1.5 h-1.5 rounded-full bg-[#c19b48] dark:bg-[#e8cf8d] animate-ai-dot"
          style={{ animationDelay: '0.36s' }}
        />
      </div>

      {/* Optional Visible Label */}
      {label && (
        <span className="mt-4 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-[#c19b48] dark:text-[#e8cf8d] font-sans antialiased text-center">
          {label}
        </span>
      )}

      {/* Screen Reader Announcement */}
      <span className="sr-only">{label || accessibleText}</span>
    </div>
  );
};

export default ThreeDotLoader;

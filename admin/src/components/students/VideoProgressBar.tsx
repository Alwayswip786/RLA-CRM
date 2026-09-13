import React from 'react';
import { AlertCircle, CheckCircle2, Play } from 'lucide-react';
import { cn } from '../../utils/cn';

interface VideoProgressBarProps {
  percentage: number;
  timestampText: string;
  totalDuration?: string;
  status: 'completed' | 'in_progress' | 'not_started';
  skipAlert?: boolean;
  className?: string;
  showDetails?: boolean;
}

export const VideoProgressBar: React.FC<VideoProgressBarProps> = ({
  percentage,
  timestampText,
  status,
  skipAlert,
  className,
  showDetails = true,
}) => {
  // Clamp between 0 and 100
  const clampedPercentage = Math.min(Math.max(percentage, 0), 100);

  // Status color logic
  const getBarColor = () => {
    if (status === 'completed' || clampedPercentage >= 95) return 'bg-[#34D399]';
    if (status === 'in_progress') return 'bg-[#C19B48]';
    return 'bg-[#3D3D3D]';
  };

  const getStatusBadge = () => {
    if (status === 'completed' || clampedPercentage >= 95) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#34D399] bg-[#34D399]/15 border border-[#34D399]/30 px-2 py-0.5 rounded-full">
          <CheckCircle2 className="w-3 h-3" />
          Completed
        </span>
      );
    }
    if (status === 'in_progress') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#E8CF8D] bg-[#C19B48]/15 border border-[#C19B48]/30 px-2 py-0.5 rounded-full">
          <Play className="w-2.5 h-2.5 fill-[#E8CF8D]" />
          {clampedPercentage}% Watched
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#A8A294] bg-[#262626] border border-[#3D3D3D] px-2 py-0.5 rounded-full">
        Unwatched
      </span>
    );
  };

  return (
    <div className={cn('space-y-1.5 min-w-[140px]', className)}>
      {showDetails && (
        <div className="flex items-center justify-between text-xs gap-2">
          <div className="font-mono text-[11px] text-[#F7F3E6] flex items-center gap-1">
            <span className={status === 'in_progress' ? 'text-[#C19B48] font-bold' : ''}>
              {timestampText}
            </span>
          </div>
          {getStatusBadge()}
        </div>
      )}

      {/* Progress Track */}
      <div className="h-2 w-full bg-[#262626] rounded-full overflow-hidden border border-[#3D3D3D] relative">
        <div
          className={cn('h-full transition-all duration-300 rounded-full', getBarColor())}
          style={{ width: `${clampedPercentage}%` }}
        />
      </div>

      {skipAlert && (
        <div className="flex items-center gap-1 text-[10px] text-[#F59E0B] pt-0.5">
          <AlertCircle className="w-3 h-3 shrink-0" />
          <span>Scrubbing / fast-forward detected</span>
        </div>
      )}
    </div>
  );
};

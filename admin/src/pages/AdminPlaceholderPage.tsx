import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, Plus, Construction } from 'lucide-react';

interface AdminPlaceholderPageProps {
  title: string;
  category: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const AdminPlaceholderPage: React.FC<AdminPlaceholderPageProps> = ({
  title,
  category,
  description,
  actionLabel,
  onAction,
}) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 select-none">
      {/* Header bar */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/')}
              className="p-1.5 rounded-lg bg-[#262626] hover:bg-[#2F2F2F] text-[#A8A294] hover:text-[#F7F3E6] border border-[#3D3D3D] transition-colors cursor-pointer"
              title="Back to Command Center"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#C19B48] px-2 py-0.5 rounded bg-[#C19B48]/10 border border-[#C19B48]/30">
              {category}
            </span>
          </div>
          <h1 className="font-serif text-2xl font-bold text-[#F7F3E6]">{title}</h1>
          <p className="text-xs text-[#A8A294] max-w-2xl leading-relaxed">{description}</p>
        </div>

        {actionLabel && (
          <button
            onClick={onAction}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C19B48] hover:bg-[#D8B862] text-[#1E1E1E] text-xs font-bold transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>{actionLabel}</span>
          </button>
        )}
      </div>

      {/* Workspace Area Preview */}
      <div className="p-12 rounded-2xl bg-[#1E1E1E] border border-dashed border-[#3D3D3D] flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-[#262626] border border-[#C19B48]/30 flex items-center justify-center text-[#C19B48]">
          <Construction className="w-7 h-7" />
        </div>
        <div className="space-y-1 max-w-md">
          <h3 className="font-serif text-lg font-bold text-[#F7F3E6]">
            {title} Module Active
          </h3>
          <p className="text-xs text-[#A8A294] leading-relaxed">
            This administrative chamber is mapped to the Student Classroom Portal. Full dataset tables, forms, and filtering controls are ready to be expanded.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#C19B48]">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Synchronized with Academy Database</span>
        </div>
      </div>
    </div>
  );
};

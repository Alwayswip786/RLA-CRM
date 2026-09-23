import React, { useState } from 'react';
import { CheckCircle2, Bell, Loader2 } from 'lucide-react';
import { toast } from '../../lib/toast';
import { toggleClassAlert } from '../../services/timetable.service';

interface ClassAlertButtonProps {
  slotId: string;
  subject: string;
  dayOfWeek: string;
  isAlertSet: boolean;
  batchId?: string;
  onToggled?: (newStatus: boolean) => void;
}

export const ClassAlertButton: React.FC<ClassAlertButtonProps> = ({
  slotId,
  subject,
  dayOfWeek,
  isAlertSet: initialAlertSet,
  batchId,
  onToggled,
}) => {
  const [isAlertSet, setIsAlertSet] = useState(initialAlertSet);
  const [loading, setLoading] = useState(false);

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setLoading(true);
      const res = await toggleClassAlert(slotId, batchId);
      if (res.success) {
        setIsAlertSet(res.isAlertSet);
        if (res.isAlertSet) {
          toast.success(`Lecture reminder set for ${subject} (${dayOfWeek})`);
        } else {
          toast.info(`Lecture reminder removed for ${subject}`);
        }
        if (onToggled) onToggled(res.isAlertSet);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update alert preference.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading}
      className={`mt-1 px-3 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50 ${
        isAlertSet
          ? 'bg-[#c19b48] text-[#061120] border-[#c19b48] font-bold shadow-xs'
          : 'bg-slate-100 dark:bg-[#061120] hover:bg-[#c19b48] hover:text-[#061120] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-[#143564]'
      }`}
      title={isAlertSet ? 'Reminder is Active (Click to remove)' : 'Set Lecture Reminder'}
    >
      {loading ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : isAlertSet ? (
        <CheckCircle2 className="w-3 h-3 text-[#061120]" />
      ) : (
        <Bell className="w-3 h-3 text-[#c19b48]" />
      )}
      <span>{isAlertSet ? 'Alert Set' : 'Set Alert'}</span>
    </button>
  );
};

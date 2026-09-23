import { apiClient } from '../lib/apiClient';
import type {
  TimetableApiResponse,
  UpcomingClassResponse,
  DayOfWeek,
} from '../types/timetable.types';

/**
 * Fetch resolved day-wise schedule for student's assigned batch and chosen shift
 */
export const fetchMySchedule = async (params: {
  dayOfWeek?: DayOfWeek;
  shiftId?: string;
  dateIST?: string;
} = {}): Promise<TimetableApiResponse> => {
  const query = new URLSearchParams();
  if (params.dayOfWeek) query.append('dayOfWeek', params.dayOfWeek);
  if (params.shiftId) query.append('shiftId', params.shiftId);
  if (params.dateIST) query.append('dateIST', params.dateIST);

  const res = await apiClient.get<TimetableApiResponse>(`/timetable/my-schedule?${query.toString()}`);
  return res.data;
};

/**
 * Switch student's preferred active shift (e.g. Morning -> Evening)
 */
export const switchActiveShift = async (
  shiftId: string
): Promise<{ success: boolean; activeShiftId: string; message: string }> => {
  const res = await apiClient.post<{ success: boolean; activeShiftId: string; message: string }>(
    '/timetable/switch-shift',
    { shiftId }
  );
  return res.data;
};

/**
 * Toggle notification alert for a specific lecture slot
 */
export const toggleClassAlert = async (
  slotId: string,
  batchId?: string
): Promise<{ success: boolean; isAlertSet: boolean; message: string }> => {
  const res = await apiClient.post<{ success: boolean; isAlertSet: boolean; message: string }>(
    '/timetable/alerts/toggle',
    { slotId, batchId }
  );
  return res.data;
};

/**
 * Fetch next upcoming class today
 */
export const fetchUpcomingClass = async (): Promise<UpcomingClassResponse> => {
  const res = await apiClient.get<UpcomingClassResponse>('/timetable/upcoming');
  return res.data;
};

/**
 * Download RFC-5545 iCalendar (.ics) stream for batch timetable
 */
export const downloadIcalSchedule = async (shiftId?: string): Promise<void> => {
  const query = shiftId ? `?shiftId=${shiftId}` : '';
  const res = await apiClient.get(`/timetable/export/ical${query}`, {
    responseType: 'blob',
  });

  const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/calendar' }));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `rla-academic-schedule-${shiftId || 'batch'}.ics`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

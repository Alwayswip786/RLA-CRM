import apiClient from '../lib/apiClient';
import type {
  AdminWeeklyGridResponse,
  AdminBatch,
  AdminRoom,
  AdminSlot,
  ConflictCheckResult,
  CreateSlotPayload,
  CreateOverridePayload,
} from '../types/timetable.types';

/**
 * Fetch weekly matrix grid for batch and shift
 */
export const fetchWeeklyGridAdmin = async (
  batchId?: string,
  shiftId?: string
): Promise<AdminWeeklyGridResponse> => {
  const query = new URLSearchParams();
  if (batchId) query.append('batchId', batchId);
  if (shiftId) query.append('shiftId', shiftId);

  const res = await apiClient.get<AdminWeeklyGridResponse>(`/timetable/admin/grid?${query.toString()}`);
  return res.data;
};

/**
 * Fetch all batches
 */
export const fetchAllBatchesAdmin = async (): Promise<{
  success: boolean;
  batches: AdminBatch[];
}> => {
  const res = await apiClient.get<{ success: boolean; batches: AdminBatch[] }>('/timetable/admin/batches');
  return res.data;
};

/**
 * Fetch all classroom chambers
 */
export const fetchAllRoomsAdmin = async (): Promise<{
  success: boolean;
  rooms: AdminRoom[];
}> => {
  const res = await apiClient.get<{ success: boolean; rooms: AdminRoom[] }>('/timetable/admin/rooms');
  return res.data;
};

/**
 * Real-time conflict checker
 */
export const checkConflictsAdmin = async (payload: {
  batchId: string;
  shiftId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  facultyId?: string;
  roomId?: string;
  excludeSlotId?: string;
}): Promise<ConflictCheckResult> => {
  const res = await apiClient.post<ConflictCheckResult>('/timetable/admin/check-conflicts', payload);
  return res.data;
};

/**
 * Create a new recurring lecture slot
 */
export const createSlotAdmin = async (
  payload: CreateSlotPayload
): Promise<{ success: boolean; message: string; slot: AdminSlot }> => {
  const res = await apiClient.post<{ success: boolean; message: string; slot: AdminSlot }>(
    '/timetable/admin/slots',
    payload
  );
  return res.data;
};

/**
 * Update recurring lecture slot
 */
export const updateSlotAdmin = async (
  id: string,
  payload: Partial<CreateSlotPayload>
): Promise<{ success: boolean; message: string; slot: AdminSlot }> => {
  const res = await apiClient.put<{ success: boolean; message: string; slot: AdminSlot }>(
    `/timetable/admin/slots/${id}`,
    payload
  );
  return res.data;
};

/**
 * Delete recurring slot
 */
export const deleteSlotAdmin = async (
  id: string
): Promise<{ success: boolean; message: string }> => {
  const res = await apiClient.delete<{ success: boolean; message: string }>(
    `/timetable/admin/slots/${id}`
  );
  return res.data;
};

/**
 * Create date-specific schedule override (reschedule, cancel, holiday)
 */
export const createOverrideAdmin = async (
  payload: CreateOverridePayload
): Promise<{ success: boolean; message: string; override: any }> => {
  const res = await apiClient.post<{ success: boolean; message: string; override: any }>(
    '/timetable/admin/overrides',
    payload
  );
  return res.data;
};

/**
 * Remove an override
 */
export const deleteOverrideAdmin = async (
  id: string
): Promise<{ success: boolean; message: string }> => {
  const res = await apiClient.delete<{ success: boolean; message: string }>(
    `/timetable/admin/overrides/${id}`
  );
  return res.data;
};

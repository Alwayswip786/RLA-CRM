import apiClient from './apiClient';
import type {
  StudentRecord,
  CourseMetricSummary,
  AcademySummaryMetricsDto,
  TelemetryKPIsDto,
  FlattenedTelemetryLog,
} from '../types/student-directory';

export interface StudentRosterParams {
  page?: number;
  limit?: number;
  search?: string;
  courseId?: string;
  batchShift?: string;
  progressFilter?: string;
  statusFilter?: string;
}

export interface StudentRosterResponse {
  students: StudentRecord[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface VideoTelemetryLogsParams {
  page?: number;
  limit?: number;
  search?: string;
  subject?: string;
  status?: string;
}

export interface VideoTelemetryLogsResponse {
  logs: FlattenedTelemetryLog[];
  totalCount: number;
  page: number;
  limit: number;
}

export const adminStudentApi = {
  // 1. Academy Aggregate KPIs
  getAcademySummaryMetrics: async (): Promise<AcademySummaryMetricsDto> => {
    const res = await apiClient.get('/admin/students/metrics/summary');
    return res.data.data;
  },

  // 2. Course-level metrics for cohort tabs and grouped view
  getCourseMetrics: async (): Promise<CourseMetricSummary[]> => {
    const res = await apiClient.get('/admin/students/metrics/courses');
    return res.data.data;
  },

  // 3. Student Roster (with filters and pagination)
  getStudentRoster: async (params?: StudentRosterParams): Promise<StudentRosterResponse> => {
    const res = await apiClient.get('/admin/students/roster', { params });
    return res.data.data;
  },

  // 4. Student Dossier for Drawer
  getStudentDossier: async (studentId: string): Promise<StudentRecord> => {
    const res = await apiClient.get(`/admin/students/${studentId}/dossier`);
    return res.data.data;
  },

  // 5. Revoke student device sessions
  revokeStudentSessions: async (studentId: string): Promise<{ message: string }> => {
    const res = await apiClient.post(`/admin/students/${studentId}/revoke-sessions`);
    return res.data;
  },

  // 6. Video Telemetry KPIs
  getVideoTelemetryKPIs: async (): Promise<TelemetryKPIsDto> => {
    const res = await apiClient.get('/admin/students/video-telemetry/kpis');
    return res.data.data;
  },

  // 7. Video Telemetry Playback Logs
  getVideoTelemetryLogs: async (params?: VideoTelemetryLogsParams): Promise<VideoTelemetryLogsResponse> => {
    const res = await apiClient.get('/admin/students/video-telemetry/logs', { params });
    return res.data.data;
  },

  // 8. Download Student Roster CSV
  downloadStudentRosterCsv: async () => {
    const res = await apiClient.get('/admin/students/export/csv', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `student_roster_metrics_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  // 9. Download Video Telemetry CSV
  downloadVideoTelemetryCsv: async () => {
    const res = await apiClient.get('/admin/students/video-telemetry/export/csv', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `video_playback_telemetry_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

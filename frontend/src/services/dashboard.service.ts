import { apiClient } from '../lib/apiClient';

export interface DashboardAttendanceMetric {
  percentage: number;
  percentageFormatted: string;
  isEligible: boolean;
  statusText: string;
  isNewStudent: boolean;
}

export interface DashboardMainsMetric {
  evaluatedCopies: number;
  evaluatedCopiesFormatted: string;
  pendingCopies: number;
  averageScore: number;
  lastScore: number;
  subtitle: string;
  hasSubmissions: boolean;
}

export interface DashboardPrelimsMetric {
  accuracy: number;
  accuracyFormatted: string;
  cohortRank: number | null;
  rankFormatted: string | null;
  subtitle: string;
  hasAttempts: boolean;
  totalAttempts: number;
}

export interface DashboardBareActsMetric {
  coveredCount: number;
  totalCount: number;
  displayValue: string;
  acronyms: string[];
  subtitle: string;
  hasPracticed: boolean;
}

export interface DashboardKpiMetricsData {
  attendance: DashboardAttendanceMetric;
  mains: DashboardMainsMetric;
  prelims: DashboardPrelimsMetric;
  bareActs: DashboardBareActsMetric;
}

export interface DashboardKpiMetricsResponse {
  success: boolean;
  data: DashboardKpiMetricsData;
}

/**
 * Fetch dynamic 4-KPI performance metrics for the authenticated student
 */
export const fetchDashboardKpiMetrics = async (): Promise<DashboardKpiMetricsData> => {
  const res = await apiClient.get<DashboardKpiMetricsResponse>('/dashboard/kpi-metrics');
  return res.data.data;
};

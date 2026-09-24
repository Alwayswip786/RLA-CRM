import { apiClient, getAccessToken } from '../lib/apiClient';
import type {
  MainsActiveQuestionResponse,
  MySubmissionsResponse,
  ChallengeArchiveResponse,
  MainsAutopsyResponse,
  MainsSubmission,
} from '../types/mains.types';

/**
 * Fetch today's active Mains Question, student's submission & streak
 */
export const fetchTodayChallenge = async (): Promise<MainsActiveQuestionResponse> => {
  const res = await apiClient.get<MainsActiveQuestionResponse>('/mains/questions/today');
  return res.data;
};

/**
 * Backward-compatible alias
 */
export const fetchActiveQuestion = fetchTodayChallenge;

/**
 * Fetch archive of past daily mains challenges
 */
export const fetchChallengeArchive = async (params?: {
  paper?: string;
  subject?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<ChallengeArchiveResponse> => {
  const query = new URLSearchParams();
  if (params?.paper && params.paper !== 'all') query.append('paper', params.paper);
  if (params?.subject && params.subject !== 'all') query.append('subject', params.subject);
  if (params?.search && params.search.trim()) query.append('search', params.search.trim());
  if (params?.page) query.append('page', String(params.page));
  if (params?.limit) query.append('limit', String(params.limit));

  const res = await apiClient.get<ChallengeArchiveResponse>(`/mains/questions/archive?${query.toString()}`);
  return res.data;
};

/**
 * Fetch single challenge details
 */
export const fetchQuestionById = async (id: string): Promise<MainsActiveQuestionResponse> => {
  const res = await apiClient.get<MainsActiveQuestionResponse>(`/mains/questions/${id}`);
  return res.data;
};

/**
 * Upload student answer sheet (single PDF or multiple images)
 */
export const submitAnswerCopy = async (
  questionId: string,
  files: File | File[],
  notes?: string,
  onProgress?: (percent: number) => void
): Promise<{
  success: boolean;
  submission: MainsSubmission;
  isReplacement?: boolean;
  version?: number;
  isLate?: boolean;
  message: string;
}> => {
  const formData = new FormData();
  formData.append('questionId', questionId);
  if (notes) formData.append('notes', notes);

  if (Array.isArray(files)) {
    if (files.length === 1 && files[0]?.type === 'application/pdf') {
      formData.append('pdf', files[0]);
    } else {
      files.forEach((file) => {
        if (file.type === 'application/pdf') {
          formData.append('pdf', file);
        } else {
          formData.append('images', file);
        }
      });
    }
  } else {
    if (files.type === 'application/pdf') {
      formData.append('pdf', files);
    } else {
      formData.append('images', files);
    }
  }

  const res = await apiClient.post<{
    success: boolean;
    submission: MainsSubmission;
    isReplacement?: boolean;
    version?: number;
    isLate?: boolean;
    message: string;
  }>('/mains/submissions', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress?.(percent);
      }
    },
  });

  return res.data;
};

/**
 * Fetch student's own submissions (Evaluated Copies or Pending)
 */
export const fetchMySubmissions = async (
  status?: string
): Promise<MySubmissionsResponse> => {
  const url = status && status !== 'all' ? `/mains/submissions/my?status=${status}` : '/mains/submissions/my';
  const res = await apiClient.get<MySubmissionsResponse>(url);
  return res.data;
};

/**
 * Fetch comparative autopsy for an evaluated copy
 */
export const fetchSubmissionAutopsy = async (id: string): Promise<MainsAutopsyResponse> => {
  const res = await apiClient.get<MainsAutopsyResponse>(`/mains/submissions/${id}/autopsy`);
  return res.data;
};

/**
 * Download or stream submitted answer copy or faculty marked PDF
 */
export const downloadSubmissionPdf = async (
  id: string,
  type: 'student' | 'evaluated' = 'student',
  filename: string = 'mains_copy.pdf'
): Promise<void> => {
  const res = await apiClient.get(`/mains/submissions/${id}/pdf?type=${type}`, {
    responseType: 'blob',
  });

  const blob = new Blob([res.data], {
    type: filename.endsWith('.png') || filename.endsWith('.jpg') ? 'image/jpeg' : 'application/pdf',
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

/**
 * Fetch submitted answer copy or faculty marked copy as Blob for in-app PDF viewer
 */
export const fetchSubmissionPdfBlob = async (
  id: string,
  type: 'student' | 'evaluated' = 'student',
  fileIndex: number = 0
): Promise<Blob> => {
  const res = await apiClient.get(`/mains/submissions/${id}/pdf?type=${type}&fileIndex=${fileIndex}`, {
    responseType: 'blob',
  });
  return new Blob([res.data], { type: 'application/pdf' });
};

/**
 * Get direct stream URL for in-app PDF/image preview
 */
export const getSubmissionPdfStreamUrl = (
  id: string,
  type: 'student' | 'evaluated' = 'student',
  fileIndex: number = 0
): string => {
  const token = getAccessToken();
  return `${apiClient.defaults.baseURL}/mains/submissions/${id}/pdf?type=${type}&fileIndex=${fileIndex}&token=${token || ''}`;
};

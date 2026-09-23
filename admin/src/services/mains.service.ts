import apiClient from '../lib/apiClient';
import type {
  PendingSubmissionsResponse,
  GradedSubmissionsResponse,
  AllQuestionsResponse,
  MainsSubmissionAdmin,
  MainsQuestionAdmin,
  EvaluatePayload,
  ScheduleQuestionPayload,
} from '../types/mains.types';

/**
 * Fetch pending answer copies in evaluation inbox (filterable by questionId and search)
 */
export const fetchPendingSubmissions = async (
  questionId?: string,
  search?: string
): Promise<PendingSubmissionsResponse> => {
  const query = new URLSearchParams();
  if (questionId && questionId !== 'all') query.append('questionId', questionId);
  if (search && search.trim()) query.append('search', search.trim());

  const res = await apiClient.get<PendingSubmissionsResponse>(
    `/mains/admin/submissions/pending?${query.toString()}`
  );
  return res.data;
};

/**
 * Lock/claim submission for evaluation
 */
export const claimSubmission = async (
  id: string
): Promise<{ success: boolean; submission: MainsSubmissionAdmin; message: string }> => {
  const res = await apiClient.post<{ success: boolean; submission: MainsSubmissionAdmin; message: string }>(
    `/mains/admin/submissions/${id}/claim`
  );
  return res.data;
};

/**
 * Submit faculty score, rubrics, remarks, and optional annotated copy
 */
export const evaluateSubmission = async (
  id: string,
  payload: EvaluatePayload,
  evaluatedPdfFile?: File
): Promise<{ success: boolean; submission: MainsSubmissionAdmin; message: string }> => {
  const formData = new FormData();
  formData.append('score', String(payload.score));
  formData.append('remarks', payload.remarks);
  if (payload.rubricBreakdown) {
    formData.append('rubricBreakdown', JSON.stringify(payload.rubricBreakdown));
  }
  if (payload.strengths) formData.append('strengths', payload.strengths);
  if (payload.mistakes) formData.append('mistakes', payload.mistakes);
  if (payload.improvementPoints) formData.append('improvementPoints', payload.improvementPoints);
  if (payload.needsWork) formData.append('needsWork', payload.needsWork);
  if (evaluatedPdfFile) formData.append('pdf', evaluatedPdfFile);

  const res = await apiClient.post<{ success: boolean; submission: MainsSubmissionAdmin; message: string }>(
    `/mains/admin/submissions/${id}/evaluate`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return res.data;
};

/**
 * Fetch historical archive of graded answer sheets
 */
export const fetchGradedSubmissions = async (
  search?: string,
  questionId?: string
): Promise<GradedSubmissionsResponse> => {
  const query = new URLSearchParams();
  if (search && search.trim()) query.append('search', search.trim());
  if (questionId && questionId !== 'all') query.append('questionId', questionId);

  const res = await apiClient.get<GradedSubmissionsResponse>(
    `/mains/admin/submissions/graded?${query.toString()}`
  );
  return res.data;
};

/**
 * Fetch all questions in question bank
 */
export const fetchAllQuestions = async (): Promise<AllQuestionsResponse> => {
  const res = await apiClient.get<AllQuestionsResponse>('/mains/admin/questions');
  return res.data;
};

/**
 * Create a new scheduled Daily Mains Question
 */
export const createQuestion = async (
  payload: ScheduleQuestionPayload,
  modelAnswerPdf?: File
): Promise<{ success: boolean; question: MainsQuestionAdmin; message: string }> => {
  const formData = new FormData();
  if (payload.challengeNumber) formData.append('challengeNumber', String(payload.challengeNumber));
  if (payload.questionCode) formData.append('questionCode', payload.questionCode);
  formData.append('paper', payload.paper);
  formData.append('title', payload.title);
  formData.append('subject', payload.subject);
  if (payload.targetExam) formData.append('targetExam', payload.targetExam);
  if (payload.challengeDate) formData.append('challengeDate', payload.challengeDate);
  if (payload.submissionDeadline) formData.append('submissionDeadline', payload.submissionDeadline);
  formData.append('marks', String(payload.marks));
  formData.append('wordLimit', String(payload.wordLimit));
  if (payload.turnaroundHours) formData.append('turnaroundHours', String(payload.turnaroundHours));
  if (payload.evaluatorName) formData.append('evaluatorName', payload.evaluatorName);
  if (payload.guidelines) formData.append('guidelines', JSON.stringify(payload.guidelines));
  if (payload.modelAnswer) formData.append('modelAnswer', payload.modelAnswer);
  if (payload.isModelAnswerPublished !== undefined) {
    formData.append('isModelAnswerPublished', String(payload.isModelAnswerPublished));
  }
  if (payload.status) formData.append('status', payload.status);
  if (payload.isActive !== undefined) formData.append('isActive', String(payload.isActive));
  if (modelAnswerPdf) formData.append('modelAnswerPdf', modelAnswerPdf);

  const res = await apiClient.post<{ success: boolean; question: MainsQuestionAdmin; message: string }>(
    '/mains/admin/questions',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return res.data;
};

/**
 * Update an existing question
 */
export const updateQuestion = async (
  id: string,
  payload: Partial<ScheduleQuestionPayload>,
  modelAnswerPdf?: File
): Promise<{ success: boolean; question: MainsQuestionAdmin; message: string }> => {
  const formData = new FormData();
  if (payload.challengeNumber !== undefined) formData.append('challengeNumber', String(payload.challengeNumber));
  if (payload.questionCode) formData.append('questionCode', payload.questionCode);
  if (payload.paper) formData.append('paper', payload.paper);
  if (payload.title) formData.append('title', payload.title);
  if (payload.subject) formData.append('subject', payload.subject);
  if (payload.targetExam) formData.append('targetExam', payload.targetExam);
  if (payload.challengeDate) formData.append('challengeDate', payload.challengeDate);
  if (payload.submissionDeadline) formData.append('submissionDeadline', payload.submissionDeadline);
  if (payload.marks !== undefined) formData.append('marks', String(payload.marks));
  if (payload.wordLimit !== undefined) formData.append('wordLimit', String(payload.wordLimit));
  if (payload.turnaroundHours !== undefined) formData.append('turnaroundHours', String(payload.turnaroundHours));
  if (payload.evaluatorName) formData.append('evaluatorName', payload.evaluatorName);
  if (payload.guidelines) formData.append('guidelines', JSON.stringify(payload.guidelines));
  if (payload.modelAnswer !== undefined) formData.append('modelAnswer', payload.modelAnswer);
  if (payload.isModelAnswerPublished !== undefined) {
    formData.append('isModelAnswerPublished', String(payload.isModelAnswerPublished));
  }
  if (payload.status) formData.append('status', payload.status);
  if (payload.isActive !== undefined) formData.append('isActive', String(payload.isActive));
  if (modelAnswerPdf) formData.append('modelAnswerPdf', modelAnswerPdf);

  const res = await apiClient.put<{ success: boolean; question: MainsQuestionAdmin; message: string }>(
    `/mains/admin/questions/${id}`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return res.data;
};

/**
 * Archive/delete question
 */
export const deleteQuestion = async (
  id: string
): Promise<{ success: boolean; message: string }> => {
  const res = await apiClient.delete<{ success: boolean; message: string }>(`/mains/admin/questions/${id}`);
  return res.data;
};

/**
 * Download or stream copy PDF
 */
export const downloadCopyPdf = async (
  id: string,
  type: 'student' | 'evaluated' = 'student',
  filename: string = 'copy.pdf'
): Promise<void> => {
  const res = await apiClient.get(`/mains/submissions/${id}/pdf?type=${type}`, {
    responseType: 'blob',
  });

  const blob = new Blob([res.data], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

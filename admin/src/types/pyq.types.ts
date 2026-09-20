export type JudicialExam =
  | 'Delhi Judicial Service (DJS)'
  | 'Delhi Higher Judicial Service (DHJS)'
  | 'Haryana Civil Services (Judicial)'
  | 'UP PCS-J Judicial Examination'
  | 'UP Higher Judicial Service (UP HJS)'
  | 'MP Civil Judge (MP CJ)'
  | 'Rajasthan Judicial Service (RJS)'
  | 'Himachal Pradesh Judicial Service (HPJS)'
  | 'Punjab Superior Judicial Services (PJS)';

export type ExamStage = 'Prelims' | 'Mains' | 'Interview';

export interface IPdfFileMetadata {
  filename: string;
  originalName: string;
  path: string;
  mimeType: string;
  sizeBytes: number;
  sizeFormatted: string;
  pageCount?: number;
}

export interface PyqPaper {
  _id: string;
  id?: string;
  title: string;
  exam: string;
  year: number;
  stage: ExamStage;
  subject: string;
  paperCode?: string;
  totalMarks: number;
  durationMinutes?: number;
  description: string;
  topics: string[];
  solvedByFaculty: string;
  modelAnswersIncluded: boolean;
  solutionsProvided: boolean;
  pdfFile: IPdfFileMetadata;
  thumbnail?: {
    filename: string;
    originalName: string;
    path: string;
    mimeType: string;
    sizeBytes: number;
  };
  isPublished: boolean;
  publishedAt?: string;
  downloadCount: number;
  viewCount: number;
  isFeatured: boolean;
  uploadedBy?: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PyqAdminStats {
  totalPapers: number;
  publishedCount: number;
  draftCount: number;
  totalDownloads: number;
  totalViews: number;
}

export interface PyqAdminFilterParams {
  exam?: string;
  year?: string;
  stage?: string;
  status?: 'all' | 'published' | 'draft';
  search?: string;
  sort?: 'newest' | 'year_desc' | 'year_asc' | 'popular' | 'title_asc';
  page?: number;
  limit?: number;
}

export interface PyqAdminResponse {
  success: boolean;
  stats: PyqAdminStats;
  count: number;
  total: number;
  page: number;
  totalPages: number;
  pyqs: PyqPaper[];
}

export interface CreatePyqPayload {
  title: string;
  exam: string;
  year: number;
  stage: ExamStage;
  subject: string;
  paperCode?: string;
  totalMarks?: number;
  durationMinutes?: number;
  description?: string;
  topics?: string[];
  solvedByFaculty?: string;
  isPublished?: boolean;
  isFeatured?: boolean;
}

export interface UpdatePyqPayload {
  title?: string;
  exam?: string;
  year?: number;
  stage?: ExamStage;
  subject?: string;
  paperCode?: string;
  totalMarks?: number;
  durationMinutes?: number;
  description?: string;
  topics?: string[];
  solvedByFaculty?: string;
  isFeatured?: boolean;
}

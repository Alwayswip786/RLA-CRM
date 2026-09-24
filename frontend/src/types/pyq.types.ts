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
  createdAt: string;
  updatedAt: string;
}

export interface PyqFilterParams {
  exam?: string;
  year?: string;
  stage?: string;
  subject?: string;
  search?: string;
  featured?: boolean;
  sort?: 'year_desc' | 'year_asc' | 'popular' | 'newest' | 'title_asc';
  page?: number;
  limit?: number;
}

export interface PyqsResponse {
  success: boolean;
  count: number;
  total: number;
  page: number;
  totalPages: number;
  hasNextPage?: boolean;
  hasMore?: boolean;
  hasPrevPage?: boolean;
  nextPage?: number | null;
  pyqs: PyqPaper[];
}

export interface PyqFilterMetaResponse {
  success: boolean;
  meta: {
    exams: string[];
    years: number[];
    stages: string[];
    subjects: string[];
  };
}

export type CourtCategory =
  | 'Supreme Court of India'
  | 'Delhi High Court'
  | 'Bombay High Court'
  | 'Allahabad High Court'
  | 'Punjab & Haryana High Court'
  | 'Calcutta High Court'
  | 'Madras High Court'
  | 'Other High Courts';

export type JudgementImportance =
  | 'Landmark'
  | 'Leading'
  | 'Recent / Overruling'
  | 'Standard';

export interface IPdfFileMetadata {
  filename: string;
  originalName: string;
  path: string;
  mimeType: string;
  sizeBytes: number;
  sizeFormatted: string;
  pageCount?: number;
}

export interface JudgementDigest {
  _id: string;
  id?: string;
  title: string;
  citation: string;
  court: CourtCategory;
  bench: string;
  judges: string[];
  dateOfJudgement: string;
  year: number;
  subject: string;
  legalProvisions: string[];
  summary: string;
  ratioDecidendi: string[];
  mainsUtility?: string;
  overruledPrecedents?: string;
  tags: string[];
  importance: JudgementImportance;
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

export interface JudgementFilterParams {
  court?: string;
  year?: string;
  subject?: string;
  importance?: string;
  search?: string;
  featured?: boolean;
  sort?: 'date_desc' | 'date_asc' | 'year_desc' | 'popular' | 'newest' | 'title_asc';
  page?: number;
  limit?: number;
}

export interface JudgementsResponse {
  success: boolean;
  count: number;
  total: number;
  page: number;
  totalPages: number;
  judgements: JudgementDigest[];
}

export interface JudgementFilterMetaResponse {
  success: boolean;
  meta: {
    courts: string[];
    years: number[];
    subjects: string[];
    importances: string[];
    totalPublished: number;
  };
}

export interface FeaturedJudgementResponse {
  success: boolean;
  featured: JudgementDigest | null;
}

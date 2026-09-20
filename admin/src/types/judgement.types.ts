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

export interface JudgementAdminStats {
  totalPrecedents: number;
  publishedCount: number;
  draftCount: number;
  totalDownloads: number;
  totalViews: number;
}

export interface JudgementAdminFilterParams {
  court?: string;
  year?: string;
  subject?: string;
  importance?: string;
  status?: 'all' | 'published' | 'draft';
  search?: string;
  sort?: 'newest' | 'date_desc' | 'date_asc' | 'year_desc' | 'popular' | 'title_asc';
  page?: number;
  limit?: number;
}

export interface JudgementAdminResponse {
  success: boolean;
  stats: JudgementAdminStats;
  count: number;
  total: number;
  page: number;
  totalPages: number;
  judgements: JudgementDigest[];
}

export interface CreateJudgementPayload {
  title: string;
  citation: string;
  court: string;
  bench?: string;
  judges?: string[];
  dateOfJudgement: string;
  year?: number;
  subject: string;
  legalProvisions?: string[];
  summary: string;
  ratioDecidendi?: string[];
  mainsUtility?: string;
  overruledPrecedents?: string;
  tags?: string[];
  importance?: JudgementImportance;
  isPublished?: boolean;
  isFeatured?: boolean;
}

export interface UpdateJudgementPayload {
  title?: string;
  citation?: string;
  court?: string;
  bench?: string;
  judges?: string[];
  dateOfJudgement?: string;
  year?: number;
  subject?: string;
  legalProvisions?: string[];
  summary?: string;
  ratioDecidendi?: string[];
  mainsUtility?: string;
  overruledPrecedents?: string;
  tags?: string[];
  importance?: JudgementImportance;
  isFeatured?: boolean;
}

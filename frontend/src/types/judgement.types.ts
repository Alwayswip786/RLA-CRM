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

export type JudgementStatus = 'draft' | 'scheduled' | 'published' | 'archived';

export interface IKeyHolding {
  title: string;
  text: string;
}

export interface ILegalProvisionRef {
  label: string;
  actOrCode?: string;
  badgeColor?: 'amber' | 'blue' | 'emerald' | 'purple' | 'slate';
}

export interface IRelatedCaseRef {
  title: string;
  citation: string;
  relationship?: 'Affirmed' | 'Overruled' | 'Distinguished' | 'Followed';
}

export interface IExamRelevance {
  prelimsFactoids: string[];
  mainsPerspective: string;
  pyqReferences: string[];
}

export interface JudgementDigest {
  _id: string;
  id?: string;
  title: string;
  citation: string;
  court: CourtCategory;
  bench: string;
  benchStrength?: string;
  judges: string[];
  dateOfJudgement: string;
  year: number;
  subject: string;
  category?: string;
  legalProvisions: string[];
  provisions?: ILegalProvisionRef[];
  summary: string;
  ratioDecidendi: string[];
  keyHoldings?: IKeyHolding[];
  fullAnalysis?: string;
  sourceReference?: string;
  mainsUtility?: string;
  overruledPrecedents?: string;
  tags: string[];
  importance: JudgementImportance;
  status?: JudgementStatus;
  dailyDateIST?: string;
  isDailyFeatured?: boolean;
  priority?: number;
  pdfFile?: IPdfFileMetadata;
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
  bookmarkCount?: number;
  isFeatured: boolean;
  relatedCases?: IRelatedCaseRef[];
  examRelevance?: IExamRelevance;
  overruledStatus?: {
    status: string;
    byCase?: string;
    byYear?: number;
  };
  uploadedBy?: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface TodayDailyJudgementResponse {
  success: boolean;
  judgment: JudgementDigest | null;
  isBookmarked: boolean;
  todayIST: string;
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

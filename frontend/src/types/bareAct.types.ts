export type ActCategory =
  | 'New Criminal Laws'
  | 'Major Procedural Act'
  | 'Major Substantive Act'
  | 'Civil & Property Law'
  | 'Commercial & Corporate Law'
  | 'Local & Special Acts';

export type NoteDifficulty = 'Prelims Booster' | 'Mains Analytical' | 'Comprehensive Mastery';

export interface SectionBreakdown {
  sectionNumber: string;
  heading: string;
  keyTakeaway: string;
  pageNumber?: number;
}

export interface IPdfFileMetadata {
  filename: string;
  originalName: string;
  path: string;
  mimeType: string;
  sizeBytes: number;
  sizeFormatted: string;
  pageCount?: number;
}

export interface BareActNote {
  _id: string;
  id?: string;
  actName: string;
  actYear: number;
  actNumber?: string;
  category: ActCategory;
  chapter?: string;
  sectionsCovered: string;
  title: string;
  description: string;
  highlights: string[];
  sectionBreakdown: SectionBreakdown[];
  difficulty: NoteDifficulty;
  author: string;
  tags: string[];
  relatedJudgements?: Array<{
    _id: string;
    title: string;
    citation: string;
    court: string;
    year: number;
    importance?: string;
    summary?: string;
    ratioDecidendi?: string[];
  }>;
  pdfFile: IPdfFileMetadata;
  thumbnail?: {
    filename: string;
    originalName: string;
    path: string;
    mimeType: string;
    sizeBytes: number;
    secureUrl?: string;
  };
  isPublished: boolean;
  publishedAt?: string;
  isFeatured: boolean;
  downloadCount: number;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface BareActFilterParams {
  category?: string;
  actName?: string;
  chapter?: string;
  difficulty?: string;
  search?: string;
  featured?: boolean;
  sort?: 'newest' | 'popular' | 'act_asc' | 'act_desc' | 'year_desc' | 'oldest';
  page?: number;
  limit?: number;
}

export interface BareActsResponse {
  success: boolean;
  count: number;
  total: number;
  totalPages: number;
  page: number;
  notes: BareActNote[];
}

export interface BareActFilterMetaResponse {
  success: boolean;
  acts: string[];
  categories: string[];
  chapters: string[];
  years: number[];
  difficulties: string[];
}

export interface FeaturedBareActResponse {
  success: boolean;
  note: BareActNote | null;
}

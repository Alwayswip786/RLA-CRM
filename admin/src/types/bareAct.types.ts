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
  uploadedBy?: {
    _id: string;
    name: string;
    email: string;
    rollNo?: string;
  };
  lastEditedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface BareActAdminStats {
  totalNotes: number;
  publishedCount: number;
  draftCount: number;
  totalDownloads: number;
  totalViews: number;
  uniqueActs: number;
}

export interface BareActAdminFilterParams {
  category?: string;
  actName?: string;
  status?: 'all' | 'published' | 'draft';
  search?: string;
  sort?: 'newest' | 'oldest' | 'popular' | 'act_asc' | 'act_desc';
  page?: number;
  limit?: number;
}

export interface BareActAdminResponse {
  success: boolean;
  stats: BareActAdminStats;
  count: number;
  total: number;
  page: number;
  totalPages: number;
  notes: BareActNote[];
}

export interface UpdateBareActPayload {
  actName?: string;
  actYear?: number;
  actNumber?: string;
  category?: ActCategory;
  chapter?: string;
  sectionsCovered?: string;
  title?: string;
  description?: string;
  highlights?: string[];
  sectionBreakdown?: SectionBreakdown[];
  difficulty?: NoteDifficulty;
  author?: string;
  tags?: string[];
  relatedJudgements?: string[];
  isPublished?: boolean;
  isFeatured?: boolean;
  pageCount?: number;
}

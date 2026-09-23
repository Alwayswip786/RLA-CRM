export type DigestContentType =
  | 'Supreme Court Ruling'
  | 'High Court Ruling'
  | 'Legal Maxim'
  | 'Legislative Amendment'
  | 'Bare Act Update'
  | 'Exam Insight';

export type DigestStatus = 'draft' | 'scheduled' | 'published' | 'archived';

export interface IDigestItem {
  itemId: string;
  contentType: DigestContentType;
  categoryBadge: string;
  badgeColor?: 'amber' | 'blue' | 'emerald' | 'purple' | 'rose' | 'slate';
  subject: string;
  title: string;
  citation?: string;
  bench?: string;
  court?: string;
  date?: string;
  summary: string;
  fullText?: string;
  examinationTip: string;
  legalProvisions?: Array<{
    sectionOrArticle: string;
    actOrCode?: string;
  }>;
  tags?: string[];
  sourceReference?: string;
  sourceUrl?: string;
  pdfFile?: {
    filename: string;
    originalName: string;
    path: string;
    mimeType: string;
    sizeBytes: number;
    sizeFormatted: string;
  };
  relatedJudgementId?: string;
  relatedMainsId?: string;
  order: number;
}

export interface IFeaturedMaxim {
  latinText: string;
  englishMeaning: string;
  jurisprudenceContext: string;
  relevantProvisions?: string[];
  subject?: string;
}

export interface DailyLegalDigestEdition {
  _id: string;
  editionDateIST: string;
  editionNumber: number;
  title: string;
  subtitle: string;
  curatedBy: string;
  featuredMaxim: IFeaturedMaxim;
  items: IDigestItem[];
  status: DigestStatus;
  isPublished: boolean;
  scheduledPublishAt?: string;
  publishedAt?: string;
  compiledPdf?: {
    filename: string;
    originalName: string;
    path: string;
    mimeType: string;
    sizeBytes: number;
    sizeFormatted: string;
  };
  totalReadsCount: number;
  totalBookmarksCount: number;
  authorName: string;
  createdAt: string;
  updatedAt: string;
}

export interface DailyDigestAdminStats {
  totalEditions: number;
  publishedCount: number;
  draftCount: number;
  scheduledCount: number;
  totalReads: number;
  totalBookmarks: number;
}

export interface DailyDigestAdminResponse {
  success: boolean;
  stats: DailyDigestAdminStats;
  count: number;
  total: number;
  page: number;
  totalPages: number;
  editions: DailyLegalDigestEdition[];
}

export interface DailyDigestAdminFilterParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  year?: string;
  sort?: 'newest' | 'oldest' | 'popular';
}

export interface CreateEditionPayload {
  editionDateIST: string;
  editionNumber?: number;
  title?: string;
  subtitle?: string;
  curatedBy?: string;
  featuredMaxim: IFeaturedMaxim;
  items: IDigestItem[];
  status?: DigestStatus;
  scheduledPublishAt?: string;
  authorName?: string;
}

export interface UpdateEditionPayload {
  editionDateIST?: string;
  editionNumber?: number;
  title?: string;
  subtitle?: string;
  curatedBy?: string;
  featuredMaxim?: IFeaturedMaxim;
  items?: IDigestItem[];
  status?: DigestStatus;
  scheduledPublishAt?: string;
  authorName?: string;
}

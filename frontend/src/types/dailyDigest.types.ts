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
  relatedJudgementId?: {
    _id: string;
    title: string;
    citation: string;
    court: string;
    benchStrength?: string;
    dateOfJudgement?: string;
  } | string;
  relatedMainsId?: {
    _id: string;
    challengeNumber?: number;
    questionTitle?: string;
    paper?: string;
    marks?: number;
  } | string;
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

export interface TodayDailyDigestResponse {
  success: boolean;
  edition: DailyLegalDigestEdition | null;
  todayIST: string;
  isLatestFallback: boolean;
  bookmarkedItemIds: string[];
  readItemIds: string[];
  streak: {
    currentStreak: number;
    longestStreak: number;
  };
}

export interface DailyDigestArchiveResponse {
  success: boolean;
  count: number;
  total: number;
  page: number;
  totalPages: number;
  editions: DailyLegalDigestEdition[];
}

export interface DigestArchiveFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  month?: string;
  year?: string;
  subject?: string;
  contentType?: string;
}

export interface DigestStreakResponse {
  success: boolean;
  streak: {
    currentStreak: number;
    longestStreak: number;
    lastReadDateIST: string;
    totalEditionsRead: number;
  };
}

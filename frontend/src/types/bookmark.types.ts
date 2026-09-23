export type BookmarkItemType = 'MCQ' | 'Judgment' | 'Bare Act Note' | 'Daily Digest';

export interface BookmarkOption {
  key: string;
  text: string;
}

export interface BookmarkMetadata {
  options?: BookmarkOption[];
  correctOption?: string;
  explanation?: string;
  citation?: string;
  court?: string;
  year?: number | string;
  bench?: string;
  sectionsCovered?: string;
  actName?: string;
  chapter?: string;
  pdfUrl?: string;
  targetRoute?: string;
  [key: string]: any;
}

export interface BookmarkItem {
  _id: string;
  user: string;
  itemType: BookmarkItemType;
  itemId: string;
  title: string;
  source: string;
  subject: string;
  annotation?: string;
  tags: string[];
  metadata?: BookmarkMetadata;
  createdAt: string;
  updatedAt: string;
}

export interface BookmarkCounts {
  totalCount: number;
  mcqCount: number;
  judgmentCount: number;
  bareActCount: number;
  digestCount: number;
}

export interface BookmarkListResponse {
  success: boolean;
  bookmarks: BookmarkItem[];
  counts: BookmarkCounts;
  subjects: string[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface BookmarkTogglePayload {
  itemType: BookmarkItemType;
  itemId: string;
  title?: string;
  source?: string;
  subject?: string;
  annotation?: string;
  tags?: string[];
  metadata?: BookmarkMetadata;
}

export interface BookmarkToggleResponse {
  success: boolean;
  bookmarked: boolean;
  itemId: string;
  itemType: BookmarkItemType;
  message: string;
  bookmark?: BookmarkItem;
}

export interface BookmarkIdsResponse {
  success: boolean;
  itemIds: string[];
  byType: Record<BookmarkItemType, string[]>;
}

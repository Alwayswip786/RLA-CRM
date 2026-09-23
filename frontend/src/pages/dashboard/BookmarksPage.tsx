import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bookmark,
  Trash2,
  Search,
  BookOpen,
  Scale,
  HelpCircle,
  FileText,
  ExternalLink,
  Edit3,
  Check,
  X,
  Sparkles,
  RotateCcw,
  Loader2,
  ChevronDown,
  ChevronUp,
  Newspaper,
} from 'lucide-react';
import { toast } from '../../lib/toast';
import {
  fetchBookmarks,
  updateBookmarkAnnotation,
} from '../../services/bookmark.service';
import { useBookmarkStore } from '../../store/useBookmarkStore';
import type {
  BookmarkItem,
  BookmarkItemType,
  BookmarkCounts,
} from '../../types/bookmark.types';
import { BookmarkCardSkeleton } from '../../components/ui/skeleton';
import { CustomSelect } from '../../components/ui/CustomSelect';

export const BookmarksPage: React.FC = () => {
  const navigate = useNavigate();
  const { removeBookmark, fetchBookmarkIds } = useBookmarkStore();

  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [counts, setCounts] = useState<BookmarkCounts>({
    totalCount: 0,
    mcqCount: 0,
    judgmentCount: 0,
    bareActCount: 0,
    digestCount: 0,
  });
  const [subjects, setSubjects] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter & Search states
  const [activeTab, setActiveTab] = useState<'all' | BookmarkItemType>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [sortOption, setSortOption] = useState<'newest' | 'oldest' | 'title'>('newest');

  // Inline editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [annotationDraft, setAnnotationDraft] = useState<string>('');
  const [isSavingAnnotation, setIsSavingAnnotation] = useState(false);

  // MCQ explanation toggle
  const [expandedExplanationIds, setExpandedExplanationIds] = useState<Set<string>>(new Set());

  // Confirm delete modal
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<BookmarkItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch bookmarks from API
  const loadBookmarksData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetchBookmarks({
        itemType: activeTab === 'all' ? undefined : activeTab,
        subject: selectedSubject === 'all' ? undefined : selectedSubject,
        search: debouncedSearch.trim() || undefined,
        sort: sortOption,
      });

      if (res.success) {
        setBookmarks(res.bookmarks);
        setCounts(res.counts);
        if (res.subjects && res.subjects.length > 0) {
          setSubjects(res.subjects);
        }
      }
    } catch {
      toast.error('Failed to load Starred Vault. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, selectedSubject, debouncedSearch, sortOption]);

  useEffect(() => {
    loadBookmarksData();
  }, [loadBookmarksData]);

  // Sync global store IDs on mount
  useEffect(() => {
    fetchBookmarkIds();
  }, [fetchBookmarkIds]);

  // Toggle MCQ explanation accordion
  const toggleExplanation = (id: string) => {
    setExpandedExplanationIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Start editing annotation
  const handleStartEditAnnotation = (item: BookmarkItem) => {
    setEditingId(item._id);
    setAnnotationDraft(item.annotation || '');
  };

  // Cancel editing annotation
  const handleCancelEditAnnotation = () => {
    setEditingId(null);
    setAnnotationDraft('');
  };

  // Save updated annotation to MongoDB
  const handleSaveAnnotation = async (id: string) => {
    try {
      setIsSavingAnnotation(true);
      const res = await updateBookmarkAnnotation(id, annotationDraft);
      if (res.success) {
        setBookmarks((prev) =>
          prev.map((b) => (b._id === id ? { ...b, annotation: res.bookmark.annotation } : b))
        );
        setEditingId(null);
        toast.success('Annotation updated successfully.');
      }
    } catch {
      toast.error('Failed to save personal annotation.');
    } finally {
      setIsSavingAnnotation(false);
    }
  };

  // Delete item from vault
  const handleConfirmDelete = async () => {
    if (!deleteConfirmItem) return;
    try {
      setIsDeleting(true);
      const success = await removeBookmark(deleteConfirmItem._id, deleteConfirmItem.itemId);
      if (success) {
        setBookmarks((prev) => prev.filter((b) => b._id !== deleteConfirmItem._id));
        setDeleteConfirmItem(null);
        // Refresh counts
        loadBookmarksData();
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // Reset all filters
  const handleResetFilters = () => {
    setActiveTab('all');
    setSelectedSubject('all');
    setSearch('');
    setDebouncedSearch('');
    setSortOption('newest');
  };

  // Jump to resource source
  const handleJumpToSource = (item: BookmarkItem) => {
    if (item.metadata?.targetRoute) {
      navigate(item.metadata.targetRoute);
      return;
    }
    if (item.itemType === 'Bare Act Note') {
      navigate('/dashboard/bare-acts');
    } else if (item.itemType === 'Judgment') {
      navigate('/dashboard/judgements');
    } else if (item.itemType === 'Daily Digest') {
      navigate('/dashboard/daily-digest');
    } else {
      navigate('/dashboard/pyqs');
    }
  };

  // Badge stylings
  const getTypeBadge = (type: BookmarkItemType) => {
    switch (type) {
      case 'MCQ':
        return {
          icon: <HelpCircle className="w-3 h-3" />,
          label: 'MCQ & Question',
          className:
            'bg-amber-50 dark:bg-[#c19b48]/15 text-[#c19b48] dark:text-[#f3d999] border border-amber-200 dark:border-[#c19b48]/30',
        };
      case 'Judgment':
        return {
          icon: <Scale className="w-3 h-3" />,
          label: 'Landmark Precedent',
          className:
            'bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30',
        };
      case 'Bare Act Note':
        return {
          icon: <BookOpen className="w-3 h-3" />,
          label: 'Bare Act Note',
          className:
            'bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30',
        };
      case 'Daily Digest':
        return {
          icon: <FileText className="w-3 h-3" />,
          label: 'Daily Digest',
          className:
            'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30',
        };
      default:
        return {
          icon: <Bookmark className="w-3 h-3" />,
          label: type,
          className: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700',
        };
    }
  };

  const hasActiveFilters =
    activeTab !== 'all' || selectedSubject !== 'all' || search.trim() !== '' || sortOption !== 'newest';

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200 pb-16">
      {/* 1. Header Hero Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-[#c19b48]/15 text-[#c19b48] dark:text-[#e8cf8d] text-xs font-semibold mb-2">
            <Bookmark className="w-3.5 h-3.5 fill-current" />
            <span>Personal Revision Vault</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 dark:text-white">
            Starred Questions & Legal Vault
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Fast access to bookmarked MCQs, contentious statutory sections, and high-yield judgments.
          </p>
        </div>

        {/* Global Live Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter starred vault..."
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#c19b48] transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Interactive KPI Pill Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {/* Tab 1: All Items */}
        <button
          onClick={() => setActiveTab('all')}
          className={`col-span-2 sm:col-span-1 p-3.5 sm:p-4 rounded-xl border text-left transition-all cursor-pointer ${
            activeTab === 'all'
              ? 'bg-[#c19b48]/10 border-[#c19b48] shadow-xs'
              : 'bg-white dark:bg-[#0a1c36] border-slate-200 dark:border-[#143564] hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              All Items
            </span>
            <Bookmark className={`w-4 h-4 ${activeTab === 'all' ? 'text-[#c19b48]' : 'text-slate-400'}`} />
          </div>
          <p className="text-xl sm:text-2xl font-bold font-serif text-slate-900 dark:text-white mt-1">
            {counts.totalCount}
          </p>
          <span className="text-[10px] text-slate-400">Total Bookmarked</span>
        </button>

        {/* Tab 2: MCQs & Questions */}
        <button
          onClick={() => setActiveTab('MCQ')}
          className={`p-3.5 sm:p-4 rounded-xl border text-left transition-all cursor-pointer ${
            activeTab === 'MCQ'
              ? 'bg-amber-500/10 border-amber-500 shadow-xs'
              : 'bg-white dark:bg-[#0a1c36] border-slate-200 dark:border-[#143564] hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              MCQs & Questions
            </span>
            <HelpCircle className={`w-4 h-4 ${activeTab === 'MCQ' ? 'text-amber-500' : 'text-slate-400'}`} />
          </div>
          <p className="text-xl sm:text-2xl font-bold font-serif text-slate-900 dark:text-white mt-1">
            {counts.mcqCount}
          </p>
          <span className="text-[10px] text-slate-400">Practice Problems</span>
        </button>

        {/* Tab 3: Landmark Judgments */}
        <button
          onClick={() => setActiveTab('Judgment')}
          className={`p-3.5 sm:p-4 rounded-xl border text-left transition-all cursor-pointer ${
            activeTab === 'Judgment'
              ? 'bg-blue-500/10 border-blue-500 shadow-xs'
              : 'bg-white dark:bg-[#0a1c36] border-slate-200 dark:border-[#143564] hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Landmark Judgments
            </span>
            <Scale className={`w-4 h-4 ${activeTab === 'Judgment' ? 'text-blue-500' : 'text-slate-400'}`} />
          </div>
          <p className="text-xl sm:text-2xl font-bold font-serif text-slate-900 dark:text-white mt-1">
            {counts.judgmentCount}
          </p>
          <span className="text-[10px] text-slate-400">Precedents & Ratios</span>
        </button>

        {/* Tab 4: Bare Act Notes */}
        <button
          onClick={() => setActiveTab('Bare Act Note')}
          className={`p-3.5 sm:p-4 rounded-xl border text-left transition-all cursor-pointer ${
            activeTab === 'Bare Act Note'
              ? 'bg-purple-500/10 border-purple-500 shadow-xs'
              : 'bg-white dark:bg-[#0a1c36] border-slate-200 dark:border-[#143564] hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Bare Act Notes
            </span>
            <BookOpen className={`w-4 h-4 ${activeTab === 'Bare Act Note' ? 'text-purple-500' : 'text-slate-400'}`} />
          </div>
          <p className="text-xl sm:text-2xl font-bold font-serif text-slate-900 dark:text-white mt-1">
            {counts.bareActCount}
          </p>
          <span className="text-[10px] text-slate-400">Statutory Analysis</span>
        </button>

        {/* Tab 5: Daily Legal Digest */}
        <button
          onClick={() => setActiveTab('Daily Digest')}
          className={`p-3.5 sm:p-4 rounded-xl border text-left transition-all cursor-pointer ${
            activeTab === 'Daily Digest'
              ? 'bg-emerald-500/10 border-emerald-500 shadow-xs'
              : 'bg-white dark:bg-[#0a1c36] border-slate-200 dark:border-[#143564] hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Daily Digest
            </span>
            <Newspaper className={`w-4 h-4 ${activeTab === 'Daily Digest' ? 'text-emerald-500' : 'text-slate-400'}`} />
          </div>
          <p className="text-xl sm:text-2xl font-bold font-serif text-slate-900 dark:text-white mt-1">
            {counts.digestCount}
          </p>
          <span className="text-[10px] text-slate-400">Ratios & Maxims</span>
        </button>
      </div>

      {/* 3. Filter Toolbar Strip */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
          {/* Subject Filter Dropdown */}
          <div className="w-full sm:w-60">
            <CustomSelect
              options={[
                { value: 'all', label: `All Legal Subjects (${subjects.length})` },
                ...subjects.map((sub) => ({ value: sub, label: sub })),
              ]}
              value={selectedSubject}
              onChange={(val) => setSelectedSubject(val)}
              placeholder="All Legal Subjects"
              searchable={subjects.length > 5}
              sheetTitle="Filter by Legal Subject"
              sheetSubtitle="Select subject or statute to filter vault items"
            />
          </div>

          {/* Sort Order */}
          <div className="w-full sm:w-48">
            <CustomSelect
              options={[
                { value: 'newest', label: 'Recently Starred' },
                { value: 'oldest', label: 'Oldest First' },
                { value: 'title', label: 'Title (A - Z)' },
              ]}
              value={sortOption}
              onChange={(val) => setSortOption(val as any)}
              placeholder="Sort Bookmarks"
              sheetTitle="Sort Starred Vault"
            />
          </div>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-[#c19b48] hover:bg-slate-100 dark:hover:bg-[#143564]/50 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* 4. Bookmarks List */}
      {isLoading ? (
        <BookmarkCardSkeleton count={3} />
      ) : bookmarks.length > 0 ? (
        <div className="space-y-4">
          {bookmarks.map((item) => {
            const badge = getTypeBadge(item.itemType);
            const isEditing = editingId === item._id;
            const isExplanationExpanded = expandedExplanationIds.has(item._id);

            const formattedDate = new Date(item.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            });

            return (
              <div
                key={item._id}
                className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] hover:border-[#c19b48]/40 transition-all duration-200 space-y-4 shadow-xs group"
              >
                {/* Header Row */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Item Type Badge */}
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${badge.className}`}
                    >
                      {badge.icon}
                      <span>{badge.label}</span>
                    </span>

                    {/* Source Pill */}
                    {item.source && (
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-[#061120] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-[#143564] max-w-[280px] sm:max-w-[420px] truncate">
                        {item.source}
                      </span>
                    )}

                    {/* Subject Tag */}
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#061120] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-[#143564]">
                      {item.subject}
                    </span>
                  </div>

                  {/* Actions & Timestamp */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400">{formattedDate}</span>

                    {/* Delete Star Button */}
                    <button
                      onClick={() => setDeleteConfirmItem(item)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                      title="Remove from Vault"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Title / Question */}
                <h3 className="text-base sm:text-lg font-serif font-bold text-slate-900 dark:text-white leading-relaxed">
                  {item.title}
                </h3>

                {/* Metadata Snapshot (MCQ Options / Precedent Bench / Bare Act Chapter) */}
                {item.itemType === 'MCQ' && item.metadata?.options && item.metadata.options.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {item.metadata.options.map((opt) => {
                        const isCorrect = item.metadata?.correctOption === opt.key;
                        return (
                          <div
                            key={opt.key}
                            className={`p-2.5 rounded-xl border flex items-start gap-2 ${
                              isCorrect
                                ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 font-medium'
                                : 'bg-slate-50/50 dark:bg-[#061120]/60 border-slate-200 dark:border-[#143564] text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <span
                              className={`w-5 h-5 shrink-0 rounded-full flex items-center justify-center text-[11px] font-bold ${
                                isCorrect
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {opt.key}
                            </span>
                            <span className="leading-snug">{opt.text}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Accordion for Official Explanation */}
                    {item.metadata?.explanation && (
                      <div className="pt-1">
                        <button
                          onClick={() => toggleExplanation(item._id)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#c19b48] hover:underline cursor-pointer"
                        >
                          {isExplanationExpanded ? (
                            <>
                              <ChevronUp className="w-3.5 h-3.5" />
                              <span>Hide Judicial Rationale & Analysis</span>
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-3.5 h-3.5" />
                              <span>View Judicial Rationale & Analysis</span>
                            </>
                          )}
                        </button>
                        {isExplanationExpanded && (
                          <div className="mt-2 p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-[#c19b48]/30 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                            <span className="font-bold text-[#c19b48] block mb-1">
                              Official Rationale:
                            </span>
                            {item.metadata.explanation}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Precedent / Judgment Bench Snapshot */}
                {item.itemType === 'Judgment' && item.metadata && (
                  <div className="flex items-center gap-2 flex-wrap text-xs pt-0.5">
                    {item.metadata.court && (
                      <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-medium">
                        {item.metadata.court}
                      </span>
                    )}
                    {item.metadata.bench && (
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        Bench: {item.metadata.bench}
                      </span>
                    )}
                  </div>
                )}

                {/* Bare Act Sections Covered Snapshot */}
                {item.itemType === 'Bare Act Note' && item.metadata && (
                  <div className="flex items-center gap-2 flex-wrap text-xs pt-0.5">
                    {item.metadata.sectionsCovered && (
                      <span className="px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-medium">
                        {item.metadata.sectionsCovered}
                      </span>
                    )}
                    {item.metadata.chapter && (
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        {item.metadata.chapter}
                      </span>
                    )}
                  </div>
                )}

                {/* Daily Digest Examination Tip & Citation Snapshot */}
                {item.itemType === 'Daily Digest' && item.metadata && (
                  <div className="space-y-1.5 pt-0.5 text-xs">
                    {item.metadata.citation && (
                      <p className="font-mono font-bold text-[#c19b48] text-[11px]">
                        {item.metadata.citation}
                      </p>
                    )}
                    {item.metadata.examinationTip && (
                      <div className="p-2.5 rounded-lg bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-500/30 text-[11px] text-slate-700 dark:text-slate-300">
                        <strong className="text-amber-800 dark:text-amber-300">Judicial Tip: </strong>
                        {item.metadata.examinationTip}
                      </div>
                    )}
                  </div>
                )}

                {/* Aspirant's Annotation Box with Inline Editing */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-[#c19b48]" />
                      <span>Aspirant's Annotation:</span>
                    </span>

                    {!isEditing && (
                      <button
                        onClick={() => handleStartEditAnnotation(item)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#c19b48] hover:text-[#d8b862] transition-colors cursor-pointer"
                        title="Edit Annotation"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Edit Note</span>
                      </button>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="space-y-2">
                      <textarea
                        value={annotationDraft}
                        onChange={(e) => setAnnotationDraft(e.target.value)}
                        rows={3}
                        placeholder="Write your personal revision rule, memory trigger, or cross-statute distinction..."
                        className="w-full p-2.5 rounded-lg bg-white dark:bg-[#0a1c36] border border-slate-300 dark:border-[#143564] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#c19b48] resize-none"
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          disabled={isSavingAnnotation}
                          onClick={handleCancelEditAnnotation}
                          className="px-2.5 py-1 rounded-md text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 text-xs font-medium cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={isSavingAnnotation}
                          onClick={() => handleSaveAnnotation(item._id)}
                          className="px-3 py-1 rounded-md bg-[#c19b48] hover:bg-[#d8b862] text-[#061120] font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {isSavingAnnotation ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Check className="w-3 h-3" />
                          )}
                          <span>Save Note</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-600 dark:text-slate-300 italic leading-relaxed">
                      {item.annotation ? (
                        item.annotation
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 not-italic">
                          No personal annotation added yet. Click &ldquo;Edit Note&rdquo; to add your revision insights.
                        </span>
                      )}
                    </p>
                  )}
                </div>

                {/* Footer Strip: Tags & Jump to Source Action */}
                <div className="pt-2 flex items-center justify-between gap-3 flex-wrap border-t border-slate-100 dark:border-[#143564]/60">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {item.tags &&
                      item.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-[#061120] text-slate-500 dark:text-slate-400"
                        >
                          #{tag}
                        </span>
                      ))}
                  </div>

                  {/* Jump to Source Button */}
                  <button
                    onClick={() => handleJumpToSource(item)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#061120] hover:bg-slate-200 dark:hover:bg-[#143564] text-slate-800 dark:text-white font-semibold text-xs transition-colors border border-slate-200 dark:border-[#143564] cursor-pointer"
                  >
                    <span>Jump to Source</span>
                    <ExternalLink className="w-3 h-3 text-[#c19b48]" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="p-12 text-center bg-white dark:bg-[#0a1c36] rounded-2xl border border-slate-200 dark:border-[#143564] space-y-4">
          <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-[#c19b48]/15 text-[#c19b48] flex items-center justify-center mx-auto">
            <Bookmark className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-serif font-bold text-slate-900 dark:text-white">
              No starred items match your filter
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
              You haven&apos;t bookmarked any resources under this category or search criteria yet. Browse our repositories to star high-yield questions, sections, and judgments.
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2 flex-wrap">
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#061120] hover:bg-slate-200 dark:hover:bg-[#143564] text-slate-800 dark:text-white text-xs font-semibold border border-slate-200 dark:border-[#143564] cursor-pointer"
              >
                Clear All Filters
              </button>
            )}
            <button
              onClick={() => navigate('/dashboard/bare-acts')}
              className="px-4 py-2 rounded-xl bg-[#c19b48] hover:bg-[#d8b862] text-[#061120] text-xs font-bold transition-colors cursor-pointer shadow-xs"
            >
              Explore Bare Act Notes
            </button>
            <button
              onClick={() => navigate('/dashboard/judgements')}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#061120] hover:bg-slate-200 dark:hover:bg-[#143564] text-slate-800 dark:text-white text-xs font-semibold border border-slate-200 dark:border-[#143564] cursor-pointer"
            >
              Browse Landmark Judgments
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md p-6 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] space-y-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-serif font-bold text-slate-900 dark:text-white">
                  Remove from Vault?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  This will remove the item and your personal annotation from your revision vault.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] text-xs text-slate-700 dark:text-slate-300 font-medium line-clamp-2">
              &ldquo;{deleteConfirmItem.title}&rdquo;
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteConfirmItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#061120] border border-slate-200 dark:border-[#143564] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>Remove Item</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

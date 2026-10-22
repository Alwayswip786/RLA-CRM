import React from 'react';
import { Skeleton } from './Skeleton';

// 1. KPI Ribbon Skeletons (DashboardPreview)
export const KpiCardSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] shadow-xs flex flex-col justify-between min-h-[105px] sm:min-h-[120px]"
        >
          <div className="mb-1 sm:mb-1.5">
            <Skeleton className="h-3 w-24 sm:w-28" />
          </div>
          <Skeleton className="h-7 sm:h-8 w-20 sm:w-24 my-1 sm:my-1.5" />
          <Skeleton className="h-3 w-28 sm:w-36 mt-1 sm:mt-1.5" />
        </div>
      ))}
    </>
  );
};

// 2. Course Card Skeleton (CoursesHubPage)
export const CourseCardSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] flex flex-col sm:flex-row items-start sm:items-center gap-4"
        >
          <Skeleton className="w-full sm:w-36 h-28 sm:h-24 shrink-0 rounded-xl" />
          <div className="flex-1 space-y-2.5 w-full">
            <Skeleton className="h-5 w-3/4 rounded-md" />
            <Skeleton className="h-3 w-1/3 rounded-md" />
            <div className="pt-1">
              <Skeleton className="h-2 w-1/2 rounded-full" />
            </div>
          </div>
          <Skeleton className="w-full sm:w-36 h-10 shrink-0 rounded-xl" />
        </div>
      ))}
    </div>
  );
};

// 3. Course Detail Page Skeleton
export const CourseDetailSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F7F3E6] dark:bg-[#040b14] text-slate-900 dark:text-slate-100 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-5 w-32 rounded-full" />
        </div>
        <Skeleton className="h-8 sm:h-10 w-3/4 rounded-lg" />
        <Skeleton className="h-4 w-1/2 rounded-md" />
        <div className="pt-2 flex items-center gap-4">
          <Skeleton className="h-10 w-36 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
      </div>

      {/* Grid: Modules & Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-6 w-48 rounded-md mb-2" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="p-5 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] space-y-3"
            >
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-1/3 rounded-md" />
                <Skeleton className="h-4 w-16 rounded-md" />
              </div>
              <Skeleton className="h-3 w-2/3 rounded-md" />
              <div className="pt-2 space-y-2">
                <Skeleton className="h-10 w-full rounded-xl" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-5">
          <div className="p-6 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] space-y-4">
            <Skeleton className="h-6 w-36 rounded-md" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
};

// 4. Lecture Player Page Skeleton (Full Screen Classroom)
export const LecturePlayerSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen max-h-screen bg-[#F7F3E6] dark:bg-[#060a12] text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <div className="h-14 bg-white/95 dark:bg-[#0a1c36]/90 border-b border-slate-200 dark:border-[#143564] px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="w-8 h-8 rounded-lg" />
          <Skeleton className="h-4 w-48 sm:w-64 rounded-md" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="w-8 h-8 rounded-lg" />
          <Skeleton className="w-24 h-8 rounded-lg" />
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Video Area */}
        <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-y-auto space-y-4">
          <div className="relative aspect-video w-full rounded-2xl bg-[#061120] border border-slate-200 dark:border-[#143564] flex items-center justify-center">
            <Skeleton className="w-16 h-16 rounded-full" />
            <div className="absolute bottom-4 inset-x-4 flex items-center justify-between">
              <Skeleton className="h-4 w-32 rounded-md" />
              <Skeleton className="h-4 w-20 rounded-md" />
            </div>
          </div>
          <div className="p-5 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] space-y-3">
            <Skeleton className="h-6 w-2/3 rounded-md" />
            <Skeleton className="h-4 w-1/3 rounded-md" />
          </div>
        </div>

        {/* Right Syllabus Drawer Skeleton */}
        <div className="hidden lg:flex w-80 xl:w-96 flex-col border-l border-slate-200 dark:border-[#143564] bg-white dark:bg-[#0a1c36] p-4 space-y-3 shrink-0">
          <Skeleton className="h-5 w-36 rounded-md mb-2" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
};

// 5. Live Stream Canvas & Archive Cards
export const LiveStreamCanvasSkeleton: React.FC = () => {
  return (
    <div className="relative aspect-video rounded-2xl bg-[#061120] border border-slate-200 dark:border-[#143564] overflow-hidden flex flex-col items-center justify-center p-6 text-center">
      <Skeleton className="w-16 h-16 rounded-full mb-3" />
      <Skeleton className="h-6 w-3/4 max-w-md rounded-md mb-2" />
      <Skeleton className="h-4 w-1/2 max-w-sm rounded-md" />
      <div className="absolute bottom-4 inset-x-4 flex items-center justify-between">
        <Skeleton className="h-6 w-36 rounded-lg" />
        <Skeleton className="h-6 w-28 rounded-lg" />
      </div>
    </div>
  );
};

export const RecordingCardSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-5 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] flex flex-col justify-between space-y-4 shadow-xs"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-20 rounded" />
              <Skeleton className="h-3 w-16 rounded" />
            </div>
            <Skeleton className="h-5 w-full rounded-md" />
            <Skeleton className="h-4 w-3/4 rounded-md" />
          </div>
          <div className="pt-3 border-t border-slate-100 dark:border-[#143564] flex items-center justify-between">
            <Skeleton className="h-3 w-20 rounded" />
            <Skeleton className="h-8 w-24 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
};

// 6. Timetable Hero Banner & Slot Skeletons
export const HeroBannerSkeleton: React.FC = () => {
  return (
    <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-[#143564] bg-white dark:bg-[#0a1c36] shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-36 rounded-full" />
            <Skeleton className="h-4 w-20 rounded-md" />
          </div>
          <Skeleton className="h-6 w-64 rounded-md" />
          <Skeleton className="h-4 w-44 rounded-md" />
        </div>
        <Skeleton className="h-9 w-32 rounded-xl shrink-0" />
      </div>
    </div>
  );
};

export const TimetableSlotSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="flex items-start gap-4">
            <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-24 rounded-full" />
                <Skeleton className="h-4 w-16 rounded" />
              </div>
              <Skeleton className="h-5 w-48 sm:w-64 rounded-md" />
              <Skeleton className="h-3 w-36 rounded" />
            </div>
          </div>
          <Skeleton className="h-9 w-28 rounded-xl shrink-0" />
        </div>
      ))}
    </div>
  );
};

// 7. Daily Digest Skeleton & Drawer Skeleton
export const DailyDigestSkeleton: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Featured Maxim Banner */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] space-y-3">
        <Skeleton className="h-4 w-32 rounded-full" />
        <Skeleton className="h-6 w-3/4 rounded-md" />
        <Skeleton className="h-4 w-1/2 rounded-md" />
      </div>

      {/* Briefs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="p-5 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] space-y-4"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24 rounded-full" />
              <Skeleton className="h-4 w-16 rounded" />
            </div>
            <Skeleton className="h-5 w-4/5 rounded-md" />
            <Skeleton className="h-16 w-full rounded-xl" />
            <div className="pt-2 flex justify-between">
              <Skeleton className="h-4 w-28 rounded" />
              <Skeleton className="h-4 w-20 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const ArchiveItemSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] space-y-2"
        >
          <div className="flex justify-between">
            <Skeleton className="h-4 w-20 rounded" />
            <Skeleton className="h-3 w-16 rounded" />
          </div>
          <Skeleton className="h-4 w-full rounded-md" />
          <Skeleton className="h-3 w-2/3 rounded-md" />
        </div>
      ))}
    </div>
  );
};

// 8. Test Card Skeleton (MockSeriesPage)
export const TestCardSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-5 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] flex flex-col justify-between space-y-4 shadow-xs"
        >
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24 rounded-full" />
              <Skeleton className="h-4 w-16 rounded-full" />
            </div>
            <Skeleton className="h-5 w-4/5 rounded-md" />
            <Skeleton className="h-8 w-full rounded-md" />
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-4 w-20 rounded" />
            </div>
          </div>
          <div className="pt-3 border-t border-slate-100 dark:border-[#143564]">
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
};

// 9. Podium & Leaderboard Skeletons
export const PodiumSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Podium Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[2, 1, 3].map((place) => (
          <div
            key={place}
            className="p-5 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] flex flex-col items-center text-center space-y-3 shadow-xs"
          >
            <Skeleton className="w-12 h-12 rounded-full" />
            <Skeleton className="h-3 w-20 rounded" />
            <Skeleton className="h-5 w-32 rounded-md" />
            <Skeleton className="h-6 w-24 rounded-xl" />
          </div>
        ))}
      </div>

      {/* Ranks Table Skeleton */}
      <div className="rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] overflow-hidden p-4 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200/60 dark:border-[#143564]/50"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="w-7 h-7 rounded-lg" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-32 rounded" />
                <Skeleton className="h-3 w-20 rounded" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-5 w-16 rounded-md" />
              <Skeleton className="h-4 w-12 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// 10. History List Skeleton (LiveTestHistoryList)
export const TestHistoryCardSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-5 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] flex flex-col justify-between space-y-4 shadow-xs"
        >
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-28 rounded-full" />
              <Skeleton className="h-3 w-16 rounded" />
            </div>
            <Skeleton className="h-5 w-full rounded-md" />
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-[#143564]">
            <Skeleton className="h-9 w-full rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
};

// 11. Practice Quiz Card Skeleton (PracticeQuizzesPage)
export const PracticeQuizCardSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-5 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] space-y-4 shadow-xs flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24 rounded-md" />
              <Skeleton className="h-4 w-16 rounded-md" />
            </div>
            <Skeleton className="h-6 w-3/4 rounded-md" />
            <div className="pt-1">
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          </div>
          <div className="pt-3 border-t border-slate-100 dark:border-[#143564]">
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
};

// 12. Test Result Card Skeleton (TestResultsPage)
export const TestResultCardSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-5 lg:p-6 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] shadow-xs flex flex-col md:flex-row gap-4 lg:gap-6"
        >
          {/* Left Date Pillar Skeleton */}
          <div className="w-16 sm:w-20 lg:w-24 shrink-0 hidden md:flex flex-col items-center justify-start border-r-2 border-[#c19b48]/30 pr-3 sm:pr-4 lg:pr-5 space-y-2">
            <Skeleton className="h-8 w-12 rounded-lg" />
            <Skeleton className="h-3 w-16 rounded" />
            <Skeleton className="h-2.5 w-10 rounded" />
          </div>

          {/* Main Content Skeleton */}
          <div className="flex-1 min-w-0 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-60 rounded-md" />
                  <Skeleton className="h-4 w-28 rounded-full" />
                </div>
                <Skeleton className="h-3 w-40 rounded" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-7 w-20 rounded-xl" />
                <Skeleton className="h-7 w-16 rounded-xl" />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              {Array.from({ length: 4 }).map((_, j) => (
                <Skeleton key={j} className="h-12 w-full rounded-xl" />
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-[#143564]/50">
              <Skeleton className="h-8 w-28 rounded-xl" />
              <Skeleton className="h-8 w-28 rounded-xl" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// 13. Mains Challenge Skeletons (MainsQuestionsPage)
export const MainsChallengeSkeleton: React.FC = () => {
  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] space-y-4 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-[#143564]">
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-40 rounded-lg" />
          <Skeleton className="h-4 w-28 rounded-md" />
        </div>
        <Skeleton className="h-6 w-24 rounded-lg" />
      </div>
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] space-y-3">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-32 rounded" />
          <Skeleton className="h-4 w-24 rounded" />
        </div>
        <Skeleton className="h-16 w-full rounded-lg" />
        <Skeleton className="h-4 w-1/2 rounded" />
      </div>
      <div className="pt-3 flex justify-between">
        <Skeleton className="h-4 w-28 rounded" />
        <Skeleton className="h-10 w-36 rounded-xl" />
      </div>
    </div>
  );
};

export const MainsArchiveCardSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-5 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] space-y-4 shadow-xs"
        >
          <div className="flex justify-between items-center">
            <Skeleton className="h-5 w-24 rounded" />
            <Skeleton className="h-4 w-16 rounded" />
          </div>
          <Skeleton className="h-5 w-3/4 rounded-md" />
          <Skeleton className="h-12 w-full rounded-xl" />
          <div className="pt-2 flex justify-between items-center border-t border-slate-100 dark:border-[#143564]">
            <Skeleton className="h-4 w-20 rounded" />
            <Skeleton className="h-8 w-24 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
};

// 14. Evaluated Submissions Skeleton (MainsEvaluatedPage)
export const EvaluatedSubmissionSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-6 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] space-y-4 shadow-xs"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-[#143564]">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-28 rounded" />
                <Skeleton className="h-4 w-20 rounded" />
              </div>
              <Skeleton className="h-6 w-64 rounded-md" />
            </div>
            <Skeleton className="h-12 w-28 rounded-xl shrink-0" />
          </div>
          <Skeleton className="h-20 w-full rounded-xl" />
          <div className="pt-2 flex items-center justify-between">
            <Skeleton className="h-4 w-32 rounded" />
            <div className="flex gap-2">
              <Skeleton className="h-9 w-28 rounded-xl" />
              <Skeleton className="h-9 w-32 rounded-xl" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// 15. Bookmark Card Skeleton (BookmarksPage)
export const BookmarkCardSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] space-y-4 shadow-xs"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-24 rounded-full" />
              <Skeleton className="h-5 w-32 rounded-md" />
              <Skeleton className="h-5 w-20 rounded-md" />
            </div>
            <Skeleton className="h-4 w-16 rounded" />
          </div>
          <Skeleton className="h-6 w-3/4 rounded-md" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-[#143564]">
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-8 w-28 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
};

// 16. Bare Act Card Skeleton (BareActsPage)
export const BareActCardSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-6 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] space-y-4 shadow-xs"
        >
          <div className="flex justify-between items-center">
            <Skeleton className="h-4 w-24 rounded-full" />
            <Skeleton className="h-4 w-16 rounded-full" />
          </div>
          <Skeleton className="h-6 w-3/4 rounded-lg" />
          <Skeleton className="h-3 w-1/2 rounded" />
          <div className="space-y-2 pt-2">
            <Skeleton className="h-3 w-full rounded" />
            <Skeleton className="h-3 w-5/6 rounded" />
          </div>
          <div className="pt-4 border-t border-slate-100 dark:border-[#143564] flex items-center gap-2">
            <Skeleton className="h-9 flex-1 rounded-xl" />
            <Skeleton className="h-9 w-28 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
};

// 17. Judgement Card Skeleton (JudgmentsPage)
export const JudgementCardSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-6 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] space-y-4 shadow-xs"
        >
          <div className="flex justify-between items-center">
            <Skeleton className="h-5 w-24 rounded-full" />
            <Skeleton className="h-4 w-20 rounded" />
          </div>
          <Skeleton className="h-6 w-3/4 rounded-lg" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <div className="pt-2 flex justify-end items-center gap-2">
            <Skeleton className="h-8 w-24 rounded-xl" />
            <Skeleton className="h-8 w-28 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
};

// 18. PYQ Archive Card Skeleton (PyqArchivePage)
export const PyqCardSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="grid min-w-0 grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-6 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] space-y-4 shadow-xs"
        >
          <div className="flex justify-between items-center">
            <Skeleton className="h-5 w-24 rounded-full" />
            <Skeleton className="h-5 w-16 rounded" />
          </div>
          <Skeleton className="h-6 w-4/5 rounded-md" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-full rounded" />
            <Skeleton className="h-3 w-3/4 rounded" />
          </div>
          <div className="pt-4 border-t border-slate-100 dark:border-[#143564] flex justify-between items-center">
            <Skeleton className="h-4 w-20 rounded" />
            <Skeleton className="h-8 w-24 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
};

// 19. Doubt Ticket Skeleton (DoubtsPage)
export const DoubtTicketSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-5 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] space-y-3 shadow-xs"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-20 rounded-md" />
              <Skeleton className="h-4 w-16 rounded" />
            </div>
            <Skeleton className="h-4 w-20 rounded-full" />
          </div>
          <Skeleton className="h-5 w-3/4 rounded-md" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      ))}
    </div>
  );
};

// 20. Notice Card Skeleton (NoticesPage)
export const NoticeCardSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] space-y-3 shadow-xs"
        >
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24 rounded-full" />
            <Skeleton className="h-3 w-20 rounded" />
          </div>
          <Skeleton className="h-6 w-2/3 rounded-md" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      ))}
    </div>
  );
};

// 21. Document Viewer Modal Skeleton (PDF Viewers)
export const DocumentViewerSkeleton: React.FC = () => {
  return (
    <div className="w-full h-full flex flex-col p-6 space-y-4 bg-slate-950">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <Skeleton className="h-5 w-48 rounded" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20 rounded-lg" />
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
      </div>
      <div className="flex-1 rounded-2xl bg-slate-900 border border-slate-800 p-8 space-y-4 flex flex-col items-center justify-center">
        <Skeleton className="w-12 h-12 rounded-xl mb-4" />
        <Skeleton className="h-4 w-3/4 max-w-lg rounded" />
        <Skeleton className="h-4 w-2/3 max-w-md rounded" />
        <Skeleton className="h-4 w-4/5 max-w-xl rounded" />
      </div>
    </div>
  );
};

// 22. Chat Stream Skeleton (ChamberChatWindow)
export const ChatStreamSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => {
  return (
    <div className="space-y-4 p-4">
      {Array.from({ length: count }).map((_, i) => {
        const isRight = i % 2 === 1;
        return (
          <div
            key={i}
            className={`flex flex-col ${isRight ? 'items-end' : 'items-start'} space-y-1.5`}
          >
            <div className="flex items-center gap-2">
              <Skeleton className="h-3 w-16 rounded" />
              <Skeleton className="h-3 w-10 rounded" />
            </div>
            <Skeleton
              className={`h-14 ${isRight ? 'w-2/3 sm:w-1/2' : 'w-3/4 sm:w-3/5'} rounded-2xl`}
            />
          </div>
        );
      })}
    </div>
  );
};

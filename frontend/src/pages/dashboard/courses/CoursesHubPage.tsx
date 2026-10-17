import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  RefreshCw,
  Play,
} from 'lucide-react';
import apiClient from '../../../lib/apiClient';
import { CourseCardSkeleton } from '../../../components/ui/skeleton';

interface EnrolledCourse {
  id: string;
  courseId: string;
  slug: string;
  title: string;
  subtitle: string;
  enrolledDate: string;
  progress: number;
  instructor: string;
  thumbnailTag: string;
  thumbnailBg: string;
  thumbnailUrl?: string;
  lastAccessedLessonId?: string | null;
  lastAccessedLessonTitle?: string | null;
  certificateClaimed?: boolean;
  totalPointsEarned?: number;
}

export const CoursesHubPage: React.FC = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<EnrolledCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEnrolledCourses = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await apiClient.get('/courses/enrolled');
      if (res.data?.data) {
        setCourses(res.data.data);
      }
    } catch (err: any) {
      console.error('Failed to load enrolled courses:', err);
      setError(err?.response?.data?.message || 'Failed to load courses. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEnrolledCourses();
  }, []);

  const handleResumeLearning = (course: EnrolledCourse) => {
    if (course.lastAccessedLessonId) {
      navigate(`/dashboard/courses/${course.slug || course.id}/learn/${course.lastAccessedLessonId}`);
    } else {
      navigate(`/dashboard/courses/${course.slug || course.id}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Enrolled Courses Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 dark:text-white">
            Your Enrolled Courses
          </h1>
        </div>

        {/* Loading State */}
        {isLoading && <CourseCardSkeleton count={3} />}

        {/* Error State */}
        {!isLoading && error && (
          <div className="p-8 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center space-y-3">
            <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">{error}</p>
            <button
              onClick={fetchEnrolledCourses}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Loading</span>
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && courses.length === 0 && (
          <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] space-y-3">
            <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-base font-serif font-bold text-slate-800 dark:text-slate-200">
              No Courses Found
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              You are not enrolled in any courses yet.
            </p>
          </div>
        )}

        {/* Dynamic Course Cards matching Image 1 */}
        {!isLoading && !error && (
          <div className="space-y-4">
            {courses.map((course) => (
              <div
                key={course.id || course.courseId}
                className="min-w-0 p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs hover:border-[#c19b48]/60 transition-all group"
              >
                {/* Thumbnail & Title Area */}
                <div className="grid min-w-0 flex-1 grid-cols-[7rem_minmax(0,1fr)] items-center gap-x-3 gap-y-3 sm:flex sm:gap-4">
                  <h3
                    onClick={() => navigate(`/dashboard/courses/${course.slug || course.id}`)}
                    className="col-span-2 min-w-0 text-sm font-serif font-bold text-slate-900 dark:text-white leading-snug break-words [overflow-wrap:anywhere] cursor-pointer sm:hidden"
                  >
                    {course.title}
                  </h3>

                  {/* Thumbnail Box matching 16:9 in image */}
                  <div
                    onClick={() => navigate(`/dashboard/courses/${course.slug || course.id}`)}
                    className={`w-28 sm:w-36 h-20 sm:h-24 rounded-xl bg-gradient-to-br ${
                      course.thumbnailBg || 'from-[#0a1c36] to-[#143564]'
                    } border border-slate-200 dark:border-[#143564] flex flex-col items-center justify-center p-2 text-center shrink-0 relative overflow-hidden shadow-inner cursor-pointer`}
                  >
                    <span className="text-[8px] font-bold text-[#c19b48] tracking-widest uppercase bg-black/50 px-1.5 py-0.5 rounded border border-white/10 mb-1">
                      {course.thumbnailTag || 'JUDICIARY'}
                    </span>
                    <span className="text-[11px] font-serif font-bold text-white line-clamp-1">
                      RAJINDER LAW
                    </span>
                    <span className="text-[9px] text-slate-300 truncate max-w-full">
                      {course.instructor}
                    </span>
                  </div>

                  {/* Course Details */}
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <h3
                      onClick={() => navigate(`/dashboard/courses/${course.slug || course.id}`)}
                      className="hidden sm:block text-sm sm:text-base font-serif font-bold text-slate-900 dark:text-white group-hover:text-[#c19b48] transition-colors break-words leading-snug cursor-pointer"
                    >
                      {course.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Enrolled on {course.enrolledDate}
                    </p>
                    <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <span>Progress {course.progress}%</span>
                      {course.certificateClaimed && (
                        <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.2 rounded">
                          🏆 Certificate Claimed
                        </span>
                      )}
                    </p>

                    {/* Progress Bar matching reference image */}
                    <div className="w-full bg-slate-100 dark:bg-[#061120] rounded-full h-1.5 overflow-hidden border border-slate-200 dark:border-[#143564] max-w-md">
                      <div
                        className="h-full bg-gradient-to-r from-[#c19b48] to-[#e8cf8d] rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, course.progress)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Right Action Button */}
                <div className="flex items-center w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-[#143564]">
                  <button
                    onClick={() => handleResumeLearning(course)}
                    className="w-full sm:w-40 py-2.5 px-4 rounded-xl bg-[#c19b48] hover:bg-[#d8b862] text-[#061120] font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Resume Learning</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

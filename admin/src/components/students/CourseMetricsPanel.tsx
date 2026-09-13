import React from 'react';
import {
  BookOpen,
  Users,
  Video,
  FileCheck,
  AlertTriangle,
  Layers,
  Sparkles,
} from 'lucide-react';
import type { CourseMetricSummary } from '../../types/student-directory';

interface CourseMetricsPanelProps {
  metrics: CourseMetricSummary[];
  selectedCourseId: string;
  onSelectCourse: (courseId: string) => void;
  totalStudentsCount: number;
}

export const CourseMetricsPanel: React.FC<CourseMetricsPanelProps> = ({
  metrics,
  selectedCourseId,
  onSelectCourse,
  totalStudentsCount,
}) => {
  const currentMetric = metrics.find((m) => m.courseId === selectedCourseId);

  // Compute aggregated stats for "ALL"
  const aggregatedStats = {
    totalStudents: totalStudentsCount,
    avgCompletionRate: Math.round(
      metrics.reduce((acc, m) => acc + m.avgCompletionRate * m.totalStudents, 0) /
        (totalStudentsCount || 1)
    ),
    activeWatchersToday: metrics.reduce((acc, m) => acc + m.activeWatchersToday, 0),
    totalLectures: metrics.reduce((acc, m) => acc + m.totalLecturesCount, 0),
    totalHours: metrics.reduce((acc, m) => acc + m.totalHours, 0),
    atRiskStudents: metrics.reduce((acc, m) => acc + m.atRiskStudentsCount, 0),
    avgMainsDawRate: Math.round(
      metrics.reduce((acc, m) => acc + m.mainsDawSubmissionRate, 0) / (metrics.length || 1)
    ),
  };

  return (
    <div className="space-y-4 select-none">
      {/* 1. Course Division Selector Pill Bar */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        <button
          onClick={() => onSelectCourse('ALL')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            selectedCourseId === 'ALL'
              ? 'bg-[#C19B48] text-[#1E1E1E] shadow-sm'
              : 'bg-[#1E1E1E] text-[#A8A294] hover:text-[#F7F3E6] hover:bg-[#2F2F2F] border border-[#3D3D3D]'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>All Courses Master Directory</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              selectedCourseId === 'ALL'
                ? 'bg-[#1E1E1E] text-[#E8CF8D]'
                : 'bg-[#262626] text-[#A8A294]'
            }`}
          >
            {totalStudentsCount}
          </span>
        </button>

        {metrics.map((course) => {
          const isSelected = selectedCourseId === course.courseId;
          return (
            <button
              key={course.courseId}
              onClick={() => onSelectCourse(course.courseId)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[#C19B48] text-[#1E1E1E] shadow-sm'
                  : 'bg-[#1E1E1E] text-[#A8A294] hover:text-[#F7F3E6] hover:bg-[#2F2F2F] border border-[#3D3D3D]'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>{course.shortCode}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isSelected
                    ? 'bg-[#1E1E1E] text-[#E8CF8D]'
                    : 'bg-[#262626] text-[#A8A294]'
                }`}
              >
                {course.totalStudents}
              </span>
            </button>
          );
        })}
      </div>

      {/* 2. Course-Wise Metrics Card */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] space-y-5">
        {/* Banner Header for Selected Course */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#3D3D3D]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#C19B48] bg-[#C19B48]/15 px-2 py-0.5 rounded border border-[#C19B48]/30">
                {currentMetric ? currentMetric.shortCode : 'ACADEMY AGGREGATE'}
              </span>
              <span className="text-xs text-[#A8A294]">
                Faculty in Charge: <strong className="text-[#F7F3E6]">{currentMetric ? currentMetric.facultyInCharge : 'Adv. Rajinder Sir & Board'}</strong>
              </span>
            </div>
            <h2 className="font-serif text-lg sm:text-xl font-bold text-[#F7F3E6]">
              {currentMetric ? currentMetric.courseTitle : 'All Active Judiciary Courses & Foundation Cohorts'}
            </h2>
          </div>

          <div className="flex items-center gap-2 text-xs text-[#A8A294]">
            <span>Active Shifts:</span>
            {currentMetric ? (
              currentMetric.activeBatches.map((b, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded-md bg-[#262626] border border-[#3D3D3D] text-[#E8CF8D] text-[11px]"
                >
                  {b}
                </span>
              ))
            ) : (
              <span className="px-2 py-0.5 rounded-md bg-[#262626] border border-[#3D3D3D] text-[#E8CF8D] text-[11px]">
                Morning, Evening & Weekend Batches
              </span>
            )}
          </div>
        </div>

        {/* 4 Course-Specific KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Cohort Enrollment */}
          <div className="p-3.5 rounded-xl bg-[#262626] border border-[#3D3D3D] space-y-1">
            <div className="flex items-center justify-between text-[11px] text-[#A8A294]">
              <span>Cohort Enrollment</span>
              <Users className="w-3.5 h-3.5 text-[#C19B48]" />
            </div>
            <div className="font-serif text-2xl font-bold text-[#F7F3E6]">
              {currentMetric ? currentMetric.totalStudents : aggregatedStats.totalStudents}
            </div>
            <div className="text-[10px] text-[#34D399]">
              {currentMetric ? currentMetric.activeWatchersToday : aggregatedStats.activeWatchersToday} watched video lectures today
            </div>
          </div>

          {/* Average Video & Syllabus Completion */}
          <div className="p-3.5 rounded-xl bg-[#262626] border border-[#3D3D3D] space-y-1">
            <div className="flex items-center justify-between text-[11px] text-[#A8A294]">
              <span>Cohort Avg Progress</span>
              <Video className="w-3.5 h-3.5 text-[#34D399]" />
            </div>
            <div className="font-serif text-2xl font-bold text-[#34D399]">
              {currentMetric ? currentMetric.avgCompletionRate : aggregatedStats.avgCompletionRate}%
            </div>
            <div className="text-[10px] text-[#A8A294]">
              Across {currentMetric ? currentMetric.totalLecturesCount : aggregatedStats.totalLectures} lectures ({currentMetric ? currentMetric.totalHours : aggregatedStats.totalHours} hrs)
            </div>
          </div>

          {/* Mains DAW Submission Rate */}
          <div className="p-3.5 rounded-xl bg-[#262626] border border-[#3D3D3D] space-y-1">
            <div className="flex items-center justify-between text-[11px] text-[#A8A294]">
              <span>Mains DAW Rate</span>
              <FileCheck className="w-3.5 h-3.5 text-[#C19B48]" />
            </div>
            <div className="font-serif text-2xl font-bold text-[#F7F3E6]">
              {currentMetric ? currentMetric.mainsDawSubmissionRate : aggregatedStats.avgMainsDawRate}%
            </div>
            <div className="text-[10px] text-[#A8A294]">
              Copies evaluated by faculty
            </div>
          </div>

          {/* At-Risk / Falling Behind */}
          <div className="p-3.5 rounded-xl bg-[#262626] border border-[#3D3D3D] space-y-1">
            <div className="flex items-center justify-between text-[11px] text-[#A8A294]">
              <span>At-Risk (&lt;35% Progress)</span>
              <AlertTriangle className="w-3.5 h-3.5 text-[#EF4444]" />
            </div>
            <div className="font-serif text-2xl font-bold text-[#EF4444]">
              {currentMetric ? currentMetric.atRiskStudentsCount : aggregatedStats.atRiskStudents}
            </div>
            <div className="text-[10px] text-[#F59E0B]">
              Delayed in video timeline
            </div>
          </div>
        </div>

        {/* 3. Subject-Wise Syllabus Completion Progress Bars (When course is selected) */}
        {currentMetric && currentMetric.subjectBreakdown.length > 0 && (
          <div className="pt-2 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#F7F3E6] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#C19B48]" />
                Subject-Wise Syllabus Progression in {currentMetric.shortCode}
              </span>
              <span className="text-[11px] text-[#A8A294]">
                Faculty Timelines Mapped
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentMetric.subjectBreakdown.map((subject, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-[#262626] border border-[#3D3D3D] space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="font-semibold text-[#F7F3E6] truncate">
                      {subject.subjectName}
                    </div>
                    <div className="font-mono text-xs font-bold text-[#E8CF8D]">
                      {subject.percentage}%
                    </div>
                  </div>

                  {/* Progress track */}
                  <div className="h-2 w-full bg-[#1E1E1E] rounded-full overflow-hidden border border-[#3D3D3D]">
                    <div
                      className={`h-full rounded-full ${
                        subject.percentage >= 80
                          ? 'bg-[#34D399]'
                          : subject.percentage >= 60
                          ? 'bg-[#C19B48]'
                          : 'bg-[#F59E0B]'
                      }`}
                      style={{ width: `${subject.percentage}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-[#A8A294]">
                    <span>
                      {subject.completedLectures}/{subject.totalLectures} Lectures Delivered
                    </span>
                    <span>{subject.faculty}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

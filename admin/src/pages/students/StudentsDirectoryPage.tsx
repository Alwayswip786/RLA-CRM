import React, { useState, useMemo } from 'react';
import {
  Search,
  Download,
  Video,
  Eye,
  ChevronRight,
  LayoutGrid,
  ListFilter,
  GraduationCap,
} from 'lucide-react';
import { MOCK_STUDENTS, MOCK_COURSE_METRICS } from '../../data/mockStudentDirectory';
import type { StudentRecord } from '../../types/student-directory';
import { StudentDetailDrawer } from './StudentDetailDrawer';
import { VideoProgressBar } from '../../components/students/VideoProgressBar';
import { CourseMetricsPanel } from '../../components/students/CourseMetricsPanel';
import { toast } from 'react-hot-toast';

export const StudentsDirectoryPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [courseFilter, setCourseFilter] = useState('ALL');
  const [batchFilter, setBatchFilter] = useState('ALL');
  const [progressFilter, setProgressFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState<'unified' | 'grouped'>('unified');
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Filter students
  const filteredStudents = useMemo(() => {
    return MOCK_STUDENTS.filter((std) => {
      // Search
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        std.name.toLowerCase().includes(query) ||
        std.rollNumber.toLowerCase().includes(query) ||
        std.phone.toLowerCase().includes(query) ||
        std.email.toLowerCase().includes(query);

      // Course
      const matchesCourse =
        courseFilter === 'ALL' || std.enrolledCourseId === courseFilter;

      // Batch
      const matchesBatch =
        batchFilter === 'ALL' || std.batch.toLowerCase().includes(batchFilter.toLowerCase());

      // Progress
      let matchesProgress = true;
      if (progressFilter === 'gt75') matchesProgress = std.overallCourseProgress >= 75;
      else if (progressFilter === '50to75')
        matchesProgress = std.overallCourseProgress >= 50 && std.overallCourseProgress < 75;
      else if (progressFilter === '25to50')
        matchesProgress = std.overallCourseProgress >= 25 && std.overallCourseProgress < 50;
      else if (progressFilter === 'lt25') matchesProgress = std.overallCourseProgress < 25;

      // Status
      const matchesStatus = statusFilter === 'ALL' || std.status === statusFilter;

      return matchesSearch && matchesCourse && matchesBatch && matchesProgress && matchesStatus;
    });
  }, [searchQuery, courseFilter, batchFilter, progressFilter, statusFilter]);

  // Grouped students by course
  const groupedCourses = useMemo(() => {
    const activeCourses =
      courseFilter === 'ALL'
        ? MOCK_COURSE_METRICS
        : MOCK_COURSE_METRICS.filter((c) => c.courseId === courseFilter);

    return activeCourses.map((course) => {
      const studentsInCourse = filteredStudents.filter(
        (std) => std.enrolledCourseId === course.courseId
      );
      return {
        course,
        students: studentsInCourse,
      };
    });
  }, [filteredStudents, courseFilter]);

  const handleOpenStudent = (std: StudentRecord) => {
    setSelectedStudent(std);
    setIsDrawerOpen(true);
  };

  const handleExportCSV = () => {
    toast.success(
      <div>
        <div className="font-semibold text-[#F7F3E6]">Exporting Student Course Progress & Video Logs to CSV</div>
        <div className="text-xs text-[#A8A294] mt-0.5">Generated report for {filteredStudents.length} students with exact timestamp records.</div>
      </div>
    );
  };

  return (
    <div className="space-y-6 select-none">
      {/* 1. Detail Inspector Drawer */}
      <StudentDetailDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        student={selectedStudent}
      />

      {/* 2. Top Header */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C19B48]/15 border border-[#C19B48]/30 text-[#C19B48] text-xs font-semibold">
            <Video className="w-3.5 h-3.5" />
            <span>Course Division & Video Telemetry Desk</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#F7F3E6]">
            Student Directory & Course Metrics
          </h1>
          <p className="text-xs text-[#A8A294] max-w-2xl leading-relaxed">
            Track student cohorts by course curriculum, monitor syllabus subject progress, and inspect video watch timestamps for every judicial aspirant.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-start md:self-auto">
          {/* View Mode Switcher */}
          <div className="flex items-center p-1 bg-[#262626] border border-[#3D3D3D] rounded-xl text-xs">
            <button
              onClick={() => setViewMode('unified')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'unified'
                  ? 'bg-[#C19B48] text-[#1E1E1E] font-bold shadow-xs'
                  : 'text-[#A8A294] hover:text-[#F7F3E6]'
              }`}
              title="Unified Roster Table"
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>Unified Table</span>
            </button>
            <button
              onClick={() => setViewMode('grouped')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'grouped'
                  ? 'bg-[#C19B48] text-[#1E1E1E] font-bold shadow-xs'
                  : 'text-[#A8A294] hover:text-[#F7F3E6]'
              }`}
              title="Grouped by Course Cohort"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>By Course Cohorts</span>
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2F2F2F] hover:bg-[#3D3D3D] text-[#F7F3E6] border border-[#3D3D3D] text-xs font-semibold transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-[#C19B48]" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* 3. Course Division Selector & Course-Wise Metrics Panel */}
      <CourseMetricsPanel
        metrics={MOCK_COURSE_METRICS}
        selectedCourseId={courseFilter}
        onSelectCourse={setCourseFilter}
        totalStudentsCount={MOCK_STUDENTS.length}
      />

      {/* 4. Advanced Multi-Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-[#A8A294] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student name, roll #, phone, email..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-xs text-[#F7F3E6] placeholder-[#A8A294] focus:outline-hidden focus:border-[#C19B48]"
            />
          </div>

          {/* Batch Shift Selector */}
          <div>
            <select
              value={batchFilter}
              onChange={(e) => setBatchFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-xs text-[#F7F3E6] focus:outline-hidden focus:border-[#C19B48] cursor-pointer"
            >
              <option value="ALL">All Batch Shifts</option>
              <option value="Morning">Morning Shift (Cohort A)</option>
              <option value="Evening">Evening Shift (Cohort B)</option>
              <option value="Weekend">Weekend Fastrack (Cohort C)</option>
            </select>
          </div>

          {/* Progress Bracket Selector */}
          <div>
            <select
              value={progressFilter}
              onChange={(e) => setProgressFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-xs text-[#F7F3E6] focus:outline-hidden focus:border-[#C19B48] cursor-pointer"
            >
              <option value="ALL">All Watch Progress</option>
              <option value="gt75">&gt; 75% High Performers</option>
              <option value="50to75">50% - 75% On Track</option>
              <option value="25to50">25% - 50% Needs Attention</option>
              <option value="lt25">&lt; 25% Critical Delay</option>
            </select>
          </div>
        </div>

        {/* Status filters row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#3D3D3D]/50 text-xs text-[#A8A294]">
          <div className="flex items-center gap-2">
            <span>Student Status:</span>
            {['ALL', 'active', 'needs_attention', 'suspended'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-2.5 py-1 rounded-lg text-xs capitalize transition-colors cursor-pointer ${
                  statusFilter === status
                    ? 'bg-[#C19B48] text-[#1E1E1E] font-bold'
                    : 'bg-[#262626] hover:bg-[#2F2F2F] text-[#A8A294] hover:text-[#F7F3E6] border border-[#3D3D3D]'
                }`}
              >
                {status === 'ALL' ? 'All Records' : status.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-[11px]">
            <span>
              Showing <strong className="text-[#F7F3E6]">{filteredStudents.length}</strong> of {MOCK_STUDENTS.length} students
            </span>
            {(searchQuery || courseFilter !== 'ALL' || batchFilter !== 'ALL' || progressFilter !== 'ALL' || statusFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setCourseFilter('ALL');
                  setBatchFilter('ALL');
                  setProgressFilter('ALL');
                  setStatusFilter('ALL');
                }}
                className="text-[#C19B48] hover:underline ml-2 cursor-pointer"
              >
                Reset All Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 5. Main Roster: VIEW MODE 1 - UNIFIED TABLE */}
      {viewMode === 'unified' && (
        <div className="rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#3D3D3D] bg-[#262626] text-[#A8A294] uppercase tracking-wider text-[10px] font-bold">
                  <th className="py-3.5 px-4">Student & Roll No</th>
                  <th className="py-3.5 px-4">Course & Batch Shift</th>
                  <th className="py-3.5 px-4 min-w-[170px]">Course Progress</th>
                  <th className="py-3.5 px-4 min-w-[240px]">Last Watched Video & Timestamp</th>
                  <th className="py-3.5 px-4">Watch Hours</th>
                  <th className="py-3.5 px-4">Gate RFID & Fees</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#3D3D3D]/60 text-[#F7F3E6]">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#A8A294]">
                      No student records match the selected course or filter options.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((std) => {
                    const lastVideo = std.videoLogs[0];
                    return (
                      <tr
                        key={std.id}
                        onClick={() => handleOpenStudent(std)}
                        className="hover:bg-[#2F2F2F]/60 transition-colors cursor-pointer group"
                      >
                        {/* Student Info */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-[#262626] border border-[#3D3D3D] group-hover:border-[#C19B48]/60 flex items-center justify-center font-bold text-xs text-[#C19B48] shrink-0">
                              {std.name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')}
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-sm text-[#F7F3E6] group-hover:text-[#E8CF8D] truncate flex items-center gap-1.5">
                                <span>{std.name}</span>
                                {std.activeDevice.concurrentSessions > 1 && (
                                  <span className="w-2 h-2 rounded-full bg-[#EF4444]" title="Multiple sessions logged in" />
                                )}
                              </div>
                              <div className="font-mono text-[11px] text-[#A8A294]">
                                {std.rollNumber} • {std.phone}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Course & Batch */}
                        <td className="py-3.5 px-4">
                          <div className="min-w-0 max-w-[200px]">
                            <div className="text-xs font-medium text-[#F7F3E6] truncate">
                              {std.enrolledCourseTitle}
                            </div>
                            <div className="text-[11px] text-[#C19B48] truncate">
                              {std.batch}
                            </div>
                          </div>
                        </td>

                        {/* Overall Progress */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-[#F7F3E6]">
                                {std.overallCourseProgress}%
                              </span>
                              <span className="text-[10px] text-[#A8A294]">
                                {std.completedModulesCount}/{std.totalModulesCount} Modules
                              </span>
                            </div>
                            <div className="h-2 w-full bg-[#262626] rounded-full overflow-hidden border border-[#3D3D3D]">
                              <div
                                className={`h-full rounded-full ${
                                  std.overallCourseProgress >= 75
                                    ? 'bg-[#34D399]'
                                    : std.overallCourseProgress >= 40
                                    ? 'bg-[#C19B48]'
                                    : 'bg-[#EF4444]'
                                }`}
                                style={{ width: `${std.overallCourseProgress}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Last Watched Video & Timestamp */}
                        <td className="py-3.5 px-4">
                          {lastVideo ? (
                            <div className="space-y-1 max-w-[260px]">
                              <div className="text-xs font-semibold text-[#F7F3E6] truncate">
                                {lastVideo.lectureTitle}
                              </div>
                              <VideoProgressBar
                                percentage={lastVideo.watchPercentage}
                                timestampText={lastVideo.watchedTimestamp}
                                status={lastVideo.status}
                                skipAlert={lastVideo.skipAlert}
                                showDetails={true}
                              />
                            </div>
                          ) : (
                            <span className="text-xs text-[#A8A294]">No video history</span>
                          )}
                        </td>

                        {/* Watch Hours & Activity */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-serif font-bold text-sm text-[#F7F3E6]">
                            {std.totalWatchTimeHours} hrs
                          </div>
                          <div className="text-[10px] text-[#A8A294]">
                            {std.lastActive}
                          </div>
                        </td>

                        {/* Gate RFID & Fee */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-mono text-[11px] text-[#A8A294]">
                            {std.rfidTurnstileId}
                          </div>
                          <div
                            className={`text-[10px] font-semibold ${
                              std.feeStatus === 'Paid in Full'
                                ? 'text-[#34D399]'
                                : 'text-[#EF4444]'
                            }`}
                          >
                            {std.feeStatus}
                          </div>
                        </td>

                        {/* Action */}
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenStudent(std);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#262626] group-hover:bg-[#C19B48] text-[#F7F3E6] group-hover:text-[#1E1E1E] border border-[#3D3D3D] group-hover:border-[#C19B48] font-semibold text-xs transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Inspect</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Main Roster: VIEW MODE 2 - GROUPED BY COURSE COHORTS */}
      {viewMode === 'grouped' && (
        <div className="space-y-6">
          {groupedCourses.map(({ course, students }) => (
            <div
              key={course.courseId}
              className="rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] overflow-hidden space-y-4 p-5 sm:p-6"
            >
              {/* Course Division Section Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#3D3D3D]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#262626] border border-[#C19B48]/50 flex items-center justify-center text-[#C19B48]">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-serif text-lg font-bold text-[#F7F3E6]">
                        {course.courseTitle}
                      </h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#C19B48]/20 text-[#E8CF8D] border border-[#C19B48]/30">
                        {course.shortCode}
                      </span>
                    </div>
                    <div className="text-xs text-[#A8A294] mt-0.5">
                      Faculty: <strong className="text-[#F7F3E6]">{course.facultyInCharge}</strong> •{' '}
                      {course.totalLecturesCount} Total Lectures ({course.totalHours} hrs)
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <div className="text-right">
                    <span className="text-[#A8A294]">Cohort Size:</span>{' '}
                    <strong className="text-[#F7F3E6]">{course.totalStudents} Aspirants</strong>
                  </div>
                  <div className="text-right">
                    <span className="text-[#A8A294]">Avg Progress:</span>{' '}
                    <strong className="text-[#34D399]">{course.avgCompletionRate}%</strong>
                  </div>
                </div>
              </div>

              {/* Course-Specific Students Table */}
              <div className="rounded-xl border border-[#3D3D3D] overflow-hidden bg-[#262626]">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[#3D3D3D] bg-[#1E1E1E] text-[#A8A294] uppercase tracking-wider text-[10px] font-bold">
                        <th className="py-3 px-4">Student</th>
                        <th className="py-3 px-4">Shift</th>
                        <th className="py-3 px-4 min-w-[150px]">Course Progress</th>
                        <th className="py-3 px-4 min-w-[220px]">Last Watched Timestamp</th>
                        <th className="py-3 px-4">Total Watch</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#3D3D3D]/50 text-[#F7F3E6]">
                      {students.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-xs text-[#A8A294]">
                            No matching students found in this course cohort under current search filters.
                          </td>
                        </tr>
                      ) : (
                        students.map((std) => {
                          const lastVideo = std.videoLogs[0];
                          return (
                            <tr
                              key={std.id}
                              onClick={() => handleOpenStudent(std)}
                              className="hover:bg-[#2F2F2F]/50 transition-colors cursor-pointer"
                            >
                              <td className="py-3 px-4">
                                <div className="font-semibold text-sm text-[#F7F3E6]">
                                  {std.name}
                                </div>
                                <div className="font-mono text-[11px] text-[#A8A294]">
                                  {std.rollNumber}
                                </div>
                              </td>

                              <td className="py-3 px-4">
                                <span className="text-xs text-[#C19B48]">{std.batch}</span>
                              </td>

                              <td className="py-3 px-4">
                                <div className="space-y-1 max-w-[140px]">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="font-bold text-[#F7F3E6]">{std.overallCourseProgress}%</span>
                                    <span className="text-[10px] text-[#A8A294]">{std.completedModulesCount}/{std.totalModulesCount}</span>
                                  </div>
                                  <div className="h-1.5 w-full bg-[#1E1E1E] rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${
                                        std.overallCourseProgress >= 75
                                          ? 'bg-[#34D399]'
                                          : std.overallCourseProgress >= 40
                                          ? 'bg-[#C19B48]'
                                          : 'bg-[#EF4444]'
                                      }`}
                                      style={{ width: `${std.overallCourseProgress}%` }}
                                    />
                                  </div>
                                </div>
                              </td>

                              <td className="py-3 px-4">
                                {lastVideo ? (
                                  <div className="space-y-0.5 max-w-[240px]">
                                    <div className="text-xs font-medium text-[#F7F3E6] truncate">
                                      {lastVideo.lectureTitle}
                                    </div>
                                    <VideoProgressBar
                                      percentage={lastVideo.watchPercentage}
                                      timestampText={lastVideo.watchedTimestamp}
                                      status={lastVideo.status}
                                      skipAlert={lastVideo.skipAlert}
                                      showDetails={true}
                                    />
                                  </div>
                                ) : (
                                  <span className="text-xs text-[#A8A294]">No video history</span>
                                )}
                              </td>

                              <td className="py-3 px-4">
                                <div className="font-bold text-xs text-[#F7F3E6]">{std.totalWatchTimeHours} hrs</div>
                                <div className="text-[10px] text-[#A8A294]">{std.lastActive}</div>
                              </td>

                              <td className="py-3 px-4 text-right">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenStudent(std);
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-[#1E1E1E] hover:bg-[#C19B48] text-[#F7F3E6] hover:text-[#1E1E1E] border border-[#3D3D3D] text-xs font-medium transition-colors cursor-pointer"
                                >
                                  Inspect
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

import React from 'react';
import {
  BookOpen,
  Plus,
  Users,
  ArrowRight,
} from 'lucide-react';
import { MOCK_COURSE_METRICS } from '../../data/mockStudentDirectory';
import { toast } from 'react-hot-toast';

export const CoursesAllPage: React.FC = () => {
  return (
    <div className="space-y-6 select-none">
      {/* Header */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C19B48]/15 border border-[#C19B48]/30 text-[#C19B48] text-xs font-semibold">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Academic Curriculum Builder</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#F7F3E6]">
            Course Offerings & Curricula Hub
          </h1>
          <p className="text-xs text-[#A8A294] max-w-2xl leading-relaxed">
            Manage comprehensive judiciary foundation courses, Bare Act specialized modules, lecture roadmaps, and academic lesson milestones.
          </p>
        </div>

        <button
          onClick={() => toast('New Course Curriculum Creator Opened', { icon: 'ℹ️' })}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C19B48] hover:bg-[#D8B862] text-[#1E1E1E] text-xs font-bold transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Course Curriculum</span>
        </button>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {MOCK_COURSE_METRICS.map((course) => (
          <div
            key={course.courseId}
            className="p-6 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] hover:border-[#C19B48]/50 transition-colors space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#C19B48]/15 text-[#E8CF8D] border border-[#C19B48]/30">
                  {course.shortCode}
                </span>
                <span className="text-xs text-[#34D399] font-semibold flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {course.totalStudents} Enrolled
                </span>
              </div>

              <div>
                <h3 className="font-serif text-lg font-bold text-[#F7F3E6]">
                  {course.courseTitle}
                </h3>
                <p className="text-xs text-[#A8A294] mt-1">
                  Lead Faculty: <strong className="text-[#F7F3E6]">{course.facultyInCharge}</strong>
                </p>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-[#262626] border border-[#3D3D3D] text-center text-xs">
                <div>
                  <div className="text-[10px] text-[#A8A294]">Total Lectures</div>
                  <div className="font-bold text-[#F7F3E6] font-serif">{course.totalLecturesCount}</div>
                </div>
                <div>
                  <div className="text-[10px] text-[#A8A294]">Duration</div>
                  <div className="font-bold text-[#F7F3E6] font-serif">{course.totalHours} hrs</div>
                </div>
                <div>
                  <div className="text-[10px] text-[#A8A294]">Cohort Avg</div>
                  <div className="font-bold text-[#34D399] font-serif">{course.avgCompletionRate}%</div>
                </div>
              </div>

              {/* Subject Breakdown Chips */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#A8A294]">
                  Key Syllabus Subjects:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {course.subjectBreakdown.map((s, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-[#262626] border border-[#3D3D3D] text-[11px] text-[#A8A294]"
                    >
                      {s.subjectName} ({s.percentage}%)
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-3 border-t border-[#3D3D3D] flex items-center justify-between">
              <span className="text-xs text-[#A8A294]">
                Active in: {course.activeBatches.join(', ')}
              </span>
              <button
                onClick={() => toast.success(`Viewing syllabus for ${course.shortCode}`)}
                className="flex items-center gap-1.5 text-xs text-[#C19B48] hover:text-[#E8CF8D] font-bold cursor-pointer"
              >
                <span>Edit Curriculum</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

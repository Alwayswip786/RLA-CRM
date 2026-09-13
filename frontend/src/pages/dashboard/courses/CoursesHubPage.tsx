import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  ArrowUpDown,
} from 'lucide-react';

interface Course {
  id: string;
  title: string;
  subtitle: string;
  enrolledDate: string;
  progress: number;
  instructor: string;
  thumbnailTag: string;
  thumbnailBg: string;
}

const enrolledCourses: Course[] = [
  {
    id: 'djs-foundation',
    title: 'Judicial Services (PCS-J) Comprehensive Foundation 2025-26',
    subtitle: 'Delhi, UP, Haryana & MP Judicial syllabus line-by-line coverage',
    enrolledDate: 'October 5, 2024',
    progress: 28.95,
    instructor: 'Adv. Rajinder Sir',
    thumbnailTag: 'JUDICIARY 360°',
    thumbnailBg: 'from-[#0a1c36] to-[#143564]',
  },
  {
    id: 'java-dsa',
    title: 'Java & DSA Domination',
    subtitle: 'From zero to mastery in Data Structures, Algorithms & System Design',
    enrolledDate: 'August 25, 2024',
    progress: 7.97,
    instructor: 'Harshit Sharma',
    thumbnailTag: 'DSA DOMINATION',
    thumbnailBg: 'from-[#14233c] to-[#1c3860]',
  },
  {
    id: 'bns-mastery',
    title: 'Bhartiya Nyaya Sanhita (BNS) & Criminal Law Domination',
    subtitle: 'IPC vs BNS comparative analysis, case laws & charge framing',
    enrolledDate: 'August 25, 2024',
    progress: 7.97,
    instructor: 'Adv. Rajinder Sir',
    thumbnailTag: 'NEW CRIMINAL LAWS',
    thumbnailBg: 'from-[#14233c] to-[#1c3860]',
  },
  {
    id: 'cpc-chambers',
    title: 'Civil Procedure Code (CPC) & Pleadings Drafting Mastery',
    subtitle: 'Order 1 to 51, Plaints, Injunctions & Execution of Decrees',
    enrolledDate: 'May 22, 2024',
    progress: 90.8,
    instructor: 'Adv. Rajinder Sir',
    thumbnailTag: 'PROCEDURAL LAW',
    thumbnailBg: 'from-[#061120] to-[#0e274b]',
  },
  {
    id: 'const-law',
    title: 'Constitutional Law & Landmark Supreme Court Judgments',
    subtitle: 'Articles 1 to 395, Basic Structure doctrine, Writs & Ratio',
    enrolledDate: 'December 3, 2023',
    progress: 77.82,
    instructor: 'Adv. Neha Sharma',
    thumbnailTag: 'CONSTITUTION',
    thumbnailBg: 'from-[#0f1f38] to-[#1c3459]',
  },
];

export const CoursesHubPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'oldest' | 'newest' | 'progress'>('oldest');

  const filteredCourses = enrolledCourses
    .filter((c) =>
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'progress') return b.progress - a.progress;
      if (sortBy === 'newest') return b.enrolledDate.localeCompare(a.enrolledDate);
      return a.enrolledDate.localeCompare(b.enrolledDate);
    });

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Top Bar */}
      <div>
        <h1 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 dark:text-white">
          Classroom
        </h1>
      </div>

      {/* Enrolled Courses List */}
      <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-base sm:text-lg font-serif font-bold text-slate-900 dark:text-white">
              Your Enrolled Courses
            </h2>

            <div className="flex items-center gap-2">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search"
                  className="pl-8 pr-3 py-1.5 rounded-xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#c19b48]"
                />
              </div>

              {/* Sort By Dropdown */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="pl-3 pr-7 py-1.5 rounded-xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:border-[#c19b48] cursor-pointer appearance-none"
                >
                  <option value="oldest">Sort By Oldest ⇅</option>
                  <option value="newest">Sort By Newest ⇅</option>
                  <option value="progress">Sort By Progress ⇅</option>
                </select>
                <ArrowUpDown className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Course Cards */}
          <div className="space-y-4">
            {filteredCourses.map((course) => (
              <div
                key={course.id}
                className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs hover:border-[#c19b48]/60 transition-all group"
              >
                {/* Thumbnail & Title Area */}
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  {/* Thumbnail Box matching 16:9 in image */}
                  <div
                    className={`w-28 sm:w-36 h-20 sm:h-24 rounded-xl bg-gradient-to-br ${course.thumbnailBg} border border-slate-200 dark:border-[#143564] flex flex-col items-center justify-center p-2 text-center shrink-0 relative overflow-hidden shadow-inner`}
                  >
                    <span className="text-[8px] font-bold text-[#c19b48] tracking-widest uppercase bg-black/50 px-1.5 py-0.5 rounded border border-white/10 mb-1">
                      {course.thumbnailTag}
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
                      onClick={() => navigate(`/dashboard/courses/${course.id}`)}
                      className="text-sm sm:text-base font-serif font-bold text-slate-900 dark:text-white group-hover:text-[#c19b48] transition-colors line-clamp-1 cursor-pointer"
                    >
                      {course.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Enrolled on {course.enrolledDate}
                    </p>
                    <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      Progress {course.progress}%
                    </p>

                    {/* Progress Bar matching reference image */}
                    <div className="w-full bg-slate-100 dark:bg-[#061120] rounded-full h-1.5 overflow-hidden border border-slate-200 dark:border-[#143564] max-w-md">
                      <div
                        className="h-full bg-gradient-to-r from-[#c19b48] to-[#e8cf8d] rounded-full transition-all duration-500"
                        style={{ width: `${course.progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Right Action Button */}
                <div className="flex items-center w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-[#143564]">
                  <button
                    onClick={() => navigate(`/dashboard/courses/${course.id}`)}
                    className="w-full sm:w-36 py-2.5 px-4 rounded-xl bg-[#c19b48] hover:bg-[#d8b862] text-[#061120] font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <span>Resume Learning</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
  );
};

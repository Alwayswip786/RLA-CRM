import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  Trophy,
  Award,
  Bookmark,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  ExternalLink,
  PlayCircle,
  Bell,
  PanelRightClose,
  PanelRightOpen,
  Share2,
  Lock,
  Check,
  FileText,
  Play,
} from 'lucide-react';
import { toast } from 'sonner';
import { ThemeSwitcher } from '../../../components/dashboard/ThemeSwitcher';

interface ModuleSubItem {
  id: string;
  title: string;
  type: 'lecture' | 'resource' | 'quiz' | 'problem';
  duration?: string;
  completed?: boolean;
  score?: string;
  url?: string;
}

interface Module {
  id: string;
  title: string;
  isCompleted?: boolean;
  badge?: string;
  items: ModuleSubItem[];
}

interface LeaderboardUser {
  rank: number;
  name: string;
  points: string;
  avatarColor: string;
  isCurrent?: boolean;
  avatarUrl?: string;
}

export const CourseDetailPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  // Active view tab in left section
  const [activeTab, setActiveTab] = useState<'modules' | 'announcements'>('modules');

  // Active right sidebar tab: 'leaderboard' | 'certificate' | 'bookmarks'
  const [activeRightTab, setActiveRightTab] = useState<'leaderboard' | 'certificate' | 'bookmarks'>('leaderboard');
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);

  // Accordion open/close state
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({
    resources: true,
    'before-we-start': true,
    'module-1': false,
    'module-2': false,
    'module-3': false,
    'module-4': false,
  });

  // Bookmarks state
  const [savedBookmarks, setSavedBookmarks] = useState<string[]>([
    'BNS Sec 100 vs 101 Homicide distinction',
    'Hit-and-run special reporting clause notes',
  ]);

  const toggleModule = (id: string) => {
    setExpandedModules((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Course metadata
  const courseTitles: Record<string, string> = {
    'java-dsa': 'Java & DSA Domination',
    'djs-foundation': 'Judicial Services (PCS-J) Comprehensive Foundation 2025-26',
    'bns-mastery': 'Bhartiya Nyaya Sanhita (BNS) & Criminal Law Domination',
    'cpc-chambers': 'Civil Procedure Code (CPC) & Pleadings Drafting Mastery',
    'constitution-bench': 'Constitution Law & Landmark Constitutional Benches',
  };

  const currentTitle =
    (courseId && courseTitles[courseId]) || 'Java & DSA Domination';

  // Modules list replicating Images 2, 3, 4 & 6
  const modules: Module[] = [
    {
      id: 'resources',
      title: 'Resources',
      items: [
        {
          id: 'res-1',
          title: 'DSA Sheets for Service-Based Companies',
          type: 'resource',
          url: '#dsa-service-sheet',
        },
        {
          id: 'res-2',
          title: 'DSA sheet for Product-Based Companies',
          type: 'resource',
          url: '#dsa-product-sheet',
        },
      ],
    },
    {
      id: 'before-we-start',
      title: 'Before We Start',
      isCompleted: true,
      badge: 'Completed',
      items: [
        {
          id: 'lesson-1',
          title: 'Course Overview',
          type: 'lecture',
          completed: true,
          duration: '18 mins',
          score: '10/10',
        },
        {
          id: 'lesson-doubt',
          title: 'Doubt Support',
          type: 'lecture',
          completed: true,
          duration: '14 mins',
          score: '10/10',
        },
      ],
    },
    {
      id: 'module-install',
      title: '1 - Installation and IDE',
      items: [
        {
          id: 'lesson-1',
          title: 'Java Installation & Choosing the Right IDE',
          type: 'lecture',
          duration: '28 mins',
          score: '10/10',
        },
        {
          id: 'lesson-2',
          title: 'IDE Full Form',
          type: 'quiz',
          score: '20/20',
        },
        {
          id: 'lesson-3',
          title: 'File Extension for Java',
          type: 'quiz',
          score: '20/20',
        },
        {
          id: 'lesson-4',
          title: 'Create a New Java Class',
          type: 'quiz',
          score: '20/20',
        },
        {
          id: 'lesson-5',
          title: 'Entry Point of a Program',
          type: 'quiz',
          score: '20/20',
        },
        {
          id: 'lesson-6',
          title: 'Two Sum',
          type: 'problem',
          score: '10/10',
        },
        {
          id: 'lesson-7',
          title: 'Installation & IDE',
          type: 'resource',
          score: '0/1',
        },
      ],
    },
    {
      id: 'module-fundamentals',
      title: 'Fundamentals of Programming',
      items: [
        {
          id: 'f-1',
          title: 'Variables, Data Types & Memory Allocation in Java',
          type: 'lecture',
          duration: '45 mins',
        },
        {
          id: 'f-2',
          title: 'Conditionals, Switch Cases and Loops',
          type: 'lecture',
          duration: '50 mins',
        },
      ],
    },
    {
      id: 'module-ds-intro',
      title: 'Introduction to DS - Arrays & String',
      items: [
        {
          id: 'ds-1',
          title: 'Memory Allocation, 1D and 2D Arrays',
          type: 'lecture',
          duration: '52 mins',
        },
        {
          id: 'ds-2',
          title: 'String Pool, Immutability & StringBuilder',
          type: 'lecture',
          duration: '48 mins',
        },
      ],
    },
    {
      id: 'module-oop',
      title: 'Object Oriented Programming',
      items: [
        {
          id: 'oop-1',
          title: 'Classes, Objects, Constructors & this Keyword',
          type: 'lecture',
          duration: '60 mins',
        },
        {
          id: 'oop-2',
          title: 'Inheritance, Polymorphism & Abstraction',
          type: 'lecture',
          duration: '75 mins',
        },
      ],
    },
    {
      id: 'module-dsa-essentials',
      title: 'DSA Essentials',
      items: [
        {
          id: 'dsa-1',
          title: 'Time & Space Complexity Big-O Deep Dive',
          type: 'lecture',
          duration: '55 mins',
        },
        {
          id: 'dsa-2',
          title: 'Recursion & Backtracking Blueprint',
          type: 'lecture',
          duration: '70 mins',
        },
      ],
    },
  ];

  // Leaderboard data replicating Image 2 & 3
  const topPodium = {
    first: { name: 'Vaibhav', initial: 'V', points: '26.22k points' },
    second: { name: 'Abhima', points: '26.2k points' },
    third: { name: 'Krishna', points: '25.05k points' },
  };

  const rankedUsers: LeaderboardUser[] = [
    { rank: 4, name: 'Arpit _', points: '23.93k', avatarColor: 'bg-pink-600' },
    { rank: 5, name: 'Vaibhav Tiwari', points: '23.27k', avatarColor: 'bg-indigo-600' },
    { rank: 6, name: 'Aadarsh Dangi', points: '23.12k', avatarColor: 'bg-amber-600' },
    { rank: 7, name: 'Ronit Kumar', points: '22.52k', avatarColor: 'bg-rose-600' },
    { rank: 8, name: 'Kaustubh Sharma', points: '21.36k', avatarColor: 'bg-cyan-600' },
    { rank: 9, name: 'Abhay Dhaneshwar', points: '20.25k', avatarColor: 'bg-blue-600' },
    { rank: 10, name: 'You (Aspirant)', points: '19.28k', avatarColor: 'bg-[#c19b48]', isCurrent: true },
    { rank: 11, name: 'Pooja Yadav', points: '18.36k', avatarColor: 'bg-teal-600' },
    { rank: 12, name: 'Himani', points: '18.07k', avatarColor: 'bg-sky-600' },
  ];

  const handleLessonLaunch = (lessonId: string) => {
    navigate(`/dashboard/courses/${courseId || 'bns-mastery'}/learn/${lessonId}`);
  };

  const handleResourceOpen = (resTitle: string) => {
    toast.success(`Opening resource: ${resTitle}`);
  };

  const handleToggleBookmark = (itemTitle: string) => {
    if (savedBookmarks.includes(itemTitle)) {
      setSavedBookmarks(savedBookmarks.filter((b) => b !== itemTitle));
      toast.info(`Removed bookmark: ${itemTitle}`);
    } else {
      setSavedBookmarks([...savedBookmarks, itemTitle]);
      toast.success(`Saved bookmark: ${itemTitle}`);
    }
  };

  return (
    <div className="h-screen max-h-screen bg-[#F7F3E6] dark:bg-[#040b14] text-slate-900 dark:text-slate-100 p-2.5 sm:p-3.5 lg:p-4 transition-colors flex flex-col overflow-hidden">
      <div className="max-w-[1600px] w-full mx-auto flex-1 flex flex-col space-y-2.5 animate-in fade-in duration-200 min-h-0 overflow-hidden">
        {/* Top Header Card */}
        <div className="rounded-2xl bg-white dark:bg-[#0b1322] border border-slate-200 dark:border-[#16253d] p-3.5 sm:p-4 shadow-xs transition-colors shrink-0">
          {/* Back Link, Title & Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard/courses')}
              className="flex items-center gap-2.5 text-base sm:text-lg font-serif font-bold text-slate-900 dark:text-slate-100 hover:text-[#c19b48] transition-colors group cursor-pointer text-left"
            >
              <ArrowLeft className="w-5 h-5 text-slate-500 dark:text-slate-400 group-hover:-translate-x-1 transition-transform shrink-0" />
              <span className="truncate">{currentTitle}</span>
            </button>

            <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
              <ThemeSwitcher />

              <button
                type="button"
                onClick={() => handleLessonLaunch('lesson-1')}
                className="px-4 py-2 rounded-xl bg-[#c19b48] hover:bg-[#d8b862] text-[#061120] text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs hover:shadow-md cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-[#061120]" />
                <span>Continue Lesson</span>
              </button>

            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast.success('Course syllabus link copied!');
              }}
              className="p-2 rounded-xl bg-slate-100 dark:bg-[#111c30] text-slate-600 dark:text-slate-300 hover:text-[#c19b48] hover:bg-slate-200 dark:hover:bg-[#16253d] transition-colors cursor-pointer border border-slate-200/60 dark:border-[#16253d]"
              title="Share Course Link"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress Bar & Metrics */}
        <div>
          <div className="flex items-center justify-between text-xs font-semibold mb-2">
            <span className="text-[#c19b48] dark:text-[#e8cf8d] font-semibold tracking-wide">
              7.97% Syllabus Complete
            </span>
            <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
              Target: 70% for Certification
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 bg-slate-100 dark:bg-[#15233c] rounded-full overflow-hidden mb-4 border border-slate-200/50 dark:border-[#1e3458]/40">
            <div
              className="h-full bg-gradient-to-r from-[#c19b48] to-[#e8cf8d] rounded-full transition-all duration-700 shadow-xs"
              style={{ width: '7.97%' }}
            />
          </div>

          {/* Metric Stats Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs font-medium">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#070d18] border border-slate-200 dark:border-[#16253d]">
              <div className="text-[10px] text-slate-500 dark:text-slate-400">Completed Modules</div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">1 / 26</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#070d18] border border-slate-200 dark:border-[#16253d]">
              <div className="text-[10px] text-slate-500 dark:text-slate-400">Sub-Modules</div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">6 / 117</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#070d18] border border-slate-200 dark:border-[#16253d]">
              <div className="text-[10px] text-slate-500 dark:text-slate-400">Total Score</div>
              <div className="text-xs font-bold text-[#c19b48] dark:text-[#e8cf8d]">
                2.15k <span className="text-[10px] text-slate-400 font-normal">/26.94k</span>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#070d18] border border-slate-200 dark:border-[#16253d]">
              <div className="text-[10px] text-slate-500 dark:text-slate-400">Cohort Standing</div>
              <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">#5 in Batch</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#070d18] border border-slate-200 dark:border-[#16253d]">
              <div className="text-[10px] text-slate-500 dark:text-slate-400">Live Doubt Class</div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Saturday 6 PM</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#070d18] border border-slate-200 dark:border-[#16253d]">
              <div className="text-[10px] text-slate-500 dark:text-slate-400">Certificate Status</div>
              <div className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <Lock className="w-3 h-3" />
                <span>62.03% to Unlock</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dual-Column Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-2.5 min-h-0 overflow-hidden items-stretch">
        {/* Left Column: Modules & Announcements */}
        <div className={`${isRightSidebarOpen ? 'lg:col-span-7 xl:col-span-7 2xl:col-span-7' : 'lg:col-span-11 xl:col-span-11'} flex flex-col min-h-0 h-full overflow-hidden`}>
          <div className="flex-1 rounded-2xl bg-white dark:bg-[#0b1322] border border-slate-200 dark:border-[#16253d] p-3.5 sm:p-4 shadow-xs transition-colors flex flex-col min-h-0 overflow-hidden">
            {/* Top Navigation Tabs */}
            <div className="flex items-center gap-6 border-b border-slate-200 dark:border-[#16253d] pb-3 mb-3 text-sm font-medium shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('modules')}
                className={`flex items-center gap-2 pb-1 border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'modules'
                    ? 'border-[#c19b48] text-[#c19b48] dark:text-[#e8cf8d] font-semibold'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                All Modules
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('announcements')}
                className={`flex items-center gap-2 pb-1 border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'announcements'
                    ? 'border-[#c19b48] text-[#c19b48] dark:text-[#e8cf8d] font-semibold'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Bell className="w-4 h-4" />
                Announcements
              </button>
            </div>

            {/* Tab: All Modules Accordions */}
            {activeTab === 'modules' && (
              <div className="flex-1 min-h-0 overflow-y-auto pr-1.5 custom-scrollbar space-y-2.5">
                {modules.map((mod) => {
                  const isOpen = expandedModules[mod.id];
                  return (
                    <div
                      key={mod.id}
                      className="rounded-xl border border-slate-200 dark:border-[#16253d] bg-slate-50 dark:bg-[#070d18] overflow-hidden transition-colors"
                    >
                      {/* Accordion Header */}
                      <button
                        type="button"
                        onClick={() => toggleModule(mod.id)}
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-100 dark:hover:bg-[#0d182b] transition-colors cursor-pointer"
                      >
                        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 pr-2">
                          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{mod.title}</span>
                          {mod.badge && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                              <Check className="w-3 h-3" />
                              {mod.badge}
                            </span>
                          )}
                          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                            • {mod.items.length} {mod.items.length === 1 ? 'item' : 'items'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 shrink-0">
                          <span className="text-xs font-medium text-slate-400 dark:text-slate-500 hidden sm:inline">
                            {mod.isCompleted ? 'Completed' : isOpen ? 'Hide' : 'Explore'}
                          </span>
                          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </button>

                      {/* Accordion Content */}
                      {isOpen && (
                        <div className="border-t border-slate-200 dark:border-[#16253d] bg-white dark:bg-[#050a14] divide-y divide-slate-100 dark:divide-[#131f33]">
                          {mod.items.map((item) => (
                            <div
                              key={item.id}
                              className="p-3.5 px-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-[#0c1628] transition-colors group"
                            >
                              {/* Left icon, title & category tag */}
                              <div className="flex items-center gap-3 min-w-0 pr-3">
                                {item.type === 'resource' ? (
                                  <ExternalLink className="w-4 h-4 text-[#c19b48] dark:text-[#e8cf8d] shrink-0 group-hover:scale-110 transition-transform" />
                                ) : item.completed ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                ) : (
                                  <PlayCircle className="w-4 h-4 text-[#c19b48] dark:text-[#e8cf8d] shrink-0 group-hover:scale-110 transition-transform" />
                                )}

                                <div className="flex items-center gap-2 min-w-0">
                                  <span
                                    onClick={() => {
                                      if (item.type === 'resource') {
                                        handleResourceOpen(item.title);
                                      } else {
                                        handleLessonLaunch(item.id);
                                      }
                                    }}
                                    className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white cursor-pointer truncate"
                                  >
                                    {item.title}
                                  </span>
                                  <span className="hidden sm:inline-block text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#131f33] text-slate-500 dark:text-slate-400 shrink-0">
                                    {item.type === 'resource'
                                      ? 'Resource PDF'
                                      : item.type === 'quiz'
                                      ? 'Assessment'
                                      : item.type === 'problem'
                                      ? 'Coding Practice'
                                      : 'Video Lecture'}
                                  </span>
                                </div>
                              </div>

                              {/* Right action / meta */}
                              <div className="flex items-center gap-2.5 shrink-0">
                                {item.score && (
                                  <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline font-mono">
                                    {item.score}
                                  </span>
                                )}
                                {item.duration && (
                                  <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono hidden sm:inline">
                                    {item.duration}
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleToggleBookmark(item.title)}
                                  className="text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 p-1 cursor-pointer"
                                  title="Bookmark item"
                                >
                                  <Bookmark
                                    className={`w-3.5 h-3.5 ${
                                      savedBookmarks.includes(item.title)
                                        ? 'fill-amber-500 text-amber-500 dark:fill-amber-400 dark:text-amber-400'
                                        : ''
                                    }`}
                                  />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Tab: Announcements */}
            {activeTab === 'announcements' && (
              <div className="flex-1 min-h-0 overflow-y-auto pr-1.5 custom-scrollbar space-y-3 py-1">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#070d18] border border-slate-200 dark:border-[#16253d]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-[#c19b48] dark:text-[#e8cf8d]">Adv. Rajinder Sir</span>
                    <span className="text-[11px] text-slate-500">Yesterday at 6:30 PM</span>
                  </div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-200 mb-1">
                    Special Session: Landmark 2024 SC Rulings on Sec 106 Hit & Run
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Dear Aspirants, please review the uploaded PDF comparison chart before attending Saturday's live
                    doubt resolution. We will evaluate how judicial exam questions will be framed under the new
                    provisions.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#070d18] border border-slate-200 dark:border-[#16253d]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-[#c19b48] dark:text-[#e8cf8d]">Academy Academic Cell</span>
                    <span className="text-[11px] text-slate-500">3 days ago</span>
                  </div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-200 mb-1">
                    Full Syllabus Mock Series Prelims Test #3 Activated
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Test #3 covering General Exceptions & Offences against body is now live in the Prelims Test portal.
                    Rankings will contribute to the Leaderboard.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Tab View & Icon Rail (Leaderboard / Certificates / Bookmarks) */}
        <div className={`${isRightSidebarOpen ? 'lg:col-span-5 xl:col-span-5 2xl:col-span-5' : 'lg:col-span-1 xl:col-span-1'} flex gap-2 min-w-0 min-h-0 h-full overflow-hidden`}>
          {/* Main Card Content */}
          {isRightSidebarOpen && (
            <div className="flex-1 rounded-2xl bg-white dark:bg-[#0b1322] border border-slate-200 dark:border-[#16253d] p-3.5 sm:p-4 shadow-xs min-w-0 transition-colors overflow-hidden flex flex-col min-h-0 h-full">
              {/* TAB 1: LEADERBOARD (Replicating Image 2 & 3) */}
              {activeRightTab === 'leaderboard' && (
                <div className="flex-1 flex flex-col min-h-0">
                  {/* Title & Badge */}
                  <div className="flex items-center justify-between mb-3 shrink-0">
                    <div className="flex items-center gap-2 text-sm font-semibold text-[#c19b48] dark:text-[#e8cf8d]">
                      <Trophy className="w-4 h-4" />
                      Leaderboard
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#131f33] text-slate-600 dark:text-slate-300">
                      142 Aspirants
                    </span>
                  </div>

                  {/* Top 3 Podium visualization - Responsive & Overflow Safe */}
                  <div className="flex items-end justify-center gap-2 sm:gap-3 mb-3.5 pt-1 px-1 w-full max-w-full shrink-0">
                    {/* 2nd Place (Yellow pillar, Left) */}
                    <div className="flex-1 min-w-0 max-w-[95px] flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full border-2 border-amber-400 overflow-hidden bg-amber-500/20 flex items-center justify-center text-amber-700 dark:text-amber-200 font-bold text-xs mb-1.5 shadow-xs shrink-0">
                        AB
                      </div>
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-200 mb-2 truncate max-w-full text-center px-0.5">
                        {topPodium.second.name}
                      </span>
                      <div className="w-full h-24 bg-[#fde047] text-slate-950 rounded-t-xl flex flex-col items-center justify-center p-1 shadow-md">
                        <span className="text-xs font-bold">2nd</span>
                        <span className="text-[10px] font-semibold text-slate-800">
                          {topPodium.second.points}
                        </span>
                      </div>
                    </div>

                    {/* 1st Place (Blue pillar, Center - Tallest) */}
                    <div className="flex-1 min-w-0 max-w-[105px] flex flex-col items-center -mt-4 z-10">
                      <div className="w-12 h-12 rounded-full bg-pink-600 border-2 border-sky-400 flex items-center justify-center text-white font-bold text-sm mb-1.5 shadow-lg shrink-0">
                        {topPodium.first.initial}
                      </div>
                      <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 mb-2 truncate max-w-full text-center px-0.5">
                        {topPodium.first.name}
                      </span>
                      <div className="w-full h-32 bg-[#93c5fd] text-slate-950 rounded-t-xl flex flex-col items-center justify-center p-1 shadow-lg relative">
                        <Trophy className="w-5 h-5 text-white mb-1 drop-shadow-xs" />
                        <span className="text-sm font-extrabold">1st</span>
                        <span className="text-[10px] font-bold text-slate-800">
                          {topPodium.first.points}
                        </span>
                      </div>
                    </div>

                    {/* 3rd Place (Peach pillar, Right) */}
                    <div className="flex-1 min-w-0 max-w-[95px] flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full border-2 border-amber-400 overflow-hidden bg-amber-500/20 flex items-center justify-center text-amber-700 dark:text-amber-200 font-bold text-xs mb-1.5 shadow-xs shrink-0">
                        KR
                      </div>
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-200 mb-2 truncate max-w-full text-center px-0.5">
                        {topPodium.third.name}
                      </span>
                      <div className="w-full h-20 bg-[#fed7aa] text-slate-950 rounded-t-xl flex flex-col items-center justify-center p-1 shadow-md">
                        <span className="text-xs font-bold">3rd</span>
                        <span className="text-[10px] font-semibold text-slate-800">
                          {topPodium.third.points}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Leaderboard Table */}
                  <div className="flex-1 flex flex-col min-h-0 rounded-xl border border-slate-200 dark:border-[#16253d] bg-slate-50 dark:bg-[#070d18] overflow-hidden transition-colors">
                    {/* Header */}
                    <div className="grid grid-cols-12 px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-[#0e192c] border-b border-slate-200 dark:border-[#16253d] shrink-0">
                      <div className="col-span-6">Name</div>
                      <div className="col-span-3 text-center">Rank</div>
                      <div className="col-span-3 text-right">Points</div>
                    </div>

                    {/* Rows */}
                    <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar divide-y divide-slate-200 dark:divide-[#131f33]">
                      {rankedUsers.map((u) => (
                        <div
                          key={u.rank}
                          className={`grid grid-cols-12 items-center px-3.5 py-2.5 text-xs transition-colors ${
                            u.isCurrent
                              ? 'bg-amber-500/10 dark:bg-[#c19b48]/15 text-amber-950 dark:text-[#e8cf8d] font-medium border-l-2 border-[#c19b48]'
                              : 'hover:bg-slate-100 dark:hover:bg-[#0d182b] text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div className="col-span-6 flex items-center gap-2 min-w-0 pr-1">
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 ${u.avatarColor}`}
                            >
                              {u.name.charAt(0)}
                            </div>
                            <span className="truncate">{u.name}</span>
                          </div>
                          <div className="col-span-3 text-center font-semibold text-slate-700 dark:text-slate-300">
                            #{u.rank}
                          </div>
                          <div className="col-span-3 text-right font-medium text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                            {u.points}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: CERTIFICATES (Replicating Image 4) */}
              {activeRightTab === 'certificate' && (
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#c19b48] dark:text-[#e8cf8d] mb-4 shrink-0">
                    <Award className="w-4 h-4" />
                    Certificate
                  </div>

                  <div className="flex-1 min-h-0 overflow-y-auto pr-1 custom-scrollbar space-y-3">
                    {/* Certificate 1: Score 70% */}
                    <div className="rounded-xl border border-slate-200 dark:border-[#16253d] bg-slate-50 dark:bg-[#070d18] p-4 flex gap-3 hover:border-slate-300 dark:hover:border-[#274068] transition-colors">
                      {/* Left certificate preview card */}
                      <div className="w-28 sm:w-32 h-20 bg-white rounded-lg p-2 shadow-xs flex flex-col justify-between shrink-0 border border-amber-300/40 relative overflow-hidden">
                        <div className="flex justify-between items-start">
                          <span className="text-[8px] font-bold text-slate-900 tracking-tighter">
                            ACADEMY
                          </span>
                          <span className="text-[7px] font-semibold text-amber-700 bg-amber-100 px-1 rounded">
                            70%
                          </span>
                        </div>
                        <div className="space-y-0.5">
                          <div className="h-1 bg-slate-300 rounded w-16" />
                          <div className="h-1 bg-slate-200 rounded w-12" />
                        </div>
                        <div className="flex justify-between items-center text-[7px] text-slate-500 border-t border-slate-200 pt-0.5">
                          <span>FOUNDATION</span>
                          <span className="text-amber-600 font-bold">VERIFIED</span>
                        </div>
                      </div>

                      {/* Right Details */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="mb-1">
                            <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-[#c19b48]/15 text-[#c19b48] dark:text-[#e8cf8d] border border-[#c19b48]/30">
                              Score 70%
                            </span>
                          </div>
                          <h4 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100">
                            Certificate of progress
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                            Achieved at 70% syllabus completion & passing preliminary topic tests.
                          </p>
                        </div>
                        <div className="mt-2">
                          <button
                            type="button"
                            onClick={() => toast.info('Certificate will unlock once 70% is achieved.')}
                            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                          >
                            <Lock className="w-3 h-3 text-amber-500" />
                            Locked (Current: 7.97%)
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Certificate 2: Score 90% */}
                    <div className="rounded-xl border border-slate-200 dark:border-[#16253d] bg-slate-50 dark:bg-[#070d18] p-4 flex gap-3 hover:border-slate-300 dark:hover:border-[#274068] transition-colors">
                      {/* Left certificate preview card */}
                      <div className="w-28 sm:w-32 h-20 bg-gradient-to-br from-amber-50 to-amber-100/90 rounded-lg p-2 shadow-xs flex flex-col justify-between shrink-0 border border-amber-400/60 relative overflow-hidden">
                        <div className="flex justify-between items-start">
                          <span className="text-[8px] font-bold text-amber-950 tracking-tighter">
                            HONOUR ROLL
                          </span>
                          <span className="text-[7px] font-bold text-amber-900 bg-amber-300/60 px-1 rounded">
                            EXCELLENCE
                          </span>
                        </div>
                        <div className="space-y-0.5">
                          <div className="h-1 bg-amber-400/60 rounded w-20" />
                          <div className="h-1 bg-amber-300 rounded w-14" />
                        </div>
                        <div className="flex justify-between items-center text-[7px] text-amber-800 border-t border-amber-300/50 pt-0.5">
                          <span>HONOURS</span>
                          <span className="text-amber-800 font-bold">VERIFIED</span>
                        </div>
                      </div>

                      {/* Right Details */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="mb-1">
                            <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-[#c19b48]/15 text-[#c19b48] dark:text-[#e8cf8d] border border-[#c19b48]/30">
                              Score 90%
                            </span>
                          </div>
                          <h4 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100">
                            Certificate of excellence
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                            Mastery credential awarded to top percentiles with outstanding mock test averages.
                          </p>
                        </div>
                        <div className="mt-2">
                          <button
                            type="button"
                            onClick={() => toast.info('Target: Score 90%+ in full mocks.')}
                            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                          >
                            <Lock className="w-3 h-3 text-amber-500" />
                            Locked (Target: 90%)
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: BOOKMARKS */}
              {activeRightTab === 'bookmarks' && (
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#c19b48] dark:text-[#e8cf8d] mb-4 shrink-0">
                    <Bookmark className="w-4 h-4 fill-[#c19b48] text-[#c19b48]" />
                    Bookmarks & Starred Items
                  </div>

                  {savedBookmarks.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-xs">
                      No bookmarks saved yet. Click the bookmark icon on any lesson to review it later.
                    </div>
                  ) : (
                    <div className="flex-1 min-h-0 overflow-y-auto pr-1 custom-scrollbar space-y-2.5">
                      {savedBookmarks.map((bm, index) => (
                        <div
                          key={index}
                          className="p-3 rounded-xl bg-slate-50 dark:bg-[#070d18] border border-slate-200 dark:border-[#16253d] flex items-center justify-between text-xs hover:border-slate-300 dark:hover:border-[#274068] transition-colors"
                        >
                          <div className="flex items-center gap-2.5 pr-2">
                            <FileText className="w-4 h-4 text-[#c19b48] dark:text-[#e8cf8d] shrink-0" />
                            <span className="text-slate-800 dark:text-slate-200">{bm}</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleLessonLaunch('lesson-1')}
                              className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline px-2 py-1 cursor-pointer"
                            >
                              Jump
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleBookmark(bm)}
                              className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer"
                              title="Remove bookmark"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Far Right Vertical Icon Rail (Replicating Image 2, 3, 4) */}
          <div className="flex flex-col items-center gap-2 bg-white dark:bg-[#0b1322] border border-slate-200 dark:border-[#16253d] p-1.5 rounded-2xl shrink-0 h-fit shadow-xs transition-colors">
            {/* Toggle Drawer */}
            <button
              type="button"
              onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#16253d] transition-colors cursor-pointer"
              title={isRightSidebarOpen ? 'Collapse rail' : 'Expand rail'}
            >
              {isRightSidebarOpen ? (
                <PanelRightClose className="w-4 h-4" />
              ) : (
                <PanelRightOpen className="w-4 h-4" />
              )}
            </button>

            <div className="w-full h-px bg-slate-200 dark:bg-[#16253d] my-1" />

            {/* Leaderboard Icon Button */}
            <button
              type="button"
              onClick={() => {
                setIsRightSidebarOpen(true);
                setActiveRightTab('leaderboard');
              }}
              className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                activeRightTab === 'leaderboard' && isRightSidebarOpen
                  ? 'bg-[#c19b48]/20 text-[#c19b48] dark:text-[#e8cf8d] border border-[#c19b48]/40 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#16253d]'
              }`}
              title="Cohort Leaderboard"
            >
              <Trophy className="w-4 h-4" />
            </button>

            {/* Certificate Icon Button */}
            <button
              type="button"
              onClick={() => {
                setIsRightSidebarOpen(true);
                setActiveRightTab('certificate');
              }}
              className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                activeRightTab === 'certificate' && isRightSidebarOpen
                  ? 'bg-[#c19b48]/20 text-[#c19b48] dark:text-[#e8cf8d] border border-[#c19b48]/40 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#16253d]'
              }`}
              title="Course Certificates"
            >
              <Award className="w-4 h-4" />
            </button>

            {/* Bookmark Icon Button */}
            <button
              type="button"
              onClick={() => {
                setIsRightSidebarOpen(true);
                setActiveRightTab('bookmarks');
              }}
              className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                activeRightTab === 'bookmarks' && isRightSidebarOpen
                  ? 'bg-[#c19b48]/20 text-[#c19b48] dark:text-[#e8cf8d] border border-[#c19b48]/40 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#16253d]'
              }`}
              title="Saved Bookmarks"
            >
              <Bookmark className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
);
};

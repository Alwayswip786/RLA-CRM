import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  PanelLeft,
  Search,
  Bell,
  LogOut,
  User,
  ShieldCheck,
  HelpCircle,
} from 'lucide-react';
import { SearchDialog } from './SearchDialog';
import { ThemeSwitcher } from './ThemeSwitcher';
import { toast } from 'sonner';
import { useAuthStore } from '../../store/useAuthStore';
import { useNoticeStore } from '../../store/useNoticeStore';
import { cn } from '../../utils/cn';

interface StudentNavbarProps {
  isCollapsed: boolean;
  onToggleSidebar: () => void;
  onOpenMobileSidebar: () => void;
}

export const StudentNavbar: React.FC<StudentNavbarProps> = ({
  onToggleSidebar,
  onOpenMobileSidebar,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const displayName = user?.name || 'Advocate Aspirant';
  const displayRoll = user?.rollNo || '';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase() || 'RL';

  const notices = useNoticeStore((state) => state.notices);
  const noticeUnreadCount = useNoticeStore((state) => state.unreadCount);
  const noticeTotalCount = useNoticeStore((state) => state.totalCount);

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Generate breadcrumb text
  const getBreadcrumb = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Classroom Chambers';
    if (path.includes('courses/')) return 'Course Classroom & Syllabus';
    if (path.includes('courses')) return 'My Enrolled Courses';
    if (path.includes('live-classes')) return 'Live Classroom Stream';
    if (path.includes('timetable')) return 'Batch Timetable & Shifts';
    if (path.includes('daily-digest')) return 'Daily Legal Digest';
    if (path.includes('mock-series')) return 'All-India Mock Series';
    if (path.includes('practice')) return 'Bare Act Practice Quizzes';
    if (path.includes('results')) return 'Scorecards & Rank Analysis';
    if (path.includes('mains/questions')) return 'Daily Mains Questions';
    if (path.includes('mains/submit')) return 'Upload Answer Sheets';
    if (path.includes('mains/evaluated')) return 'Evaluated Copies & Remarks';
    if (path.includes('interviews')) return 'Mock Interview Chamber';
    if (path.includes('bookmarks')) return 'Starred Questions & Vault';
    if (path.includes('bare-acts')) return 'Bare Act Decoding Notes';
    if (path.includes('judgments')) return 'Landmark Judgments';
    if (path.includes('pyqs')) return 'PYQ Solved Archive';
    if (path.includes('student-id')) return 'Digital ID & Entry Pass';
    if (path.includes('doubts')) return 'Faculty Doubt Desk';
    if (path.includes('fees')) return 'Fee Installments & Receipts';
    if (path.includes('notices')) return 'Notice Board';
    if (path.includes('profile')) return 'Student KYC & Profile';
    return 'Student Portal';
  };

  const handleLogout = () => {
    logout();
    toast.info('Signed out of Classroom Portal');
    navigate('/login');
  };

  return (
    <>
      <SearchDialog isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      <header className="sticky top-0 z-30 h-14 bg-[#F7F3E6]/95 dark:bg-[#0a1c36]/90 backdrop-blur-md border-b border-[#ded7c4] dark:border-[#143564] px-4 lg:px-6 flex items-center justify-between text-slate-800 dark:text-slate-100 transition-colors">
        {/* Left Side: Toggle & Breadcrumb / Batch */}
        <div className="flex items-center gap-3">
          {/* Desktop Toggle */}
          <button
            type="button"
            onClick={onToggleSidebar}
            title="Toggle Sidebar (Ctrl+B)"
            className="hidden md:flex p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <PanelLeft className="w-4 h-4" />
          </button>

          {/* Mobile Toggle */}
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <PanelLeft className="w-4 h-4" />
          </button>

          {/* Separator */}
          <div className="h-4 w-px bg-slate-200 dark:bg-[#143564]" />

          {/* Breadcrumb */}
          <div className="flex items-center">
            <span className="text-xs font-semibold text-slate-900 dark:text-white tracking-wide truncate">
              {getBreadcrumb()}
            </span>
          </div>
        </div>

        {/* Right Side: Search, Live Pulse, Notifications, ThemeSwitcher, Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Live Lecture Pulse Status */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 dark:bg-red-500/15 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 text-xs font-semibold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
            </span>
            <span className="text-[11px]">Live: CPC Lecture at 5 PM</span>
          </div>

          {/* Search Trigger Button */}
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-[#c19b48]/60 transition-all text-xs cursor-pointer shadow-inner"
          >
            <Search className="w-3.5 h-3.5 text-[#c19b48]" />
            <span className="hidden md:inline text-[11px]">
              Search Bare Acts, Mock Tests...
            </span>
          </button>

          {/* Dark / Light Mode Switcher */}
          <ThemeSwitcher />

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIsNotificationOpen(!isNotificationOpen);
                setIsUserMenuOpen(false);
              }}
              title="Notifications"
              className="relative p-2 rounded-xl bg-slate-100 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] hover:border-[#c19b48]/60 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              {noticeUnreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500 animate-pulse ring-2 ring-white dark:ring-[#061120]" />
              )}
            </button>

            {isNotificationOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-88 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] shadow-2xl p-4 z-50 text-slate-800 dark:text-slate-100 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#143564]">
                  <h4 className="text-xs font-serif font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Classroom Notices
                  </h4>
                  <span
                    className={cn(
                      'text-[10px] px-2 py-0.5 rounded-full font-bold transition-all',
                      noticeUnreadCount > 0
                        ? 'bg-amber-500/15 dark:bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-500/30'
                        : 'bg-slate-100 dark:bg-[#143564]/50 text-slate-600 dark:text-slate-400'
                    )}
                  >
                    {noticeUnreadCount > 0 ? `${noticeUnreadCount} New` : `${noticeTotalCount} Total`}
                  </span>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-[#143564]/60 max-h-72 overflow-y-auto">
                  {notices.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-500 dark:text-slate-400">
                      No official circulars promulgated yet.
                    </div>
                  ) : (
                    notices.slice(0, 4).map((notice) => (
                      <div
                        key={notice._id}
                        onClick={() => {
                          setIsNotificationOpen(false);
                          navigate('/dashboard/notices');
                        }}
                        className="py-2.5 space-y-1 hover:bg-slate-50 dark:hover:bg-white/[0.03] px-1 rounded-lg cursor-pointer transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold text-slate-900 dark:text-white line-clamp-1">
                            {notice.title}
                          </p>
                          {notice.priority === 'urgent' && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-rose-500/20 text-rose-600 dark:text-rose-400 shrink-0">
                              URGENT
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2">
                          {notice.content}
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span className="text-[#c19b48] font-medium">{notice.circularNo}</span>
                          <span>
                            {new Date(notice.publishedAt).toLocaleDateString('en-IN', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-[#143564] text-center">
                  <button
                    onClick={() => {
                      setIsNotificationOpen(false);
                      navigate('/dashboard/notices');
                    }}
                    className="text-xs text-[#c19b48] hover:underline font-semibold cursor-pointer"
                  >
                    View All Academy Notices ({noticeTotalCount}) →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Student Profile / Account Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIsUserMenuOpen(!isUserMenuOpen);
                setIsNotificationOpen(false);
              }}
              className="flex items-center gap-2 p-1 sm:px-2 sm:py-1 rounded-xl bg-slate-100 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] hover:border-[#c19b48]/60 transition-all cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-[#c19b48]/20 text-[#c19b48] dark:text-[#e8cf8d] border border-[#c19b48]/40 flex items-center justify-center font-bold text-xs">
                {initials}
              </div>
              <span className="hidden sm:inline text-xs font-semibold text-slate-900 dark:text-white max-w-24 truncate">
                {displayName}
              </span>
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] shadow-2xl p-2 z-50 text-slate-800 dark:text-slate-100 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-2 border-b border-slate-100 dark:border-[#143564] mb-1">
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{displayName}</p>
                  <p className="text-[10px] text-[#c19b48] font-mono">Roll: {displayRoll}</p>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Batch 2025-26</span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    navigate('/dashboard/profile');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#143564]/50 transition-colors text-left cursor-pointer"
                >
                  <User className="w-3.5 h-3.5 text-[#c19b48]" />
                  <span>My Profile & KYC</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    navigate('/dashboard/fees');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#143564]/50 transition-colors text-left cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                  <span>Fee Receipts & Cards</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    navigate('/dashboard/doubts');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#143564]/50 transition-colors text-left cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                  <span>Faculty Doubt Desk</span>
                </button>

                <div className="my-1 border-t border-slate-100 dark:border-[#143564]" />

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors text-left cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
};

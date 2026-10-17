import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  PanelLeft,
  Bell,
  LogOut,
  User,
  ShieldCheck,
  HelpCircle,
} from 'lucide-react';
import { ThemeSwitcher } from './ThemeSwitcher';
import { BottomSheet } from '../ui/BottomSheet';
import { useIsDesktop } from '../../hooks/use-responsive';
import { toast } from '../../lib/toast';
import { apiClient } from '../../lib/apiClient';
import { useAuthStore } from '../../store/useAuthStore';
import { useNoticeStore } from '../../store/useNoticeStore';
import { cn } from '../../utils/cn';

interface StudentNavbarProps {
  isCollapsed: boolean;
  isMobileOpen?: boolean;
  onToggleSidebar: () => void;
  onOpenMobileSidebar: () => void;
}

interface LiveLectureInfo {
  id: string;
  title: string;
  subject: string;
  startTime?: string;
  status: string;
  isLive: boolean;
  displayText: string;
  url: string;
}

function formatLectureSubject(subjectOrTitle: string): string {
  if (!subjectOrTitle) return 'Judicial';
  const parenMatch = subjectOrTitle.match(/\(([^)]+)\)/);
  if (parenMatch && parenMatch[1].length <= 8) {
    return parenMatch[1].trim();
  }
  const lower = subjectOrTitle.toLowerCase();
  if (lower.includes('civil procedure') || lower.includes('cpc')) return 'CPC';
  if (lower.includes('criminal procedure') || lower.includes('crpc')) return 'CrPC';
  if (lower.includes('penal code') || lower.includes('ipc')) return 'IPC';
  if (lower.includes('nagarik suraksha') || lower.includes('bnss')) return 'BNSS';
  if (lower.includes('nyaya sanhita') || lower.includes('bns')) return 'BNS';
  if (lower.includes('sakshya') || lower.includes('bsa')) return 'BSA';
  if (lower.includes('evidence')) return 'Evidence';
  if (lower.includes('constitution')) return 'Constitution';
  if (lower.includes('contract')) return 'Contract';
  if (lower.includes('tort')) return 'Torts';
  if (lower.includes('limitation')) return 'Limitation';
  if (lower.includes('specific relief') || lower.includes('sra')) return 'SRA';
  if (lower.includes('family law')) return 'Family Law';
  if (lower.includes('prelims speed test') || lower.includes('test series')) return 'Mock Test';
  if (lower.includes('doubt session')) return 'Doubt Session';
  if (subjectOrTitle.length <= 14) return subjectOrTitle;
  return subjectOrTitle.slice(0, 12).trim() + '...';
}

function formatLectureTime(timeStr?: string): string {
  if (!timeStr) return '';
  const trimmed = timeStr.trim();
  const ampmMatch = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (ampmMatch) {
    const hour = parseInt(ampmMatch[1], 10);
    const minute = ampmMatch[2];
    const ampm = ampmMatch[3].toUpperCase();
    if (minute === '00') return `${hour} ${ampm}`;
    return `${hour}:${minute} ${ampm}`;
  }
  const militaryMatch = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (militaryMatch) {
    let hour = parseInt(militaryMatch[1], 10);
    const minute = militaryMatch[2];
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12;
    if (minute === '00') return `${hour} ${ampm}`;
    return `${hour}:${minute} ${ampm}`;
  }
  return trimmed;
}

export const StudentNavbar: React.FC<StudentNavbarProps> = ({
  isMobileOpen,
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

  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const isDesktop = useIsDesktop(1024);
  const [liveLecture, setLiveLecture] = useState<LiveLectureInfo | null>(null);

  // Refs for outside-click detection
  const notificationRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (
        notificationRef.current &&
        !notificationRef.current.contains(target)
      ) {
        setIsNotificationOpen(false);
      }
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(target)
      ) {
        setIsUserMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsNotificationOpen(false);
        setIsUserMenuOpen(false);
      }
    };

    if (isNotificationOpen || isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isNotificationOpen, isUserMenuOpen]);

  // Fetch dynamic live schedule if lectures are scheduled from admin panel
  useEffect(() => {
    let isMounted = true;

    const fetchLiveSchedule = async () => {
      try {
        // 1. Check currently active live session or next scheduled from LiveClass
        const liveRes = await apiClient.get('/live-classes/current');
        if (liveRes.data?.data?.class) {
          const cls = liveRes.data.data.class;
          if (['live', 'upcoming', 'scheduled'].includes(cls.status)) {
            const rawSubject = cls.subject || cls.title;
            const subjectText = formatLectureSubject(rawSubject);
            const timeText = formatLectureTime(cls.startTime);
            if (isMounted) {
              setLiveLecture({
                id: cls._id,
                title: cls.title,
                subject: rawSubject,
                startTime: cls.startTime,
                status: cls.status,
                isLive: cls.status === 'live',
                displayText: timeText
                  ? `Live: ${subjectText} Lecture at ${timeText}`
                  : `Live: ${subjectText} Lecture`,
                url: '/dashboard/live-classes',
              });
            }
            return;
          }
        }

        // 2. Fallback to today's upcoming/ongoing timetable slot
        const timetableRes = await apiClient.get('/timetable/upcoming');
        if (timetableRes.data?.success && timetableRes.data?.upcomingClass) {
          const slot = timetableRes.data.upcomingClass;
          const rawSubject = slot.subject || slot.topic;
          const time = slot.startTime || (slot.time ? slot.time.split('–')[0]?.trim() : '');
          const subjectText = formatLectureSubject(rawSubject);
          const timeText = formatLectureTime(time);
          if (isMounted) {
            setLiveLecture({
              id: slot.slotId,
              title: slot.topic || slot.subject,
              subject: rawSubject,
              startTime: time,
              status: slot.status,
              isLive: slot.status === 'ongoing',
              displayText: timeText
                ? `Live: ${subjectText} Lecture at ${timeText}`
                : `Live: ${subjectText} Lecture`,
              url: '/dashboard/live-classes',
            });
          }
          return;
        }

        if (isMounted) {
          setLiveLecture(null);
        }
      } catch {
        if (isMounted) {
          setLiveLecture(null);
        }
      }
    };

    fetchLiveSchedule();
    const interval = setInterval(fetchLiveSchedule, 45000); // Poll every 45s
    const onFocus = () => {
      fetchLiveSchedule();
    };
    window.addEventListener('focus', onFocus);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

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
      <header className="sticky top-0 z-30 min-h-14 py-1.5 bg-[#F7F3E6]/95 dark:bg-[#0a1c36]/90 backdrop-blur-md border-b border-[#ded7c4] dark:border-[#143564] px-2.5 sm:px-4 lg:px-6 flex items-center justify-between text-slate-800 dark:text-slate-100 transition-colors">
        {/* Left Side: Toggle & Breadcrumb / Batch */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 mr-2">
          {/* Desktop Toggle (>= 1024px) */}
          <button
            type="button"
            onClick={onToggleSidebar}
            title="Toggle Sidebar (Ctrl+B)"
            className="hidden lg:flex p-1.5 sm:p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer shrink-0"
          >
            <PanelLeft className="w-4 h-4" />
          </button>

          {/* Mobile / Tablet Toggle (< 1024px) */}
          <button
            id="mobile-sidebar-toggle"
            type="button"
            onClick={onOpenMobileSidebar}
            aria-expanded={Boolean(isMobileOpen)}
            aria-controls="student-sidebar-drawer"
            className="lg:hidden p-1.5 sm:p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer shrink-0"
            aria-label="Open sidebar navigation"
          >
            <PanelLeft className="w-4 h-4" />
          </button>

          {/* Separator */}
          <div className="h-4 w-px bg-slate-200 dark:bg-[#143564] shrink-0" />

          {/* Keep the full page name readable; the header can grow for wrapped titles. */}
          <div className="min-w-0 flex-1">
            <span
              className={`font-semibold text-slate-900 dark:text-white tracking-wide block whitespace-normal break-words leading-tight ${
                location.pathname.includes('/tests/results') ? 'text-[10px] sm:text-xs' : 'text-xs'
              }`}
              title={getBreadcrumb()}
              aria-label={getBreadcrumb()}
            >
              {getBreadcrumb()}
            </span>
          </div>
        </div>

        {/* Right Side: Search, Live Pulse, Notifications, ThemeSwitcher, Profile */}
        <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 shrink-0">
          {/* Dynamic Live Schedule Badge (from Admin Panel) */}
          {liveLecture && !location.pathname.includes('/dashboard/live-classes') && (
            <button
              type="button"
              onClick={() => navigate(liveLecture.url)}
              title={`${liveLecture.title} • Click to enter Live Classroom`}
              aria-label={`Live lecture: ${liveLecture.displayText}`}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 dark:bg-red-500/15 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 text-xs font-semibold hover:bg-red-100 dark:hover:bg-red-500/25 transition-all cursor-pointer select-none active:scale-[0.98]"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
              <span className="text-[11px] font-semibold tracking-tight whitespace-nowrap">
                {liveLecture.displayText}
              </span>
            </button>
          )}

          {/* Dark / Light Mode Switcher */}
          <ThemeSwitcher />

          {/* Notifications Dropdown */}
          <div ref={notificationRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => {
                setIsNotificationOpen(!isNotificationOpen);
                setIsUserMenuOpen(false);
              }}
              title="Notifications"
              className="relative p-1.5 sm:p-2 rounded-xl bg-slate-100 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] hover:border-[#c19b48]/60 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              {noticeUnreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500 animate-pulse ring-2 ring-white dark:ring-[#061120]" />
              )}
            </button>

            {/* Desktop Notification Popover */}
            {isDesktop && isNotificationOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-88 max-w-[calc(100vw-1.5rem)] rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] shadow-2xl p-4 z-50 text-slate-800 dark:text-slate-100 animate-in fade-in slide-in-from-top-2 duration-150">
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
          <div ref={userMenuRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setIsUserMenuOpen(!isUserMenuOpen);
                setIsNotificationOpen(false);
              }}
              className="flex items-center gap-2 p-1 lg:pl-1 lg:pr-2.5 lg:py-1 rounded-xl bg-slate-100 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] hover:border-[#c19b48]/60 transition-all cursor-pointer shrink-0"
            >
              <div className="w-7 h-7 rounded-lg bg-[#c19b48]/20 text-[#c19b48] dark:text-[#e8cf8d] border border-[#c19b48]/40 flex items-center justify-center font-bold text-xs shrink-0">
                {initials}
              </div>
              <span className="hidden lg:inline text-xs font-semibold text-slate-900 dark:text-white max-w-28 truncate">
                {displayName}
              </span>
            </button>

            {/* Desktop User Menu Popover */}
            {isDesktop && isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 max-w-[calc(100vw-1.5rem)] rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] shadow-2xl p-2 z-50 text-slate-800 dark:text-slate-100 animate-in fade-in slide-in-from-top-2 duration-150">
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

      {/* Mobile BottomSheet for Notifications */}
      {!isDesktop && (
        <BottomSheet
          isOpen={isNotificationOpen}
          onClose={() => setIsNotificationOpen(false)}
          title="Classroom Notices"
          subtitle={noticeUnreadCount > 0 ? `${noticeUnreadCount} new notices pending` : `${noticeTotalCount} total official circulars`}
        >
          <div className="divide-y divide-slate-100 dark:divide-[#143564]/60">
            {notices.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
                No official circulars promulgated yet.
              </div>
            ) : (
              notices.map((notice) => (
                <div
                  key={notice._id}
                  onClick={() => {
                    setIsNotificationOpen(false);
                    navigate('/dashboard/notices');
                  }}
                  className="py-3 px-2 space-y-1 hover:bg-slate-50 dark:hover:bg-white/[0.03] active:bg-slate-100 dark:active:bg-[#143564]/40 rounded-xl cursor-pointer transition-colors"
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
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
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

          <div className="pt-4 mt-2 border-t border-slate-100 dark:border-[#143564]">
            <button
              onClick={() => {
                setIsNotificationOpen(false);
                navigate('/dashboard/notices');
              }}
              className="w-full py-2.5 rounded-xl bg-[#c19b48] text-[#061120] font-bold text-xs text-center cursor-pointer shadow-xs"
            >
              View All Academy Notices ({noticeTotalCount})
            </button>
          </div>
        </BottomSheet>
      )}

      {/* Mobile BottomSheet for Student Profile & Account */}
      {!isDesktop && (
        <BottomSheet
          isOpen={isUserMenuOpen}
          onClose={() => setIsUserMenuOpen(false)}
          title={displayName}
          subtitle={`Roll No: ${displayRoll || 'RLA-2025'} • Batch 2025-26`}
        >
          <div className="space-y-1.5 pt-1">
            <button
              type="button"
              onClick={() => {
                setIsUserMenuOpen(false);
                navigate('/dashboard/profile');
              }}
              className="w-full flex items-center gap-3 p-3 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 active:bg-slate-100 dark:active:bg-[#143564]/50 transition-colors text-left"
            >
              <div className="p-2 rounded-lg bg-amber-50 dark:bg-[#c19b48]/20 text-[#c19b48]">
                <User className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-semibold block text-slate-900 dark:text-white">My Profile & KYC</span>
                <span className="text-[10px] text-slate-400">Personal details & judicial credentials</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsUserMenuOpen(false);
                navigate('/dashboard/fees');
              }}
              className="w-full flex items-center gap-3 p-3 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 active:bg-slate-100 dark:active:bg-[#143564]/50 transition-colors text-left"
            >
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-semibold block text-slate-900 dark:text-white">Fee Receipts & Cards</span>
                <span className="text-[10px] text-slate-400">Installments, tax invoices & statements</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsUserMenuOpen(false);
                navigate('/dashboard/doubts');
              }}
              className="w-full flex items-center gap-3 p-3 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 active:bg-slate-100 dark:active:bg-[#143564]/50 transition-colors text-left"
            >
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-500">
                <HelpCircle className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-semibold block text-slate-900 dark:text-white">Faculty Doubt Desk</span>
                <span className="text-[10px] text-slate-400">1-on-1 legal queries & citations</span>
              </div>
            </button>

            <div className="my-2 border-t border-slate-100 dark:border-[#143564]" />

            <button
              type="button"
              onClick={() => {
                setIsUserMenuOpen(false);
                handleLogout();
              }}
              className="w-full flex items-center gap-3 p-3 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 active:bg-rose-50 dark:active:bg-rose-950/40 transition-colors text-left"
            >
              <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400">
                <LogOut className="w-4 h-4" />
              </div>
              <span>Sign Out of Classroom</span>
            </button>
          </div>
        </BottomSheet>
      )}
    </>
  );
};

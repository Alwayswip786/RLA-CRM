import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  ChevronRight,
  LogOut,
  User,
  MessageSquare,
  Sparkles,
  X,
  ExternalLink,
  PhoneCall,
} from 'lucide-react';
import { studentSidebarItems, type NavMainItem } from '../../navigation/student-sidebar-items';
import { StudentIdModal } from './StudentIdModal';
import { cn } from '../../utils/cn';
import { toast } from 'sonner';
import { useAuthStore } from '../../store/useAuthStore';
import { useNoticeStore } from '../../store/useNoticeStore';

interface StudentSidebarProps {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const StudentSidebar: React.FC<StudentSidebarProps> = ({
  isCollapsed,
  isMobileOpen,
  onCloseMobile,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const displayName = user?.name || 'Advocate Aspirant';
  const displayRoll = user?.rollNo || '';

  const [isIdModalOpen, setIsIdModalOpen] = useState(false);
  const [openSubMenus, setOpenSubMenus] = useState<Record<string, boolean>>({
    'prelims-tests': true,
    'mains-writing': false,
  });

  const {
    unreadCount: noticeUnreadCount,
    totalCount: noticeTotalCount,
    unreadUrgentCount: noticeUnreadUrgentCount,
    initRealtimeListener,
  } = useNoticeStore();

  useEffect(() => {
    const cleanup = initRealtimeListener();
    return () => {
      cleanup();
    };
  }, [initRealtimeListener]);

  const toggleSubMenu = (id: string) => {
    setOpenSubMenus((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const isLinkActive = (url?: string) => {
    if (!url) return false;
    if (url === '/dashboard' && location.pathname === '/dashboard') return true;
    if (url !== '/dashboard' && location.pathname.startsWith(url)) return true;
    return false;
  };

  const handleLogout = () => {
    logout();
    toast.info('Signed out of Classroom Portal');
    navigate('/login');
  };

  const handleBookStrategyCall = () => {
    toast.success('Strategy Call Requested with Rajinder Sir', {
      description: 'Your academic mentor will confirm your 1-on-1 slot via WhatsApp.',
      duration: 4000,
    });
  };

  return (
    <>
      {/* Digital Student ID Modal */}
      <StudentIdModal isOpen={isIdModalOpen} onClose={() => setIsIdModalOpen(false)} />

      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/75 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed md:sticky top-0 z-40 h-screen flex flex-col justify-between bg-[#F7F3E6] dark:bg-[#061120] border-r border-[#ded7c4] dark:border-[#143564]/70 transition-[width] duration-300 ease-in-out select-none overflow-x-hidden',
          // Desktop width
          isCollapsed ? 'md:w-18' : 'md:w-76',
          // Mobile responsive slide-over
          isMobileOpen ? 'left-0 w-76 shadow-2xl' : '-left-76 md:left-0'
        )}
      >
        {/* 1. Header: Brand Logo & Title */}
        <div className="shrink-0 border-b border-slate-200 dark:border-[#143564]/60 overflow-hidden">
          <div className="h-16 flex items-center justify-between px-4">
            <Link
              to="/dashboard"
              className="flex items-center overflow-hidden min-w-0"
            >
              <div className="w-10 h-10 flex items-center justify-center shrink-0">
                <img
                  src="/logo.png"
                  alt="Rajinder Law Academy"
                  className="w-9 h-9 rounded-lg object-contain border border-[#c19b48]/40"
                />
              </div>
              <div
                className={cn(
                  'flex flex-col min-w-0 pl-2 transition-all duration-200 whitespace-nowrap overflow-hidden',
                  isCollapsed ? 'opacity-0 w-0 pointer-events-none' : 'opacity-100 w-auto'
                )}
              >
                <span className="font-serif text-sm font-bold text-slate-900 dark:text-white tracking-tight truncate leading-none">
                  RAJINDER LAW
                </span>
                <span className="text-[10px] font-semibold text-[#c19b48] tracking-wider uppercase mt-0.5">
                  Classroom Portal
                </span>
              </div>
            </Link>

            {/* Close button for Mobile Drawer */}
            <button
              onClick={onCloseMobile}
              className="md:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 shrink-0"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. Middle: Navigation Links (Scrollable) */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar px-4 py-3 space-y-4">
          {studentSidebarItems.map((group) => (
            <div key={group.id} className="space-y-1">
              {group.label && (
                <h4
                  className={cn(
                    'px-2.5 text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider transition-all duration-200 overflow-hidden whitespace-nowrap',
                    isCollapsed ? 'opacity-0 h-0 my-0 pointer-events-none' : 'opacity-100 mb-1.5'
                  )}
                >
                  {group.label}
                </h4>
              )}

              <div className="space-y-1">
                {group.items.map((item: NavMainItem) => {
                  const Icon = item.icon;
                  const hasSub = Boolean(item.subItems && item.subItems.length > 0);
                  const isParentOpen = openSubMenus[item.id];
                  const active = isLinkActive(item.url) || (hasSub && item.subItems?.some((sub) => isLinkActive(sub.url)));

                  // Real-time Noticeboard dynamic badge and color evaluation
                  const isNoticesItem = item.id === 'notices';
                  const hasUnreadNotices = isNoticesItem && noticeUnreadCount > 0;
                  const hasUrgentNotice = isNoticesItem && noticeUnreadUrgentCount > 0;

                  let displayBadge = item.badge;
                  let badgeClass = item.badgeColor;

                  if (isNoticesItem) {
                    if (noticeUnreadCount > 0) {
                      displayBadge = `${noticeUnreadCount} New`;
                      if (active) {
                        badgeClass = 'bg-[#061120] text-[#e8cf8d] border border-black/30 shadow-xs font-bold';
                      } else if (hasUrgentNotice) {
                        badgeClass = 'bg-rose-500/15 text-rose-800 border border-rose-500/30 dark:bg-rose-500/25 dark:text-rose-300 dark:border-rose-500/40 font-bold animate-pulse';
                      } else {
                        badgeClass = 'bg-amber-500/15 text-amber-900 border border-amber-500/35 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/35 font-bold shadow-2xs';
                      }
                    } else if (noticeTotalCount > 0) {
                      displayBadge = `${noticeTotalCount}`;
                      if (active) {
                        badgeClass = 'bg-[#061120]/90 text-[#e8cf8d] border border-black/25 shadow-xs font-semibold';
                      } else {
                        badgeClass = 'bg-slate-200/80 text-slate-700 border border-slate-300/60 dark:bg-[#143564]/50 dark:text-slate-300 dark:border-[#143564] font-medium';
                      }
                    } else {
                      displayBadge = undefined;
                    }
                  } else if (active && displayBadge) {
                    badgeClass = 'bg-[#061120] text-[#e8cf8d] border border-black/20 font-bold';
                  }

                  // Special trigger for Digital ID modal
                  const isStudentIdItem = item.id === 'student-id';

                  if (!hasSub) {
                    if (isStudentIdItem) {
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setIsIdModalOpen(true);
                            onCloseMobile();
                          }}
                          title={isCollapsed ? item.title : undefined}
                          className={cn(
                            'w-full h-10 flex items-center rounded-xl text-xs font-medium transition-colors group relative text-left cursor-pointer overflow-hidden border border-transparent shrink-0',
                            'text-slate-700 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-[#0a1c36] hover:text-slate-900 dark:hover:text-white'
                          )}
                        >
                          <div className="w-10 h-10 flex items-center justify-center shrink-0">
                            <Icon className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
                          </div>
                          <div
                            className={cn(
                              'flex items-center justify-between flex-1 min-w-0 transition-all duration-200 whitespace-nowrap overflow-hidden',
                              isCollapsed
                                ? 'opacity-0 w-0 pr-0 -translate-x-2 pointer-events-none'
                                : 'opacity-100 w-auto pr-2.5 translate-x-0'
                            )}
                          >
                            <span className="truncate">{item.title}</span>
                            {displayBadge && (
                              <span
                                className={cn(
                                  'text-[10px] px-2 py-0.5 rounded-full font-bold ml-1.5 shrink-0 transition-all duration-200',
                                  badgeClass || 'bg-slate-200 dark:bg-[#143564]'
                                )}
                              >
                                {displayBadge}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    }

                    return (
                      <Link
                        key={item.id}
                        to={item.url || '#'}
                        onClick={() => onCloseMobile()}
                        title={isCollapsed ? item.title : undefined}
                        className={cn(
                          'w-full h-10 flex items-center rounded-xl text-xs font-medium transition-colors group relative overflow-hidden shrink-0',
                          active
                            ? 'bg-[#c19b48] text-[#061120] font-semibold shadow-xs border border-[#a88232]/40 dark:border-[#e8cf8d]/30'
                            : 'border border-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-[#0a1c36] hover:text-slate-900 dark:hover:text-white'
                        )}
                      >
                        <div className="w-10 h-10 flex items-center justify-center shrink-0 relative">
                          <Icon
                            className={cn(
                              'w-4 h-4',
                              active ? 'text-[#061120]' : 'text-[#c19b48] group-hover:scale-110 transition-transform'
                            )}
                          />
                          {hasUnreadNotices && isCollapsed && (
                            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-[#F7F3E6] dark:ring-[#061120] animate-pulse" />
                          )}
                        </div>
                        <div
                          className={cn(
                            'flex items-center justify-between flex-1 min-w-0 transition-all duration-200 whitespace-nowrap overflow-hidden',
                            isCollapsed
                              ? 'opacity-0 w-0 pr-0 -translate-x-2 pointer-events-none'
                              : 'opacity-100 w-auto pr-2.5 translate-x-0'
                          )}
                        >
                          <span className="truncate">{item.title}</span>
                          {displayBadge && (
                            <span
                              className={cn(
                                'text-[10px] px-2 py-0.5 rounded-full font-bold ml-1.5 shrink-0 transition-all duration-200',
                                badgeClass || 'bg-slate-200 dark:bg-[#143564] text-slate-800 dark:text-slate-200'
                              )}
                            >
                              {displayBadge}
                            </span>
                          )}
                        </div>
                      </Link>
                    );
                  }

                  // Collapsible Parent Item
                  return (
                    <div key={item.id} className="space-y-1">
                      <button
                        type="button"
                        onClick={() => toggleSubMenu(item.id)}
                        title={isCollapsed ? item.title : undefined}
                        className={cn(
                          'w-full h-10 flex items-center rounded-xl text-xs font-medium transition-colors group text-left cursor-pointer overflow-hidden shrink-0',
                          active
                            ? 'bg-slate-200/70 dark:bg-[#0a1c36] text-slate-900 dark:text-white border border-slate-300 dark:border-[#143564]'
                            : 'border border-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-[#0a1c36] hover:text-slate-900 dark:hover:text-white'
                        )}
                      >
                        <div className="w-10 h-10 flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4 text-[#c19b48] group-hover:scale-110 transition-transform" />
                        </div>
                        <div
                          className={cn(
                            'flex items-center justify-between flex-1 min-w-0 transition-all duration-200 whitespace-nowrap overflow-hidden',
                            isCollapsed
                              ? 'opacity-0 w-0 pr-0 -translate-x-2 pointer-events-none'
                              : 'opacity-100 w-auto pr-2.5 translate-x-0'
                          )}
                        >
                          <span className="truncate flex-1">{item.title}</span>
                          {displayBadge && (
                            <span
                              className={cn(
                                'text-[10px] px-2 py-0.5 rounded-full font-bold mr-1 shrink-0 transition-all duration-200',
                                badgeClass || 'bg-slate-200 dark:bg-[#143564] text-slate-800 dark:text-slate-200'
                              )}
                            >
                              {displayBadge}
                            </span>
                          )}
                          <span className="text-slate-400 shrink-0">
                            {isParentOpen ? (
                              <ChevronDown className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5" />
                            )}
                          </span>
                        </div>
                      </button>

                      {/* Sub Items (Only visible when expanded) */}
                      {hasSub && (
                        <div
                          className={cn(
                            'pl-6 pr-1 space-y-1 border-l border-slate-300 dark:border-[#143564]/50 ml-5 transition-all duration-200 overflow-hidden',
                            !isCollapsed && isParentOpen
                              ? 'max-h-60 opacity-100 my-1 py-1'
                              : 'max-h-0 opacity-0 my-0 py-0 pointer-events-none'
                          )}
                        >
                          {item.subItems?.map((sub) => {
                            const subActive = isLinkActive(sub.url);
                            return (
                              <Link
                                key={sub.id}
                                to={sub.url}
                                onClick={() => onCloseMobile()}
                                className={cn(
                                  'flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors',
                                  subActive
                                    ? 'text-[#c19b48] dark:text-[#e8cf8d] font-semibold bg-amber-50 dark:bg-[#143564]/40'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-white/[0.03]'
                                )}
                              >
                                <span className="truncate">{sub.title}</span>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* 3. Footer Area: Progress Bar, 1-on-1 CTA, Support Card & Student Profile */}
        <div className="p-4 border-t border-slate-200 dark:border-[#143564]/60 space-y-2 shrink-0 bg-slate-100/60 dark:bg-[#040b14]/50 overflow-hidden">
          {/* Interactive Widget B: Batch Syllabus Progress Bar */}
          <div
            className={cn(
              'transition-all duration-300 ease-in-out overflow-hidden',
              isCollapsed ? 'max-h-0 opacity-0 pointer-events-none my-0' : 'max-h-24 opacity-100'
            )}
          >
            <div className="p-2.5 rounded-xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] space-y-1.5 shadow-2xs">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-800 dark:text-slate-200">
                <span>Batch Syllabus Progress</span>
                <span className="text-[#c19b48] font-mono font-bold">64%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-[#061120] rounded-full h-1.5 overflow-hidden border border-slate-200 dark:border-[#143564]">
                <div
                  className="h-full bg-gradient-to-r from-[#c19b48] to-[#e8cf8d] rounded-full transition-all duration-500"
                  style={{ width: '64%' }}
                />
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                7 / 11 Major & Minor Bare Acts Mastered
              </p>
            </div>
          </div>

          {/* Interactive Widget C: Fast 1-on-1 Faculty Booking CTA */}
          <button
            type="button"
            onClick={handleBookStrategyCall}
            title={isCollapsed ? 'Book 1-on-1 Call with Rajinder Sir' : undefined}
            className="w-full h-10 rounded-xl bg-gradient-to-r from-[#0a1c36] to-[#143564] dark:from-[#0e274b] dark:to-[#1c4988] hover:from-[#143564] hover:to-[#2560b0] text-white text-xs font-semibold border border-[#c19b48]/40 shadow-xs flex items-center transition-all overflow-hidden cursor-pointer group shrink-0"
          >
            <div className="w-10 h-10 flex items-center justify-center shrink-0">
              <PhoneCall className="w-4 h-4 text-[#e8cf8d] group-hover:scale-110 transition-transform" />
            </div>
            <span
              className={cn(
                'truncate transition-all duration-200 whitespace-nowrap overflow-hidden',
                isCollapsed ? 'opacity-0 w-0 pr-0 pointer-events-none' : 'opacity-100 w-auto pr-2.5'
              )}
            >
              Book 1-on-1 Call with Rajinder Sir
            </span>
          </button>

          {/* WhatsApp Support Mini-Card */}
          <div
            className={cn(
              'transition-all duration-300 ease-in-out overflow-hidden',
              isCollapsed ? 'max-h-0 opacity-0 pointer-events-none my-0' : 'max-h-28 opacity-100'
            )}
          >
            <div className="p-2.5 rounded-xl bg-amber-50/80 dark:bg-gradient-to-r dark:from-[#0a1c36] dark:to-[#0e274b] border border-amber-200/80 dark:border-[#c19b48]/30 shadow-xs">
              <div className="flex items-center gap-1.5 mb-1">
                <Sparkles className="w-3 h-3 text-[#c19b48]" />
                <span className="text-[11px] font-bold text-slate-900 dark:text-white">Batch Help Desk</span>
              </div>
              <p className="text-[10px] text-slate-600 dark:text-slate-300 leading-snug mb-1.5">
                Urgent lecture link or fee receipt query?
              </p>
              <a
                href="https://wa.me/919876543210"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-[#c19b48] dark:text-[#e8cf8d] font-semibold hover:underline"
              >
                <MessageSquare className="w-3 h-3" />
                <span>Chat with Coordinator</span>
                <ExternalLink className="w-2.5 h-2.5 ml-0.5 opacity-70" />
              </a>
            </div>
          </div>

          {/* Student Profile Row */}
          <div className="flex items-center h-10 rounded-xl bg-white dark:bg-[#0a1c36]/60 border border-slate-200 dark:border-[#143564]/50 shadow-xs overflow-hidden w-full shrink-0">
            <div className="w-10 h-10 flex items-center justify-center shrink-0">
              <div className="w-7 h-7 rounded-lg bg-[#c19b48]/20 border border-[#c19b48]/40 text-[#c19b48] dark:text-[#e8cf8d] flex items-center justify-center font-bold text-xs">
                <User className="w-3.5 h-3.5 text-[#c19b48]" />
              </div>
            </div>

            <div
              className={cn(
                'flex items-center justify-between flex-1 min-w-0 transition-all duration-200 whitespace-nowrap overflow-hidden',
                isCollapsed ? 'opacity-0 w-0 pr-0 pointer-events-none' : 'opacity-100 w-auto pr-2'
              )}
            >
              <div className="flex-1 min-w-0 pr-1">
                <h5 className="text-xs font-semibold text-slate-900 dark:text-white truncate">{displayName}</h5>
                <p className="text-[10px] text-[#c19b48] font-mono truncate">Roll: {displayRoll}</p>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                title="Sign Out"
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

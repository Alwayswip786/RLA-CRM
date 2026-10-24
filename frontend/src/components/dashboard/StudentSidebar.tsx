import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  ChevronRight,
  LogOut,
  User,
  X,
} from 'lucide-react';
import { studentSidebarItems, type NavMainItem } from '../../navigation/student-sidebar-items';
import { StudentIdModal } from './StudentIdModal';
import { cn } from '../../utils/cn';
import { toast } from '../../lib/toast';
import { useAuthStore } from '../../store/useAuthStore';
import { useNoticeStore } from '../../store/useNoticeStore';
import { useIsDesktop } from '../../hooks/use-responsive';

interface StudentSidebarProps {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  onExpand: () => void;
}

export const StudentSidebar: React.FC<StudentSidebarProps> = ({
  isCollapsed,
  isMobileOpen,
  onCloseMobile,
  onExpand,
}) => {
  const isDesktop = useIsDesktop(1024);
  // On mobile & tablet portrait (< 1024px) or whenever the slide-over drawer is open,
  // the sidebar is NEVER collapsed. isCollapsed only collapses the desktop sticky rail.
  const isEffectiveCollapsed = isDesktop && isCollapsed && !isMobileOpen;

  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const displayName = user?.name || 'Advocate Aspirant';
  const displayRoll = user?.rollNo || '';

  const asideRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerButtonRef = useRef<HTMLElement | null>(null);

  const [isIdModalOpen, setIsIdModalOpen] = useState(false);
  const [openSubMenus, setOpenSubMenus] = useState<Record<string, boolean>>({
    'prelims-tests': true,
    'mains-writing': false,
  });

  // 1. Auto-close mobile drawer when switching to desktop
  useEffect(() => {
    if (isDesktop && isMobileOpen) {
      onCloseMobile();
    }
  }, [isDesktop, isMobileOpen, onCloseMobile]);

  // 2. Auto-close mobile drawer on route change (including back/forward navigation)
  useEffect(() => {
    if (isMobileOpen) {
      onCloseMobile();
    }
  }, [location.pathname, location.search]);

  // 3. Body Scroll Lock on Mobile/Tablet when open
  useEffect(() => {
    if (!isMobileOpen || isDesktop) return;

    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [isMobileOpen, isDesktop]);

  // 4. Escape Key Listener for Mobile/Tablet Drawer
  useEffect(() => {
    if (!isMobileOpen || isDesktop) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseMobile();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileOpen, isDesktop, onCloseMobile]);

  // 5. Focus Management & Trapping inside mobile drawer
  useEffect(() => {
    if (isMobileOpen && !isDesktop) {
      triggerButtonRef.current = document.activeElement as HTMLElement;

      // Focus close button on open
      requestAnimationFrame(() => {
        closeButtonRef.current?.focus();
      });

      // Trap Tab key cycles inside the drawer
      const handleTabKey = (e: KeyboardEvent) => {
        if (e.key !== 'Tab' || !asideRef.current) return;

        const focusableElements = asideRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      };

      window.addEventListener('keydown', handleTabKey);
      return () => {
        window.removeEventListener('keydown', handleTabKey);
        // Restore focus to trigger when closing
        if (triggerButtonRef.current && typeof triggerButtonRef.current.focus === 'function') {
          triggerButtonRef.current.focus();
        }
      };
    }
  }, [isMobileOpen, isDesktop]);

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
    if (isEffectiveCollapsed) onExpand();
    setOpenSubMenus((prev) => ({ ...prev, [id]: isEffectiveCollapsed || !prev[id] }));
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

  return (
    <>
      {/* Digital Student ID Modal */}
      <StudentIdModal isOpen={isIdModalOpen} onClose={() => setIsIdModalOpen(false)} />

      {/* Mobile & Tablet Portrait Backdrop with Smooth Fade-in/out */}
      <div
        onClick={onCloseMobile}
        aria-hidden="true"
        className={cn(
          'fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden transition-opacity duration-300 ease-out motion-reduce:transition-none',
          isMobileOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        )}
      />

      {/* Sidebar Container */}
      <aside
        ref={asideRef}
        id="student-sidebar-drawer"
        role={!isDesktop ? 'dialog' : undefined}
        aria-modal={!isDesktop && isMobileOpen ? 'true' : undefined}
        aria-label={!isDesktop ? 'Navigation Sidebar' : undefined}
        className={cn(
          'fixed inset-y-0 left-0 z-50 h-[100dvh] flex flex-col justify-between bg-[#F7F3E6] dark:bg-[#061120] border-r border-[#ded7c4] dark:border-[#143564]/70 select-none overflow-x-hidden',
          // Desktop docking in app-shell flex row
          'lg:static lg:h-full lg:shrink-0 lg:z-30',
          // GPU-accelerated slide transition on mobile, width transition on desktop
          'transition-transform duration-300 ease-out will-change-transform motion-reduce:transition-none motion-reduce:transform-none',
          'student-sidebar lg:transition-[width] lg:duration-350 lg:ease-[cubic-bezier(0.22,1,0.36,1)] lg:motion-reduce:transition-none',
          // Desktop width
          isEffectiveCollapsed ? 'lg:w-18' : 'lg:w-76',
          // Mobile & Tablet Portrait width and slide position
          'w-[82vw] max-w-72 sm:max-w-76',
          isMobileOpen
            ? 'translate-x-0 shadow-2xl'
            : '-translate-x-full lg:translate-x-0 lg:shadow-none'
        )}
      >
        {/* 1. Header: Brand Logo & Title */}
        <div className="shrink-0 border-b border-slate-200 dark:border-[#143564]/60 overflow-hidden pt-[env(safe-area-inset-top,0px)]">
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
                  isEffectiveCollapsed ? 'opacity-0 w-0 pointer-events-none' : 'opacity-100 w-auto'
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

            {/* Close button for Mobile / Tablet Drawer */}
            <button
              ref={closeButtonRef}
              onClick={onCloseMobile}
              className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer transition-colors"
              aria-label="Close navigation menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. Middle: Navigation Links (Scrollable) */}
        <div className={cn(
          'flex-1 overflow-y-auto overflow-x-hidden no-scrollbar py-3 overscroll-contain transition-[padding] duration-350 motion-reduce:transition-none',
          isEffectiveCollapsed ? 'px-3 space-y-2' : 'px-4 space-y-4'
        )}>
          {studentSidebarItems.map((group) => (
            <div key={group.id} className="space-y-1">
              {group.label && (
                <h4
                  className={cn(
                    'px-2.5 text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider transition-all duration-200 overflow-hidden whitespace-nowrap',
                    isEffectiveCollapsed ? 'hidden' : 'student-sidebar-reveal opacity-100 mb-1.5'
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
                            if (isEffectiveCollapsed) onExpand();
                            setIsIdModalOpen(true);
                            onCloseMobile();
                          }}
                          title={isEffectiveCollapsed ? item.title : undefined}
                          aria-label={isEffectiveCollapsed ? item.title : undefined}
                          className={cn(
                            'w-full min-h-10 py-1 flex items-center rounded-xl text-xs font-medium transition-colors group relative text-left border border-transparent shrink-0',
                            isEffectiveCollapsed && 'w-11 h-11 min-h-11 p-0 justify-center',
                            'text-slate-700 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-[#0a1c36] hover:text-slate-900 dark:hover:text-white'
                          )}
                        >
                          <div className="w-10 h-10 flex items-center justify-center shrink-0">
                            <Icon className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
                          </div>
                          <div
                            className={cn(
                              'flex items-center justify-between flex-1 min-w-0 gap-1 transition-all duration-200',
                              isEffectiveCollapsed
                                ? 'hidden'
                                : 'student-sidebar-reveal opacity-100 w-auto pr-2.5 translate-x-0'
                            )}
                          >
                            <span className="min-w-0 flex-1 break-words leading-tight">{item.title}</span>
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
                        onClick={() => {
                          if (isEffectiveCollapsed) onExpand();
                          onCloseMobile();
                        }}
                        title={isEffectiveCollapsed ? item.title : undefined}
                        aria-label={isEffectiveCollapsed ? item.title : undefined}
                        className={cn(
                          'w-full min-h-10 py-1 flex items-center rounded-xl text-xs font-medium transition-colors group relative shrink-0',
                          isEffectiveCollapsed && 'w-11 h-11 min-h-11 p-0 justify-center',
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
                          {hasUnreadNotices && isEffectiveCollapsed && (
                            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-[#F7F3E6] dark:ring-[#061120] animate-pulse" />
                          )}
                        </div>
                        <div
                          className={cn(
                            'flex items-center justify-between flex-1 min-w-0 gap-1 transition-all duration-200',
                            isEffectiveCollapsed
                              ? 'hidden'
                              : 'student-sidebar-reveal opacity-100 w-auto pr-2.5 translate-x-0'
                          )}
                        >
                          <span className="min-w-0 flex-1 break-words leading-tight">{item.title}</span>
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
                        title={isEffectiveCollapsed ? item.title : undefined}
                        aria-label={isEffectiveCollapsed ? item.title : undefined}
                        className={cn(
                          'w-full min-h-10 py-1 flex items-center rounded-xl text-xs font-medium transition-colors group text-left cursor-pointer shrink-0',
                          isEffectiveCollapsed && 'w-11 h-11 min-h-11 p-0 justify-center',
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
                            'flex items-center justify-between flex-1 min-w-0 gap-1 transition-all duration-200',
                            isEffectiveCollapsed
                              ? 'hidden'
                              : 'student-sidebar-reveal opacity-100 w-auto pr-2.5 translate-x-0'
                          )}
                        >
                          <span className="min-w-0 flex-1 break-words leading-tight">{item.title}</span>
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
                          inert={isEffectiveCollapsed || !isParentOpen}
                          className={cn(
                            'pl-6 pr-1 space-y-1 border-l border-slate-300 dark:border-[#143564]/50 ml-5 transition-[max-height,opacity,margin,padding] duration-350 ease-in-out motion-reduce:transition-none overflow-hidden',
                            !isEffectiveCollapsed && isParentOpen
                              ? 'max-h-[480px] opacity-100 my-1 py-1 student-sidebar-reveal'
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
                                  'flex items-start justify-between gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors',
                                  subActive
                                    ? 'text-[#c19b48] dark:text-[#e8cf8d] font-semibold bg-amber-50 dark:bg-[#143564]/40'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-white/[0.03]'
                                )}
                              >
                                <span className="min-w-0 break-words leading-tight">{sub.title}</span>
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

        {/* 3. Footer Area: Student Profile */}
        <div className={cn(
          'p-4 border-t border-slate-200 dark:border-[#143564]/60 space-y-2 shrink-0 bg-slate-100/60 dark:bg-[#040b14]/50 overflow-hidden pb-[max(1rem,env(safe-area-inset-bottom))]',
          isEffectiveCollapsed && 'px-3'
        )}>
          {/* Student Profile Row */}
          <div className="flex items-center min-h-10 rounded-xl bg-white dark:bg-[#0a1c36]/60 border border-slate-200 dark:border-[#143564]/50 shadow-xs w-full shrink-0">
            <div className="w-10 h-10 flex items-center justify-center shrink-0">
              <div className="w-7 h-7 rounded-lg bg-[#c19b48]/20 border border-[#c19b48]/40 text-[#c19b48] dark:text-[#e8cf8d] flex items-center justify-center font-bold text-xs">
                <User className="w-3.5 h-3.5 text-[#c19b48]" />
              </div>
            </div>

            <div
              className={cn(
                'flex items-center justify-between flex-1 min-w-0 gap-1 transition-all duration-200',
                isEffectiveCollapsed ? 'hidden' : 'student-sidebar-reveal opacity-100 w-auto pr-2'
              )}
            >
              <div className="flex-1 min-w-0 pr-1">
                <h5 className="text-xs font-semibold text-slate-900 dark:text-white break-words leading-tight">{displayName}</h5>
                <p className="text-[10px] text-[#c19b48] font-mono break-words leading-tight">Roll: {displayRoll}</p>
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

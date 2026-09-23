import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  PanelLeft,
  Search,
  Bell,
  LogOut,
  User,
  Plus,
  FileCheck,
  UserPlus,
  BellRing,
  ChevronDown,
} from 'lucide-react';
import { AdminSearchDialog } from './AdminSearchDialog';
import { toast } from 'react-hot-toast';
import { useAdminAuthStore } from '../../store/useAdminAuthStore';

interface AdminNavbarProps {
  isCollapsed: boolean;
  onToggleSidebar: () => void;
  onOpenMobileSidebar: () => void;
}

export const AdminNavbar: React.FC<AdminNavbarProps> = ({
  onToggleSidebar,
  onOpenMobileSidebar,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Refs for outside-click detection
  const quickActionRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (quickActionRef.current && !quickActionRef.current.contains(target)) {
        setIsQuickActionOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(target)) {
        setIsNotificationOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setIsUserMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsQuickActionOpen(false);
        setIsNotificationOpen(false);
        setIsUserMenuOpen(false);
      }
    };

    if (isQuickActionOpen || isNotificationOpen || isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isQuickActionOpen, isNotificationOpen, isUserMenuOpen]);

  // Dynamic breadcrumb text generator
  const getBreadcrumb = () => {
    const path = location.pathname;
    if (path === '/') return 'Executive Command Center';
    if (path.includes('leads/pipeline')) return 'Inquiry Pipeline & Kanban';
    if (path.includes('leads/demos')) return 'Trial & Demo Registrations';
    if (path.includes('leads/new-enrollment')) return 'Direct Student Admission';
    if (path.includes('leads')) return 'Admissions & Leads CRM';
    if (path.includes('courses/all')) return 'Course Offerings & Curricula';
    if (path.includes('courses/batches')) return 'Active Batches & Shifts';
    if (path.includes('courses/recordings')) return 'Recorded Lecture Archive';
    if (path.includes('courses')) return 'Course & Batch Manager';
    if (path.includes('live-classes')) return 'Live Classroom & Streams';
    if (path.includes('timetable')) return 'Timetable & Shift Planner';
    if (path.includes('daily-digest')) return 'Daily Legal Digest CMS';
    if (path.includes('mains-evaluation/inbox')) return 'Pending Answer Sheets (PDF)';
    if (path.includes('mains-evaluation/graded')) return 'Graded Copies & Feedback';
    if (path.includes('mains-evaluation/questions')) return 'Daily Mains Question Bank';
    if (path.includes('mains-evaluation')) return 'Mains Evaluation Desk';
    if (path.includes('tests/all')) return 'Mock Test Papers & Exams';
    if (path.includes('tests/bank')) return 'Bare Act MCQ Question Bank';
    if (path.includes('tests/rankings')) return 'All-India Rank Computation';
    if (path.includes('tests')) return 'Prelims Test Series Builder';
    if (path.includes('bare-acts')) return 'Bare Act Notes & Charts';
    if (path.includes('judgments')) return 'Landmark Judgments CMS';
    if (path.includes('pyqs')) return 'Solved PYQ Archive';
    if (path.includes('students/roster')) return 'Enrolled Student Roster';
    if (path.includes('students/video-tracking')) return 'Video Watch Timestamps';
    if (path.includes('students')) return 'Student Directory & Progress';
    if (path.includes('doubts')) return 'Faculty Doubt Resolution Desk';
    if (path.includes('fees')) return 'Fee Installments & Receipts';
    if (path.includes('notices')) return 'Notice Board Broadcasts';
    if (path.includes('staff')) return 'Staff & Role Management';
    if (path.includes('settings')) return 'System Settings & Governance';
    return 'Chamber Administration';
  };

  const storedAdmin = useAdminAuthStore((state) => state.admin);
  const logout = useAdminAuthStore((state) => state.logout);

  const adminUser = storedAdmin || {
    name: 'Adv. Rajinder Sir',
    email: 'director@rajinderlawacademy.com',
    role: 'admin',
    title: 'Director & Academic Dean',
  };

  const handleLogout = async () => {
    await logout();
    toast('Signed out of Chamber Administration', { icon: '👋' });
    navigate('/login');
  };

  return (
    <>
      <AdminSearchDialog isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      <header className="sticky top-0 z-30 h-16 bg-[#1E1E1E] border-b border-[#3D3D3D] px-4 sm:px-6 flex items-center justify-between text-[#F7F3E6] select-none">
        {/* Left Side: Sidebar Toggle & Route Breadcrumb */}
        <div className="flex items-center gap-3">
          {/* Desktop Toggle Button */}
          <button
            type="button"
            onClick={onToggleSidebar}
            title="Toggle Sidebar (Ctrl+B)"
            className="hidden md:flex p-2 rounded-xl hover:bg-[#2F2F2F] text-[#A8A294] hover:text-[#F7F3E6] border border-transparent hover:border-[#3D3D3D] transition-colors cursor-pointer"
          >
            <PanelLeft className="w-4 h-4" />
          </button>

          {/* Mobile Toggle Button */}
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            className="md:hidden p-2 rounded-xl hover:bg-[#2F2F2F] text-[#A8A294] hover:text-[#F7F3E6] border border-transparent hover:border-[#3D3D3D] transition-colors cursor-pointer"
          >
            <PanelLeft className="w-4 h-4" />
          </button>

          {/* Separator */}
          <div className="h-5 w-px bg-[#3D3D3D]" />

          {/* Active Route Breadcrumb */}
          <div className="flex items-center gap-2">
            <span className="font-serif text-sm font-semibold text-[#F7F3E6] tracking-wide truncate">
              {getBreadcrumb()}
            </span>
            <span className="hidden xl:inline-block text-[10px] px-2 py-0.5 rounded-md bg-[#262626] border border-[#3D3D3D] text-[#C19B48]">
              Judiciary Hub
            </span>
          </div>
        </div>

        {/* Right Side: Live Pulse, Search, Quick Actions, Notifications, User */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Live Studio Pulse Badge */}
          <div
            onClick={() => navigate('/live-classes')}
            className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium cursor-pointer hover:bg-red-500/20 transition-colors"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
            </span>
            <span className="text-[11px] font-semibold">Live: CPC at 5 PM</span>
          </div>

          {/* Search Trigger Button (Ctrl+K) */}
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#A8A294] hover:text-[#F7F3E6] hover:border-[#C19B48]/60 transition-all text-xs cursor-pointer"
          >
            <Search className="w-3.5 h-3.5 text-[#C19B48]" />
            <span className="hidden md:inline text-[11px]">
              Search students, copies...
            </span>
            <kbd className="hidden md:inline-block px-1.5 py-0.2 text-[9px] font-mono bg-[#1E1E1E] text-[#A8A294] border border-[#3D3D3D] rounded">
              Ctrl K
            </kbd>
          </button>

          {/* Quick Action Dropdown */}
          <div ref={quickActionRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setIsQuickActionOpen(!isQuickActionOpen);
                setIsNotificationOpen(false);
                setIsUserMenuOpen(false);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#C19B48] hover:bg-[#D8B862] text-[#1E1E1E] font-semibold text-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Action</span>
              <ChevronDown className="w-3 h-3 opacity-75" />
            </button>

            {isQuickActionOpen && (
              <div
                className="absolute right-0 mt-2 w-56 bg-[#1E1E1E] border border-[#3D3D3D] rounded-2xl p-1.5 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100"
                onClick={() => setIsQuickActionOpen(false)}
              >
                <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[#A8A294] border-b border-[#3D3D3D]">
                  Operational Shortcuts
                </div>
                <button
                  onClick={() => navigate('/mains-evaluation')}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-[#F7F3E6] hover:bg-[#2F2F2F] transition-colors text-left cursor-pointer"
                >
                  <FileCheck className="w-4 h-4 text-[#F59E0B]" />
                  <span>Evaluate Mains Copy (14)</span>
                </button>
                <button
                  onClick={() => navigate('/leads/new-enrollment')}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-[#F7F3E6] hover:bg-[#2F2F2F] transition-colors text-left cursor-pointer"
                >
                  <UserPlus className="w-4 h-4 text-[#34D399]" />
                  <span>New Student Admission</span>
                </button>
                <button
                  onClick={() => navigate('/notices')}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-[#F7F3E6] hover:bg-[#2F2F2F] transition-colors text-left cursor-pointer"
                >
                  <BellRing className="w-4 h-4 text-[#60A5FA]" />
                  <span>Broadcast Circular</span>
                </button>
              </div>
            )}
          </div>

          {/* Notifications Dropdown */}
          <div ref={notificationRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setIsNotificationOpen(!isNotificationOpen);
                setIsQuickActionOpen(false);
                setIsUserMenuOpen(false);
              }}
              title="Operational Alerts"
              className="relative p-2 rounded-xl bg-[#262626] border border-[#3D3D3D] hover:border-[#C19B48]/60 text-[#A8A294] hover:text-[#F7F3E6] transition-colors cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#EF4444] text-[9px] font-bold text-white flex items-center justify-center border-2 border-[#1E1E1E]">
                3
              </span>
            </button>

            {isNotificationOpen && (
              <div
                className="absolute right-0 mt-2 w-80 bg-[#1E1E1E] border border-[#3D3D3D] rounded-2xl shadow-2xl z-50 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-4 py-3 border-b border-[#3D3D3D] flex items-center justify-between">
                  <span className="text-xs font-bold text-[#F7F3E6] uppercase tracking-wider font-serif">
                    Chamber Alerts
                  </span>
                  <span className="text-[10px] text-[#C19B48] font-semibold">
                    3 Action Required
                  </span>
                </div>
                <div className="max-h-72 overflow-y-auto p-2 space-y-1 divide-y divide-[#3D3D3D]/50">
                  <div
                    onClick={() => {
                      navigate('/mains-evaluation');
                      setIsNotificationOpen(false);
                    }}
                    className="p-2.5 hover:bg-[#2F2F2F] rounded-xl transition-colors cursor-pointer flex items-start gap-3"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#F59E0B]/20 text-[#F59E0B] flex items-center justify-center shrink-0 mt-0.5">
                      <FileCheck className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-[#F7F3E6] truncate">
                        14 Mains Copies Pending Review
                      </div>
                      <p className="text-[11px] text-[#A8A294] truncate">
                        Daily Challenge #48 submitted by Morning Batch
                      </p>
                      <span className="text-[9px] text-[#F59E0B]">2 hours ago</span>
                    </div>
                  </div>

                  <div
                    onClick={() => {
                      navigate('/doubts');
                      setIsNotificationOpen(false);
                    }}
                    className="p-2.5 hover:bg-[#2F2F2F] rounded-xl transition-colors cursor-pointer flex items-start gap-3 pt-2"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#60A5FA]/20 text-[#60A5FA] flex items-center justify-center shrink-0 mt-0.5">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-[#F7F3E6] truncate">
                        5 New Doubt Desk Tickets
                      </div>
                      <p className="text-[11px] text-[#A8A294] truncate">
                        Questions on Sec 9 CPC & Res Judicata
                      </p>
                      <span className="text-[9px] text-[#60A5FA]">45 mins ago</span>
                    </div>
                  </div>

                  <div
                    onClick={() => {
                      navigate('/leads');
                      setIsNotificationOpen(false);
                    }}
                    className="p-2.5 hover:bg-[#2F2F2F] rounded-xl transition-colors cursor-pointer flex items-start gap-3 pt-2"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#34D399]/20 text-[#34D399] flex items-center justify-center shrink-0 mt-0.5">
                      <UserPlus className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-[#F7F3E6] truncate">
                        4 Demo Class Confirmations
                      </div>
                      <p className="text-[11px] text-[#A8A294] truncate">
                        Judiciary Foundation 2026 Batch trial seats
                      </p>
                      <span className="text-[9px] text-[#34D399]">Today</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Menu */}
          <div ref={userMenuRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setIsUserMenuOpen(!isUserMenuOpen);
                setIsNotificationOpen(false);
                setIsQuickActionOpen(false);
              }}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-[#2F2F2F] border border-transparent hover:border-[#3D3D3D] transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-[#2F2F2F] border border-[#C19B48]/50 flex items-center justify-center text-[#C19B48]">
                <User className="w-4 h-4" />
              </div>
              <div className="hidden xl:block text-left">
                <div className="text-xs font-semibold text-[#F7F3E6] leading-none">
                  {adminUser.name}
                </div>
                <div className="text-[10px] text-[#A8A294] capitalize mt-1">
                  {adminUser.role}
                </div>
              </div>
            </button>

            {isUserMenuOpen && (
              <div
                className="absolute right-0 mt-2 w-56 bg-[#1E1E1E] border border-[#3D3D3D] rounded-2xl p-1.5 shadow-2xl z-50"
                onClick={() => setIsUserMenuOpen(false)}
              >
                <div className="px-3 py-2 border-b border-[#3D3D3D]">
                  <div className="text-xs font-bold text-[#F7F3E6]">{adminUser.name}</div>
                  <div className="text-[10px] text-[#A8A294] truncate">{adminUser.email}</div>
                  <div className="mt-1 inline-block px-2 py-0.5 rounded-full text-[9px] font-semibold bg-[#C19B48]/15 border border-[#C19B48]/30 text-[#E8CF8D] capitalize">
                    {adminUser.role} Access
                  </div>
                </div>
                <button
                  onClick={() => navigate('/staff')}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-[#F7F3E6] hover:bg-[#2F2F2F] transition-colors text-left cursor-pointer mt-1"
                >
                  <span>Chamber Roles & Audit</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors text-left cursor-pointer border-t border-[#3D3D3D] mt-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out of Chamber</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
};

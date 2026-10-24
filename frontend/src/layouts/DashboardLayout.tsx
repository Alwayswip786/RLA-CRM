import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { StudentSidebar } from '../components/dashboard/StudentSidebar';
import { StudentNavbar } from '../components/dashboard/StudentNavbar';

interface DashboardLayoutProps {
  children?: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const location = useLocation();
  const mainContentRef = useRef<HTMLElement>(null);

  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('rla_sidebar_collapsed') === 'true';
  });
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Sync collapsed state to localStorage
  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('rla_sidebar_collapsed', String(next));
      return next;
    });
  };

  // Keyboard shortcut: Ctrl+B or Cmd+B to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Reset main content scroll position when switching routes
  useEffect(() => {
    mainContentRef.current?.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);

  return (
    <div className="h-screen h-[100dvh] bg-[#F7F3E6] dark:bg-[#040b14] flex text-slate-900 dark:text-slate-100 font-sans transition-colors selection:bg-[#c19b48]/30 selection:text-amber-900 dark:selection:text-[#faf3e2] overflow-hidden">
      {/* Sidebar */}
      <StudentSidebar
        onExpand={() => {
          setIsCollapsed(false);
          localStorage.setItem('rla_sidebar_collapsed', 'false');
        }}
        isCollapsed={isCollapsed}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      {/* Main App Canvas */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Navbar / Header */}
        <StudentNavbar
          isCollapsed={isCollapsed}
          isMobileOpen={isMobileOpen}
          onToggleSidebar={toggleSidebar}
          onOpenMobileSidebar={() => setIsMobileOpen(true)}
        />

        {/* Content Body (Independently Scrollable) */}
        <main
          ref={mainContentRef}
          className="flex-1 px-3 py-4 sm:px-6 sm:py-6 lg:p-8 min-w-0 min-h-0 bg-[#F7F3E6]/70 dark:bg-[#061120]/50 overflow-y-auto overflow-x-hidden transition-colors touch-momentum"
        >
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
};

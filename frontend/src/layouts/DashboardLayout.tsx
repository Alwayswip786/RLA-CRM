import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { StudentSidebar } from '../components/dashboard/StudentSidebar';
import { StudentNavbar } from '../components/dashboard/StudentNavbar';

interface DashboardLayoutProps {
  children?: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
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

  return (
    <div className="min-h-screen bg-[#F7F3E6] dark:bg-[#040b14] flex text-slate-900 dark:text-slate-100 font-sans transition-colors selection:bg-[#c19b48]/30 selection:text-amber-900 dark:selection:text-[#faf3e2]">
      {/* Sidebar */}
      <StudentSidebar
        isCollapsed={isCollapsed}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      {/* Main App Canvas */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Navbar / Header */}
        <StudentNavbar
          isCollapsed={isCollapsed}
          onToggleSidebar={toggleSidebar}
          onOpenMobileSidebar={() => setIsMobileOpen(true)}
        />

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-[#F7F3E6]/70 dark:bg-[#061120]/50 min-h-[calc(100vh-3.5rem)] transition-colors">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
};

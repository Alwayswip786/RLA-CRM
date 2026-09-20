import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { useAdminAuthStore } from '../../store/useAdminAuthStore';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

export const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ children }) => {
  const isAuthenticated = useAdminAuthStore((state) => state.isAuthenticated);
  const isInitialized = useAdminAuthStore((state) => state.isInitialized);
  const admin = useAdminAuthStore((state) => state.admin);
  const location = useLocation();

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-[#1E1E1E] text-[#F7F3E6] flex flex-col items-center justify-center p-4">
        <div className="w-14 h-14 rounded-2xl bg-[#C19B48]/15 border border-[#C19B48]/40 flex items-center justify-center text-[#C19B48] shadow-xl mb-4">
          <ShieldCheck className="w-7 h-7 animate-pulse" />
        </div>
        <div className="flex items-center gap-2.5 text-xs font-semibold text-[#C19B48] tracking-widest uppercase">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Verifying Executive Clearance...</span>
        </div>
        <p className="text-[11px] text-[#A8A294] mt-2">Rajinder Law Academy • Chamber Administration</p>
      </div>
    );
  }

  if (!isAuthenticated || !admin || (admin.role !== 'admin' && admin.role !== 'faculty')) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

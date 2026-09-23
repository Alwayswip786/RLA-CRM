import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { ShieldCheck, Loader2, ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAdminAuthStore } from '../../store/useAdminAuthStore';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
}

export const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({
  children,
  requiredPermission,
}) => {
  const isAuthenticated = useAdminAuthStore((state) => state.isAuthenticated);
  const isInitialized = useAdminAuthStore((state) => state.isInitialized);
  const admin = useAdminAuthStore((state) => state.admin);
  const hasPermission = useAdminAuthStore((state) => state.hasPermission);
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
        <p className="text-[11px] text-[#A8A294] mt-2">
          Rajinder Law Academy • Chamber Administration
        </p>
      </div>
    );
  }

  if (!isAuthenticated || !admin || (admin.role !== 'admin' && admin.role !== 'faculty')) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check granular permission if required
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-[#C19B48] mb-5 shadow-lg">
          <ShieldAlert className="w-8 h-8 text-[#C19B48]" />
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C19B48]/10 border border-[#C19B48]/30 text-[#C19B48] text-xs font-semibold mb-3">
          <span>Chamber Governance • Access Denied</span>
        </div>
        <h2 className="font-serif text-2xl font-bold text-[#F7F3E6] mb-2">
          Institutional Clearance Required
        </h2>
        <p className="text-xs text-[#A8A294] max-w-md leading-relaxed mb-6">
          Your active account (<span className="text-[#F7F3E6] font-medium">{admin.name}</span> —{' '}
          <span className="text-[#C19B48] font-medium">{admin.title || admin.roleName}</span>) does not possess the institutional clearance required to access{' '}
          <code className="bg-[#262626] text-[#E8CF8D] px-2 py-0.5 rounded border border-[#3D3D3D] text-[11px]">
            {requiredPermission}
          </code>.
        </p>
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#C19B48] hover:bg-[#D8B862] text-[#1E1E1E] text-xs font-bold transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Command Center</span>
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

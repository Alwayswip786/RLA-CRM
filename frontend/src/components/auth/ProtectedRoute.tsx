import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { Scale, Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const user = useAuthStore((state) => state.user);
  const location = useLocation();

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] dark:bg-[#061120] flex flex-col items-center justify-center p-4 transition-colors">
        <div className="w-12 h-12 rounded-2xl bg-[#c19b48]/10 border border-[#c19b48]/30 flex items-center justify-center text-[#c19b48] shadow-lg mb-3">
          <Scale className="w-6 h-6 animate-pulse" />
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-[#c19b48] dark:text-[#e8cf8d] tracking-wider uppercase">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Verifying Judicial Session...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Enforce onboarding before allowing access to classroom features
  if (user?.needsOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};

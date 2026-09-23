import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { ThreeDotLoader } from '../ui/ThreeDotLoader';

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
      <div className="min-h-[100dvh] bg-[#F7F3E6] dark:bg-[#061120] flex items-center justify-center p-6 transition-colors">
        <ThreeDotLoader />
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

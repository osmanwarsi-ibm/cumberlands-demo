/**
 * ProtectedRoute - Wrapper component that requires authentication
 */

import { Navigate } from 'react-router-dom';
import { useAuth } from '../state/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();

  // Don't redirect while auth is still being determined
  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

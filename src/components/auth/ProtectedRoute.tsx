import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { LoadingScreen } from '@/components/ui/loading-screen';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Array<'principal' | 'teacher' | 'student' | 'parent'>;
  requiredRole?: 'principal' | 'teacher' | 'student' | 'parent';
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  requiredRole,
  redirectTo = '/dashboard'
}) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      // User not authenticated, redirect to auth page but remember where
      // they were headed so a successful login can send them back there.
      navigate('/auth', { state: { from: location.pathname + location.search } });
      return;
    }

    if (!loading && user) {
      // Check role-based access
      const userRole = user.role;
      
      if (requiredRole && userRole !== requiredRole) {
        navigate(redirectTo);
        return;
      }

      if (allowedRoles && !allowedRoles.includes(userRole as any)) {
        navigate(redirectTo);
        return;
      }
    }
  }, [user, loading, navigate, allowedRoles, requiredRole, redirectTo, location]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  // Check role access and show error if unauthorized
  const userRole = user.role;
  
  if (requiredRole && userRole !== requiredRole) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Access denied. This page is only accessible to {requiredRole}s. 
              You are currently logged in as a {userRole}.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (allowedRoles && !allowedRoles.includes(userRole as any)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Access denied. This page is only accessible to {allowedRoles.join(', ')}. 
              You are currently logged in as a {userRole}.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
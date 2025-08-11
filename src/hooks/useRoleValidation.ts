import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

interface RoleValidationConfig {
  allowedRoles?: Array<'principal' | 'teacher' | 'student' | 'parent'>;
  requiredRole?: 'principal' | 'teacher' | 'student' | 'parent';
  redirectTo?: string;
}

export const useRoleValidation = (config: RoleValidationConfig = {}) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const {
    allowedRoles,
    requiredRole,
    redirectTo = '/dashboard'
  } = config;

  useEffect(() => {
    if (loading) return;

    // Not authenticated
    if (!user) {
      navigate('/auth');
      return;
    }

    const userRole = user.role;
    const currentPath = location.pathname;

    // Check for role-specific URL patterns
    if (currentPath.startsWith('/student/') && userRole !== 'student') {
      navigate('/dashboard');
      return;
    }

    if (currentPath.startsWith('/teacher/') && userRole !== 'teacher') {
      navigate('/dashboard');
      return;
    }

    if (currentPath.startsWith('/principal/') && userRole !== 'principal') {
      navigate('/dashboard');
      return;
    }

    // Check specific role requirements
    if (requiredRole && userRole !== requiredRole) {
      navigate(redirectTo);
      return;
    }

    if (allowedRoles && !allowedRoles.includes(userRole as any)) {
      navigate(redirectTo);
      return;
    }

    // Check page-specific role restrictions
    const restrictedPages = {
      '/students': ['principal', 'teacher'],
      '/teachers': ['principal'],
      '/classes': ['principal', 'teacher'],
      '/subjects': ['principal', 'teacher'],
      '/assignments': ['principal', 'teacher'],
      '/submissions': ['principal', 'teacher'],
      '/bin': ['principal'],
      '/join-subject': ['student'],
      '/student/subjects': ['student'],
      '/student/assignments': ['student'],
      '/student/classes': ['student']
    };

    const pageRoles = restrictedPages[currentPath as keyof typeof restrictedPages];
    if (pageRoles && !pageRoles.includes(userRole)) {
      navigate('/dashboard');
      return;
    }

  }, [user, loading, location.pathname, navigate, allowedRoles, requiredRole, redirectTo]);

  return {
    user,
    loading,
    isAuthorized: !loading && user && (
      !requiredRole || user.role === requiredRole
    ) && (
      !allowedRoles || allowedRoles.includes(user.role as any)
    )
  };
};
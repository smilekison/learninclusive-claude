import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Debug hook: Logs total number of students (all profiles with role = 'student')
 * Runs only for principals and only once per mount.
 */
export const usePrincipalStudentCountDebug = () => {
  const { user } = useAuth();
  const hasLoggedRef = useRef(false);

  useEffect(() => {
    if (hasLoggedRef.current) return;
    if (!user || user.role !== 'principal') return;

    hasLoggedRef.current = true;

    const logStudentCount = async () => {
      const { count, error } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'student');

      if (error) {
        console.error('Principal Debug: Failed to count students', error);
        return;
      }

      console.info('Principal Debug: Total students (all, regardless of class/subject):', count ?? 0);
    };

    logStudentCount();
  }, [user]);
};

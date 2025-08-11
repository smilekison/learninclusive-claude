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
      const { data, count, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name', { count: 'exact' })
        .eq('role', 'student');

      if (error) {
        console.error('Principal Debug: Failed to fetch students', error);
        return;
      }

      const names = (data ?? []).map(p => `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim());
      console.table((data ?? []).map(p => ({ id: p.id, name: `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() })));
      console.info('Principal Debug: Total students (all, regardless of class/subject):', count ?? names.length);
    };
    logStudentCount();
  }, [user]);
};

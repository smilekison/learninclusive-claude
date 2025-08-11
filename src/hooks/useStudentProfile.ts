import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Hook specifically for getting student profile with proper error handling
export const useStudentProfile = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['student-profile', user?.id],
    queryFn: async () => {
      if (!user?.id || user?.role !== 'student') {
        console.log('useStudentProfile: No user ID or not a student');
        return null;
      }
      
      console.log('useStudentProfile: Fetching profile for user:', user.id, 'role:', user.role);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, role, is_active')
        .eq('user_id', user.id)
        .eq('role', 'student')
        .eq('is_active', true)
        .maybeSingle();
        
      if (error) {
        console.error('Student profile query error:', error);
        throw error;
      }
      
      console.log('useStudentProfile: Retrieved profile:', data);
      return data;
    },
    enabled: !!user?.id && user?.role === 'student',
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false, // Don't retry for non-students
  });
};
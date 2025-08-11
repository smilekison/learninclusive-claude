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
      
      console.log('useStudentProfile: User is already a student with profile ID:', user.id);
      
      // Since user.id is already the profile ID and we know the user is a student,
      // we can return the profile data directly from the auth context
      return {
        id: user.id,
        first_name: user.firstName,
        last_name: user.lastName,
        role: user.role,
        is_active: true
      };
    },
    enabled: !!user?.id && user?.role === 'student',
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false, // Don't retry for non-students
  });
};
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

// Enhanced hook for getting complete student profile with disabilities and accessibility data
export const useEnhancedStudentProfile = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user?.id || user?.role !== 'student') return;
    const channel = supabase
      .channel(`profile-updates-${user.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: `user_id=eq.${user.id}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['enhanced-student-profile', user.id] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, user?.role, queryClient]);
  
  return useQuery({
    queryKey: ['enhanced-student-profile', user?.id],
    queryFn: async () => {
      if (!user?.id || user?.role !== 'student') {
        console.log('useEnhancedStudentProfile: No user ID or not a student');
        return null;
      }
      
      console.log('useEnhancedStudentProfile: Fetching complete profile for:', user.id);
      
      // Fetch the complete profile from the profiles table using user_id
      const { data: profile, error } = await supabase
        .from('profiles')
        .select(`
          *,
          student_accommodations(*),
          student_support_services(*),
          student_progress_tracking(*)
        `)
        .eq('user_id', user.id)
        .eq('role', 'student')
        .single();

      if (error) {
        console.error('Error fetching enhanced student profile:', error);
        throw error;
      }

      console.log('Profile query result:', { profile, error });
      return profile;
    },
    enabled: !!user?.id && user?.role === 'student',
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
    retry: 3,
  });
};
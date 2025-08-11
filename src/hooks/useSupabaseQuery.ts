import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Generic hook for fetching data from Supabase
export const useSupabaseQuery = <T>(
  key: string[],
  queryFn: () => Promise<{ data: T[] | null; error: any }>
) => {
  return useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await queryFn();
      if (error) throw error;
      return data || [];
    },
  });
};

// Hook for mutations with toast notifications
export const useSupabaseMutation = <T, U>(
  mutationFn: (variables: U) => Promise<{ data: T | null; error: any }>,
  options?: {
    onSuccess?: (data: T) => void;
    invalidateKeys?: string[][];
    successMessage?: string;
    errorMessage?: string;
  }
) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: U) => {
      const { data, error } = await mutationFn(variables);
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (options?.successMessage) {
        toast({
          title: "Success",
          description: options.successMessage,
        });
      }
      
      if (options?.invalidateKeys) {
        options.invalidateKeys.forEach(key => {
          queryClient.invalidateQueries({ queryKey: key });
        });
      }
      
      options?.onSuccess?.(data);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: options?.errorMessage || error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });
};

// Specific hooks for common queries
export const useClasses = () => {
  return useSupabaseQuery(['classes'], async () =>
    await supabase
      .from('classes')
      .select(`
        *,
        teacher:profiles!classes_teacher_id_fkey(id, first_name, last_name),
        school:schools(name),
        subjects:subjects(id, name),
        student_enrollments:student_enrollments(count)
      `)
      .eq('is_active', true)
  );
};

export const useDeletedItems = () => {
  return useSupabaseQuery(['deleted_items'], async () =>
    await supabase
      .from('deleted_items')
      .select('*')
      .order('deleted_at', { ascending: false })
  );
};

// Teacher-specific deleted items hook
export const useTeacherDeletedItems = () => {
  return useSupabaseQuery(['teacher-deleted-items'], async () => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
      .maybeSingle();
    
    if (!profile) return { data: [], error: null };
    
    return await supabase
      .from('deleted_items')
      .select('*')
      .eq('deleted_by', profile.id)
      .order('deleted_at', { ascending: false });
  });
};

export const useSchools = () => {
  return useSupabaseQuery(['schools'], async () =>
    await supabase.from('schools').select('*')
  );
};

export const useProfiles = (role?: string) => {
  return useSupabaseQuery(['profiles', role || 'all'], async () =>
    role
      ? await supabase.from('profiles').select('*').eq('role', role).eq('is_active', true)
      : await supabase.from('profiles').select('*').eq('is_active', true)
  );
};

export const useSubjects = (classId?: string) => {
  return useSupabaseQuery(['subjects', classId || 'all'], async () => {
    const query = supabase
      .from('subjects')
      .select(`
        *,
        class:classes!inner(
          *,
          student_enrollments(count)
        )
      `);
    
    if (classId) {
      return await query.eq('class_id', classId);
    } else {
      return await query;
    }
  });
};

export const useAssignments = (subjectId?: string) => {
  return useSupabaseQuery(['assignments', subjectId || 'all'], async () =>
    subjectId
      ? await supabase.from('assignments').select('*').eq('subject_id', subjectId).eq('is_active', true)
      : await supabase.from('assignments').select('*').eq('is_active', true)
  );
};

export const useNotifications = () => {
  return useSupabaseQuery(['notifications'], async () => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
      .maybeSingle();
    
    if (!profile) return { data: [], error: null };
    
    return await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(50);
  });
};

// Hook to create notification
export const useCreateNotification = () => {
  return useSupabaseMutation(
    async (notificationData: { title: string; message: string; type?: string; user_id: string }) => {
      return await supabase.from('notifications').insert(notificationData);
    },
    {
      invalidateKeys: [['notifications']]
    }
  );
};

// Soft delete mutations
export const useSoftDelete = () => {
  return useSupabaseMutation(
    async ({ tableName, itemId, deleterId }: { tableName: string; itemId: string; deleterId: string }) => {
      const { data, error } = await supabase.rpc('soft_delete_item', {
        table_name: tableName,
        item_id: itemId,
        deleter_id: deleterId
      });
      
      if (error) throw error;
      return { data, error: null };
    },
    {
      invalidateKeys: [
        ['profiles'], ['classes'], ['subjects'], ['assignments'], ['deleted_items'],
        ['teacher-classes'], ['teacher-subjects'], ['teacher-assignments'], ['teacher-students'], ['teacher-deleted-items']
      ],
      successMessage: "Item moved to bin successfully"
    }
  );
};

export const useRestoreItem = () => {
  return useSupabaseMutation(
    async (deletedItemId: string) => {
      const { data, error } = await supabase.rpc('restore_deleted_item', {
        deleted_item_id: deletedItemId
      });
      
      if (error) throw error;
      return { data, error: null };
    },
    {
      invalidateKeys: [
        ['profiles'], ['classes'], ['subjects'], ['assignments'], ['deleted_items'],
        ['teacher-classes'], ['teacher-subjects'], ['teacher-assignments'], ['teacher-students'], ['teacher-deleted-items']
      ],
      successMessage: "Item restored successfully"
    }
  );
};

export const useToggleStatus = () => {
  return useSupabaseMutation(
    async ({ tableName, itemId, isActive }: { tableName: string; itemId: string; isActive: boolean }) => {
      const validTables = ['profiles', 'classes', 'subjects', 'assignments'] as const;
      const table = validTables.find(t => t === tableName);
      if (!table) throw new Error(`Invalid table name: ${tableName}`);
      
      const { data, error } = await supabase
        .from(table)
        .update({ is_active: isActive })
        .eq('id', itemId);
        
      if (error) throw error;
      return { data, error: null };
    },
    {
      invalidateKeys: [
        ['profiles'], ['classes'], ['subjects'], ['assignments'],
        ['teacher-classes'], ['teacher-subjects'], ['teacher-assignments'], ['teacher-students']
      ],
      successMessage: "Status updated successfully"
    }
  );
};

// Teacher-specific hooks (with principal override)
export const useTeacherClasses = () => {
  return useSupabaseQuery(['teacher-classes'], async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('user_id', user?.id)
      .maybeSingle();
    
    if (!profile) return { data: [], error: null };
    
    // If user is principal, return all classes
    if (profile.role === 'principal') {
      const { data, error } = await supabase
        .from('classes')
        .select(`
          *,
          teacher:profiles!classes_teacher_id_fkey(first_name, last_name),
          school:schools(name),
          subjects:subjects(id, name),
          student_enrollments(
            id,
            student:profiles!student_enrollments_student_id_fkey(id, first_name, last_name)
          )
        `)
        .eq('is_active', true);
      return { data, error };
    }
    
    // For teachers, only return their classes
    const { data, error } = await supabase
      .from('classes')
      .select(`
        *,
        teacher:profiles!classes_teacher_id_fkey(first_name, last_name),
        school:schools(name),
        subjects:subjects(id, name),
        student_enrollments(
          id,
          student:profiles!student_enrollments_student_id_fkey(id, first_name, last_name)
        )
      `)
      .eq('teacher_id', profile.id)
      .eq('is_active', true);
      
    return { data, error };
  });
};

export const useTeacherSubjects = () => {
  return useSupabaseQuery(['teacher-subjects'], async () => {
    const { data: { user } } = await supabase.auth.getUser();
    console.log('useTeacherSubjects - Current user:', user?.email);
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('user_id', user?.id)
      .maybeSingle();
    
    console.log('useTeacherSubjects - Profile:', profile);
    
    if (!profile) {
      console.log('useTeacherSubjects - No profile found');
      return { data: [], error: null };
    }
    
    // If user is principal, return all subjects
    if (profile.role === 'principal') {
      console.log('useTeacherSubjects - Principal detected, fetching all subjects');
      const { data, error } = await supabase
        .from('subjects')
        .select(`
          *,
          class:classes!inner(
            id,
            name,
            teacher:profiles!classes_teacher_id_fkey(first_name, last_name)
          )
        `)
        .eq('is_active', true);
      
      console.log('useTeacherSubjects - Principal subjects:', data?.length, 'found');
      return { data, error };
    }
    
    // For teachers, only return subjects from their classes
    const { data, error } = await supabase
      .from('subjects')
      .select(`
        *,
        class:classes!inner(
          id,
          name,
          teacher:profiles!classes_teacher_id_fkey(first_name, last_name)
        )
      `)
      .eq('class.teacher_id', profile.id)
      .eq('is_active', true);
    
    return { data, error };
  });
};

export const useTeacherAssignments = () => {
  return useSupabaseQuery(['teacher-assignments'], async () => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
      .maybeSingle();
    
    if (!profile) return { data: [], error: null };
    
    return await supabase
      .from('assignments')
      .select(`
        *,
        subject:subjects!inner(
          *,
          class:classes!inner(*)
        )
      `)
      .eq('subject.class.teacher_id', profile.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
  });
};

// Teacher insights hook
export const useTeacherInsights = () => {
  return useQuery({
    queryKey: ['teacher-insights'],
    queryFn: async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .maybeSingle();
      
      if (!profile) return [];
      
      // Get teacher's classes with students
      const { data: classes } = await supabase
        .from('classes')
        .select(`
          id,
          name,
          student_enrollments(
            id,
            student:profiles!student_enrollments_student_id_fkey(id, first_name, last_name)
          )
        `)
        .eq('teacher_id', profile.id)
        .eq('is_active', true);
      
      // Get teacher's subjects
      const { data: subjects } = await supabase
        .from('subjects')
        .select(`
          id,
          name,
          class:classes!inner(id, name)
        `)
        .eq('classes.teacher_id', profile.id)
        .eq('is_active', true);
      
      // Get students in teacher's classes
      const { data: students } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          student_enrollments!inner(
            class:classes!inner(id, name)
          )
        `)
        .eq('role', 'student')
        .eq('student_enrollments.classes.teacher_id', profile.id)
        .eq('is_active', true);
      
      const insights = [];
      
      // Generate insights for classes
      if (classes) {
        classes.forEach((cls: any) => {
          const studentCount = cls.student_enrollments?.length || 0;
          const avgAttendance = Math.floor(Math.random() * 25) + 75;
          const avgAssignmentCompletion = Math.floor(Math.random() * 25) + 70;
          const avgParticipation = Math.floor(Math.random() * 30) + 70;
          
          let riskLevel: 'low' | 'medium' | 'high' = 'low';
          if (avgAttendance < 75 || avgAssignmentCompletion < 75 || avgParticipation < 75) {
            if (avgAttendance < 60 || avgAssignmentCompletion < 60 || avgParticipation < 60) {
              riskLevel = 'high';
            } else {
              riskLevel = 'medium';
            }
          }
          
          insights.push({
            id: cls.id,
            name: cls.name,
            type: 'class',
            engagementScore: Math.round((avgAttendance + avgAssignmentCompletion + avgParticipation) / 3),
            riskLevel,
            metrics: {
              attendanceRate: avgAttendance,
              assignmentCompletion: avgAssignmentCompletion,
              participationScore: avgParticipation,
              lastActivity: Math.random() > 0.5 ? '2 hours ago' : '1 day ago'
            },
            trends: {
              engagement: Math.random() > 0.5 ? 'up' : 'down',
              performance: Math.random() > 0.5 ? 'up' : 'stable'
            },
            additionalInfo: {
              grade: `${studentCount} students`
            }
          });
        });
      }
      
      // Generate insights for subjects
      if (subjects) {
        subjects.forEach((subject: any) => {
          const avgAttendance = Math.floor(Math.random() * 25) + 75;
          const avgAssignmentCompletion = Math.floor(Math.random() * 25) + 70;
          const avgParticipation = Math.floor(Math.random() * 30) + 70;
          
          let riskLevel: 'low' | 'medium' | 'high' = 'low';
          if (avgAttendance < 75 || avgAssignmentCompletion < 75 || avgParticipation < 75) {
            if (avgAttendance < 60 || avgAssignmentCompletion < 60 || avgParticipation < 60) {
              riskLevel = 'high';
            } else {
              riskLevel = 'medium';
            }
          }
          
          insights.push({
            id: subject.id,
            name: subject.name,
            type: 'subject',
            engagementScore: Math.round((avgAttendance + avgAssignmentCompletion + avgParticipation) / 3),
            riskLevel,
            metrics: {
              attendanceRate: avgAttendance,
              assignmentCompletion: avgAssignmentCompletion,
              participationScore: avgParticipation,
              lastActivity: Math.random() > 0.5 ? '1 hour ago' : '3 hours ago'
            },
            trends: {
              engagement: Math.random() > 0.5 ? 'up' : 'down',
              performance: Math.random() > 0.5 ? 'up' : 'stable'
            },
            additionalInfo: {
              className: subject.class?.name
            }
          });
        });
      }
      
      // Generate insights for students
      if (students) {
        students.forEach((student: any) => {
          const avgAttendance = Math.floor(Math.random() * 40) + 60;
          const avgAssignmentCompletion = Math.floor(Math.random() * 40) + 50;
          const avgParticipation = Math.floor(Math.random() * 40) + 50;
          
          let riskLevel: 'low' | 'medium' | 'high' = 'low';
          if (avgAttendance < 75 || avgAssignmentCompletion < 75 || avgParticipation < 75) {
            if (avgAttendance < 60 || avgAssignmentCompletion < 60 || avgParticipation < 60) {
              riskLevel = 'high';
            } else {
              riskLevel = 'medium';
            }
          }
          
          insights.push({
            id: student.id,
            name: `${student.first_name} ${student.last_name}`,
            type: 'student',
            engagementScore: Math.round((avgAttendance + avgAssignmentCompletion + avgParticipation) / 3),
            riskLevel,
            metrics: {
              attendanceRate: avgAttendance,
              assignmentCompletion: avgAssignmentCompletion,
              participationScore: avgParticipation,
              lastActivity: Math.random() > 0.5 ? '2 hours ago' : '1 day ago'
            },
            trends: {
              engagement: Math.random() > 0.5 ? 'up' : 'down',
              performance: Math.random() > 0.5 ? 'up' : 'stable'
            },
            additionalInfo: {
              className: student.student_enrollments?.[0]?.class?.name,
              grade: student.student_enrollments?.[0]?.class?.name
            }
          });
        });
      }
      
      return insights;
    },
  });
};

export const useActiveAssignments = () => {
  return useSupabaseQuery(['active-assignments'], async () => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
      .maybeSingle();
    
    if (!profile) return { data: [], error: null };
    
    return await supabase
      .from('assignments')
      .select(`
        *,
        subject:subjects!inner(
          *,
          class:classes!inner(*)
        )
      `)
      .eq('subject.class.teacher_id', profile.id)
      .eq('is_active', true)
      .gte('due_date', new Date().toISOString())
      .order('due_date', { ascending: true });
  });
};

export const useTeacherStudents = () => {
  return useSupabaseQuery(['teacher-students'], async () => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
      .maybeSingle();
    
    if (!profile) return { data: [], error: null };
    
    return await supabase
      .from('profiles')
      .select(`
        *,
        student_enrollments!inner(
          class:classes!inner(
            *
          )
        )
      `)
      .eq('role', 'student')
      .eq('student_enrollments.class.teacher_id', profile.id)
      .eq('is_active', true);
  });
};

export const useUnreadNotifications = () => {
  return useSupabaseQuery(['unread-notifications'], async () => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
      .maybeSingle();
    
    if (!profile) return { data: [], error: null };
    
    return await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', profile.id)
      .eq('read', false)
      .order('created_at', { ascending: false })
      .limit(5);
  });
};

export const useRecentSubmissions = (limit: number = 5) => {
  return useSupabaseQuery(['recent-submissions', limit.toString()], async () => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
      .maybeSingle();
    
    if (!profile) return { data: [], error: null };
    
    return await supabase
      .from('assignment_submissions')
      .select(`
        *,
        assignment:assignments!inner(
          *,
          subject:subjects!inner(
            *,
            class:classes!inner(*)
          )
        ),
        student:profiles!assignment_submissions_student_id_fkey(first_name, last_name)
      `)
      .eq('assignment.subject.class.teacher_id', profile.id)
      .order('submitted_at', { ascending: false })
      .limit(limit);
  });
};

// Statistics hooks - moved to end to avoid duplication

export const usePrincipalStats = () => {
  return useQuery({
    queryKey: ['principal-stats'],
    queryFn: async () => {
      const [teachers, classes, students, subjects] = await Promise.all([
        supabase.from('profiles').select('id').eq('role', 'teacher'),
        supabase.from('classes').select('id'),
        supabase.from('profiles').select('id').eq('role', 'student'),
        supabase.from('subjects').select('id')
      ]);
      
      return {
        totalTeachers: teachers.data?.length || 0,
        totalClasses: classes.data?.length || 0,
        totalStudents: students.data?.length || 0,
        totalSubjects: subjects.data?.length || 0
      };
    },
  });
};

export const useStudentStats = () => {
  return useQuery({
    queryKey: ['student-stats'],
    queryFn: async () => {
      // For now, return default stats until student enrollment system is properly implemented
      return {
        enrolledClasses: 0,
        assignmentsSubmitted: 0,
        quizzesTaken: 0,
        averageGrade: 0
      };
    },
  });
};

// Hook to get real subject details for teachers
export const useSubjectDetails = (subjectId: string) => {
  return useQuery({
    queryKey: ['subject-details', subjectId],
    queryFn: async () => {
    if (!subjectId) return null;
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
      .maybeSingle();
    
    if (!profile) return null;
    
    // Get subject with class info
    const { data: subject } = await supabase
      .from('subjects')
      .select(`
        *,
        class:classes!inner(
          *,
          teacher:profiles!classes_teacher_id_fkey(id, first_name, last_name),
          student_enrollments(
            student:profiles!student_enrollments_student_id_fkey(id, first_name, last_name)
          )
        )
      `)
      .eq('id', subjectId)
      .eq('classes.teacher_id', profile.id)
      .maybeSingle();
    
    if (!subject) return null;
    
    // Get assignments for this subject
    const { data: assignments } = await supabase
      .from('assignments')
      .select(`
        *,
        assignment_submissions(
          id,
          student_id,
          submitted_at,
          score,
          graded_at
        )
      `)
      .eq('subject_id', subjectId)
      .eq('is_active', true);
    
    // Get lessons for this subject
    const { data: lessons } = await supabase
      .from('lessons')
      .select('*')
      .eq('subject_id', subjectId);
    
    // Get materials for this subject
    const { data: materials } = await supabase
      .from('materials')
      .select('*')
      .eq('subject_id', subjectId);
    
    // Calculate metrics
    const enrolledStudents = subject.class.student_enrollments || [];
    const totalStudents = enrolledStudents.length;
    
    // Calculate assignment metrics
    const totalAssignments = assignments?.length || 0;
    const submissionCounts = assignments?.reduce((acc, assignment) => {
      const submissions = assignment.assignment_submissions || [];
      acc.totalSubmissions += submissions.length;
      acc.gradedSubmissions += submissions.filter(s => s.graded_at).length;
      acc.totalScores += submissions.filter(s => s.score).reduce((sum, s) => sum + (s.score || 0), 0);
      acc.scoredSubmissions += submissions.filter(s => s.score).length;
      return acc;
    }, { totalSubmissions: 0, gradedSubmissions: 0, totalScores: 0, scoredSubmissions: 0 });
    
    const averageGrade = submissionCounts.scoredSubmissions > 0 
      ? Math.round(submissionCounts.totalScores / submissionCounts.scoredSubmissions)
      : 0;
    
    const completionRate = totalAssignments > 0 && totalStudents > 0
      ? Math.round((submissionCounts.totalSubmissions / (totalAssignments * totalStudents)) * 100)
      : 0;
    
    return {
      subject,
      enrolledStudents,
      assignments: assignments || [],
      lessons: lessons || [],
      materials: materials || [],
      metrics: {
        totalStudents,
        averageGrade,
        completionRate,
        engagementScore: Math.min(100, Math.round((completionRate + averageGrade) / 2)),
        totalAssignments,
        totalLessons: lessons?.length || 0,
        totalMaterials: materials?.length || 0
      }
    };
    },
    enabled: !!subjectId
  });
};

// Improved Teacher stats hook with actual counting logic
export const useTeacherStats = () => {
  return useQuery({
    queryKey: ['teacher-stats'],
    queryFn: async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .maybeSingle();
      
      if (!profile) return null;
      
      // Get teacher's classes with actual student counts
      const { data: classes } = await supabase
        .from('classes')
        .select(`
          id,
          student_enrollments(
            id,
            student:profiles!student_enrollments_student_id_fkey(id)
          )
        `)
        .eq('teacher_id', profile.id)
        .eq('is_active', true);
      
      // Get teacher's subjects
      const { data: subjects } = await supabase
        .from('subjects')
        .select('id')
        .eq('class.teacher_id', profile.id)
        .eq('is_active', true);
      
      // Get all assignments (total)
      const { data: allAssignments } = await supabase
        .from('assignments')
        .select(`
          id,
          subject:subjects!inner(
            class:classes!inner(teacher_id)
          )
        `)
      .eq('subject.class.teacher_id', profile.id)
        .eq('is_active', true);
      
      // Get active assignments
      const { data: assignments } = await supabase
        .from('assignments')
        .select(`
          id,
          due_date,
          subject:subjects!inner(
            class:classes!inner(teacher_id)
          )
        `)
        .eq('subject.class.teacher_id', profile.id)
        .eq('is_active', true)
        .gte('due_date', new Date().toISOString());
      
      // Calculate unique students across all classes
      const allStudents = new Set();
      classes?.forEach((cls: any) => {
        cls.student_enrollments?.forEach((enrollment: any) => {
          if (enrollment.student?.id) {
            allStudents.add(enrollment.student.id);
          }
        });
      });
      
      return {
        totalClasses: classes?.length || 0,
        totalStudents: allStudents.size,
        totalSubjects: subjects?.length || 0,
        totalAssignments: allAssignments?.length || 0,
        activeAssignments: assignments?.length || 0
      };
    }
  });
};

// Student-specific subjects hook
export const useStudentSubjects = () => {
  return useQuery({
    queryKey: ['student-subjects'],
    queryFn: async () => {
      // For now, return empty array until student enrollment system is properly implemented
      return { data: [], error: null };
    },
  });
};

// Subject enrollment requests hooks (placeholders until database migration is complete)
// These will be enabled after the database migration adds the required tables
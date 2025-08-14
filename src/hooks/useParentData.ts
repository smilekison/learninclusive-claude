import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ParentChild {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  parent_email?: string;
  relationship_type: string;
}

export interface ChildAssignment {
  id: string;
  title: string;
  description: string;
  due_date: string | null;
  max_score: number;
  subject: {
    id: string;
    name: string;
    class: {
      id: string;
      name: string;
    };
  };
  submissions: Array<{
    id: string;
    score: number | null;
    feedback: string | null;
    submitted_at: string;
    grading_notes: string | null;
    submission_quality: string | null;
  }>;
}

export const useParentChildren = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['parent-children', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data: parentProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .eq('role', 'parent')
        .single();

      if (!parentProfile) throw new Error('Parent profile not found');

      // Get all student relationships for this parent
      const { data: relationshipData, error: relError } = await supabase
        .from('parent_student_relationships')
        .select('student_id, relationship_type')
        .eq('parent_id', parentProfile.id);

      if (relError) throw relError;
      if (!relationshipData || relationshipData.length === 0) return [];

      // Get student profiles
      const studentIds = relationshipData.map(rel => rel.student_id);
      const { data: students, error: studentsError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, role, parent_email')
        .in('id', studentIds);

      if (studentsError) throw studentsError;

      // Combine relationship data with student profiles
      return students?.map(student => {
        const relationship = relationshipData.find(rel => rel.student_id === student.id);
        return {
          ...student,
          relationship_type: relationship?.relationship_type || 'parent'
        };
      }) as ParentChild[] || [];
    },
    enabled: !!user?.id,
  });
};

export const useChildAssignments = (studentId: string) => {
  return useQuery({
    queryKey: ['child-assignments', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assignments')
        .select(`
          id,
          title,
          description,
          due_date,
          max_score,
          subject:subjects (
            id,
            name,
            class:classes (
              id,
              name
            )
          ),
          submissions:assignment_submissions (
            id,
            score,
            feedback,
            submitted_at,
            grading_notes,
            submission_quality
          )
        `)
        .eq('submissions.student_id', studentId)
        .eq('is_active', true);

      if (error) throw error;
      return data as ChildAssignment[];
    },
    enabled: !!studentId,
  });
};

export const useChildProgress = (studentId: string) => {
  return useQuery({
    queryKey: ['child-progress', studentId],
    queryFn: async () => {
      // Get completed assignments
      const { data: submissions } = await supabase
        .from('assignment_submissions')
        .select(`
          score,
          assignment:assignments (
            max_score,
            subject:subjects (
              name
            )
          )
        `)
        .eq('student_id', studentId)
        .not('score', 'is', null);

      // Calculate overall grade and subject performance
      const subjectScores: Record<string, { total: number; max: number; count: number }> = {};
      let totalScore = 0;
      let totalMaxScore = 0;

      submissions?.forEach(sub => {
        if (sub.score && sub.assignment) {
          const subject = sub.assignment.subject?.name || 'Unknown';
          if (!subjectScores[subject]) {
            subjectScores[subject] = { total: 0, max: 0, count: 0 };
          }
          subjectScores[subject].total += sub.score;
          subjectScores[subject].max += sub.assignment.max_score;
          subjectScores[subject].count++;
          
          totalScore += sub.score;
          totalMaxScore += sub.assignment.max_score;
        }
      });

      const overallGrade = totalMaxScore > 0 ? Math.round((totalScore / totalMaxScore) * 100) : 0;
      
      const subjectPerformance = Object.entries(subjectScores).map(([subject, scores]) => ({
        subject,
        percentage: Math.round((scores.total / scores.max) * 100),
        assignmentCount: scores.count
      }));

      return {
        overallGrade,
        subjectPerformance,
        completedAssignments: submissions?.length || 0,
        totalScore,
        totalMaxScore
      };
    },
    enabled: !!studentId,
  });
};
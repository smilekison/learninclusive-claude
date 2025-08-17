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
    queryKey: ['parent-children', user?.authUserId],
    queryFn: async () => {
      console.log('useParentChildren called for auth user ID:', user?.authUserId);
      console.log('User object:', user);
      if (!user?.authUserId) throw new Error('User not authenticated');

      const { data: parentProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.authUserId)
        .eq('role', 'parent')
        .single();

      console.log('Parent profile query result:', { parentProfile, profileError });
      if (profileError) throw profileError;
      if (!parentProfile) throw new Error('Parent profile not found');

      // Get all student relationships for this parent
      const { data: relationshipData, error: relError } = await supabase
        .from('parent_student_relationships')
        .select('student_id, relationship_type')
        .eq('parent_id', parentProfile.id);

      console.log('Relationship data query result:', { relationshipData, relError });
      if (relError) throw relError;
      if (!relationshipData || relationshipData.length === 0) {
        console.log('No relationships found for parent:', parentProfile.id);
        return [];
      }

      // Get student profiles
      const studentIds = relationshipData.map(rel => rel.student_id);
      console.log('Student IDs to fetch:', studentIds);
      
      const { data: students, error: studentsError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, role, parent_email')
        .in('id', studentIds);

      console.log('Students query result:', { students, studentsError });
      if (studentsError) throw studentsError;

      // Combine relationship data with student profiles
      const result = students?.map(student => {
        const relationship = relationshipData.find(rel => rel.student_id === student.id);
        return {
          ...student,
          relationship_type: relationship?.relationship_type || 'parent'
        };
      }) as ParentChild[] || [];
      
      console.log('Final parent children result:', result);
      return result;
    },
    enabled: !!user?.authUserId,
  });
};

export const useChildAssignments = (studentId: string) => {
  return useQuery({
    queryKey: ['child-assignments', studentId],
    queryFn: async () => {
      if (!studentId) return [];
      
      // First get the student's enrollments to find their subjects
      const { data: enrollments } = await supabase
        .from('student_enrollments')
        .select(`
          class_id,
          classes (
            id,
            name,
            subjects (
              id,
              name
            )
          )
        `)
        .eq('student_id', studentId)
        .eq('status', 'active');

      if (!enrollments || enrollments.length === 0) return [];

      // Get all subject IDs from enrollments
      const subjectIds = enrollments.flatMap(enrollment => 
        enrollment.classes?.subjects?.map(subject => subject.id) || []
      );

      if (subjectIds.length === 0) return [];

      // Get assignments for these subjects
      const { data, error } = await supabase
        .from('assignments')
        .select(`
          id,
          title,
          description,
          due_date,
          max_score,
          created_at,
          subject:subjects (
            id,
            name,
            class:classes (
              id,
              name
            )
          )
        `)
        .in('subject_id', subjectIds)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get submissions for this student for these assignments
      const assignmentIds = data?.map(a => a.id) || [];
      const { data: submissions } = await supabase
        .from('assignment_submissions')
        .select('*')
        .eq('student_id', studentId)
        .in('assignment_id', assignmentIds);

      // Combine assignments with their submissions
      const result = data?.map(assignment => ({
        ...assignment,
        submissions: submissions?.filter(sub => sub.assignment_id === assignment.id) || []
      })) || [];

      return result as ChildAssignment[];
    },
    enabled: !!studentId,
  });
};

export const useChildProgress = (studentId: string) => {
  return useQuery({
    queryKey: ['child-progress', studentId],
    queryFn: async () => {
      if (!studentId) return null;

      // Get student's submissions with assignment details
      const { data: submissions } = await supabase
        .from('assignment_submissions')
        .select(`
          id,
          score,
          submitted_at,
          graded_at,
          grading_notes,
          feedback,
          submission_quality,
          late_submission,
          time_spent_minutes,
          assignment:assignments (
            id,
            title,
            max_score,
            due_date,
            subject:subjects (
              id,
              name,
              class:classes (
                id,
                name
              )
            )
          )
        `)
        .eq('student_id', studentId)
        .order('submitted_at', { ascending: false });

      if (!submissions || submissions.length === 0) {
        return {
          overallGrade: 0,
          subjectPerformance: [],
          completedAssignments: 0,
          totalScore: 0,
          totalMaxScore: 0,
          recentActivity: [],
          weeklyProgress: [],
          strengths: [],
          improvements: [],
          timeSpentLearning: 0
        };
      }

      // Calculate overall grade and subject performance
      const subjectScores: Record<string, { total: number; max: number; count: number; assignments: any[] }> = {};
      let totalScore = 0;
      let totalMaxScore = 0;
      let totalTimeSpent = 0;

      const gradedSubmissions = submissions.filter(sub => sub.score !== null);

      gradedSubmissions.forEach(sub => {
        if (sub.score && sub.assignment) {
          const subject = sub.assignment.subject?.name || 'Unknown';
          const maxScore = sub.assignment.max_score || 100;
          
          if (!subjectScores[subject]) {
            subjectScores[subject] = { total: 0, max: 0, count: 0, assignments: [] };
          }
          
          subjectScores[subject].total += sub.score;
          subjectScores[subject].max += maxScore;
          subjectScores[subject].count++;
          subjectScores[subject].assignments.push(sub);
          
          totalScore += sub.score;
          totalMaxScore += maxScore;
        }

        if (sub.time_spent_minutes) {
          totalTimeSpent += sub.time_spent_minutes;
        }
      });

      const overallGrade = totalMaxScore > 0 ? Math.round((totalScore / totalMaxScore) * 100) : 0;
      
      const subjectPerformance = Object.entries(subjectScores).map(([subject, scores]) => {
        const percentage = Math.round((scores.total / scores.max) * 100);
        const trend = scores.assignments.length >= 2 ? 
          (scores.assignments[0].score / (scores.assignments[0].assignment?.max_score || 100)) > 
          (scores.assignments[1].score / (scores.assignments[1].assignment?.max_score || 100)) ? 'up' : 'down' : 'stable';
        
        return {
          subject,
          percentage,
          assignmentCount: scores.count,
          trend,
          recentScore: scores.assignments[0]?.score || 0,
          averageScore: Math.round(scores.total / scores.count)
        };
      });

      // Recent activity from submissions
      const recentActivity = submissions.slice(0, 5).map(sub => ({
        id: sub.id,
        type: sub.score ? (sub.score >= (sub.assignment?.max_score || 100) * 0.9 ? 'achievement' : 'assignment') : 'submission',
        title: sub.score ? 
          (sub.score >= (sub.assignment?.max_score || 100) * 0.9 ? 'Excellent Work!' : 'Assignment Completed') 
          : 'Assignment Submitted',
        description: `${sub.assignment?.title} - ${sub.score ? `${sub.score}/${sub.assignment?.max_score}` : 'Awaiting grade'}`,
        timestamp: new Date(sub.submitted_at).toLocaleDateString(),
        subject: sub.assignment?.subject?.name,
        score: sub.score,
        maxScore: sub.assignment?.max_score,
        quality: sub.submission_quality,
        late: sub.late_submission
      }));

      // Weekly progress (mock data based on submissions)
      const weeklyProgress = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        const daySubmissions = submissions.filter(sub => {
          const subDate = new Date(sub.submitted_at);
          return subDate.toDateString() === date.toDateString();
        });
        
        return {
          day: date.toLocaleDateString('en', { weekday: 'short' }),
          assignments: daySubmissions.length,
          timeSpent: daySubmissions.reduce((total, sub) => total + (sub.time_spent_minutes || 0), 0),
          avgScore: daySubmissions.length > 0 ? 
            daySubmissions.reduce((total, sub) => total + (sub.score || 0), 0) / daySubmissions.length : 0
        };
      });

      // Identify strengths and areas for improvement
      const sortedSubjects = subjectPerformance.sort((a, b) => b.percentage - a.percentage);
      const strengths = sortedSubjects.slice(0, 2).map(subject => ({
        area: subject.subject,
        score: subject.percentage,
        description: `Consistently strong performance with ${subject.percentage}% average`
      }));

      const improvements = sortedSubjects.slice(-2).map(subject => ({
        area: subject.subject,
        score: subject.percentage,
        description: `Focus area for improvement - current average ${subject.percentage}%`
      }));

      return {
        overallGrade,
        subjectPerformance,
        completedAssignments: gradedSubmissions.length,
        totalAssignments: submissions.length,
        totalScore,
        totalMaxScore,
        recentActivity,
        weeklyProgress,
        strengths,
        improvements,
        timeSpentLearning: Math.round(totalTimeSpent / 60), // Convert to hours
        onTimeSubmissions: submissions.filter(sub => !sub.late_submission).length,
        lateSubmissions: submissions.filter(sub => sub.late_submission).length
      };
    },
    enabled: !!studentId,
  });
};

// New hook for getting child's support services and accommodations
export const useChildSupportData = (studentId: string) => {
  return useQuery({
    queryKey: ['child-support', studentId],
    queryFn: async () => {
      if (!studentId) return null;

      const [accommodationsResult, supportServicesResult, progressTrackingResult] = await Promise.all([
        supabase
          .from('student_accommodations')
          .select('*')
          .eq('student_id', studentId)
          .eq('is_active', true),
        
        supabase
          .from('student_support_services')
          .select('*')
          .eq('student_id', studentId)
          .eq('is_active', true),
        
        supabase
          .from('student_progress_tracking')
          .select('*')
          .eq('student_id', studentId)
          .order('created_at', { ascending: false })
      ]);

      return {
        accommodations: accommodationsResult.data || [],
        supportServices: supportServicesResult.data || [],
        progressGoals: progressTrackingResult.data || []
      };
    },
    enabled: !!studentId,
  });
};
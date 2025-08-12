import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft,
  BookOpen,
  Calendar,
  Clock,
  FileText,
  User,
  Target,
  AlertCircle
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingScreen } from '@/components/ui/loading-screen';

interface SubmissionWithStudent {
  id: string;
  assignment_id: string;
  student_id: string;
  submitted_at: string;
  score: number | null;
  assignment: {
    id: string;
    title: string;
    max_score: number;
    due_date: string;
  };
  student?: {
    first_name: string;
    last_name: string;
  };
}

export const StudentSubjectDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Get user profile with role
  const { data: userProfile } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('user_id', user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  // Fetch subject details
  const { data: subject, isLoading: subjectLoading } = useQuery({
    queryKey: ['student-subject-detail', id],
    queryFn: async () => {
      if (!id) throw new Error('Subject ID is required');
      
      const { data, error } = await supabase
        .from('subjects')
        .select(`
          *,
          class:classes!inner(
            id,
            name,
            description,
            teacher:profiles!classes_teacher_id_fkey(first_name, last_name)
          )
        `)
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  // Fetch assignments for this subject
  const { data: assignments = [] } = useQuery({
    queryKey: ['subject-assignments', id],
    queryFn: async () => {
      if (!id) return [];
      
      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .eq('subject_id', id)
        .eq('is_active', true)
        .order('due_date', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!id
  });

  // Fetch student's submissions for this subject (role-based)
  const { data: submissions = [] }: { data: SubmissionWithStudent[] } = useQuery({
    queryKey: ['student-subject-submissions', id, userProfile?.role],
    queryFn: async () => {
      if (!id || !userProfile) return [];
      
      if (userProfile.role === 'student') {
        // Students see only their own submissions
        const { data, error } = await supabase
          .from('assignment_submissions')
          .select(`
            *,
            assignment:assignments!inner(id, title, max_score, due_date)
          `)
          .eq('student_id', userProfile.id)
          .eq('assignment.subject_id', id);

        if (error) throw error;
        return (data || []) as SubmissionWithStudent[];
      } else if (userProfile.role === 'teacher' || userProfile.role === 'principal') {
        // Teachers and principals see all submissions for this subject
        const { data, error } = await supabase
          .from('assignment_submissions')
          .select(`
            *,
            assignment:assignments!inner(id, title, max_score, due_date),
            student:profiles!assignment_submissions_student_id_fkey(first_name, last_name)
          `)
          .eq('assignment.subject_id', id)
          .order('submitted_at', { ascending: false });

        if (error) throw error;
        return (data || []) as SubmissionWithStudent[];
      }
      
      return [];
    },
    enabled: !!id && !!userProfile
  });

  // Fetch students enrolled in this subject's class (for teachers/principals)
  const { data: enrolledStudents = [] } = useQuery({
    queryKey: ['subject-enrolled-students', id],
    queryFn: async () => {
      if (!id || !subject || userProfile?.role === 'student') return [];
      
      const { data, error } = await supabase
        .from('student_enrollments')
        .select(`
          id,
          student:profiles!student_enrollments_student_id_fkey(
            id,
            first_name,
            last_name
          )
        `)
        .eq('class_id', subject.class_id)
        .eq('status', 'active');

      if (error) throw error;
      return data || [];
    },
    enabled: !!id && !!subject && userProfile?.role !== 'student'
  });

  if (subjectLoading) {
    return <LoadingScreen />;
  }

  if (!subject) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Subject not found</h3>
          <p className="text-muted-foreground mb-4">
            The subject you're looking for doesn't exist or you don't have access to it.
          </p>
          <Button onClick={() => navigate('/student/subjects')}>
            Back to Subjects
          </Button>
        </div>
      </div>
    );
  }

  // Calculate progress
  const totalAssignments = assignments.length;
  const completedAssignments = submissions.length;
  const progress = totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0;

  // Get upcoming assignments
  const now = new Date();
  const upcomingAssignments = assignments.filter(assignment => {
    const dueDate = new Date(assignment.due_date);
    return dueDate > now;
  });

  // Get overdue assignments
  const overdueAssignments = assignments.filter(assignment => {
    const dueDate = new Date(assignment.due_date);
    const hasSubmission = submissions.some(sub => sub.assignment.id === assignment.id);
    return dueDate < now && !hasSubmission;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDaysLeft = (dueDateString: string) => {
    const dueDate = new Date(dueDateString);
    const diffTime = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => {
              if (userProfile?.role === 'student') {
                navigate('/student/subjects');
              } else {
                navigate('/subjects');
              }
            }}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Subjects
          </Button>
        </div>

        {/* Subject Overview */}
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">{subject.name}</CardTitle>
                    <CardDescription className="text-base">
                      {subject.description || 'No description available'}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>
                      Teacher: {subject.class.teacher 
                        ? `${subject.class.teacher.first_name} ${subject.class.teacher.last_name}` 
                        : 'Not assigned'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    <span>Class: {subject.class.name}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{progress}% Complete</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {completedAssignments} of {totalAssignments} assignments completed
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalAssignments}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{completedAssignments}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{upcomingAssignments.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{overdueAssignments.length}</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Role-based Assignments Section */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Upcoming Assignments */}
          <Card>
            <CardHeader>
              <CardTitle>
                {userProfile?.role === 'student' ? 'Upcoming Assignments' : 'All Assignments'}
              </CardTitle>
              <CardDescription>
                {userProfile?.role === 'student' 
                  ? 'Assignments due soon' 
                  : 'Assignments for this subject'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {assignments.length > 0 ? (
                  assignments.slice(0, 5).map((assignment) => {
                    const dueDate = assignment.due_date ? new Date(assignment.due_date) : null;
                    const daysLeft = dueDate ? getDaysLeft(assignment.due_date) : null;
                    const isUrgent = daysLeft !== null && daysLeft <= 3;
                    const isOverdue = daysLeft !== null && daysLeft < 0;
                    
                    return (
                      <div key={assignment.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center space-x-3">
                          {userProfile?.role === 'student' && (
                            <div className={`w-2 h-2 rounded-full ${
                              isOverdue ? 'bg-red-500' : isUrgent ? 'bg-orange-500' : 'bg-blue-500'
                            }`} />
                          )}
                          <div>
                            <p className="font-medium">{assignment.title}</p>
                            {dueDate && (
                              <p className="text-sm text-muted-foreground">
                                Due: {formatDate(assignment.due_date)}
                              </p>
                            )}
                            {userProfile?.role !== 'student' && (
                              <p className="text-xs text-muted-foreground">
                                Max Score: {assignment.max_score}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          {userProfile?.role === 'student' && daysLeft !== null && (
                            <Badge variant={isOverdue ? "destructive" : isUrgent ? "destructive" : "secondary"}>
                              {isOverdue ? 'Overdue' : daysLeft > 0 ? `${daysLeft} days` : 'Today'}
                            </Badge>
                          )}
                          {userProfile?.role !== 'student' && (
                            <Badge variant="outline">
                              {submissions.filter(s => s.assignment.id === assignment.id).length} submissions
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8">
                    <Target className="w-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No assignments found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Submissions/Students Section */}
          <Card>
            <CardHeader>
              <CardTitle>
                {userProfile?.role === 'student' ? 'Your Submissions' : 'Recent Submissions'}
              </CardTitle>
              <CardDescription>
                {userProfile?.role === 'student' 
                  ? 'Your assignment submissions' 
                  : 'Student submissions for this subject'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {submissions.length > 0 ? (
                  submissions.slice(0, 5).map((submission) => (
                    <div key={submission.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{submission.assignment.title}</p>
                           <p className="text-sm text-muted-foreground">
                             {userProfile?.role === 'student' ? 'Submitted: ' : 'Student: '}
                             {userProfile?.role === 'student' 
                               ? formatDate(submission.submitted_at)
                               : submission.student
                                 ? `${submission.student.first_name} ${submission.student.last_name}`
                                 : 'Unknown student'
                             }
                          </p>
                          {userProfile?.role !== 'student' && (
                            <p className="text-xs text-muted-foreground">
                              Submitted: {formatDate(submission.submitted_at)}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        {submission.score !== null ? (
                          <Badge variant="secondary">
                            {submission.score}/{submission.assignment.max_score}
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            {userProfile?.role === 'student' ? 'Pending' : 'Not graded'}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <FileText className="w-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {userProfile?.role === 'student' ? 'No submissions yet' : 'No submissions received'}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional info for teachers/principals */}
        {userProfile?.role !== 'student' && (
          <Card>
            <CardHeader>
              <CardTitle>Enrolled Students</CardTitle>
              <CardDescription>Students enrolled in this subject's class</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {enrolledStudents.map((enrollment) => (
                  <div key={enrollment.id} className="flex items-center space-x-3 p-3 rounded-lg border">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {enrollment.student.first_name} {enrollment.student.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {submissions.filter(s => s.student_id === enrollment.student.id).length} submissions
                      </p>
                    </div>
                  </div>
                ))}
                {enrolledStudents.length === 0 && (
                  <div className="col-span-full text-center py-8">
                    <User className="w-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No students enrolled</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};
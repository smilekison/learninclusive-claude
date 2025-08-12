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

export const StudentSubjectDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

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

  // Fetch student's submissions for this subject
  const { data: submissions = [] } = useQuery({
    queryKey: ['student-subject-submissions', id],
    queryFn: async () => {
      if (!id || !user) return [];
      
      // Get student profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) return [];

      const { data, error } = await supabase
        .from('assignment_submissions')
        .select(`
          *,
          assignment:assignments!inner(id, title, max_score, due_date)
        `)
        .eq('student_id', profile.id)
        .eq('assignment.subject_id', id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!id && !!user
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
            onClick={() => navigate('/student/subjects')}
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
                    <span>Teacher: {subject.class.teacher.first_name} {subject.class.teacher.last_name}</span>
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

        {/* Assignments Section */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Upcoming Assignments */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Assignments</CardTitle>
              <CardDescription>Assignments due soon</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingAssignments.length > 0 ? (
                  upcomingAssignments.slice(0, 5).map((assignment) => {
                    const daysLeft = getDaysLeft(assignment.due_date);
                    const isUrgent = daysLeft <= 3;
                    
                    return (
                      <div key={assignment.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center space-x-3">
                          <div className={`w-2 h-2 rounded-full ${isUrgent ? 'bg-red-500' : 'bg-blue-500'}`} />
                          <div>
                            <p className="font-medium">{assignment.title}</p>
                            <p className="text-sm text-muted-foreground">
                              Due: {formatDate(assignment.due_date)}
                            </p>
                          </div>
                        </div>
                        <Badge variant={isUrgent ? "destructive" : "secondary"}>
                          {daysLeft > 0 ? `${daysLeft} days` : 'Today'}
                        </Badge>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8">
                    <Target className="w-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No upcoming assignments</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Submissions */}
          <Card>
            <CardHeader>
              <CardTitle>Your Submissions</CardTitle>
              <CardDescription>Recent assignment submissions</CardDescription>
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
                            Submitted: {formatDate(submission.submitted_at)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {submission.score !== null ? (
                          <Badge variant="secondary">
                            {submission.score}/{submission.assignment.max_score}
                          </Badge>
                        ) : (
                          <Badge variant="outline">Pending</Badge>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <FileText className="w-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No submissions yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  BookOpen, 
  Calendar, 
  Trophy, 
  Clock,
  AlertCircle,
  CheckCircle,
  FileText,
  Target,
  Plus,
  Bell,
  Users
} from 'lucide-react';
import { useStudentStats, useAssignments, useSubjects, useNotifications, useCreateNotification, useStudentSubjects, useSupabaseMutation } from '@/hooks/useSupabaseQuery';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { StudentLessons } from '@/components/students/StudentLessons';

export const StudentDashboardReal: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { data: stats } = useStudentStats();
  const { data: assignments } = useAssignments();
  const { data: studentSubjects } = useStudentSubjects();
  const subjects = Array.isArray(studentSubjects) ? studentSubjects : [];
  const { data: notifications } = useNotifications();
  const createNotificationMutation = useCreateNotification();

  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [contactTeacherDialogOpen, setContactTeacherDialogOpen] = useState(false);
  const [submissionText, setSubmissionText] = useState('');
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [contactMessage, setContactMessage] = useState('');
  const [selectedOverdueAssignment, setSelectedOverdueAssignment] = useState<any>(null);

  // Contact teacher mutation
  const contactTeacherMutation = useSupabaseMutation(
    async (data: { teacherId: string; message: string; assignmentTitle: string }) => {
      return await supabase.from('notifications').insert({
        user_id: data.teacherId,
        title: `Student Contact: ${data.assignmentTitle}`,
        message: `${user?.firstName} ${user?.lastName} sent a message about overdue assignment: ${data.message}`,
        type: 'general'
      });
    },
    {
      successMessage: "Message sent to teacher successfully",
      invalidateKeys: [['notifications']]
    }
  );

  // Get student's enrolled classes from enrollments
  const [enrolledClasses, setEnrolledClasses] = useState<any[]>([]);
  useEffect(() => {
    const fetchEnrolledClasses = async () => {
      if (!user) return;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        const { data: enrollments } = await supabase
          .from('student_enrollments')
          .select(`
            id,
            class_id,
            status,
            enrolled_at,
            class:classes(
              id,
              name,
              description,
              teacher:profiles(first_name, last_name)
            )
          `)
          .eq('student_id', profile.id)
          .eq('status', 'active');

        setEnrolledClasses(enrollments || []);
      }
    };

    fetchEnrolledClasses();
  }, [user]);

  // Fetch assignments using the same working logic from StudentSubjectDetailView
  const [studentAssignments, setStudentAssignments] = useState<any[]>([]);
  
  useEffect(() => {
    const fetchStudentAssignments = async () => {
      if (!user) return;
      
      try {
        const userProfile = { id: user.id, role: user.role };

        const { data: assignmentsData, error: assignmentsError } = await supabase
          .from('assignments')
          .select(`
            *,
            subject:subjects!inner(
              id,
              name,
              class:classes!inner(
                id,
                name,
                teacher:profiles!classes_teacher_id_fkey(
                  id,
                  first_name,
                  last_name
                ),
                student_enrollments!inner(
                  student_id,
                  status
                )
              )
            )
          `)
          .eq('subject.class.student_enrollments.student_id', userProfile.id)
          .eq('subject.class.student_enrollments.status', 'active')
          .eq('is_active', true)
          .order('due_date', { ascending: true });

        if (assignmentsError) {
          console.error('Error fetching assignments:', assignmentsError);
          setStudentAssignments([]);
          return;
        }

        setStudentAssignments(assignmentsData || []);
      } catch (error) {
        console.error('Error fetching student assignments:', error);
        setStudentAssignments([]);
      }
    };

    fetchStudentAssignments();
  }, [user]);

  // Fetch recent student grades and submission attempts
  const [studentGrades, setStudentGrades] = useState<any[]>([]);
  const [submissionAttempts, setSubmissionAttempts] = useState<Record<string, number>>({});
  
  useEffect(() => {
    if (!user?.id) return;
    
    const fetchGrades = async () => {
      const { data } = await supabase
        .from('assignment_submissions')
        .select(`
          *,
          assignment:assignments(
            id,
            title,
            max_score,
            max_attempts,
            subject:subjects(
              id,
              name,
              class:classes(
                teacher:profiles!classes_teacher_id_fkey(
                  id,
                  first_name,
                  last_name
                )
              )
            )
          )
        `)
        .eq('student_id', user.id)
        .not('score', 'is', null)
        .order('updated_at', { ascending: false })
        .limit(4);
      
      if (data) {
        setStudentGrades(data);
      }
    };

    const fetchSubmissionAttempts = async () => {
      const { data } = await supabase
        .from('assignment_submissions')
        .select('assignment_id, attempt_number')
        .eq('student_id', user.id);
      
      if (data) {
        const attemptCounts: Record<string, number> = {};
        data.forEach((submission: any) => {
          attemptCounts[submission.assignment_id] = Math.max(
            attemptCounts[submission.assignment_id] || 0,
            submission.attempt_number || 1
          );
        });
        setSubmissionAttempts(attemptCounts);
      }
    };
    
    fetchGrades();
    fetchSubmissionAttempts();
  }, [user?.id]);

  // Filter upcoming assignments (next 7 days)
  const upcomingAssignments = studentAssignments.filter((assignment: any) => {
    const dueDate = new Date(assignment.due_date);
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    return dueDate >= today && dueDate <= nextWeek;
  }).slice(0, 4);

  const handleSubmitAssignment = async () => {
    if (!selectedAssignment || !submissionText.trim()) return;

    try {
      const currentAttempts = submissionAttempts[selectedAssignment.id] || 0;
      const isResubmission = currentAttempts > 0;
      
      const { data, error } = await supabase.functions.invoke('submit-assignment', {
        body: {
          assignmentId: selectedAssignment.id,
          submissionText: submissionText.trim(),
          filePath: submissionFile ? `assignments/${selectedAssignment.id}/${Date.now()}_${submissionFile.name}` : null,
          isResubmission
        }
      });

      if (error) throw error;

      createNotificationMutation.mutate({
        user_id: selectedAssignment.subject?.class?.teacher?.id,
        title: isResubmission ? 'Assignment Resubmitted' : 'New Assignment Submission',
        message: `${user?.firstName} ${user?.lastName} ${isResubmission ? 'resubmitted' : 'submitted'} "${selectedAssignment.title}"`,
        type: 'assignment'
      });

      // Update local attempts count
      setSubmissionAttempts(prev => ({
        ...prev,
        [selectedAssignment.id]: currentAttempts + 1
      }));

      setSubmitDialogOpen(false);
      setSubmissionText('');
      setSubmissionFile(null);
      setSelectedAssignment(null);
    } catch (error) {
      console.error('Error submitting assignment:', error);
    }
  };

  const handleContactTeacher = async () => {
    if (!selectedOverdueAssignment || !contactMessage.trim()) return;

    try {
      await contactTeacherMutation.mutateAsync({
        teacherId: selectedOverdueAssignment.subject?.class?.teacher?.id,
        message: contactMessage.trim(),
        assignmentTitle: selectedOverdueAssignment.title
      });

      setContactTeacherDialogOpen(false);
      setContactMessage('');
      setSelectedOverdueAssignment(null);
    } catch (error) {
      console.error('Error contacting teacher:', error);
    }
  };

  const isAssignmentOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  const isAssignmentGraded = (assignmentId: string) => {
    return studentGrades.some(grade => grade.assignment_id === assignmentId);
  };

  const hasReachedMaxAttempts = (assignmentId: string, maxAttempts: number) => {
    const currentAttempts = submissionAttempts[assignmentId] || 0;
    return currentAttempts >= maxAttempts;
  };

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getUrgencyIcon = (daysLeft: number) => {
    if (daysLeft <= 1) return <AlertCircle className="h-4 w-4 text-red-500" />;
    if (daysLeft <= 3) return <Clock className="h-4 w-4 text-yellow-500" />;
    return <Calendar className="h-4 w-4 text-blue-500" />;
  };

  const getDaysLeft = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Section */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-primary">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="text-muted-foreground">
          Here's your learning progress and upcoming tasks.
        </p>
      </div>

      {/* Progress Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => window.location.href = '/student/subjects'}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enrolled Classes</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.enrolledClasses || 0}</div>
            <p className="text-xs text-muted-foreground">Active this semester</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => window.location.href = '/student/assignments'}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assignments</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{studentGrades.filter(g => g.score !== null).length}</div>
            <p className="text-xs text-muted-foreground">Graded this semester</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Grade</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {studentGrades.length > 0 
                ? Math.round(
                    studentGrades
                      .filter(grade => grade.score !== null && grade.assignment?.max_score)
                      .reduce((acc, grade) => acc + ((grade.score / grade.assignment.max_score) * 100), 0) / 
                    studentGrades.filter(grade => grade.score !== null && grade.assignment?.max_score).length
                  )
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Across all subjects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingAssignments.length}</div>
            <p className="text-xs text-muted-foreground">Due this week</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Access your learning tools</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button 
              className="flex items-center gap-2"
              onClick={() => navigate('/join-subject')}
            >
              <Plus className="h-4 w-4" />
              Join Subject
            </Button>
            <Button className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              View Lessons
            </Button>
            <Dialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Submit Assignment
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Submit Assignment</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="assignment">Select Assignment</Label>
                    <select
                      id="assignment"
                      className="w-full p-2 border rounded-md"
                      value={selectedAssignment?.id || ''}
                      onChange={(e) => {
                        const assignment = studentAssignments.find(a => a.id === e.target.value);
                        setSelectedAssignment(assignment);
                      }}
                    >
                      <option value="">Choose an assignment...</option>
                      {studentAssignments
                        .filter((assignment: any) => 
                          !isAssignmentGraded(assignment.id) && 
                          !hasReachedMaxAttempts(assignment.id, assignment.max_attempts || 3) &&
                          !isAssignmentOverdue(assignment.due_date)
                        )
                        .map((assignment: any) => (
                        <option key={assignment.id} value={assignment.id}>
                          {assignment.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="submission">Submission Text</Label>
                    <Textarea
                      id="submission"
                      placeholder="Enter your submission text here..."
                      value={submissionText}
                      onChange={(e) => setSubmissionText(e.target.value)}
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label htmlFor="file">Attach File (Optional)</Label>
                    <Input
                      id="file"
                      type="file"
                      onChange={(e) => setSubmissionFile(e.target.files?.[0] || null)}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setSubmitDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleSubmitAssignment} 
                      disabled={!selectedAssignment || !submissionText.trim()}
                    >
                      {submissionAttempts[selectedAssignment?.id] > 0 ? 'Resubmit' : 'Submit'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={contactTeacherDialogOpen} onOpenChange={setContactTeacherDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Contact Teacher
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Contact Teacher About Overdue Assignment</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="overdueAssignment">Select Overdue Assignment</Label>
                    <select
                      id="overdueAssignment"
                      className="w-full p-2 border rounded-md"
                      value={selectedOverdueAssignment?.id || ''}
                      onChange={(e) => {
                        const assignment = studentAssignments.find(a => a.id === e.target.value);
                        setSelectedOverdueAssignment(assignment);
                      }}
                    >
                      <option value="">Choose an overdue assignment...</option>
                      {studentAssignments
                        .filter((assignment: any) => 
                          isAssignmentOverdue(assignment.due_date) && 
                          !isAssignmentGraded(assignment.id)
                        )
                        .map((assignment: any) => (
                        <option key={assignment.id} value={assignment.id}>
                          {assignment.title} - Due: {new Date(assignment.due_date).toLocaleDateString()}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="contactMessage">Message to Teacher</Label>
                    <Textarea
                      id="contactMessage"
                      placeholder="Explain why you need an extension or have questions about this assignment..."
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      rows={4}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => {
                      setContactMessage('');
                      setSelectedOverdueAssignment(null);
                      setContactTeacherDialogOpen(false);
                    }}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleContactTeacher} 
                      disabled={!selectedOverdueAssignment || !contactMessage.trim()}
                    >
                      Send Message
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Enrolled Classes */}
        <Card>
          <CardHeader>
            <CardTitle>My Classes</CardTitle>
            <CardDescription>Classes you are enrolled in</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {enrolledClasses.length > 0 ? (
                enrolledClasses.slice(0, 4).map((enrollment: any) => (
                  <div key={enrollment.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <BookOpen className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{enrollment.class?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {enrollment.class?.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Teacher: {enrollment.class?.teacher?.first_name} {enrollment.class?.teacher?.last_name}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">Active</Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No classes found</p>
                  <p className="text-sm text-muted-foreground">You're not enrolled in any classes yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Subjects */}
        <Card>
          <CardHeader>
            <CardTitle>My Subjects</CardTitle>
            <CardDescription>Your enrolled subjects and progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {subjects && subjects.length > 0 ? (
                subjects.slice(0, 4).map((subject: any) => {
                  // Get assignments for this subject to calculate progress
                  const subjectAssignments = assignments?.filter((a: any) => a.subject_id === subject.id) || [];
                  const completedAssignments = studentGrades.filter((g: any) => 
                    g.assignment && g.assignment.subject && g.assignment.subject.id === subject.id
                  ).length;
                  const progress = subjectAssignments.length > 0 
                    ? Math.round((completedAssignments / subjectAssignments.length) * 100)
                    : 0;

                  return (
                    <div 
                      key={subject.id} 
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/student/subjects/${subject.id}`)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <BookOpen className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{subject.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {subject.description || 'No description available'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Class: {subject.class?.name}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 mb-1">
                          <Progress value={progress} className="w-16 h-2" />
                          <span className="text-xs font-medium">{progress}%</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {completedAssignments}/{subjectAssignments.length} assignments
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No subjects found</p>
                  <p className="text-sm text-muted-foreground">
                    {enrolledClasses.length > 0 
                      ? "Your classes don't have any subjects yet" 
                      : "Join a class to see subjects"
                    }
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-4"
                    onClick={() => navigate('/join-subject')}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Join Subject
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Second row for tasks and grades */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Upcoming Tasks */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Tasks</CardTitle>
            <CardDescription>Assignments and quizzes due soon</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingAssignments.length > 0 ? (
                upcomingAssignments.map((assignment: any) => {
                  const daysLeft = getDaysLeft(assignment.due_date);
                  const isOverdue = isAssignmentOverdue(assignment.due_date);
                  const isGraded = isAssignmentGraded(assignment.id);
                  const maxAttemptsReached = hasReachedMaxAttempts(assignment.id, assignment.max_attempts || 3);
                  const currentAttempts = submissionAttempts[assignment.id] || 0;
                  
                  return (
                    <div key={assignment.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center space-x-3">
                        {getUrgencyIcon(daysLeft)}
                        <div className="flex-1">
                          <p className="font-medium">{assignment.title}</p>
                          <p className="text-sm text-muted-foreground">
                            Due: {new Date(assignment.due_date).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Attempts: {currentAttempts}/{assignment.max_attempts || 3}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant={
                          isGraded ? 'default' : 
                          isOverdue ? 'destructive' : 
                          daysLeft <= 1 ? 'destructive' : 
                          daysLeft <= 3 ? 'default' : 'secondary'
                        }>
                          {isGraded ? 'Graded' : 
                           isOverdue ? 'Overdue' :
                           daysLeft === 0 ? 'Due Today' : 
                           daysLeft === 1 ? 'Due Tomorrow' : `${daysLeft} days`}
                        </Badge>
                        
                        {isGraded ? null : 
                         isOverdue ? (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => {
                              setSelectedOverdueAssignment(assignment);
                              setContactTeacherDialogOpen(true);
                            }}
                          >
                            Contact Teacher
                          </Button>
                        ) : maxAttemptsReached ? (
                          <Badge variant="secondary" className="text-xs">
                            Max attempts reached
                          </Badge>
                        ) : (
                          <Button 
                            size="sm" 
                            onClick={() => {
                              setSelectedAssignment(assignment);
                              setSubmitDialogOpen(true);
                            }}
                            disabled={maxAttemptsReached}
                          >
                            {currentAttempts > 0 ? 'Resubmit' : 'Submit'}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-muted-foreground">No upcoming assignments!</p>
                  <p className="text-sm text-muted-foreground">You're all caught up.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Grades */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Grades</CardTitle>
            <CardDescription>Your latest assignment scores</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {studentGrades.length > 0 ? (
                studentGrades.map((grade: any, index: number) => {
                  const percentage = grade.score && grade.assignment?.max_score 
                    ? Math.round((grade.score / grade.assignment.max_score) * 100)
                    : 0;
                  return (
                    <div key={index} className="p-3 rounded-lg border bg-gradient-to-r from-primary/5 to-accent/5">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium">{grade.assignment?.title || 'Assignment'}</p>
                          <p className="text-sm text-muted-foreground">
                            {grade.assignment?.subject?.name || 'Subject'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-bold ${getGradeColor(percentage)}`}>
                            {grade.score}/{grade.assignment.max_score}
                          </p>
                          <p className="text-sm font-medium text-primary">
                            {percentage}%
                          </p>
                        </div>
                      </div>
                      
                      {/* Show feedback if available */}
                      {grade.feedback && (
                        <div className="mt-2 p-2 bg-background/50 rounded border">
                          <p className="text-xs text-muted-foreground mb-1">Teacher feedback:</p>
                          <p className="text-sm text-foreground">{grade.feedback}</p>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                        <span>Submitted: {new Date(grade.submitted_at).toLocaleDateString()}</span>
                        {grade.graded_at && (
                          <span>Graded: {new Date(grade.graded_at).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No graded assignments yet</p>
                  <p className="text-sm text-muted-foreground">Submit assignments to see your grades here.</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => navigate('/student/assignments')}
                  >
                    View All Assignments
                  </Button>
                </div>
              )}
              {studentGrades.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => navigate('/student/assignments')}
                  >
                    View All Assignments
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Third section for accessibility and lessons */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Lessons */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Lessons</CardTitle>
            <CardDescription>Continue your learning journey</CardDescription>
          </CardHeader>
          <CardContent>
            <StudentLessons />
          </CardContent>
        </Card>

        {/* Accessibility Support */}
        <Card>
          <CardHeader>
            <CardTitle>Accessibility Support</CardTitle>
            <CardDescription>Tools and resources for all learners</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Screen Reader Compatible</p>
                    <p className="text-sm text-muted-foreground">All content optimized for accessibility</p>
                  </div>
                </div>
                <Badge variant="secondary">Active</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Text-to-Speech</p>
                    <p className="text-sm text-muted-foreground">Audio support for all text content</p>
                  </div>
                </div>
                <Badge variant="secondary">Available</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
import React from 'react';
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
  Upload
} from 'lucide-react';
import { useStudentStats, useAssignments, useSubjects, useNotifications, useCreateNotification, useStudentSubjects } from '@/hooks/useSupabaseQuery';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { EnrollmentStatusList } from '@/components/students/EnrollmentStatusList';
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
  const createNotification = useCreateNotification();

  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [submissionText, setSubmissionText] = useState('');
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);

  // Get student's enrolled classes from enrollments
  const [enrolledClasses, setEnrolledClasses] = useState<any[]>([]);
  React.useEffect(() => {
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
  
  React.useEffect(() => {
    const fetchStudentAssignments = async () => {
      console.log('🔍 StudentDashboard: Starting fetchStudentAssignments');
      
      if (!user) {
        console.log('❌ StudentDashboard: No user found');
        return;
      }
      
      try {
        // We already have the profile ID from the auth context
        const userProfile = { id: user.id, role: user.role };
        console.log('✅ StudentDashboard: Using profile from auth context:', userProfile);

        // Use the working query from get_student_assignments function or similar approach
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

        console.log('🔍 StudentDashboard: Assignments query result:', { assignmentsData, error: assignmentsError });

        if (assignmentsError) {
          console.error('❌ StudentDashboard: Error fetching assignments:', assignmentsError);
          setStudentAssignments([]);
          return;
        }

        console.log('✅ StudentDashboard: Found assignments:', assignmentsData?.length || 0);
        setStudentAssignments(assignmentsData || []);
      } catch (error) {
        console.error('❌ StudentDashboard: Error fetching student assignments:', error);
        setStudentAssignments([]);
      }
    };

    fetchStudentAssignments();
  }, [user]);

  // Filter upcoming assignments (next 7 days)
  const upcomingAssignments = studentAssignments.filter((assignment: any) => {
    const dueDate = new Date(assignment.due_date);
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    return dueDate >= today && dueDate <= nextWeek;
  }).slice(0, 4);

  // Get student's grades from assignment submissions
  const [studentGrades, setStudentGrades] = useState<any[]>([]);
  React.useEffect(() => {
    const fetchGrades = async () => {
      if (!user) return;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        const { data: submissions } = await supabase
          .from('assignment_submissions')
          .select(`
            *,
            assignment:assignments(
              id,
              title, 
              max_score,
              subject:subjects(
                id,
                name
              )
            )
          `)
          .eq('student_id', profile.id)
          .not('score', 'is', null)
          .order('updated_at', { ascending: false })
          .limit(4);

        console.log('Graded submissions found:', submissions);

        setStudentGrades(submissions || []);
      }
    };

    fetchGrades();
  }, [user]);

  const handleSubmitAssignment = async () => {
    if (!selectedAssignment || !user) return;

    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .eq('role', 'student')
        .eq('is_active', true)
        .maybeSingle();

      if (profileError || !profile) {
        throw new Error(`Profile not found: ${profileError?.message || 'No profile data'}`);
      }

      const { error } = await supabase
        .from('assignment_submissions')
        .insert({
          assignment_id: selectedAssignment.id,
          student_id: profile.id,
          submission_text: submissionText,
          file_path: submissionFile?.name || null
        });

      if (error) throw error;

      // Create notification for successful submission
      await createNotification.mutateAsync({
        title: 'Assignment Submitted',
        message: `Successfully submitted "${selectedAssignment.title}"`,
        type: 'success',
        user_id: profile.id
      });

      toast({
        title: 'Success',
        description: 'Assignment submitted successfully!',
      });

      setSubmitDialogOpen(false);
      setSubmissionText('');
      setSubmissionFile(null);
      setSelectedAssignment(null);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit assignment',
        variant: 'destructive',
      });
    }
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
                      {studentAssignments.map((assignment: any) => (
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
                    <Button onClick={handleSubmitAssignment} disabled={!selectedAssignment}>
                      Submit
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="outline" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Take Quiz
            </Button>
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
                  return (
                    <div key={assignment.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center space-x-3">
                        {getUrgencyIcon(daysLeft)}
                        <div>
                          <p className="font-medium">{assignment.title}</p>
                          <p className="text-sm text-muted-foreground">
                            Due: {new Date(assignment.due_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant={daysLeft <= 1 ? 'destructive' : daysLeft <= 3 ? 'default' : 'secondary'}>
                        {daysLeft === 0 ? 'Due Today' : daysLeft === 1 ? 'Due Tomorrow' : `${daysLeft} days`}
                      </Badge>
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

        {/* Enrollment Requests Status */}
        <Card>
          <CardHeader>
            <CardTitle>Enrollment Request Status</CardTitle>
            <CardDescription>Status of your subject enrollment requests</CardDescription>
          </CardHeader>
          <CardContent>
            <EnrollmentStatusList />
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Notifications</CardTitle>
            <CardDescription>Important updates and announcements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {notifications?.slice(0, 4).map((notification: any) => (
                <div key={notification.id} className="flex items-start space-x-3 p-3 rounded-lg border">
                  <div className={`w-2 h-2 rounded-full mt-2 ${notification.read ? 'bg-muted' : 'bg-primary'}`} />
                  <div className="flex-1">
                    <p className="font-medium">{notification.title}</p>
                    <p className="text-sm text-muted-foreground">{notification.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(notification.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )) || (
                <p className="text-muted-foreground text-center py-4">No new notifications</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Accessibility Notice */}
      <Card className="border-accent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Accessibility Support
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Need accessibility assistance? Our platform supports screen readers, keyboard navigation, 
            and customizable display options. Contact your teacher or administrator for personalized settings.
          </p>
        </CardContent>
        </Card>

        {/* Lessons Section */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Lessons</CardTitle>
            <CardDescription>Latest lessons from your subjects</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <StudentLessons />
            </div>
          </CardContent>
        </Card>
    </div>
  );
};
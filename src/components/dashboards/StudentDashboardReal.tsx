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
  Users,
  Heart,
  Volume2,
  Eye,
  MessageCircle,
  Headphones,
  UserCheck
} from 'lucide-react';
import { useStudentStats, useAssignments, useSubjects, useNotifications, useCreateNotification, useStudentSubjects, useSupabaseMutation } from '@/hooks/useSupabaseQuery';
import { useAuth } from '@/contexts/AuthContext';
import { useEnhancedStudentProfile } from '@/hooks/useEnhancedStudentProfile';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { TTSButton } from '@/components/accessibility/TTSButton';
import { StudentLessons } from '@/components/students/StudentLessons';
import { Truncate } from '@/components/ui/truncate';

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
  
  // Enhanced student profile with disability information
  const { data: enhancedProfile, isLoading: profileLoading } = useEnhancedStudentProfile();

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
    if (percentage >= 90) return 'text-success';
    if (percentage >= 80) return 'text-primary';
    if (percentage >= 70) return 'text-warning';
    return 'text-destructive';
  };

  const getUrgencyIcon = (daysLeft: number) => {
    if (daysLeft <= 1) return <AlertCircle className="h-4 w-4 text-destructive" />;
    if (daysLeft <= 3) return <Clock className="h-4 w-4 text-warning" />;
    return <Calendar className="h-4 w-4 text-primary" />;
  };

  const getDaysLeft = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Get disabilities for adaptive interface
  const disabilities = enhancedProfile?.disabilities || [];
  const hasDisabilities = disabilities.length > 0;

  if (profileLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your personalized dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => window.location.href = '/student/subjects'}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Classes</CardTitle>
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
            <Button 
              className="flex items-center gap-2"
              onClick={() => navigate('/student/subjects')}
            >
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
                        .filter(a => !isAssignmentGraded(a.id) && !hasReachedMaxAttempts(a.id, a.max_attempts))
                        .map(assignment => (
                          <option key={assignment.id} value={assignment.id}>
                            {assignment.title} - {assignment.subject?.name}
                          </option>
                        ))
                      }
                    </select>
                  </div>
                  
                  {selectedAssignment && (
                    <>
                      <div>
                        <Label htmlFor="submission">Your Work</Label>
                        <Textarea
                          id="submission"
                          placeholder="Type your submission here..."
                          value={submissionText}
                          onChange={(e) => setSubmissionText(e.target.value)}
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
                      
                      <Button 
                        onClick={handleSubmitAssignment}
                        disabled={!submissionText.trim()}
                        className="w-full"
                      >
                        Submit Assignment
                      </Button>
                    </>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Assignments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Upcoming Assignments
            </CardTitle>
            <CardDescription>Due in the next 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingAssignments.length === 0 ? (
              <div className="text-center py-4">
                <CheckCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No assignments due!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingAssignments.map((assignment: any) => {
                  const daysLeft = getDaysLeft(assignment.due_date);
                  const urgencyIcon = getUrgencyIcon(daysLeft);
                  const isOverdue = isAssignmentOverdue(assignment.due_date);
                  const isGraded = isAssignmentGraded(assignment.id);
                  const reachedMaxAttempts = hasReachedMaxAttempts(assignment.id, assignment.max_attempts);
                  const currentAttempts = submissionAttempts[assignment.id] || 0;
                  
                  return (
                    <div 
                      key={assignment.id} 
                      className={`p-3 rounded-lg border ${
                        isOverdue ? 'border-destructive/20 bg-destructive/5' : 'border-border'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {urgencyIcon}
                            <Truncate lines={1} className="font-medium text-sm">
                              {assignment.title}
                            </Truncate>
                            {hasDisabilities && (
                              <TTSButton 
                                text={`Assignment: ${assignment.title}. Due in ${daysLeft} days.`}
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-1"
                              />
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>{assignment.subject?.name}</span>
                            <span className={isOverdue ? 'text-destructive' : ''}>
                              {new Date(assignment.due_date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={isOverdue ? 'destructive' : 'secondary'} className="text-xs">
                            {isOverdue ? 'Overdue' : `${daysLeft}d`}
                          </Badge>
                          {isGraded ? (
                            <Badge variant="outline" className="text-xs">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Done
                            </Badge>
                          ) : reachedMaxAttempts ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={() => {
                                setSelectedOverdueAssignment(assignment);
                                setContactTeacherDialogOpen(true);
                              }}
                            >
                              Contact
                            </Button>
                          ) : (
                            <Button 
                              size="sm"
                              variant={isOverdue ? "destructive" : "default"}
                              className="h-7 text-xs"
                              onClick={() => {
                                setSelectedAssignment(assignment);
                                setSubmitDialogOpen(true);
                              }}
                            >
                              {currentAttempts > 0 ? 'Retry' : 'Submit'}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Grades */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Recent Grades
            </CardTitle>
            <CardDescription>Latest graded assignments</CardDescription>
          </CardHeader>
          <CardContent>
            {studentGrades.length === 0 ? (
              <div className="text-center py-4">
                <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No grades yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {studentGrades.map((grade: any) => {
                  const percentage = grade.assignment?.max_score 
                    ? Math.round((grade.score / grade.assignment.max_score) * 100)
                    : 0;
                  
                  return (
                    <div key={grade.id} className="p-3 rounded-lg border">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Truncate lines={1} className="font-medium text-sm">
                              {grade.assignment?.title}
                            </Truncate>
                            {hasDisabilities && (
                              <TTSButton 
                                text={`Grade: ${grade.score} out of ${grade.assignment?.max_score}, ${percentage}%`}
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-1"
                              />
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {grade.assignment?.subject?.name} • {new Date(grade.graded_at).toLocaleDateString()}
                          </div>
                          {grade.feedback && (
                            <Truncate lines={2} className="text-xs text-muted-foreground mt-1 italic">
                              "{grade.feedback}"
                            </Truncate>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold">
                            <span className={getGradeColor(percentage)}>
                              {grade.score}/{grade.assignment?.max_score}
                            </span>
                          </div>
                          <Badge 
                            variant={percentage >= 70 ? 'default' : 'destructive'}
                            className="text-xs"
                          >
                            {percentage}%
                          </Badge>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* My Classes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              My Classes
            </CardTitle>
            <CardDescription>Enrolled this semester</CardDescription>
          </CardHeader>
          <CardContent>
            {enrolledClasses.length === 0 ? (
              <div className="text-center py-4">
                <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No classes enrolled</p>
              </div>
            ) : (
              <div className="space-y-3">
                {enrolledClasses.map((enrollment: any) => (
                  <div key={enrollment.id} className="p-3 rounded-lg border">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Truncate lines={1} className="font-medium text-sm">
                            {enrollment.class?.name}
                          </Truncate>
                          {hasDisabilities && (
                            <TTSButton 
                              text={`Class: ${enrollment.class?.name}. Teacher: ${enrollment.class?.teacher?.first_name} ${enrollment.class?.teacher?.last_name}`}
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-1"
                            />
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {enrollment.class?.teacher?.first_name} {enrollment.class?.teacher?.last_name}
                        </div>
                        {enrollment.class?.description && (
                          <Truncate lines={1} className="text-xs text-muted-foreground mt-1">
                            {enrollment.class?.description}
                          </Truncate>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          Active
                        </Badge>
                        <Button 
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => navigate('/student/subjects')}
                        >
                          View
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Support & Accommodations */}
        {hasDisabilities && enhancedProfile && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-primary" />
                Support & Accommodations
              </CardTitle>
              <CardDescription>Your active support services</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {enhancedProfile.iep_status && (
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <span className="font-medium text-sm">IEP Active</span>
                      {hasDisabilities && (
                        <TTSButton 
                          text="IEP is active for this student"
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-1"
                        />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Individualized Education Plan is in place
                    </p>
                  </div>
                )}
                
                {enhancedProfile.student_accommodations && enhancedProfile.student_accommodations.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Active Accommodations</h4>
                    {enhancedProfile.student_accommodations.slice(0, 3).map((accommodation: any, index: number) => (
                      <div key={index} className="p-2 rounded-lg bg-muted text-xs">
                        <span className="font-medium">{accommodation.accommodation_type}</span>
                        {accommodation.description && (
                          <Truncate lines={1} className="text-muted-foreground mt-1">
                            {accommodation.description}
                          </Truncate>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {enhancedProfile.student_support_services && enhancedProfile.student_support_services.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Support Services</h4>
                    {enhancedProfile.student_support_services.slice(0, 2).map((service: any, index: number) => (
                      <div key={index} className="p-2 rounded-lg bg-muted text-xs">
                        <span className="font-medium">{service.service_type}</span>
                        {service.frequency && (
                          <span className="text-muted-foreground ml-2">• {service.frequency}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Learning Progress for students with disabilities */}
        {hasDisabilities && enhancedProfile?.student_progress_tracking && enhancedProfile.student_progress_tracking.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Learning Goals Progress
              </CardTitle>
              <CardDescription>Your personalized learning targets</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {enhancedProfile.student_progress_tracking.slice(0, 3).map((progress: any, index: number) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Truncate lines={1} className="font-medium text-sm">
                        {progress.goal_description}
                      </Truncate>
                      <Badge variant={progress.is_achieved ? "default" : "secondary"} className="text-xs">
                        {progress.progress_percentage}%
                      </Badge>
                    </div>
                    <Progress value={progress.progress_percentage} className="h-2" />
                    {progress.current_status && (
                      <p className="text-xs text-muted-foreground">{progress.current_status}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Contact Teacher Dialog */}
      <Dialog open={contactTeacherDialogOpen} onOpenChange={setContactTeacherDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Contact Teacher</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedOverdueAssignment && (
              <div className="p-3 rounded-lg bg-muted">
                <p className="font-medium text-sm">Assignment: {selectedOverdueAssignment.title}</p>
                <p className="text-xs text-muted-foreground">
                  Teacher: {selectedOverdueAssignment.subject?.class?.teacher?.first_name} {selectedOverdueAssignment.subject?.class?.teacher?.last_name}
                </p>
              </div>
            )}
            
            <div>
              <Label htmlFor="message">Your Message</Label>
              <Textarea
                id="message"
                placeholder="Explain your situation or ask for help..."
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
              />
            </div>
            
            <Button 
              onClick={handleContactTeacher}
              disabled={!contactMessage.trim()}
              className="w-full"
            >
              Send Message
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
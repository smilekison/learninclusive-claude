import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useAssignments, useSupabaseMutation } from '@/hooks/useSupabaseQuery';
import { supabase } from '@/integrations/supabase/client';
import { 
  ArrowLeft,
  FileText,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  Upload,
  BarChart3
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

export const StudentAssignmentsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [studentAssignments, setStudentAssignments] = useState<any[]>([]);
  const [submissionDialog, setSubmissionDialog] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [submissionText, setSubmissionText] = useState('');
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);

  React.useEffect(() => {
    const fetchStudentAssignments = async () => {
      console.log('🔍 StudentAssignmentsPage: Starting fetchStudentAssignments');
      console.log('🔍 StudentAssignmentsPage: User:', user);
      
      if (!user) {
        console.log('❌ StudentAssignmentsPage: No user found');
        return;
      }
      
      try {
        // We already have the profile ID from the auth context
        const profile = { id: user.id };
        console.log('✅ StudentAssignmentsPage: Using profile from auth context:', profile);
        console.log('🔍 StudentAssignmentsPage: Fetching enrollments for student_id:', profile.id);

        // First, get the student's class enrollments
        const { data: enrollments, error: enrollmentError } = await supabase
          .from('student_enrollments')
          .select(`
            class_id,
            classes!inner(
              id,
              name,
              subjects(
                id,
                name,
                assignments(
                  *
                )
              )
            )
          `)
          .eq('student_id', profile.id)
          .eq('status', 'active');

        console.log('🔍 StudentAssignmentsPage: Enrollments query result:', { enrollments, error: enrollmentError });

        if (enrollmentError) {
          console.error('❌ StudentAssignmentsPage: Error fetching enrollments:', enrollmentError);
          setStudentAssignments([]);
          return;
        }

        if (!enrollments || enrollments.length === 0) {
          console.log('⚠️ StudentAssignmentsPage: No enrollments found for student. Student needs to be enrolled in classes.');
          setStudentAssignments([]);
          return;
        }

        console.log('✅ StudentAssignmentsPage: Found enrollments:', enrollments?.length || 0);

        // Extract all assignments from enrolled classes
        const allAssignments: any[] = [];
        enrollments?.forEach((enrollment, enrollmentIndex) => {
          console.log(`🔍 StudentAssignmentsPage: Processing enrollment ${enrollmentIndex}:`, enrollment);
          
          enrollment.classes?.subjects?.forEach((subject: any, subjectIndex: number) => {
            console.log(`🔍 StudentAssignmentsPage: Processing subject ${subjectIndex}:`, subject);
            
            subject.assignments?.forEach((assignment: any, assignmentIndex: number) => {
              console.log(`🔍 StudentAssignmentsPage: Processing assignment ${assignmentIndex}:`, assignment);
              
              if (assignment.is_active) {
                allAssignments.push({
                  ...assignment,
                  subject: {
                    id: subject.id,
                    name: subject.name,
                    class: {
                      id: enrollment.classes?.id,
                      name: enrollment.classes?.name
                    }
                  }
                });
              } else {
                console.log('⚠️ StudentAssignmentsPage: Skipping inactive assignment:', assignment.id);
              }
            });
          });
        });

        console.log('✅ StudentAssignmentsPage: Final assignments array:', allAssignments);
        console.log('📊 StudentAssignmentsPage: Total assignments found:', allAssignments.length);
        
        if (allAssignments.length === 0) {
          console.log('⚠️ StudentAssignmentsPage: No assignments found. Either no enrollments or no assignments in enrolled classes.');
          setStudentAssignments([]);
          return;
        }
        
        // Now get submissions for these assignments if any assignments exist
        if (allAssignments.length > 0) {
          console.log('🔍 StudentAssignmentsPage: Fetching submissions for assignments');
          const assignmentIds = allAssignments.map(a => a.id);
          
          const { data: submissionData, error: submissionError } = await supabase
            .from('assignment_submissions')
            .select('*')
            .in('assignment_id', assignmentIds)
            .eq('student_id', profile.id);

          console.log('🔍 StudentAssignmentsPage: Submissions query result:', { submissionData, error: submissionError });

          if (submissionError) {
            console.error('❌ StudentAssignmentsPage: Error fetching submissions:', submissionError);
          } else {
            console.log('✅ StudentAssignmentsPage: Found submissions:', submissionData?.length || 0);
            
            // Combine assignments with their submissions
            const processedAssignments = allAssignments.map(assignment => ({
              ...assignment,
              submissions: submissionData?.filter(sub => sub.assignment_id === assignment.id) || []
            }));

            // Sort by due date and creation date
            processedAssignments.sort((a, b) => {
              if (a.due_date && b.due_date) {
                return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
              }
              return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            });

            console.log('✅ StudentAssignmentsPage: Final processed assignments:', processedAssignments);
            setStudentAssignments(processedAssignments);
          }
        }
      } catch (error) {
        console.error('Error fetching student assignments:', error);
        setStudentAssignments([]);
      }
    };

    fetchStudentAssignments();
  }, [user]);

  const submitAssignmentMutation = useSupabaseMutation(
    async (data: any) => {
      if (!user?.id) throw new Error('User not found');

      return await supabase
        .from('assignment_submissions')
        .insert({
          assignment_id: data.assignmentId,
          student_id: user.id, // Use the profile ID directly from auth context
          submission_text: data.submissionText,
          file_path: data.file?.name || null
        });
    },
    {
      successMessage: "Assignment submitted successfully!",
      onSuccess: () => {
        setSubmissionDialog(false);
        setSubmissionText('');
        setSubmissionFile(null);
        setSelectedAssignment(null);
        // Refresh assignments
        window.location.reload();
      }
    }
  );

  const handleSubmitAssignment = () => {
    if (!selectedAssignment) return;
    
    submitAssignmentMutation.mutate({
      assignmentId: selectedAssignment.id,
      submissionText,
      file: submissionFile
    });
  };

  const getStatusBadge = (assignment: any) => {
    const hasSubmission = assignment.submissions && assignment.submissions.length > 0;
    
    if (hasSubmission) {
      const submission = assignment.submissions[0];
      if (submission.score !== null) {
        return <Badge variant="default">Graded</Badge>;
      }
      return <Badge variant="secondary">Submitted</Badge>;
    }

    if (!assignment.due_date) {
      return <Badge variant="outline">No due date</Badge>;
    }

    const due = new Date(assignment.due_date);
    const now = new Date();
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 3600 * 24));
    
    if (diffDays < 0) return <Badge variant="destructive">Overdue</Badge>;
    if (diffDays <= 1) return <Badge variant="destructive">Due soon</Badge>;
    if (diffDays <= 7) return <Badge variant="default">Due this week</Badge>;
    return <Badge variant="secondary">Upcoming</Badge>;
  };

  const getUrgencyIcon = (assignment: any) => {
    const hasSubmission = assignment.submissions && assignment.submissions.length > 0;
    if (hasSubmission) return <CheckCircle className="h-4 w-4 text-success" />;
    
    if (!assignment.due_date) return <FileText className="h-4 w-4 text-muted-foreground" />;
    
    const due = new Date(assignment.due_date);
    const now = new Date();
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 3600 * 24));
    
    if (diffDays <= 1) return <AlertCircle className="h-4 w-4 text-destructive" />;
    if (diffDays <= 3) return <Clock className="h-4 w-4 text-warning" />;
    return <Calendar className="h-4 w-4 text-primary" />;
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </div>

        <div>
          <h1 className="text-3xl font-bold text-foreground">My Assignments</h1>
          <p className="text-muted-foreground mt-2">
            View and submit your assignments
          </p>
        </div>

        {/* Progress Overview */}
        <Card className="mb-6 card-elevated border-l-4 border-l-primary">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5">
            <CardTitle className="flex items-center gap-2 text-primary">
              <BarChart3 className="w-5 h-5" />
              Assignment Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border border-primary/20">
                <div className="text-3xl font-bold text-primary">{studentAssignments.length}</div>
                <div className="text-sm font-medium text-primary/80 mt-1">Total</div>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-success/10 to-success/5 rounded-lg border border-success/20">
                <div className="text-3xl font-bold text-success">
                  {studentAssignments.filter(a => a.submissions?.length > 0).length}
                </div>
                <div className="text-sm font-medium text-success/80 mt-1">Submitted</div>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-warning/10 to-warning/5 rounded-lg border border-warning/20">
                <div className="text-3xl font-bold text-warning">
                  {studentAssignments.filter(a => 
                    a.submissions?.length > 0 && a.submissions[0]?.score === null
                  ).length}
                </div>
                <div className="text-sm font-medium text-warning/80 mt-1">Pending</div>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-accent/10 to-accent/5 rounded-lg border border-accent/20">
                <div className="text-3xl font-bold text-accent">
                  {studentAssignments.filter(a => 
                    a.submissions?.length > 0 && a.submissions[0]?.score !== null
                  ).length}
                </div>
                <div className="text-sm font-medium text-accent/80 mt-1">Graded</div>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Assignments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {studentAssignments.map((assignment: any) => {
            const hasSubmission = assignment.submissions && assignment.submissions.length > 0;
            const submission = hasSubmission ? assignment.submissions[0] : null;

            const getBorderColor = () => {
              if (hasSubmission) {
                return submission?.score !== null ? 'border-l-success' : 'border-l-primary';
              }
              if (assignment.due_date && new Date(assignment.due_date) < new Date()) {
                return 'border-l-destructive';
              }
              return 'border-l-muted-foreground';
            };

            const getCardGradient = () => {
              if (hasSubmission) {
                return submission?.score !== null 
                  ? 'bg-gradient-to-br from-success/5 to-success/2' 
                  : 'bg-gradient-to-br from-primary/5 to-primary/2';
              }
              if (assignment.due_date && new Date(assignment.due_date) < new Date()) {
                return 'bg-gradient-to-br from-destructive/5 to-destructive/2';
              }
              return 'bg-gradient-to-br from-muted/5 to-background';
            };

            return (
              <Card 
                key={assignment.id} 
                className={`card-elevated hover:shadow-medium transition-all duration-300 cursor-pointer border-l-4 ${getBorderColor()} ${getCardGradient()}`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      {getUrgencyIcon(assignment)}
                      {assignment.title}
                    </CardTitle>
                    {getStatusBadge(assignment)}
                  </div>
                  <CardDescription className="text-sm">
                    {assignment.description || 'No description available'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 mb-4">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <FileText className="w-4 h-4" />
                        <span>Subject: {assignment.subject?.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>Class: {assignment.subject?.class?.name}</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {assignment.due_date && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          <span>Due: {new Date(assignment.due_date).toLocaleDateString()}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span>Max Score: {assignment.max_score} points</span>
                      </div>
                    </div>
                    
                    {submission && (
                      <div className="mt-4 p-4 bg-gradient-to-r from-success/10 to-primary/10 rounded-lg border border-success/20">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-semibold text-success flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            Submitted
                          </p>
                          {submission.score !== null && (
                            <div className="text-right">
                              <p className="text-lg font-bold text-success">
                                {submission.score}/{assignment.max_score}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                ({Math.round((submission.score / assignment.max_score) * 100)}%)
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="space-y-1 text-sm">
                          <p className="text-muted-foreground">
                            <strong>Submitted:</strong> {new Date(submission.submitted_at).toLocaleDateString()}
                          </p>
                          {submission.feedback && (
                            <div className="mt-2 p-3 bg-card rounded-lg border border-accent/20">
                              <p className="text-xs font-medium text-accent mb-1">Teacher Feedback:</p>
                              <p className="text-sm text-foreground">{submission.feedback}</p>
                            </div>
                          )}
                          {submission.submission_text && (
                            <div className="mt-2 p-3 bg-card rounded-lg border border-muted">
                              <p className="text-xs font-medium text-muted-foreground mb-1">Your Submission:</p>
                              <p className="text-sm text-foreground">{submission.submission_text.substring(0, 100)}...</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    {!hasSubmission ? (
                      <Button 
                        className="flex-1" 
                        onClick={() => {
                          setSelectedAssignment(assignment);
                          setSubmissionDialog(true);
                        }}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Submit Assignment
                      </Button>
                    ) : (
                      <div className="flex gap-2 w-full">
                        <Button 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => {
                            setSelectedAssignment(assignment);
                            setSubmissionText(submission?.submission_text || '');
                            setSubmissionDialog(true);
                          }}
                        >
                          View Submission
                        </Button>
                        {submission?.score === null && (
                          <Button 
                            variant="secondary" 
                            className="flex-1"
                            onClick={() => {
                              setSelectedAssignment(assignment);
                              setSubmissionText('');
                              setSubmissionDialog(true);
                            }}
                          >
                            Resubmit
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
          
          {studentAssignments.length === 0 && (
            <div className="col-span-full text-center py-12">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No assignments found</h3>
              <p className="text-muted-foreground mb-4">
                You need to be enrolled in a class to see assignments. Please join a subject using an invitation code.
              </p>
              <Button onClick={() => window.location.href = '/join-subject'}>
                Join a Subject
              </Button>
            </div>
          )}
        </div>

        {/* Submission Dialog */}
        <Dialog open={submissionDialog} onOpenChange={setSubmissionDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Submit Assignment: {selectedAssignment?.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="submission-text">Submission Text</Label>
                <Textarea
                  id="submission-text"
                  placeholder="Enter your submission text here..."
                  value={submissionText}
                  onChange={(e) => setSubmissionText(e.target.value)}
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="submission-file">Attach File (Optional)</Label>
                <Input
                  id="submission-file"
                  type="file"
                  onChange={(e) => setSubmissionFile(e.target.files?.[0] || null)}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSubmissionDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmitAssignment} 
                  disabled={submitAssignmentMutation.isPending || !submissionText.trim()}
                >
                  {submitAssignmentMutation.isPending ? 'Submitting...' : 'Submit'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};
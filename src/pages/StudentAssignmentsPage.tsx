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
      if (!user) return;
      
      try {
        // Get student's profile ID using the correct user_id from auth
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();

        console.log('Profile query result:', { profile, error: profileError });

        if (profileError || !profile) {
          console.error('Student profile not found:', profileError);
          return;
        }

        // Fetch assignments using a simplified query
        const { data: assignments, error } = await supabase
          .from('assignments')
          .select(`
            *,
            subjects!inner(
              id,
              name,
              classes!inner(
                id,
                name
              )
            )
          `)
          .eq('subjects.classes.student_enrollments.student_id', profile.id)
          .eq('subjects.classes.student_enrollments.status', 'active')
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        console.log('Assignments query result:', { assignments, error });

        if (error) {
          console.error('Error fetching assignments:', error);
          // Try a different approach - get assignments by joining through enrollments
          const { data: altAssignments, error: altError } = await supabase
            .from('student_enrollments')
            .select(`
              classes!inner(
                subjects!inner(
                  assignments!inner(
                    *,
                    assignment_submissions(
                      id,
                      submitted_at,
                      score,
                      feedback,
                      submission_text,
                      file_path,
                      student_id
                    )
                  )
                )
              )
            `)
            .eq('student_id', profile.id)
            .eq('status', 'active');

          if (altError) {
            console.error('Alternative query also failed:', altError);
            return;
          }

          // Transform the data structure
          const transformedAssignments = altAssignments?.flatMap(enrollment => 
            enrollment.classes?.subjects?.flatMap((subject: any) =>
              subject.assignments?.map((assignment: any) => ({
                ...assignment,
                subject: {
                  id: subject.id,
                  name: subject.name,
                  class: {
                    id: (enrollment.classes as any)?.id,
                    name: (enrollment.classes as any)?.name
                  }
                },
                submissions: assignment.assignment_submissions?.filter((sub: any) => sub.student_id === profile.id) || []
              }))
            ).filter(Boolean)
          ).filter(Boolean) || [];

          setStudentAssignments(transformedAssignments);
          return;
        }

        // Fetch submissions for these assignments
        const assignmentIds = assignments?.map(a => a.id) || [];
        const { data: submissions } = await supabase
          .from('assignment_submissions')
          .select('*')
          .in('assignment_id', assignmentIds)
          .eq('student_id', profile.id);

        // Combine assignments with submissions
        const processedAssignments = assignments?.map(assignment => ({
          ...assignment,
          subject: assignment.subjects,
          submissions: submissions?.filter(sub => sub.assignment_id === assignment.id) || []
        })) || [];

        setStudentAssignments(processedAssignments);
      } catch (error) {
        console.error('Error fetching student assignments:', error);
        setStudentAssignments([]);
      }
    };

    fetchStudentAssignments();
  }, [user]);

  const submitAssignmentMutation = useSupabaseMutation(
    async (data: any) => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      return await supabase
        .from('assignment_submissions')
        .insert({
          assignment_id: data.assignmentId,
          student_id: profile.id,
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
    if (hasSubmission) return <CheckCircle className="h-4 w-4 text-green-500" />;
    
    if (!assignment.due_date) return <FileText className="h-4 w-4 text-muted-foreground" />;
    
    const due = new Date(assignment.due_date);
    const now = new Date();
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 3600 * 24));
    
    if (diffDays <= 1) return <AlertCircle className="h-4 w-4 text-red-500" />;
    if (diffDays <= 3) return <Clock className="h-4 w-4 text-yellow-500" />;
    return <Calendar className="h-4 w-4 text-blue-500" />;
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
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Assignment Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{studentAssignments.length}</div>
                <div className="text-sm text-blue-700">Total</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {studentAssignments.filter(a => a.submissions?.length > 0).length}
                </div>
                <div className="text-sm text-green-700">Submitted</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {studentAssignments.filter(a => 
                    a.submissions?.length > 0 && a.submissions[0]?.score === null
                  ).length}
                </div>
                <div className="text-sm text-yellow-700">Pending</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {studentAssignments.filter(a => 
                    a.submissions?.length > 0 && a.submissions[0]?.score !== null
                  ).length}
                </div>
                <div className="text-sm text-purple-700">Graded</div>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Assignments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {studentAssignments.map((assignment: any) => {
            const hasSubmission = assignment.submissions && assignment.submissions.length > 0;
            const submission = hasSubmission ? assignment.submissions[0] : null;

            return (
              <Card 
                key={assignment.id} 
                className="hover:shadow-lg transition-all duration-200 cursor-pointer border-l-4"
                style={{
                  borderLeftColor: hasSubmission 
                    ? submission?.score !== null ? '#22c55e' : '#3b82f6'
                    : assignment.due_date && new Date(assignment.due_date) < new Date() ? '#ef4444' : '#6b7280'
                }}
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
                      <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-semibold text-green-700">✓ Submitted</p>
                          {submission.score !== null && (
                            <div className="text-right">
                              <p className="text-lg font-bold text-green-600">
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
                            <div className="mt-2 p-2 bg-white rounded border">
                              <p className="text-xs font-medium text-blue-700">Teacher Feedback:</p>
                              <p className="text-sm text-gray-700">{submission.feedback}</p>
                            </div>
                          )}
                          {submission.submission_text && (
                            <div className="mt-2 p-2 bg-white rounded border">
                              <p className="text-xs font-medium text-gray-700">Your Submission:</p>
                              <p className="text-sm text-gray-600">{submission.submission_text.substring(0, 100)}...</p>
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
              <p className="text-muted-foreground">You don't have any assignments yet</p>
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
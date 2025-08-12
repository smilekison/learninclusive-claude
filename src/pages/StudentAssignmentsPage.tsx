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
  Upload
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
        // Get student's profile ID
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (!profile) {
          console.error('Student profile not found');
          return;
        }

        // Fetch assignments for classes the student is enrolled in
        const { data: assignments, error } = await supabase
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
            ),
            submissions:assignment_submissions(
              id,
              submitted_at,
              score,
              feedback,
              student_id
            )
          `)
          .eq('subject.class.student_enrollments.student_id', profile.id)
          .eq('subject.class.student_enrollments.status', 'active')
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching assignments:', error);
          return;
        }

        // Filter submissions to only show current student's submissions
        const processedAssignments = assignments?.map(assignment => ({
          ...assignment,
          submissions: assignment.submissions?.filter(sub => sub.student_id === profile.id) || []
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

        {/* Assignments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {studentAssignments.map((assignment: any) => {
            const hasSubmission = assignment.submissions && assignment.submissions.length > 0;
            const submission = hasSubmission ? assignment.submissions[0] : null;

            return (
              <Card key={assignment.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      {getUrgencyIcon(assignment)}
                      {assignment.title}
                    </CardTitle>
                    {getStatusBadge(assignment)}
                  </div>
                  <CardDescription>
                    {assignment.description || 'No description available'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FileText className="w-4 h-4" />
                      <span>Subject: {assignment.subject?.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>Class: {assignment.subject?.class?.name}</span>
                    </div>
                    {assignment.due_date && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>Due: {new Date(assignment.due_date).toLocaleDateString()}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>Max Score: {assignment.max_score} points</span>
                    </div>
                    
                    {submission && (
                      <div className="mt-3 p-3 bg-muted rounded-lg">
                        <p className="text-sm font-medium">Your Submission:</p>
                        <p className="text-sm text-muted-foreground">
                          Submitted: {new Date(submission.submitted_at).toLocaleDateString()}
                        </p>
                        {submission.score !== null && (
                          <p className="text-sm font-medium text-green-600">
                            Score: {submission.score}/{assignment.max_score}
                          </p>
                        )}
                        {submission.feedback && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Feedback: {submission.feedback}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {!hasSubmission && (
                    <Button 
                      className="w-full" 
                      onClick={() => {
                        setSelectedAssignment(assignment);
                        setSubmissionDialog(true);
                      }}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Submit Assignment
                    </Button>
                  )}
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
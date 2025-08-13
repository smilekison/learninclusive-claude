import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabaseMutation, useRecentSubmissions } from '@/hooks/useSupabaseQuery';
import { supabase } from '@/integrations/supabase/client';
import { 
  ArrowLeft,
  FileText,
  Calendar,
  Clock,
  Star,
  MessageSquare,
  Eye
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { EnhancedGradingDialog } from '@/components/grading/EnhancedGradingDialog';

export const SubmissionsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: submissions = [], error, isLoading } = useRecentSubmissions(100); // Get more submissions
  const [gradeDialog, setGradeDialog] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [score, setScore] = useState('');
  const [feedback, setFeedback] = useState('');


  const gradeSubmissionMutation = useSupabaseMutation(
    async (data: any) => {
      console.log('Grading submission with data:', data);
      try {
        // Use the edge function for grading
        const { data: result, error } = await supabase.functions.invoke('grade-assignment', {
          body: data
        });
        
        console.log('Edge function result:', result);
        console.log('Edge function error:', error);
        
        if (error) {
          console.error('Edge function error:', error);
          throw error;
        }
        return result;
      } catch (err) {
        console.error('Failed to grade assignment:', err);
        // Also try direct database update as fallback
        console.log('Attempting direct database update as fallback...');
        const fallbackResult = await supabase
          .from('assignment_submissions')
          .update({
            score: data.score,
            feedback: data.feedback,
            grading_notes: data.gradingNotes,
            submission_quality: data.submissionQuality,
            time_spent_minutes: data.timeSpentMinutes,
            rubric_scores: data.rubricScores || [],
            graded_at: new Date().toISOString(),
            graded_by: data.gradedBy
          })
          .eq('id', data.submissionId);
        
        if (fallbackResult.error) {
          console.error('Fallback update failed:', fallbackResult.error);
          throw fallbackResult.error;
        }
        
        console.log('Fallback update succeeded');
        return fallbackResult;
      }
    },
    {
      successMessage: "Assignment graded successfully!",
      onSuccess: (data) => {
        console.log('Grade submission success:', data);
        setGradeDialog(false);
        setScore('');
        setFeedback('');
        setSelectedSubmission(null);
      },
      invalidateKeys: [['recent-submissions']]
    }
  );

  const handleGradeSubmission = async (gradeData: any) => {
    if (!selectedSubmission) {
      console.error('No submission selected');
      return;
    }
    
    console.log('Handle grade submission called with:', gradeData);
    console.log('Selected submission:', selectedSubmission);
    
    // Get current user profile, fallback to user_id if profile doesn't exist
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user?.id)
      .single();

    const gradedBy = profile?.id || user?.id;
    
    if (!gradedBy) {
      console.error('No user found for grading');
      return;
    }

    console.log('Teacher profile:', profile);

    const submissionData = {
      submissionId: selectedSubmission.id,
      score: gradeData.score,
      feedback: gradeData.feedback,
      gradingNotes: gradeData.gradingNotes,
      submissionQuality: gradeData.submissionQuality,
      timeSpentMinutes: gradeData.timeSpentMinutes,
      rubricScores: gradeData.rubricScores,
      gradedBy: gradedBy
    };

    console.log('Submitting grade data:', submissionData);
    gradeSubmissionMutation.mutate(submissionData);
  };

  const getStatusBadge = (submission: any) => {
    if (submission.score !== null) {
      const percentage = (submission.score / submission.assignment.max_score) * 100;
      const variant = percentage >= 90 ? 'default' : percentage >= 70 ? 'secondary' : 'destructive';
      return <Badge variant={variant}>Graded ({percentage.toFixed(0)}%)</Badge>;
    }
    return <Badge variant="secondary">Pending</Badge>;
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
          <h1 className="text-3xl font-bold text-foreground">Assignment Submissions</h1>
          <p className="text-muted-foreground mt-2">
            Review and grade student submissions
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading submissions...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <p className="text-destructive">Error loading submissions: {error.message}</p>
          </div>
        )}

        {/* Submissions Grid */}
        {!isLoading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {submissions.map((submission: any) => {
            return (
              <Card key={submission.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      {submission.assignment.title}
                    </CardTitle>
                    {getStatusBadge(submission)}
                  </div>
                  <CardDescription>
                    Student: {submission.student.first_name} {submission.student.last_name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FileText className="w-4 h-4" />
                      <span>Subject: {submission.assignment.subject.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>Class: {submission.assignment.subject.class.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>Submitted: {new Date(submission.submitted_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Star className="w-4 h-4" />
                      <span>Max Score: {submission.assignment.max_score} points</span>
                    </div>

                    {submission.score !== null && (
                      <div className="mt-3 p-3 bg-muted rounded-lg">
                        <p className="text-sm font-medium text-green-600">
                          Score: {submission.score}/{submission.assignment.max_score}
                        </p>
                        {submission.feedback && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Feedback: {submission.feedback}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground">
                          Graded: {new Date(submission.graded_at).toLocaleDateString()}
                        </p>
                      </div>
                    )}

                    {submission.submission_text && (
                      <div className="mt-3 p-3 border rounded-lg">
                        <p className="text-sm font-medium mb-1">Submission:</p>
                        <p className="text-sm text-muted-foreground">
                          {submission.submission_text.substring(0, 100)}
                          {submission.submission_text.length > 100 ? '...' : ''}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>
                            {submission.assignment.title} - {submission.student.first_name} {submission.student.last_name}
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium mb-2">Submission Text:</h4>
                            <p className="text-sm bg-muted p-3 rounded-lg">
                              {submission.submission_text || 'No text submission'}
                            </p>
                          </div>
                          {submission.file_path && (
                            <div>
                              <h4 className="font-medium mb-2">Attached File:</h4>
                              <p className="text-sm text-muted-foreground">{submission.file_path}</p>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Button 
                      size="sm"
                      onClick={() => {
                        setSelectedSubmission(submission);
                        setGradeDialog(true);
                      }}
                      variant={submission.score === null ? "default" : "outline"}
                    >
                      <Star className="w-4 h-4 mr-1" />
                      {submission.score === null ? 'Grade' : 'Re-grade'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          
            {submissions.length === 0 && (
              <div className="col-span-full text-center py-12">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No submissions found</h3>
                <p className="text-muted-foreground">No students have submitted assignments yet</p>
              </div>
            )}
          </div>
        )}

        {/* Enhanced Grading Dialog */}
        <EnhancedGradingDialog
          open={gradeDialog}
          onOpenChange={setGradeDialog}
          submission={selectedSubmission}
          onGrade={handleGradeSubmission}
          isLoading={gradeSubmissionMutation.isPending}
        />
      </main>
    </div>
  );
};
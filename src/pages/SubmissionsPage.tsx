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
      return await supabase
        .from('assignment_submissions')
        .update({
          score: data.score,
          feedback: data.feedback,
          graded_at: new Date().toISOString(),
          graded_by: data.gradedBy
        })
        .eq('id', data.submissionId);
    },
    {
      successMessage: "Assignment graded successfully!",
      onSuccess: () => {
        setGradeDialog(false);
        setScore('');
        setFeedback('');
        setSelectedSubmission(null);
      },
      invalidateKeys: [['recent-submissions']]
    }
  );

  const handleGradeSubmission = async () => {
    if (!selectedSubmission || !score) return;
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user?.id)
      .single();

    if (!profile) return;

    gradeSubmissionMutation.mutate({
      submissionId: selectedSubmission.id,
      score: parseFloat(score),
      feedback,
      gradedBy: profile.id
    });
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

                    {submission.score === null && (
                      <Button 
                        size="sm"
                        onClick={() => {
                          setSelectedSubmission(submission);
                          setGradeDialog(true);
                        }}
                      >
                        <Star className="w-4 h-4 mr-1" />
                        Grade
                      </Button>
                    )}
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

        {/* Grading Dialog */}
        <Dialog open={gradeDialog} onOpenChange={setGradeDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Grade Assignment: {selectedSubmission?.assignment.title}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Student: {selectedSubmission?.student.first_name} {selectedSubmission?.student.last_name}</Label>
              </div>
              
              <div>
                <Label htmlFor="score">Score (out of {selectedSubmission?.assignment.max_score})</Label>
                <Input
                  id="score"
                  type="number"
                  min="0"
                  max={selectedSubmission?.assignment.max_score}
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  placeholder="Enter score"
                />
              </div>

              <div>
                <Label htmlFor="feedback">Feedback (Optional)</Label>
                <Textarea
                  id="feedback"
                  placeholder="Provide feedback to the student..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setGradeDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleGradeSubmission} 
                  disabled={gradeSubmissionMutation.isPending || !score}
                >
                  {gradeSubmissionMutation.isPending ? 'Grading...' : 'Grade Assignment'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};
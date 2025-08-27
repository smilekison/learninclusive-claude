import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SubmissionFilesView } from '@/components/assignments/SubmissionFilesView';
import { 
  FileText, 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Star,
  MessageSquare,
  Code,
  Link as LinkIcon,
  Eye,
  Download
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface StudentSubmissionViewProps {
  submission: any;
  assignment: any;
  showGrade?: boolean;
  onViewFeedback?: () => void;
  className?: string;
}

export const StudentSubmissionView: React.FC<StudentSubmissionViewProps> = ({
  submission,
  assignment,
  showGrade = true,
  onViewFeedback,
  className = ""
}) => {
  const { toast } = useToast();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [submissionFiles, setSubmissionFiles] = useState<any[]>([]);
  const [submissionMetadata, setSubmissionMetadata] = useState<any>({});

  // Parse submission data
  useEffect(() => {
    if (submission) {
      try {
        const files = submission.file_path ? JSON.parse(submission.file_path) : [];
        setSubmissionFiles(files);
        
        const metadata = submission.submission_metadata ? JSON.parse(submission.submission_metadata) : {};
        setSubmissionMetadata(metadata);
      } catch (error) {
        console.error('Error parsing submission data:', error);
        setSubmissionFiles([]);
        setSubmissionMetadata({});
      }
    }
  }, [submission]);

  const getStatusBadge = () => {
    if (submission.score !== null && submission.score !== undefined) {
      const percentage = (submission.score / assignment.max_score) * 100;
      if (percentage >= 90) return <Badge variant="default" className="bg-green-500">Excellent</Badge>;
      if (percentage >= 80) return <Badge variant="default" className="bg-blue-500">Good</Badge>;
      if (percentage >= 70) return <Badge variant="default" className="bg-yellow-500">Satisfactory</Badge>;
      return <Badge variant="destructive">Needs Improvement</Badge>;
    }
    
    if (submission.submission_status === 'submitted') {
      return <Badge variant="secondary">Submitted - Awaiting Grade</Badge>;
    }
    
    return <Badge variant="outline">Draft</Badge>;
  };

  const getGradeColor = () => {
    if (!submission.score) return 'text-muted-foreground';
    const percentage = (submission.score / assignment.max_score) * 100;
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const downloadSubmissionReport = async () => {
    try {
      // Create a comprehensive submission report
      const reportData = {
        assignment: assignment.title,
        student: 'Current Student',
        submittedAt: submission.submitted_at,
        status: submission.submission_status,
        score: submission.score,
        maxScore: assignment.max_score,
        feedback: submission.feedback,
        textSubmission: submission.submission_text,
        files: submissionFiles,
        metadata: submissionMetadata
      };

      const reportContent = `
ASSIGNMENT SUBMISSION REPORT
============================

Assignment: ${assignment.title}
Submitted: ${formatDate(submission.submitted_at)}
Status: ${submission.submission_status}
${submission.score !== null ? `Grade: ${submission.score}/${assignment.max_score} (${Math.round((submission.score / assignment.max_score) * 100)}%)` : 'Not yet graded'}

${submission.submission_text ? `
TEXT SUBMISSION:
${submission.submission_text}
` : ''}

${submissionFiles.length > 0 ? `
ATTACHED FILES:
${submissionFiles.map(f => `- ${f.name} (${f.type})`).join('\n')}
` : ''}

${submission.feedback ? `
TEACHER FEEDBACK:
${submission.feedback}
` : ''}

${submissionMetadata.notes ? `
STUDENT NOTES:
${submissionMetadata.notes}
` : ''}

${submissionMetadata.timeSpent ? `
Time Spent: ${Math.round(submissionMetadata.timeSpent / 60)} minutes
` : ''}

${submissionMetadata.wordCount ? `
Word Count: ${submissionMetadata.wordCount} words
` : ''}
      `;

      const blob = new Blob([reportContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${assignment.title.replace(/[^a-z0-9]/gi, '_')}_submission_report.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Report Downloaded",
        description: "Your submission report has been downloaded successfully."
      });
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Download Failed",
        description: "Failed to generate submission report.",
        variant: "destructive"
      });
    }
  };

  return (
    <>
      <Card className={`hover:shadow-md transition-shadow ${className}`}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5" />
                {assignment.title}
              </CardTitle>
              <CardDescription>
                Subject: {assignment.subject?.name} • Class: {assignment.subject?.class?.name}
              </CardDescription>
            </div>
            {getStatusBadge()}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Submission Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span>Submitted: {formatDate(submission.submitted_at)}</span>
            </div>
            
            {assignment.due_date && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span>Due: {formatDate(assignment.due_date)}</span>
                {new Date(submission.submitted_at) > new Date(assignment.due_date) && (
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                )}
              </div>
            )}
          </div>

          {/* Grade Display */}
          {showGrade && submission.score !== null && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className={`w-5 h-5 ${getGradeColor()}`} />
                  <span className="font-medium">Grade:</span>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-bold ${getGradeColor()}`}>
                    {submission.score}/{assignment.max_score}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {Math.round((submission.score / assignment.max_score) * 100)}%
                  </div>
                </div>
              </div>
              
              {submission.feedback && (
                <div className="mt-3 pt-3 border-t">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium text-sm">Teacher Feedback:</span>
                  </div>
                  <p className="text-sm text-muted-foreground bg-background p-3 rounded border">
                    {submission.feedback}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Quick Preview */}
          <div className="space-y-3">
            {submission.submission_text && (
              <div>
                <h4 className="text-sm font-medium mb-1">Text Submission Preview:</h4>
                <p className="text-sm text-muted-foreground bg-muted p-3 rounded line-clamp-3">
                  {submission.submission_text}
                </p>
              </div>
            )}

            {submissionFiles.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-1">Attached Files ({submissionFiles.length}):</h4>
                <div className="flex flex-wrap gap-2">
                  {submissionFiles.slice(0, 3).map((file, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {file.name}
                    </Badge>
                  ))}
                  {submissionFiles.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{submissionFiles.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {submissionMetadata.codeContent && (
              <div>
                <h4 className="text-sm font-medium mb-1 flex items-center gap-2">
                  <Code className="w-4 h-4" />
                  Code Submission ({submissionMetadata.codeLanguage || 'Unknown'})
                </h4>
                <div className="bg-muted p-3 rounded text-xs font-mono line-clamp-3">
                  <pre>{submissionMetadata.codeContent}</pre>
                </div>
              </div>
            )}

            {submissionMetadata.links && submissionMetadata.links.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-1 flex items-center gap-2">
                  <LinkIcon className="w-4 h-4" />
                  External Links ({submissionMetadata.links.length})
                </h4>
                <div className="space-y-1">
                  {submissionMetadata.links.slice(0, 2).map((link: string, index: number) => (
                    <a
                      key={index}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline block truncate"
                    >
                      {link}
                    </a>
                  ))}
                  {submissionMetadata.links.length > 2 && (
                    <span className="text-xs text-muted-foreground">
                      +{submissionMetadata.links.length - 2} more links
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDetailsOpen(true)}
              className="flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              View Full Submission
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={downloadSubmissionReport}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download Report
            </Button>

            {submission.score !== null && onViewFeedback && (
              <Button
                variant="outline"
                size="sm"
                onClick={onViewFeedback}
                className="flex items-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                View Detailed Feedback
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Full Submission Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Full Submission Details - {assignment.title}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Submission Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
              <div>
                <span className="text-sm font-medium">Assignment:</span>
                <p className="text-sm text-muted-foreground">{assignment.title}</p>
              </div>
              <div>
                <span className="text-sm font-medium">Subject:</span>
                <p className="text-sm text-muted-foreground">{assignment.subject?.name}</p>
              </div>
              <div>
                <span className="text-sm font-medium">Submitted:</span>
                <p className="text-sm text-muted-foreground">{formatDate(submission.submitted_at)}</p>
              </div>
              <div>
                <span className="text-sm font-medium">Status:</span>
                <div className="mt-1">{getStatusBadge()}</div>
              </div>
            </div>

            {/* Grade and Feedback */}
            {submission.score !== null && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Grade & Feedback</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-lg font-medium">Final Grade:</span>
                    <div className={`text-2xl font-bold ${getGradeColor()}`}>
                      {submission.score}/{assignment.max_score} ({Math.round((submission.score / assignment.max_score) * 100)}%)
                    </div>
                  </div>
                  
                  {submission.feedback && (
                    <div>
                      <h4 className="font-medium mb-2">Teacher Feedback:</h4>
                      <div className="bg-muted p-4 rounded-lg">
                        <p className="text-sm leading-relaxed">{submission.feedback}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Text Submission */}
            {submission.submission_text && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Text Submission</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {submission.submission_text}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* File Attachments */}
            {submissionFiles.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">File Attachments</CardTitle>
                </CardHeader>
                <CardContent>
                  <SubmissionFilesView files={submissionFiles} />
                </CardContent>
              </Card>
            )}

            {/* Code Submission */}
            {submissionMetadata.codeContent && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Code className="w-5 h-5" />
                    Code Submission ({submissionMetadata.codeLanguage || 'Unknown'})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted p-4 rounded-lg">
                    <pre className="text-sm font-mono whitespace-pre-wrap overflow-x-auto">
                      <code>{submissionMetadata.codeContent}</code>
                    </pre>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* External Links */}
            {submissionMetadata.links && submissionMetadata.links.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <LinkIcon className="w-5 h-5" />
                    External Links
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {submissionMetadata.links.map((link: string, index: number) => (
                      <a
                        key={index}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline block"
                      >
                        {link}
                      </a>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Student Notes */}
            {submissionMetadata.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Student Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm leading-relaxed">{submissionMetadata.notes}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Submission Metadata */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Submission Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  {submissionMetadata.timeSpent && (
                    <div>
                      <span className="font-medium">Time Spent:</span>
                      <p className="text-muted-foreground">{Math.round(submissionMetadata.timeSpent / 60)} minutes</p>
                    </div>
                  )}
                  {submissionMetadata.wordCount && (
                    <div>
                      <span className="font-medium">Word Count:</span>
                      <p className="text-muted-foreground">{submissionMetadata.wordCount} words</p>
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Files Attached:</span>
                    <p className="text-muted-foreground">{submissionFiles.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Star, 
  Clock, 
  FileText, 
  CheckCircle, 
  AlertTriangle,
  MessageSquare,
  Award,
  TrendingUp,
  Calendar
} from 'lucide-react';

interface EnhancedGradingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submission: any;
  onGrade: (gradeData: any) => void;
  isLoading: boolean;
}

export const EnhancedGradingDialog: React.FC<EnhancedGradingDialogProps> = ({
  open,
  onOpenChange,
  submission,
  onGrade,
  isLoading
}) => {
  const [score, setScore] = useState('');
  const [feedback, setFeedback] = useState('');
  const [gradingNotes, setGradingNotes] = useState('');
  const [submissionQuality, setSubmissionQuality] = useState<string>('');
  const [timeSpent, setTimeSpent] = useState('');
  const [rubricScores, setRubricScores] = useState<Record<string, number>>({});

  // Mock rubric criteria for demonstration
  const rubricCriteria = [
    { id: 'content', name: 'Content Quality', maxPoints: 25, description: 'Accuracy and depth of content' },
    { id: 'organization', name: 'Organization', maxPoints: 20, description: 'Structure and flow' },
    { id: 'creativity', name: 'Creativity', maxPoints: 25, description: 'Original thinking and innovation' },
    { id: 'presentation', name: 'Presentation', maxPoints: 20, description: 'Clarity and visual appeal' },
    { id: 'grammar', name: 'Grammar & Style', maxPoints: 10, description: 'Language usage and mechanics' }
  ];

  const handleRubricChange = (criteriaId: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setRubricScores(prev => ({
      ...prev,
      [criteriaId]: numValue
    }));
    
    // Auto-calculate total score from rubric
    const total = Object.values({ ...rubricScores, [criteriaId]: numValue })
      .reduce((sum, score) => sum + score, 0);
    setScore(total.toString());
  };

  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getQualityBadgeVariant = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'default';
      case 'good': return 'secondary';
      case 'satisfactory': return 'outline';
      case 'needs_improvement': return 'destructive';
      default: return 'outline';
    }
  };

  const handleSubmit = () => {
    const gradeData = {
      submissionId: submission.id,
      score: parseFloat(score),
      feedback,
      gradingNotes,
      submissionQuality,
      timeSpentMinutes: parseInt(timeSpent) || 0,
      rubricScores: Object.entries(rubricScores).map(([criteriaId, score]) => ({
        criteriaId,
        score,
        criteria: rubricCriteria.find(c => c.id === criteriaId)?.name
      })),
      lateSubmission: submission.due_date ? 
        new Date(submission.submitted_at) > new Date(submission.assignment.due_date) : false
    };
    
    onGrade(gradeData);
  };

  const totalRubricScore = Object.values(rubricScores).reduce((sum, score) => sum + score, 0);
  const maxRubricScore = rubricCriteria.reduce((sum, criteria) => sum + criteria.maxPoints, 0);

  if (!submission) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            Grade Assignment: {submission.assignment.title}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Submission Details */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Submission Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Student:</span>
                  <span className="text-sm">{submission.student.first_name} {submission.student.last_name}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Subject:</span>
                  <span className="text-sm">{submission.assignment.subject.name}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Submitted:</span>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3" />
                    <span className="text-sm">{new Date(submission.submitted_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {submission.assignment.due_date && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Due Date:</span>
                    <div className="flex items-center gap-2">
                      {new Date(submission.submitted_at) > new Date(submission.assignment.due_date) && (
                        <AlertTriangle className="w-3 h-3 text-red-500" />
                      )}
                      <span className="text-sm">{new Date(submission.assignment.due_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                )}

                <Separator />

                <div>
                  <h4 className="text-sm font-medium mb-2">Submission Content:</h4>
                  <div className="bg-muted p-3 rounded-lg text-sm">
                    {submission.submission_text || 'No text submission provided'}
                  </div>
                </div>

                {submission.file_path && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Attached Files:</h4>
                    <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                      <FileText className="w-4 h-4" />
                      <span className="text-sm">{submission.file_path}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Grading Interface */}
          <div className="space-y-4">
            {/* Rubric Grading */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Rubric Assessment
                  </span>
                  <Badge variant="outline">
                    {totalRubricScore}/{maxRubricScore} pts
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {rubricCriteria.map((criteria) => (
                  <div key={criteria.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium">{criteria.name}</Label>
                      <span className="text-xs text-muted-foreground">
                        {rubricScores[criteria.id] || 0}/{criteria.maxPoints}
                      </span>
                    </div>
                    <Input
                      type="number"
                      min="0"
                      max={criteria.maxPoints}
                      value={rubricScores[criteria.id] || ''}
                      onChange={(e) => handleRubricChange(criteria.id, e.target.value)}
                      placeholder="0"
                      className="h-8"
                    />
                    <p className="text-xs text-muted-foreground">{criteria.description}</p>
                    {rubricScores[criteria.id] && (
                      <Progress 
                        value={(rubricScores[criteria.id] / criteria.maxPoints) * 100} 
                        className="h-1"
                      />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Overall Score & Quality */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="score">Final Score</Label>
                <Input
                  id="score"
                  type="number"
                  min="0"
                  max={submission.assignment.max_score}
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Out of {submission.assignment.max_score} points
                </p>
              </div>

              <div>
                <Label>Quality Rating</Label>
                <Select value={submissionQuality} onValueChange={setSubmissionQuality}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select quality" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excellent">Excellent</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="satisfactory">Satisfactory</SelectItem>
                    <SelectItem value="needs_improvement">Needs Improvement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Time Spent */}
            <div>
              <Label htmlFor="timeSpent">Time Spent Grading (minutes)</Label>
              <Input
                id="timeSpent"
                type="number"
                min="0"
                value={timeSpent}
                onChange={(e) => setTimeSpent(e.target.value)}
                placeholder="0"
              />
            </div>

            {/* Feedback */}
            <div>
              <Label htmlFor="feedback">Student Feedback</Label>
              <Textarea
                id="feedback"
                placeholder="Provide constructive feedback for the student..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={3}
              />
            </div>

            {/* Private Notes */}
            <div>
              <Label htmlFor="gradingNotes">Private Grading Notes</Label>
              <Textarea
                id="gradingNotes"
                placeholder="Internal notes for record keeping..."
                value={gradingNotes}
                onChange={(e) => setGradingNotes(e.target.value)}
                rows={2}
              />
            </div>

            {/* Score Preview */}
            {score && (
              <Card className="bg-muted/50">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Grade Preview:</span>
                    <div className="flex items-center gap-2">
                      <Star className={`w-4 h-4 ${getScoreColor(parseFloat(score), submission.assignment.max_score)}`} />
                      <span className={`font-bold ${getScoreColor(parseFloat(score), submission.assignment.max_score)}`}>
                        {score}/{submission.assignment.max_score}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        ({Math.round((parseFloat(score) / submission.assignment.max_score) * 100)}%)
                      </span>
                      {submissionQuality && (
                        <Badge variant={getQualityBadgeVariant(submissionQuality)}>
                          {submissionQuality.replace('_', ' ')}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading || !score}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <Clock className="w-4 h-4 animate-spin" />
                Grading...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Submit Grade
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
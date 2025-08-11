import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  FileText, 
  Users, 
  BookOpen,
  Calendar,
  TrendingUp,
  Clock,
  Target,
  BarChart3,
  CheckCircle,
  AlertCircle,
  Award
} from 'lucide-react';

interface AssignmentDetailViewProps {
  assignment: any;
  subjectInfo: any;
  classInfo: any;
  onBack: () => void;
}

export const AssignmentDetailView: React.FC<AssignmentDetailViewProps> = ({
  assignment,
  subjectInfo,
  classInfo,
  onBack
}) => {
  // Mock data for assignment insights - in real app, this would come from API
  const mockData = {
    totalStudents: classInfo?.enrollment_count || 25,
    submittedCount: 18,
    averageScore: 78,
    completionRate: 72,
    submissionTrend: [
      { day: 'Mon', submissions: 3 },
      { day: 'Tue', submissions: 5 },
      { day: 'Wed', submissions: 8 },
      { day: 'Thu', submissions: 2 },
      { day: 'Fri', submissions: 0 }
    ],
    gradeDistribution: [
      { range: 'A (90-100%)', count: 6, percentage: 33 },
      { range: 'B (80-89%)', count: 7, percentage: 39 },
      { range: 'C (70-79%)', count: 3, percentage: 17 },
      { range: 'D (60-69%)', count: 2, percentage: 11 },
      { range: 'F (0-59%)', count: 0, percentage: 0 }
    ],
    recentSubmissions: [
      { student: 'John Doe', submittedAt: '2024-01-15T10:30:00Z', score: 92 },
      { student: 'Jane Smith', submittedAt: '2024-01-15T09:15:00Z', score: 88 },
      { student: 'Mike Johnson', submittedAt: '2024-01-14T16:45:00Z', score: 76 }
    ]
  };

  const getDaysUntilDue = () => {
    if (!assignment.due_date) return null;
    
    const due = new Date(assignment.due_date);
    const now = new Date();
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 3600 * 24));
    
    return diffDays;
  };

  const daysUntilDue = getDaysUntilDue();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Assignments
        </Button>
      </div>

      {/* Assignment Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <FileText className="w-8 h-8 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">{assignment.title}</CardTitle>
                <CardDescription className="text-base">
                  {subjectInfo?.name} • {classInfo?.name}
                </CardDescription>
              </div>
            </div>
            <Badge variant="secondary" className="text-sm">
              ID: {assignment.id.slice(0, 8)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Description</h4>
              <p className="text-muted-foreground">
                {assignment.description || 'No description available for this assignment.'}
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4" />
                <span>Created: {new Date(assignment.created_at).toLocaleDateString()}</span>
              </div>
              {assignment.due_date && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4" />
                  <span>Due: {new Date(assignment.due_date).toLocaleDateString()}</span>
                  {daysUntilDue !== null && (
                    <Badge variant={daysUntilDue < 0 ? "destructive" : daysUntilDue <= 3 ? "default" : "secondary"}>
                      {daysUntilDue < 0 ? `${Math.abs(daysUntilDue)} days overdue` : 
                       daysUntilDue === 0 ? 'Due today' :
                       `${daysUntilDue} days left`}
                    </Badge>
                  )}
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <Target className="w-4 h-4" />
                <span>Max Score: {assignment.max_score} points</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4" />
                <span>{mockData.totalStudents} students in class</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockData.submittedCount}/{mockData.totalStudents}</div>
            <Progress value={(mockData.submittedCount / mockData.totalStudents) * 100} className="mt-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockData.averageScore}%</div>
            <Progress value={mockData.averageScore} className="mt-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockData.completionRate}%</div>
            <Progress value={mockData.completionRate} className="mt-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {!assignment.due_date && 'No Due Date'}
              {assignment.due_date && daysUntilDue !== null && (
                daysUntilDue < 0 ? 'Overdue' :
                daysUntilDue === 0 ? 'Due Today' :
                daysUntilDue <= 3 ? 'Due Soon' : 'Active'
              )}
            </div>
            <div className="text-sm text-muted-foreground mt-2">
              {mockData.submittedCount} of {mockData.totalStudents} submitted
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grade Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Grade Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockData.gradeDistribution.map((grade, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{grade.range}</span>
                  <span className="text-sm text-muted-foreground">
                    {grade.count} students ({grade.percentage}%)
                  </span>
                </div>
                <Progress value={grade.percentage} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Submissions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Recent Submissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockData.recentSubmissions.map((submission, index) => (
              <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                <div className="flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">{submission.student}</div>
                  <div className="text-sm text-muted-foreground">
                    Submitted: {new Date(submission.submittedAt).toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-green-600">{submission.score}%</div>
                  <div className="text-sm text-muted-foreground">Score</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Assignment Analytics Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Assignment Analytics Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{mockData.submittedCount}</div>
              <div className="text-sm text-muted-foreground">Total Submissions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{mockData.averageScore}%</div>
              <div className="text-sm text-muted-foreground">Class Average</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{mockData.totalStudents - mockData.submittedCount}</div>
              <div className="text-sm text-muted-foreground">Pending Submissions</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
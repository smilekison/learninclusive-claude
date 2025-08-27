import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  BarChart3, 
  Users, 
  Clock, 
  TrendingUp, 
  FileText, 
  Award, 
  Eye,
  Download,
  Share2,
  MessageSquare,
  Target,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
  Timer,
  Gauge,
  Activity,
  BookOpen,
  Brain,
  Shield,
  Star
} from 'lucide-react';

interface EnhancedAssignmentViewProps {
  assignment: any;
  submissions?: any[];
  analytics?: any;
}

export const EnhancedAssignmentView: React.FC<EnhancedAssignmentViewProps> = ({
  assignment,
  submissions = [],
  analytics = {}
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  // Mock analytics data (in real app, this would come from the database)
  const mockAnalytics = {
    totalStudents: 28,
    submitted: submissions.length || 18,
    graded: 12,
    pending: 6,
    averageScore: 78.5,
    completionRate: 64.3,
    averageTimeSpent: 145, // minutes
    submissionTrend: [
      { day: 'Mon', count: 3 },
      { day: 'Tue', count: 7 },
      { day: 'Wed', count: 5 },
      { day: 'Thu', count: 2 },
      { day: 'Fri', count: 1 }
    ],
    gradeDistribution: [
      { range: 'A (90-100%)', count: 6, percentage: 50 },
      { range: 'B (80-89%)', count: 4, percentage: 33 },
      { range: 'C (70-79%)', count: 2, percentage: 17 },
      { range: 'D (60-69%)', count: 0, percentage: 0 },
      { range: 'F (0-59%)', count: 0, percentage: 0 }
    ],
    commonIssues: [
      { issue: 'Late submissions', count: 4 },
      { issue: 'Plagiarism alerts', count: 2 },
      { issue: 'Incomplete work', count: 3 }
    ],
    aiInsights: [
      'Students struggled most with the analytical sections',
      'Average writing quality improved compared to last assignment',
      'Consider providing more examples for future assignments'
    ]
  };

  const stats = { ...mockAnalytics, ...analytics };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'text-blue-600';
      case 'graded': return 'text-green-600';
      case 'overdue': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted': return <Clock className="w-4 h-4" />;
      case 'graded': return <CheckCircle className="w-4 h-4" />;
      case 'overdue': return <XCircle className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{assignment.title}</h1>
          <p className="text-muted-foreground mt-1">{assignment.description}</p>
          <div className="flex items-center gap-4 mt-4">
            <Badge variant="outline" className="flex items-center gap-1">
              <Target className="w-3 h-3" />
              {assignment.max_score} points
            </Badge>
            {assignment.due_date && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Due: {new Date(assignment.due_date).toLocaleDateString()}
              </Badge>
            )}
            <Badge className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {stats.totalStudents} students
            </Badge>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-1" />
            Export Results
          </Button>
          <Button variant="outline" size="sm">
            <Share2 className="w-4 h-4 mr-1" />
            Share
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Submitted</p>
                <p className="text-2xl font-bold">{stats.submitted}</p>
                <p className="text-xs text-muted-foreground">
                  {Math.round((stats.submitted / stats.totalStudents) * 100)}% completion
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Average Score</p>
                <p className="text-2xl font-bold">{stats.averageScore}%</p>
                <p className="text-xs text-green-600">+5% from last assignment</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Award className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Time Spent</p>
                <p className="text-2xl font-bold">{Math.floor(stats.averageTimeSpent / 60)}h {stats.averageTimeSpent % 60}m</p>
                <p className="text-xs text-muted-foreground">Per submission</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Timer className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Graded</p>
                <p className="text-2xl font-bold">{stats.graded}</p>
                <p className="text-xs text-muted-foreground">{stats.pending} pending</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="submissions" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Submissions
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Brain className="w-4 h-4" />
            AI Insights
          </TabsTrigger>
          <TabsTrigger value="issues" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Issues
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Submission Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.submissionTrend.map((day, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{day.day}</span>
                      <div className="flex items-center gap-2 flex-1 mx-4">
                        <Progress value={(day.count / 8) * 100} className="flex-1" />
                        <span className="text-sm text-muted-foreground w-8">{day.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gauge className="w-5 h-5" />
                  Grade Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.gradeDistribution.map((grade, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{grade.range}</span>
                      <div className="flex items-center gap-2 flex-1 mx-4">
                        <Progress value={grade.percentage} className="flex-1" />
                        <span className="text-sm text-muted-foreground w-8">{grade.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Assignment Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="relative inline-flex items-center justify-center w-24 h-24 mb-4">
                    <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        d="M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeDasharray={`${(stats.submitted / stats.totalStudents) * 100}, 100`}
                        className="text-primary"
                      />
                    </svg>
                    <span className="absolute text-xl font-bold">
                      {Math.round((stats.submitted / stats.totalStudents) * 100)}%
                    </span>
                  </div>
                  <p className="text-sm font-medium">Submitted</p>
                  <p className="text-xs text-muted-foreground">{stats.submitted} of {stats.totalStudents}</p>
                </div>

                <div className="text-center">
                  <div className="relative inline-flex items-center justify-center w-24 h-24 mb-4">
                    <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        d="M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeDasharray={`${(stats.graded / stats.submitted) * 100}, 100`}
                        className="text-green-600"
                      />
                    </svg>
                    <span className="absolute text-xl font-bold">
                      {Math.round((stats.graded / stats.submitted) * 100)}%
                    </span>
                  </div>
                  <p className="text-sm font-medium">Graded</p>
                  <p className="text-xs text-muted-foreground">{stats.graded} of {stats.submitted}</p>
                </div>

                <div className="text-center">
                  <div className="relative inline-flex items-center justify-center w-24 h-24 mb-4">
                    <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        d="M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeDasharray={`${stats.averageScore}, 100`}
                        className="text-blue-600"
                      />
                    </svg>
                    <span className="absolute text-xl font-bold">{stats.averageScore}%</span>
                  </div>
                  <p className="text-sm font-medium">Avg Score</p>
                  <p className="text-xs text-green-600">+5% improvement</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="submissions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Recent Submissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { student: 'Alice Johnson', status: 'graded', score: 92, submittedAt: '2 hours ago' },
                  { student: 'Bob Smith', status: 'submitted', score: null, submittedAt: '4 hours ago' },
                  { student: 'Carol Davis', status: 'graded', score: 78, submittedAt: '1 day ago' },
                  { student: 'David Wilson', status: 'overdue', score: null, submittedAt: 'Not submitted' }
                ].map((submission, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback>{submission.student.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{submission.student}</p>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(submission.status)}
                          <span className={`text-sm ${getStatusColor(submission.status)}`}>
                            {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      {submission.score && (
                        <div className="font-bold text-lg">{submission.score}%</div>
                      )}
                      <div className="text-sm text-muted-foreground">{submission.submittedAt}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                AI-Generated Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.aiInsights.map((insight, index) => (
                  <div key={index} className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <Star className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm">{insight}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="issues" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Common Issues
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.commonIssues.map((issue, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 text-orange-500" />
                      <span className="font-medium">{issue.issue}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive">{issue.count}</Badge>
                      <Button variant="outline" size="sm">
                        Review
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
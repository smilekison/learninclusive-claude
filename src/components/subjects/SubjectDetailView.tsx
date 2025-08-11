import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useSubjectDetails } from '@/hooks/useSupabaseQuery';
import { InviteCodeDisplay } from './InviteCodeDisplay';
import { useAuth } from '@/contexts/AuthContext';
import { 
  ArrowLeft, 
  BookOpen, 
  Users, 
  FileText,
  Calendar,
  TrendingUp,
  Award,
  Clock,
  Target,
  BarChart3,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface SubjectDetailViewProps {
  subject: any;
  classInfo: any;
  onBack: () => void;
}

export const SubjectDetailView: React.FC<SubjectDetailViewProps> = ({
  subject,
  classInfo,
  onBack
}) => {
  const { data: subjectDetails, isLoading } = useSubjectDetails(subject?.id);
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Subjects
          </Button>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  const realData = subjectDetails ? {
    ...subjectDetails,
    metrics: subjectDetails.metrics || {
      totalStudents: 0,
      averageGrade: 0,
      completionRate: 0,
      engagementScore: 0,
      totalAssignments: 0,
      totalLessons: 0,
      totalMaterials: 0
    }
  } : {
    enrolledStudents: [],
    assignments: [],
    lessons: [],
    materials: [],
    metrics: {
      totalStudents: 0,
      averageGrade: 0,
      completionRate: 0,
      engagementScore: 0,
      totalAssignments: 0,
      totalLessons: 0,
      totalMaterials: 0
    }
  };

  const mockActivity = [
    { type: 'assignment', title: 'Chapter 5 Quiz', dueDate: '2024-01-20', submitted: 18, total: realData.metrics.totalStudents },
    { type: 'lesson', title: 'Advanced Topics', viewed: 22, total: realData.metrics.totalStudents },
    { type: 'material', title: 'Reference Guide', downloaded: 15, total: realData.metrics.totalStudents }
  ];

  const mockGradeDistribution = [
    { range: 'A (90-100%)', count: 8, percentage: 32 },
    { range: 'B (80-89%)', count: 10, percentage: 40 },
    { range: 'C (70-79%)', count: 5, percentage: 20 },
    { range: 'D (60-69%)', count: 2, percentage: 8 },
    { range: 'F (0-59%)', count: 0, percentage: 0 }
  ];

  const mockWeeklyProgress = [
    { week: 'Week 1', completion: 95 },
    { week: 'Week 2', completion: 88 },
    { week: 'Week 3', completion: 82 },
    { week: 'Week 4', completion: 78 }
  ];

  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Subjects
        </Button>
      </div>

      {/* Subject Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">{subject.name}</CardTitle>
                <CardDescription className="text-base">
                  {classInfo?.name} • {classInfo?.teacher?.first_name} {classInfo?.teacher?.last_name}
                </CardDescription>
              </div>
            </div>
            <Badge variant="secondary" className="text-sm">
              ID: {subject.id.slice(0, 8)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Description</h4>
              <p className="text-muted-foreground break-words">
                {subject.description || 'No description available for this subject.'}
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4" />
                <span>Created: {new Date(subject.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4" />
                <span>Last Updated: {new Date(subject.updated_at).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4" />
                <span>{realData.metrics.totalStudents} students enrolled</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invite Code Display for Teachers */}
      {user?.role === 'teacher' && subject?.invitation_code && (
        <InviteCodeDisplay 
          enrollmentCode={subject.invitation_code}
          className={classInfo?.name || 'Class'}
          subjectName={subject.name}
        />
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Grade</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{realData.metrics.averageGrade}%</div>
            <Progress value={realData.metrics.averageGrade} className="mt-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{realData.metrics.completionRate}%</div>
            <Progress value={realData.metrics.completionRate} className="mt-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Engagement Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{realData.metrics.engagementScore}%</div>
            <Progress value={realData.metrics.engagementScore} className="mt-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{realData.metrics.totalStudents}</div>
            <div className="text-sm text-muted-foreground mt-2">
              {Math.round(realData.metrics.totalStudents * 0.92)} active this week
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Content Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{realData.metrics.totalLessons}</div>
              <div className="text-sm text-muted-foreground">Total Lessons</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{realData.metrics.totalAssignments}</div>
              <div className="text-sm text-muted-foreground">Assignments</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{realData.metrics.totalMaterials}</div>
              <div className="text-sm text-muted-foreground">Materials</div>
            </div>
          </div>
        </CardContent>
      </Card>

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
            {mockGradeDistribution.map((grade, index) => (
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

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockActivity.map((activity, index) => (
              <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                <div className="flex-shrink-0">
                  {activity.type === 'assignment' && <FileText className="w-5 h-5 text-blue-600" />}
                  {activity.type === 'lesson' && <BookOpen className="w-5 h-5 text-green-600" />}
                  {activity.type === 'material' && <Target className="w-5 h-5 text-purple-600" />}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{activity.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {activity.type === 'assignment' && `Due: ${activity.dueDate}`}
                    {activity.type === 'lesson' && 'Video Content'}
                    {activity.type === 'material' && 'Study Material'}
                  </div>
                </div>
                <div className="text-right">
                  {activity.type === 'assignment' && (
                    <div>
                      <div className="font-medium">{activity.submitted}/{activity.total}</div>
                      <div className="text-sm text-muted-foreground">submitted</div>
                    </div>
                  )}
                  {activity.type === 'lesson' && (
                    <div>
                      <div className="font-medium">{activity.viewed}/{activity.total}</div>
                      <div className="text-sm text-muted-foreground">viewed</div>
                    </div>
                  )}
                  {activity.type === 'material' && (
                    <div>
                      <div className="font-medium">{activity.downloaded}/{activity.total}</div>
                      <div className="text-sm text-muted-foreground">downloaded</div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Weekly Progress Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Weekly Progress Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockWeeklyProgress.map((week, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{week.week}</span>
                  <span className="text-sm text-muted-foreground">{week.completion}%</span>
                </div>
                <Progress value={week.completion} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
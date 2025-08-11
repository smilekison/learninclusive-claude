import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  GraduationCap, 
  Mail, 
  Users, 
  BookOpen, 
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target
} from 'lucide-react';

interface StudentDetailViewProps {
  student: any;
  classInfo: any;
  onBack: () => void;
}

export const StudentDetailView: React.FC<StudentDetailViewProps> = ({
  student,
  classInfo,
  onBack
}) => {
  // Mock data for insights - in real app, this would come from API
  const mockInsights = {
    overallGrade: 85,
    attendanceRate: 92,
    assignmentCompletion: 78,
    engagementScore: 88,
    riskLevel: 'Low',
    recentActivity: [
      { type: 'assignment', title: 'Math Quiz #3', status: 'completed', date: '2024-01-15', score: 90 },
      { type: 'video', title: 'Introduction to Algebra', status: 'watched', date: '2024-01-14', progress: 100 },
      { type: 'assignment', title: 'Science Project', status: 'pending', date: '2024-01-12', dueDate: '2024-01-20' }
    ],
    subjects: [
      { name: 'Mathematics', grade: 88, assignments: 12, completed: 10 },
      { name: 'Science', grade: 82, assignments: 8, completed: 7 },
      { name: 'English', grade: 91, assignments: 15, completed: 14 }
    ]
  };

  const getRiskColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Students
        </Button>
      </div>

      {/* Student Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <GraduationCap className="w-8 h-8 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">
                  {student.first_name} {student.last_name}
                </CardTitle>
                <CardDescription className="text-base">
                  Student in {classInfo?.name}
                </CardDescription>
              </div>
            </div>
            <Badge variant="secondary" className="text-sm">
              ID: {student.id.slice(0, 8)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4" />
                <span>{student.user_id || 'No email available'}</span>
              </div>
              {student.parent_email && (
                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4" />
                  <span>Parent: {student.parent_email}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4" />
                <span>Enrolled: {new Date(student.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            {student.disabilities?.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Accessibility Needs</h4>
                <div className="flex flex-wrap gap-1">
                  {student.disabilities.map((disability: string) => (
                    <Badge key={disability} variant="outline" className="text-xs">
                      {disability.replace('_', ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Academic Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Overall Grade</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockInsights.overallGrade}%</div>
            <Progress value={mockInsights.overallGrade} className="mt-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockInsights.attendanceRate}%</div>
            <Progress value={mockInsights.attendanceRate} className="mt-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Assignment Completion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockInsights.assignmentCompletion}%</div>
            <Progress value={mockInsights.assignmentCompletion} className="mt-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Risk Level</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getRiskColor(mockInsights.riskLevel)}`}>
              {mockInsights.riskLevel}
            </div>
            <div className="flex items-center gap-1 mt-2">
              {mockInsights.riskLevel === 'Low' && <CheckCircle className="w-4 h-4 text-green-600" />}
              {mockInsights.riskLevel === 'Medium' && <AlertTriangle className="w-4 h-4 text-yellow-600" />}
              {mockInsights.riskLevel === 'High' && <AlertTriangle className="w-4 h-4 text-red-600" />}
              <span className="text-sm text-muted-foreground">Engagement Score: {mockInsights.engagementScore}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subject Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Subject Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockInsights.subjects.map((subject: any, index: number) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{subject.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {subject.completed}/{subject.assignments} assignments completed
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <Progress value={subject.grade} className="flex-1" />
                  <span className="text-sm font-medium w-12">{subject.grade}%</span>
                </div>
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
            {mockInsights.recentActivity.map((activity: any, index: number) => (
              <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                <div className="flex-shrink-0">
                  {activity.status === 'completed' && <CheckCircle className="w-5 h-5 text-green-600" />}
                  {activity.status === 'watched' && <Target className="w-5 h-5 text-blue-600" />}
                  {activity.status === 'pending' && <Clock className="w-5 h-5 text-yellow-600" />}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{activity.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {activity.type === 'assignment' && 'Assignment'}
                    {activity.type === 'video' && 'Video Content'}
                    {activity.type === 'quiz' && 'Quiz'}
                  </div>
                </div>
                <div className="text-right text-sm">
                  {activity.status === 'completed' && activity.score && (
                    <div className="font-medium text-green-600">{activity.score}%</div>
                  )}
                  {activity.status === 'watched' && activity.progress && (
                    <div className="font-medium text-blue-600">{activity.progress}% watched</div>
                  )}
                  {activity.status === 'pending' && activity.dueDate && (
                    <div className="font-medium text-yellow-600">
                      Due: {new Date(activity.dueDate).toLocaleDateString()}
                    </div>
                  )}
                  <div className="text-muted-foreground">
                    {new Date(activity.date).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
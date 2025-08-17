import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { useParentChildren, useChildAssignments, useChildProgress, useChildSupportData } from '@/hooks/useParentData';
import { 
  Users, 
  BookOpen, 
  Clock, 
  CheckCircle,
  TrendingUp,
  MessageSquare,
  Calendar,
  Award,
  Eye,
  BarChart3,
  GraduationCap,
  AlertCircle,
  Star,
  Target,
  BookMarked,
  Brain,
  Sparkles,
  Trophy,
  Timer,
  Zap,
  Heart,
  ArrowUp,
  ArrowDown,
  Minus,
  ChevronRight,
  Bell,
  Mail,
  Phone,
  Video,
  Shield,
  Lightbulb,
  Smile,
  TrendingDown,
  ArrowRight,
  Activity,
  PieChart,
  LineChart,
  CalendarDays,
  UserCheck,
  FileText,
  Headphones,
  Accessibility
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TTSButton } from '@/components/accessibility/TTSButton';

export const ParentDashboardReal: React.FC = () => {
  const { user } = useAuth();
  const { data: children = [], isLoading: childrenLoading } = useParentChildren();
  const [selectedChild, setSelectedChild] = useState<string>('');
  
  // Use first child by default
  const firstChildId = children[0]?.id;
  const currentChildId = selectedChild || firstChildId;
  
  const { data: assignments = [], isLoading: assignmentsLoading } = useChildAssignments(currentChildId || '');
  const { data: progress, isLoading: progressLoading } = useChildProgress(currentChildId || '');
  const { data: supportData, isLoading: supportLoading } = useChildSupportData(currentChildId || '');
  
  const currentChild = children.find(child => child.id === currentChildId);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <ArrowUp className="w-3 h-3 text-success" />;
      case 'down': return <ArrowDown className="w-3 h-3 text-destructive" />;
      default: return <Minus className="w-3 h-3 text-muted-foreground" />;
    }
  };

  const getGradeColor = (grade: number) => {
    if (grade >= 90) return 'text-success';
    if (grade >= 80) return 'text-info';
    if (grade >= 70) return 'text-warning';
    return 'text-destructive';
  };

  if (childrenLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
          <p className="text-lg text-muted-foreground">Loading your children's information...</p>
        </div>
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <CardTitle>No Children Found</CardTitle>
            <CardDescription>
              We couldn't find any children associated with your account. Please contact the school administrator.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-background via-background to-muted/20 min-h-screen">
      {/* Enhanced Welcome Section with Quick Stats */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent flex items-center gap-3">
                Welcome back, {user?.firstName}!
                <TTSButton text={`Welcome back, ${user?.firstName}! Parent dashboard loaded with comprehensive analytics for your children.`} />
              </h1>
              <p className="text-muted-foreground mt-2 text-lg">
                Your child's learning journey, beautifully visualized
              </p>
            </div>
          </div>

          {/* Quick Action Cards */}
          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <Card className="bg-gradient-to-br from-primary/10 to-primary/20 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-primary">Overall Grade</p>
                    <p className={`text-2xl font-bold ${getGradeColor(progress?.overallGrade || 0)}`}>
                      {progress?.overallGrade || 0}%
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-success/10 to-success/20 border-success/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-success">Assignments</p>
                    <p className="text-2xl font-bold text-success">
                      {progress?.completedAssignments || 0}/{progress?.totalAssignments || 0}
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-success" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-info/10 to-info/20 border-info/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-info">Study Time</p>
                    <p className="text-2xl font-bold text-info">{progress?.timeSpentLearning || 0}h</p>
                  </div>
                  <Timer className="w-8 h-8 text-info" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Communication Quick Access */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Quick Contact Teachers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start gap-3 h-auto py-3">
              <Mail className="w-4 h-4" />
              <div className="text-left">
                <p className="font-medium text-sm">Email Teachers</p>
                <p className="text-xs text-muted-foreground">Send a message</p>
              </div>
            </Button>
            <Button variant="outline" className="w-full justify-start gap-3 h-auto py-3">
              <Video className="w-4 h-4" />
              <div className="text-left">
                <p className="font-medium text-sm">Schedule Meeting</p>
                <p className="text-xs text-muted-foreground">Book a video call</p>
              </div>
            </Button>
            <Button variant="ghost" className="w-full text-sm">
              View All Options <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Child Selection */}
      {children.length > 1 && (
        <Card className="border-none shadow-lg bg-gradient-to-r from-card to-muted/50">
          <CardHeader>
            <CardTitle>Select Child</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 flex-wrap">
              {children.map((child) => (
                <Button
                  key={child.id}
                  variant={currentChildId === child.id ? "default" : "outline"}
                  onClick={() => setSelectedChild(child.id)}
                  className="flex items-center gap-3 h-auto py-3 px-4"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-white">
                      {child.first_name[0]}{child.last_name[0]}
                    </span>
                  </div>
                  <div className="text-left">
                    <p className="font-medium">{child.first_name} {child.last_name}</p>
                    <p className="text-xs opacity-70">{child.relationship_type}</p>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Dashboard Content */}
      {currentChild && (
        <Card className="border-none shadow-xl bg-gradient-to-br from-card via-card to-muted/30">
          <div className="p-6">
            {/* Child Profile Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary via-accent to-primary rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-3xl font-bold text-white">
                      {currentChild.first_name[0]}{currentChild.last_name[0]}
                    </span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-success rounded-full border-2 border-white flex items-center justify-center">
                    <CheckCircle className="w-3 h-3 text-white" />
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">{currentChild.first_name} {currentChild.last_name}</h2>
                  <p className="text-muted-foreground flex items-center gap-2">
                    <GraduationCap className="w-4 h-4" />
                    Active Student • Engaged Learner
                  </p>
                  <p className="text-sm text-accent font-medium mt-1">
                    {currentChild.relationship_type} • Learning Progress Tracked
                  </p>
                </div>
              </div>
              <TTSButton 
                text={`${currentChild.first_name} ${currentChild.last_name}, Active student profile with comprehensive performance analytics`}
                ariaLabel={`Read ${currentChild.first_name}'s profile information`}
              />
            </div>

            <Tabs defaultValue="analytics" className="w-full">
              <TabsList className="grid w-full grid-cols-5 bg-muted/50">
                <TabsTrigger value="analytics" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  Analytics
                </TabsTrigger>
                <TabsTrigger value="assignments" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  Assignments
                </TabsTrigger>
                <TabsTrigger value="progress" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  Progress
                </TabsTrigger>
                <TabsTrigger value="support" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  Support
                </TabsTrigger>
                <TabsTrigger value="activity" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  Activity
                </TabsTrigger>
              </TabsList>

              <TabsContent value="analytics" className="space-y-6 mt-6">
                {progressLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading detailed analytics...</p>
                  </div>
                ) : progress ? (
                  <>
                    {/* Performance Overview */}
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                      <Card className="bg-gradient-to-br from-success/10 to-success/20 border-success/30">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium text-success">Overall Grade</CardTitle>
                          <Trophy className="h-5 w-5 text-success" />
                        </CardHeader>
                        <CardContent>
                          <div className={`text-3xl font-bold mb-1 ${getGradeColor(progress.overallGrade)}`}>
                            {progress.overallGrade}%
                          </div>
                          <p className="text-xs text-success/70 flex items-center gap-1">
                            <ArrowUp className="w-3 h-3" />
                            Based on {progress.completedAssignments} assignments
                          </p>
                        </CardContent>
                      </Card>

                      <Card className="bg-gradient-to-br from-info/10 to-info/20 border-info/30">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium text-info">Completion Rate</CardTitle>
                          <CheckCircle className="h-5 w-5 text-info" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold text-info mb-1">
                            {progress.totalAssignments > 0 ? Math.round((progress.completedAssignments / progress.totalAssignments) * 100) : 0}%
                          </div>
                          <p className="text-xs text-info/70">
                            {progress.completedAssignments} of {progress.totalAssignments} assignments
                          </p>
                        </CardContent>
                      </Card>

                      <Card className="bg-gradient-to-br from-warning/10 to-warning/20 border-warning/30">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium text-warning">Study Time</CardTitle>
                          <Timer className="h-5 w-5 text-warning" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold text-warning mb-1">{progress.timeSpentLearning}h</div>
                          <p className="text-xs text-warning/70">This semester</p>
                        </CardContent>
                      </Card>

                      <Card className="bg-gradient-to-br from-primary/10 to-primary/20 border-primary/30">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium text-primary">On-Time Rate</CardTitle>
                          <CalendarDays className="h-5 w-5 text-primary" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold text-primary mb-1">
                            {progress.totalAssignments > 0 ? Math.round((progress.onTimeSubmissions / progress.totalAssignments) * 100) : 100}%
                          </div>
                          <p className="text-xs text-primary/70">
                            {progress.onTimeSubmissions} on time
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Subject Performance */}
                    <div className="grid gap-6 lg:grid-cols-2">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <PieChart className="w-5 h-5" />
                            Subject Performance
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {progress.subjectPerformance.length > 0 ? progress.subjectPerformance.map((subject, index) => (
                            <div key={index} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-medium">{subject.subject}</span>
                                <div className="flex items-center gap-2">
                                  <span className={`font-bold ${getGradeColor(subject.percentage)}`}>
                                    {subject.percentage}%
                                  </span>
                                  {getTrendIcon(subject.trend)}
                                </div>
                              </div>
                              <Progress value={subject.percentage} className="h-2" />
                              <p className="text-xs text-muted-foreground">
                                {subject.assignmentCount} assignments completed
                              </p>
                            </div>
                          )) : (
                            <p className="text-muted-foreground text-center py-4">No graded assignments yet</p>
                          )}
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <LineChart className="w-5 h-5" />
                            Weekly Activity
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {progress.weeklyProgress.map((day, index) => (
                              <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                                <span className="font-medium">{day.day}</span>
                                <div className="flex items-center gap-4 text-sm">
                                  <span className="flex items-center gap-1">
                                    <BookOpen className="w-3 h-3" />
                                    {day.assignments}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Timer className="w-3 h-3" />
                                    {Math.round(day.timeSpent / 60)}h
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Strengths and Improvements */}
                    <div className="grid gap-6 lg:grid-cols-2">
                      <Card className="bg-gradient-to-br from-success/5 to-success/10 border-success/20">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-success">
                            <Star className="w-5 h-5" />
                            Strengths
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {progress.strengths.length > 0 ? progress.strengths.map((strength, index) => (
                            <div key={index} className="p-3 rounded-lg bg-success/10">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-success">{strength.area}</span>
                                <Badge variant="secondary" className="bg-success/20 text-success">
                                  {strength.score}%
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">{strength.description}</p>
                            </div>
                          )) : (
                            <p className="text-muted-foreground text-center py-4">Building strengths profile...</p>
                          )}
                        </CardContent>
                      </Card>

                      <Card className="bg-gradient-to-br from-warning/5 to-warning/10 border-warning/20">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-warning">
                            <Target className="w-5 h-5" />
                            Growth Areas
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {progress.improvements.length > 0 ? progress.improvements.map((improvement, index) => (
                            <div key={index} className="p-3 rounded-lg bg-warning/10">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-warning">{improvement.area}</span>
                                <Badge variant="secondary" className="bg-warning/20 text-warning">
                                  {improvement.score}%
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">{improvement.description}</p>
                            </div>
                          )) : (
                            <p className="text-muted-foreground text-center py-4">All areas performing well!</p>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <BarChart3 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-lg text-muted-foreground">No academic data available yet</p>
                    <p className="text-sm text-muted-foreground">Check back once assignments are completed</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="assignments" className="space-y-6 mt-6">
                {assignmentsLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading assignments...</p>
                  </div>
                ) : assignments.length > 0 ? (
                  <div className="space-y-4">
                    {assignments.map((assignment) => (
                      <Card key={assignment.id} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{assignment.title}</h3>
                            <p className="text-muted-foreground text-sm mb-2">{assignment.description}</p>
                            <div className="flex items-center gap-4 text-sm">
                              <Badge variant="outline">{assignment.subject?.name}</Badge>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Due: {assignment.due_date ? new Date(assignment.due_date).toLocaleDateString() : 'No due date'}
                              </span>
                              <span className="flex items-center gap-1">
                                <Trophy className="w-3 h-3" />
                                Max: {assignment.max_score} points
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            {assignment.submissions.length > 0 ? (
                              <div>
                                <div className={`text-2xl font-bold ${getGradeColor(assignment.submissions[0].score || 0)}`}>
                                  {assignment.submissions[0].score || 'Pending'}
                                  {assignment.submissions[0].score && `/${assignment.max_score}`}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  Submitted {new Date(assignment.submissions[0].submitted_at).toLocaleDateString()}
                                </p>
                              </div>
                            ) : (
                              <Badge variant="secondary">Not submitted</Badge>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <BookOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-lg text-muted-foreground">No assignments found</p>
                    <p className="text-sm text-muted-foreground">Assignments will appear here once your child is enrolled in classes</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="progress" className="space-y-6 mt-6">
                <div className="grid gap-6">
                  {/* Recent Activity Feed */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="w-5 h-5" />
                        Recent Activity
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {progress?.recentActivity && progress.recentActivity.length > 0 ? (
                        <div className="space-y-4">
                          {progress.recentActivity.map((activity, index) => (
                            <div key={index} className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                              <div className={`p-2 rounded-full ${
                                activity.type === 'achievement' ? 'bg-success/20 text-success' :
                                activity.type === 'assignment' ? 'bg-info/20 text-info' :
                                'bg-muted text-muted-foreground'
                              }`}>
                                {activity.type === 'achievement' ? <Trophy className="w-4 h-4" /> : 
                                 activity.type === 'assignment' ? <CheckCircle className="w-4 h-4" /> :
                                 <BookOpen className="w-4 h-4" />}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium">{activity.title}</h4>
                                <p className="text-sm text-muted-foreground">{activity.description}</p>
                                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                  <span>{activity.timestamp}</span>
                                  {activity.subject && <Badge variant="outline" className="text-xs">{activity.subject}</Badge>}
                                  {activity.late && <Badge variant="destructive" className="text-xs">Late</Badge>}
                                </div>
                              </div>
                              {activity.score && activity.maxScore && (
                                <div className="text-right">
                                  <div className={`font-bold ${getGradeColor((activity.score / activity.maxScore) * 100)}`}>
                                    {activity.score}/{activity.maxScore}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {Math.round((activity.score / activity.maxScore) * 100)}%
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center py-8 text-muted-foreground">No recent activity to show</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="support" className="space-y-6 mt-6">
                {supportLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading support information...</p>
                  </div>
                ) : (
                  <div className="grid gap-6">
                    {/* Accommodations */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Accessibility className="w-5 h-5" />
                          Accommodations
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {supportData?.accommodations && supportData.accommodations.length > 0 ? (
                          <div className="space-y-3">
                            {supportData.accommodations.map((accommodation: any, index: number) => (
                              <div key={index} className="p-3 rounded-lg bg-info/10 border border-info/20">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">{accommodation.accommodation_type}</span>
                                  <Badge variant="secondary">Active</Badge>
                                </div>
                                {accommodation.description && (
                                  <p className="text-sm text-muted-foreground mt-1">{accommodation.description}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-center py-4 text-muted-foreground">No accommodations on file</p>
                        )}
                      </CardContent>
                    </Card>

                    {/* Support Services */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <UserCheck className="w-5 h-5" />
                          Support Services
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {supportData?.supportServices && supportData.supportServices.length > 0 ? (
                          <div className="space-y-3">
                            {supportData.supportServices.map((service: any, index: number) => (
                              <div key={index} className="p-3 rounded-lg bg-success/10 border border-success/20">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">{service.service_type}</span>
                                  <Badge variant="secondary">{service.frequency}</Badge>
                                </div>
                                {service.provider_name && (
                                  <p className="text-sm text-muted-foreground mt-1">Provider: {service.provider_name}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-center py-4 text-muted-foreground">No support services assigned</p>
                        )}
                      </CardContent>
                    </Card>

                    {/* Progress Goals */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Target className="w-5 h-5" />
                          Progress Goals
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {supportData?.progressGoals && supportData.progressGoals.length > 0 ? (
                          <div className="space-y-3">
                            {supportData.progressGoals.map((goal: any, index: number) => (
                              <div key={index} className="p-3 rounded-lg bg-warning/10 border border-warning/20">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-medium">{goal.goal_description}</span>
                                  <Badge variant={goal.is_achieved ? "default" : "secondary"}>
                                    {goal.is_achieved ? "Achieved" : "In Progress"}
                                  </Badge>
                                </div>
                                <Progress value={goal.progress_percentage || 0} className="h-2 mb-2" />
                                <div className="flex justify-between text-xs text-muted-foreground">
                                  <span>Progress: {goal.progress_percentage || 0}%</span>
                                  {goal.target_date && (
                                    <span>Target: {new Date(goal.target_date).toLocaleDateString()}</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-center py-4 text-muted-foreground">No progress goals set</p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="activity" className="space-y-6 mt-6">
                <div className="grid gap-6">
                  {/* Communication Log */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="w-5 h-5" />
                        Teacher Communications
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="p-4 rounded-lg bg-muted/50 border-l-4 border-l-info">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">Weekly Progress Update</span>
                            <span className="text-xs text-muted-foreground">2 days ago</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Your child is making excellent progress in Mathematics. Keep up the great work with homework completion!
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline">Mrs. Johnson</Badge>
                            <Badge variant="outline">Mathematics</Badge>
                          </div>
                        </div>
                        
                        <div className="p-4 rounded-lg bg-muted/50 border-l-4 border-l-success">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">Achievement Recognition</span>
                            <span className="text-xs text-muted-foreground">1 week ago</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Congratulations! Your child received the "Star Student" award for exceptional participation in Science class.
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline">Mr. Davis</Badge>
                            <Badge variant="outline">Science</Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </Card>
      )}
    </div>
  );
};
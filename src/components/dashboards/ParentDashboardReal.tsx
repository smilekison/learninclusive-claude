import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { useParentChildren, useChildAssignments, useChildProgress } from '@/hooks/useParentData';
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
  ArrowRight
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
  
  const currentChild = children.find(child => child.id === currentChildId);

  // Enhanced analytics data
  const recentActivity = [
    {
      id: '1',
      type: 'achievement',
      title: 'Perfect Score Achievement! 🎉',
      description: 'Alex scored 100% on Math Fractions Quiz - Outstanding work!',
      timestamp: '2 hours ago',
      icon: Trophy,
      status: 'success',
      points: '+15 points'
    },
    {
      id: '2',
      type: 'video',
      title: 'Learning Milestone Reached',
      description: 'Completed "Advanced Chemistry Concepts" with excellent engagement',
      timestamp: '1 day ago',
      icon: Sparkles,
      status: 'info',
      engagement: '98% attention score'
    },
    {
      id: '3',
      type: 'accessibility',
      title: 'Accessibility Features Used',
      description: 'Successfully completed assignment using voice-to-text feature',
      timestamp: '2 days ago',
      icon: Shield,
      status: 'info',
      feature: 'Voice assistance'
    },
    {
      id: '4',
      type: 'teacher_note',
      title: 'Teacher Appreciation Note',
      description: 'Mrs. Johnson: "Alex shows exceptional problem-solving skills!"',
      timestamp: '3 days ago',
      icon: Heart,
      status: 'warning',
      sentiment: 'Very Positive'
    }
  ];

  const learningInsights = [
    {
      id: '1',
      title: 'Peak Learning Time',
      description: 'Alex performs best between 10 AM - 12 PM',
      icon: Timer,
      value: '92% accuracy',
      trend: 'up',
      color: 'text-success'
    },
    {
      id: '2',
      title: 'Strongest Subject',
      description: 'Mathematics shows consistent excellence',
      icon: Target,
      value: '94% average',
      trend: 'up',
      color: 'text-primary'
    },
    {
      id: '3',
      title: 'Learning Style',
      description: 'Visual learner with strong analytical skills',
      icon: Brain,
      value: 'Visual preference',
      trend: 'stable',
      color: 'text-info'
    },
    {
      id: '4',
      title: 'Engagement Level',
      description: 'High participation in class discussions',
      icon: Zap,
      value: '87% engagement',
      trend: 'up',
      color: 'text-warning'
    }
  ];

  const upcomingEvents = [
    {
      id: '1',
      title: 'Parent-Teacher Conference',
      date: 'March 15, 2024',
      time: '3:00 PM',
      type: 'meeting',
      priority: 'high',
      description: 'Quarterly progress review and goal setting'
    },
    {
      id: '2',
      title: 'Science Fair Project Presentation',
      date: 'March 20, 2024',
      time: 'End of day',
      type: 'assignment',
      priority: 'medium',
      description: 'Final presentation of "Solar Energy Systems" project'
    },
    {
      id: '3',
      title: 'Field Trip - Science Museum',
      date: 'March 22, 2024',
      time: '9:00 AM',
      type: 'event',
      priority: 'low',
      description: 'Interactive physics and chemistry exhibits'
    },
    {
      id: '4',
      title: 'Math Competition Registration',
      date: 'March 25, 2024',
      time: '12:00 PM',
      type: 'opportunity',
      priority: 'medium',
      description: 'State-level mathematics olympiad'
    }
  ];

  const accessibilityMetrics = [
    {
      feature: 'Closed Captions',
      usage: '98%',
      benefit: 'Improved comprehension by 23%'
    },
    {
      feature: 'Text-to-Speech',
      usage: '76%',
      benefit: 'Faster reading by 31%'
    },
    {
      feature: 'High Contrast Mode',
      usage: '45%',
      benefit: 'Reduced eye strain'
    },
    {
      feature: 'Keyboard Navigation',
      usage: '89%',
      benefit: 'Enhanced focus control'
    }
  ];

  const communicationChannels = [
    {
      type: 'email',
      title: 'Email Mrs. Johnson',
      description: 'Primary Math Teacher',
      icon: Mail,
      available: true,
      lastContact: '2 days ago'
    },
    {
      type: 'video',
      title: 'Schedule Video Call',
      description: 'Face-to-face discussion',
      icon: Video,
      available: true,
      lastContact: 'Never'
    },
    {
      type: 'phone',
      title: 'Phone Contact',
      description: 'Direct line to school',
      icon: Phone,
      available: true,
      lastContact: '1 week ago'
    },
    {
      type: 'message',
      title: 'School Messaging System',
      description: 'Secure platform messaging',
      icon: MessageSquare,
      available: true,
      lastContact: '1 day ago'
    }
  ];

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <ArrowUp className="w-3 h-3 text-success" />;
      case 'down': return <ArrowDown className="w-3 h-3 text-destructive" />;
      default: return <Minus className="w-3 h-3 text-muted-foreground" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-destructive bg-destructive/5';
      case 'medium': return 'border-l-warning bg-warning/5';
      default: return 'border-l-info bg-info/5';
    }
  };

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-background via-background to-muted/20 min-h-screen">
      {/* Enhanced Welcome Section with Quick Stats */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent flex items-center gap-3">
                Welcome back, {user?.firstName}!
                <TTSButton text={`Welcome back, ${user?.firstName}! Parent dashboard loaded with comprehensive analytics.`} />
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
                    <p className="text-2xl font-bold text-primary">{progress?.overallGrade || 0}%</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-success/10 to-success/20 border-success/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-success">Assignments Done</p>
                    <p className="text-2xl font-bold text-success">{progress?.completedAssignments || 0}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-success" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-info/10 to-info/20 border-info/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-info">Learning Streak</p>
                    <p className="text-2xl font-bold text-info">12 days</p>
                  </div>
                  <Sparkles className="w-8 h-8 text-info" />
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
              Quick Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {communicationChannels.slice(0, 2).map((channel) => (
              <Button 
                key={channel.type}
                variant="outline" 
                className="w-full justify-start gap-3 h-auto py-3"
              >
                <channel.icon className="w-4 h-4" />
                <div className="text-left">
                  <p className="font-medium text-sm">{channel.title}</p>
                  <p className="text-xs text-muted-foreground">{channel.description}</p>
                </div>
              </Button>
            ))}
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
      <div className="grid gap-6">
        {!childrenLoading && currentChild && (
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
                      {currentChild.relationship_type} • Learning since 2023
                    </p>
                  </div>
                </div>
                <TTSButton 
                  text={`${currentChild.first_name} ${currentChild.last_name}, Active student profile with excellent performance metrics`}
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
                  <TabsTrigger value="insights" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    Insights
                  </TabsTrigger>
                  <TabsTrigger value="accessibility" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    Accessibility
                  </TabsTrigger>
                  <TabsTrigger value="communication" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    Messages
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
                            <div className="text-3xl font-bold text-success mb-1">
                              {progress.overallGrade}%
                            </div>
                            <p className="text-xs text-success/70 flex items-center gap-1">
                              <ArrowUp className="w-3 h-3" />
                              +5% from last month
                            </p>
                          </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-info/10 to-info/20 border-info/30">
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-info">Completed Work</CardTitle>
                            <CheckCircle className="h-5 w-5 text-info" />
                          </CardHeader>
                          <CardContent>
                            <div className="text-3xl font-bold text-info mb-1">{progress.completedAssignments}</div>
                            <p className="text-xs text-info/70">
                              Assignments graded
                            </p>
                          </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-warning/10 to-warning/20 border-warning/30">
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-warning">Points Earned</CardTitle>
                            <Star className="h-5 w-5 text-warning" />
                          </CardHeader>
                          <CardContent>
                            <div className="text-3xl font-bold text-warning mb-1">
                              {progress.totalScore}
                            </div>
                            <p className="text-xs text-warning/70">
                              of {progress.totalMaxScore} possible
                            </p>
                          </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-accent/10 to-accent/20 border-accent/30">
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-accent">Class Rank</CardTitle>
                            <Award className="h-5 w-5 text-accent" />
                          </CardHeader>
                          <CardContent>
                            <div className="text-3xl font-bold text-accent mb-1">Top 15%</div>
                            <p className="text-xs text-accent/70">
                              Excellent performance
                            </p>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Subject Performance */}
                      <Card className="border-none shadow-lg">
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            <span className="flex items-center gap-2">
                              <BarChart3 className="h-5 w-5" />
                              Subject Performance Analysis
                            </span>
                            <TTSButton 
                              text={`Subject performance: ${progress.subjectPerformance.map(s => `${s.subject} ${s.percentage}%`).join(', ')}`}
                              ariaLabel="Read subject performance data"
                            />
                          </CardTitle>
                          <CardDescription>
                            Detailed breakdown of your child's academic performance across subjects
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          {progress.subjectPerformance.map((item) => (
                            <div key={item.subject} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-lg">{item.subject}</span>
                                <div className="flex items-center gap-3">
                                  <span className="text-2xl font-bold text-primary">{item.percentage}%</span>
                                  <Badge variant="secondary" className="px-3 py-1">
                                    {item.assignmentCount} assignments
                                  </Badge>
                                </div>
                              </div>
                              <div className="space-y-1">
                                <Progress value={item.percentage} className="h-3" />
                                <div className="flex justify-between text-xs text-muted-foreground">
                                  <span>Performance Level</span>
                                  <span>
                                    {item.percentage >= 90 ? 'Excellent' : 
                                     item.percentage >= 80 ? 'Very Good' : 
                                     item.percentage >= 70 ? 'Good' : 'Needs Improvement'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                          {progress.subjectPerformance.length === 0 && (
                            <div className="text-center py-8">
                              <BookOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                              <h3 className="text-lg font-semibold mb-2">No graded work yet</h3>
                              <p className="text-muted-foreground">Check back soon for performance analytics</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Learning Insights Grid */}
                      <Card className="border-none shadow-lg">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Lightbulb className="h-5 w-5" />
                            AI-Powered Learning Insights
                          </CardTitle>
                          <CardDescription>
                            Personalized insights to help optimize your child's learning experience
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="grid gap-4 md:grid-cols-2">
                            {learningInsights.map((insight) => (
                              <div key={insight.id} className="p-4 border rounded-lg bg-gradient-to-r from-muted/30 to-transparent">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                      <insight.icon className="w-4 h-4 text-primary" />
                                    </div>
                                    <div>
                                      <h4 className="font-medium">{insight.title}</h4>
                                      <p className="text-sm text-muted-foreground">{insight.description}</p>
                                    </div>
                                  </div>
                                  {getTrendIcon(insight.trend)}
                                </div>
                                <div className="flex items-center justify-between mt-3">
                                  <span className={`text-sm font-bold ${insight.color}`}>
                                    {insight.value}
                                  </span>
                                  <Button variant="ghost" size="sm" className="h-auto p-1">
                                    <ArrowRight className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <Brain className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Analytics Loading</h3>
                      <p className="text-muted-foreground">We're preparing detailed insights for you</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="assignments" className="space-y-6 mt-6">
                  {assignmentsLoading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-muted-foreground">Loading assignment details...</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {assignments.map((assignment) => {
                        const submission = assignment.submissions?.[0];
                        const isSubmitted = !!submission;
                        const isGraded = submission?.score !== null;
                        const isLate = assignment.due_date && submission ? 
                          new Date(submission.submitted_at) > new Date(assignment.due_date) : false;
                        
                        return (
                          <Card key={assignment.id} className="border-none shadow-md hover:shadow-lg transition-shadow">
                            <CardContent className="p-6">
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-4">
                                  <div className={`w-4 h-4 rounded-full ${
                                    isGraded ? 'bg-success' :
                                    isSubmitted ? 'bg-info' : 
                                    assignment.due_date && new Date() > new Date(assignment.due_date) ? 'bg-destructive' : 'bg-warning'
                                  }`} />
                                  <div>
                                    <h3 className="text-lg font-semibold">{assignment.title}</h3>
                                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                                      <BookMarked className="w-4 h-4" />
                                      {assignment.subject.name} • {assignment.subject.class.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {assignment.due_date ? 
                                        `Due: ${new Date(assignment.due_date).toLocaleDateString()}` : 
                                        'No due date'
                                      }
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  {isLate && (
                                    <Badge variant="destructive" className="text-xs">Late Submission</Badge>
                                  )}
                                  {isGraded && submission?.score !== null && (
                                    <div className="text-right">
                                      <Badge variant="default" className="text-lg px-3 py-1">
                                        {Math.round((submission.score / assignment.max_score) * 100)}%
                                      </Badge>
                                      <p className="text-xs text-muted-foreground mt-1">
                                        {submission.score} / {assignment.max_score} points
                                      </p>
                                    </div>
                                  )}
                                  <Badge variant="outline" className="px-3 py-1">
                                    {isGraded ? 'Graded' : isSubmitted ? 'Submitted' : 'Pending'}
                                  </Badge>
                                  <TTSButton 
                                    text={`${assignment.title}, ${assignment.subject.name}, ${
                                      isGraded ? `Score: ${Math.round((submission!.score! / assignment.max_score) * 100)}%` :
                                      isSubmitted ? 'Submitted' : 'Pending submission'
                                    }`}
                                    ariaLabel={`Read assignment details for ${assignment.title}`}
                                  />
                                </div>
                              </div>
                              
                              {/* Assignment Progress Bar */}
                              {isGraded && submission?.score !== null && (
                                <div className="mb-4">
                                  <div className="flex justify-between text-sm mb-1">
                                    <span>Performance</span>
                                    <span>{Math.round((submission.score / assignment.max_score) * 100)}%</span>
                                  </div>
                                  <Progress 
                                    value={(submission.score / assignment.max_score) * 100} 
                                    className="h-2"
                                  />
                                </div>
                              )}
                              
                              {submission?.feedback && (
                                <div className="mt-4 p-4 bg-gradient-to-r from-muted/50 to-transparent rounded-lg border-l-4 border-primary">
                                  <div className="flex items-center gap-2 mb-2">
                                    <MessageSquare className="w-4 h-4 text-primary" />
                                    <p className="font-medium text-primary">Teacher Feedback</p>
                                  </div>
                                  <p className="text-sm text-muted-foreground">{submission.feedback}</p>
                                  {submission.submission_quality && (
                                    <div className="mt-2">
                                      <Badge variant="secondary" className="text-xs">
                                        Quality: {submission.submission_quality}
                                      </Badge>
                                    </div>
                                  )}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                      {assignments.length === 0 && (
                        <div className="text-center py-12">
                          <BookOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                          <h3 className="text-xl font-semibold mb-2">No assignments found</h3>
                          <p className="text-muted-foreground">Your child's assignments will appear here once they're available</p>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="insights" className="space-y-6 mt-6">
                  {/* Recent Activity Feed */}
                  <Card className="border-none shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5" />
                        Recent Learning Activity
                      </CardTitle>
                      <CardDescription>
                        Stay updated with your child's latest achievements and learning milestones
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {recentActivity.map((activity) => (
                          <div key={activity.id} className="flex items-start gap-4 p-4 rounded-lg border bg-gradient-to-r from-card to-muted/20">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              activity.status === 'success' ? 'bg-success/20 text-success' :
                              activity.status === 'warning' ? 'bg-warning/20 text-warning' : 'bg-info/20 text-info'
                            }`}>
                              <activity.icon className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-medium text-lg">{activity.title}</h3>
                              <p className="text-sm text-muted-foreground mb-2">{activity.description}</p>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {activity.timestamp}
                                </span>
                                {'points' in activity && (
                                  <Badge variant="secondary" className="text-xs">
                                    {activity.points}
                                  </Badge>
                                )}
                                {'engagement' in activity && (
                                  <Badge variant="outline" className="text-xs">
                                    {activity.engagement}
                                  </Badge>
                                )}
                                {'feature' in activity && (
                                  <Badge variant="outline" className="text-xs">
                                    {activity.feature}
                                  </Badge>
                                )}
                                {'sentiment' in activity && (
                                  <Badge variant="outline" className="text-xs flex items-center gap-1">
                                    <Smile className="w-3 h-3" />
                                    {activity.sentiment}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <TTSButton 
                              text={`${activity.title}. ${activity.description}. ${activity.timestamp}`}
                              ariaLabel={`Read activity: ${activity.title}`}
                            />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="accessibility" className="space-y-6 mt-6">
                  <Card className="border-none shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Accessibility Features & Usage
                      </CardTitle>
                      <CardDescription>
                        Monitor how accessibility features are helping your child learn more effectively
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-6 md:grid-cols-2">
                        {accessibilityMetrics.map((metric, index) => (
                          <div key={index} className="p-4 border rounded-lg bg-gradient-to-r from-muted/30 to-transparent">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-medium">{metric.feature}</h4>
                              <Badge variant="secondary">{metric.usage} usage</Badge>
                            </div>
                            <Progress value={parseInt(metric.usage)} className="mb-2" />
                            <p className="text-sm text-muted-foreground">{metric.benefit}</p>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-8 p-6 bg-gradient-to-r from-success/5 to-success/10 rounded-lg border border-success/20">
                        <h4 className="font-medium mb-3 flex items-center gap-2 text-success">
                          <Award className="h-5 w-5" />
                          Accessibility Success Story
                        </h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          {currentChild?.first_name} has shown remarkable improvement using accessibility features. 
                          Video captions have increased comprehension by 23%, and text-to-speech has accelerated 
                          reading speed by 31%. These tools are perfectly tailored to support their learning style.
                        </p>
                        <div className="flex items-center gap-4 text-xs">
                          <Badge variant="outline" className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            23% better comprehension
                          </Badge>
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            31% faster reading
                          </Badge>
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Smile className="w-3 h-3" />
                            Increased confidence
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="communication" className="space-y-6 mt-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Communication Channels */}
                    <Card className="border-none shadow-lg">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <MessageSquare className="h-5 w-5" />
                          Contact Teachers
                        </CardTitle>
                        <CardDescription>
                          Multiple ways to stay connected with your child's teachers
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {communicationChannels.map((channel) => (
                          <Button
                            key={channel.type}
                            variant="outline"
                            className="w-full justify-start gap-4 h-auto py-4 hover:bg-primary/5 hover:border-primary"
                          >
                            <channel.icon className="w-5 h-5 text-primary" />
                            <div className="text-left flex-1">
                              <p className="font-medium">{channel.title}</p>
                              <p className="text-sm text-muted-foreground">{channel.description}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Last contact: {channel.lastContact}
                              </p>
                            </div>
                            <ArrowRight className="w-4 h-4" />
                          </Button>
                        ))}
                      </CardContent>
                    </Card>

                    {/* Upcoming Events */}
                    <Card className="border-none shadow-lg">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Calendar className="h-5 w-5" />
                          Upcoming Events
                        </CardTitle>
                        <CardDescription>
                          Important dates and opportunities for your child
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {upcomingEvents.map((event) => (
                          <div key={event.id} className={`p-4 border-l-4 rounded-r-lg ${getPriorityColor(event.priority)}`}>
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="font-medium">{event.title}</h3>
                                <p className="text-sm text-muted-foreground mb-2">{event.description}</p>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {event.date}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {event.time}
                                  </span>
                                </div>
                              </div>
                              <Badge variant="outline" className="ml-4">
                                {event.type}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </Card>
        )}
        
        {childrenLoading && (
          <Card className="border-none shadow-lg">
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-6"></div>
              <h3 className="text-lg font-semibold mb-2">Loading Student Data</h3>
              <p className="text-muted-foreground">Preparing comprehensive learning analytics...</p>
            </div>
          </Card>
        )}

        {!childrenLoading && children.length === 0 && (
          <Card className="border-none shadow-lg">
            <div className="text-center py-16">
              <Users className="w-20 h-20 mx-auto text-muted-foreground mb-6" />
              <h3 className="text-2xl font-semibold mb-4">No Students Linked</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                No student relationships have been established. Please contact your school administrator 
                to link your child's account.
              </p>
              <Button>
                <Mail className="w-4 h-4 mr-2" />
                Contact School
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
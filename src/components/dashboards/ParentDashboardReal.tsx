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
  Brain
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

  const recentActivity = [
    {
      id: '1',
      type: 'assignment',
      title: 'Math Assignment #5 Completed',
      description: 'Emma scored 95% on fractions worksheet',
      timestamp: '2 hours ago',
      icon: CheckCircle,
      status: 'success'
    },
    {
      id: '2',
      type: 'video',
      title: 'Watched Science Video',
      description: 'Completed "Introduction to Chemistry" with captions',
      timestamp: '1 day ago',
      icon: BookOpen,
      status: 'info'
    },
    {
      id: '3',
      type: 'communication',
      title: 'Teacher Message',
      description: 'Mrs. Johnson sent an update about the upcoming field trip',
      timestamp: '2 days ago',
      icon: MessageSquare,
      status: 'warning'
    }
  ];

  const upcomingEvents = [
    {
      id: '1',
      title: 'Parent-Teacher Conference',
      date: 'March 15, 2024',
      time: '3:00 PM',
      type: 'meeting'
    },
    {
      id: '2',
      title: 'Science Fair Project Due',
      date: 'March 20, 2024',
      time: 'End of day',
      type: 'assignment'
    },
    {
      id: '3',
      title: 'Field Trip - Natural History Museum',
      date: 'March 22, 2024',
      time: '9:00 AM',
      type: 'event'
    }
  ];

  const accessibilityFeatures = [
    'High contrast mode enabled',
    'Screen reader compatibility',
    'Keyboard navigation support',
    'Video captions and transcripts',
    'Text-to-speech functionality'
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            Welcome back, {user?.firstName}!
            <TTSButton text={`Welcome back, ${user?.firstName}! Parent dashboard loaded.`} />
          </h1>
          <p className="text-muted-foreground mt-2">
            Track your child's learning progress and stay connected with their education
          </p>
        </div>
        <Button variant="outline">
          <MessageSquare className="w-4 h-4 mr-2" />
          Contact Teachers
        </Button>
      </div>

      {/* Child Selection */}
      {children.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Child</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              {children.map((child) => (
                <Button
                  key={child.id}
                  variant={currentChildId === child.id ? "default" : "outline"}
                  onClick={() => setSelectedChild(child.id)}
                  className="flex items-center gap-2"
                >
                  <div className="w-6 h-6 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-white">
                      {child.first_name[0]}{child.last_name[0]}
                    </span>
                  </div>
                  {child.first_name} {child.last_name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Child Overview Cards */}
      <div className="grid gap-6">
        {!childrenLoading && currentChild && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">
                    {currentChild.first_name[0]}{currentChild.last_name[0]}
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground">{currentChild.first_name} {currentChild.last_name}</h2>
                  <p className="text-muted-foreground">Student • Active</p>
                  <p className="text-sm text-muted-foreground">{currentChild.relationship_type}</p>
                </div>
              </div>
              <TTSButton 
                text={`${currentChild.first_name} ${currentChild.last_name}, Student profile`}
                ariaLabel={`Read ${currentChild.first_name}'s information`}
              />
            </div>

            <Tabs defaultValue="progress" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="progress">Progress</TabsTrigger>
                <TabsTrigger value="assignments">Assignments</TabsTrigger>
                <TabsTrigger value="accessibility">Accessibility</TabsTrigger>
                <TabsTrigger value="communication">Communication</TabsTrigger>
              </TabsList>

              <TabsContent value="progress" className="space-y-4">
                {progressLoading ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Loading progress data...</p>
                  </div>
                ) : progress ? (
                  <>
                    <div className="grid gap-4 md:grid-cols-3">
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Overall Grade</CardTitle>
                          <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-success">
                            {progress.overallGrade}%
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Current average
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Assignments Completed</CardTitle>
                          <CheckCircle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{progress.completedAssignments}</div>
                          <p className="text-xs text-muted-foreground">
                            Total graded
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Total Points</CardTitle>
                          <Star className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{progress.totalScore}/{progress.totalMaxScore}</div>
                          <p className="text-xs text-muted-foreground">
                            Points earned
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          Subject Performance
                          <TTSButton 
                            text={`Subject performance: ${progress.subjectPerformance.map(s => `${s.subject} ${s.percentage}%`).join(', ')}`}
                            ariaLabel="Read subject performance data"
                          />
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {progress.subjectPerformance.map((item) => (
                          <div key={item.subject} className="flex items-center justify-between">
                            <span className="text-sm font-medium">{item.subject}</span>
                            <div className="flex items-center gap-3">
                              <Progress value={item.percentage} className="w-24" />
                              <span className="text-sm font-bold w-12">{item.percentage}%</span>
                              <Badge variant="outline">
                                {item.assignmentCount} assignments
                              </Badge>
                            </div>
                          </div>
                        ))}
                        {progress.subjectPerformance.length === 0 && (
                          <p className="text-center text-muted-foreground py-4">
                            No graded assignments yet
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No progress data available</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="assignments" className="space-y-4">
                {assignmentsLoading ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Loading assignments...</p>
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
                        <Card key={assignment.id}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`w-3 h-3 rounded-full ${
                                  isGraded ? 'bg-success' :
                                  isSubmitted ? 'bg-info' : 
                                  assignment.due_date && new Date() > new Date(assignment.due_date) ? 'bg-destructive' : 'bg-warning'
                                }`} />
                                <div>
                                  <h3 className="font-medium">{assignment.title}</h3>
                                  <p className="text-sm text-muted-foreground">
                                    {assignment.subject.name} • {assignment.subject.class.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {assignment.due_date ? 
                                      `Due: ${new Date(assignment.due_date).toLocaleDateString()}` : 
                                      'No due date'
                                    }
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {isLate && (
                                  <Badge variant="destructive" className="text-xs">Late</Badge>
                                )}
                                {isGraded && submission?.score !== null && (
                                  <Badge variant="default">
                                    {Math.round((submission.score / assignment.max_score) * 100)}%
                                  </Badge>
                                )}
                                <Badge variant="outline">
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
                            {submission?.feedback && (
                              <div className="mt-3 p-3 bg-muted rounded-lg">
                                <p className="text-sm font-medium mb-1">Teacher Feedback:</p>
                                <p className="text-sm text-muted-foreground">{submission.feedback}</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                    {assignments.length === 0 && (
                      <div className="text-center py-8">
                        <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No assignments found</h3>
                        <p className="text-muted-foreground">No assignments have been assigned yet</p>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="accessibility" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5" />
                      Accessibility Features in Use
                    </CardTitle>
                    <CardDescription>
                      Features currently helping your child learn more effectively
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {accessibilityFeatures.map((feature, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <CheckCircle className="h-4 w-4 text-success" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        Learning Accommodations
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {currentChild?.first_name} uses video captions and slower playback speeds for better comprehension. 
                        They have completed 95% of video content with these accessibility features enabled.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="communication" className="space-y-4">
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <Card key={activity.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            activity.status === 'success' ? 'bg-success/10' :
                            activity.status === 'warning' ? 'bg-warning/10' : 'bg-info/10'
                          }`}>
                            <activity.icon className={`h-4 w-4 ${
                              activity.status === 'success' ? 'text-success' :
                              activity.status === 'warning' ? 'text-warning' : 'text-info'
                            }`} />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium">{activity.title}</h3>
                            <p className="text-sm text-muted-foreground mb-1">{activity.description}</p>
                            <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                          </div>
                          <TTSButton 
                            text={`${activity.title}. ${activity.description}. ${activity.timestamp}`}
                            ariaLabel={`Read activity: ${activity.title}`}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        )}
        
        {childrenLoading && (
          <Card className="p-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading children data...</p>
            </div>
          </Card>
        )}

        {!childrenLoading && children.length === 0 && (
          <Card className="p-6">
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No children found</h3>
              <p className="text-muted-foreground">No student relationships have been established</p>
            </div>
          </Card>
        )}
      </div>

      {/* Upcoming Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Events
            </span>
            <TTSButton 
              text="Upcoming events section loaded"
              ariaLabel="Read upcoming events"
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {upcomingEvents.map((event) => (
              <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h3 className="font-medium">{event.title}</h3>
                  <p className="text-sm text-muted-foreground">{event.date} at {event.time}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{event.type}</Badge>
                  <TTSButton 
                    text={`${event.title}, ${event.date} at ${event.time}`}
                    ariaLabel={`Read event details for ${event.title}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
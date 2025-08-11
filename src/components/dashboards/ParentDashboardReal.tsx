import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
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
  AlertCircle
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TTSButton } from '@/components/accessibility/TTSButton';

export const ParentDashboardReal: React.FC = () => {
  const { user } = useAuth();
  
  // Mock data for parent dashboard
  const children = [
    {
      id: '1',
      name: 'Emma Thompson',
      grade: 'Grade 5',
      class: 'Mrs. Johnson\'s Class',
      school: 'Lincoln Elementary',
      profilePicture: '/placeholder.svg'
    }
  ];

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

      {/* Child Overview Cards */}
      <div className="grid gap-6">
        {children.map((child) => (
          <Card key={child.id} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">
                    {child.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground">{child.name}</h2>
                  <p className="text-muted-foreground">{child.grade} • {child.class}</p>
                  <p className="text-sm text-muted-foreground">{child.school}</p>
                </div>
              </div>
              <TTSButton 
                text={`${child.name}, ${child.grade}, ${child.class}, ${child.school}`}
                ariaLabel={`Read ${child.name}'s information`}
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
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Overall Grade</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-success">A-</div>
                      <p className="text-xs text-muted-foreground">
                        +2% from last month
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Assignments Completed</CardTitle>
                      <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">18/20</div>
                      <Progress value={90} className="mt-2" />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Video Learning Hours</CardTitle>
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">24.5hrs</div>
                      <p className="text-xs text-muted-foreground">
                        This month
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      Subject Performance
                      <TTSButton 
                        text="Subject performance overview: Mathematics 95%, Science 92%, Language Arts 89%, Social Studies 87%"
                        ariaLabel="Read subject performance data"
                      />
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { subject: 'Mathematics', score: 95, trend: '+3%' },
                      { subject: 'Science', score: 92, trend: '+1%' },
                      { subject: 'Language Arts', score: 89, trend: '-1%' },
                      { subject: 'Social Studies', score: 87, trend: '+2%' }
                    ].map((item) => (
                      <div key={item.subject} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{item.subject}</span>
                        <div className="flex items-center gap-3">
                          <Progress value={item.score} className="w-24" />
                          <span className="text-sm font-bold w-8">{item.score}%</span>
                          <Badge variant={item.trend.startsWith('+') ? 'default' : 'secondary'}>
                            {item.trend}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="assignments" className="space-y-4">
                <div className="space-y-4">
                  {[
                    { title: 'Math: Fractions Worksheet', due: 'Due Tomorrow', status: 'pending', score: null },
                    { title: 'Science: Plant Growth Lab Report', due: 'Submitted', status: 'completed', score: 95 },
                    { title: 'Reading: Book Report on "Wonder"', due: 'Due in 3 days', status: 'in-progress', score: null },
                    { title: 'History: Timeline Project', due: 'Submitted', status: 'completed', score: 92 }
                  ].map((assignment, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${
                              assignment.status === 'completed' ? 'bg-success' :
                              assignment.status === 'pending' ? 'bg-warning' : 'bg-info'
                            }`} />
                            <div>
                              <h3 className="font-medium">{assignment.title}</h3>
                              <p className="text-sm text-muted-foreground">{assignment.due}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {assignment.score && (
                              <Badge variant="default">{assignment.score}%</Badge>
                            )}
                            <TTSButton 
                              text={`${assignment.title}, ${assignment.due}${assignment.score ? `, Score: ${assignment.score}%` : ''}`}
                              ariaLabel={`Read assignment details for ${assignment.title}`}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
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
                        Emma uses video captions and slower playback speeds for better comprehension. 
                        She has completed 95% of video content with these accessibility features enabled.
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
        ))}
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
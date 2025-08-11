import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Users, GraduationCap, BookOpen, School, TrendingUp, TrendingDown, BarChart3, Bell, CheckCircle, Clock } from 'lucide-react';
import { EngagementInsights } from './EngagementInsights';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePrincipalStats, useClasses, useProfiles, useSupabaseMutation, useNotifications } from '@/hooks/useSupabaseQuery';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Truncate } from '@/components/ui/truncate';

export const PrincipalDashboardReal: React.FC = () => {
  const { user } = useAuth();
  const { data: stats } = usePrincipalStats();
  const { data: classes, refetch: refetchClasses } = useClasses();
  const { data: teachers } = useProfiles('teacher');
  
  const { data: notifications } = useNotifications();

  const [newTeacher, setNewTeacher] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  });

  const [newClass, setNewClass] = useState({
    name: '',
    description: '',
    teacherId: ''
  });

  const [isTeacherDialogOpen, setIsTeacherDialogOpen] = useState(false);
  const [isClassDialogOpen, setIsClassDialogOpen] = useState(false);
  const [isReportsDialogOpen, setIsReportsDialogOpen] = useState(false);


  // Fixed teacher creation using create_demo_user function
  const addTeacherMutation = useSupabaseMutation(
    async (teacherData: typeof newTeacher) => {
      const { data, error } = await supabase.rpc('create_demo_user', {
        user_email: teacherData.email,
        user_password: teacherData.password,
        user_first_name: teacherData.firstName,
        user_last_name: teacherData.lastName,
        user_role: 'teacher'
      });
      
      if (error) throw error;
      return { data, error: null };
    },
    {
      successMessage: 'Teacher added successfully!',
      invalidateKeys: [['profiles', 'teacher'], ['principal-stats']],
      onSuccess: () => {
        setNewTeacher({ firstName: '', lastName: '', email: '', password: '' });
        setIsTeacherDialogOpen(false);
      }
    }
  );

  // Fixed class creation - removed hardcoded school_id
  const addClassMutation = useSupabaseMutation(
    async (classData: typeof newClass) => {
      return await supabase.from('classes').insert({
        name: classData.name,
        description: classData.description,
        teacher_id: classData.teacherId || null
      });
    },
    {
      successMessage: 'Class created successfully!',
      invalidateKeys: [['classes'], ['principal-stats']],
      onSuccess: () => {
        setNewClass({ name: '', description: '', teacherId: '' });
        setIsClassDialogOpen(false);
        refetchClasses();
      }
    }
  );

  // Mark notification as read
  const markNotificationReadMutation = useSupabaseMutation(
    async (notificationId: string) => {
      return await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);
    },
    {
      invalidateKeys: [['notifications']]
    }
  );

  const handleAddTeacher = () => {
    if (!newTeacher.email || !newTeacher.password || !newTeacher.firstName || !newTeacher.lastName) {
      return;
    }
    addTeacherMutation.mutate(newTeacher);
  };

  const handleAddClass = () => {
    if (!newClass.name) {
      return;
    }
    addClassMutation.mutate(newClass);
  };

  const handleMarkNotificationRead = (notificationId: string) => {
    markNotificationReadMutation.mutate(notificationId);
  };

  // Calculate unread notifications
  const unreadNotifications = notifications?.filter((n: any) => !n.read) || [];

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Section */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-primary">
          Welcome, {user?.firstName} {user?.lastName}
        </h1>
        <p className="text-muted-foreground">
          Here's an overview of your school's performance and recent activities.
        </p>
      </div>

      {/* Statistics Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card 
          className="cursor-pointer hover:shadow-md transition-all hover:scale-105"
          onClick={() => window.location.href = '/teachers'}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalTeachers || 0}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              +2 from last month
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-all hover:scale-105"
          onClick={() => window.location.href = '/classes'}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Classes</CardTitle>
            <School className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalClasses || 0}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              +1 from last month
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-all hover:scale-105"
          onClick={() => window.location.href = '/students'}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalStudents || 0}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
              -3 from last month
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-all hover:scale-105"
          onClick={() => window.location.href = '/subjects'}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subjects</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalSubjects || 0}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              +4 from last month
            </div>
          </CardContent>
        </Card>
      </div>


      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Perform common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Dialog open={isTeacherDialogOpen} onOpenChange={setIsTeacherDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Teacher
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Teacher</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={newTeacher.firstName}
                        onChange={(e) => setNewTeacher({ ...newTeacher, firstName: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={newTeacher.lastName}
                        onChange={(e) => setNewTeacher({ ...newTeacher, lastName: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newTeacher.email}
                      onChange={(e) => setNewTeacher({ ...newTeacher, email: e.target.value })}
                      placeholder="teacher@gmail.com"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={newTeacher.password}
                      onChange={(e) => setNewTeacher({ ...newTeacher, password: e.target.value })}
                      placeholder="Minimum 6 characters"
                      required
                    />
                  </div>
                  <Button 
                    onClick={handleAddTeacher}
                    disabled={addTeacherMutation.isPending || !newTeacher.email || !newTeacher.password || !newTeacher.firstName || !newTeacher.lastName}
                    className="w-full"
                  >
                    {addTeacherMutation.isPending ? 'Adding...' : 'Add Teacher'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isClassDialogOpen} onOpenChange={setIsClassDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create Class
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Class</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="className">Class Name</Label>
                    <Input
                      id="className"
                      value={newClass.name}
                      onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                      placeholder="e.g., Grade 11 Physics"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="classDescription">Description</Label>
                    <Textarea
                      id="classDescription"
                      value={newClass.description}
                      onChange={(e) => setNewClass({ ...newClass, description: e.target.value })}
                      placeholder="Brief description of the class"
                    />
                  </div>
                  <div>
                    <Label htmlFor="teacher">Assign Teacher (Optional)</Label>
                    <Select value={newClass.teacherId} onValueChange={(value) => setNewClass({ ...newClass, teacherId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a teacher" />
                      </SelectTrigger>
                      <SelectContent>
                        {teachers?.map((teacher: any) => (
                          <SelectItem key={teacher.id} value={teacher.id}>
                            {teacher.first_name} {teacher.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    onClick={handleAddClass}
                    disabled={addClassMutation.isPending || !newClass.name}
                    className="w-full"
                  >
                    {addClassMutation.isPending ? 'Creating...' : 'Create Class'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isReportsDialogOpen} onOpenChange={setIsReportsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  View Reports
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>School Reports & Analytics</DialogTitle>
                </DialogHeader>
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="students">Students</TabsTrigger>
                    <TabsTrigger value="teachers">Teachers</TabsTrigger>
                    <TabsTrigger value="classes">Classes</TabsTrigger>
                  </TabsList>
                  <TabsContent value="overview" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Enrollment Rate</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">87%</div>
                          <p className="text-xs text-muted-foreground">+5% from last term</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Average Class Size</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">24</div>
                          <p className="text-xs text-muted-foreground">Optimal range: 20-25</p>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                  <TabsContent value="students" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Student Performance</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Average Grade</span>
                            <span className="font-medium">B+</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Assignment Completion Rate</span>
                            <span className="font-medium">92%</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Attendance Rate</span>
                            <span className="font-medium">96%</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  <TabsContent value="teachers" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Teacher Activity</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Active Teachers</span>
                            <span className="font-medium">{stats?.totalTeachers || 0}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Avg Assignments/Teacher</span>
                            <span className="font-medium">12</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Response Time</span>
                            <span className="font-medium">2.3 days</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  <TabsContent value="classes" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Class Statistics</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Active Classes</span>
                            <span className="font-medium">{stats?.totalClasses || 0}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Classes with Teachers</span>
                            <span className="font-medium">{classes?.filter((c: any) => c.teacher_id).length || 0}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Total Subjects</span>
                            <span className="font-medium">{stats?.totalSubjects || 0}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Insights Card */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Engagement & Risk Insights
          </CardTitle>
          <CardDescription>
            Monitor teacher, class, and subject-wise engagement levels and identify at-risk areas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-success">85%</div>
              <div className="text-xs text-muted-foreground">Average Engagement</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-warning">12</div>
              <div className="text-xs text-muted-foreground">Medium Risk Items</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-destructive">3</div>
              <div className="text-xs text-muted-foreground">High Risk Items</div>
            </div>
          </div>
          <Button 
            onClick={() => window.location.href = '/insights'} 
            className="w-full"
          >
            View Detailed Insights
          </Button>
        </CardContent>
      </Card>

      {/* Recent Classes and Real Notifications */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Classes</CardTitle>
              <CardDescription>Overview of class activities</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => window.location.href = '/classes'}>View All</Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {classes?.slice(0, 4).map((classItem: any) => (
                <div key={classItem.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="min-w-0">
                    <Truncate lines={1} className="font-medium">{classItem.name}</Truncate>
                    <Truncate lines={1} className="text-sm text-muted-foreground">
                      Teacher: {classItem.teacher?.first_name} {classItem.teacher?.last_name} | Code: {classItem.enrollment_code}
                    </Truncate>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{classItem.subjects?.length || 0} subjects</p>
                    <Badge variant="secondary">Active</Badge>
                  </div>
                </div>
              ))}
              {!classes?.length && (
                <p className="text-center text-muted-foreground py-8">No classes created yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Notifications
                {unreadNotifications.length > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {unreadNotifications.length}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>Recent system notifications</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => window.location.href = '/insights'}>View All</Button>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-4">
                {notifications?.slice(0, 10).map((notification: any) => (
                  <div 
                    key={notification.id} 
                    className={`flex items-start justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                      !notification.read ? 'bg-muted/50 border-primary/20' : ''
                    }`}
                    onClick={() => !notification.read && handleMarkNotificationRead(notification.id)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 min-w-0">
                        {notification.type === 'success' ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : notification.type === 'warning' ? (
                          <Clock className="h-4 w-4 text-yellow-500" />
                        ) : (
                          <Bell className="h-4 w-4 text-blue-500" />
                        )}
                        <Truncate lines={1} className="font-medium text-sm flex-1">{notification.title}</Truncate>
                        {!notification.read && (
                          <Badge variant="secondary" className="text-xs">New</Badge>
                        )}
                      </div>
                      <Truncate lines={2} className="text-sm text-muted-foreground">{notification.message}</Truncate>
                    </div>
                    <p className="text-xs text-muted-foreground ml-2">
                      {new Date(notification.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
                {!notifications?.length && (
                  <p className="text-center text-muted-foreground py-8">No notifications yet</p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Accessibility Notice */}
      <Card className="border-accent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Accessibility Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Our platform is designed with accessibility in mind, featuring WCAG compliance, 
            screen reader support, and keyboard navigation to ensure all students can learn effectively.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
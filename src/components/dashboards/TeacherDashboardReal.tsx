import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { 
  useTeacherClasses, 
  useTeacherSubjects, 
  useActiveAssignments, 
  useTeacherStudents,
  useUnreadNotifications,
  useRecentSubmissions,
  useSupabaseMutation,
  useTeacherStats
} from '@/hooks/useSupabaseQuery';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, 
  BookOpen, 
  Clock, 
  CheckCircle,
  Plus,
  Eye,
  Edit,
  Calendar,
  Bell,
  BarChart3,
  GraduationCap,
  School,
  TrendingUp,
  FileText,
  ChevronRight,
  AlertCircle,
  Copy
} from 'lucide-react';
import { EngagementInsights } from './EngagementInsights';
import { SubjectEnrollmentManager } from '@/components/teachers/SubjectEnrollmentManager';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNavigate } from 'react-router-dom';
import { SubjectEnrollmentRequestsManager } from '@/components/teachers/SubjectEnrollmentRequestsManager';
import { useToast } from '@/hooks/use-toast';
import { useTeacherAssignmentAnalytics } from '@/hooks/useAssignmentAnalytics';
import { ChartContainer, ChartTooltipContent, ChartTooltip } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';


export const TeacherDashboardReal: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Use teacher-specific hooks
  const { data: teacherClasses = [], isLoading: classesLoading, error: classesError } = useTeacherClasses();
  const { data: teacherSubjects = [], isLoading: subjectsLoading, error: subjectsError } = useTeacherSubjects();
  const { data: activeAssignments = [], isLoading: assignmentsLoading } = useActiveAssignments();
  const { data: teacherStudents = [], isLoading: studentsLoading } = useTeacherStudents();
  const { data: unreadNotifications = [] } = useUnreadNotifications();
  const { data: recentSubmissions = [] } = useRecentSubmissions(5);
  const { data: stats } = useTeacherStats();
  const { data: tAssignmentAnalytics } = useTeacherAssignmentAnalytics();

  
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [newSubject, setNewSubject] = useState({ name: '', description: '', classId: '' });
  const [newAssignment, setNewAssignment] = useState({ 
    title: '', 
    description: '', 
    subjectId: '', 
    dueDate: '',
    maxScore: 100 
  });
  const [newStudent, setNewStudent] = useState({
    firstName: '',
    lastName: '',
    email: '',
    parentEmail: '',
    classId: '',
    password: 'demo123'
  });

  const [isSubjectDialogOpen, setIsSubjectDialogOpen] = useState(false);
  const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false);
  const [isStudentDialogOpen, setIsStudentDialogOpen] = useState(false);
  const [isReportsDialogOpen, setIsReportsDialogOpen] = useState(false);
  const [notificationPage, setNotificationPage] = useState(0);

  const createSubjectMutation = useSupabaseMutation(
    async (data: any) => await supabase.from('subjects').insert(data).select().single(),
    {
      successMessage: "Subject created successfully",
      invalidateKeys: [['teacher-subjects'], ['subjects'], ['teacher-stats']],
      onSuccess: () => {
        setNewSubject({ name: '', description: '', classId: '' });
        setIsSubjectDialogOpen(false);
      }
    }
  );

  const createAssignmentMutation = useSupabaseMutation(
    async (data: any) => await supabase.from('assignments').insert(data).select().single(),
    {
      successMessage: "Assignment created successfully",
      invalidateKeys: [['active-assignments'], ['teacher-assignments'], ['assignments'], ['teacher-stats'], ['teacher-assignment-analytics']],
      onSuccess: () => {
        setNewAssignment({ title: '', description: '', subjectId: '', dueDate: '', maxScore: 100 });
        setIsAssignmentDialogOpen(false);
      }
    }
  );

  const addStudentMutation = useSupabaseMutation(
    async (studentData: typeof newStudent) => {
      // Create student user account directly with demo123 password
      const { data, error } = await supabase.rpc('create_demo_user', {
        user_email: studentData.email,
        user_password: 'demo123', // Default password for all students
        user_first_name: studentData.firstName,
        user_last_name: studentData.lastName,
        user_role: 'student'
      });
      
      if (error) throw error;
      
      // If parent email provided, also create parent account
      if (studentData.parentEmail) {
        try {
          await supabase.rpc('create_demo_user', {
            user_email: studentData.parentEmail,
            user_password: 'demo123', // Default password for parents too
            user_first_name: 'Parent of',
            user_last_name: studentData.firstName,
            user_role: 'parent'
          });
        } catch (parentError) {
          console.log('Parent account creation failed (may already exist):', parentError);
          // Don't fail the whole operation if parent creation fails
        }
      }
      
      return { data, error: null };
    },
    {
      successMessage: "Student account created successfully. Login: email / demo123",
      invalidateKeys: [['teacher-students'], ['teacher-stats']],
      onSuccess: () => {
        setNewStudent({ firstName: '', lastName: '', email: '', parentEmail: '', classId: '', password: 'demo123' });
        setIsStudentDialogOpen(false);
      }
    }
  );

  const markNotificationReadMutation = useSupabaseMutation(
    async (notificationId: string) => {
      return await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);
    },
    {
      invalidateKeys: [['unread-notifications']]
    }
  );

  const handleCreateSubject = async () => {
    if (!newSubject.name || !newSubject.classId) return;
    
    await createSubjectMutation.mutateAsync({
      name: newSubject.name,
      description: newSubject.description,
      class_id: newSubject.classId
    });
  };

  const handleCreateAssignment = async () => {
    if (!newAssignment.title || !newAssignment.subjectId) return;
    
    await createAssignmentMutation.mutateAsync({
      title: newAssignment.title,
      description: newAssignment.description,
      subject_id: newAssignment.subjectId,
      due_date: newAssignment.dueDate || null,
      max_score: newAssignment.maxScore
    });
  };

  const handleAddStudent = async () => {
    if (!newStudent.email || !newStudent.firstName || !newStudent.lastName || !newStudent.classId) return;
    
    await addStudentMutation.mutateAsync(newStudent);
  };

  const handleMarkNotificationRead = (notificationId: string) => {
    markNotificationReadMutation.mutate(notificationId);
  };

  const handleViewSubmission = (assignmentId: string) => {
    navigate(`/assignments/${assignmentId}`);
  };

  const handleGradeSubmission = (submissionId: string) => {
    navigate(`/submissions/${submissionId}/grade`);
  };

  const calculateEngagementData = () => {
    const data: any[] = [];
    
    // Generate insights for subjects with real data
    teacherSubjects.forEach((subject: any) => {
      const studentCount = subject.class?.student_enrollments?.length || 0;
      const subjectAssignments = activeAssignments.filter((a: any) => a.subject_id === subject.id);
      const subjectSubmissions = recentSubmissions.filter((s: any) => 
        subjectAssignments.some((a: any) => a.id === s.assignment_id)
      );
      
      const completionRate = subjectAssignments.length > 0 ? 
        Math.round((subjectSubmissions.length / (subjectAssignments.length * studentCount)) * 100) : 0;
      
      const gradedSubmissions = subjectSubmissions.filter((s: any) => s.score);
      const gradingRate = subjectSubmissions.length > 0 ? 
        Math.round((gradedSubmissions.length / subjectSubmissions.length) * 100) : 100;
      
      let riskLevel: 'low' | 'medium' | 'high' = 'low';
      if (completionRate < 60 || gradingRate < 50) {
        riskLevel = 'high';
      } else if (completionRate < 80 || gradingRate < 80) {
        riskLevel = 'medium';
      }
      
      data.push({
        id: subject.id,
        name: subject.name,
        type: 'subject' as const,
        engagementScore: Math.round((completionRate + gradingRate) / 2),
        riskLevel,
        metrics: {
          attendanceRate: completionRate,
          assignmentCompletion: completionRate,
          participationScore: gradingRate,
          lastActivity: subjectSubmissions.length > 0 ? 'Recent activity' : 'No recent activity'
        },
        trends: {
          engagement: completionRate > 75 ? 'up' : 'down',
          performance: gradingRate > 75 ? 'up' : 'stable'
        }
      });
    });
    
    return data;
  };

  const paginatedNotifications = unreadNotifications.slice(notificationPage * 5, (notificationPage + 1) * 5);
  const hasMoreNotifications = unreadNotifications.length > (notificationPage + 1) * 5;

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Section */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-primary">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="text-muted-foreground">
          Here's what's happening in your classes today
        </p>
      </div>

      {/* Statistics Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card 
          className="cursor-pointer hover:shadow-md transition-all hover:scale-105"
          onClick={() => navigate('/classes')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Classes</CardTitle>
            <School className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{classesLoading ? "..." : teacherClasses.length || 0}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-success" />
              Active classes
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-all hover:scale-105"
          onClick={() => navigate('/students')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalStudents || 0}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <Users className="h-3 w-3 mr-1 text-blue-500" />
              Across all classes
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-all hover:scale-105"
          onClick={() => navigate('/subjects')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subjects</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subjectsLoading ? "..." : teacherSubjects.length || 0}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <BookOpen className="h-3 w-3 mr-1 text-purple-500" />
              Teaching subjects
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-all hover:scale-105"
          onClick={() => navigate('/assignments')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Assignments</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignmentsLoading ? "..." : activeAssignments.length || 0}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <AlertCircle className="h-3 w-3 mr-1 text-warning" />
              Before due date
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions - Enhanced with Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Manage your classes and track performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <Dialog open={isSubjectDialogOpen} onOpenChange={setIsSubjectDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Subject
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Subject</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="subject-name">Subject Name</Label>
                    <Input
                      id="subject-name"
                      value={newSubject.name}
                      onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                      placeholder="Enter subject name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="subject-description">Description</Label>
                    <Textarea
                      id="subject-description"
                      value={newSubject.description}
                      onChange={(e) => setNewSubject({ ...newSubject, description: e.target.value })}
                      placeholder="Enter subject description"
                    />
                  </div>
                  <div>
                    <Label htmlFor="subject-class">Class</Label>
                    <Select value={newSubject.classId} onValueChange={(value) => setNewSubject({ ...newSubject, classId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a class" />
                      </SelectTrigger>
                      <SelectContent>
                        {teacherClasses.map((cls: any) => (
                          <SelectItem key={cls.id} value={cls.id}>
                            {cls.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    onClick={handleCreateSubject} 
                    disabled={createSubjectMutation.isPending || !newSubject.name || !newSubject.classId}
                  >
                    {createSubjectMutation.isPending ? 'Creating...' : 'Create Subject'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isAssignmentDialogOpen} onOpenChange={setIsAssignmentDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Assignment
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Assignment</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="assignment-title">Assignment Title</Label>
                    <Input
                      id="assignment-title"
                      value={newAssignment.title}
                      onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                      placeholder="Enter assignment title"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="assignment-description">Description</Label>
                    <Textarea
                      id="assignment-description"
                      value={newAssignment.description}
                      onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
                      placeholder="Enter assignment description"
                    />
                  </div>
                  <div>
                    <Label htmlFor="assignment-subject">Subject</Label>
                    <Select value={newAssignment.subjectId} onValueChange={(value) => setNewAssignment({ ...newAssignment, subjectId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {teacherSubjects.map((subject: any) => (
                          <SelectItem key={subject.id} value={subject.id}>
                            {subject.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="assignment-due-date">Due Date</Label>
                    <Input
                      id="assignment-due-date"
                      type="datetime-local"
                      value={newAssignment.dueDate}
                      onChange={(e) => setNewAssignment({ ...newAssignment, dueDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="assignment-max-score">Max Score</Label>
                    <Input
                      id="assignment-max-score"
                      type="number"
                      value={newAssignment.maxScore}
                      onChange={(e) => setNewAssignment({ ...newAssignment, maxScore: parseInt(e.target.value) || 100 })}
                    />
                  </div>
                  <Button 
                    onClick={handleCreateAssignment} 
                    disabled={createAssignmentMutation.isPending || !newAssignment.title || !newAssignment.subjectId}
                  >
                    {createAssignmentMutation.isPending ? 'Creating...' : 'Create Assignment'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isStudentDialogOpen} onOpenChange={setIsStudentDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Student
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Student</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={newStudent.firstName}
                        onChange={(e) => setNewStudent({ ...newStudent, firstName: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={newStudent.lastName}
                        onChange={(e) => setNewStudent({ ...newStudent, lastName: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newStudent.email}
                      onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                      placeholder="student@gmail.com"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="parentEmail">Parent Email (Optional)</Label>
                    <Input
                      id="parentEmail"
                      type="email"
                      value={newStudent.parentEmail}
                      onChange={(e) => setNewStudent({ ...newStudent, parentEmail: e.target.value })}
                      placeholder="parent@gmail.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={newStudent.password}
                      onChange={(e) => setNewStudent({ ...newStudent, password: e.target.value })}
                      placeholder="Default: demo123"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="class">Class</Label>
                    <Select value={newStudent.classId} onValueChange={(value) => setNewStudent({ ...newStudent, classId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a class" />
                      </SelectTrigger>
                      <SelectContent>
                        {teacherClasses && teacherClasses.length > 0 ? (
                          teacherClasses.map((cls: any) => (
                            <SelectItem key={cls.id} value={cls.id}>
                              {cls.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-classes" disabled>No classes available</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    onClick={handleAddStudent} 
                    disabled={addStudentMutation.isPending || !newStudent.email || !newStudent.firstName || !newStudent.lastName || !newStudent.classId}
                    className="w-full"
                  >
                    {addStudentMutation.isPending ? 'Adding...' : 'Add Student'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* NEW: Teacher Reports & Analytics */}
            <Dialog open={isReportsDialogOpen} onOpenChange={setIsReportsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  View Reports
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>Class Reports & Analytics</DialogTitle>
                </DialogHeader>
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="students">Students</TabsTrigger>
                    <TabsTrigger value="assignments">Assignments</TabsTrigger>
                    <TabsTrigger value="subjects">Subjects</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="overview" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Average Assignment Completion</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">87%</div>
                          <p className="text-xs text-muted-foreground">+5% from last month</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Average Class Grade</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">B+</div>
                          <p className="text-xs text-muted-foreground">83% average score</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Active Students</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{stats?.totalStudents || 0}</div>
                          <p className="text-xs text-muted-foreground">Across all classes</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Pending Submissions</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{recentSubmissions.filter((s: any) => !s.score).length}</div>
                          <p className="text-xs text-muted-foreground">Need grading</p>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="students" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Student Performance Overview</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {stats ? (
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Total Students</span>
                              <span className="font-medium">{stats.totalStudents}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Active Assignments</span>
                              <span className="font-medium">{activeAssignments.length}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Pending Submissions</span>
                              <span className="font-medium">{recentSubmissions.filter((s: any) => !s.score).length}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center text-muted-foreground">Loading student data...</div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="assignments" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Assignment Analytics</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {/* Summary for this teacher */}
                        <div className="grid gap-4 md:grid-cols-4">
                          <Card>
                            <CardHeader className="py-3"><CardTitle className="text-sm">Total</CardTitle></CardHeader>
                            <CardContent className="text-2xl font-bold">{tAssignmentAnalytics?.summary.total ?? 0}</CardContent>
                          </Card>
                          <Card>
                            <CardHeader className="py-3"><CardTitle className="text-sm">Overdue</CardTitle></CardHeader>
                            <CardContent className="text-2xl font-bold text-destructive">{tAssignmentAnalytics?.summary.overdue ?? 0}</CardContent>
                          </Card>
                          <Card>
                            <CardHeader className="py-3"><CardTitle className="text-sm">Due Soon</CardTitle></CardHeader>
                            <CardContent className="text-2xl font-bold text-warning">{tAssignmentAnalytics?.summary.dueSoon ?? 0}</CardContent>
                          </Card>
                          <Card>
                            <CardHeader className="py-3"><CardTitle className="text-sm">No Due Date</CardTitle></CardHeader>
                            <CardContent className="text-2xl font-bold text-muted-foreground">{tAssignmentAnalytics?.summary.noDueDate ?? 0}</CardContent>
                          </Card>
                        </div>

                        {/* By Subject chart */}
                        <div className="mt-6">
                          <h4 className="text-sm font-medium mb-2">By Subject</h4>
                          <ChartContainer config={{ assignments: { label: 'Assignments', color: 'hsl(var(--primary))' } }} className="h-64 w-full">
                            <BarChart data={tAssignmentAnalytics?.bySubject || []}>
                              <CartesianGrid vertical={false} />
                              <XAxis dataKey="name" tickLine={false} axisLine={false} interval={0} />
                              <YAxis allowDecimals={false} />
                              <ChartTooltip content={<ChartTooltipContent />} />
                              <Bar dataKey="count" fill="var(--color-assignments)" radius={[4,4,0,0]} />
                            </BarChart>
                          </ChartContainer>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="subjects" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Subject Performance</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Total Subjects</span>
                            <span className="font-medium">{stats?.totalSubjects || 0}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Active Classes</span>
                            <span className="font-medium">{teacherClasses.length}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Recent Submissions</span>
                            <span className="font-medium">{recentSubmissions.length}</span>
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

      {/* Enhanced Insights Card with Performance Metrics */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Performance & Insights Overview
          </CardTitle>
          <CardDescription>
            Monitor your classes' engagement levels and identify students who need attention
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-success">{teacherSubjects.length}</div>
              <div className="text-xs text-muted-foreground">Active Subjects</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-warning">{unreadNotifications.length}</div>
              <div className="text-xs text-muted-foreground">Unread Notifications</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {recentSubmissions.filter((s: any) => !s.score).length}
              </div>
              <div className="text-xs text-muted-foreground">Pending Grades</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{stats?.totalStudents || 0}</div>
              <div className="text-xs text-muted-foreground">Total Students</div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => navigate('/insights')} 
              className="flex-1"
            >
              View Detailed Insights
            </Button>
            <Button 
              onClick={() => setIsReportsDialogOpen(true)} 
              variant="outline"
              className="flex-1"
            >
              Generate Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* My Subjects */}
      <Card>
        <CardHeader>
          <CardTitle>My Subjects</CardTitle>
          <CardDescription>Manage your subjects and course content</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {teacherSubjects.map((subject: any) => (
              <Card key={subject.id} className="border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{subject.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{subject.description}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Subject Details:</p>
                    <div className="text-sm text-muted-foreground">
                      Class: {subject.class?.name || 'No class assigned'}
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <Badge variant="outline" className="text-xs">
                      {subject.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <Button size="sm" variant="outline">
                      Manage
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Your Classes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <School className="h-5 w-5" />
              Your Classes
            </CardTitle>
            <CardDescription>
              Classes you're actively teaching
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-3">
                {teacherClasses.map((cls: any) => (
                  <div key={cls.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{cls.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {cls.student_enrollments?.length || 0} students
                      </p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => navigate(`/classes/${cls.id}`)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {teacherClasses.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">
                    No classes assigned yet
                  </p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Unread Notifications
              {unreadNotifications.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadNotifications.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-3">
                {paginatedNotifications.map((notification: any) => (
                  <div 
                    key={notification.id} 
                    className={`flex items-start gap-3 p-3 border rounded-lg transition-all cursor-pointer hover:shadow-md ${
                      !notification.read ? 'border-primary/50 bg-primary/5' : ''
                    }`}
                    onClick={() => {
                      // Navigate based on notification type
                      switch (notification.type) {
                        case 'assignment':
                          navigate('/assignments');
                          break;
                        case 'submission':
                          navigate('/submissions');
                          break;
                        case 'grade':
                          navigate('/student/assignments');
                          break;
                        case 'deadline':
                          navigate('/assignments');
                          break;
                        case 'enrollment':
                          navigate('/students');
                          break;
                        default:
                          navigate('/notifications');
                      }
                    }}
                  >
                    <div className="flex-1">
                      <h4 className={`font-medium text-sm ${!notification.read ? 'font-semibold' : ''}`}>
                        {notification.title}
                        {!notification.read && <span className="ml-2 w-2 h-2 bg-primary rounded-full inline-block" />}
                      </h4>
                      <p className="text-sm text-muted-foreground">{notification.message}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {new Date(notification.created_at).toLocaleDateString()}
                        </span>
                        <span className="text-xs bg-muted px-2 py-1 rounded">
                          {notification.type}
                        </span>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent navigation when clicking tick
                        handleMarkNotificationRead(notification.id);
                      }}
                      className="hover:bg-success/10"
                    >
                      <CheckCircle className="h-4 w-4 text-success" />
                    </Button>
                  </div>
                ))}
                {unreadNotifications.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">
                    No unread notifications
                  </p>
                )}
              </div>
              {hasMoreNotifications && (
                <div className="flex justify-center mt-3">
                  <div className="flex flex-col gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setNotificationPage(notificationPage + 1)}
                    >
                      Load More
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => navigate('/notifications')}
                    >
                      View All Notifications
                    </Button>
                  </div>
                </div>
              )}
            </ScrollArea>
          </CardContent>
      </Card>

    </div>

      {/* Engagement Insights */}
      <EngagementInsights 
        title="Subject Performance & Risk Assessment"
        data={calculateEngagementData()}
        userRole="teacher"
      />

      {/* Enhanced Recent Submissions with Action Buttons */}
        {/* Lessons Management Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Lessons Management
            </CardTitle>
            <CardDescription>
              Quick access to lesson creation and management across your subjects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {teacherSubjects.slice(0, 3).map((subject: any) => (
                <div key={subject.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex-1">
                    <h4 className="font-medium">{subject.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {subject.class?.name} • {subject.lessons?.length || 0} lessons
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate(`/subjects/${subject.id}?tab=lessons`)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Lesson
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => navigate(`/subjects/${subject.id}`)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {teacherSubjects.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No subjects created yet. Create a subject first to add lessons.
                </p>
              )}
              {teacherSubjects.length > 3 && (
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/subjects')}
                  className="w-full"
                >
                  View All Subjects ({teacherSubjects.length})
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Recent Submissions
            </CardTitle>
            <CardDescription>
              Latest assignment submissions requiring your attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentSubmissions.slice(0, 5).map((submission: any) => (
                <div key={submission.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex-1">
                    <h4 className="font-medium truncate max-w-[200px]">{submission.assignment?.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      By {submission.student?.first_name} {submission.student?.last_name}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(submission.submitted_at).toLocaleDateString()}</span>
                      {submission.assignment?.due_date && (
                        <>
                          <span>•</span>
                          <span>Due: {new Date(submission.assignment.due_date).toLocaleDateString()}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {submission.score ? (
                      <Badge variant="secondary">
                        {submission.score}/{submission.assignment?.max_score}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-warning">
                        Needs Grading
                      </Badge>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleViewSubmission(submission.assignment_id)}
                      className="hover:bg-primary/10"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {!submission.score && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleGradeSubmission(submission.id)}
                        className="hover:bg-success/10 text-success"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {recentSubmissions.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No recent submissions
                </p>
              )}
              {recentSubmissions.length > 5 && (
                <div className="flex justify-center gap-2 mt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/submissions')}
                  >
                    View All Submissions
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/submissions?filter=pending')}
                  >
                    View Pending ({recentSubmissions.filter((s: any) => !s.score).length})
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

      {/* Teacher Performance Summary */}
      <Card className="border-accent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Your Teaching Impact
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-primary">{stats?.totalStudents || 0}</div>
              <div className="text-xs text-muted-foreground">Students Taught</div>
            </div>
            <div>
              <div className="text-lg font-bold text-success">{stats?.totalAssignments || 0}</div>
              <div className="text-xs text-muted-foreground">Assignments Created</div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-600">{recentSubmissions.length}</div>
              <div className="text-xs text-muted-foreground">Recent Submissions</div>
            </div>
            <div>
              <div className="text-lg font-bold text-purple-600">{stats?.totalSubjects || 0}</div>
              <div className="text-xs text-muted-foreground">Subjects Teaching</div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-4 text-center">
            Great work! Your students are actively engaged with your teaching materials.
          </p>
        </CardContent>
      </Card>

    </div>
  );
};
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  Users, 
  BookOpen, 
  GraduationCap,
  Calendar,
  TrendingUp,
  BarChart3,
  Target
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const TeacherProfilePage: React.FC = () => {
  const { teacherId } = useParams<{ teacherId: string }>();
  const navigate = useNavigate();
  
  const { data: teacher, isLoading: teacherLoading } = useQuery({
    queryKey: ['teacher-profile', teacherId],
    queryFn: async () => {
      if (!teacherId) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', teacherId)
        .eq('role', 'teacher')
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!teacherId
  });

  const { data: teacherClasses = [], isLoading: classesLoading } = useQuery({
    queryKey: ['teacher-classes', teacherId],
    queryFn: async () => {
      if (!teacherId) return [];
      const { data, error } = await supabase
        .from('classes')
        .select(`
          *,
          subjects(*),
          student_enrollments(
            student_id,
            student:profiles!student_enrollments_student_id_fkey(
              id, first_name, last_name, parent_email
            )
          )
        `)
        .eq('teacher_id', teacherId)
        .eq('is_active', true);
      
      if (error) {
        console.error('Error fetching teacher classes:', error);
        throw error;
      }
      return data || [];
    },
    enabled: !!teacherId
  });

  const { data: teacherStats } = useQuery({
    queryKey: ['teacher-stats', teacherId, teacherClasses],
    queryFn: async () => {
      if (!teacherId || !teacherClasses || teacherClasses.length === 0) {
        return {
          totalClasses: 0,
          totalSubjects: 0,
          totalStudents: 0,
          totalAssignments: 0
        };
      }
      
      // Get assignments created by this teacher
      const { data: assignments } = await supabase
        .from('assignments')
        .select('id, subject_id, subjects(class_id)')
        .eq('subjects.classes.teacher_id', teacherId);
      
      // Calculate total students across all classes
      const totalStudents = teacherClasses.reduce((total: number, cls: any) => 
        total + (cls.student_enrollments?.length || 0), 0
      );
      
      return {
        totalClasses: teacherClasses.length,
        totalSubjects: teacherClasses.reduce((total: number, cls: any) => 
          total + (cls.subjects?.length || 0), 0
        ),
        totalStudents,
        totalAssignments: assignments?.length || 0
      };
    },
    enabled: !!teacherId && teacherClasses.length >= 0
  });

  if (teacherLoading || classesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading teacher profile...</p>
        </div>
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="text-center py-12">
        <User className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Teacher not found</h3>
        <p className="text-muted-foreground mb-4">The teacher profile you're looking for doesn't exist.</p>
        <Button onClick={() => navigate('/teachers')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Teachers
        </Button>
      </div>
    );
  }

  const teacherInitials = `${teacher.first_name?.[0] || ''}${teacher.last_name?.[0] || ''}`;

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/teachers')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Teachers
          </Button>
        </div>

        {/* Teacher Profile Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start gap-6">
              <Avatar className="w-24 h-24">
                <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${teacherInitials}`} />
                <AvatarFallback className="text-2xl">{teacherInitials}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <CardTitle className="text-3xl">
                    {teacher.first_name} {teacher.last_name}
                  </CardTitle>
                  <Badge variant="secondary">Teacher</Badge>
                </div>
                <CardDescription className="text-lg mb-4">
                  {teacher.school_name || 'No school specified'}
                </CardDescription>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{teacher.parent_email || 'No email provided'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>Joined: {new Date(teacher.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <GraduationCap className="w-4 h-4" />
                Classes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{teacherStats?.totalClasses || 0}</div>
              <div className="text-sm text-muted-foreground">Active classes</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Subjects
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{teacherStats?.totalSubjects || 0}</div>
              <div className="text-sm text-muted-foreground">Total subjects</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="w-4 h-4" />
                Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{teacherStats?.totalStudents || 0}</div>
              <div className="text-sm text-muted-foreground">Enrolled students</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Target className="w-4 h-4" />
                Assignments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{teacherStats?.totalAssignments || 0}</div>
              <div className="text-sm text-muted-foreground">Created assignments</div>
            </CardContent>
          </Card>
        </div>

        {/* Classes & Subjects */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Classes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5" />
                Classes ({teacherClasses.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {teacherClasses.length > 0 ? (
                teacherClasses.map((cls: any) => (
                  <div key={cls.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{cls.name}</h4>
                      <Badge variant="outline">
                        {cls.student_enrollments?.length || 0} students
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {cls.description || 'No description'}
                    </p>
                    <div className="text-xs text-muted-foreground">
                      Code: {cls.enrollment_code}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No classes assigned
                </div>
              )}
            </CardContent>
          </Card>

          {/* All Subjects */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                All Subjects ({teacherStats?.totalSubjects || 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {teacherClasses.some((cls: any) => cls.subjects?.length > 0) ? (
                teacherClasses.map((cls: any) => 
                  cls.subjects?.map((subject: any) => (
                    <div key={subject.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{subject.name}</h4>
                        <Badge variant="secondary">{cls.name}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {subject.description || 'No description'}
                      </p>
                      <div className="text-xs text-muted-foreground">
                        Students: {cls.student_enrollments?.length || 0}
                      </div>
                    </div>
                  ))
                )
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No subjects created
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* All Students */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              All Students ({teacherStats?.totalStudents || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {teacherStats?.totalStudents ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teacherClasses.flatMap((cls: any) => 
                  (cls.student_enrollments || []).map((enrollment: any) => {
                    const student = enrollment.student;
                    const studentInitials = `${student?.first_name?.[0] || ''}${student?.last_name?.[0] || ''}`;
                    
                    return (
                      <div key={`${cls.id}-${student?.id}`} className="border rounded-lg p-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${studentInitials}`} />
                            <AvatarFallback>{studentInitials}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {student?.first_name} {student?.last_name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {cls.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {student?.email}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No students enrolled in any classes
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button 
                variant="outline"
                onClick={() => navigate(`/insights?teacherId=${teacherId}`)}
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                View Insights
              </Button>
              <Button 
                variant="outline"
                onClick={() => navigate('/classes')}
              >
                <GraduationCap className="w-4 h-4 mr-2" />
                Manage Classes
              </Button>
              <Button 
                variant="outline"
                onClick={() => navigate('/subjects')}
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Manage Subjects
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};
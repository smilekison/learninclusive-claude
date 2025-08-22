import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useTeacherClasses, useTeacherStudents, useSoftDelete, useToggleStatus } from '@/hooks/useSupabaseQuery';
import { ArrowLeft, Search, GraduationCap, Mail, Users, Eye } from 'lucide-react';
import { ClassList } from '@/components/students/ClassList';
import { StudentList } from '@/components/students/StudentList';
import { StudentDetailView } from '@/components/students/StudentDetailView';
import { AddStudentDialog } from '@/components/students/AddStudentDialog';
import { Truncate } from '@/components/ui/truncate';

type ViewMode = 'classes' | 'students' | 'studentDetail' | 'globalSearch';

export const StudentsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Use teacher-specific hooks for teachers
  const { data: classes = [] } = useTeacherClasses();
  const { data: students = [] } = useTeacherStudents();
  
  const softDeleteMutation = useSoftDelete();
  const toggleStatusMutation = useToggleStatus();
  
  const [viewMode, setViewMode] = useState<ViewMode>('classes');
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [classSearchTerm, setClassSearchTerm] = useState('');
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');

  const handleClassSelect = (classId: string) => {
    setSelectedClassId(classId);
    setViewMode('students');
    setStudentSearchTerm('');
  };

  const handleStudentSelect = (student: any) => {
    setSelectedStudent(student);
    setViewMode('studentDetail');
  };

  const handleBackToClasses = () => {
    setViewMode('classes');
    setSelectedClassId(null);
    setClassSearchTerm('');
  };

  const handleBackToStudents = () => {
    setViewMode('students');
    setSelectedStudent(null);
    setStudentSearchTerm('');
  };

  const handleGlobalSearch = () => {
    setViewMode('globalSearch');
    setGlobalSearchTerm('');
  };

  const handleBackFromGlobalSearch = () => {
    setViewMode('classes');
    setGlobalSearchTerm('');
  };

  const handleDeleteStudent = (studentId: string) => {
    if (user?.role === 'principal' && user?.id) {
      if (confirm('Are you sure you want to move this student to the bin?')) {
        softDeleteMutation.mutate({
          tableName: 'profiles',
          itemId: studentId,
          deleterId: user.id
        });
      }
    }
  };

  const handleToggleStudentStatus = (studentId: string, currentStatus: boolean) => {
    if (user?.role === 'principal') {
      toggleStatusMutation.mutate({
        tableName: 'profiles',
        itemId: studentId,
        isActive: !currentStatus
      });
    }
  };

  const selectedClass = classes.find((cls: any) => cls.id === selectedClassId);
  
  // Filter students by selected class for teachers/principals
  const studentsInClass = students
    .filter((item: any) => {
      if (!selectedClassId) return false;
      // Support both combined enrollment shape and plain student shape
      const classId = item.class?.id || item.class_id;
      if (classId) return classId === selectedClassId;
      // Fallback: if item has enrollments array like student.student_enrollments
      return item.student_enrollments?.some((enrollment: any) => enrollment.class?.id === selectedClassId);
    })
    .map((item: any) => item.student ?? item);

  // Global search across all students
  const globalFilteredStudents = students
    .map((item: any) => {
      const student = item.student ?? item;
      const className = item.class?.name || 'No Class';
      const email = student.user_id || student.email || 'No email';
      return { ...student, className, email };
    })
    .filter((student: any) => {
      if (!globalSearchTerm) return true;
      const searchLower = globalSearchTerm.toLowerCase();
      const fullName = `${student.first_name} ${student.last_name}`.toLowerCase();
      const className = student.className.toLowerCase();
      const email = student.email.toLowerCase();
      return fullName.includes(searchLower) || className.includes(searchLower) || email.includes(searchLower);
    });

  const getPageTitle = () => {
    switch (viewMode) {
      case 'classes': return user?.role === 'teacher' ? 'My Students' : 'Students Management';
      case 'students': return `Students in ${selectedClass?.name}`;
      case 'studentDetail': return `${selectedStudent?.first_name} ${selectedStudent?.last_name}`;
      case 'globalSearch': return 'Search All Students';
      default: return 'Students Management';
    }
  };

  const getPageDescription = () => {
    switch (viewMode) {
      case 'classes': return user?.role === 'teacher' 
        ? 'View students in your classes and manage their information' 
        : 'Select a class to view and manage students';
      case 'students': return 'View and manage students in this class';
      case 'studentDetail': return 'Detailed student information and insights';
      case 'globalSearch': return 'Search across all students by name, class, or email';
      default: return 'Manage student enrollments and send invitations';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{getPageTitle()}</h1>
            <p className="text-muted-foreground mt-2">{getPageDescription()}</p>
          </div>
          
          <div className="flex items-center gap-3">
            {viewMode === 'classes' && (
              <Button 
                variant="outline" 
                onClick={handleGlobalSearch}
                className="flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                Search All Students
              </Button>
            )}
            {viewMode === 'classes' && <AddStudentDialog />}
          </div>
        </div>

        {/* Dynamic Content Based on View Mode */}
        {viewMode === 'classes' && (
          <ClassList
            classes={classes}
            onClassSelect={handleClassSelect}
            searchTerm={classSearchTerm}
            onSearchChange={setClassSearchTerm}
          />
        )}

        {viewMode === 'students' && selectedClass && (
          <StudentList
            students={studentsInClass}
            classInfo={selectedClass}
            onStudentSelect={handleStudentSelect}
            onBack={handleBackToClasses}
            searchTerm={studentSearchTerm}
            onSearchChange={setStudentSearchTerm}
          />
        )}

        {viewMode === 'studentDetail' && selectedStudent && selectedClass && (
          <StudentDetailView
            student={selectedStudent}
            classInfo={selectedClass}
            onBack={handleBackToStudents}
          />
        )}

        {viewMode === 'globalSearch' && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={handleBackFromGlobalSearch}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Classes
              </Button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search students by name, class, or email..."
                value={globalSearchTerm}
                onChange={(e) => setGlobalSearchTerm(e.target.value)}
                className="pl-10"
                autoFocus
              />
            </div>

            <div className="text-sm text-muted-foreground">
              {globalFilteredStudents.length} students found
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {globalFilteredStudents.map((student: any) => (
                <Card key={student.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 min-w-0">
                        <GraduationCap className="w-5 h-5" />
                        <Truncate lines={1} className="flex-1">{student.first_name} {student.last_name}</Truncate>
                      </CardTitle>
                      <Badge variant="secondary">Student</Badge>
                    </div>
                    <CardDescription>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="w-4 h-4" />
                          <span>{student.className}</span>
                        </div>
                        {student.disabilities?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {student.disabilities.map((disability: string) => (
                              <Badge key={disability} variant="outline" className="text-xs">
                                {disability.replace('_', ' ')}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="w-4 h-4" />
                        <span>{student.email}</span>
                      </div>
                      {student.parent_email && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="w-4 h-4" />
                          <span>Parent: {student.parent_email}</span>
                        </div>
                      )}
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => {
                        setSelectedStudent(student);
                        setViewMode('studentDetail');
                      }}
                      className="w-full"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {globalFilteredStudents.length === 0 && globalSearchTerm && (
              <div className="text-center py-12">
                <GraduationCap className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No students found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search terms
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
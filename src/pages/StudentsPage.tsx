import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useTeacherClasses, useTeacherStudents, useSoftDelete, useToggleStatus } from '@/hooks/useSupabaseQuery';
import { ArrowLeft } from 'lucide-react';
import { ClassList } from '@/components/students/ClassList';
import { StudentList } from '@/components/students/StudentList';
import { StudentDetailView } from '@/components/students/StudentDetailView';
import { AddStudentDialog } from '@/components/students/AddStudentDialog';

type ViewMode = 'classes' | 'students' | 'studentDetail';

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

  const getPageTitle = () => {
    switch (viewMode) {
      case 'classes': return user?.role === 'teacher' ? 'My Students' : 'Students Management';
      case 'students': return `Students in ${selectedClass?.name}`;
      case 'studentDetail': return `${selectedStudent?.first_name} ${selectedStudent?.last_name}`;
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
          
          {viewMode === 'classes' && <AddStudentDialog />}
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
      </main>
    </div>
  );
};
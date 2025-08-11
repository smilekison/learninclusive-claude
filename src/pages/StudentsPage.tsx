import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useTeacherClasses, useTeacherStudents, useSupabaseMutation, useSoftDelete, useToggleStatus } from '@/hooks/useSupabaseQuery';
import { Plus, ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClassList } from '@/components/students/ClassList';
import { StudentList } from '@/components/students/StudentList';
import { StudentDetailView } from '@/components/students/StudentDetailView';

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
  
  const [newStudent, setNewStudent] = useState({
    firstName: '',
    lastName: '',
    email: '',
    parentEmail: '',
    classId: ''
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Send email invitation for student
  const addStudentMutation = useSupabaseMutation(
    async (studentData: typeof newStudent) => {
      const response = await fetch(`https://ittuorfjrmktmjwwmgad.supabase.co/functions/v1/send-invitation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0dHVvcmZqcm1rdG1qd3dtZ2FkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0NzI5MDEsImV4cCI6MjA3MDA0ODkwMX0.QixJi_jj0rJ4Dg-1x-BzjoXuGBJCAmhgw330A4yCMZw`
        },
        body: JSON.stringify({
          email: studentData.email,
          role: 'student',
          invitedBy: user?.id,
          additionalData: {
            firstName: studentData.firstName,
            lastName: studentData.lastName,
            classId: studentData.classId,
            parentEmail: studentData.parentEmail
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send invitation');
      }

      return await response.json();
    },
    {
      successMessage: 'Student invitation sent successfully! They will receive an email to set up their account.',
      invalidateKeys: [['teacher-students']],
      onSuccess: () => {
        setNewStudent({ firstName: '', lastName: '', email: '', parentEmail: '', classId: '' });
        setIsDialogOpen(false);
      }
    }
  );

  const handleAddStudent = () => {
    if (!newStudent.email || !newStudent.firstName || !newStudent.lastName || !newStudent.classId) {
      return;
    }
    addStudentMutation.mutate(newStudent);
  };

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
          
          {viewMode === 'classes' && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
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
                      <Label htmlFor="student-firstName">First Name</Label>
                      <Input
                        id="student-firstName"
                        value={newStudent.firstName}
                        onChange={(e) => setNewStudent({ ...newStudent, firstName: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="student-lastName">Last Name</Label>
                      <Input
                        id="student-lastName"
                        value={newStudent.lastName}
                        onChange={(e) => setNewStudent({ ...newStudent, lastName: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="student-email">Email</Label>
                    <Input
                      id="student-email"
                      type="email"
                      value={newStudent.email}
                      onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                      placeholder="student@gmail.com"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="student-parent-email">Parent Email (Optional)</Label>
                    <Input
                      id="student-parent-email"
                      type="email"
                      value={newStudent.parentEmail}
                      onChange={(e) => setNewStudent({ ...newStudent, parentEmail: e.target.value })}
                      placeholder="Enter parent's email address"
                    />
                  </div>
                  <div>
                    <Label htmlFor="student-class">Class</Label>
                    <Select value={newStudent.classId} onValueChange={(value) => setNewStudent({ ...newStudent, classId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a class" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map((cls: any) => (
                          <SelectItem key={cls.id} value={cls.id}>
                            {cls.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    onClick={handleAddStudent}
                    disabled={addStudentMutation.isPending || !newStudent.email || !newStudent.firstName || !newStudent.lastName || !newStudent.classId}
                    className="w-full"
                  >
                    {addStudentMutation.isPending ? 'Sending Invitation...' : 'Send Student Invitation'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
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
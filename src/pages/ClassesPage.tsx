import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  School, 
  Search, 
  Filter, 
  Plus, 
  Users, 
  BookOpen, 
  GraduationCap,
  TrendingUp,
  Eye,
  Edit,
  
  Trash2
} from 'lucide-react';
import { useTeacherClasses, useClasses, useProfiles, useSupabaseMutation, useSoftDelete } from '@/hooks/useSupabaseQuery';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const ClassesPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Use teacher-specific hook for teachers, regular hook for principals
  const { data: classes = [], isLoading, refetch } = user?.role === 'teacher' 
    ? useTeacherClasses() 
    : useClasses();
  
  const { data: teachers = [] } = useProfiles('teacher');
  const softDeleteMutation = useSoftDelete();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [teacherFilter, setTeacherFilter] = useState('all');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  const [newClass, setNewClass] = useState({
    name: '',
    description: '',
    teacherId: '',
    grade: ''
  });

  const [editClass, setEditClass] = useState({
    name: '',
    description: '',
    teacherId: ''
  });

  // Add class mutation
  const addClassMutation = useSupabaseMutation(
    async (classData: typeof newClass) => {
      const { data, error } = await supabase.from('classes').insert({
        name: classData.name,
        description: classData.description,
        teacher_id: classData.teacherId === '' ? null : classData.teacherId
      }).select().single();
      
      if (error) throw error;
      return { data, error: null };
    },
    {
      successMessage: 'Class created successfully!',
      invalidateKeys: [['teacher-classes'], ['classes'], ['profiles', 'teacher']],
      onSuccess: () => {
        setNewClass({ name: '', description: '', teacherId: '', grade: '' });
        setIsAddDialogOpen(false);
        refetch();
      }
    }
  );

  // Update class mutation
  const updateClassMutation = useSupabaseMutation(
    async (classData: { id: string; name: string; description: string; teacherId: string }) => {
      const { data, error } = await supabase.from('classes').update({
        name: classData.name,
        description: classData.description,
        teacher_id: classData.teacherId === '' ? null : classData.teacherId
      }).eq('id', classData.id).select().single();
      
      if (error) throw error;
      return { data, error: null };
    },
    {
      successMessage: 'Class updated successfully!',
      invalidateKeys: [['teacher-classes'], ['classes'], ['profiles', 'teacher']],
      onSuccess: () => {
        setIsEditDialogOpen(false);
        setSelectedClass(null);
      }
    }
  );

  // Filter classes (for teachers, already filtered to their classes)
  const filteredClasses = classes.filter((cls: any) => {
    const matchesSearch = cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cls.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // For teachers, teacher filter is not relevant since they only see their classes
    const matchesTeacher = user?.role === 'teacher' || teacherFilter === 'all' || cls.teacher?.id === teacherFilter;
    
    const matchesGrade = gradeFilter === 'all' || cls.name.toLowerCase().includes(gradeFilter.toLowerCase());
    
    return matchesSearch && matchesTeacher && matchesGrade;
  });

  const handleAddClass = () => {
    if (!newClass.name) {
      return;
    }
    addClassMutation.mutate(newClass);
  };

  const handleEditClass = (cls: any) => {
    setSelectedClass(cls);
    setEditClass({
      name: cls.name,
      description: cls.description || '',
      teacherId: cls.teacher?.id || ''
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateClass = () => {
    if (!selectedClass || !editClass.name) {
      return;
    }
    updateClassMutation.mutate({
      id: selectedClass.id,
      name: editClass.name,
      description: editClass.description,
      teacherId: editClass.teacherId
    });
  };


  const handleViewClass = (classId: string) => {
    navigate(`/insights?classId=${classId}`);
  };

  const handleDeleteClass = (classId: string) => {
    if (confirm('Are you sure you want to move this class to the bin?')) {
      if (user?.id) {
        softDeleteMutation.mutate({
          tableName: 'classes',
          itemId: classId,
          deleterId: user.id
        });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading classes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
            <School className="h-8 w-8" />
            {user?.role === 'teacher' ? 'My Classes' : 'Class Management'}
          </h1>
          <p className="text-muted-foreground mt-2">
            {user?.role === 'teacher' 
              ? 'Manage your assigned classes and students'
              : 'Organize and monitor all classes in your institution'
            }
          </p>
        </div>
        
        {user?.role === 'principal' && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
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
                    placeholder="e.g., Grade 10 Mathematics"
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
                {user?.role === 'principal' && (
                  <div>
                    <Label htmlFor="teacher">Assign Teacher (Optional)</Label>
                    <Select value={newClass.teacherId} onValueChange={(value) => setNewClass({ ...newClass, teacherId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a teacher" />
                      </SelectTrigger>
                      <SelectContent>
                        {teachers.map((teacher: any) => (
                          <SelectItem key={teacher.id} value={teacher.id}>
                            {teacher.first_name} {teacher.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
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
        )}
      </div>

      {/* Edit Class Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Class</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editClassName">Class Name</Label>
              <Input
                id="editClassName"
                value={editClass.name}
                onChange={(e) => setEditClass({ ...editClass, name: e.target.value })}
                placeholder="e.g., Grade 10 Mathematics"
                required
              />
            </div>
            <div>
              <Label htmlFor="editClassDescription">Description</Label>
              <Textarea
                id="editClassDescription"
                value={editClass.description}
                onChange={(e) => setEditClass({ ...editClass, description: e.target.value })}
                placeholder="Brief description of the class"
              />
            </div>
            <div>
              <Label htmlFor="editTeacher">Assign Teacher</Label>
              <Select value={editClass.teacherId} onValueChange={(value) => setEditClass({ ...editClass, teacherId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a teacher" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No teacher assigned</SelectItem>
                  {teachers.map((teacher: any) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.first_name} {teacher.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={handleUpdateClass}
              disabled={updateClassMutation.isPending || !editClass.name}
              className="w-full"
            >
              {updateClassMutation.isPending ? 'Updating...' : 'Update Class'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 h-5" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search classes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Hide teacher filter for teachers since they only see their classes */}
            {user?.role !== 'teacher' && (
              <Select value={teacherFilter} onValueChange={setTeacherFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by teacher" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Teachers</SelectItem>
                  {teachers.map((teacher: any) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.first_name} {teacher.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Select value={gradeFilter} onValueChange={setGradeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by grade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Grades</SelectItem>
                <SelectItem value="grade 9">Grade 9</SelectItem>
                <SelectItem value="grade 10">Grade 10</SelectItem>
                <SelectItem value="grade 11">Grade 11</SelectItem>
                <SelectItem value="grade 12">Grade 12</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm('');
                setTeacherFilter('all');
                setGradeFilter('all');
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {user?.role === 'teacher' ? 'My Classes' : 'Total Classes'}
            </CardTitle>
            <School className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredClasses.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Classes</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {filteredClasses.filter((cls: any) => (cls.student_enrollments?.[0]?.count || 0) > 0).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredClasses.reduce((total: number, cls: any) => total + (cls.student_enrollments?.[0]?.count || 0), 0)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Class Size</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredClasses.length > 0 
                ? Math.round(filteredClasses.reduce((total: number, cls: any) => total + (cls.student_enrollments?.[0]?.count || 0), 0) / filteredClasses.length)
                : 0
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Classes Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredClasses.map((cls: any) => (
          <Card key={cls.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <School className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{cls.name}</CardTitle>
                    <Badge variant="secondary">
                      {cls.student_enrollments?.[0]?.count || 0} students
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {cls.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {cls.description}
                </p>
              )}
              
              <div className="space-y-2">
                {cls.teacher && (
                  <div className="flex items-center gap-2 text-sm">
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Teacher: {cls.teacher.first_name} {cls.teacher.last_name}
                    </span>
                  </div>
                )}
                
                <div className="flex items-center gap-2 text-sm">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {cls.subjects?.length || 0} subject{cls.subjects?.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>


              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewClass(cls.id)}
                  className="flex-1"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </Button>
                
                {(user?.role === 'principal' || (user?.role === 'teacher' && cls.teacher?.id === user?.id)) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditClass(cls)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
                
                {user?.role === 'principal' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteClass(cls.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        
        {filteredClasses.length === 0 && (
          <div className="col-span-full text-center py-12">
            <School className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              {user?.role === 'teacher' ? 'No classes assigned' : 'No classes found'}
            </h3>
            <p className="text-muted-foreground">
              {user?.role === 'teacher' 
                ? 'Contact your administrator to get assigned to classes'
                : 'Try adjusting your search or create a new class'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
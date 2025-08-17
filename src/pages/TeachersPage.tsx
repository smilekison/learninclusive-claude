import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  Mail, 
  Phone, 
  GraduationCap,
  BookOpen,
  TrendingUp,
  Eye,
  Edit,
  Trash2,
  Archive,
  RotateCcw
} from 'lucide-react';
import { useProfiles, useClasses, useSupabaseMutation, useSoftDelete, useToggleStatus } from '@/hooks/useSupabaseQuery';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { AddTeacherDialog } from '@/components/teachers/AddTeacherDialog';

export const TeachersPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: teachers = [], isLoading } = useProfiles('teacher');
  const { data: classes = [] } = useClasses();
  const softDeleteMutation = useSoftDelete();
  const toggleStatusMutation = useToggleStatus();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [showDeletedTeachers, setShowDeletedTeachers] = useState(false);
  
  const [newTeacher, setNewTeacher] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: ''
  });

  const [editTeacher, setEditTeacher] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });

  // Mock deleted teachers (in real app, you'd store this in database)
  const [deletedTeachers, setDeletedTeachers] = useState<any[]>([]);

  // Add teacher mutation
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
      invalidateKeys: [['profiles', 'teacher']],
      onSuccess: () => {
        setNewTeacher({ firstName: '', lastName: '', email: '', password: '', phone: '' });
        setIsAddDialogOpen(false);
      }
    }
  );

  // Update teacher mutation
  const updateTeacherMutation = useSupabaseMutation(
    async (teacherData: { id: string; firstName: string; lastName: string; email: string }) => {
      const { data, error } = await supabase.from('profiles').update({
        first_name: teacherData.firstName,
        last_name: teacherData.lastName
      }).eq('id', teacherData.id);
      
      if (error) throw error;
      return { data, error: null };
    },
    {
      successMessage: 'Teacher updated successfully!',
      invalidateKeys: [['profiles'], ['profiles', 'teacher'], ['classes']],
      onSuccess: () => {
        setIsEditDialogOpen(false);
        setSelectedTeacher(null);
      }
    }
  );

  // Delete teacher mutation (soft delete - move to bin)
  const deleteTeacherMutation = useSupabaseMutation(
    async (teacherId: string) => {
      // In a real app, you might update a "deleted_at" field instead of actual deletion
      return await supabase.from('profiles').delete().eq('id', teacherId);
    },
    {
      successMessage: 'Teacher moved to bin successfully!',
      invalidateKeys: [['profiles', 'teacher']],
      onSuccess: () => {
        // Handle success logic here if needed
      }
    }
  );

  // Filter teachers
  const activeTeachers = teachers.filter((teacher: any) => 
    !deletedTeachers.find(dt => dt.id === teacher.id)
  );

  const filteredTeachers = (showDeletedTeachers ? deletedTeachers : activeTeachers).filter((teacher: any) => {
    const matchesSearch = teacher.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         teacher.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         teacher.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const teacherClasses = classes.filter((cls: any) => cls.teacher?.id === teacher.id);
    const matchesClass = classFilter === 'all' || teacherClasses.some((cls: any) => cls.id === classFilter);
    
    return matchesSearch && matchesClass;
  });

  const handleAddTeacher = () => {
    if (!newTeacher.email || !newTeacher.password || !newTeacher.firstName || !newTeacher.lastName) {
      return;
    }
    addTeacherMutation.mutate(newTeacher);
  };

  const handleEditTeacher = (teacher: any) => {
    setSelectedTeacher(teacher);
    setEditTeacher({
      firstName: teacher.first_name,
      lastName: teacher.last_name,
      email: teacher.email || '',
      phone: teacher.phone || ''
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateTeacher = () => {
    if (!selectedTeacher || !editTeacher.firstName || !editTeacher.lastName) {
      return;
    }
    updateTeacherMutation.mutate({
      id: selectedTeacher.id,
      firstName: editTeacher.firstName,
      lastName: editTeacher.lastName,
      email: editTeacher.email
    });
  };

  const handleDeleteTeacher = (teacherId: string) => {
    if (confirm('Are you sure you want to move this teacher to the bin?')) {
      if (user?.id) {
        softDeleteMutation.mutate({
          tableName: 'profiles',
          itemId: teacherId,
          deleterId: user.id
        });
      }
    }
  };

  const handleToggleStatus = (teacherId: string, currentStatus: boolean) => {
    toggleStatusMutation.mutate({
      tableName: 'profiles',
      itemId: teacherId,
      isActive: !currentStatus
    });
  };

  const handleRestoreTeacher = (teacherId: string) => {
    setDeletedTeachers(prev => prev.filter(t => t.id !== teacherId));
    toast({
      title: "Success",
      description: "Teacher restored successfully!",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading teachers...</p>
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
            <Users className="h-8 w-8" />
            Teacher Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage and monitor teaching staff across your institution
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={showDeletedTeachers ? "default" : "outline"}
            onClick={() => setShowDeletedTeachers(!showDeletedTeachers)}
          >
            <Archive className="h-4 w-4 mr-2" />
            {showDeletedTeachers ? 'View Active' : 'View Bin'}
            {deletedTeachers.length > 0 && !showDeletedTeachers && (
              <Badge variant="destructive" className="ml-2">
                {deletedTeachers.length}
              </Badge>
            )}
          </Button>
          
          {user?.role === 'principal' && !showDeletedTeachers && (
            <AddTeacherDialog />
          )}
        </div>
      </div>

      {/* Edit Teacher Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Teacher Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editFirstName">First Name</Label>
                <Input
                  id="editFirstName"
                  value={editTeacher.firstName}
                  onChange={(e) => setEditTeacher({ ...editTeacher, firstName: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="editLastName">Last Name</Label>
                <Input
                  id="editLastName"
                  value={editTeacher.lastName}
                  onChange={(e) => setEditTeacher({ ...editTeacher, lastName: e.target.value })}
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="editEmail">Email</Label>
              <Input
                id="editEmail"
                type="email"
                value={editTeacher.email}
                onChange={(e) => setEditTeacher({ ...editTeacher, email: e.target.value })}
                placeholder="teacher@school.edu"
              />
            </div>
            <div>
              <Label htmlFor="editPhone">Phone</Label>
              <Input
                id="editPhone"
                type="tel"
                value={editTeacher.phone}
                onChange={(e) => setEditTeacher({ ...editTeacher, phone: e.target.value })}
                placeholder="+1 (555) 123-4567"
              />
            </div>
            <Button 
              onClick={handleUpdateTeacher}
              disabled={updateTeacherMutation.isPending || !editTeacher.firstName || !editTeacher.lastName}
              className="w-full"
            >
              {updateTeacherMutation.isPending ? 'Updating...' : 'Update Teacher'}
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
          <div className="grid gap-4 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search teachers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map((cls: any) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm('');
                setClassFilter('all');
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
              {showDeletedTeachers ? 'Deleted Teachers' : 'Total Teachers'}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredTeachers.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Teachers</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{activeTeachers.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{classes.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {showDeletedTeachers ? 'Items in Bin' : 'Avg Classes/Teacher'}
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {showDeletedTeachers 
                ? deletedTeachers.length
                : activeTeachers.length > 0 ? Math.round(classes.length / activeTeachers.length * 10) / 10 : 0
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Teachers Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredTeachers.map((teacher: any) => {
          const teacherClasses = classes.filter((cls: any) => cls.teacher?.id === teacher.id);
          const isDeleted = showDeletedTeachers;
          
          return (
            <Card key={teacher.id} className={`hover:shadow-md transition-shadow ${isDeleted ? 'opacity-75 border-dashed' : ''}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 ${isDeleted ? 'bg-muted' : 'bg-primary/10'} rounded-full flex items-center justify-center`}>
                      <Users className={`h-6 w-6 ${isDeleted ? 'text-muted-foreground' : 'text-primary'}`} />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {teacher.first_name} {teacher.last_name}
                      </CardTitle>
                      <Badge variant={isDeleted ? "outline" : "secondary"}>
                        {isDeleted ? 'Deleted' : 'Teacher'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {teacher.email || 'No email provided'}
                    </span>
                  </div>
                  
                  {teacher.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{teacher.phone}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 text-sm">
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {teacherClasses.length} class{teacherClasses.length !== 1 ? 'es' : ''}
                    </span>
                  </div>
                </div>

                {teacherClasses.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Classes:</p>
                    <div className="flex flex-wrap gap-1">
                      {teacherClasses.slice(0, 3).map((cls: any) => (
                        <Badge key={cls.id} variant="outline" className="text-xs">
                          {cls.name}
                        </Badge>
                      ))}
                      {teacherClasses.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{teacherClasses.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {isDeleted && teacher.deletedAt && (
                  <div className="text-xs text-muted-foreground">
                    Deleted: {new Date(teacher.deletedAt).toLocaleDateString()}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  {!isDeleted ? (
                    <>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => navigate(`/teacher/${teacher.id}`)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      {user?.role === 'principal' && (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => handleEditTeacher(teacher)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleDeleteTeacher(teacher.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleRestoreTeacher(teacher.id)}
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Restore
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredTeachers.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {showDeletedTeachers ? 'No deleted teachers' : 'No teachers found'}
          </h3>
          <p className="text-muted-foreground">
            {showDeletedTeachers
              ? 'The bin is empty'
              : searchTerm || classFilter !== 'all' 
                ? 'Try adjusting your search filters' 
                : 'No teachers have been added yet'
            }
          </p>
        </div>
      )}
    </div>
  );
};
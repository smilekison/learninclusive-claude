import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useTeacherClasses, useTeacherSubjects, useSupabaseMutation, useSoftDelete, useToggleStatus } from '@/hooks/useSupabaseQuery';
import { supabase } from '@/integrations/supabase/client';
import { Plus, ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SubjectFilters } from '@/components/subjects/SubjectFilters';
import { SubjectDetailView } from '@/components/subjects/SubjectDetailView';

type ViewMode = 'subjects' | 'subjectDetail';

export const SubjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Use teacher-specific hooks for teachers
  const { data: classes = [] } = useTeacherClasses();
  const { data: subjects = [] } = useTeacherSubjects();
  
  const softDeleteMutation = useSoftDelete();
  const toggleStatusMutation = useToggleStatus();
  
  const [viewMode, setViewMode] = useState<ViewMode>('subjects');
  const [selectedSubject, setSelectedSubject] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('all-classes');
  const [teacherFilter, setTeacherFilter] = useState('all-teachers');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const [newSubject, setNewSubject] = useState({ name: '', description: '', classId: '' });
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const createSubjectMutation = useSupabaseMutation(
    async (data: any) => await supabase.from('subjects').insert(data).select().single(),
    {
      successMessage: "Subject created successfully",
      invalidateKeys: [['teacher-subjects']],
      onSuccess: () => {
        setNewSubject({ name: '', description: '', classId: '' });
        setIsDialogOpen(false);
      }
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

  const handleSubjectSelect = (subject: any) => {
    setSelectedSubject(subject);
    setViewMode('subjectDetail');
  };

  const handleBackToSubjects = () => {
    setViewMode('subjects');
    setSelectedSubject(null);
  };

  const handleDeleteSubject = (subjectId: string) => {
    if (user?.role === 'principal' && user?.id) {
      if (confirm('Are you sure you want to move this subject to the bin?')) {
        softDeleteMutation.mutate({
          tableName: 'subjects',
          itemId: subjectId,
          deleterId: user.id
        });
      }
    }
  };

  const handleToggleSubjectStatus = (subjectId: string, currentStatus: boolean) => {
    if (user?.role === 'principal') {
      toggleStatusMutation.mutate({
        tableName: 'subjects',
        itemId: subjectId,
        isActive: !currentStatus
      });
    }
  };

  const selectedClass = selectedSubject ? classes.find((cls: any) => cls.id === selectedSubject.class_id) : null;

  const getPageTitle = () => {
    switch (viewMode) {
      case 'subjects': return user?.role === 'teacher' ? 'My Subjects' : 'Subjects Management';
      case 'subjectDetail': return selectedSubject?.name || 'Subject Details';
      default: return 'Subjects Management';
    }
  };

  const getPageDescription = () => {
    switch (viewMode) {
      case 'subjects': return user?.role === 'teacher' 
        ? 'Manage subjects you are teaching'
        : 'Manage all your subjects with advanced filtering';
      case 'subjectDetail': return 'Detailed subject information and analytics';
      default: return 'Manage all your subjects and their details';
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
          
          {viewMode === 'subjects' && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Subject
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
                      <SelectContent className="bg-background border z-50">
                        {classes.map((cls: any) => (
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
                    className="w-full"
                  >
                    {createSubjectMutation.isPending ? 'Creating...' : 'Create Subject'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Dynamic Content Based on View Mode */}
        {viewMode === 'subjects' && (
          <SubjectFilters
            subjects={subjects}
            classes={classes}
            onSubjectSelect={handleSubjectSelect}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            classFilter={classFilter}
            onClassFilterChange={setClassFilter}
            teacherFilter={teacherFilter}
            onTeacherFilterChange={setTeacherFilter}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            onDeleteSubject={handleDeleteSubject}
            onToggleSubjectStatus={handleToggleSubjectStatus}
          />
        )}

        {viewMode === 'subjectDetail' && selectedSubject && selectedClass && (
          <SubjectDetailView
            subject={selectedSubject}
            classInfo={selectedClass}
            onBack={handleBackToSubjects}
          />
        )}
      </main>
    </div>
  );
};
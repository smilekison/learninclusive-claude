import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useTeacherSubjects, useTeacherAssignments, useTeacherClasses, useSupabaseMutation } from '@/hooks/useSupabaseQuery';
import { supabase } from '@/integrations/supabase/client';
import { Plus, ArrowLeft } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AssignmentFilters } from '@/components/assignments/AssignmentFilters';
import { AssignmentDetailView } from '@/components/assignments/AssignmentDetailView';

type ViewMode = 'assignments' | 'assignmentDetail';

export const AssignmentsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Use teacher-specific hooks for teachers
  const { data: subjects = [] } = useTeacherSubjects();
  const { data: assignments = [] } = useTeacherAssignments();
  const { data: classes = [] } = useTeacherClasses();
  
  const [viewMode, setViewMode] = useState<ViewMode>('assignments');
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all-subjects');
  const [statusFilter, setStatusFilter] = useState('all-status');
  const [classFilter, setClassFilter] = useState('all-classes');
  
  const [newAssignment, setNewAssignment] = useState({ 
    title: '', 
    description: '', 
    subjectId: '', 
    dueDate: '',
    maxScore: 100 
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editAssignment, setEditAssignment] = useState({
    title: '',
    description: '',
    subjectId: '',
    dueDate: '',
    maxScore: 100,
  });

  const createAssignmentMutation = useSupabaseMutation(
    async (data: any) => await supabase.from('assignments').insert(data).select().single(),
    {
      successMessage: "Assignment created successfully",
      invalidateKeys: [['teacher-assignments']],
      onSuccess: () => {
        setNewAssignment({ title: '', description: '', subjectId: '', dueDate: '', maxScore: 100 });
        setIsDialogOpen(false);
      }
    }
  );

  const updateAssignmentMutation = useSupabaseMutation(
    async ({ id, updates }: { id: string; updates: any }) =>
      await supabase.from('assignments').update(updates).eq('id', id).select().single(),
    {
      successMessage: 'Assignment updated successfully',
      invalidateKeys: [['teacher-assignments']],
      onSuccess: (updated: any) => {
        if (updated) setSelectedAssignment(updated);
        setIsEditOpen(false);
      },
    }
  );

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

  const handleAssignmentSelect = (assignment: any) => {
    setSelectedAssignment(assignment);
    setViewMode('assignmentDetail');
  };

  const handleBackToAssignments = () => {
    setViewMode('assignments');
    setSelectedAssignment(null);
  };

  const openEdit = () => {
    if (!selectedAssignment) return;
    setEditAssignment({
      title: selectedAssignment.title || '',
      description: selectedAssignment.description || '',
      subjectId: selectedAssignment.subject_id,
      dueDate: selectedAssignment.due_date ? new Date(selectedAssignment.due_date).toISOString().slice(0, 16) : '',
      maxScore: selectedAssignment.max_score || 100,
    });
    setIsEditOpen(true);
  };

  const handleUpdateAssignment = async () => {
    if (!selectedAssignment) return;
    await updateAssignmentMutation.mutateAsync({
      id: selectedAssignment.id,
      updates: {
        title: editAssignment.title,
        description: editAssignment.description,
        subject_id: editAssignment.subjectId,
        due_date: editAssignment.dueDate || null,
        max_score: editAssignment.maxScore,
      },
    });
  };

  const selectedSubject = selectedAssignment ? subjects.find((subject: any) => subject.id === selectedAssignment.subject_id) : null;
  const selectedClass = selectedSubject ? classes.find((cls: any) => cls.id === selectedSubject.class_id) : null;

  const getPageTitle = () => {
    switch (viewMode) {
      case 'assignments': return user?.role === 'teacher' ? 'My Assignments' : 'Assignments Management';
      case 'assignmentDetail': return selectedAssignment?.title || 'Assignment Details';
      default: return 'Assignments Management';
    }
  };

  const getPageDescription = () => {
    switch (viewMode) {
      case 'assignments': return user?.role === 'teacher' 
        ? 'Create and manage assignments for your subjects'
        : 'Create and manage assignments with advanced filtering';
      case 'assignmentDetail': return 'Detailed assignment analytics and submissions';
      default: return 'Create and manage assignments for your subjects';
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
          
          {viewMode === 'assignments' && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Assignment
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
                      <SelectContent className="bg-background border z-50">
                        {subjects.map((subject: any) => (
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
                    className="w-full"
                  >
                    {createAssignmentMutation.isPending ? 'Creating...' : 'Create Assignment'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Dynamic Content Based on View Mode */}
        {viewMode === 'assignments' && (
          <AssignmentFilters
            assignments={assignments}
            subjects={subjects}
            classes={classes}
            onAssignmentSelect={handleAssignmentSelect}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            subjectFilter={subjectFilter}
            onSubjectFilterChange={setSubjectFilter}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            classFilter={classFilter}
            onClassFilterChange={setClassFilter}
          />
        )}

        {viewMode === 'assignmentDetail' && selectedAssignment && selectedSubject && selectedClass && (
          <div className="space-y-4">
            {user?.role === 'teacher' && (
              <div className="flex justify-end">
                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={openEdit}>Edit Assignment</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Assignment</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="edit-assignment-title">Assignment Title</Label>
                        <Input
                          id="edit-assignment-title"
                          value={editAssignment.title}
                          onChange={(e) => setEditAssignment({ ...editAssignment, title: e.target.value })}
                          placeholder="Enter assignment title"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-assignment-description">Description</Label>
                        <Textarea
                          id="edit-assignment-description"
                          value={editAssignment.description}
                          onChange={(e) => setEditAssignment({ ...editAssignment, description: e.target.value })}
                          placeholder="Enter assignment description"
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-assignment-subject">Subject</Label>
                        <Select value={editAssignment.subjectId} onValueChange={(value) => setEditAssignment({ ...editAssignment, subjectId: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a subject" />
                          </SelectTrigger>
                          <SelectContent className="bg-background border z-50">
                            {subjects.map((subject: any) => (
                              <SelectItem key={subject.id} value={subject.id}>
                                {subject.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="edit-assignment-due-date">Due Date</Label>
                        <Input
                          id="edit-assignment-due-date"
                          type="datetime-local"
                          value={editAssignment.dueDate}
                          onChange={(e) => setEditAssignment({ ...editAssignment, dueDate: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-assignment-max-score">Max Score</Label>
                        <Input
                          id="edit-assignment-max-score"
                          type="number"
                          value={editAssignment.maxScore}
                          onChange={(e) => setEditAssignment({ ...editAssignment, maxScore: parseInt(e.target.value) || 100 })}
                        />
                      </div>
                      <Button 
                        onClick={handleUpdateAssignment}
                        disabled={updateAssignmentMutation.isPending || !editAssignment.title || !editAssignment.subjectId}
                        className="w-full"
                      >
                        {updateAssignmentMutation.isPending ? 'Updating...' : 'Update Assignment'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            )}
            <AssignmentDetailView
              assignment={selectedAssignment}
              subjectInfo={selectedSubject}
              classInfo={selectedClass}
              onBack={handleBackToAssignments}
            />
          </div>
        )}
      </main>
    </div>
  );
};
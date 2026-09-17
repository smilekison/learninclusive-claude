import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useTeacherSubjects, useTeacherAssignments, useTeacherClasses, useSupabaseMutation, useSubjects, useAssignments, useClasses } from '@/hooks/useSupabaseQuery';
import { supabase } from '@/integrations/supabase/client';
import { Plus, ArrowLeft } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AssignmentFilters } from '@/components/assignments/AssignmentFilters';
import { EnhancedAssignmentView } from '@/components/assignments/EnhancedAssignmentView';
import { EnhancedAssignmentCreation } from '@/components/assignments/EnhancedAssignmentCreation';

type ViewMode = 'assignments' | 'assignmentDetail';

export const AssignmentsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Fetch both teacher-scoped and global data, then select based on role
  const { data: tSubjects = [] } = useTeacherSubjects();
  const { data: allSubjects = [] } = useSubjects();
  const subjects = (user?.role === 'principal') ? allSubjects : tSubjects;

  const { data: tAssignments = [] } = useTeacherAssignments();
  const { data: allAssignments = [] } = useAssignments();
  const assignments = (user?.role === 'principal') ? allAssignments : tAssignments;

  const { data: tClasses = [] } = useTeacherClasses();
  const { data: allClasses = [] } = useClasses();
  const classes = (user?.role === 'principal') ? allClasses : tClasses;
  
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
      invalidateKeys: [['teacher-assignments'], ['assignments']],
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
      invalidateKeys: [['teacher-assignments'], ['assignments']],
      onSuccess: (updated: any) => {
        if (updated) setSelectedAssignment(updated);
        setIsEditOpen(false);
      },
    }
  );

  const handleCreateAssignment = async (data: any) => {
    console.log('Creating assignment with data:', data);
    
    if (!data.title || !data.subject_id) {
      console.error('Missing required fields:', { title: data.title, subject_id: data.subject_id });
      return;
    }
    
    // Simplified assignment data that matches the database schema
    const assignmentData = {
      title: data.title,
      description: data.description || '',
      subject_id: data.subject_id,
      due_date: data.due_date || null,
      max_score: data.max_score || 100,
      submission_types: data.submission_types || ['file_upload'],
      time_limit_minutes: data.time_limit_minutes || null,
      show_grades_to_students: data.show_grades_to_students ?? true,
      ai_assistance_config: data.ai_assistance_config || {},
      analytics_config: data.analytics_config || {},
      group_assignment: data.group_assignment || false,
      max_attempts: data.max_attempts || 3,
      peer_review: data.peer_review || false,
      plagiarism_check: data.plagiarism_check ?? true,
      allow_late_submissions: data.allow_late_submissions ?? true
    };

    console.log('Final assignment data:', assignmentData);
    await createAssignmentMutation.mutateAsync(assignmentData);
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
            <>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Assignment
              </Button>
              <EnhancedAssignmentCreation
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                onSubmit={handleCreateAssignment}
                subjects={subjects}
                classes={classes}
              />
            </>
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
              <EnhancedAssignmentCreation
                open={isEditOpen}
                onOpenChange={setIsEditOpen}
                onSubmit={async (data) => {
                  await updateAssignmentMutation.mutateAsync({
                    id: selectedAssignment.id,
                    updates: {
                      title: data.title,
                      description: data.description,
                      subject_id: data.subject_id,
                      due_date: data.due_date || null,
                      max_score: data.max_score,
                      submission_types: data.submission_types,
                      time_limit_minutes: data.time_limit_minutes,
                      show_grades_to_students: data.show_grades_to_students,
                      ai_assistance_config: data.ai_assistance_config,
                      analytics_config: data.analytics_config,
                      group_assignment: data.group_assignment,
                      max_attempts: data.max_attempts,
                      peer_review: data.peer_review,
                      plagiarism_check: data.plagiarism_check,
                      allow_late_submissions: data.allow_late_submissions
                    }
                  });
                }}
                subjects={subjects}
                classes={classes}
                initialData={selectedAssignment}
              />
              <Button onClick={openEdit}>Edit Assignment</Button>
              </div>
            )}
            <EnhancedAssignmentView
              assignment={selectedAssignment}
            />
          </div>
        )}
      </main>
    </div>
  );
};
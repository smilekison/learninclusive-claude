import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Plus, 
  BookOpen, 
  Edit, 
  Trash2, 
  Play, 
  Calendar,
  Clock,
  Users,
  FileText,
  Save,
  X
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Truncate } from '@/components/ui/truncate';

interface LessonCRUDProps {
  subjectId: string;
  className?: string;
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  content: string;
  lesson_order: number;
  created_at: string;
  updated_at: string;
  subject_id: string;
}

export const LessonCRUD: React.FC<LessonCRUDProps> = ({ subjectId, className }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  const [newLesson, setNewLesson] = useState({
    title: '',
    description: '',
    content: '',
    lesson_order: 1
  });

  // Fetch lessons
  const { data: lessons = [], isLoading, error } = useQuery({
    queryKey: ['lessons', subjectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('subject_id', subjectId)
        .order('lesson_order', { ascending: true });
      
      if (error) throw error;
      return data as Lesson[];
    },
    enabled: !!subjectId
  });

  // Create lesson mutation
  const createLessonMutation = useMutation({
    mutationFn: async (lessonData: typeof newLesson) => {
      const { data, error } = await supabase
        .from('lessons')
        .insert({
          ...lessonData,
          subject_id: subjectId
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lessons', subjectId] });
      setNewLesson({ title: '', description: '', content: '', lesson_order: 1 });
      setCreateDialogOpen(false);
      toast({
        title: 'Success',
        description: 'Lesson created successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create lesson',
        variant: 'destructive',
      });
    }
  });

  // Update lesson mutation
  const updateLessonMutation = useMutation({
    mutationFn: async (lesson: Lesson) => {
      const { data, error } = await supabase
        .from('lessons')
        .update({
          title: lesson.title,
          description: lesson.description,
          content: lesson.content,
          lesson_order: lesson.lesson_order
        })
        .eq('id', lesson.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lessons', subjectId] });
      setSelectedLesson(null);
      setEditDialogOpen(false);
      toast({
        title: 'Success',
        description: 'Lesson updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update lesson',
        variant: 'destructive',
      });
    }
  });

  // Delete lesson mutation
  const deleteLessonMutation = useMutation({
    mutationFn: async (lessonId: string) => {
      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', lessonId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lessons', subjectId] });
      setDeleteConfirmId(null);
      toast({
        title: 'Success',
        description: 'Lesson deleted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete lesson',
        variant: 'destructive',
      });
    }
  });

  const handleCreateLesson = () => {
    createLessonMutation.mutate(newLesson);
  };

  const handleUpdateLesson = () => {
    if (selectedLesson) {
      updateLessonMutation.mutate(selectedLesson);
    }
  };

  const handleDeleteLesson = (lessonId: string) => {
    deleteLessonMutation.mutate(lessonId);
  };

  const handleEditClick = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setEditDialogOpen(true);
  };

  const nextOrder = Math.max(...lessons.map(l => l.lesson_order), 0) + 1;

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="py-8">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading lessons...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Lessons ({lessons.length})
            </CardTitle>
            <CardDescription>
              Create and manage lessons for this subject
            </CardDescription>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setNewLesson({ ...newLesson, lesson_order: nextOrder })}>
                <Plus className="h-4 w-4 mr-2" />
                Add Lesson
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Lesson</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="lesson-title">Lesson Title</Label>
                    <Input
                      id="lesson-title"
                      value={newLesson.title}
                      onChange={(e) => setNewLesson({ ...newLesson, title: e.target.value })}
                      placeholder="Enter lesson title"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lesson-order">Lesson Order</Label>
                    <Input
                      id="lesson-order"
                      type="number"
                      value={newLesson.lesson_order}
                      onChange={(e) => setNewLesson({ ...newLesson, lesson_order: parseInt(e.target.value) || 1 })}
                      min="1"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="lesson-description">Description</Label>
                  <Textarea
                    id="lesson-description"
                    value={newLesson.description}
                    onChange={(e) => setNewLesson({ ...newLesson, description: e.target.value })}
                    placeholder="Brief description of the lesson"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="lesson-content">Lesson Content</Label>
                  <Textarea
                    id="lesson-content"
                    value={newLesson.content}
                    onChange={(e) => setNewLesson({ ...newLesson, content: e.target.value })}
                    placeholder="Detailed lesson content, objectives, and materials"
                    rows={6}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateLesson}
                    disabled={!newLesson.title || createLessonMutation.isPending}
                  >
                    {createLessonMutation.isPending ? 'Creating...' : 'Create Lesson'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {lessons.length === 0 ? (
          <div className="text-center py-12 space-y-4">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground" />
            <div>
              <h3 className="font-medium text-lg">No lessons yet</h3>
              <p className="text-muted-foreground">Create your first lesson to get started</p>
            </div>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Lesson
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {lessons.map((lesson) => (
              <Card key={lesson.id} className="border-l-4 border-l-primary">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge variant="outline">Lesson {lesson.lesson_order}</Badge>
                        <h4 className="font-semibold text-lg">{lesson.title}</h4>
                      </div>
                      {lesson.description && (
                        <Truncate className="text-muted-foreground mb-2">
                          {lesson.description}
                        </Truncate>
                      )}
                      {lesson.content && (
                        <Truncate className="text-sm text-muted-foreground">
                          {lesson.content}
                        </Truncate>
                      )}
                      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Created {new Date(lesson.created_at).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Updated {new Date(lesson.updated_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEditClick(lesson)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setDeleteConfirmId(lesson.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Edit Dialog */}
        {selectedLesson && (
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Edit Lesson</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-title">Lesson Title</Label>
                    <Input
                      id="edit-title"
                      value={selectedLesson.title}
                      onChange={(e) => setSelectedLesson({ ...selectedLesson, title: e.target.value })}
                      placeholder="Enter lesson title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-order">Lesson Order</Label>
                    <Input
                      id="edit-order"
                      type="number"
                      value={selectedLesson.lesson_order}
                      onChange={(e) => setSelectedLesson({ ...selectedLesson, lesson_order: parseInt(e.target.value) || 1 })}
                      min="1"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={selectedLesson.description}
                    onChange={(e) => setSelectedLesson({ ...selectedLesson, description: e.target.value })}
                    placeholder="Brief description of the lesson"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-content">Lesson Content</Label>
                  <Textarea
                    id="edit-content"
                    value={selectedLesson.content}
                    onChange={(e) => setSelectedLesson({ ...selectedLesson, content: e.target.value })}
                    placeholder="Detailed lesson content, objectives, and materials"
                    rows={6}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleUpdateLesson}
                    disabled={!selectedLesson.title || updateLessonMutation.isPending}
                  >
                    {updateLessonMutation.isPending ? 'Updating...' : 'Update Lesson'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Delete Confirmation Dialog */}
        {deleteConfirmId && (
          <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Lesson</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Are you sure you want to delete this lesson? This action cannot be undone.
                </p>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
                    Cancel
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={() => handleDeleteLesson(deleteConfirmId)}
                    disabled={deleteLessonMutation.isPending}
                  >
                    {deleteLessonMutation.isPending ? 'Deleting...' : 'Delete'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
};
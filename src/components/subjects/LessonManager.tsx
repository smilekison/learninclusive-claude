import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  BookOpen, 
  Plus, 
  FileText, 
  Calendar,
  Edit,
  Trash2,
  Upload
} from 'lucide-react';

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  lesson_order: number;
  created_at: string;
  updated_at: string;
}

interface LessonManagerProps {
  subjectId: string;
  subjectName: string;
}

export const LessonManager: React.FC<LessonManagerProps> = ({ subjectId, subjectName }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(false);
  const [createDialog, setCreateDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    lesson_order: 1
  });

  // Fetch lessons for this subject
  React.useEffect(() => {
    const fetchLessons = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('lessons')
          .select('*')
          .eq('subject_id', subjectId)
          .order('lesson_order', { ascending: true });

        if (error) throw error;
        setLessons(data || []);
      } catch (error: any) {
        console.error('Error fetching lessons:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch lessons',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    if (subjectId) {
      fetchLessons();
    }
  }, [subjectId, toast]);

  const handleCreateLesson = async () => {
    if (!user || !formData.title.trim()) return;

    try {
      const { error } = await supabase
        .from('lessons')
        .insert({
          subject_id: subjectId,
          title: formData.title,
          description: formData.description || null,
          content: formData.content || null,
          lesson_order: formData.lesson_order
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Lesson created successfully!',
      });

      setCreateDialog(false);
      resetForm();
      
      // Refresh lessons
      const { data } = await supabase
        .from('lessons')
        .select('*')
        .eq('subject_id', subjectId)
        .order('lesson_order', { ascending: true });
      
      setLessons(data || []);
    } catch (error: any) {
      console.error('Error creating lesson:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create lesson',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateLesson = async () => {
    if (!selectedLesson || !formData.title.trim()) return;

    try {
      const { error } = await supabase
        .from('lessons')
        .update({
          title: formData.title,
          description: formData.description || null,
          content: formData.content || null,
          lesson_order: formData.lesson_order
        })
        .eq('id', selectedLesson.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Lesson updated successfully!',
      });

      setEditDialog(false);
      setSelectedLesson(null);
      resetForm();
      
      // Refresh lessons
      const { data } = await supabase
        .from('lessons')
        .select('*')
        .eq('subject_id', subjectId)
        .order('lesson_order', { ascending: true });
      
      setLessons(data || []);
    } catch (error: any) {
      console.error('Error updating lesson:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update lesson',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!window.confirm('Are you sure you want to delete this lesson?')) return;

    try {
      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', lessonId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Lesson deleted successfully!',
      });
      
      // Refresh lessons
      const { data } = await supabase
        .from('lessons')
        .select('*')
        .eq('subject_id', subjectId)
        .order('lesson_order', { ascending: true });
      
      setLessons(data || []);
    } catch (error: any) {
      console.error('Error deleting lesson:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete lesson',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      content: '',
      lesson_order: lessons.length + 1
    });
  };

  const openEditDialog = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setFormData({
      title: lesson.title,
      description: lesson.description || '',
      content: lesson.content || '',
      lesson_order: lesson.lesson_order
    });
    setEditDialog(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Lessons</h3>
          <p className="text-sm text-muted-foreground">
            Manage lessons for {subjectName}
          </p>
        </div>
        
        <Dialog open={createDialog} onOpenChange={setCreateDialog}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
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
                  <Label htmlFor="title">Lesson Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter lesson title"
                  />
                </div>
                <div>
                  <Label htmlFor="order">Lesson Order</Label>
                  <Input
                    id="order"
                    type="number"
                    min="1"
                    value={formData.lesson_order}
                    onChange={(e) => setFormData(prev => ({ ...prev, lesson_order: parseInt(e.target.value) || 1 }))}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter lesson description"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="content">Lesson Content</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Enter lesson content, materials, instructions, etc."
                  rows={6}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateLesson} disabled={!formData.title.trim()}>
                  Create Lesson
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lessons List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading lessons...</p>
        </div>
      ) : lessons.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No lessons yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first lesson to start building your curriculum
            </p>
            <Button onClick={() => { resetForm(); setCreateDialog(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Add First Lesson
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {lessons.map((lesson) => (
            <Card key={lesson.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">
                      Lesson {lesson.lesson_order}
                    </Badge>
                    <CardTitle className="text-lg">{lesson.title}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(lesson)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteLesson(lesson.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                {lesson.description && (
                  <CardDescription>{lesson.description}</CardDescription>
                )}
              </CardHeader>
              {lesson.content && (
                <CardContent>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4" />
                      <span className="text-sm font-medium">Content</span>
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {lesson.content.length > 200 
                        ? `${lesson.content.substring(0, 200)}...` 
                        : lesson.content
                      }
                    </p>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
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
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter lesson title"
                />
              </div>
              <div>
                <Label htmlFor="edit-order">Lesson Order</Label>
                <Input
                  id="edit-order"
                  type="number"
                  min="1"
                  value={formData.lesson_order}
                  onChange={(e) => setFormData(prev => ({ ...prev, lesson_order: parseInt(e.target.value) || 1 }))}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter lesson description"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="edit-content">Lesson Content</Label>
              <Textarea
                id="edit-content"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Enter lesson content, materials, instructions, etc."
                rows={6}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateLesson} disabled={!formData.title.trim()}>
                Update Lesson
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
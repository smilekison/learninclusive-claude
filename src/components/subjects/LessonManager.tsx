import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  BookOpen, 
  Plus, 
  Edit, 
  Trash2, 
  FileText, 
  Video, 
  Image, 
  Download,
  Upload,
  Paperclip
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface LessonManagerProps {
  subjectId: string;
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  content: string;
  lesson_order: number;
  created_at: string;
  materials?: Material[];
}

interface Material {
  id: string;
  title: string;
  description: string;
  file_path: string;
  file_type: string;
  created_at: string;
  uploaded_by: string;
}

export const LessonManager: React.FC<LessonManagerProps> = ({ subjectId }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [materialDialogOpen, setMaterialDialogOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [newLesson, setNewLesson] = useState({
    title: '',
    description: '',
    content: '',
    lesson_order: 1
  });
  const [newMaterial, setNewMaterial] = useState({
    title: '',
    description: '',
    file: null as File | null
  });

  // Fetch lessons for this subject
  const { data: lessons = [], isLoading } = useQuery({
    queryKey: ['lessons', subjectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lessons')
        .select(`
          *,
          materials(*)
        `)
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
      setCreateDialogOpen(false);
      setNewLesson({ title: '', description: '', content: '', lesson_order: 1 });
      toast({
        title: 'Success',
        description: 'Lesson created successfully!',
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
    mutationFn: async ({ id, ...lessonData }: Lesson) => {
      const { data, error } = await supabase
        .from('lessons')
        .update(lessonData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lessons', subjectId] });
      setEditDialogOpen(false);
      setSelectedLesson(null);
      toast({
        title: 'Success',
        description: 'Lesson updated successfully!',
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
      toast({
        title: 'Success',
        description: 'Lesson deleted successfully!',
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

  // Add material mutation
  const addMaterialMutation = useMutation({
    mutationFn: async ({ lessonId, materialData }: { lessonId: string; materialData: any }) => {
      if (!user) throw new Error('User not authenticated');

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profileError || !profile) throw new Error('Profile not found');

      let filePath = '';
      
      // Upload file to storage if provided
      if (materialData.file) {
        const fileExt = materialData.file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('videos') // Using existing videos bucket
          .upload(`materials/${fileName}`, materialData.file);

        if (uploadError) throw uploadError;
        filePath = uploadData.path;
      }

      const { data, error } = await supabase
        .from('materials')
        .insert({
          title: materialData.title,
          description: materialData.description,
          file_path: filePath,
          file_type: materialData.file?.type || 'unknown',
          lesson_id: lessonId,
          uploaded_by: profile.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lessons', subjectId] });
      setMaterialDialogOpen(false);
      setNewMaterial({ title: '', description: '', file: null });
      setSelectedLesson(null);
      toast({
        title: 'Success',
        description: 'Material uploaded successfully!',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload material',
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
    if (confirm('Are you sure you want to delete this lesson?')) {
      deleteLessonMutation.mutate(lessonId);
    }
  };

  const handleAddMaterial = () => {
    if (selectedLesson && newMaterial.title) {
      addMaterialMutation.mutate({
        lessonId: selectedLesson.id,
        materialData: newMaterial
      });
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('video/')) return <Video className="w-4 h-4" />;
    if (fileType.startsWith('image/')) return <Image className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  if (isLoading) return <div>Loading lessons...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Lessons</h3>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Lesson
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Lesson</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={newLesson.title}
                  onChange={(e) => setNewLesson({ ...newLesson, title: e.target.value })}
                  placeholder="Enter lesson title"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newLesson.description}
                  onChange={(e) => setNewLesson({ ...newLesson, description: e.target.value })}
                  placeholder="Enter lesson description"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={newLesson.content}
                  onChange={(e) => setNewLesson({ ...newLesson, content: e.target.value })}
                  placeholder="Enter lesson content"
                  rows={6}
                />
              </div>
              <div>
                <Label htmlFor="order">Lesson Order</Label>
                <Input
                  id="order"
                  type="number"
                  value={newLesson.lesson_order}
                  onChange={(e) => setNewLesson({ ...newLesson, lesson_order: parseInt(e.target.value) || 1 })}
                  min="1"
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

      <div className="grid gap-4">
        {lessons.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No lessons found. Create your first lesson!</p>
            </CardContent>
          </Card>
        ) : (
          lessons.map((lesson) => (
            <Card key={lesson.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Badge variant="outline">#{lesson.lesson_order}</Badge>
                      {lesson.title}
                    </CardTitle>
                    <CardDescription>{lesson.description}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedLesson(lesson);
                        setMaterialDialogOpen(true);
                      }}
                    >
                      <Upload className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedLesson(lesson);
                        setEditDialogOpen(true);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteLesson(lesson.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {lesson.content && (
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm whitespace-pre-wrap">{lesson.content}</p>
                    </div>
                  )}
                  
                  {lesson.materials && lesson.materials.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <Paperclip className="w-4 h-4" />
                        Materials ({lesson.materials.length})
                      </h4>
                      <div className="grid gap-2">
                        {lesson.materials.map((material) => (
                          <div key={material.id} className="flex items-center justify-between p-2 border rounded-lg">
                            <div className="flex items-center gap-2">
                              {getFileIcon(material.file_type)}
                              <div>
                                <p className="font-medium text-sm">{material.title}</p>
                                <p className="text-xs text-muted-foreground">{material.description}</p>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm">
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Lesson Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Lesson</DialogTitle>
          </DialogHeader>
          {selectedLesson && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={selectedLesson.title}
                  onChange={(e) => setSelectedLesson({ ...selectedLesson, title: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={selectedLesson.description}
                  onChange={(e) => setSelectedLesson({ ...selectedLesson, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="edit-content">Content</Label>
                <Textarea
                  id="edit-content"
                  value={selectedLesson.content}
                  onChange={(e) => setSelectedLesson({ ...selectedLesson, content: e.target.value })}
                  rows={6}
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
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleUpdateLesson}
                  disabled={updateLessonMutation.isPending}
                >
                  {updateLessonMutation.isPending ? 'Updating...' : 'Update Lesson'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Material Dialog */}
      <Dialog open={materialDialogOpen} onOpenChange={setMaterialDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Material to Lesson</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="material-title">Material Title</Label>
              <Input
                id="material-title"
                value={newMaterial.title}
                onChange={(e) => setNewMaterial({ ...newMaterial, title: e.target.value })}
                placeholder="Enter material title"
              />
            </div>
            <div>
              <Label htmlFor="material-description">Description</Label>
              <Textarea
                id="material-description"
                value={newMaterial.description}
                onChange={(e) => setNewMaterial({ ...newMaterial, description: e.target.value })}
                placeholder="Enter material description"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="material-file">Upload File</Label>
              <Input
                id="material-file"
                type="file"
                onChange={(e) => setNewMaterial({ ...newMaterial, file: e.target.files?.[0] || null })}
                accept="*/*"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setMaterialDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddMaterial}
                disabled={!newMaterial.title || addMaterialMutation.isPending}
              >
                {addMaterialMutation.isPending ? 'Uploading...' : 'Add Material'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
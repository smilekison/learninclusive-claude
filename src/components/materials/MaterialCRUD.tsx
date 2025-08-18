import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Plus, 
  FileText, 
  Edit, 
  Trash2, 
  Download,
  Upload,
  Paperclip,
  FileImage,
  FileVideo,
  FileAudio,
  File
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Truncate } from '@/components/ui/truncate';

interface MaterialCRUDProps {
  subjectId?: string;
  lessonId?: string;
  className?: string;
}

interface Material {
  id: string;
  title: string;
  description: string;
  file_path: string;
  file_type: string;
  created_at: string;
  uploaded_by: string;
  subject_id?: string;
  lesson_id?: string;
}

export const MaterialCRUD: React.FC<MaterialCRUDProps> = ({ subjectId, lessonId, className }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  
  const [newMaterial, setNewMaterial] = useState({
    title: '',
    description: '',
    file: null as File | null
  });

  // Fetch materials
  const { data: materials = [], isLoading } = useQuery({
    queryKey: ['materials', subjectId, lessonId],
    queryFn: async () => {
      let query = supabase.from('materials').select('*');
      
      if (subjectId) {
        query = query.eq('subject_id', subjectId);
      }
      if (lessonId) {
        query = query.eq('lesson_id', lessonId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Material[];
    },
    enabled: !!(subjectId || lessonId)
  });

  // Create material mutation
  const createMaterialMutation = useMutation({
    mutationFn: async (materialData: typeof newMaterial) => {
      if (!materialData.file) throw new Error('No file selected');
      
      // Upload file first
      const fileExt = materialData.file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `materials/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('assignment-submissions')
        .upload(filePath, materialData.file);
      
      if (uploadError) throw uploadError;
      
      // Create material record
      const { data, error } = await supabase
        .from('materials')
        .insert({
          title: materialData.title,
          description: materialData.description,
          file_path: filePath,
          file_type: materialData.file.type,
          uploaded_by: user?.id,
          subject_id: subjectId || null,
          lesson_id: lessonId || null
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials', subjectId, lessonId] });
      setNewMaterial({ title: '', description: '', file: null });
      setCreateDialogOpen(false);
      toast({
        title: 'Success',
        description: 'Material uploaded successfully',
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

  // Update material mutation
  const updateMaterialMutation = useMutation({
    mutationFn: async (material: Material) => {
      const { data, error } = await supabase
        .from('materials')
        .update({
          title: material.title,
          description: material.description
        })
        .eq('id', material.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials', subjectId, lessonId] });
      setSelectedMaterial(null);
      setEditDialogOpen(false);
      toast({
        title: 'Success',
        description: 'Material updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update material',
        variant: 'destructive',
      });
    }
  });

  // Delete material mutation
  const deleteMaterialMutation = useMutation({
    mutationFn: async (materialId: string) => {
      const material = materials.find(m => m.id === materialId);
      if (material?.file_path) {
        // Delete file from storage
        await supabase.storage
          .from('assignment-submissions')
          .remove([material.file_path]);
      }
      
      const { error } = await supabase
        .from('materials')
        .delete()
        .eq('id', materialId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials', subjectId, lessonId] });
      setDeleteConfirmId(null);
      toast({
        title: 'Success',
        description: 'Material deleted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete material',
        variant: 'destructive',
      });
    }
  });

  const handleCreateMaterial = () => {
    createMaterialMutation.mutate(newMaterial);
  };

  const handleUpdateMaterial = () => {
    if (selectedMaterial) {
      updateMaterialMutation.mutate(selectedMaterial);
    }
  };

  const handleDeleteMaterial = (materialId: string) => {
    deleteMaterialMutation.mutate(materialId);
  };

  const handleEditClick = (material: Material) => {
    setSelectedMaterial(material);
    setEditDialogOpen(true);
  };

  const handleDownload = async (material: Material) => {
    try {
      const { data, error } = await supabase.storage
        .from('assignment-submissions')
        .download(material.file_path);
      
      if (error) throw error;
      
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = material.title || 'download';
      a.click();
      URL.revokeObjectURL(url);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to download file',
        variant: 'destructive',
      });
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <FileImage className="h-4 w-4" />;
    if (fileType.startsWith('video/')) return <FileVideo className="h-4 w-4" />;
    if (fileType.startsWith('audio/')) return <FileAudio className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const getFileTypeColor = (fileType: string) => {
    if (fileType.startsWith('image/')) return 'text-blue-500';
    if (fileType.startsWith('video/')) return 'text-purple-500';
    if (fileType.startsWith('audio/')) return 'text-green-500';
    return 'text-muted-foreground';
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="py-8">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading materials...</p>
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
              <Paperclip className="h-5 w-5" />
              Materials ({materials.length})
            </CardTitle>
            <CardDescription>
              Upload and manage course materials
            </CardDescription>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="h-4 w-4 mr-2" />
                Upload Material
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload New Material</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="material-title">Title</Label>
                  <Input
                    id="material-title"
                    value={newMaterial.title}
                    onChange={(e) => setNewMaterial({ ...newMaterial, title: e.target.value })}
                    placeholder="Enter material title"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="material-description">Description</Label>
                  <Textarea
                    id="material-description"
                    value={newMaterial.description}
                    onChange={(e) => setNewMaterial({ ...newMaterial, description: e.target.value })}
                    placeholder="Brief description of the material"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="material-file">File</Label>
                  <Input
                    id="material-file"
                    type="file"
                    onChange={(e) => setNewMaterial({ ...newMaterial, file: e.target.files?.[0] || null })}
                    required
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateMaterial}
                    disabled={!newMaterial.title || !newMaterial.file || createMaterialMutation.isPending}
                  >
                    {createMaterialMutation.isPending ? 'Uploading...' : 'Upload Material'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {materials.length === 0 ? (
          <div className="text-center py-12 space-y-4">
            <Paperclip className="h-12 w-12 mx-auto text-muted-foreground" />
            <div>
              <h3 className="font-medium text-lg">No materials yet</h3>
              <p className="text-muted-foreground">Upload your first material to get started</p>
            </div>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Upload First Material
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {materials.map((material) => (
              <Card key={material.id} className="border-l-4 border-l-accent">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={getFileTypeColor(material.file_type)}>
                          {getFileIcon(material.file_type)}
                        </div>
                        <h4 className="font-semibold">{material.title}</h4>
                        <Badge variant="outline" className="text-xs">
                          {material.file_type.split('/')[1]?.toUpperCase() || 'FILE'}
                        </Badge>
                      </div>
                      {material.description && (
                        <Truncate className="text-muted-foreground mb-2">
                          {material.description}
                        </Truncate>
                      )}
                      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                        <span>
                          Uploaded {new Date(material.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDownload(material)}
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEditClick(material)}
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setDeleteConfirmId(material.id)}
                        className="text-destructive hover:text-destructive"
                        title="Delete"
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
        {selectedMaterial && (
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Material</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-title">Title</Label>
                  <Input
                    id="edit-title"
                    value={selectedMaterial.title}
                    onChange={(e) => setSelectedMaterial({ ...selectedMaterial, title: e.target.value })}
                    placeholder="Enter material title"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={selectedMaterial.description}
                    onChange={(e) => setSelectedMaterial({ ...selectedMaterial, description: e.target.value })}
                    placeholder="Brief description of the material"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleUpdateMaterial}
                    disabled={!selectedMaterial.title || updateMaterialMutation.isPending}
                  >
                    {updateMaterialMutation.isPending ? 'Updating...' : 'Update Material'}
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
                <DialogTitle>Delete Material</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Are you sure you want to delete this material? This action cannot be undone and will also delete the associated file.
                </p>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
                    Cancel
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={() => handleDeleteMaterial(deleteConfirmId)}
                    disabled={deleteMaterialMutation.isPending}
                  >
                    {deleteMaterialMutation.isPending ? 'Deleting...' : 'Delete'}
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
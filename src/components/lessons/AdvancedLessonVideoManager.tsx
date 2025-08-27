import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { 
  Video, 
  Upload, 
  Play, 
  Trash2, 
  Edit,
  Eye,
  EyeOff,
  Globe,
  Lock,
  Users,
  School,
  Accessibility,
  Subtitles,
  Languages,
  FileVideo,
  ExternalLink,
  Save,
  AlertCircle
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface AdvancedLessonVideoManagerProps {
  lessonId: string;
  lessonTitle: string;
}

interface LessonVideo {
  id: string;
  lesson_id: string;
  title: string;
  description?: string;
  video_url?: string;
  file_path?: string;
  thumbnail_path?: string;
  sign_language_video_url?: string;
  sign_language_file_path?: string;
  visibility: 'public' | 'private' | 'class' | 'school';
  duration_seconds?: number;
  file_size_bytes?: number;
  transcript_text?: string;
  captions_enabled: boolean;
  created_at: string;
  view_count: number;
  like_count: number;
  accessibility_features: any;
  is_featured: boolean;
  created_by: string;
}

export const AdvancedLessonVideoManager: React.FC<AdvancedLessonVideoManagerProps> = ({
  lessonId,
  lessonTitle
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<LessonVideo | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  
  const [videoData, setVideoData] = useState({
    title: '',
    description: '',
    visibility: 'class' as 'public' | 'private' | 'class' | 'school',
    captions_enabled: true,
    is_featured: false,
    video_url: '',
    sign_language_video_url: '',
    transcript_text: ''
  });

  const videoFileRef = useRef<HTMLInputElement>(null);
  const signLanguageFileRef = useRef<HTMLInputElement>(null);
  const thumbnailFileRef = useRef<HTMLInputElement>(null);

  // Fetch lesson videos
  const { data: videos = [], isLoading, error } = useQuery({
    queryKey: ['lesson-videos', lessonId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lesson_videos')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as LessonVideo[];
    }
  });

  // Create/Update video mutation
  const videoMutation = useMutation({
    mutationFn: async ({ videoData, videoFile, signLanguageFile, thumbnailFile }: {
      videoData: any;
      videoFile?: File;
      signLanguageFile?: File;
      thumbnailFile?: File;
    }) => {
      let filePath = editingVideo?.file_path;
      let signLanguageFilePath = editingVideo?.sign_language_file_path;
      let thumbnailPath = editingVideo?.thumbnail_path;

      // Upload main video file
      if (videoFile) {
        const fileExt = videoFile.name.split('.').pop();
        const fileName = `${lessonId}/${Date.now()}_main.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('videos')
          .upload(fileName, videoFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;
        filePath = fileName;
      }

      // Upload sign language video file
      if (signLanguageFile) {
        const fileExt = signLanguageFile.name.split('.').pop();
        const fileName = `${lessonId}/${Date.now()}_sign_language.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('videos')
          .upload(fileName, signLanguageFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;
        signLanguageFilePath = fileName;
      }

      // Upload thumbnail
      if (thumbnailFile) {
        const fileExt = thumbnailFile.name.split('.').pop();
        const fileName = `${lessonId}/${Date.now()}_thumb.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('videos')
          .upload(fileName, thumbnailFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;
        thumbnailPath = fileName;
      }

      const payload = {
        ...videoData,
        lesson_id: lessonId,
        file_path: filePath,
        sign_language_file_path: signLanguageFilePath,
        thumbnail_path: thumbnailPath,
        file_size_bytes: videoFile?.size,
        duration_seconds: null, // Would be calculated by video analysis
        created_by: user?.id,
        accessibility_features: {
          screen_reader_compatible: true,
          keyboard_navigation: true,
          high_contrast_support: true,
          sign_language_available: !!signLanguageFilePath
        }
      };

      if (editingVideo) {
        const { data, error } = await supabase
          .from('lesson_videos')
          .update(payload)
          .eq('id', editingVideo.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('lesson_videos')
          .insert(payload)
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lesson-videos', lessonId] });
      setIsDialogOpen(false);
      setEditingVideo(null);
      resetForm();
      toast({
        title: 'Success',
        description: `Video ${editingVideo ? 'updated' : 'uploaded'} successfully!`,
      });
    },
    onError: (error) => {
      console.error('Video operation error:', error);
      toast({
        title: 'Error',
        description: `Failed to ${editingVideo ? 'update' : 'upload'} video. Please try again.`,
        variant: 'destructive',
      });
    },
  });

  // Delete video mutation
  const deleteMutation = useMutation({
    mutationFn: async (videoId: string) => {
      const video = videos.find(v => v.id === videoId);
      
      // Delete files from storage
      if (video?.file_path) {
        await supabase.storage.from('videos').remove([video.file_path]);
      }
      if (video?.sign_language_file_path) {
        await supabase.storage.from('videos').remove([video.sign_language_file_path]);
      }
      if (video?.thumbnail_path) {
        await supabase.storage.from('videos').remove([video.thumbnail_path]);
      }

      // Delete database record
      const { error } = await supabase
        .from('lesson_videos')
        .delete()
        .eq('id', videoId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lesson-videos', lessonId] });
      toast({
        title: 'Success',
        description: 'Video deleted successfully!',
      });
    },
    onError: (error) => {
      console.error('Delete error:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete video. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const resetForm = () => {
    setVideoData({
      title: '',
      description: '',
      visibility: 'class',
      captions_enabled: true,
      is_featured: false,
      video_url: '',
      sign_language_video_url: '',
      transcript_text: ''
    });
    if (videoFileRef.current) videoFileRef.current.value = '';
    if (signLanguageFileRef.current) signLanguageFileRef.current.value = '';
    if (thumbnailFileRef.current) thumbnailFileRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const videoFile = videoFileRef.current?.files?.[0];
    const signLanguageFile = signLanguageFileRef.current?.files?.[0];
    const thumbnailFile = thumbnailFileRef.current?.files?.[0];

    if (!editingVideo && !videoData.video_url && !videoFile) {
      toast({
        title: 'Error',
        description: 'Please provide either a video file or video URL.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    videoMutation.mutate({
      videoData,
      videoFile,
      signLanguageFile,
      thumbnailFile
    });
    setIsUploading(false);
  };

  const handleEdit = (video: LessonVideo) => {
    setEditingVideo(video);
    setVideoData({
      title: video.title,
      description: video.description || '',
      visibility: video.visibility,
      captions_enabled: video.captions_enabled,
      is_featured: video.is_featured,
      video_url: video.video_url || '',
      sign_language_video_url: video.sign_language_video_url || '',
      transcript_text: video.transcript_text || ''
    });
    setIsDialogOpen(true);
  };

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'public': return <Globe className="h-4 w-4" />;
      case 'private': return <Lock className="h-4 w-4" />;
      case 'class': return <Users className="h-4 w-4" />;
      case 'school': return <School className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  const getVisibilityColor = (visibility: string) => {
    switch (visibility) {
      case 'public': return 'bg-green-500';
      case 'private': return 'bg-red-500';
      case 'class': return 'bg-blue-500';
      case 'school': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">Lesson Videos</h3>
          <p className="text-muted-foreground">Manage videos for "{lessonTitle}"</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Video className="h-4 w-4" />
              Add Video
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingVideo ? 'Edit Video' : 'Add New Video'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Video Title</Label>
                  <Input
                    id="title"
                    value={videoData.title}
                    onChange={(e) => setVideoData(prev => ({ ...prev, title: e.target.value }))}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="visibility">Visibility</Label>
                  <Select 
                    value={videoData.visibility} 
                    onValueChange={(value: any) => setVideoData(prev => ({ ...prev, visibility: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          Public - Everyone can view
                        </div>
                      </SelectItem>
                      <SelectItem value="school">
                        <div className="flex items-center gap-2">
                          <School className="h-4 w-4" />
                          School - School members only
                        </div>
                      </SelectItem>
                      <SelectItem value="class">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Class - Class members only
                        </div>
                      </SelectItem>
                      <SelectItem value="private">
                        <div className="flex items-center gap-2">
                          <Lock className="h-4 w-4" />
                          Private - Teachers only
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={videoData.description}
                  onChange={(e) => setVideoData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>

              {/* Video Upload Options */}
              <div className="space-y-4">
                <div>
                  <Label>Main Video</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="video-file">Upload Video File</Label>
                      <Input
                        id="video-file"
                        type="file"
                        accept="video/*"
                        ref={videoFileRef}
                      />
                    </div>
                    <div>
                      <Label htmlFor="video-url">Or Video URL (YouTube/Vimeo)</Label>
                      <Input
                        id="video-url"
                        value={videoData.video_url}
                        onChange={(e) => setVideoData(prev => ({ ...prev, video_url: e.target.value }))}
                        placeholder="https://youtube.com/watch?v=..."
                      />
                    </div>
                  </div>
                </div>

                {/* Sign Language Video - Optional */}
                <div className="border rounded-lg p-4 bg-muted/30">
                  <div className="flex items-center gap-2 mb-3">
                    <Languages className="h-4 w-4" />
                    <Label className="text-sm font-medium">Sign Language Support (Optional)</Label>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="sign-video-file">Upload Sign Language Video</Label>
                      <Input
                        id="sign-video-file"
                        type="file"
                        accept="video/*"
                        ref={signLanguageFileRef}
                      />
                    </div>
                    <div>
                      <Label htmlFor="sign-video-url">Or Sign Language Video URL</Label>
                      <Input
                        id="sign-video-url"
                        value={videoData.sign_language_video_url}
                        onChange={(e) => setVideoData(prev => ({ ...prev, sign_language_video_url: e.target.value }))}
                        placeholder="https://youtube.com/watch?v=..."
                      />
                    </div>
                  </div>
                </div>

                {/* Thumbnail */}
                <div>
                  <Label htmlFor="thumbnail">Thumbnail Image (Optional)</Label>
                  <Input
                    id="thumbnail"
                    type="file"
                    accept="image/*"
                    ref={thumbnailFileRef}
                  />
                </div>

                {/* Transcript */}
                <div>
                  <Label htmlFor="transcript">Transcript/Captions (Optional)</Label>
                  <Textarea
                    id="transcript"
                    value={videoData.transcript_text}
                    onChange={(e) => setVideoData(prev => ({ ...prev, transcript_text: e.target.value }))}
                    rows={4}
                    placeholder="Enter video transcript for accessibility..."
                  />
                </div>
              </div>

              {/* Accessibility Options */}
              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Accessibility className="h-4 w-4" />
                  Accessibility Features
                </Label>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm">Enable Captions</Label>
                    <p className="text-xs text-muted-foreground">Show captions/subtitles for this video</p>
                  </div>
                  <Switch
                    checked={videoData.captions_enabled}
                    onCheckedChange={(checked) => setVideoData(prev => ({ ...prev, captions_enabled: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm">Featured Video</Label>
                    <p className="text-xs text-muted-foreground">Mark as featured in video library</p>
                  </div>
                  <Switch
                    checked={videoData.is_featured}
                    onCheckedChange={(checked) => setVideoData(prev => ({ ...prev, is_featured: checked }))}
                  />
                </div>
              </div>

              {isUploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="w-full" />
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isUploading || videoMutation.isPending}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {editingVideo ? 'Update Video' : 'Upload Video'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Videos List */}
      {videos.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No videos yet</h3>
            <p className="text-muted-foreground mb-4">
              Add your first video to this lesson to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {videos.map((video) => (
            <Card key={video.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-4 flex-1">
                    {/* Thumbnail */}
                    <div className="w-32 h-20 bg-muted rounded overflow-hidden flex-shrink-0">
                      {video.thumbnail_path ? (
                        <img 
                          src={video.thumbnail_path} 
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Play className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Video Info */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{video.title}</h4>
                        <Badge 
                          className={`text-xs ${getVisibilityColor(video.visibility)} text-white`}
                        >
                          <div className="flex items-center gap-1">
                            {getVisibilityIcon(video.visibility)}
                            {video.visibility}
                          </div>
                        </Badge>
                        {video.is_featured && (
                          <Badge variant="secondary">Featured</Badge>
                        )}
                      </div>
                      
                      {video.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {video.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {video.view_count} views
                        </span>
                        {video.captions_enabled && (
                          <span className="flex items-center gap-1">
                            <Subtitles className="h-3 w-3" />
                            Captions
                          </span>
                        )}
                        {video.sign_language_file_path && (
                          <span className="flex items-center gap-1">
                            <Languages className="h-3 w-3" />
                            Sign Language
                          </span>
                        )}
                        {(video.video_url || video.file_path) && (
                          <span className="flex items-center gap-1">
                            {video.video_url ? <ExternalLink className="h-3 w-3" /> : <FileVideo className="h-3 w-3" />}
                            {video.video_url ? 'External' : 'Uploaded'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(video)}
                      className="flex items-center gap-1"
                    >
                      <Edit className="h-3 w-3" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteMutation.mutate(video.id)}
                      disabled={deleteMutation.isPending}
                      className="flex items-center gap-1 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
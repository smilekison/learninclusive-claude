import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Video, 
  Play, 
  Plus, 
  Eye, 
  Users, 
  School, 
  Globe, 
  Lock,
  Languages, 
  Subtitles,
  Accessibility,
  TrendingUp,
  BarChart3,
  Clock,
  Edit
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { AccessibleVideoPlayer } from '@/components/video/AccessibleVideoPlayer';
import AccessibleYouTubePlayer from '@/components/video/AccessibleYouTubePlayer';

interface TeacherVideo {
  id: string;
  title: string;
  description?: string;
  video_url?: string;
  file_path?: string;
  thumbnail_path?: string;
  visibility: 'public' | 'private' | 'class' | 'school';
  view_count: number;
  like_count: number;
  is_featured: boolean;
  captions_enabled: boolean;
  sign_language_file_path?: string;
  sign_language_video_url?: string;
  created_at: string;
  lesson?: {
    title: string;
    subject?: {
      name: string;
    };
  };
}

export const TeacherVideoSection: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [videos, setVideos] = useState<TeacherVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<TeacherVideo | null>(null);
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchTeacherVideos();
  }, [user]);

  useEffect(() => {
    const resolveVideoUrl = async () => {
      setResolvedUrl(null);
      if (!selectedVideo) return;

      if (selectedVideo.video_url) {
        setResolvedUrl(selectedVideo.video_url);
        return;
      }

      if (selectedVideo.file_path) {
        try {
          const { data, error } = await supabase.storage
            .from('videos')
            .createSignedUrl(selectedVideo.file_path, 3600);
          
          if (!error && data?.signedUrl) {
            setResolvedUrl(data.signedUrl);
          }
        } catch (error) {
          console.error('Error resolving video URL:', error);
        }
      }
    };

    resolveVideoUrl();
  }, [selectedVideo]);

  const fetchTeacherVideos = async () => {
    try {
      const { data, error } = await supabase
        .from('lesson_videos')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) throw error;
      
      // For now, set videos without lesson data since the relationship needs to be established
      const processedData = (data || []).map(video => ({
        ...video,
        visibility: video.visibility as 'public' | 'private' | 'class' | 'school',
        lesson: undefined // Will be populated when lessons are properly connected
      }));
      
      setVideos(processedData as TeacherVideo[]);
    } catch (error) {
      console.error('Error fetching teacher videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'public': return <Globe className="h-3 w-3" />;
      case 'private': return <Lock className="h-3 w-3" />;
      case 'class': return <Users className="h-3 w-3" />;
      case 'school': return <School className="h-3 w-3" />;
      default: return <Users className="h-3 w-3" />;
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

  const getVisibilityDescription = (visibility: string) => {
    switch (visibility) {
      case 'public': return 'Visible to everyone';
      case 'private': return 'Only you can see';
      case 'class': return 'Class members only';
      case 'school': return 'School members only';
      default: return 'Unknown access';
    }
  };

  const extractYouTubeId = (url?: string | null): string | null => {
    if (!url) return null;
    try {
      const u = new URL(url);
      if (u.hostname.includes('youtu.be')) return u.pathname.replace('/', '');
      if (u.hostname.includes('youtube.com')) {
        const v = u.searchParams.get('v');
        if (v) return v;
      }
    } catch {}
    return null;
  };

  const calculateStats = () => {
    const totalViews = videos.reduce((sum, video) => sum + video.view_count, 0);
    const publicVideos = videos.filter(v => v.visibility === 'public').length;
    const accessibleVideos = videos.filter(v => 
      v.captions_enabled || v.sign_language_file_path || v.sign_language_video_url
    ).length;
    
    return { totalViews, publicVideos, accessibleVideos };
  };

  const stats = calculateStats();

  // If viewing a specific video
  if (selectedVideo) {
    const ytId = extractYouTubeId(selectedVideo.video_url);
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button 
            variant="outline" 
            onClick={() => setSelectedVideo(null)}
            className="flex items-center gap-2"
          >
            ← Back to My Videos
          </Button>
          
          <div className="flex items-center gap-2">
            <Badge className={`${getVisibilityColor(selectedVideo.visibility)} text-white`}>
              <div className="flex items-center gap-1">
                {getVisibilityIcon(selectedVideo.visibility)}
                {selectedVideo.visibility}
              </div>
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/subjects')} // Navigate to lesson management
              className="flex items-center gap-1"
            >
              <Edit className="h-3 w-3" />
              Edit
            </Button>
          </div>
        </div>
        
        <div className="grid gap-6">
          {/* Main Video */}
          <div>
            {ytId ? (
              <AccessibleYouTubePlayer
                videoId={ytId}
                title={selectedVideo.title}
                videoDbId={selectedVideo.id}
              />
            ) : (
              <AccessibleVideoPlayer
                title={selectedVideo.title}
                description={selectedVideo.description || ''}
                videoUrl={resolvedUrl || ''}
                videoDbId={selectedVideo.id}
              />
            )}
          </div>

          {/* Sign Language Video if available */}
          {(selectedVideo.sign_language_video_url || selectedVideo.sign_language_file_path) && (
            <Card className="border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Languages className="h-5 w-5 text-primary" />
                  Sign Language Version
                  <Badge variant="outline" className="ml-2">
                    <Accessibility className="h-3 w-3 mr-1" />
                    Accessible
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedVideo.sign_language_video_url ? (
                  <div className="aspect-video">
                    {extractYouTubeId(selectedVideo.sign_language_video_url) ? (
                      <AccessibleYouTubePlayer
                        videoId={extractYouTubeId(selectedVideo.sign_language_video_url)!}
                        title={`${selectedVideo.title} - Sign Language`}
                        videoDbId={selectedVideo.id}
                      />
                    ) : (
                      <iframe
                        src={selectedVideo.sign_language_video_url}
                        className="w-full h-full rounded-lg"
                        allowFullScreen
                        title={`${selectedVideo.title} - Sign Language Interpretation`}
                      />
                    )}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          )}

          {/* Video Analytics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Video Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary">{selectedVideo.view_count}</div>
                  <div className="text-sm text-muted-foreground">Total Views</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{selectedVideo.like_count}</div>
                  <div className="text-sm text-muted-foreground">Likes</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {selectedVideo.visibility === 'public' ? 'Global' : 'Limited'}
                  </div>
                  <div className="text-sm text-muted-foreground">Reach</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              My Video Content
            </CardTitle>
            <CardDescription>
              Manage and track your educational videos
            </CardDescription>
          </div>
          <Button 
            onClick={() => navigate('/subjects')}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Upload Video
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Eye className="h-4 w-4 text-primary" />
                <span className="text-2xl font-bold text-primary">{stats.totalViews}</span>
              </div>
              <div className="text-sm text-muted-foreground">Total Views</div>
            </CardContent>
          </Card>
          
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Globe className="h-4 w-4 text-green-600" />
                <span className="text-2xl font-bold text-green-600">{stats.publicVideos}</span>
              </div>
              <div className="text-sm text-muted-foreground">Public Videos</div>
            </CardContent>
          </Card>
          
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Accessibility className="h-4 w-4 text-blue-600" />
                <span className="text-2xl font-bold text-blue-600">{stats.accessibleVideos}</span>
              </div>
              <div className="text-sm text-muted-foreground">Accessible Videos</div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Videos */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, index) => (
              <Card key={index} className="animate-pulse">
                <div className="aspect-video bg-muted rounded-t-lg" />
                <CardContent className="p-3 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-full" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-8">
            <Video className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No videos yet</h3>
            <p className="text-muted-foreground mb-4">
              Start creating engaging video content for your students
            </p>
            <Button onClick={() => navigate('/subjects')}>
              <Plus className="h-4 w-4 mr-2" />
              Upload Your First Video
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Recent Videos</h3>
              <Button 
                variant="outline" 
                onClick={() => navigate('/videos')}
                className="flex items-center gap-2"
              >
                View All
                <TrendingUp className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {videos.map((video) => (
                <Card 
                  key={video.id}
                  className="hover:shadow-md transition-shadow cursor-pointer group"
                  onClick={() => setSelectedVideo(video)}
                >
                  <div className="relative aspect-video bg-muted rounded-t-lg overflow-hidden">
                    {video.thumbnail_path ? (
                      <img 
                        src={video.thumbnail_path} 
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
                        <Play className="h-12 w-12 text-primary/60" />
                      </div>
                    )}
                    
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                        <Play className="h-6 w-6 text-primary ml-1" />
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="absolute top-2 left-2">
                      <Badge className={`text-xs ${getVisibilityColor(video.visibility)} text-white`}>
                        <div className="flex items-center gap-1">
                          {getVisibilityIcon(video.visibility)}
                          {video.visibility}
                        </div>
                      </Badge>
                    </div>

                    {/* Accessibility indicators */}
                    <div className="absolute top-2 right-2 flex gap-1">
                      {video.captions_enabled && (
                        <Badge variant="secondary" className="text-xs bg-black/70 text-white">
                          <Subtitles className="h-3 w-3" />
                        </Badge>
                      )}
                      {(video.sign_language_video_url || video.sign_language_file_path) && (
                        <Badge variant="secondary" className="text-xs bg-black/70 text-white">
                          <Languages className="h-3 w-3" />
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <CardContent className="p-3">
                    <h4 className="font-medium text-sm line-clamp-2 mb-1">{video.title}</h4>
                    {video.lesson && (
                      <p className="text-xs text-muted-foreground mb-2">
                        {video.lesson.title} • {video.lesson.subject?.name}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {video.view_count}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(video.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
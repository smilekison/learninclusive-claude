import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Video, 
  Play, 
  Eye, 
  Users, 
  School, 
  Globe, 
  Languages, 
  Subtitles,
  Accessibility,
  BookOpen,
  Clock,
  TrendingUp,
  Star,
  Filter
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { AccessibleVideoPlayer } from '@/components/video/AccessibleVideoPlayer';
import AccessibleYouTubePlayer from '@/components/video/AccessibleYouTubePlayer';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface StudentVideo {
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
  duration_seconds?: number;
  created_at: string;
  lesson?: {
    title: string;
    subject?: {
      name: string;
      class?: {
        name: string;
      };
    };
  };
}

export const StudentVideoSection: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [videos, setVideos] = useState<StudentVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<StudentVideo | null>(null);
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const [viewFilter, setViewFilter] = useState<'all' | 'my-classes' | 'public' | 'featured'>('all');

  useEffect(() => {
    fetchStudentVideos();
  }, [user, viewFilter]);

  const fetchStudentVideos = async () => {
    try {
      let query = supabase
        .from('lesson_videos')
        .select('*');

      switch (viewFilter) {
        case 'public':
          query = query.eq('visibility', 'public');
          break;
        case 'featured':
          query = query.eq('is_featured', true);
          break;
        default:
          query = query.in('visibility', ['class', 'school', 'public']);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(12);

      if (error) throw error;
      
      const processedData = (data || []).map(video => ({
        ...video,
        visibility: video.visibility as 'public' | 'private' | 'class' | 'school',
        lesson: undefined
      }));
      
      setVideos(processedData as StudentVideo[]);
    } catch (error) {
      console.error('Error fetching student videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'public': return <Globe className="h-3 w-3" />;
      case 'class': return <Users className="h-3 w-3" />;
      case 'school': return <School className="h-3 w-3" />;
      default: return <Users className="h-3 w-3" />;
    }
  };

  const getVisibilityColor = (visibility: string) => {
    switch (visibility) {
      case 'public': return 'bg-green-500';
      case 'class': return 'bg-blue-500';
      case 'school': return 'bg-purple-500';
      default: return 'bg-gray-500';
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

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'Unknown';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleVideoClick = async (video: StudentVideo) => {
    setSelectedVideo(video);
    
    // Track video view
    try {
      await supabase.rpc('increment_video_view_count', { video_id: video.id });
      // Update local state
      setVideos(prev => prev.map(v => 
        v.id === video.id ? { ...v, view_count: v.view_count + 1 } : v
      ));
    } catch (error) {
      console.error('Error tracking video view:', error);
    }
  };

  const calculateStats = () => {
    const publicVideos = videos.filter(v => v.visibility === 'public').length;
    const classVideos = videos.filter(v => v.visibility === 'class').length;
    const accessibleVideos = videos.filter(v => 
      v.captions_enabled || v.sign_language_file_path || v.sign_language_video_url
    ).length;
    
    return { publicVideos, classVideos, accessibleVideos };
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
            ← Back to Videos
          </Button>
          
          <div className="flex items-center gap-2">
            <Badge className={`${getVisibilityColor(selectedVideo.visibility)} text-white`}>
              <div className="flex items-center gap-1">
                {getVisibilityIcon(selectedVideo.visibility)}
                {selectedVideo.visibility}
              </div>
            </Badge>
            {selectedVideo.is_featured && (
              <Badge className="bg-yellow-500 text-black">
                <Star className="h-3 w-3 mr-1" />
                Featured
              </Badge>
            )}
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
                duration={selectedVideo.duration_seconds}
                thumbnailUrl={selectedVideo.thumbnail_path}
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
                <CardDescription>
                  This video includes sign language interpretation for enhanced accessibility
                </CardDescription>
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

          {/* Video Context & Learning Path */}
          {selectedVideo.lesson && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Learning Context
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Lesson:</span>
                    <span className="text-sm text-primary">{selectedVideo.lesson.title}</span>
                  </div>
                  {selectedVideo.lesson.subject && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Subject:</span>
                        <span className="text-sm">{selectedVideo.lesson.subject.name}</span>
                      </div>
                      {selectedVideo.lesson.subject.class && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Class:</span>
                          <span className="text-sm">{selectedVideo.lesson.subject.class.name}</span>
                        </div>
                      )}
                    </>
                  )}
                  <div className="pt-3 border-t">
                    <Button 
                      onClick={() => navigate('/student/subjects')}
                      className="w-full flex items-center gap-2"
                    >
                      <BookOpen className="h-4 w-4" />
                      Continue Learning in this Subject
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
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
              Learning Videos
            </CardTitle>
            <CardDescription>
              Access educational content tailored for your learning journey
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={viewFilter} onValueChange={(value: any) => setViewFilter(value)}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Videos</SelectItem>
                <SelectItem value="my-classes">My Classes</SelectItem>
                <SelectItem value="public">Public Content</SelectItem>
                <SelectItem value="featured">Featured</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="outline"
              onClick={() => navigate('/videos')}
              className="flex items-center gap-2"
            >
              <TrendingUp className="h-4 w-4" />
              Browse Library
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <Users className="h-4 w-4 text-blue-600" />
                <span className="text-2xl font-bold text-blue-600">{stats.classVideos}</span>
              </div>
              <div className="text-sm text-muted-foreground">Class Videos</div>
            </CardContent>
          </Card>
          
          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Accessibility className="h-4 w-4 text-purple-600" />
                <span className="text-2xl font-bold text-purple-600">{stats.accessibleVideos}</span>
              </div>
              <div className="text-sm text-muted-foreground">Accessible Videos</div>
            </CardContent>
          </Card>
        </div>

        {/* Videos Grid */}
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
            <h3 className="text-lg font-medium mb-2">No videos available</h3>
            <p className="text-muted-foreground mb-4">
              Check back later for new educational content, or explore the public library
            </p>
            <Button onClick={() => navigate('/videos')}>
              <Globe className="h-4 w-4 mr-2" />
              Browse Public Videos
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {videos.map((video) => (
              <Card 
                key={video.id}
                className="hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer group"
                onClick={() => handleVideoClick(video)}
              >
                <div className="relative aspect-video bg-muted rounded-t-lg overflow-hidden">
                  {video.thumbnail_path ? (
                    <img 
                      src={video.thumbnail_path} 
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
                      <Play className="h-12 w-12 text-primary/60 group-hover:text-primary transition-colors" />
                    </div>
                  )}
                  
                  {/* Play overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
                      <Play className="h-8 w-8 text-primary ml-1" />
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    <Badge className={`text-xs ${getVisibilityColor(video.visibility)} text-white`}>
                      <div className="flex items-center gap-1">
                        {getVisibilityIcon(video.visibility)}
                        {video.visibility}
                      </div>
                    </Badge>
                    {video.is_featured && (
                      <Badge className="bg-yellow-500 text-black text-xs">
                        <Star className="h-3 w-3 mr-1" />
                        Featured
                      </Badge>
                    )}
                  </div>

                  {/* Accessibility indicators */}
                  <div className="absolute top-2 right-2 flex flex-col gap-1">
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
                    <Badge variant="secondary" className="text-xs bg-black/70 text-white">
                      <Accessibility className="h-3 w-3" />
                    </Badge>
                  </div>

                  {/* Duration */}
                  {video.duration_seconds && (
                    <div className="absolute bottom-2 right-2">
                      <Badge variant="secondary" className="text-xs bg-black/70 text-white">
                        {formatDuration(video.duration_seconds)}
                      </Badge>
                    </div>
                  )}
                </div>
                
                <CardContent className="p-4">
                  <h3 className="font-medium text-sm line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                    {video.title}
                  </h3>
                  
                  {video.lesson && (
                    <div className="text-xs text-muted-foreground mb-2 space-y-1">
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        {video.lesson.title}
                      </div>
                      {video.lesson.subject && (
                        <div className="font-medium text-primary">
                          {video.lesson.subject.name}
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {video.view_count.toLocaleString()} views
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDuration(video.duration_seconds)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
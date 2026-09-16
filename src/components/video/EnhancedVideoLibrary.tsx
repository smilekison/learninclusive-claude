import React, { useState, useEffect } from 'react';
import { Search, Filter, Grid, List, Globe, Lock, Users, School, Eye, Clock, Languages, Subtitles, Star, Play } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { AccessibleVideoPlayer } from './AccessibleVideoPlayer';
import AccessibleYouTubePlayer from '@/components/video/AccessibleYouTubePlayer';
import { extractYouTubeId } from '@/lib/youtube';

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
  transcript_text?: string;
  captions_enabled: boolean;
  created_at: string;
  view_count: number;
  like_count: number;
  is_featured: boolean;
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

interface EnhancedVideoLibraryProps {
  showPublicOnly?: boolean;
}

export const EnhancedVideoLibrary: React.FC<EnhancedVideoLibraryProps> = ({ showPublicOnly = false }) => {
  const { user } = useAuth();
  const [videos, setVideos] = useState<LessonVideo[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<LessonVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVisibility, setSelectedVisibility] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedVideo, setSelectedVideo] = useState<LessonVideo | null>(null);
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchVideos();
  }, [user, showPublicOnly]);

  useEffect(() => {
    filterVideos();
  }, [videos, searchTerm, selectedVisibility]);

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

  const fetchVideos = async () => {
    try {
      let query = supabase
        .from('lesson_videos')
        .select('*');

      // Apply visibility filters based on user role
      if (showPublicOnly || !user) {
        query = query.eq('visibility', 'public');
      } else {
        switch (user.role) {
          case 'principal':
            // Principals can see all videos
            break;
          case 'teacher':
            query = query.in('visibility', ['public', 'school', 'class']);
            break;
          case 'student':
            query = query.in('visibility', ['public', 'school', 'class']);
            break;
          default:
            query = query.eq('visibility', 'public');
        }
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // For now, set videos without lesson data since the relationship doesn't exist yet
      const processedData = (data || []).map(video => ({
        ...video,
        lesson: undefined // Will be populated once lessons are connected
      }));
      
      setVideos(processedData as LessonVideo[]);
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterVideos = () => {
    let filtered = videos;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(video =>
        video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        video.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        video.lesson?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        video.lesson?.subject?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Visibility filter
    if (selectedVisibility !== 'all') {
      filtered = filtered.filter(video => video.visibility === selectedVisibility);
    }

    setFilteredVideos(filtered);
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'Unknown';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
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
      case 'public': return 'Everyone can view';
      case 'private': return 'Teachers only';
      case 'class': return 'Class members only';
      case 'school': return 'School members only';
      default: return 'Unknown access';
    }
  };

const groupVideosByVisibility = () => {
    const groups = {
      public: filteredVideos.filter(v => v.visibility === 'public'),
      school: filteredVideos.filter(v => v.visibility === 'school'),
      class: filteredVideos.filter(v => v.visibility === 'class'),
      private: filteredVideos.filter(v => v.visibility === 'private'),
    };
    return groups;
  };

  // If viewing a specific video
  if (selectedVideo) {
    const ytId = extractYouTubeId(selectedVideo.video_url);
    
    return (
      <div className="space-y-6">
        <Button 
          variant="outline" 
          onClick={() => setSelectedVideo(null)}
          className="mb-4"
        >
          ← Back to Library
        </Button>
        
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
                transcript={selectedVideo.transcript_text}
                duration={selectedVideo.duration_seconds}
                thumbnailUrl={selectedVideo.thumbnail_path}
                videoDbId={selectedVideo.id}
              />
            )}
          </div>

          {/* Sign Language Video if available */}
          {(selectedVideo.sign_language_video_url || selectedVideo.sign_language_file_path) && (
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <Languages className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Sign Language Version</h3>
              </div>
              
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
                      className="w-full h-full rounded"
                      allowFullScreen
                    />
                  )}
                </div>
              ) : selectedVideo.sign_language_file_path ? (
                <AccessibleVideoPlayer
                  title={`${selectedVideo.title} - Sign Language`}
                  description="Sign language interpretation of the main video"
                  videoUrl={`/storage/videos/${selectedVideo.sign_language_file_path}`}
                  videoDbId={selectedVideo.id}
                />
              ) : null}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading videos...</p>
        </div>
      </div>
    );
  }

  const visibilityGroups = groupVideosByVisibility();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Enhanced Video Library
          </h1>
          <p className="text-muted-foreground mt-1">
            Discover educational content with advanced accessibility features
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 p-4 bg-muted/30 rounded-lg">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search videos, lessons, or subjects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <Select value={selectedVisibility} onValueChange={setSelectedVisibility}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="All Access Levels" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Access Levels</SelectItem>
            <SelectItem value="public">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Public
              </div>
            </SelectItem>
            <SelectItem value="school">
              <div className="flex items-center gap-2">
                <School className="h-4 w-4" />
                School Only
              </div>
            </SelectItem>
            <SelectItem value="class">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Class Only
              </div>
            </SelectItem>
            <SelectItem value="private">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Private
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Categorized Video Display */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All ({filteredVideos.length})</TabsTrigger>
          <TabsTrigger value="public">Public ({visibilityGroups.public.length})</TabsTrigger>
          <TabsTrigger value="school">School ({visibilityGroups.school.length})</TabsTrigger>
          <TabsTrigger value="class">Class ({visibilityGroups.class.length})</TabsTrigger>
          <TabsTrigger value="private">Private ({visibilityGroups.private.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <VideoGrid videos={filteredVideos} viewMode={viewMode} onVideoSelect={setSelectedVideo} />
        </TabsContent>
        
        <TabsContent value="public">
          <VideoGrid videos={visibilityGroups.public} viewMode={viewMode} onVideoSelect={setSelectedVideo} />
        </TabsContent>
        
        <TabsContent value="school">
          <VideoGrid videos={visibilityGroups.school} viewMode={viewMode} onVideoSelect={setSelectedVideo} />
        </TabsContent>
        
        <TabsContent value="class">
          <VideoGrid videos={visibilityGroups.class} viewMode={viewMode} onVideoSelect={setSelectedVideo} />
        </TabsContent>
        
        <TabsContent value="private">
          <VideoGrid videos={visibilityGroups.private} viewMode={viewMode} onVideoSelect={setSelectedVideo} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Video Grid Component
const VideoGrid: React.FC<{
  videos: LessonVideo[];
  viewMode: 'grid' | 'list';
  onVideoSelect: (video: LessonVideo) => void;
}> = ({ videos, viewMode, onVideoSelect }) => {
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

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'Unknown';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (videos.length === 0) {
    return (
      <div className="text-center py-12">
        <Play className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No videos found matching your criteria.</p>
      </div>
    );
  }

  return viewMode === 'grid' ? (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {videos.map((video) => (
        <Card key={video.id} className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="p-0">
            <div 
              className="relative aspect-video bg-muted rounded-t-lg overflow-hidden group"
              onClick={() => onVideoSelect(video)}
            >
              {video.thumbnail_path ? (
                <img 
                  src={video.thumbnail_path} 
                  alt={`Thumbnail for ${video.title}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <Play className="h-16 w-16 text-primary/60" />
                </div>
              )}
              
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button size="lg" className="rounded-full">
                  <Play className="h-6 w-6 ml-1" />
                </Button>
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
                  <Badge className="bg-yellow-500 text-black">
                    <Star className="h-3 w-3 mr-1" />
                    Featured
                  </Badge>
                )}
              </div>

              {/* Accessibility indicators */}
              <div className="absolute top-2 right-2 flex flex-col gap-1">
                {video.captions_enabled && (
                  <Badge variant="secondary" className="text-xs">
                    <Subtitles className="h-3 w-3" />
                  </Badge>
                )}
                {video.sign_language_file_path && (
                  <Badge variant="secondary" className="text-xs">
                    <Languages className="h-3 w-3" />
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-4">
            <CardTitle className="line-clamp-2 mb-2">{video.title}</CardTitle>
            <CardDescription className="line-clamp-2 mb-3">
              {video.description}
            </CardDescription>
            
            {/* Lesson context */}
            {video.lesson && (
              <div className="text-sm text-muted-foreground mb-3">
                <span className="font-medium">{video.lesson.title}</span>
                {video.lesson.subject && (
                  <>
                    <span className="mx-1">•</span>
                    <span>{video.lesson.subject.name}</span>
                  </>
                )}
              </div>
            )}
            
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDuration(video.duration_seconds)}
              </div>
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {video.view_count} views
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  ) : (
    <div className="space-y-4">
      {videos.map((video) => (
        <Card key={video.id} className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-4">
            <div 
              className="flex gap-4 items-start"
              onClick={() => onVideoSelect(video)}
            >
              <div className="relative w-32 h-20 bg-muted rounded overflow-hidden flex-shrink-0">
                {video.thumbnail_path ? (
                  <img 
                    src={video.thumbnail_path} 
                    alt={`Thumbnail for ${video.title}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                    <Play className="h-8 w-8 text-primary/60" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground line-clamp-1">
                        {video.title}
                      </h3>
                      <Badge className={`text-xs ${getVisibilityColor(video.visibility)} text-white`}>
                        <div className="flex items-center gap-1">
                          {getVisibilityIcon(video.visibility)}
                          {video.visibility}
                        </div>
                      </Badge>
                    </div>
                    
                    <p className="text-muted-foreground text-sm line-clamp-2 mb-2">
                      {video.description}
                    </p>
                    
                    {video.lesson && (
                      <div className="text-sm text-muted-foreground mb-2">
                        <span className="font-medium">{video.lesson.title}</span>
                        {video.lesson.subject && (
                          <>
                            <span className="mx-1">•</span>
                            <span>{video.lesson.subject.name}</span>
                          </>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDuration(video.duration_seconds)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {video.view_count} views
                      </div>
                      {video.captions_enabled && (
                        <div className="flex items-center gap-1">
                          <Subtitles className="h-3 w-3" />
                          Captions
                        </div>
                      )}
                      {video.sign_language_file_path && (
                        <div className="flex items-center gap-1">
                          <Languages className="h-3 w-3" />
                          Sign Language
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {video.is_featured && (
                      <Badge className="bg-yellow-500 text-black flex-shrink-0">
                        <Star className="h-3 w-3 mr-1" />
                        Featured
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
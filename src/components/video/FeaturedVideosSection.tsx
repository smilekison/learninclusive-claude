import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Globe, 
  Star, 
  Eye, 
  Clock, 
  Languages, 
  Subtitles,
  ArrowRight,
  Accessibility
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AccessibleVideoPlayer } from './AccessibleVideoPlayer';
import AccessibleYouTubePlayer from '@/components/video/AccessibleYouTubePlayer';
import { extractYouTubeId } from '@/lib/youtube';

interface FeaturedVideo {
  id: string;
  title: string;
  description?: string;
  video_url?: string;
  file_path?: string;
  thumbnail_path?: string;
  sign_language_video_url?: string;
  sign_language_file_path?: string;
  duration_seconds?: number;
  transcript_text?: string;
  captions_enabled: boolean;
  view_count: number;
  like_count: number;
  is_featured: boolean;
  accessibility_features: any;
}

interface FeaturedVideosSectionProps {
  title?: string;
  subtitle?: string;
  limit?: number;
  showViewAll?: boolean;
  onViewAll?: () => void;
}

export const FeaturedVideosSection: React.FC<FeaturedVideosSectionProps> = ({
  title = "Featured Educational Content",
  subtitle = "Discover accessibility-first learning materials",
  limit = 6,
  showViewAll = true,
  onViewAll
}) => {
  const [videos, setVideos] = useState<FeaturedVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<FeaturedVideo | null>(null);
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchFeaturedVideos();
  }, [limit]);

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

  const fetchFeaturedVideos = async () => {
    try {
      const { data, error } = await supabase
        .from('lesson_videos')
        .select('*')
        .eq('visibility', 'public')
        .eq('is_featured', true)
        .order('view_count', { ascending: false })
        .limit(limit);

      if (error) throw error;
      setVideos(data || []);
    } catch (error) {
      console.error('Error fetching featured videos:', error);
    } finally {
      setLoading(false);
    }
  };

const formatDuration = (seconds?: number) => {
    if (!seconds) return 'Unknown';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleVideoInteraction = async (videoId: string, type: 'view' | 'like') => {
    try {
      await supabase.rpc('increment_video_view_count', { video_id: videoId });
      
      // Update local state to reflect the change
      setVideos(prev => prev.map(video => 
        video.id === videoId 
          ? { ...video, view_count: video.view_count + (type === 'view' ? 1 : 0) }
          : video
      ));
    } catch (error) {
      console.error('Error updating video interaction:', error);
    }
  };

  const handleVideoClick = (video: FeaturedVideo) => {
    setSelectedVideo(video);
    handleVideoInteraction(video.id, 'view');
  };

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
            ← Back to Featured Videos
          </Button>
          
          <div className="flex items-center gap-2">
            <Badge className="bg-green-500 text-white">
              <Globe className="h-3 w-3 mr-1" />
              Public Content
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
                transcript={selectedVideo.transcript_text}
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
                ) : selectedVideo.sign_language_file_path ? (
                  <AccessibleVideoPlayer
                    title={`${selectedVideo.title} - Sign Language`}
                    description="Sign language interpretation of the main video"
                    videoUrl={`/storage/videos/${selectedVideo.sign_language_file_path}`}
                    videoDbId={selectedVideo.id}
                  />
                ) : null}
              </CardContent>
            </Card>
          )}

          {/* Video Details */}
          <Card>
            <CardHeader>
              <CardTitle>{selectedVideo.title}</CardTitle>
              {selectedVideo.description && (
                <p className="text-muted-foreground">{selectedVideo.description}</p>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {selectedVideo.view_count.toLocaleString()} views
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {formatDuration(selectedVideo.duration_seconds)}
                </div>
                {selectedVideo.captions_enabled && (
                  <div className="flex items-center gap-1">
                    <Subtitles className="h-4 w-4" />
                    Captions Available
                  </div>
                )}
                {(selectedVideo.sign_language_video_url || selectedVideo.sign_language_file_path) && (
                  <div className="flex items-center gap-1">
                    <Languages className="h-4 w-4" />
                    Sign Language
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">{title}</h2>
          <p className="text-muted-foreground mb-6">{subtitle}</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(limit)].map((_, index) => (
            <Card key={index} className="animate-pulse">
              <div className="aspect-video bg-muted rounded-t-lg" />
              <CardContent className="p-4 space-y-3">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-full" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">{title}</h2>
          <p className="text-muted-foreground mb-6">{subtitle}</p>
        </div>
        
        <Card>
          <CardContent className="p-8 text-center">
            <Play className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Featured Videos Yet</h3>
            <p className="text-muted-foreground">
              Check back soon for exciting educational content!
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-2">{title}</h2>
        <p className="text-muted-foreground mb-6">{subtitle}</p>
      </div>

      {/* Accessibility Features Highlight */}
      <div className="bg-primary/10 rounded-lg p-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Accessibility className="h-6 w-6 text-primary" />
          <h3 className="text-lg font-semibold">Fully Accessible Content</h3>
        </div>
        <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
          All featured videos include captions, audio descriptions, keyboard navigation, 
          and optional sign language interpretation - ensuring everyone can learn.
        </p>
      </div>

      {/* Featured Videos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.map((video) => (
          <Card 
            key={video.id} 
            className="hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer group"
            onClick={() => handleVideoClick(video)}
          >
            <div className="relative aspect-video bg-muted rounded-t-lg overflow-hidden">
              {video.thumbnail_path ? (
                <img 
                  src={video.thumbnail_path} 
                  alt={`Thumbnail for ${video.title}`}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <Play className="h-16 w-16 text-primary/60 group-hover:text-primary transition-colors" />
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
                <Badge className="bg-green-500 text-white">
                  <Globe className="h-3 w-3 mr-1" />
                  Public
                </Badge>
                <Badge className="bg-yellow-500 text-black">
                  <Star className="h-3 w-3 mr-1" />
                  Featured
                </Badge>
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
              <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                {video.title}
              </h3>
              {video.description && (
                <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                  {video.description}
                </p>
              )}
              
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {video.view_count.toLocaleString()}
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDuration(video.duration_seconds)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* View All Button */}
      {showViewAll && videos.length >= limit && (
        <div className="text-center pt-6">
          <Button 
            onClick={onViewAll}
            className="text-lg px-8 py-3 h-auto"
          >
            View All Videos
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      )}
    </div>
  );
};
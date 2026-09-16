import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, Calendar, ThumbsUp, ThumbsDown, Share2, Download, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { YouTubeNavbar } from '@/components/layout/YouTubeNavbar';
import AccessibleYouTubePlayer from '@/components/video/AccessibleYouTubePlayer';
import { AccessibleVideoPlayer } from '@/components/video/AccessibleVideoPlayer';
import { VideoEngagementBar } from '@/components/video/VideoEngagementBar';
import { RelatedVideos } from '@/components/video/RelatedVideos';
import { supabase } from '@/integrations/supabase/client';
import { extractYouTubeId } from '@/lib/youtube';

interface VideoDetails {
  id: string;
  title: string;
  channel: string;
  uploadDate: string;
  duration: string;
  thumbnail: string;
  category?: string;
  description: string;
  channelSubscribers: string;
  videoFormat: 'youtube' | 'mp4';
  tags?: string[];
  difficulty?: string;
  transcript?: string;
}


export const VideoDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [video, setVideo] = useState<VideoDetails | null>(null);
  const [ytId, setYtId] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [viewCount, setViewCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const handleRelatedVideoSelect = (videoId: string) => {
    navigate(`/video/${videoId}`);
  };

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('video_materials')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error('Error loading video:', error);
        setVideo(null);
        setLoading(false);
        return;
      }
      if (!data) {
        setVideo(null);
        setLoading(false);
        return;
      }

      // Map DB row to view model
      const vd: VideoDetails = {
        id: data.id,
        title: data.title,
        channel: data.video_format === 'youtube' ? 'YouTube Channel' : 'Learninclusive',
        uploadDate: data.created_at,
        duration: data.duration ? `${Math.floor(data.duration / 60)}:${String(data.duration % 60).padStart(2, '0')}` : '',
        thumbnail: data.thumbnail_path || '',
        category: data.category || undefined,
        description: data.description || '',
        channelSubscribers: data.video_format === 'youtube' ? 'N/A' : 'Educational Platform',
        videoFormat: data.video_format === 'youtube' ? 'youtube' : 'mp4',
        tags: data.tags || [],
        difficulty: data.difficulty_level,
        transcript: data.transcript_text
      };
      setVideo(vd);
      document.title = `${vd.title} - learninclusive`;

      // Get view count
      const { count } = await supabase
        .from('video_views')
        .select('*', { count: 'exact', head: true })
        .eq('video_id', id);
      setViewCount(count || 0);

      // Determine player
      const idFromUrl = extractYouTubeId(data.external_url || data.file_path || '');
      if (data.video_format === 'youtube' && idFromUrl) {
        setYtId(idFromUrl);
      } else if (data.file_path) {
        const { data: signed, error: sErr } = await supabase.storage
          .from('videos')
          .createSignedUrl(data.file_path, 3600);
        if (!sErr && signed?.signedUrl) setFileUrl(signed.signedUrl);
      }
      setLoading(false);
    })();
  }, [id]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatViewCount = (count: number) => {
    if (count < 1000) return count.toString();
    if (count < 1000000) return `${(count / 1000).toFixed(1)}K`;
    return `${(count / 1000000).toFixed(1)}M`;
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    // toast({ title: "Link copied to clipboard" });
  };

  const handleDownload = () => {
    if (video?.videoFormat === 'mp4' && fileUrl) {
      const a = document.createElement('a');
      a.href = fileUrl;
      a.download = video.title;
      a.click();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <YouTubeNavbar onSearch={setSearchTerm} searchTerm={searchTerm} />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading video...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-background">
        <YouTubeNavbar onSearch={setSearchTerm} searchTerm={searchTerm} />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Video Not Found</h1>
            <p className="text-muted-foreground mb-6">
              The video you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Unified Player Component
  const VideoPlayer = () => {
    if (video.videoFormat === 'youtube' && ytId) {
      return (
        <AccessibleYouTubePlayer
          videoId={ytId}
          title={video.title}
          captionLang={video.category === 'LGK' ? 'lt' : 'en'}
          className="overflow-hidden rounded-lg"
          videoDbId={video.id}
        />
      );
    } else if (fileUrl) {
      return (
        <div className="rounded-lg overflow-hidden">
          <AccessibleVideoPlayer
            title={video.title}
            description={video.description}
            videoUrl={fileUrl}
            transcript={video.transcript}
            videoDbId={video.id}
          />
        </div>
      );
    }
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Loading video player...</p>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <YouTubeNavbar onSearch={setSearchTerm} searchTerm={searchTerm} />
      
      <main className="max-w-screen-xl mx-auto px-4 py-6" role="main" aria-label="Video details page">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Video Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Back Button */}
            <Button 
              variant="ghost" 
              onClick={() => navigate('/')}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Videos
            </Button>

            {/* Video Player */}
            <VideoPlayer />

            {/* Video Info Header */}
            <div className="space-y-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground leading-tight mb-2" id="video-title">
                  {video.title}
                </h1>
                
                {/* Video Stats Row */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    <span>{formatViewCount(viewCount)} views</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(video.uploadDate)}</span>
                  </div>
                  {video.difficulty && (
                    <Badge variant="outline">
                      {video.difficulty}
                    </Badge>
                  )}
                  {video.category && (
                    <Badge variant="secondary">
                      {video.category}
                    </Badge>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant={isLiked ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIsLiked(!isLiked)}
                    aria-label={isLiked ? "Remove like" : "Like this video"}
                    aria-pressed={isLiked}
                  >
                    <ThumbsUp className="h-4 w-4 mr-2" />
                    Like
                  </Button>
                  <Button
                    variant={isDisliked ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIsDisliked(!isDisliked)}
                    aria-label={isDisliked ? "Remove dislike" : "Dislike this video"}
                    aria-pressed={isDisliked}
                  >
                    <ThumbsDown className="h-4 w-4 mr-2" />
                    Dislike
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleShare}
                    aria-label="Share this video"
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                  {video.videoFormat === 'mp4' && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleDownload}
                      aria-label="Download this video"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  )}
                </div>
              </div>

              {/* Engagement Bar */}
              <VideoEngagementBar videoId={video.id} />

              <Separator />

            {/* Channel Info */}
              <section className="flex items-start justify-between" aria-labelledby="channel-info">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center"
                    aria-hidden="true"
                  >
                    <span className="text-lg font-bold text-white">
                      {video.channel.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 id="channel-info" className="font-semibold text-foreground">{video.channel}</h3>
                    <p className="text-sm text-muted-foreground">
                      {video.channelSubscribers}
                    </p>
                  </div>
                </div>
                {video.videoFormat === 'youtube' && (
                  <Button size="sm" aria-label={`Subscribe to ${video.channel}`}>
                    Subscribe
                  </Button>
                )}
              </section>
            </div>

            {/* Video Content Tabs */}
            <Tabs defaultValue="description" className="w-full" aria-label="Video content sections">
              <TabsList className="grid w-full grid-cols-3" role="tablist">
                <TabsTrigger value="description" aria-controls="description-panel">Description</TabsTrigger>
                <TabsTrigger value="transcript" aria-controls="transcript-panel">Transcript</TabsTrigger>
                <TabsTrigger value="resources" aria-controls="resources-panel">Resources</TabsTrigger>
              </TabsList>
              
              <TabsContent value="description" className="mt-4" id="description-panel" role="tabpanel">
                <Card>
                  <CardContent className="pt-6">
                    <div className="prose prose-sm max-w-none text-foreground">
                      <p className="leading-relaxed whitespace-pre-line">
                        {video.description || 'No description available.'}
                      </p>
                      
                      {video.tags && video.tags.length > 0 && (
                        <div className="mt-6">
                          <h4 className="font-semibold mb-3">Tags</h4>
                          <div className="flex flex-wrap gap-2">
                            {video.tags.map((tag, index) => (
                              <Badge key={index} variant="outline">
                                #{tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="transcript" className="mt-4" id="transcript-panel" role="tabpanel">
                <Card>
                  <CardContent className="pt-6">
                    {video.transcript ? (
                      <div className="prose prose-sm max-w-none text-foreground">
                        <div className="bg-muted/30 p-4 rounded-lg">
                          <p className="leading-relaxed whitespace-pre-line">
                            {video.transcript}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No transcript available for this video.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="resources" className="mt-4" id="resources-panel" role="tabpanel">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-8 text-muted-foreground">
                      <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Additional learning resources will be available here.</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6" aria-label="Related content and comments">
            <RelatedVideos
              currentVideoId={video.id}
              currentVideoCategory={video.category}
              currentVideoTags={video.tags}
              onVideoSelect={handleRelatedVideoSelect}
            />

            <Card>
              <CardHeader>
                <CardTitle>Comments</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-8">
                  Comments section coming soon. We're building a fully accessible commenting system.
                </p>
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>
    </div>
  );
};
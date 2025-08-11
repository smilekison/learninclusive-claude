import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Heart, Share2, Download, Eye, Calendar, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { YouTubeNavbar } from '@/components/layout/YouTubeNavbar';
import AccessibleYouTubePlayer from '@/components/video/AccessibleYouTubePlayer';
import { AccessibleVideoPlayer } from '@/components/video/AccessibleVideoPlayer';
import { supabase } from '@/integrations/supabase/client';

interface VideoDetails {
  id: string;
  title: string;
  channel: string;
  views: number;
  uploadDate: string;
  duration: string;
  thumbnail: string;
  category?: string;
  description: string;
  likes: number;
  dislikes: number;
  channelSubscribers: string;
}

// DB helper: extract YouTube video ID from URL
const extractYouTubeId = (url?: string | null): string | null => {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) return u.pathname.replace('/', '');
    if (u.hostname.includes('youtube.com')) {
      const v = u.searchParams.get('v');
      if (v) return v;
      const parts = u.pathname.split('/');
      const idx = parts.indexOf('embed');
      if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];
    }
  } catch {}
  return null;
};

export const VideoDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [video, setVideo] = useState<VideoDetails | null>(null);
  const [ytId, setYtId] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data, error } = await supabase
        .from('video_materials')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error('Error loading video:', error);
        setVideo(null);
        return;
      }
      if (!data) {
        setVideo(null);
        return;
      }

      // Map DB row to view model
      const vd: VideoDetails = {
        id: data.id,
        title: data.title,
        channel: data.video_format === 'youtube' ? 'YouTube' : 'Uploaded',
        views: 0,
        uploadDate: data.created_at,
        duration: data.duration ? `${Math.floor(data.duration / 60)}:${String(data.duration % 60).padStart(2, '0')}` : '',
        thumbnail: data.thumbnail_path || '',
        category: data.category || undefined,
        description: data.description || '',
        likes: 0,
        dislikes: 0,
        channelSubscribers: 'N/A',
      };
      setVideo(vd);
      document.title = `${vd.title} - Inclusive Learning Suite`;

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
    })();
  }, [id]);

  const formatViews = (views: number) => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views.toString();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

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

  // Player
  const player = ytId ? (
    <AccessibleYouTubePlayer
      videoId={ytId}
      title={video.title}
      captionLang={video.category === 'FSL' ? 'fi' : 'en'}
      className="overflow-hidden"
    />
  ) : fileUrl ? (
    <AccessibleVideoPlayer
      title={video.title}
      description={video.description}
      videoUrl={fileUrl}
    />
  ) : (
    <Card><CardContent className="p-6">Loading video…</CardContent></Card>
  );
  return (
    <div className="min-h-screen bg-background">
      <YouTubeNavbar onSearch={setSearchTerm} searchTerm={searchTerm} />
      
      <main className="max-w-screen-xl mx-auto px-4 py-6">
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

            {/* Player */}
            {player}

            {/* Video Info */}
            <div className="space-y-4">
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground leading-tight">
                {video.title}
              </h1>
              
              {/* Video Stats */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  <span>{formatViews(video.views)} views</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(video.uploadDate)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                <Button className="flex items-center gap-2">
                  <ThumbsUp className="h-4 w-4" />
                  <span>{formatNumber(video.likes)}</span>
                </Button>
                <Button variant="outline" className="flex items-center gap-2">
                  <ThumbsDown className="h-4 w-4" />
                  <span>{formatNumber(video.dislikes)}</span>
                </Button>
                <Button variant="outline" className="flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  Save
                </Button>
                <Button variant="outline" className="flex items-center gap-2">
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>
                <Button variant="outline" className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              </div>

              <Separator />

              {/* Channel Info */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
                    <span className="text-lg font-bold text-white">
                      {video.channel.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{video.channel}</h3>
                    <p className="text-sm text-muted-foreground">
                      {video.channelSubscribers} subscribers
                    </p>
                  </div>
                </div>
                <Button>Subscribe</Button>
              </div>

              {/* Description */}
              <Card>
                <CardContent className="pt-6">
                  <p className="text-foreground leading-relaxed whitespace-pre-line">
                    {video.description}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Related Videos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-8">Related videos coming soon.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Comments</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-8">
                  Comments section will be implemented here.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};
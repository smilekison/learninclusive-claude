import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Heart, Share2, Download, Eye, Calendar, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { YouTubeNavbar } from '@/components/layout/YouTubeNavbar';
import AccessibleYouTubePlayer from '@/components/video/AccessibleYouTubePlayer';

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

// Sample video details sourced from curated YouTube IDs
import { getSignVideo, getYouTubeThumbnail, signLanguageVideos } from '@/data/signLanguageVideos';
const getVideoDetails = (id: string): VideoDetails | null => {
  const v = getSignVideo(id);
  if (!v) return null;
  return {
    id: v.id,
    title: v.title,
    channel: v.channel,
    views: 0,
    uploadDate: v.uploadDate,
    duration: v.duration || '',
    thumbnail: getYouTubeThumbnail(v.id),
    category: v.category,
    description: v.category === 'FSL' ? 'Finnish Sign Language educational content.' : 'British Sign Language educational content.',
    likes: 0,
    dislikes: 0,
    channelSubscribers: 'N/A',
  };
};

// Compute related videos based on category and keyword overlap
const computeRelated = (currentId: string, title: string, category?: string) => {
  const tokens = title.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  const stop = new Set(['the','a','an','in','on','for','and','to','of','with','your']);
  const keywords = tokens.filter(t => !stop.has(t));
  return signLanguageVideos
    .filter(v => v.id !== currentId)
    .map(v => {
      const scoreCat = v.category === category ? 2 : 0;
      const scoreTitle = keywords.reduce((acc, k) => acc + (v.title.toLowerCase().includes(k) ? 1 : 0), 0);
      return { v, score: scoreCat + scoreTitle };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map(({ v }) => v);
};

export const VideoDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [video, setVideo] = useState<VideoDetails | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (id) {
      const videoDetails = getVideoDetails(id);
      setVideo(videoDetails);
      
      if (videoDetails) {
        document.title = `${videoDetails.title} - Inclusive Learning Suite`;
      }
    }
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

  const related = computeRelated(video.id, video.title, video.category);

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

            {/* Accessible YouTube Player */}
            <AccessibleYouTubePlayer
              videoId={video.id}
              title={video.title}
              captionLang={video.category === 'FSL' ? 'fi' : 'en'}
              className="overflow-hidden"
            />

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
                {related.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No related videos found.</p>
                ) : (
                  <div className="space-y-4">
                    {related.map((rv) => (
                      <button
                        key={rv.id}
                        onClick={() => navigate(`/video/${rv.id}`)}
                        className="w-full text-left flex gap-3 hover:bg-muted/50 rounded-md p-2 transition-colors"
                        aria-label={`Open related video: ${rv.title}`}
                      >
                        <img
                          src={getYouTubeThumbnail(rv.id)}
                          alt={`Thumbnail: ${rv.title}`}
                          loading="lazy"
                          className="w-36 h-20 object-cover rounded"
                        />
                        <div className="min-w-0">
                          <p className="font-medium line-clamp-2">{rv.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">{rv.channel}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
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
import React from 'react';
import { Clock, Eye, Calendar, Play } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Truncate } from '@/components/ui/truncate';
import { useVideoEngagement } from '@/hooks/useVideoEngagement';
interface VideoData {
  id: string;
  title: string;
  channel: string;
  views: number;
  uploadDate: string;
  duration: string;
  thumbnail: string;
  category?: string;
}

interface YouTubeVideoCardProps {
  video: VideoData;
  onClick: (video: VideoData) => void;
}

export const YouTubeVideoCard: React.FC<YouTubeVideoCardProps> = ({ video, onClick }) => {
  const { engagement } = useVideoEngagement(video.id);
  
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
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 30) return `${diffDays} days ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  return (
    <Card 
      className="overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-[1.02] group"
      onClick={() => onClick(video)}
    >
      {/* Thumbnail Container */}
      <div className="relative aspect-video bg-muted overflow-hidden">
        <img 
          src={video.thumbnail} 
          alt={`Thumbnail for ${video.title}`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        
        {/* Duration Badge */}
        <Badge 
          variant="secondary" 
          className="absolute bottom-2 right-2 bg-black/80 text-white border-0 text-xs"
        >
          <Clock className="h-3 w-3 mr-1" />
          {video.duration}
        </Badge>
        
        {/* Play Button Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
          <Button 
            size="lg" 
            className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30"
            aria-label={`Play video: ${video.title}`}
          >
            <Play className="h-6 w-6 text-white" />
          </Button>
        </div>

        {/* Category Badge */}
        {video.category && (
          <Badge className="absolute top-2 left-2 bg-primary/90">
            {video.category}
          </Badge>
        )}
      </div>

      {/* Content */}
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Title */}
          <Truncate lines={2} className="font-semibold text-foreground leading-tight group-hover:text-primary transition-colors">
            {video.title}
          </Truncate>
          
          {/* Channel Name */}
          <Truncate lines={1} className="text-sm text-muted-foreground font-medium">
            {video.channel}
          </Truncate>
          
          {/* Video Stats */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                <span>{formatViews(engagement.views)} views</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(video.uploadDate)}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
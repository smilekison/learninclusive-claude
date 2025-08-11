import React from 'react';
import { ThumbsUp, ThumbsDown, Share2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVideoEngagement } from '@/hooks/useVideoEngagement';
import { cn } from '@/lib/utils';

interface VideoEngagementBarProps {
  videoId: string;
  showViews?: boolean;
  className?: string;
}

const formatNumber = (num: number) => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

export const VideoEngagementBar: React.FC<VideoEngagementBarProps> = ({
  videoId,
  showViews = true,
  className,
}) => {
  const { engagement, toggleLike, toggleDislike, shareVideo } = useVideoEngagement(videoId);

  if (engagement.isLoading) {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        {showViews && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Eye className="h-4 w-4" />
            <span>...</span>
          </div>
        )}
        <div className="animate-pulse bg-muted h-9 w-16 rounded"></div>
        <div className="animate-pulse bg-muted h-9 w-16 rounded"></div>
        <div className="animate-pulse bg-muted h-9 w-16 rounded"></div>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {showViews && (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Eye className="h-4 w-4" />
          <span>{formatNumber(engagement.views)} views</span>
        </div>
      )}
      
      <Button
        variant={engagement.userLiked ? "default" : "outline"}
        size="sm"
        onClick={toggleLike}
        className="flex items-center gap-2"
      >
        <ThumbsUp className="h-4 w-4" />
        <span>{formatNumber(engagement.likes)}</span>
      </Button>
      
      <Button
        variant={engagement.userDisliked ? "default" : "outline"}
        size="sm"
        onClick={toggleDislike}
        className="flex items-center gap-2"
      >
        <ThumbsDown className="h-4 w-4" />
        <span>{formatNumber(engagement.dislikes)}</span>
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={shareVideo}
        className="flex items-center gap-2"
      >
        <Share2 className="h-4 w-4" />
        Share
      </Button>
    </div>
  );
};
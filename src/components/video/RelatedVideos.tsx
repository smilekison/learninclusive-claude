import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Play } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface RelatedVideo {
  id: string;
  title: string;
  thumbnail_path?: string;
  duration?: number;
  category?: string;
  tags: string[];
}

interface RelatedVideosProps {
  currentVideoId: string;
  currentVideoCategory?: string;
  currentVideoTags?: string[];
  onVideoSelect: (videoId: string) => void;
}

export const RelatedVideos: React.FC<RelatedVideosProps> = ({
  currentVideoId,
  currentVideoCategory,
  currentVideoTags = [],
  onVideoSelect,
}) => {
  const { user } = useAuth();
  const [relatedVideos, setRelatedVideos] = useState<RelatedVideo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRelatedVideos();
  }, [currentVideoId, currentVideoCategory, currentVideoTags.join(',')]);

  const fetchRelatedVideos = async () => {
    try {
      let query = supabase
        .from('video_materials')
        .select('id, title, thumbnail_path, duration, category, tags')
        .neq('id', currentVideoId);

      // Filter by visibility based on user role
      if (!user) {
        query = query.eq('visibility', 'public');
      } else if (user.role === 'student') {
        query = query.in('visibility', ['public', 'school']);
      } else {
        query = query.in('visibility', ['public', 'unlisted', 'school']);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      // Score videos based on similarity
      const scoredVideos = (data || []).map(video => {
        let score = 0;
        
        // Category match gets highest score
        if (video.category === currentVideoCategory) {
          score += 10;
        }
        
        // Tag matches
        const matchingTags = video.tags.filter(tag => 
          currentVideoTags.some(currentTag => 
            currentTag.toLowerCase() === tag.toLowerCase()
          )
        );
        score += matchingTags.length * 3;
        
        // Random factor to add variety
        score += Math.random() * 2;
        
        return { ...video, score };
      });

      // Sort by score and take top 6
      const topVideos = scoredVideos
        .sort((a, b) => b.score - a.score)
        .slice(0, 6);

      setRelatedVideos(topVideos);
    } catch (error) {
      console.error('Error fetching related videos:', error);
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

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Related Videos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse flex gap-3">
                <div className="w-20 h-12 bg-muted rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (relatedVideos.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Related Videos</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No related videos found.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Related Videos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {relatedVideos.map((video) => (
            <div
              key={video.id}
              className="flex gap-3 cursor-pointer hover:bg-muted/50 p-2 rounded-md transition-colors"
              onClick={() => onVideoSelect(video.id)}
            >
              <div className="relative w-20 h-12 bg-muted rounded overflow-hidden flex-shrink-0">
                {video.thumbnail_path ? (
                  <img 
                    src={video.thumbnail_path} 
                    alt={`Thumbnail for ${video.title}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                    <Play className="h-4 w-4 text-primary/60" />
                  </div>
                )}
                
                {video.duration && (
                  <Badge 
                    variant="secondary" 
                    className="absolute bottom-1 right-1 bg-black/80 text-white border-0 text-xs px-1 py-0"
                  >
                    {formatDuration(video.duration)}
                  </Badge>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm line-clamp-2 leading-tight mb-1">
                  {video.title}
                </h4>
                
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {video.category && (
                    <Badge variant="outline" className="text-xs px-1 py-0">
                      {video.category}
                    </Badge>
                  )}
                  {video.duration && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDuration(video.duration)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
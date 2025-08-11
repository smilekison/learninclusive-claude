import React, { useState, useEffect } from 'react';
import { Search, Filter, Grid, List, Clock, Play, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { AccessibleVideoPlayer } from './AccessibleVideoPlayer';

interface VideoMaterial {
  id: string;
  title: string;
  description: string;
  file_path: string;
  thumbnail_path?: string;
  transcript_text?: string;
  duration?: number;
  category?: string;
  difficulty_level?: string;
  tags: string[];
  created_at: string;
}

interface VideoLibraryProps {
  showPublicOnly?: boolean;
}

export const VideoLibrary: React.FC<VideoLibraryProps> = ({ showPublicOnly = false }) => {
  const { user } = useAuth();
  const [videos, setVideos] = useState<VideoMaterial[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<VideoMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedVideo, setSelectedVideo] = useState<VideoMaterial | null>(null);
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchVideos();
  }, [user, showPublicOnly]);

  useEffect(() => {
    filterVideos();
  }, [videos, searchTerm, selectedCategory, selectedDifficulty]);

  const fetchVideos = async () => {
    try {
      let query = supabase.from('video_materials').select('*');

      if (showPublicOnly || !user) {
        query = query.eq('visibility', 'public');
      } else if (user.role === 'teacher' || user.role === 'principal') {
        query = query.in('visibility', ['public', 'unlisted', 'school']);
      } else if (user.role === 'student') {
        query = query.in('visibility', ['public', 'school']);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      setVideos(data || []);
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
        video.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(video => 
        video.category?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Difficulty filter
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(video => 
        video.difficulty_level?.toLowerCase() === selectedDifficulty.toLowerCase()
      );
    }

    setFilteredVideos(filtered);
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'Unknown';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const categories = Array.from(new Set(videos.map(v => v.category).filter(Boolean)));
  const difficulties = Array.from(new Set(videos.map(v => v.difficulty_level).filter(Boolean)));

  if (selectedVideo) {
    return (
      <div className="space-y-6">
        <Button 
          variant="outline" 
          onClick={() => setSelectedVideo(null)}
          className="mb-4"
        >
          ← Back to Library
        </Button>
        <AccessibleVideoPlayer
          title={selectedVideo.title}
          description={selectedVideo.description || ''}
          videoUrl={selectedVideo.file_path}
          transcript={selectedVideo.transcript_text}
          duration={selectedVideo.duration}
          thumbnailUrl={selectedVideo.thumbnail_path}
        />
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {showPublicOnly ? 'Featured Videos' : 'Video Library'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {showPublicOnly 
              ? 'Explore our featured educational content'
              : 'Discover engaging educational videos'
            }
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
            aria-label="Grid view"
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
            aria-label="List view"
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
              placeholder="Search videos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              aria-label="Search videos"
            />
          </div>
        </div>
        
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full md:w-48" aria-label="Select category">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(category => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
          <SelectTrigger className="w-full md:w-48" aria-label="Select difficulty">
            <SelectValue placeholder="All Levels" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            {difficulties.map(difficulty => (
              <SelectItem key={difficulty} value={difficulty}>
                {difficulty?.charAt(0).toUpperCase() + difficulty?.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredVideos.length} video{filteredVideos.length !== 1 ? 's' : ''} found
        </p>
        
        {showPublicOnly && !user && (
          <Badge variant="secondary" className="flex items-center gap-2">
            <EyeOff className="h-3 w-3" />
            Limited access - Sign in for full library
          </Badge>
        )}
      </div>

      {/* Video Grid/List */}
      {filteredVideos.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No videos found matching your criteria.</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map((video) => (
            <Card key={video.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="p-0">
                <div 
                  className="relative aspect-video bg-muted rounded-t-lg overflow-hidden group"
                  onClick={() => setSelectedVideo(video)}
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
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button size="lg" className="rounded-full">
                      <Play className="h-6 w-6 ml-1" />
                    </Button>
                  </div>
                  {video.tags.includes('featured') && (
                    <Badge className="absolute top-2 left-2 bg-primary">
                      Featured
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <CardTitle className="line-clamp-2 mb-2">{video.title}</CardTitle>
                <CardDescription className="line-clamp-3 mb-3">
                  {video.description}
                </CardDescription>
                
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDuration(video.duration)}
                  </div>
                  {video.difficulty_level && (
                    <Badge variant="outline" className="text-xs">
                      {video.difficulty_level.charAt(0).toUpperCase() + video.difficulty_level.slice(1)}
                    </Badge>
                  )}
                </div>
                
                {video.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {video.tags.slice(0, 3).map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {video.tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{video.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredVideos.map((video) => (
            <Card key={video.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div 
                  className="flex gap-4 items-start"
                  onClick={() => setSelectedVideo(video)}
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
                        <h3 className="font-semibold text-foreground line-clamp-1 mb-1">
                          {video.title}
                        </h3>
                        <p className="text-muted-foreground text-sm line-clamp-2 mb-2">
                          {video.description}
                        </p>
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDuration(video.duration)}
                          </div>
                          {video.category && (
                            <span>{video.category}</span>
                          )}
                          {video.difficulty_level && (
                            <Badge variant="outline" className="text-xs">
                              {video.difficulty_level.charAt(0).toUpperCase() + video.difficulty_level.slice(1)}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {video.tags.includes('featured') && (
                        <Badge className="bg-primary flex-shrink-0">
                          Featured
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
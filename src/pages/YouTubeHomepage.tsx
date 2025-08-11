import React, { useState, useEffect, useMemo } from 'react';
import { YouTubeNavbar } from '@/components/layout/YouTubeNavbar';
import { YouTubeVideoCard } from '@/components/video/YouTubeVideoCard';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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

// Videos from database
const formatDuration = (seconds?: number) => {
  if (!seconds && seconds !== 0) return '';
  const m = Math.floor((seconds as number) / 60);
  const s = (seconds as number) % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
};

export const YouTubeHomepage: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [videos, setVideos] = useState<VideoData[]>([]);
  const categories = useMemo(() => Array.from(new Set(videos.map(v => v.category).filter(Boolean))) as string[], [videos]);
  const [filteredVideos, setFilteredVideos] = useState<VideoData[]>([]);

  // Fetch videos from Supabase with visibility rules
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        let query = supabase.from('video_materials').select('*').order('created_at', { ascending: false }).limit(24);
        if (!user) {
          query = query.eq('visibility', 'public');
        } else if (user.role === 'teacher' || user.role === 'principal') {
          query = query.in('visibility', ['public', 'school']); // exclude private & unlisted from homepage listing
        } else if (user.role === 'student') {
          query = query.in('visibility', ['public', 'school']);
        }

        const { data, error } = await query;
        if (error) throw error;
        const mapped: VideoData[] = (data || []).map((v: any) => ({
          id: v.id,
          title: v.title,
          channel: v.video_format === 'youtube' ? 'YouTube' : 'Uploaded',
          views: 0,
          uploadDate: new Date(v.created_at).toLocaleDateString(),
          duration: formatDuration(v.duration ?? undefined),
          thumbnail: v.thumbnail_path || '/placeholder.svg',
          category: v.category || undefined,
        }));
        if (isMounted) setVideos(mapped);
      } catch (e) {
        console.error('Failed to load videos', e);
      }
    })();
    return () => { isMounted = false; };
  }, [user]);
  useEffect(() => {
    let filtered = videos;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(video =>
        video.title.toLowerCase().includes(term) ||
        video.channel.toLowerCase().includes(term) ||
        (video.category?.toLowerCase().includes(term) ?? false)
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(video => video.category === selectedCategory);
    }

    setFilteredVideos(filtered);
  }, [videos, searchTerm, selectedCategory]);

  const handleVideoClick = (video: VideoData) => {
    navigate(`/video/${video.id}`);
  };

  useEffect(() => {
    document.title = 'Learn Sign Language: BSL & FSL | Inclusive Learning Suite';

    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', 'Curated free British and Finnish Sign Language lessons with accessible controls and captions.');

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', `${window.location.origin}/`);

    // Structured data (WebSite with SearchAction)
    const existingLd = document.querySelector('script[data-ld="website"]');
    if (existingLd) existingLd.remove();
    const ld = document.createElement('script');
    ld.type = 'application/ld+json';
    ld.setAttribute('data-ld', 'website');
    ld.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Inclusive Learning Suite',
      url: `${window.location.origin}/`,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${window.location.origin}/?search={search_term_string}`,
        'query-input': 'required name=search_term_string'
      }
    });
    document.head.appendChild(ld);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <YouTubeNavbar onSearch={setSearchTerm} searchTerm={searchTerm} />
      
      {/* Hero */}
      <header className="bg-gradient-to-b from-primary/10 to-transparent border-b border-border">
        <div className="max-w-screen-2xl mx-auto px-4 py-10">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            {t('homepage.title')}
          </h1>
          <p className="mt-2 text-muted-foreground max-w-2xl">
            {t('homepage.subtitle')}
          </p>
          {categories.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={selectedCategory ? "outline" : "default"}
                onClick={() => setSelectedCategory(null)}
                aria-pressed={!selectedCategory}
              >
                {t('common.all')}
              </Button>
              {categories.map((cat) => (
                <Button
                  key={cat}
                  size="sm"
                  variant={selectedCategory === cat ? "default" : "outline"}
                  onClick={() => setSelectedCategory(cat)}
                  className="rounded-full"
                  aria-pressed={selectedCategory === cat}
                >
                  {cat}
                </Button>
              ))}
            </div>
          )}
        </div>
      </header>
      
      {/* Main Content */}
      <main className="max-w-screen-2xl mx-auto px-4 py-6">
        {/* Search Results Header */}
        {searchTerm && (
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Search Results
            </h2>
            <p className="text-muted-foreground">
              Found {filteredVideos.length} video{filteredVideos.length !== 1 ? 's' : ''} for "{searchTerm}"
            </p>
          </div>
        )}
        
        {/* Video Grid */}
        {filteredVideos.length === 0 ? (
          <div className="text-center py-16">
            <h2 className="text-xl font-semibold text-foreground mb-2">No videos found</h2>
            <p className="text-muted-foreground">
              Try adjusting your search terms or browse all videos.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {filteredVideos.map((video) => (
              <YouTubeVideoCard
                key={video.id}
                video={video}
                onClick={handleVideoClick}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
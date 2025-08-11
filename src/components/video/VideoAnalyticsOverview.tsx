
import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown, Eye, Play } from 'lucide-react';

interface VideoAnalyticsOverviewProps {
  videos: Array<{ id: string; title?: string | null }>; // expects video_materials rows
}

interface ViewRow {
  video_id: string;
  watch_seconds: number | null;
  completed: boolean | null;
}

interface LikeRow {
  video_id: string;
  liked: boolean;
}

const formatDuration = (seconds: number) => {
  const s = Math.floor(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
};

type RangePreset = '7d' | '30d' | '90d' | 'all';

export const VideoAnalyticsOverview: React.FC<VideoAnalyticsOverviewProps> = ({ videos }) => {
  const [views, setViews] = useState<ViewRow[]>([]);
  const [likes, setLikes] = useState<LikeRow[]>([]);
  const [range, setRange] = useState<RangePreset>('7d');
  const [loading, setLoading] = useState(false);

  const videoIds = useMemo(() => videos.map(v => v.id).filter(Boolean), [videos]);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!videoIds.length) { 
        setViews([]);
        setLikes([]);
        return; 
      }
      setLoading(true);
      
      // Fetch views
      const viewsQuery = supabase
        .from('video_views')
        .select('video_id, watch_seconds, completed')
        .in('video_id', videoIds);

      if (range !== 'all') {
        const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
        const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
        viewsQuery.gte('started_at', from);
      }

      // Fetch likes/dislikes
      const likesQuery = supabase
        .from('video_likes')
        .select('video_id, liked')
        .in('video_id', videoIds);

      if (range !== 'all') {
        const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
        const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
        likesQuery.gte('created_at', from);
      }

      const [viewsResult, likesResult] = await Promise.all([
        viewsQuery,
        likesQuery
      ]);

      if (!active) return;
      if (!viewsResult.error) setViews((viewsResult.data || []) as ViewRow[]);
      if (!likesResult.error) setLikes((likesResult.data || []) as LikeRow[]);
      setLoading(false);
    })();
    return () => { active = false; };
  }, [videoIds.join(','), range]);

  const totals = useMemo(() => {
    const totalViews = views.length;
    const totalWatch = views.reduce((acc, v) => acc + (v.watch_seconds || 0), 0);
    const totalCompleted = views.filter(v => v.completed).length;
    const totalLikes = likes.filter(l => l.liked).length;
    const totalDislikes = likes.filter(l => !l.liked).length;
    return { totalViews, totalWatch, totalCompleted, totalLikes, totalDislikes };
  }, [views, likes]);

  const perVideo = useMemo(() => {
    const map = new Map<string, { title: string; views: number; watch: number; completed: number; likes: number; dislikes: number }>();
    for (const v of videos) {
      map.set(v.id, { title: v.title || 'Untitled', views: 0, watch: 0, completed: 0, likes: 0, dislikes: 0 });
    }
    for (const row of views) {
      const e = map.get(row.video_id);
      if (!e) continue;
      e.views += 1;
      e.watch += row.watch_seconds || 0;
      if (row.completed) e.completed += 1;
    }
    for (const row of likes) {
      const e = map.get(row.video_id);
      if (!e) continue;
      if (row.liked) e.likes += 1;
      else e.dislikes += 1;
    }
    return Array.from(map.entries()).map(([id, stats]) => ({ id, ...stats }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);
  }, [videos, views, likes]);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <CardTitle>Analytics Overview</CardTitle>
        <div className="flex items-center gap-2">
          <Button variant={range === '7d' ? 'default' : 'outline'} size="sm" onClick={() => setRange('7d')}>7d</Button>
          <Button variant={range === '30d' ? 'default' : 'outline'} size="sm" onClick={() => setRange('30d')}>30d</Button>
          <Button variant={range === '90d' ? 'default' : 'outline'} size="sm" onClick={() => setRange('90d')}>90d</Button>
          <Button variant={range === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setRange('all')}>All</Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-5">
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <Eye className="h-3 w-3" />
              Total views
            </div>
            <div className="text-2xl font-bold">{loading ? '...' : totals.totalViews}</div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <Play className="h-3 w-3" />
              Total watch time
            </div>
            <div className="text-2xl font-bold">{loading ? '...' : formatDuration(totals.totalWatch)}</div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm text-muted-foreground">Completions</div>
            <div className="text-2xl font-bold">{loading ? '...' : totals.totalCompleted}</div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <ThumbsUp className="h-3 w-3" />
              Total likes
            </div>
            <div className="text-2xl font-bold">{loading ? '...' : totals.totalLikes}</div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <ThumbsDown className="h-3 w-3" />
              Total dislikes
            </div>
            <div className="text-2xl font-bold">{loading ? '...' : totals.totalDislikes}</div>
          </div>
        </div>

        <Separator className="my-4" />

        <div>
          <div className="text-sm text-muted-foreground mb-2">Top videos (by views)</div>
          {!perVideo.length ? (
            <div className="text-muted-foreground text-sm">No analytics yet. Play a video to start collecting data.</div>
          ) : (
            <ul className="space-y-2">
              {perVideo.map(v => (
                <li key={v.id} className="flex items-center justify-between rounded-md border p-3">
                  <div className="font-medium truncate max-w-[60%]" title={v.title}>{v.title}</div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{v.views} views</span>
                    <span>{formatDuration(v.watch)}</span>
                    <span>{v.completed} done</span>
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="h-3 w-3" />
                      {v.likes}
                    </span>
                    <span className="flex items-center gap-1">
                      <ThumbsDown className="h-3 w-3" />
                      {v.dislikes}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default VideoAnalyticsOverview;

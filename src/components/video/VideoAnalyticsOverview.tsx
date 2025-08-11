
import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';

interface VideoAnalyticsOverviewProps {
  videos: Array<{ id: string; title?: string | null }>; // expects video_materials rows
}

interface ViewRow {
  video_id: string;
  watch_seconds: number | null;
  completed: boolean | null;
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
  const [range, setRange] = useState<RangePreset>('7d');
  const [loading, setLoading] = useState(false);

  const videoIds = useMemo(() => videos.map(v => v.id).filter(Boolean), [videos]);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!videoIds.length) { setViews([]); return; }
      setLoading(true);
      const q = supabase
        .from('video_views')
        .select('video_id, watch_seconds, completed')
        .in('video_id', videoIds);

      if (range !== 'all') {
        const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
        const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
        q.gte('started_at', from);
      }

      const { data, error } = await q;
      if (!active) return;
      if (!error) setViews((data || []) as ViewRow[]);
      setLoading(false);
    })();
    return () => { active = false; };
  }, [videoIds.join(','), range]);

  const totals = useMemo(() => {
    const totalViews = views.length;
    const totalWatch = views.reduce((acc, v) => acc + (v.watch_seconds || 0), 0);
    const totalCompleted = views.filter(v => v.completed).length;
    return { totalViews, totalWatch, totalCompleted };
  }, [views]);

  const perVideo = useMemo(() => {
    const map = new Map<string, { title: string; views: number; watch: number; completed: number }>();
    for (const v of videos) {
      map.set(v.id, { title: v.title || 'Untitled', views: 0, watch: 0, completed: 0 });
    }
    for (const row of views) {
      const e = map.get(row.video_id);
      if (!e) continue;
      e.views += 1;
      e.watch += row.watch_seconds || 0;
      if (row.completed) e.completed += 1;
    }
    return Array.from(map.entries()).map(([id, stats]) => ({ id, ...stats }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);
  }, [videos, views]);

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
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm text-muted-foreground">Total views</div>
            <div className="text-2xl font-bold">{loading ? '...' : totals.totalViews}</div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm text-muted-foreground">Total watch time</div>
            <div className="text-2xl font-bold">{loading ? '...' : formatDuration(totals.totalWatch)}</div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm text-muted-foreground">Completions</div>
            <div className="text-2xl font-bold">{loading ? '...' : totals.totalCompleted}</div>
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

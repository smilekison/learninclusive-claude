
import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { VideoAnalyticsDetail } from './VideoAnalyticsDetail';

interface VideoAnalyticsTableProps {
  videos: Array<{ id: string; title?: string | null }>;
}

interface ViewRow { video_id: string; watch_seconds: number | null; completed: boolean | null; }

const formatDuration = (seconds: number) => {
  const s = Math.floor(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
};

export const VideoAnalyticsTable: React.FC<VideoAnalyticsTableProps> = ({ videos }) => {
  const [views, setViews] = useState<ViewRow[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<{ id: string; title: string } | null>(null);
  const [open, setOpen] = useState(false);

  const videoIds = useMemo(() => videos.map(v => v.id).filter(Boolean), [videos]);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!videoIds.length) { setViews([]); return; }
      const { data, error } = await supabase
        .from('video_views')
        .select('video_id, watch_seconds, completed')
        .in('video_id', videoIds);
      if (!active) return;
      if (!error) setViews((data || []) as ViewRow[]);
    })();
    return () => { active = false; };
  }, [videoIds.join(',')]);

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
    let arr = Array.from(map.entries()).map(([id, stats]) => ({ id, ...stats }))
      .sort((a, b) => b.views - a.views);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      arr = arr.filter(v => v.title.toLowerCase().includes(q));
    }
    return arr;
  }, [videos, views, search]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle>Per‑video performance</CardTitle>
          <div className="w-full max-w-xs">
            <Input
              placeholder="Search videos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead className="text-right">Views</TableHead>
              <TableHead className="text-right">Watch time</TableHead>
              <TableHead className="text-right">Completions</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!perVideo.length && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">No data yet.</TableCell>
              </TableRow>
            )}
            {perVideo.map(v => (
              <TableRow key={v.id}>
                <TableCell className="max-w-[420px] truncate" title={v.title}>{v.title}</TableCell>
                <TableCell className="text-right">{v.views}</TableCell>
                <TableCell className="text-right">{formatDuration(v.watch)}</TableCell>
                <TableCell className="text-right">{v.completed}</TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="outline" onClick={() => { setSelected({ id: v.id, title: v.title }); setOpen(true); }}>
                    View details
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-5xl">
            <DialogHeader>
              <DialogTitle>Analytics: {selected?.title}</DialogTitle>
            </DialogHeader>
            {selected && (
              <div className="mt-2">
                <VideoAnalyticsDetail videoId={selected.id} title={selected.title} />
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default VideoAnalyticsTable;

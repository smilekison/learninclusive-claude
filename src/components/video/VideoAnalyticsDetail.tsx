
import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';

type RangePreset = '7d' | '30d' | '90d' | 'all';

interface Props {
  videoId: string;
  title?: string;
}

interface View {
  id: string;
  started_at: string;
  ended_at: string | null;
  watch_seconds: number;
  completed: boolean;
  source: string | null;
  device: string | null;
  session_id: string | null;
  user_id: string | null;
}

const formatDuration = (seconds: number) => {
  const s = Math.floor(seconds || 0);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
};

export const VideoAnalyticsDetail: React.FC<Props> = ({ videoId, title }) => {
  const [range, setRange] = useState<RangePreset>('30d');
  const [views, setViews] = useState<View[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const q = supabase
        .from('video_views')
        .select('id, started_at, ended_at, watch_seconds, completed, source, device, session_id, user_id')
        .eq('video_id', videoId)
        .order('started_at', { ascending: false });

      if (range !== 'all') {
        const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
        const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
        q.gte('started_at', from);
      }

      const { data, error } = await q;
      if (!active) return;
      if (!error) setViews((data || []) as unknown as View[]);
      setLoading(false);
    })();
    return () => { active = false; };
  }, [videoId, range]);

  const kpis = useMemo(() => {
    const totalViews = views.length;
    const totalWatch = views.reduce((acc, v) => acc + (v.watch_seconds || 0), 0);
    const avgWatch = totalViews ? totalWatch / totalViews : 0;
    const completed = views.filter(v => v.completed).length;
    const completionRate = totalViews ? (completed / totalViews) * 100 : 0;
    const uniqueUsers = new Set(views.map(v => v.user_id).filter(Boolean)).size;
    const uniqueSessions = new Set(views.map(v => v.session_id).filter(Boolean)).size;
    return { totalViews, totalWatch, avgWatch, completionRate, uniqueUsers, uniqueSessions };
  }, [views]);

  const timeSeries = useMemo(() => {
    // Aggregate by day: views count and watch_seconds sum
    const map = new Map<string, { date: string; views: number; watch: number }>();
    for (const v of views) {
      const day = v.started_at ? v.started_at.slice(0, 10) : 'unknown';
      const e = map.get(day) || { date: day, views: 0, watch: 0 };
      e.views += 1;
      e.watch += v.watch_seconds || 0;
      map.set(day, e);
    }
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [views]);

  const sourceBreakdown = useMemo(() => {
    const counts = new Map<string, number>();
    for (const v of views) {
      const s = v.source || 'unknown';
      counts.set(s, (counts.get(s) || 0) + 1);
    }
    return Array.from(counts.entries()).map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count);
  }, [views]);

  const exportCSV = () => {
    const header = ['id', 'started_at', 'ended_at', 'watch_seconds', 'completed', 'source', 'device', 'session_id', 'user_id'];
    const rows = views.map(v => [
      v.id,
      v.started_at,
      v.ended_at ?? '',
      String(v.watch_seconds ?? 0),
      String(!!v.completed),
      v.source ?? '',
      (v.device || '').replace(/\s+/g, ' ').slice(0, 120),
      v.session_id ?? '',
      v.user_id ?? ''
    ]);
    const csv = [header, ...rows].map(r => r.map(field => {
      const s = String(field ?? '');
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    }).join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const date = new Date().toISOString().slice(0, 10);
    a.download = `video_analytics_${videoId}_${date}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-sm text-muted-foreground">Video</div>
          <div className="font-medium truncate max-w-[60vw]" title={title}>{title || videoId}</div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant={range === '7d' ? 'default' : 'outline'} size="sm" onClick={() => setRange('7d')}>7d</Button>
          <Button variant={range === '30d' ? 'default' : 'outline'} size="sm" onClick={() => setRange('30d')}>30d</Button>
          <Button variant={range === '90d' ? 'default' : 'outline'} size="sm" onClick={() => setRange('90d')}>90d</Button>
          <Button variant={range === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setRange('all')}>All</Button>
          <Button variant="outline" size="sm" onClick={exportCSV}>Export CSV</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-base">Views</CardTitle></CardHeader>
          <CardContent>{loading ? <Skeleton className="h-6 w-16" /> : <div className="text-2xl font-bold">{kpis.totalViews}</div>}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Watch time</CardTitle></CardHeader>
          <CardContent>{loading ? <Skeleton className="h-6 w-24" /> : <div className="text-2xl font-bold">{formatDuration(kpis.totalWatch)}</div>}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Avg watch</CardTitle></CardHeader>
          <CardContent>{loading ? <Skeleton className="h-6 w-20" /> : <div className="text-2xl font-bold">{formatDuration(kpis.avgWatch)}</div>}</CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-base">Completion rate</CardTitle></CardHeader>
          <CardContent>{loading ? <Skeleton className="h-6 w-16" /> : <div className="text-2xl font-bold">{kpis.completionRate.toFixed(0)}%</div>}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Unique users</CardTitle></CardHeader>
          <CardContent>{loading ? <Skeleton className="h-6 w-16" /> : <div className="text-2xl font-bold">{kpis.uniqueUsers}</div>}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Unique sessions</CardTitle></CardHeader>
          <CardContent>{loading ? <Skeleton className="h-6 w-16" /> : <div className="text-2xl font-bold">{kpis.uniqueSessions}</div>}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Trends</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-48 w-full" />
          ) : timeSeries.length === 0 ? (
            <div className="text-sm text-muted-foreground">No data for the selected range.</div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeSeries}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={(d) => format(new Date(d), 'MM-dd')} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="views" stroke="hsl(var(--primary))" name="Views" dot={false} />
                  <Line type="monotone" dataKey="watch" stroke="hsl(var(--muted-foreground))" name="Watch (s)" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Source breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-24 w-full" />
            ) : sourceBreakdown.length === 0 ? (
              <div className="text-sm text-muted-foreground">No data.</div>
            ) : (
              <ul className="space-y-2">
                {sourceBreakdown.map(s => (
                  <li key={s.source} className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Badge variant="secondary">{s.source}</Badge>
                    </span>
                    <span className="text-sm text-muted-foreground">{s.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Recent sessions</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-40 w-full" />
            ) : views.length === 0 ? (
              <div className="text-sm text-muted-foreground">No sessions yet.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Started</TableHead>
                    <TableHead>Watch</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Device</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {views.slice(0, 10).map(v => (
                    <TableRow key={v.id}>
                      <TableCell className="whitespace-nowrap">{format(new Date(v.started_at), 'PP p')}</TableCell>
                      <TableCell>{formatDuration(v.watch_seconds)}</TableCell>
                      <TableCell>{v.completed ? 'Yes' : 'No'}</TableCell>
                      <TableCell>{v.source || 'unknown'}</TableCell>
                      <TableCell className="truncate max-w-[220px]" title={v.device || ''}>
                        {(v.device || '').slice(0, 80)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VideoAnalyticsDetail;

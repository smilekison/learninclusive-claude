import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabaseMutation } from '@/hooks/useSupabaseQuery';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useSchools } from '@/hooks/useSupabaseQuery';
import { signLanguageVideos, getYouTubeThumbnail } from '@/data/signLanguageVideos';
import { Plus, Filter, Pencil, Trash2, Clapperboard, Globe2, LockKeyhole, Shield, Link as LinkIcon } from 'lucide-react';
import { VideoAnalyticsOverview } from '@/components/video/VideoAnalyticsOverview';

// Helper to get YouTube ID from various URL formats
function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) return u.pathname.replace('/', '');
    if (u.hostname.includes('youtube.com')) {
      const v = u.searchParams.get('v');
      if (v) return v;
      const parts = u.pathname.split('/');
      const idx = parts.indexOf('embed');
      if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];
    }
  } catch {}
  return null;
}

interface VideoFormState {
  id?: string;
  title: string;
  description: string;
  category: string;
  difficulty_level: string;
  tags: string;
  visibility: 'public' | 'private' | 'unlisted' | 'school';
  school_id?: string | null;
  external_url: string;
  file_path?: string | null;
}

const defaultForm: VideoFormState = {
  title: '',
  description: '',
  category: '',
  difficulty_level: 'beginner',
  tags: '',
  visibility: 'private',
  school_id: null,
  external_url: '',
  file_path: null
};

export const VideoManagementPage: React.FC = () => {
  const { user } = useAuth();
  const { data: schools = [] } = useSchools();

  // SEO basics
  useEffect(() => {
    document.title = 'Manage Videos | Inclusive Learning Suite';
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', 'Manage and upload videos with visibility controls: public, private, unlisted, or school-only.');
    else {
      const m = document.createElement('meta');
      m.name = 'description';
      m.content = 'Manage and upload videos with visibility controls: public, private, unlisted, or school-only.';
      document.head.appendChild(m);
    }
    const canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      const link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      link.setAttribute('href', window.location.origin + '/videos/manage');
      document.head.appendChild(link);
    }
  }, []);

  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<VideoFormState | null>(null);
  const [form, setForm] = useState<VideoFormState>(defaultForm);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  // Filters
  const [search, setSearch] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState<'all'|'public'|'private'|'unlisted'|'school'>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');

  const fetchVideos = async () => {
    setLoading(true);
    let query = supabase
      .from('video_materials')
      .select('*')
      .order('created_at', { ascending: false });

    if (user?.role === 'teacher') {
      query = query.eq('uploaded_by', user.id);
    }

    const { data, error } = await query;
    setLoading(false);
    if (!error) setVideos(data || []);
  };
  useEffect(() => {
    fetchVideos();
  }, []);

  const createMutation = useSupabaseMutation(
    async (payload: VideoFormState) => {
      const ytId = extractYouTubeId(payload.external_url || '');
      const isFile = !!payload.file_path;
      const insert = {
        title: payload.title,
        description: payload.description || null,
        category: payload.category || null,
        difficulty_level: payload.difficulty_level || null,
        tags: payload.tags ? payload.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        visibility: payload.visibility,
        school_id: payload.visibility === 'school' ? payload.school_id || null : null,
        external_url: isFile ? null : (payload.external_url || null),
        file_path: isFile ? payload.file_path : (ytId ? `youtube:${ytId}` : payload.external_url || null),
        uploaded_by: user?.id,
        video_format: isFile ? 'mp4' : 'youtube',
        thumbnail_path: !isFile && ytId ? getYouTubeThumbnail(ytId) : null,
      } as any;
      return await supabase.from('video_materials').insert(insert).select().single();
    },
    {
      successMessage: 'Video created',
      invalidateKeys: [['video-materials']],
      onSuccess: () => { setOpen(false); setForm(defaultForm); fetchVideos(); }
    }
  );

  const updateMutation = useSupabaseMutation(
    async (payload: VideoFormState) => {
      if (!payload.id) throw new Error('Missing id');
      const ytId = extractYouTubeId(payload.external_url || '');
      const isFile = !!payload.file_path;
      const updates: any = {
        title: payload.title,
        description: payload.description || null,
        category: payload.category || null,
        difficulty_level: payload.difficulty_level || null,
        tags: payload.tags ? payload.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        visibility: payload.visibility,
        school_id: payload.visibility === 'school' ? payload.school_id || null : null,
      };

      if (isFile) {
        updates.file_path = payload.file_path;
        updates.external_url = null;
        updates.video_format = 'mp4';
        updates.thumbnail_path = null;
      } else {
        updates.external_url = payload.external_url || null;
        updates.video_format = 'youtube';
        updates.thumbnail_path = ytId ? getYouTubeThumbnail(ytId) : null;
      }

      return await supabase.from('video_materials').update(updates).eq('id', payload.id).select().single();
    },
    {
      successMessage: 'Video updated',
      invalidateKeys: [['video-materials']],
      onSuccess: () => { setOpen(false); setEditing(null); setForm(defaultForm); fetchVideos(); }
    }
  );

  const deleteMutation = useSupabaseMutation(
    async (id: string) => await supabase.from('video_materials').delete().eq('id', id),
    {
      successMessage: 'Video deleted',
      invalidateKeys: [['video-materials']],
      onSuccess: () => fetchVideos()
    }
  );

  const categories = useMemo(() => Array.from(new Set(videos.map(v => v.category).filter(Boolean))), [videos]);
  const difficulties = ['beginner','intermediate','advanced'];

  const filtered = useMemo(() => {
    return videos.filter(v => {
      const matchesSearch = !search || v.title?.toLowerCase().includes(search.toLowerCase());
      const matchesVis = visibilityFilter === 'all' || v.visibility === visibilityFilter;
      const matchesCat = categoryFilter === 'all' || v.category === categoryFilter;
      const matchesDiff = difficultyFilter === 'all' || v.difficulty_level === difficultyFilter;
      return matchesSearch && matchesVis && matchesCat && matchesDiff;
    });
  }, [videos, search, visibilityFilter, categoryFilter, difficultyFilter]);

  const openCreate = () => {
    setEditing(null);
    setForm(defaultForm);
    setOpen(true);
  };

  const openEdit = (v: any) => {
    setEditing({
      id: v.id,
      title: v.title || '',
      description: v.description || '',
      category: v.category || '',
      difficulty_level: v.difficulty_level || 'beginner',
      tags: (v.tags || []).join(', '),
      visibility: v.visibility || 'private',
      school_id: v.school_id || null,
      external_url: v.external_url || ''
    });
    setForm({
      id: v.id,
      title: v.title || '',
      description: v.description || '',
      category: v.category || '',
      difficulty_level: v.difficulty_level || 'beginner',
      tags: (v.tags || []).join(', '),
      visibility: v.visibility || 'private',
      school_id: v.school_id || null,
      external_url: v.external_url || ''
    });
    setOpen(true);
  };

  const onSubmit = async () => {
    if (!form.title) return;

    let payload = { ...form } as VideoFormState;

    // If a file is selected, upload to Supabase Storage first
    if (selectedFile && user?.id) {
      const path = `${user.id}/${Date.now()}-${selectedFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from('videos')
        .upload(path, selectedFile, { contentType: selectedFile.type });
      if (!uploadError) {
        payload = { ...payload, file_path: path, external_url: '' };
      }
    }

    if (editing) updateMutation.mutate(payload);
    else createMutation.mutate(payload);
  };
  const seedSamples = async () => {
    const samples = signLanguageVideos.slice(0, 6).map((v) => ({
      title: v.title,
      description: `${v.channel} • ${v.uploadDate}`,
      category: v.category || 'Sign Language',
      difficulty_level: 'beginner',
      tags: ['sign-language','youtube'],
      visibility: 'public',
      school_id: null,
      external_url: `https://www.youtube.com/watch?v=${v.id}`,
      file_path: `https://www.youtube.com/watch?v=${v.id}`,
      uploaded_by: user?.id,
      video_format: 'youtube',
      thumbnail_path: getYouTubeThumbnail(v.id)
    }));
    await supabase.from('video_materials').insert(samples);
    fetchVideos();
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Manage Videos</h1>
        <p className="text-muted-foreground">Create, edit, and organize videos with visibility controls.</p>
      </header>

      <div className="flex items-center gap-2 flex-wrap">
        <Button onClick={openCreate} className="flex items-center gap-2"><Plus className="h-4 w-4" /> New Video</Button>
        <Button variant="outline" onClick={seedSamples} className="flex items-center gap-2">
          <Clapperboard className="h-4 w-4" /> Add sample YouTube videos
        </Button>
      </div>

      <VideoAnalyticsOverview videos={videos} />


      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Filter className="h-4 w-4" /> Filters</CardTitle>
          <CardDescription>Search and filter videos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <Input placeholder="Search by title" value={search} onChange={(e) => setSearch(e.target.value)} />
            <Select value={visibilityFilter} onValueChange={(v: any) => setVisibilityFilter(v)}>
              <SelectTrigger><SelectValue placeholder="Visibility" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="unlisted">Unlisted</SelectItem>
                <SelectItem value="private">Private</SelectItem>
                <SelectItem value="school">School-only</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={(v: any) => setCategoryFilter(v)}>
              <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={difficultyFilter} onValueChange={(v: any) => setDifficultyFilter(v)}>
              <SelectTrigger><SelectValue placeholder="Difficulty" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Videos</CardTitle>
          <CardDescription>Manage your library</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Visibility</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Difficulty</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="max-w-[320px]">
                    <div className="flex items-center gap-3">
                      {v.thumbnail_path && <img src={v.thumbnail_path} alt={v.title} className="h-12 w-20 rounded object-cover" loading="lazy" />}
                      <div>
                        <div className="font-medium line-clamp-1">{v.title}</div>
                        {v.external_url && (
                          <a href={v.external_url} target="_blank" rel="noreferrer" className="text-xs text-primary inline-flex items-center gap-1">
                            <LinkIcon className="h-3 w-3" /> Open link
                          </a>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {v.visibility === 'public' && <Badge variant="secondary" className="flex items-center gap-1"><Globe2 className="h-3 w-3" /> Public</Badge>}
                    {v.visibility === 'unlisted' && <Badge variant="outline">Unlisted</Badge>}
                    {v.visibility === 'private' && <Badge variant="destructive" className="flex items-center gap-1"><LockKeyhole className="h-3 w-3" /> Private</Badge>}
                    {v.visibility === 'school' && <Badge variant="secondary" className="flex items-center gap-1"><Shield className="h-3 w-3" /> School</Badge>}
                  </TableCell>
                  <TableCell>{v.category || '-'}</TableCell>
                  <TableCell className="capitalize">{v.difficulty_level || '-'}</TableCell>
                  <TableCell>{new Date(v.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="space-x-2">
                    <Button size="sm" variant="outline" onClick={() => openEdit(v)}><Pencil className="h-3 w-3 mr-1" /> Edit</Button>
                    <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(v.id)}><Trash2 className="h-3 w-3 mr-1" /> Delete</Button>
                  </TableCell>
                </TableRow>
              ))}
              {!filtered.length && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">{loading ? 'Loading videos…' : 'No videos found'}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if(!o){ setEditing(null); setForm(defaultForm);} }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Video' : 'New Video'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Title</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div>
                <Label>Visibility</Label>
                <Select value={form.visibility} onValueChange={(v: any) => setForm({ ...form, visibility: v })}>
                  <SelectTrigger><SelectValue placeholder="Visibility" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="unlisted">Unlisted</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                    <SelectItem value="school">School-only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {form.visibility === 'school' && (
              <div>
                <Label>School</Label>
                <Select value={form.school_id || 'none'} onValueChange={(v: string) => setForm({ ...form, school_id: v === 'none' ? null : v })}>
                  <SelectTrigger><SelectValue placeholder="Select school" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select school</SelectItem>
                    {schools.map((s: any) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g., Sign Language" />
              </div>
              <div>
                <Label>Difficulty</Label>
                <Select value={form.difficulty_level} onValueChange={(v: any) => setForm({ ...form, difficulty_level: v })}>
                  <SelectTrigger><SelectValue placeholder="Difficulty" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Tags (comma separated)</Label>
              <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="e.g., accessibility, BSL" />
            </div>
            <div>
              <Label>YouTube URL</Label>
              <Input value={form.external_url} onChange={(e) => setForm({ ...form, external_url: e.target.value })} placeholder="https://www.youtube.com/watch?v=..." />
              <p className="text-xs text-muted-foreground mt-1">Or upload your own video file below.</p>
            </div>
            <div>
              <Label>Upload Video File</Label>
              <Input type="file" accept="video/*" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
              {selectedFile && (
                <p className="text-xs text-muted-foreground mt-1">Selected: {selectedFile.name}</p>
              )}
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setOpen(false); setEditing(null); }}>Cancel</Button>
              <Button onClick={onSubmit}>{editing ? 'Save Changes' : 'Create Video'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VideoManagementPage;

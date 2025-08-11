
-- Speed up filtering by video_id and time windows
create index if not exists video_views_video_id_idx on public.video_views (video_id);
create index if not exists video_views_video_started_idx on public.video_views (video_id, started_at desc);

-- Speed up completion rate queries
create index if not exists video_views_video_completed_true_idx on public.video_views (video_id) where completed = true;

-- Speed up unique viewer calculations and joins
create index if not exists video_views_session_idx on public.video_views (session_id);
create index if not exists video_views_user_idx on public.video_views (user_id);

-- Speed up source breakdowns
create index if not exists video_views_video_source_idx on public.video_views (video_id, source);

-- Optional: faster filtering by uploader in /videos/manage
create index if not exists video_materials_uploaded_by_idx on public.video_materials (uploaded_by);

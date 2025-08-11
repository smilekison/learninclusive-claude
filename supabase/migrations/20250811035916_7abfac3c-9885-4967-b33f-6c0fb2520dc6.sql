-- Video analytics schema
-- 1) Table: video_views
CREATE TABLE IF NOT EXISTS public.video_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid NOT NULL REFERENCES public.video_materials(id) ON DELETE CASCADE,
  user_id uuid NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  session_id text NULL,
  source text NULL,          -- homepage, details, shared_link, etc.
  device text NULL,          -- web, mobile, screen_reader, etc. (client-reported)
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz NULL,
  watch_seconds integer NOT NULL DEFAULT 0,
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.video_views ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_video_views_video_id ON public.video_views(video_id);
CREATE INDEX IF NOT EXISTS idx_video_views_user_id ON public.video_views(user_id);
CREATE INDEX IF NOT EXISTS idx_video_views_created_at ON public.video_views(created_at);

-- Update timestamp trigger
DO $$ BEGIN
  CREATE TRIGGER trg_video_views_updated_at
  BEFORE UPDATE ON public.video_views
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- RLS Policies for video_views
DROP POLICY IF EXISTS "Anonymous can insert anonymous video views" ON public.video_views;
CREATE POLICY "Anonymous can insert anonymous video views"
ON public.video_views
FOR INSERT
WITH CHECK (auth.uid() IS NULL AND user_id IS NULL);

DROP POLICY IF EXISTS "Users can insert their own video views" ON public.video_views;
CREATE POLICY "Users can insert their own video views"
ON public.video_views
FOR INSERT
WITH CHECK (user_id IN (SELECT profiles.id FROM public.profiles WHERE profiles.user_id = auth.uid()));

DROP POLICY IF EXISTS "Principals can manage all video views" ON public.video_views;
CREATE POLICY "Principals can manage all video views"
ON public.video_views
FOR ALL
USING (public.is_principal())
WITH CHECK (public.is_principal());

DROP POLICY IF EXISTS "Teachers can view views for their videos" ON public.video_views;
CREATE POLICY "Teachers can view views for their videos"
ON public.video_views
FOR SELECT
USING (
  video_id IN (
    SELECT vm.id
    FROM public.video_materials vm
    JOIN public.profiles p ON vm.uploaded_by = p.id
    WHERE p.user_id = auth.uid() AND p.role = 'teacher'
  )
);

DROP POLICY IF EXISTS "Users can view their own video views" ON public.video_views;
CREATE POLICY "Users can view their own video views"
ON public.video_views
FOR SELECT
USING (user_id IN (SELECT profiles.id FROM public.profiles WHERE profiles.user_id = auth.uid()));


-- 2) Table: video_likes
CREATE TABLE IF NOT EXISTS public.video_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid NOT NULL REFERENCES public.video_materials(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  liked boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_video_likes UNIQUE (video_id, user_id)
);

ALTER TABLE public.video_likes ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_video_likes_video_id ON public.video_likes(video_id);
CREATE INDEX IF NOT EXISTS idx_video_likes_user_id ON public.video_likes(user_id);

DROP POLICY IF EXISTS "Users can manage their own likes" ON public.video_likes;
CREATE POLICY "Users can manage their own likes"
ON public.video_likes
FOR ALL
USING (user_id IN (SELECT profiles.id FROM public.profiles WHERE profiles.user_id = auth.uid()))
WITH CHECK (user_id IN (SELECT profiles.id FROM public.profiles WHERE profiles.user_id = auth.uid()));

DROP POLICY IF EXISTS "Principals can view all likes" ON public.video_likes;
CREATE POLICY "Principals can view all likes"
ON public.video_likes
FOR SELECT
USING (public.is_principal());

DROP POLICY IF EXISTS "Teachers can view likes for their videos" ON public.video_likes;
CREATE POLICY "Teachers can view likes for their videos"
ON public.video_likes
FOR SELECT
USING (
  video_id IN (
    SELECT vm.id
    FROM public.video_materials vm
    JOIN public.profiles p ON vm.uploaded_by = p.id
    WHERE p.user_id = auth.uid() AND p.role = 'teacher'
  )
);

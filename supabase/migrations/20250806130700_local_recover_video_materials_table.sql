-- Local-dev-only recovery: `public.video_materials` is referenced by migrations
-- starting 2025-08-06, but no CREATE TABLE IF NOT EXISTS for it exists anywhere in this
-- migration history until 2025-08-27 (20250827103355), which itself only
-- defines a narrower column set than what the intervening ~3 weeks of
-- migrations already assume (tags, category, difficulty_level, transcript_text,
-- visibility, external_url, school_id, lesson_id, etc.). This means the table
-- was originally created out-of-band (e.g. via the Supabase dashboard) on the
-- hosted project, never captured as its own migration.
--
-- This recreates a superset schema (columns gathered from every later
-- ALTER TABLE/INSERT/policy referencing this table) so the rest of the
-- migration history — which only ever ADDs columns/constraints
-- IF NOT EXISTS — can replay cleanly against a fresh local database.
CREATE TABLE IF NOT EXISTS public.video_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  file_path text,
  file_url text,
  thumbnail_path text,
  duration integer,
  duration_seconds integer,
  video_type text DEFAULT 'custom',
  youtube_video_id text,
  transcript_text text,
  tags text[] DEFAULT '{}',
  category text,
  difficulty_level text,
  subject_id uuid REFERENCES public.subjects(id) ON DELETE SET NULL,
  lesson_id uuid,
  uploaded_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  school_id uuid REFERENCES public.schools(id) ON DELETE SET NULL,
  captions_available boolean DEFAULT false,
  sign_language_available boolean DEFAULT false,
  sign_language_video_path text,
  accessibility_features jsonb DEFAULT '{}',
  visibility text NOT NULL DEFAULT 'private',
  external_url text,
  is_active boolean DEFAULT true,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.video_materials ENABLE ROW LEVEL SECURITY;

-- Same story for public.video_progress: referenced from 2025-08-06 onward,
-- dropped again on 2025-08-11 (20250811020816) once video tracking moved
-- elsewhere, but never created by any migration. Recreate minimally so the
-- intervening policies/constraints/indexes can apply, then get dropped.
CREATE TABLE IF NOT EXISTS public.video_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid REFERENCES public.video_materials(id) ON DELETE CASCADE,
  student_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  progress_seconds integer DEFAULT 0,
  completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.video_progress ENABLE ROW LEVEL SECURITY;

-- Local-dev fix: the video_materials recovery table (20250806130700) was a
-- best-effort superset schema reconstructed before the real column list was
-- known. The frontend (VideoManagementPage.tsx) actually inserts/updates a
-- `video_format` column ('mp4' | 'youtube') that recovery migration didn't
-- include, causing "Could not find the 'video_format' column ... in the
-- schema cache" from PostgREST. Add it and the other real columns confirmed
-- present in src/integrations/supabase/types.ts but missing locally.
ALTER TABLE public.video_materials ADD COLUMN IF NOT EXISTS video_format text;
ALTER TABLE public.video_materials ADD COLUMN IF NOT EXISTS audio_description_path text;
ALTER TABLE public.video_materials ADD COLUMN IF NOT EXISTS captions_path text;
ALTER TABLE public.video_materials ADD COLUMN IF NOT EXISTS resolution text;
ALTER TABLE public.video_materials ADD COLUMN IF NOT EXISTS file_size bigint;

-- file_path is NOT NULL in the real schema (used for both uploaded files and
-- YouTube references, e.g. 'youtube:<id>'); the recovery table left it
-- nullable. Backfill any existing NULLs before tightening the constraint.
UPDATE public.video_materials SET file_path = '' WHERE file_path IS NULL;
ALTER TABLE public.video_materials ALTER COLUMN file_path SET NOT NULL;
ALTER TABLE public.video_materials ALTER COLUMN file_path SET DEFAULT '';

-- Local-dev schema parity pass: diffed the local database (information_schema)
-- against the real hosted schema (src/integrations/supabase/types.ts, which
-- is generated from the live project) and against actual frontend usage
-- (grep for .from(...)/.rpc(...) calls). Findings below; nothing here is
-- guesswork — each change is backed by that diff.

-- 1) MISSING COLUMN: student_enrollments.created_at exists on the real
-- schema but was absent locally (the local table was created before a
-- later ALTER that only ever happened out-of-band on the hosted project).
ALTER TABLE public.student_enrollments ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

-- 2) MISSING FUNCTION: get_student_assignments exists in the real schema's
-- RPC list but was never defined locally. Not currently called anywhere in
-- src/ (dead capability on the hosted project too, as far as the frontend
-- is concerned), but reconstructed here for schema parity.
CREATE OR REPLACE FUNCTION public.get_student_assignments(student_profile_id uuid)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  subject_id uuid,
  due_date timestamptz,
  max_score numeric,
  is_active boolean,
  created_at timestamptz,
  updated_at timestamptz,
  subject json,
  submissions json
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    a.id, a.title, a.description, a.subject_id, a.due_date, a.max_score,
    a.is_active, a.created_at, a.updated_at,
    to_json(s.*) AS subject,
    COALESCE(
      (SELECT json_agg(sub.*) FROM public.assignment_submissions sub
       WHERE sub.assignment_id = a.id AND sub.student_id = student_profile_id),
      '[]'::json
    ) AS submissions
  FROM public.assignments a
  JOIN public.subjects s ON a.subject_id = s.id
  WHERE a.is_active = true
    AND s.class_id IN (
      SELECT se.class_id FROM public.student_enrollments se WHERE se.student_id = student_profile_id
    );
$$;

-- 3) DEAD TABLES: these 4 tables exist locally from early/superseded
-- migration attempts but are absent from the real hosted schema and
-- unreferenced anywhere in src/ (grep-verified). Each has a real
-- replacement that IS part of the shipped schema:
--   accessibility_audits        -> accessibility_audit_log
--   assignment_classes          -> (multi-class assignments never shipped)
--   parent_children              -> parent_student_relationships
--   student_subject_enrollments -> subject_enrollment_requests
DROP TABLE IF EXISTS public.accessibility_audits CASCADE;
DROP TABLE IF EXISTS public.assignment_classes CASCADE;
DROP TABLE IF EXISTS public.parent_children CASCADE;
DROP TABLE IF EXISTS public.student_subject_enrollments CASCADE;

-- 4) DEAD COLUMNS on video_materials: leftovers from the hand-reconstructed
-- recovery migration (20250806130700) before the real column list
-- (confirmed via types.ts) was known. Grep-verified unused in src/.
ALTER TABLE public.video_materials DROP COLUMN IF EXISTS file_url;
ALTER TABLE public.video_materials DROP COLUMN IF EXISTS duration_seconds;
ALTER TABLE public.video_materials DROP COLUMN IF EXISTS video_type;
ALTER TABLE public.video_materials DROP COLUMN IF EXISTS youtube_video_id;
ALTER TABLE public.video_materials DROP COLUMN IF EXISTS captions_available;
ALTER TABLE public.video_materials DROP COLUMN IF EXISTS sign_language_available;
ALTER TABLE public.video_materials DROP COLUMN IF EXISTS accessibility_features;
ALTER TABLE public.video_materials DROP COLUMN IF EXISTS metadata;
-- is_active is NOT dropped: several RLS policies (e.g. "Students can view
-- videos for their enrolled subjects") filter on it, even though no
-- frontend query selects it directly. It's real, just RLS-internal.

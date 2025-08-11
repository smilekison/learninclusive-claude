-- Add visibility and external source support to video_materials
ALTER TABLE public.video_materials
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'private',
  ADD COLUMN IF NOT EXISTS external_url text,
  ADD COLUMN IF NOT EXISTS school_id uuid REFERENCES public.schools(id);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_video_materials_visibility ON public.video_materials (visibility);
CREATE INDEX IF NOT EXISTS idx_video_materials_school_id ON public.video_materials (school_id);

-- Function to check if current user belongs to a school (principal, teacher with class, or student enrolled)
CREATE OR REPLACE FUNCTION public.is_user_in_school(target_school_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO public
AS $$
  WITH me AS (
    SELECT id, role FROM public.profiles WHERE user_id = auth.uid()
  )
  SELECT
    -- principal of the school
    EXISTS (
      SELECT 1 FROM public.schools s, me
      WHERE s.id = target_school_id AND s.principal_id = me.id
    )
    OR
    -- teacher with a class in the school
    EXISTS (
      SELECT 1
      FROM public.classes c, me
      WHERE c.school_id = target_school_id AND c.teacher_id = me.id
    )
    OR
    -- student enrolled in a class in the school
    EXISTS (
      SELECT 1
      FROM public.student_enrollments se
      JOIN public.classes c ON c.id = se.class_id
      JOIN me ON me.id = se.student_id
      WHERE c.school_id = target_school_id
    );
$$;

-- Replace old public policy with visibility-based access
DROP POLICY IF EXISTS "Public access to demo videos" ON public.video_materials;

CREATE POLICY "Public can view public and unlisted videos"
ON public.video_materials
FOR SELECT
USING (visibility IN ('public','unlisted'));

CREATE POLICY "Users can view school videos in their school"
ON public.video_materials
FOR SELECT
USING (
  visibility = 'school' AND school_id IS NOT NULL AND public.is_user_in_school(school_id)
);

CREATE POLICY "Uploader can view their private videos"
ON public.video_materials
FOR SELECT
USING (
  (visibility = 'private' AND uploaded_by IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()))
  OR is_principal()
);

-- Ensure unique, auto-generated invite codes for classes and subjects
-- 1) Backfill and deduplicate existing codes

-- For classes: ensure non-null, unique invite_code
WITH ranked AS (
  SELECT id, invite_code,
         ROW_NUMBER() OVER (PARTITION BY invite_code ORDER BY id) AS rn
  FROM public.classes
)
UPDATE public.classes c
SET invite_code = public.generate_unique_code('classes', 'invite_code', 8)
FROM ranked r
WHERE c.id = r.id
  AND (c.invite_code IS NULL OR c.invite_code = '' OR r.rn > 1);

-- For subjects: ensure non-null, unique invitation_code
WITH ranked_s AS (
  SELECT id, invitation_code,
         ROW_NUMBER() OVER (PARTITION BY invitation_code ORDER BY id) AS rn
  FROM public.subjects
)
UPDATE public.subjects s
SET invitation_code = public.generate_unique_code('subjects', 'invitation_code', 8)
FROM ranked_s r
WHERE s.id = r.id
  AND (s.invitation_code IS NULL OR s.invitation_code = '' OR r.rn > 1);

-- 2) Add unique constraints (idempotent-safe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'classes_invite_code_key'
  ) THEN
    ALTER TABLE public.classes
    ADD CONSTRAINT classes_invite_code_key UNIQUE (invite_code);
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'subjects_invitation_code_key'
  ) THEN
    ALTER TABLE public.subjects
    ADD CONSTRAINT subjects_invitation_code_key UNIQUE (invitation_code);
  END IF;
END$$;

-- 3) Create triggers to ensure a unique code is set on insert
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_classes_invite_code'
  ) THEN
    CREATE TRIGGER trg_classes_invite_code
    BEFORE INSERT ON public.classes
    FOR EACH ROW
    EXECUTE FUNCTION public.ensure_class_invite_code();
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_subjects_invitation_code'
  ) THEN
    CREATE TRIGGER trg_subjects_invitation_code
    BEFORE INSERT ON public.subjects
    FOR EACH ROW
    EXECUTE FUNCTION public.ensure_subject_invitation_code();
  END IF;
END$$;

-- 4) RPC to regenerate a subject invitation code securely
CREATE OR REPLACE FUNCTION public.regen_subject_invitation_code(subject_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  requester_profile_id uuid;
  teacher_profile_id uuid;
  new_code text;
BEGIN
  requester_profile_id := public.get_user_profile_id();

  IF requester_profile_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- principals always allowed
  IF NOT public.is_principal() THEN
    -- Ensure requester is the teacher of the subject's class
    SELECT c.teacher_id INTO teacher_profile_id
    FROM public.subjects s
    JOIN public.classes c ON s.class_id = c.id
    WHERE s.id = subject_id;

    IF teacher_profile_id IS NULL OR teacher_profile_id <> requester_profile_id THEN
      RAISE EXCEPTION 'Forbidden';
    END IF;
  END IF;

  new_code := public.generate_unique_code('subjects', 'invitation_code', 8);
  UPDATE public.subjects 
  SET invitation_code = new_code, updated_at = now()
  WHERE id = subject_id;

  RETURN new_code;
END;
$$;

-- Allow authenticated users to execute (RLS enforced in function body)
GRANT EXECUTE ON FUNCTION public.regen_subject_invitation_code(uuid) TO authenticated;
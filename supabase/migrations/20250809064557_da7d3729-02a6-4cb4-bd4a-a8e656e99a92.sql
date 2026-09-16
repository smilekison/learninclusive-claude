-- Ensure unique, auto-generated invite codes for subjects
-- (The equivalent classes.invite_code effort in this migration never shipped
-- — the final schema has no such column on public.classes, so that part is
-- omitted here rather than erroring on a nonexistent column.)

-- Local-dev-only recovery: public.generate_unique_code(table, column, len) is
-- called throughout this and later migrations but is never defined by any
-- migration — it exists on the hosted project only because it was created
-- out-of-band (same gap pattern as the video_materials/video_progress
-- tables). Reconstructed here from its call sites. public.generate_code()
-- (the character-generation helper it would naturally delegate to) isn't
-- defined until 20250817082737 either, so the char-picking loop is inlined
-- rather than depending on it.
CREATE OR REPLACE FUNCTION public.generate_unique_code(table_name text, column_name text, code_len integer DEFAULT 8)
RETURNS text
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  candidate text;
  code_exists boolean;
  i int;
  idx int;
BEGIN
  LOOP
    candidate := '';
    i := 0;
    WHILE i < code_len LOOP
      idx := 1 + floor(random() * length(chars))::int;
      candidate := candidate || substr(chars, idx, 1);
      i := i + 1;
    END LOOP;
    EXECUTE format('SELECT EXISTS (SELECT 1 FROM %I WHERE %I = $1)', table_name, column_name)
      INTO code_exists
      USING candidate;
    EXIT WHEN NOT code_exists;
  END LOOP;
  RETURN candidate;
END;
$function$;

-- Also referenced below before its "real" definition (20250817082737);
-- define it now so the trigger created in step 3 has something to call.
CREATE OR REPLACE FUNCTION public.ensure_subject_invitation_code()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.invitation_code IS NULL OR NEW.invitation_code = '' THEN
    NEW.invitation_code := public.generate_unique_code('subjects', 'invitation_code', 8);
  END IF;
  RETURN NEW;
END;
$function$;

-- 1) Backfill and deduplicate existing codes

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
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_subjects_invitation_code'
  ) THEN
    DROP TRIGGER IF EXISTS trg_subjects_invitation_code ON subjects;
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
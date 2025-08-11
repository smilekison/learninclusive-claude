-- Align association table column name with types: rename code -> invitation_code
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'subject_invitation_codes' AND column_name = 'code'
  ) THEN
    ALTER TABLE public.subject_invitation_codes RENAME COLUMN code TO invitation_code;
  END IF;
END$$;

-- Recreate unique index on active invitation_code (drop old if exists)
DROP INDEX IF EXISTS uniq_active_invitation_code;
CREATE UNIQUE INDEX IF NOT EXISTS uniq_active_invitation_code
ON public.subject_invitation_codes(invitation_code)
WHERE is_active = true;

-- 1) Trigger to auto-insert association row after subject insert
CREATE OR REPLACE FUNCTION public.after_subject_insert_create_inv_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Insert current subject.invitation_code as active code in association table
  INSERT INTO public.subject_invitation_codes (subject_id, invitation_code, created_by, is_active)
  VALUES (NEW.id, NEW.invitation_code, public.get_user_profile_id(), true)
  ON CONFLICT (subject_id) WHERE is_active = true DO NOTHING; -- guard in case of duplicate trigger firing
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_after_subject_insert_create_inv_code ON public.subjects;
CREATE TRIGGER trg_after_subject_insert_create_inv_code
AFTER INSERT ON public.subjects
FOR EACH ROW EXECUTE FUNCTION public.after_subject_insert_create_inv_code();

-- 2) Enhance regen_subject_invitation_code to rotate association table entries
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

  IF NOT public.is_principal() THEN
    SELECT c.teacher_id INTO teacher_profile_id
    FROM public.subjects s
    JOIN public.classes c ON s.class_id = c.id
    WHERE s.id = subject_id;

    IF teacher_profile_id IS NULL OR teacher_profile_id <> requester_profile_id THEN
      RAISE EXCEPTION 'Forbidden';
    END IF;
  END IF;

  new_code := public.generate_unique_code('subjects', 'invitation_code', 8);

  -- Update subject with new code
  UPDATE public.subjects 
  SET invitation_code = new_code, updated_at = now()
  WHERE id = subject_id;

  -- Deactivate previous active code(s) and insert new active row
  UPDATE public.subject_invitation_codes
  SET is_active = false
  WHERE subject_id = subject_id AND is_active = true;

  INSERT INTO public.subject_invitation_codes (subject_id, invitation_code, created_by, is_active)
  VALUES (subject_id, new_code, requester_profile_id, true);

  RETURN new_code;
END;
$$;

-- 3) Update request_subject_enrollment RPC to check association table using invitation_code column
CREATE OR REPLACE FUNCTION public.request_subject_enrollment(invitation_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_student_id uuid;
  v_role text;
  v_subject_id uuid;
  v_class_id uuid;
  v_teacher_profile_id uuid;
  v_existing_request_id uuid;
  v_enrolled boolean;
  v_new_request_id uuid;
  v_subject_name text;
BEGIN
  v_role := public.get_user_role();
  IF v_role IS DISTINCT FROM 'student' THEN
    RAISE EXCEPTION 'Only students can request subject enrollment';
  END IF;

  v_student_id := public.get_user_profile_id();
  IF v_student_id IS NULL THEN
    RAISE EXCEPTION 'Profile not found for current user';
  END IF;

  SELECT s.id, s.class_id, s.name
  INTO v_subject_id, v_class_id, v_subject_name
  FROM public.subject_invitation_codes sic
  JOIN public.subjects s ON s.id = sic.subject_id
  WHERE sic.invitation_code = invitation_code AND sic.is_active = true AND s.is_active = true
  LIMIT 1;

  IF v_subject_id IS NULL THEN
    SELECT s.id, s.class_id, s.name
    INTO v_subject_id, v_class_id, v_subject_name
    FROM public.subjects s
    WHERE s.invitation_code = invitation_code AND s.is_active = true
    LIMIT 1;
  END IF;

  IF v_subject_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or inactive invitation code';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.student_enrollments se
    WHERE se.student_id = v_student_id AND se.class_id = v_class_id
  ) INTO v_enrolled;

  IF v_enrolled THEN
    RAISE EXCEPTION 'You are already enrolled in this class';
  END IF;

  SELECT ser.id INTO v_existing_request_id
  FROM public.subject_enrollment_requests ser
  WHERE ser.student_id = v_student_id
    AND ser.subject_id = v_subject_id
    AND ser.status = 'pending'
  LIMIT 1;

  IF v_existing_request_id IS NOT NULL THEN
    RAISE EXCEPTION 'You already have a pending request for this subject';
  END IF;

  INSERT INTO public.subject_enrollment_requests (student_id, subject_id, invitation_code)
  VALUES (v_student_id, v_subject_id, invitation_code)
  RETURNING id INTO v_new_request_id;

  SELECT c.teacher_id INTO v_teacher_profile_id
  FROM public.classes c
  WHERE c.id = v_class_id;

  IF v_teacher_profile_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (
      v_teacher_profile_id,
      'New Enrollment Request',
      'A student requested to join subject: ' || v_subject_name,
      'general'
    );
  END IF;

  RETURN jsonb_build_object(
    'request_id', v_new_request_id,
    'subject_id', v_subject_id,
    'subject_name', v_subject_name,
    'status', 'pending'
  );
END;
$$;

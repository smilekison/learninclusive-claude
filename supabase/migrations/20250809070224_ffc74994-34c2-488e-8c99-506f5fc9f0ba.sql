-- 1) Drop class invite code and related generator (keep function but it's unused)
ALTER TABLE public.classes DROP COLUMN IF EXISTS invite_code;

-- 2) Create association table for subject invitation codes (history + active flag)
CREATE TABLE IF NOT EXISTS public.subject_invitation_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid NOT NULL,
  code text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NULL,
  CONSTRAINT fk_subject_inv_codes_subject
    FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE
);

-- Ensure only one active code per subject
CREATE UNIQUE INDEX IF NOT EXISTS uniq_active_code_per_subject
ON public.subject_invitation_codes(subject_id)
WHERE is_active = true;

-- Unique codes globally when active
CREATE UNIQUE INDEX IF NOT EXISTS uniq_active_invitation_code
ON public.subject_invitation_codes(code)
WHERE is_active = true;

-- 3) RLS for subject_invitation_codes
ALTER TABLE public.subject_invitation_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Teachers manage their subject invitation codes" ON public.subject_invitation_codes;
CREATE POLICY "Teachers manage their subject invitation codes"
ON public.subject_invitation_codes
FOR ALL
USING (
  subject_id IN (
    SELECT s.id FROM public.subjects s
    JOIN public.classes c ON s.class_id = c.id
    JOIN public.profiles p ON c.teacher_id = p.id
    WHERE p.user_id = auth.uid() AND p.role = 'teacher'
  ) OR public.is_principal()
)
WITH CHECK (
  subject_id IN (
    SELECT s.id FROM public.subjects s
    JOIN public.classes c ON s.class_id = c.id
    JOIN public.profiles p ON c.teacher_id = p.id
    WHERE p.user_id = auth.uid() AND p.role = 'teacher'
  ) OR public.is_principal()
);

-- Students can SELECT to validate codes (read-only)
DROP POLICY IF EXISTS "Students can read active subject codes" ON public.subject_invitation_codes;
CREATE POLICY "Students can read active subject codes"
ON public.subject_invitation_codes
FOR SELECT
USING (
  is_active = true
);

-- 4) Backfill current subjects.invitation_code into association table if table new/empty
INSERT INTO public.subject_invitation_codes (subject_id, code, created_by)
SELECT s.id, s.invitation_code, NULL
FROM public.subjects s
WHERE NOT EXISTS (
  SELECT 1 FROM public.subject_invitation_codes sic WHERE sic.subject_id = s.id AND sic.is_active = true
);

-- 5) Update RPC to optionally use association table first, then fallback to subjects.invitation_code
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

  -- Try via association table first (active codes)
  SELECT s.id, s.class_id, s.name
  INTO v_subject_id, v_class_id, v_subject_name
  FROM public.subject_invitation_codes sic
  JOIN public.subjects s ON s.id = sic.subject_id
  WHERE sic.code = invitation_code AND sic.is_active = true AND s.is_active = true
  LIMIT 1;

  -- Fallback to legacy column if not found
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

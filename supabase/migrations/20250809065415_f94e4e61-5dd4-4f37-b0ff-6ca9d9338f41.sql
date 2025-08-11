-- Create or update secure RPC for subject enrollment requests
CREATE OR REPLACE FUNCTION public.request_subject_enrollment(invitation_code text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  -- Ensure caller is a student
  v_role := public.get_user_role();
  IF v_role IS DISTINCT FROM 'student' THEN
    RAISE EXCEPTION 'Only students can request subject enrollment';
  END IF;

  v_student_id := public.get_user_profile_id();
  IF v_student_id IS NULL THEN
    RAISE EXCEPTION 'Profile not found for current user';
  END IF;

  -- Find active subject by invitation code
  SELECT s.id, s.class_id, s.name
  INTO v_subject_id, v_class_id, v_subject_name
  FROM public.subjects s
  WHERE s.invitation_code = invitation_code
    AND s.is_active = true
  LIMIT 1;

  IF v_subject_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or inactive invitation code';
  END IF;

  -- Check if already enrolled in subject's class
  SELECT EXISTS (
    SELECT 1 FROM public.student_enrollments se
    WHERE se.student_id = v_student_id
      AND se.class_id = v_class_id
  ) INTO v_enrolled;

  IF v_enrolled THEN
    RAISE EXCEPTION 'You are already enrolled in this class';
  END IF;

  -- Check existing pending request for this subject
  SELECT ser.id INTO v_existing_request_id
  FROM public.subject_enrollment_requests ser
  WHERE ser.student_id = v_student_id
    AND ser.subject_id = v_subject_id
    AND ser.status = 'pending'
  LIMIT 1;

  IF v_existing_request_id IS NOT NULL THEN
    RAISE EXCEPTION 'You already have a pending request for this subject';
  END IF;

  -- Insert request
  INSERT INTO public.subject_enrollment_requests (
    student_id, subject_id, invitation_code
  ) VALUES (
    v_student_id, v_subject_id, invitation_code
  ) RETURNING id INTO v_new_request_id;

  -- Notify the teacher
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
$function$;
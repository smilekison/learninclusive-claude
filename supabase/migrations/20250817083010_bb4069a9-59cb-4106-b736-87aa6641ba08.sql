-- Fix the final remaining functions that lack search_path security

CREATE OR REPLACE FUNCTION public.generate_unique_invitation_code()
RETURNS text
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
    new_code TEXT;
    code_exists BOOLEAN;
BEGIN
    LOOP
        -- Generate a random 8-character alphanumeric code
        new_code := upper(substring(md5(random()::text) from 1 for 8));
        
        -- Check if this code already exists
        SELECT EXISTS(SELECT 1 FROM subjects WHERE invitation_code = new_code) INTO code_exists;
        
        -- If code doesn't exist, return it
        IF NOT code_exists THEN
            RETURN new_code;
        END IF;
    END LOOP;
END;
$function$;

CREATE OR REPLACE FUNCTION public.request_subject_enrollment(invitation_code text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    subject_record RECORD;
    student_id UUID;
    existing_request_id UUID;
    new_request_id UUID;
BEGIN
    -- Get the authenticated user's student profile ID
    student_id := (auth.uid())::uuid;
    
    -- Check if user is authenticated
    IF student_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;
    
    -- Find the subject with this invitation code (should be unique now)
    SELECT s.id, s.name, s.class_id, c.name as class_name, c.teacher_id
    INTO subject_record
    FROM subjects s
    JOIN classes c ON s.class_id = c.id
    WHERE s.invitation_code = request_subject_enrollment.invitation_code
    AND s.is_active = true
    AND c.is_active = true;
    
    -- Check if subject exists
    IF subject_record.id IS NULL THEN
        RAISE EXCEPTION 'Invalid or expired invitation code';
    END IF;
    
    -- Check if student is already enrolled
    IF EXISTS (
        SELECT 1 FROM student_enrollments 
        WHERE student_id = request_subject_enrollment.student_id 
        AND class_id = subject_record.class_id
        AND status = 'approved'
    ) THEN
        RAISE EXCEPTION 'You are already enrolled in this class';
    END IF;
    
    -- Check if there's already a pending request
    SELECT id INTO existing_request_id
    FROM student_enrollments
    WHERE student_id = request_subject_enrollment.student_id
    AND class_id = subject_record.class_id
    AND status = 'pending';
    
    IF existing_request_id IS NOT NULL THEN
        RAISE EXCEPTION 'You already have a pending enrollment request for this class';
    END IF;
    
    -- Create new enrollment request
    INSERT INTO student_enrollments (student_id, class_id, status, created_at)
    VALUES (student_id, subject_record.class_id, 'pending', now())
    RETURNING id INTO new_request_id;
    
    RETURN 'Enrollment request submitted successfully for ' || subject_record.name;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION '%', SQLERRM;
END;
$function$;

CREATE OR REPLACE FUNCTION public.after_subject_insert_create_inv_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Insert current subject.invitation_code as active code in association table
  INSERT INTO subject_invitation_codes (subject_id, invitation_code, created_by, is_active)
  VALUES (NEW.id, NEW.invitation_code, get_user_profile_id(), true);
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.regen_subject_invitation_code(subject_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  requester_profile_id uuid;
  teacher_profile_id uuid;
  new_code text;
BEGIN
  requester_profile_id := get_user_profile_id();
  IF requester_profile_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF NOT is_principal() THEN
    SELECT c.teacher_id INTO teacher_profile_id
    FROM subjects s
    JOIN classes c ON s.class_id = c.id
    WHERE s.id = subject_id;

    IF teacher_profile_id IS NULL OR teacher_profile_id <> requester_profile_id THEN
      RAISE EXCEPTION 'Forbidden';
    END IF;
  END IF;

  new_code := generate_unique_code('subjects', 'invitation_code', 8);

  -- Update subject with new code
  UPDATE subjects 
  SET invitation_code = new_code, updated_at = now()
  WHERE id = subject_id;

  -- Deactivate previous active code(s) and insert new active row
  UPDATE subject_invitation_codes
  SET is_active = false
  WHERE subject_id = subject_id AND is_active = true;

  INSERT INTO subject_invitation_codes (subject_id, invitation_code, created_by, is_active)
  VALUES (subject_id, new_code, requester_profile_id, true);

  RETURN new_code;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_demo_user(user_email text, user_password text, user_first_name text, user_last_name text, user_role text, user_school_name text DEFAULT NULL::text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $function$
DECLARE
  user_id UUID;
BEGIN
  -- Generate a UUID for the user
  user_id := gen_random_uuid();
  
  -- Insert into auth.users table (simulating Supabase auth)
  -- Note: This is for demo purposes only. In real apps, use supabase.auth.signUp()
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000'::uuid,
    user_id,
    'authenticated',
    'authenticated',
    user_email,
    '$2a$10$demo.password.hash.for.testing.purposes.only',
    NOW(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    jsonb_build_object(
      'first_name', user_first_name,
      'last_name', user_last_name,
      'role', user_role,
      'school_name', user_school_name
    ),
    FALSE,
    NOW(),
    NOW()
  );

  RETURN user_id;
END;
$function$;

-- Add final security documentation comments
COMMENT ON FUNCTION public.generate_unique_invitation_code IS 'Security hardened: Function search_path set to public schema only';
COMMENT ON FUNCTION public.request_subject_enrollment IS 'Security hardened: Function search_path set to public schema only';
COMMENT ON FUNCTION public.after_subject_insert_create_inv_code IS 'Security hardened: Function search_path set to public schema only';
COMMENT ON FUNCTION public.regen_subject_invitation_code IS 'Security hardened: Function search_path set to public schema only';
COMMENT ON FUNCTION public.create_demo_user IS 'Security hardened: Function search_path set to public and auth schemas only';
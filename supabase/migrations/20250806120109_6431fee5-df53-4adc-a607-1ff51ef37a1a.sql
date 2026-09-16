-- Fix gen_salt error by removing password hashing from demo function
DROP FUNCTION IF EXISTS public.create_demo_user(text, text, text, text, text, text);

CREATE OR REPLACE FUNCTION public.create_demo_user(
  user_email text, 
  user_password text, 
  user_first_name text, 
  user_last_name text, 
  user_role text, 
  user_school_name text DEFAULT NULL::text
)
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
    invited_at,
    confirmation_token,
    confirmation_sent_at,
    recovery_token,
    recovery_sent_at,
    email_change_token_new,
    email_change,
    email_change_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    phone,
    phone_confirmed_at,
    phone_change,
    phone_change_token,
    phone_change_sent_at,
    email_change_token_current,
    email_change_confirm_status,
    banned_until,
    reauthentication_token,
    reauthentication_sent_at,
    is_sso_user,
    deleted_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000'::uuid,
    user_id,
    'authenticated',
    'authenticated',
    user_email,
    '$2a$10$demo.password.hash.for.testing.purposes.only', -- Fixed demo hash
    NOW(),
    NULL,
    '',
    NULL,
    '',
    NULL,
    '',
    '',
    NULL,
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
    NOW(),
    NULL,
    NULL,
    '',
    '',
    NULL,
    '',
    0,
    NULL,
    '',
    NULL,
    FALSE,
    NULL
  );

  RETURN user_id;
END;
$function$;

-- Update RLS policies to fix class visibility and profile updates

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Teachers can view their assigned classes" ON public.classes;
DROP POLICY IF EXISTS "Students can view their enrolled classes" ON public.classes;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create better RLS policies for classes
DROP POLICY IF EXISTS "Teachers can view their assigned classes" ON public.classes;
CREATE POLICY "Teachers can view their assigned classes" 
ON public.classes 
FOR SELECT 
USING (
  teacher_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Students can view their enrolled classes" ON public.classes;
CREATE POLICY "Students can view their enrolled classes" 
ON public.classes 
FOR SELECT 
USING (
  id IN (
    SELECT se.class_id 
    FROM public.student_enrollments se
    JOIN public.profiles p ON se.student_id = p.id
    WHERE p.user_id = auth.uid()
  )
);

-- Fix profile update policy
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Add demo teachers
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, 
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  is_super_admin, created_at, updated_at
) VALUES 
  ('00000000-0000-0000-0000-000000000000'::uuid, gen_random_uuid(), 'authenticated', 'authenticated', 
   'teacher1@school.edu', '$2a$10$demo.password.hash.for.testing.purposes.only', NOW(),
   '{"provider": "email", "providers": ["email"]}'::jsonb,
   '{"first_name": "Sarah", "last_name": "Johnson", "role": "teacher"}'::jsonb,
   FALSE, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000000'::uuid, gen_random_uuid(), 'authenticated', 'authenticated',
   'teacher2@school.edu', '$2a$10$demo.password.hash.for.testing.purposes.only', NOW(),
   '{"provider": "email", "providers": ["email"]}'::jsonb,
   '{"first_name": "Michael", "last_name": "Davis", "role": "teacher"}'::jsonb,
   FALSE, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000000'::uuid, gen_random_uuid(), 'authenticated', 'authenticated',
   'teacher3@school.edu', '$2a$10$demo.password.hash.for.testing.purposes.only', NOW(),
   '{"provider": "email", "providers": ["email"]}'::jsonb,
   '{"first_name": "Emma", "last_name": "Wilson", "role": "teacher"}'::jsonb,
   FALSE, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000000'::uuid, gen_random_uuid(), 'authenticated', 'authenticated',
   'teacher4@school.edu', '$2a$10$demo.password.hash.for.testing.purposes.only', NOW(),
   '{"provider": "email", "providers": ["email"]}'::jsonb,
   '{"first_name": "James", "last_name": "Brown", "role": "teacher"}'::jsonb,
   FALSE, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000000'::uuid, gen_random_uuid(), 'authenticated', 'authenticated',
   'teacher5@school.edu', '$2a$10$demo.password.hash.for.testing.purposes.only', NOW(),
   '{"provider": "email", "providers": ["email"]}'::jsonb,
   '{"first_name": "Lisa", "last_name": "Garcia", "role": "teacher"}'::jsonb,
   FALSE, NOW(), NOW())
ON CONFLICT DO NOTHING;
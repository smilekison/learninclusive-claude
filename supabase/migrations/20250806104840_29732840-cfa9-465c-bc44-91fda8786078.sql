-- First, let's create demo auth users and their profiles
-- Note: In a real environment, these would be created through the signup process
-- For demo purposes, we'll create some sample users

-- Clear existing demo data first to avoid conflicts
DELETE FROM public.assignment_submissions WHERE student_id IN (
  SELECT id FROM public.profiles WHERE role = 'student'
);
DELETE FROM public.quiz_attempts WHERE student_id IN (
  SELECT id FROM public.profiles WHERE role = 'student'  
);
DELETE FROM public.student_enrollments WHERE student_id IN (
  SELECT id FROM public.profiles WHERE role = 'student'
);
DELETE FROM public.notifications WHERE user_id IN (
  SELECT id FROM public.profiles
);

-- Update classes to remove teacher assignments temporarily
UPDATE public.classes SET teacher_id = NULL;

-- Delete existing profiles (they will be recreated by the trigger when auth users are created)
DELETE FROM public.profiles;

-- Create a function to create demo users (this simulates the signup process)
CREATE OR REPLACE FUNCTION create_demo_user(
  user_email TEXT,
  user_password TEXT,
  user_first_name TEXT,
  user_last_name TEXT,
  user_role TEXT,
  user_school_name TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id UUID;
  profile_id UUID;
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
    '00000000-0000-0000-0000-000000000000',
    user_id,
    'authenticated',
    'authenticated',
    user_email,
    crypt(user_password, gen_salt('bf')),
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
    '{"provider": "email", "providers": ["email"]}',
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

  -- The profile will be created automatically by the handle_new_user trigger

  RETURN user_id;
END;
$$;

-- Create demo users
SELECT create_demo_user(
  'principal@riverside.edu',
  'demo123',
  'Sarah',
  'Johnson',
  'principal',
  'Riverside Academy'
);

SELECT create_demo_user(
  'teacher@riverside.edu', 
  'demo123',
  'Michael',
  'Chen',
  'teacher',
  NULL
);

SELECT create_demo_user(
  'student@riverside.edu',
  'demo123', 
  'Emma',
  'Davis',
  'student',
  NULL
);

-- Create additional students
SELECT create_demo_user(
  'alex.smith@riverside.edu',
  'demo123',
  'Alex',
  'Smith', 
  'student',
  NULL
);

SELECT create_demo_user(
  'maria.garcia@riverside.edu',
  'demo123',
  'Maria',
  'Garcia',
  'student', 
  NULL
);

-- Create additional teachers
SELECT create_demo_user(
  'lisa.brown@riverside.edu',
  'demo123',
  'Lisa',
  'Brown',
  'teacher',
  NULL
);

SELECT create_demo_user(
  'david.wilson@riverside.edu',
  'demo123',
  'David',
  'Wilson',
  'teacher',
  NULL
);
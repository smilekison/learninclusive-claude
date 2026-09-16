-- Fix gen_salt error and update RLS policies
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

-- Update RLS policies to fix class visibility and profile updates
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
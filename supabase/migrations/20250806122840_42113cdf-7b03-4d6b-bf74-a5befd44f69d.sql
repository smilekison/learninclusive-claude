-- Fix RLS infinite recursion by creating security definer functions
-- Update search_path for all functions to fix security warnings

-- 1. Fix existing functions with proper search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, first_name, last_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', 'User'),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', 'Name'),
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'student')
  )
        ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$function$;

-- 2. Fix create_demo_user function - remove gen_salt dependency
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

-- 3. Create helper functions to avoid RLS infinite recursion
CREATE OR REPLACE FUNCTION public.get_user_profile_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT id FROM public.profiles WHERE user_id = auth.uid();
$function$;

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$function$;

CREATE OR REPLACE FUNCTION public.is_principal()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'principal'
  );
$function$;

-- 4. Update RLS policies to use helper functions and avoid recursion

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Teachers can view their assigned classes" ON public.classes;
DROP POLICY IF EXISTS "Principals can manage all classes" ON public.classes;

-- Recreate fixed policies for classes
DROP POLICY IF EXISTS "Teachers can view their assigned classes" ON public.classes;
CREATE POLICY "Teachers can view their assigned classes"
ON public.classes
FOR SELECT
USING (teacher_id = get_user_profile_id());

DROP POLICY IF EXISTS "Principals can manage all classes" ON public.classes;
CREATE POLICY "Principals can manage all classes"
ON public.classes
FOR ALL
USING (get_user_role() = 'principal');

-- Fix other policies that might have issues
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (user_id = auth.uid());

-- Add missing foreign key constraints for better data integrity
DO $$ 
BEGIN
  -- Add foreign key from classes.teacher_id to profiles.id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'classes_teacher_id_fkey'
  ) THEN
    ALTER TABLE public.classes 
    ADD CONSTRAINT classes_teacher_id_fkey 
    FOREIGN KEY (teacher_id) REFERENCES public.profiles(id);
  END IF;
  
  -- Add foreign key from subjects.class_id to classes.id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'subjects_class_id_fkey'
  ) THEN
    ALTER TABLE public.subjects 
    ADD CONSTRAINT subjects_class_id_fkey 
    FOREIGN KEY (class_id) REFERENCES public.classes(id);
  END IF;
END $$;
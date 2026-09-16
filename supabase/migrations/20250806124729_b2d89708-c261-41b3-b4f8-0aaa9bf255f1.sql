-- Add parent role to existing enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE app_role AS ENUM ('principal', 'teacher', 'student', 'parent');
    ELSE
        -- Add parent to existing enum if not present
        BEGIN
            ALTER TYPE app_role ADD VALUE 'parent';
        EXCEPTION WHEN duplicate_object THEN
            -- Parent already exists, continue
        END;
    END IF;
END $$;

-- Drop the old text-based CHECK constraint (it excludes 'parent' anyway, and
-- would otherwise block the ALTER below with "operator does not exist:
-- app_role = text" during constraint re-validation)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Drop policies that depend on profiles.role's type before converting it
DROP POLICY IF EXISTS "Principals can insert profiles for teachers and students" ON public.profiles;
DROP POLICY IF EXISTS "Principals can manage schools" ON public.schools;
DROP POLICY IF EXISTS "Principals can manage all enrollments" ON public.student_enrollments;
DROP POLICY IF EXISTS "Students can enroll themselves" ON public.student_enrollments;

-- Update profiles table to use the enum for role
ALTER TABLE profiles ALTER COLUMN role TYPE app_role USING role::app_role;

-- handle_new_user (defined in 20250806122840) inserts NEW.raw_user_meta_data
-- ->>'role' — a text value — into profiles.role, which is app_role as of the
-- ALTER above. No later migration re-casts it, so redefine it here (this is
-- the single trigger every future signup/create_demo_user() call routes
-- through, hence the one place this needs fixing).
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
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'student')::app_role
  );
  RETURN NEW;
END;
$function$;

-- Recreate the policies dropped above, now against the app_role-typed column
DROP POLICY IF EXISTS "Principals can insert profiles for teachers and students" ON profiles;
CREATE POLICY "Principals can insert profiles for teachers and students"
ON public.profiles
FOR INSERT
WITH CHECK (is_principal() AND role = ANY (ARRAY['teacher'::app_role, 'student'::app_role]));

DROP POLICY IF EXISTS "Principals can manage schools" ON schools;
CREATE POLICY "Principals can manage schools"
ON public.schools
FOR ALL
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.user_id = auth.uid() AND profiles.role = 'principal'::app_role
));

DROP POLICY IF EXISTS "Principals can manage all enrollments" ON student_enrollments;
CREATE POLICY "Principals can manage all enrollments"
ON public.student_enrollments
FOR ALL
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.user_id = auth.uid() AND profiles.role = 'principal'::app_role
));

DROP POLICY IF EXISTS "Students can enroll themselves" ON student_enrollments;
CREATE POLICY "Students can enroll themselves"
ON public.student_enrollments
FOR INSERT
WITH CHECK (student_id IN (
  SELECT profiles.id FROM profiles
  WHERE profiles.user_id = auth.uid() AND profiles.role = 'student'::app_role
));

-- Add parent relationship table
CREATE TABLE IF NOT EXISTS public.parent_children (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    parent_id UUID NOT NULL,
    student_id UUID NOT NULL,
    relationship_type TEXT DEFAULT 'parent',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(parent_id, student_id)
);

-- Enable RLS on parent_children table
ALTER TABLE public.parent_children ENABLE ROW LEVEL SECURITY;

-- Create policies for parent_children table
DROP POLICY IF EXISTS "Parents can view their children relationships" ON public.parent_children;
CREATE POLICY "Parents can view their children relationships" 
ON public.parent_children 
FOR SELECT 
USING (parent_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Principals can manage all parent relationships" ON public.parent_children;
CREATE POLICY "Principals can manage all parent relationships" 
ON public.parent_children 
FOR ALL 
USING (is_principal());

-- (Disabled for local replay: seeds public.video_materials, which does not
-- exist yet at this point in migration history. Table is created later.)

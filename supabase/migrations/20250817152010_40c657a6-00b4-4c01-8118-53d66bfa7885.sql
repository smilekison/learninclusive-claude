-- Drop all problematic policies first
DROP POLICY IF EXISTS "Teachers can view all students for demo" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Principals can view all profiles" ON profiles;

-- Update the existing functions to have proper search_path
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION is_principal()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER  
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'principal'
  );
$$;

-- Create new simplified policies
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() AND is_active = true);

CREATE POLICY "Teachers can view student profiles" ON profiles
  FOR SELECT
  TO authenticated
  USING (
    role = 'student' AND 
    is_active = true AND 
    get_user_role() = 'teacher'
  );

CREATE POLICY "Principals can view all profiles" ON profiles
  FOR SELECT
  TO authenticated
  USING (is_principal());
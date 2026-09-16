-- Drop the problematic policy
DROP POLICY IF EXISTS "Teachers can view all students for demo" ON profiles;

-- Create security definer functions to avoid RLS recursion
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

-- Create simplified RLS policies that don't cause recursion
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Teachers can view student profiles" ON profiles;
CREATE POLICY "Teachers can view student profiles" ON profiles
  FOR SELECT
  USING (
    role = 'student' AND 
    is_active = true AND 
    get_user_role() = 'teacher'
  );

DROP POLICY IF EXISTS "Principals can view all profiles" ON profiles;
CREATE POLICY "Principals can view all profiles" ON profiles
  FOR SELECT
  USING (is_principal());

DROP POLICY IF EXISTS "Parents can view their children's profiles" ON profiles;
CREATE POLICY "Parents can view their children's profiles" ON profiles
  FOR SELECT
  USING (id = ANY (get_parent_student_ids_for_user()));
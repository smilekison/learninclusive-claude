-- Fix infinite recursion by replacing problematic parent policy with security definer function
-- First, create a security definer function to get parent relationships safely
CREATE OR REPLACE FUNCTION public.get_parent_student_ids_for_user()
RETURNS uuid[] AS $$
BEGIN
  -- This function runs with definer privileges to avoid RLS recursion
  RETURN (
    SELECT ARRAY_AGG(psr.student_id)
    FROM parent_student_relationships psr
    JOIN profiles parent_profile ON (psr.parent_id = parent_profile.id)
    WHERE parent_profile.user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop the problematic policy that causes recursion
DROP POLICY IF EXISTS "Parents can view their children's profiles" ON public.profiles;

-- Create a new policy using the security definer function
DROP POLICY IF EXISTS "Parents can view their children's profiles" ON public.profiles;
CREATE POLICY "Parents can view their children's profiles" 
ON public.profiles 
FOR SELECT 
USING (id = ANY(get_parent_student_ids_for_user()));

-- Also ensure we have proper grants
GRANT EXECUTE ON FUNCTION public.get_parent_student_ids_for_user() TO authenticated;
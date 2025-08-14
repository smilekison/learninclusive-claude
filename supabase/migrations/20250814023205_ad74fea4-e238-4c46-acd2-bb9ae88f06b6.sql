-- Fix infinite recursion in profiles RLS policies
-- Drop the problematic policy that's causing recursion
DROP POLICY IF EXISTS "Parents can view their children profiles" ON public.profiles;

-- Create a simpler, non-recursive policy for parents to view their children
CREATE POLICY "Parents can view their children profiles" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM public.parent_student_relationships psr 
    WHERE psr.parent_id = auth.uid() 
    AND psr.student_id = profiles.user_id
  )
);
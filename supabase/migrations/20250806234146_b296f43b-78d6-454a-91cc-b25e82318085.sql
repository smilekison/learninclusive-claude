-- Fix subjects RLS policies for teachers
-- Drop conflicting policies first
DROP POLICY IF EXISTS "Teachers can create subjects in any class for demo" ON public.subjects;
DROP POLICY IF EXISTS "Teachers can manage subjects in their classes" ON public.subjects;

-- Create a single comprehensive policy for teachers
CREATE POLICY "Teachers can manage subjects in any class for demo" 
ON public.subjects 
FOR ALL 
USING (get_user_role() = 'teacher')
WITH CHECK (get_user_role() = 'teacher');
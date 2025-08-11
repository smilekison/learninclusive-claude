-- Fix infinite recursion in classes table RLS policies

-- First, drop the problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Principals can manage all classes" ON public.classes;
DROP POLICY IF EXISTS "Teachers can view their assigned classes" ON public.classes;
DROP POLICY IF EXISTS "Students can view their enrolled classes" ON public.classes;

-- Create security definer functions to avoid recursion
CREATE OR REPLACE FUNCTION public.get_user_profile_id()
RETURNS UUID AS $$
  SELECT id FROM public.profiles WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Recreate classes policies without recursion
CREATE POLICY "Principals can manage all classes" 
ON public.classes 
FOR ALL 
USING (get_user_role() = 'principal');

CREATE POLICY "Teachers can view their assigned classes" 
ON public.classes 
FOR SELECT 
USING (teacher_id = get_user_profile_id());

CREATE POLICY "Students can view their enrolled classes" 
ON public.classes 
FOR SELECT 
USING (id IN (
  SELECT class_id FROM student_enrollments 
  WHERE student_id = get_user_profile_id()
));
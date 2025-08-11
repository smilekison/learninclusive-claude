-- Fix infinite recursion in classes RLS policies by using security definer functions

-- Drop the problematic policies that cause recursion
DROP POLICY IF EXISTS "Teachers can view all classes for demo" ON public.classes;
DROP POLICY IF EXISTS "Principals can manage all classes" ON public.classes;

-- Create new policies using existing security definer functions
CREATE POLICY "Teachers can view all classes for demo" 
ON public.classes 
FOR SELECT 
USING (get_user_role() = 'teacher');

CREATE POLICY "Principals can manage all classes" 
ON public.classes 
FOR ALL 
USING (is_principal());

-- Also ensure teachers can manage subjects in any class for demo purposes
DROP POLICY IF EXISTS "Teachers can create subjects in any class for demo" ON public.subjects;
CREATE POLICY "Teachers can create subjects in any class for demo" 
ON public.subjects 
FOR INSERT 
WITH CHECK (get_user_role() = 'teacher');

-- Allow teachers to view all classes for subject creation
CREATE POLICY "Teachers can view all classes for subjects" 
ON public.classes 
FOR SELECT 
USING (get_user_role() = 'teacher');

-- Ensure teachers can view all student enrollments for adding students
DROP POLICY IF EXISTS "Teachers can view enrollments in their classes" ON public.student_enrollments;
CREATE POLICY "Teachers can view all enrollments for demo" 
ON public.student_enrollments 
FOR SELECT 
USING (get_user_role() = 'teacher');

-- Allow teachers to create enrollments for any student in any class for demo
CREATE POLICY "Teachers can create enrollments for demo" 
ON public.student_enrollments 
FOR INSERT 
WITH CHECK (get_user_role() = 'teacher');
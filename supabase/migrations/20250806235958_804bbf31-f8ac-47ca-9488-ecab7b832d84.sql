-- Fix RLS policies for teachers to manage all subjects, assignments, and classes for demo

-- Drop existing conflicting policies for subjects
DROP POLICY IF EXISTS "Teachers can manage subjects in any class for demo" ON public.subjects;

-- Create comprehensive teacher policy for subjects
DROP POLICY IF EXISTS "Teachers can manage all subjects for demo" ON public.subjects;
CREATE POLICY "Teachers can manage all subjects for demo" 
ON public.subjects 
FOR ALL 
TO authenticated
USING (get_user_role() = 'teacher')
WITH CHECK (get_user_role() = 'teacher');

-- Drop existing conflicting policies for assignments  
DROP POLICY IF EXISTS "Teachers can manage assignments in their subjects" ON public.assignments;

-- Create comprehensive teacher policy for assignments
DROP POLICY IF EXISTS "Teachers can manage all assignments for demo" ON public.assignments;
CREATE POLICY "Teachers can manage all assignments for demo" 
ON public.assignments 
FOR ALL 
TO authenticated
USING (get_user_role() = 'teacher')
WITH CHECK (get_user_role() = 'teacher');

-- Drop existing restrictive policies for classes
DROP POLICY IF EXISTS "Teachers can view all classes for demo" ON public.classes;
DROP POLICY IF EXISTS "Teachers can view all classes for subjects" ON public.classes;

-- Create comprehensive teacher policy for classes
DROP POLICY IF EXISTS "Teachers can manage all classes for demo" ON public.classes;
CREATE POLICY "Teachers can manage all classes for demo" 
ON public.classes 
FOR ALL 
TO authenticated
USING (get_user_role() = 'teacher')
WITH CHECK (get_user_role() = 'teacher');

-- Update student enrollments to allow teachers to manage them
DROP POLICY IF EXISTS "Teachers can create enrollments for demo" ON public.student_enrollments;
DROP POLICY IF EXISTS "Teachers can view all enrollments for demo" ON public.student_enrollments;

DROP POLICY IF EXISTS "Teachers can manage all enrollments for demo" ON public.student_enrollments;
CREATE POLICY "Teachers can manage all enrollments for demo" 
ON public.student_enrollments 
FOR ALL 
TO authenticated
USING (get_user_role() = 'teacher')
WITH CHECK (get_user_role() = 'teacher');

-- Ensure notifications can be created by teachers
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

DROP POLICY IF EXISTS "Teachers and system can insert notifications" ON public.notifications;
CREATE POLICY "Teachers and system can insert notifications" 
ON public.notifications 
FOR INSERT 
TO authenticated
WITH CHECK (get_user_role() IN ('teacher', 'principal') OR auth.uid() IS NULL);
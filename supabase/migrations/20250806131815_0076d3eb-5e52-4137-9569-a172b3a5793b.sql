-- Fix infinite recursion in classes table RLS policies
-- Drop the problematic policies first
DROP POLICY IF EXISTS "Teachers can view their assigned classes" ON public.classes;
DROP POLICY IF EXISTS "Students can view their enrolled classes" ON public.classes;
DROP POLICY IF EXISTS "Principals can manage all classes" ON public.classes;

-- Create new simplified policies for demo purposes
-- Teachers can view ALL classes (for demo purposes)
CREATE POLICY "Teachers can view all classes for demo" 
ON public.classes 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() AND role = 'teacher'
));

-- Students can view their enrolled classes (fixed)
CREATE POLICY "Students can view their enrolled classes" 
ON public.classes 
FOR SELECT 
USING (id IN (
  SELECT se.class_id 
  FROM public.student_enrollments se
  JOIN public.profiles p ON se.student_id = p.id
  WHERE p.user_id = auth.uid()
));

-- Principals can manage all classes
CREATE POLICY "Principals can manage all classes" 
ON public.classes 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() AND role = 'principal'
));

-- Teachers can create subjects in any class (for demo)
CREATE POLICY "Teachers can create subjects in any class for demo" 
ON public.subjects 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() AND role = 'teacher'
));

-- Fix video materials policies to prevent recursion
DROP POLICY IF EXISTS "Students can view video materials in their subjects" ON public.video_materials;
CREATE POLICY "Students can view video materials in their subjects" 
ON public.video_materials 
FOR SELECT 
USING (
  subject_id IS NULL OR -- Allow public videos
  subject_id IN (
    SELECT s.id 
    FROM public.subjects s
    JOIN public.student_enrollments se ON s.class_id = se.class_id
    JOIN public.profiles p ON se.student_id = p.id
    WHERE p.user_id = auth.uid()
  )
);

-- Allow guest access to public video materials
CREATE POLICY "Public access to demo videos" 
ON public.video_materials 
FOR SELECT 
USING (subject_id IS NULL);
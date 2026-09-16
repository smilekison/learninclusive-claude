-- Fix the infinite recursion in RLS policies for profiles table
-- Create security definer functions to avoid recursive policy checks

-- Function to get current user's role safely
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT 
LANGUAGE SQL 
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$$;

-- Function to check if user is principal
CREATE OR REPLACE FUNCTION public.is_principal()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER  
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'principal'
  );
$$;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Principals can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Teachers can view students in their classes" ON public.profiles;

-- Create new safe policies using security definer functions
DROP POLICY IF EXISTS "Principals can view all profiles" ON public.profiles;
CREATE POLICY "Principals can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (public.is_principal());

DROP POLICY IF EXISTS "Teachers can view students in their classes" ON public.profiles;
CREATE POLICY "Teachers can view students in their classes" 
ON public.profiles 
FOR SELECT 
USING (
  (role = 'student') AND 
  (id IN ( 
    SELECT se.student_id
    FROM student_enrollments se
    JOIN classes c ON se.class_id = c.id
    JOIN profiles p ON c.teacher_id = p.id
    WHERE p.user_id = auth.uid()
  ))
);

-- Also fix other potential recursive policies

-- Drop and recreate assignments policies to be safer
DROP POLICY IF EXISTS "Teachers can manage assignments in their subjects" ON public.assignments;
CREATE POLICY "Teachers can manage assignments in their subjects" 
ON public.assignments 
FOR ALL 
USING (subject_id IN ( 
  SELECT s.id
  FROM subjects s
  JOIN classes c ON s.class_id = c.id
  JOIN profiles p ON c.teacher_id = p.id
  WHERE p.user_id = auth.uid()
));

-- Drop and recreate subjects policies
DROP POLICY IF EXISTS "Teachers can manage subjects in their classes" ON public.subjects;
CREATE POLICY "Teachers can manage subjects in their classes" 
ON public.subjects 
FOR ALL 
USING (class_id IN ( 
  SELECT c.id
  FROM classes c
  JOIN profiles p ON c.teacher_id = p.id
  WHERE p.user_id = auth.uid()
));
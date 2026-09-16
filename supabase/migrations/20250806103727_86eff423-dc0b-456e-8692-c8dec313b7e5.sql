-- Add missing RLS policies for materials table
DROP POLICY IF EXISTS "Students can view materials in their subjects" ON public.materials;
CREATE POLICY "Students can view materials in their subjects" 
ON public.materials 
FOR SELECT 
USING (subject_id IN ( SELECT s.id
   FROM ((subjects s
     JOIN student_enrollments se ON ((s.class_id = se.class_id)))
     JOIN profiles p ON ((se.student_id = p.id)))
  WHERE (p.user_id = auth.uid())));

DROP POLICY IF EXISTS "Teachers can manage materials in their subjects" ON public.materials;
CREATE POLICY "Teachers can manage materials in their subjects" 
ON public.materials 
FOR ALL 
USING (subject_id IN ( SELECT s.id
   FROM ((subjects s
     JOIN classes c ON ((s.class_id = c.id)))
     JOIN profiles p ON ((c.teacher_id = p.id)))
  WHERE (p.user_id = auth.uid())));

-- Add missing RLS policies for quizzes table
DROP POLICY IF EXISTS "Students can view quizzes in their subjects" ON public.quizzes;
CREATE POLICY "Students can view quizzes in their subjects" 
ON public.quizzes 
FOR SELECT 
USING (subject_id IN ( SELECT s.id
   FROM ((subjects s
     JOIN student_enrollments se ON ((s.class_id = se.class_id)))
     JOIN profiles p ON ((se.student_id = p.id)))
  WHERE (p.user_id = auth.uid())));

DROP POLICY IF EXISTS "Teachers can manage quizzes in their subjects" ON public.quizzes;
CREATE POLICY "Teachers can manage quizzes in their subjects" 
ON public.quizzes 
FOR ALL 
USING (subject_id IN ( SELECT s.id
   FROM ((subjects s
     JOIN classes c ON ((s.class_id = c.id)))
     JOIN profiles p ON ((c.teacher_id = p.id)))
  WHERE (p.user_id = auth.uid())));

-- Add missing RLS policies for quiz_attempts table
DROP POLICY IF EXISTS "Students can manage their own quiz attempts" ON public.quiz_attempts;
CREATE POLICY "Students can manage their own quiz attempts" 
ON public.quiz_attempts 
FOR ALL 
USING (student_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.user_id = auth.uid())));

DROP POLICY IF EXISTS "Teachers can view quiz attempts for their quizzes" ON public.quiz_attempts;
CREATE POLICY "Teachers can view quiz attempts for their quizzes" 
ON public.quiz_attempts 
FOR SELECT 
USING (quiz_id IN ( SELECT q.id
   FROM (((quizzes q
     JOIN subjects s ON ((q.subject_id = s.id)))
     JOIN classes c ON ((s.class_id = c.id)))
     JOIN profiles p ON ((c.teacher_id = p.id)))
  WHERE (p.user_id = auth.uid())));

-- Add missing RLS policies for student_enrollments table
DROP POLICY IF EXISTS "Students can view their own enrollments" ON public.student_enrollments;
CREATE POLICY "Students can view their own enrollments" 
ON public.student_enrollments 
FOR SELECT 
USING (student_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.user_id = auth.uid())));

DROP POLICY IF EXISTS "Principals can manage all enrollments" ON public.student_enrollments;
CREATE POLICY "Principals can manage all enrollments" 
ON public.student_enrollments 
FOR ALL 
USING (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.role = 'principal'::text))));

DROP POLICY IF EXISTS "Teachers can view enrollments in their classes" ON public.student_enrollments;
CREATE POLICY "Teachers can view enrollments in their classes" 
ON public.student_enrollments 
FOR SELECT 
USING (class_id IN ( SELECT c.id
   FROM (classes c
     JOIN profiles p ON ((c.teacher_id = p.id)))
  WHERE (p.user_id = auth.uid())));

-- Fix function search paths
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, first_name, last_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', 'User'),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', 'Name'),
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'student')
  );
  RETURN NEW;
END;
$function$;
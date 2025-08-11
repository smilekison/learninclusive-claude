-- Fix RLS policies for proper functionality

-- 1. PROFILES TABLE - Add missing policies for principals to manage teachers and students
CREATE POLICY "Principals can insert profiles for teachers and students" 
ON public.profiles 
FOR INSERT 
WITH CHECK (is_principal() AND role IN ('teacher', 'student'));

-- 2. SUBJECTS TABLE - Missing policies entirely! 
-- Teachers need to create subjects, students need to view them
CREATE POLICY "Teachers can manage subjects in their classes" 
ON public.subjects 
FOR ALL 
USING (class_id IN ( 
  SELECT c.id 
  FROM classes c 
  JOIN profiles p ON c.teacher_id = p.id 
  WHERE p.user_id = auth.uid()
));

CREATE POLICY "Students can view subjects in their classes" 
ON public.subjects 
FOR SELECT 
USING (class_id IN ( 
  SELECT se.class_id 
  FROM student_enrollments se 
  JOIN profiles p ON se.student_id = p.id 
  WHERE p.user_id = auth.uid()
));

CREATE POLICY "Principals can manage all subjects" 
ON public.subjects 
FOR ALL 
USING (is_principal());

-- 3. STUDENT_ENROLLMENTS - Add policy for students to enroll themselves
CREATE POLICY "Students can enroll themselves" 
ON public.student_enrollments 
FOR INSERT 
WITH CHECK (student_id IN ( 
  SELECT profiles.id 
  FROM profiles 
  WHERE profiles.user_id = auth.uid() AND profiles.role = 'student'
));

-- 4. SCHOOLS - Add policy for principals to create schools
CREATE POLICY "Principals can insert schools" 
ON public.schools 
FOR INSERT 
WITH CHECK (is_principal());

-- 5. QUIZZES - Add missing policies for students to take quizzes
CREATE POLICY "Principals can manage all quizzes" 
ON public.quizzes 
FOR ALL 
USING (is_principal());

-- 6. QUIZ_ATTEMPTS - Add missing policies
CREATE POLICY "Principals can view all quiz attempts" 
ON public.quiz_attempts 
FOR SELECT 
USING (is_principal());

-- 7. ASSIGNMENTS - Add missing policies for principals
CREATE POLICY "Principals can manage all assignments" 
ON public.assignments 
FOR ALL 
USING (is_principal());

-- 8. ASSIGNMENT_SUBMISSIONS - Add missing policies for principals
CREATE POLICY "Principals can view all assignment submissions" 
ON public.assignment_submissions 
FOR SELECT 
USING (is_principal());

-- 9. LESSONS - Add missing policies for principals
CREATE POLICY "Principals can manage all lessons" 
ON public.lessons 
FOR ALL 
USING (is_principal());

-- 10. MATERIALS - Add missing policies for principals
CREATE POLICY "Principals can manage all materials" 
ON public.materials 
FOR ALL 
USING (is_principal());

-- 11. NOTIFICATIONS - Add missing policies for creating notifications
CREATE POLICY "System can insert notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Principals can manage all notifications" 
ON public.notifications 
FOR ALL 
USING (is_principal());
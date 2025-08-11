-- Add missing RLS policies for proper functionality

-- 1. PROFILES TABLE - Add policy for principals to create teacher/student profiles
CREATE POLICY "Principals can insert profiles for teachers and students" 
ON public.profiles 
FOR INSERT 
WITH CHECK (is_principal() AND role IN ('teacher', 'student'));

-- 2. SUBJECTS TABLE - Add policy for principals to manage all subjects
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

-- 5. Add missing policies for other tables
CREATE POLICY "Principals can manage all quizzes" 
ON public.quizzes 
FOR ALL 
USING (is_principal());

CREATE POLICY "Principals can view all quiz attempts" 
ON public.quiz_attempts 
FOR SELECT 
USING (is_principal());

CREATE POLICY "Principals can manage all assignments" 
ON public.assignments 
FOR ALL 
USING (is_principal());

CREATE POLICY "Principals can view all assignment submissions" 
ON public.assignment_submissions 
FOR SELECT 
USING (is_principal());

CREATE POLICY "Principals can manage all lessons" 
ON public.lessons 
FOR ALL 
USING (is_principal());

CREATE POLICY "Principals can manage all materials" 
ON public.materials 
FOR ALL 
USING (is_principal());

CREATE POLICY "System can insert notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Principals can manage all notifications" 
ON public.notifications 
FOR ALL 
USING (is_principal());
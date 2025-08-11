
-- 1) Allow teachers to view only their students' profiles (active ones)
CREATE POLICY "Teachers can view their students' profiles"
ON public.profiles
FOR SELECT
USING (
  (is_active = true)
  AND EXISTS (
    SELECT 1
    FROM public.student_enrollments se
    JOIN public.classes c ON c.id = se.class_id
    JOIN public.profiles t ON t.id = c.teacher_id
    WHERE se.student_id = profiles.id
      AND t.user_id = auth.uid()
  )
);

-- 2) Allow students to view only the classes they are enrolled in (active ones)
CREATE POLICY "Students can view their enrolled classes"
ON public.classes
FOR SELECT
USING (
  (is_active = true)
  AND EXISTS (
    SELECT 1
    FROM public.student_enrollments se
    JOIN public.profiles s ON s.id = se.student_id
    WHERE se.class_id = classes.id
      AND s.user_id = auth.uid()
  )
);

-- 3) Allow students to view subjects in the classes they are enrolled in (active ones)
CREATE POLICY "Students can view subjects in their enrolled classes"
ON public.subjects
FOR SELECT
USING (
  (is_active = true)
  AND EXISTS (
    SELECT 1
    FROM public.student_enrollments se
    JOIN public.profiles s ON s.id = se.student_id
    WHERE se.class_id = subjects.class_id
      AND s.user_id = auth.uid()
  )
);

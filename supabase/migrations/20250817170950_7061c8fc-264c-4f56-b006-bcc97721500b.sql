-- Grant parents read access to their children's analytics data

-- 1) Assignment submissions
CREATE POLICY IF NOT EXISTS "Parents can view their children's submissions"
ON public.assignment_submissions
FOR SELECT
USING (
  student_id = ANY (get_parent_student_ids_for_user())
);

-- 2) Student enrollments
CREATE POLICY IF NOT EXISTS "Parents can view their children's enrollments"
ON public.student_enrollments
FOR SELECT
USING (
  student_id = ANY (get_parent_student_ids_for_user())
);

-- 3) Student accommodations
CREATE POLICY IF NOT EXISTS "Parents can view their children's accommodations"
ON public.student_accommodations
FOR SELECT
USING (
  student_id = ANY (get_parent_student_ids_for_user())
);

-- 4) Student support services
CREATE POLICY IF NOT EXISTS "Parents can view their children's support services"
ON public.student_support_services
FOR SELECT
USING (
  student_id = ANY (get_parent_student_ids_for_user())
);

-- 5) Student progress tracking
CREATE POLICY IF NOT EXISTS "Parents can view their children's progress"
ON public.student_progress_tracking
FOR SELECT
USING (
  student_id = ANY (get_parent_student_ids_for_user())
);

-- 6) Assignments (needed for nested selects from submissions)
CREATE POLICY IF NOT EXISTS "Parents can view assignments for their children's classes"
ON public.assignments
FOR SELECT
USING (
  subject_id IN (
    SELECT s.id
    FROM subjects s
    JOIN classes c ON s.class_id = c.id
    JOIN student_enrollments se ON se.class_id = c.id
    WHERE se.student_id = ANY (get_parent_student_ids_for_user())
  )
);

-- 7) Classes (nested in subjects/assignments)
CREATE POLICY IF NOT EXISTS "Parents can view their children's classes"
ON public.classes
FOR SELECT
USING (
  id IN (
    SELECT se.class_id
    FROM student_enrollments se
    WHERE se.student_id = ANY (get_parent_student_ids_for_user())
  )
);

-- 8) Subjects (nested in assignments)
CREATE POLICY IF NOT EXISTS "Parents can view their children's subjects"
ON public.subjects
FOR SELECT
USING (
  class_id IN (
    SELECT se.class_id
    FROM student_enrollments se
    WHERE se.student_id = ANY (get_parent_student_ids_for_user())
  )
);

-- Grant parents read access to their children's analytics data

-- 1) Assignment submissions
DROP POLICY IF EXISTS "Parents can view their children's submissions" ON assignment_submissions;
CREATE POLICY "Parents can view their children's submissions"
ON assignment_submissions
FOR SELECT
USING (
  student_id = ANY (get_parent_student_ids_for_user())
);

-- 2) Student enrollments
DROP POLICY IF EXISTS "Parents can view their children's enrollments" ON student_enrollments;
CREATE POLICY "Parents can view their children's enrollments"
ON student_enrollments
FOR SELECT
USING (
  student_id = ANY (get_parent_student_ids_for_user())
);

-- 3) Student accommodations
DROP POLICY IF EXISTS "Parents can view their children's accommodations" ON student_accommodations;
CREATE POLICY "Parents can view their children's accommodations"
ON student_accommodations
FOR SELECT
USING (
  student_id = ANY (get_parent_student_ids_for_user())
);

-- 4) Student support services
DROP POLICY IF EXISTS "Parents can view their children's support services" ON student_support_services;
CREATE POLICY "Parents can view their children's support services"
ON student_support_services
FOR SELECT
USING (
  student_id = ANY (get_parent_student_ids_for_user())
);

-- 5) Student progress tracking
DROP POLICY IF EXISTS "Parents can view their children's progress" ON student_progress_tracking;
CREATE POLICY "Parents can view their children's progress"
ON student_progress_tracking
FOR SELECT
USING (
  student_id = ANY (get_parent_student_ids_for_user())
);

-- 6) Assignments (needed for nested selects from submissions)
DROP POLICY IF EXISTS "Parents can view assignments for their children's classes" ON assignments;
CREATE POLICY "Parents can view assignments for their children's classes"
ON assignments
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
DROP POLICY IF EXISTS "Parents can view their children's classes" ON classes;
CREATE POLICY "Parents can view their children's classes"
ON classes
FOR SELECT
USING (
  id IN (
    SELECT se.class_id
    FROM student_enrollments se
    WHERE se.student_id = ANY (get_parent_student_ids_for_user())
  )
);

-- 8) Subjects (nested in assignments)
DROP POLICY IF EXISTS "Parents can view their children's subjects" ON subjects;
CREATE POLICY "Parents can view their children's subjects"
ON subjects
FOR SELECT
USING (
  class_id IN (
    SELECT se.class_id
    FROM student_enrollments se
    WHERE se.student_id = ANY (get_parent_student_ids_for_user())
  )
);

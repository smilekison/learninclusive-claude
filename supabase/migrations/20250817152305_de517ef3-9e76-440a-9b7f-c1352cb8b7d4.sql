-- Add RLS policy for students to view lessons in their enrolled subjects
DROP POLICY IF EXISTS "Students can view lessons in enrolled subjects" ON lessons;
CREATE POLICY "Students can view lessons in enrolled subjects" ON lessons
  FOR SELECT
  TO authenticated
  USING (
    subject_id IN (
      SELECT s.id
      FROM subjects s
      JOIN classes c ON s.class_id = c.id
      JOIN student_enrollments se ON c.id = se.class_id
      WHERE se.student_id = get_current_profile_id()
      AND se.status = 'active'
      AND s.is_active = true
      AND c.is_active = true
    )
  );
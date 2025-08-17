-- Drop the existing function first
DROP FUNCTION IF EXISTS is_teacher_of_student(uuid);

-- Create function to check if current user is a teacher of a specific student
CREATE OR REPLACE FUNCTION is_teacher_of_student(student_profile_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- For demo purposes, allow teachers to see all students
  -- In production, this would check actual enrollment relationships
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role = 'teacher'
    AND is_active = true
  );
END;
$$;

-- Update RLS policy for teachers to view all students (for demo)
DROP POLICY IF EXISTS "Teachers can view all students for demo" ON profiles;
CREATE POLICY "Teachers can view all students for demo" ON profiles
  FOR SELECT
  USING (
    (is_active = true) AND 
    (
      (role = 'student' AND EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.user_id = auth.uid() 
        AND p.role = 'teacher' 
        AND p.is_active = true
      )) OR
      (user_id = auth.uid()) OR
      is_principal()
    )
  );
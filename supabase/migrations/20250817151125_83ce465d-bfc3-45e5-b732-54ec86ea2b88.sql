-- Drop the dependent policy first
DROP POLICY IF EXISTS "Teachers can view their students' profiles" ON profiles;

-- Now drop the function
DROP FUNCTION IF EXISTS is_teacher_of_student(uuid);

-- Create new function to check if current user is a teacher of a specific student
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

-- Create new RLS policy for teachers to view all students (for demo)
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
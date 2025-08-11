-- Fix teacher profile query for enrollment requests  
-- Ensure teachers can see enrollment requests by updating RLS policies
DROP POLICY IF EXISTS "Teachers can view requests for their subjects" ON subject_enrollment_requests;

CREATE POLICY "Teachers can view requests for their subjects" 
ON subject_enrollment_requests 
FOR SELECT 
USING (subject_id IN (
  SELECT s.id FROM subjects s 
  JOIN classes c ON s.class_id = c.id 
  JOIN profiles p ON c.teacher_id = p.id 
  WHERE p.user_id = auth.uid() AND p.role = 'teacher'
));

-- Also update the teacher notification query
DROP POLICY IF EXISTS "Teachers can update requests for their subjects" ON subject_enrollment_requests;

CREATE POLICY "Teachers can update requests for their subjects" 
ON subject_enrollment_requests 
FOR UPDATE 
USING (subject_id IN (
  SELECT s.id FROM subjects s 
  JOIN classes c ON s.class_id = c.id 
  JOIN profiles p ON c.teacher_id = p.id 
  WHERE p.user_id = auth.uid() AND p.role = 'teacher'
));
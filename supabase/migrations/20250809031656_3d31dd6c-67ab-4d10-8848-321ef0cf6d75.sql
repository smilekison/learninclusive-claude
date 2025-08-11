-- First, let's see what users we have and create proper test data
-- Update the existing principal to also act as a teacher for demo purposes

-- Create a demo class for the existing principal (who will also be a teacher)
INSERT INTO classes (name, description, teacher_id)
SELECT 'Mathematics 101', 'Basic Mathematics Course', p.id
FROM profiles p 
WHERE p.role = 'principal'
AND NOT EXISTS (
  SELECT 1 FROM classes WHERE name = 'Mathematics 101'
)
LIMIT 1;

-- Create a demo subject for this class
INSERT INTO subjects (name, description, class_id, invitation_code)
SELECT 'Algebra Fundamentals', 'Introduction to Algebra', c.id, 'MATH101'
FROM classes c
WHERE c.name = 'Mathematics 101'
AND NOT EXISTS (
  SELECT 1 FROM subjects WHERE name = 'Algebra Fundamentals'
);

-- Create some demo enrollment requests using existing student profiles
INSERT INTO subject_enrollment_requests (student_id, subject_id, invitation_code, status)
SELECT 
  p_student.id,
  s.id,
  s.invitation_code,
  'pending'
FROM profiles p_student
CROSS JOIN subjects s
JOIN classes c ON s.class_id = c.id
WHERE p_student.role = 'student' 
  AND s.name = 'Algebra Fundamentals'
  AND NOT EXISTS (
    SELECT 1 FROM subject_enrollment_requests ser
    WHERE ser.student_id = p_student.id AND ser.subject_id = s.id
  )
LIMIT 3;
-- Create some demo enrollment requests for testing
-- First, let's create a demo teacher and students if they don't exist

-- Create demo teacher if not exists
INSERT INTO profiles (user_id, first_name, last_name, role)
SELECT gen_random_uuid(), 'John', 'Teacher', 'teacher'
WHERE NOT EXISTS (
  SELECT 1 FROM profiles WHERE role = 'teacher' AND first_name = 'John' AND last_name = 'Teacher'
);

-- Create demo students if they don't exist
INSERT INTO profiles (user_id, first_name, last_name, role)
SELECT gen_random_uuid(), 'Alice', 'StudentDemo', 'student'
WHERE NOT EXISTS (
  SELECT 1 FROM profiles WHERE role = 'student' AND first_name = 'Alice' AND last_name = 'StudentDemo'
);

INSERT INTO profiles (user_id, first_name, last_name, role)
SELECT gen_random_uuid(), 'Bob', 'StudentDemo', 'student'
WHERE NOT EXISTS (
  SELECT 1 FROM profiles WHERE role = 'student' AND first_name = 'Bob' AND last_name = 'StudentDemo'
);

-- Create demo class and subjects if they don't exist
INSERT INTO classes (name, description, teacher_id)
SELECT 'Demo Class', 'A demo class for testing', p.id
FROM profiles p 
WHERE p.role = 'teacher' AND p.first_name = 'John' AND p.last_name = 'Teacher'
AND NOT EXISTS (
  SELECT 1 FROM classes WHERE name = 'Demo Class'
);

INSERT INTO subjects (name, description, class_id, invitation_code)
SELECT 'Demo Subject', 'A demo subject for testing', c.id, 'DEMO123'
FROM classes c
JOIN profiles p ON c.teacher_id = p.id
WHERE c.name = 'Demo Class' AND p.first_name = 'John' AND p.last_name = 'Teacher'
AND NOT EXISTS (
  SELECT 1 FROM subjects WHERE name = 'Demo Subject'
);

-- Create enrollment requests for testing
INSERT INTO subject_enrollment_requests (student_id, subject_id, invitation_code, status)
SELECT 
  p_student.id,
  s.id,
  s.invitation_code,
  'pending'
FROM profiles p_student
CROSS JOIN subjects s
JOIN classes c ON s.class_id = c.id
JOIN profiles p_teacher ON c.teacher_id = p_teacher.id
WHERE p_student.role = 'student' 
  AND p_student.first_name IN ('Alice', 'Bob') 
  AND p_student.last_name = 'StudentDemo'
  AND s.name = 'Demo Subject'
  AND p_teacher.first_name = 'John' 
  AND p_teacher.last_name = 'Teacher'
  AND NOT EXISTS (
    SELECT 1 FROM subject_enrollment_requests ser
    WHERE ser.student_id = p_student.id AND ser.subject_id = s.id
  );
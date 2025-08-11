-- Enroll Student Demo in the "riverside subject" 
-- Subject ID: 57493e4c-114a-4c5d-9a35-bb867b3dc907
-- Student ID: 5315d801-1759-4f8e-b515-82af4880e514

-- First create the subject enrollment
INSERT INTO student_subject_enrollments (student_id, subject_id, enrolled_at)
VALUES (
  '5315d801-1759-4f8e-b515-82af4880e514',
  '57493e4c-114a-4c5d-9a35-bb867b3dc907', 
  NOW()
)
ON CONFLICT (student_id, subject_id) DO NOTHING;

-- Also create class enrollment if not exists
INSERT INTO student_enrollments (student_id, class_id, enrolled_at)
VALUES (
  '5315d801-1759-4f8e-b515-82af4880e514',
  '7c91ecd5-d1ae-4b7f-a93f-48352da14e4a',
  NOW()
)
ON CONFLICT (student_id, class_id) DO NOTHING;
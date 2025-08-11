-- Clear all existing data (in reverse dependency order to avoid FK constraints)
DELETE FROM assignment_submissions;
DELETE FROM quiz_attempts;
DELETE FROM video_progress;
DELETE FROM subject_enrollment_requests;
DELETE FROM student_subject_enrollments;
DELETE FROM student_enrollments;
DELETE FROM notifications;
DELETE FROM materials;
DELETE FROM video_materials;
DELETE FROM lessons;
DELETE FROM assignments;
DELETE FROM quizzes;
DELETE FROM subjects;
DELETE FROM classes;
DELETE FROM deleted_items;
DELETE FROM email_invitations;
DELETE FROM profiles;
DELETE FROM schools;

-- Insert fresh schools
INSERT INTO schools (id, name, principal_id) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'Riverside Academy', NULL),
('660f9511-f3ab-52e5-b827-557766551111', 'Central High School', NULL);

-- Insert fresh profiles linking to existing auth users
INSERT INTO profiles (id, user_id, first_name, last_name, role, school_name, is_active) VALUES
-- Use the existing auth user IDs from the current system
('11111111-1111-1111-1111-111111111111', '4f173355-b1c0-4c4c-83e4-96f38500130d', 'Michael', 'Chen', 'teacher', NULL, true);

-- Create additional demo auth users for testing
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at
) VALUES
-- Principal
('00000000-0000-0000-0000-000000000000'::uuid, 'principal-demo-id-2025-testing-001'::uuid, 'authenticated', 'authenticated', 'principal@riverside.edu', '$2a$10$demo.password.hash.for.testing.purposes.only', NOW(), '{"provider": "email", "providers": ["email"]}'::jsonb, '{"first_name": "Dr. Sarah", "last_name": "Johnson", "role": "principal", "school_name": "Riverside Academy"}'::jsonb, FALSE, NOW(), NOW()),
-- Students
('00000000-0000-0000-0000-000000000000'::uuid, 'student-demo-id-2025-testing-001'::uuid, 'authenticated', 'authenticated', 'alex@student.edu', '$2a$10$demo.password.hash.for.testing.purposes.only', NOW(), '{"provider": "email", "providers": ["email"]}'::jsonb, '{"first_name": "Alex", "last_name": "Thompson", "role": "student"}'::jsonb, FALSE, NOW(), NOW()),
('00000000-0000-0000-0000-000000000000'::uuid, 'student-demo-id-2025-testing-002'::uuid, 'authenticated', 'authenticated', 'maria@student.edu', '$2a$10$demo.password.hash.for.testing.purposes.only', NOW(), '{"provider": "email", "providers": ["email"]}'::jsonb, '{"first_name": "Maria", "last_name": "Garcia", "role": "student"}'::jsonb, FALSE, NOW(), NOW()),
('00000000-0000-0000-0000-000000000000'::uuid, 'student-demo-id-2025-testing-003'::uuid, 'authenticated', 'authenticated', 'james@student.edu', '$2a$10$demo.password.hash.for.testing.purposes.only', NOW(), '{"provider": "email", "providers": ["email"]}'::jsonb, '{"first_name": "James", "last_name": "Wilson", "role": "student"}'::jsonb, FALSE, NOW(), NOW());

-- Now insert profiles for the new users
INSERT INTO profiles (id, user_id, first_name, last_name, role, school_name, is_active) VALUES
-- Principal
('22222222-2222-2222-2222-222222222222', 'principal-demo-id-2025-testing-001', 'Dr. Sarah', 'Johnson', 'principal', 'Riverside Academy', true),
-- Students
('44444444-4444-4444-4444-444444444444', 'student-demo-id-2025-testing-001', 'Alex', 'Thompson', 'student', NULL, true),
('55555555-5555-5555-5555-555555555555', 'student-demo-id-2025-testing-002', 'Maria', 'Garcia', 'student', NULL, true),
('66666666-6666-6666-6666-666666666666', 'student-demo-id-2025-testing-003', 'James', 'Wilson', 'student', NULL, true);

-- Update schools with principal_id
UPDATE schools SET principal_id = '22222222-2222-2222-2222-222222222222' WHERE id = '550e8400-e29b-41d4-a716-446655440000';

-- Insert fresh classes
INSERT INTO classes (id, name, description, school_id, teacher_id, is_active) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Grade 10 Mathematics', 'Advanced mathematics for grade 10 students', '550e8400-e29b-41d4-a716-446655440000', '11111111-1111-1111-1111-111111111111', true),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Grade 9 Science', 'Introduction to physical sciences', '550e8400-e29b-41d4-a716-446655440000', '11111111-1111-1111-1111-111111111111', true);

-- Insert fresh subjects
INSERT INTO subjects (id, name, description, class_id, invitation_code, is_active) VALUES
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Algebra', 'Linear equations and polynomial functions', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ALG2024', true),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Geometry', 'Shapes, angles, and spatial reasoning', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'GEO2024', true),
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Physics', 'Motion, forces, and energy', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'PHY2024', true);

-- Insert student enrollments
INSERT INTO student_enrollments (id, student_id, class_id) VALUES
('11111111-aaaa-bbbb-cccc-111111111111', '44444444-4444-4444-4444-444444444444', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
('22222222-aaaa-bbbb-cccc-222222222222', '55555555-5555-5555-5555-555555555555', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
('33333333-aaaa-bbbb-cccc-333333333333', '66666666-6666-6666-6666-666666666666', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');

-- Insert student subject enrollments
INSERT INTO student_subject_enrollments (id, student_id, subject_id) VALUES
('aaaaaaaa-1111-2222-3333-aaaaaaaa1111', '44444444-4444-4444-4444-444444444444', 'dddddddd-dddd-dddd-dddd-dddddddddddd'),
('bbbbbbbb-1111-2222-3333-bbbbbbbb2222', '55555555-5555-5555-5555-555555555555', 'dddddddd-dddd-dddd-dddd-dddddddddddd'),
('cccccccc-1111-2222-3333-cccccccc3333', '66666666-6666-6666-6666-666666666666', 'ffffffff-ffff-ffff-ffff-ffffffffffff');

-- Insert fresh assignments
INSERT INTO assignments (id, title, description, subject_id, due_date, max_attempts, max_score, is_active) VALUES
('assign11-1111-1111-1111-assign111111', 'Linear Equations Practice', 'Solve 15 linear equations with varying difficulty levels', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '2025-02-15 23:59:59+00', 3, 100.00, true),
('assign22-2222-2222-2222-assign222222', 'Geometry Proofs', 'Complete geometric proofs for triangles and quadrilaterals', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '2025-02-20 23:59:59+00', 2, 80.00, true);

-- Insert fresh notifications
INSERT INTO notifications (id, user_id, title, message, type, read) VALUES
('notif111-1111-1111-1111-notif1111111', '11111111-1111-1111-1111-111111111111', 'Welcome Teacher', 'Your account has been set up successfully!', 'info', false),
('notif222-2222-2222-2222-notif2222222', '44444444-4444-4444-4444-444444444444', 'New Assignment', 'Linear Equations Practice is available', 'assignment', false);

-- Insert sample assignment submission
INSERT INTO assignment_submissions (id, student_id, assignment_id, submission_text, score, attempt_number) VALUES
('submit11-1111-1111-1111-submit111111', '44444444-4444-4444-4444-444444444444', 'assign11-1111-1111-1111-assign111111', 'x = 5, solved all equations correctly', 85.0, 1);
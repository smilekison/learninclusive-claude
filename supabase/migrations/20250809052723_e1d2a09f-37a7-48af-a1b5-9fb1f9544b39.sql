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
('550e8400-e29b-41d4-a716-446655440000', 'Riverside Academy', NULL);

-- Insert fresh profiles using the existing teacher auth user
INSERT INTO profiles (id, user_id, first_name, last_name, role, school_name, is_active) VALUES
('11111111-1111-1111-1111-111111111111', '4f173355-b1c0-4c4c-83e4-96f38500130d', 'Michael', 'Chen', 'teacher', NULL, true);

-- Insert additional demo profiles (these won't have real auth users but will work for testing)
INSERT INTO profiles (id, user_id, first_name, last_name, role, school_name, is_active) VALUES
('22222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222', 'Dr. Sarah', 'Johnson', 'principal', 'Riverside Academy', true),
('44444444-4444-4444-4444-444444444444', 'a4444444-4444-4444-4444-444444444444', 'Alex', 'Thompson', 'student', NULL, true),
('55555555-5555-5555-5555-555555555555', 'a5555555-5555-5555-5555-555555555555', 'Maria', 'Garcia', 'student', NULL, true),
('66666666-6666-6666-6666-666666666666', 'a6666666-6666-6666-6666-666666666666', 'James', 'Wilson', 'student', NULL, true),
('77777777-7777-7777-7777-777777777777', 'a7777777-7777-7777-7777-777777777777', 'Emma', 'Davis', 'student', NULL, true);

-- Update schools with principal_id
UPDATE schools SET principal_id = '22222222-2222-2222-2222-222222222222' WHERE id = '550e8400-e29b-41d4-a716-446655440000';

-- Insert fresh classes
INSERT INTO classes (id, name, description, school_id, teacher_id, is_active) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Grade 10 Mathematics', 'Advanced mathematics for grade 10 students', '550e8400-e29b-41d4-a716-446655440000', '11111111-1111-1111-1111-111111111111', true),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Grade 9 Science', 'Introduction to physical sciences', '550e8400-e29b-41d4-a716-446655440000', '11111111-1111-1111-1111-111111111111', true),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Grade 11 English', 'Literature and composition', '550e8400-e29b-41d4-a716-446655440000', '11111111-1111-1111-1111-111111111111', true);

-- Insert fresh subjects with simple invitation codes
INSERT INTO subjects (id, name, description, class_id, invitation_code, is_active) VALUES
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Algebra', 'Linear equations and polynomial functions', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ALG2024', true),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Geometry', 'Shapes, angles, and spatial reasoning', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'GEO2024', true),
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Physics', 'Motion, forces, and energy', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'PHY2024', true),
('77777777-7777-7777-7777-777777777777', 'Chemistry', 'Atoms, molecules, and reactions', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'CHE2024', true),
('88888888-8888-8888-8888-888888888888', 'Literature', 'Classic and modern literature analysis', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'LIT2024', true);

-- Insert student enrollments
INSERT INTO student_enrollments (id, student_id, class_id) VALUES
('11111111-aaaa-bbbb-cccc-111111111111', '44444444-4444-4444-4444-444444444444', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
('22222222-aaaa-bbbb-cccc-222222222222', '55555555-5555-5555-5555-555555555555', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
('33333333-aaaa-bbbb-cccc-333333333333', '66666666-6666-6666-6666-666666666666', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
('44444444-aaaa-bbbb-cccc-444444444444', '77777777-7777-7777-7777-777777777777', 'cccccccc-cccc-cccc-cccc-cccccccccccc');

-- Insert student subject enrollments
INSERT INTO student_subject_enrollments (id, student_id, subject_id) VALUES
('aaaaaaaa-1111-2222-3333-aaaaaaaa1111', '44444444-4444-4444-4444-444444444444', 'dddddddd-dddd-dddd-dddd-dddddddddddd'),
('bbbbbbbb-1111-2222-3333-bbbbbbbb2222', '44444444-4444-4444-4444-444444444444', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'),
('cccccccc-1111-2222-3333-cccccccc3333', '55555555-5555-5555-5555-555555555555', 'dddddddd-dddd-dddd-dddd-dddddddddddd'),
('dddddddd-1111-2222-3333-dddddddd4444', '66666666-6666-6666-6666-666666666666', 'ffffffff-ffff-ffff-ffff-ffffffffffff'),
('eeeeeeee-1111-2222-3333-eeeeeeee5555', '77777777-7777-7777-7777-777777777777', '88888888-8888-8888-8888-888888888888');

-- Insert fresh assignments
INSERT INTO assignments (id, title, description, subject_id, due_date, max_attempts, max_score, is_active) VALUES
('a3397e11-1111-1111-1111-a3397e111111', 'Linear Equations Practice', 'Solve 15 linear equations with varying difficulty levels', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '2025-02-15 23:59:59+00', 3, 100.00, true),
('a3397e22-2222-2222-2222-a3397e222222', 'Geometry Proofs', 'Complete geometric proofs for triangles and quadrilaterals', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '2025-02-20 23:59:59+00', 2, 80.00, true),
('a3397e33-3333-3333-3333-a3397e333333', 'Newton Laws Lab', 'Conduct experiments and analyze motion using Newton laws', 'ffffffff-ffff-ffff-ffff-ffffffffffff', '2025-02-25 23:59:59+00', 1, 120.00, true),
('a3397e44-4444-4444-4444-a3397e444444', 'Chemical Reactions', 'Balance equations and predict reaction outcomes', '77777777-7777-7777-7777-777777777777', '2025-03-01 23:59:59+00', 3, 90.00, true),
('a3397e55-5555-5555-5555-a3397e555555', 'Poetry Analysis', 'Analyze themes and literary devices in modern poetry', '88888888-8888-8888-8888-888888888888', '2025-03-05 23:59:59+00', 2, 85.00, true);

-- Insert fresh quizzes
INSERT INTO quizzes (id, title, description, subject_id, time_limit, max_attempts, max_score, questions) VALUES
('159a1111-1111-1111-1111-159a11111111', 'Algebra Basics Quiz', 'Test your understanding of basic algebraic concepts', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 30, 2, 50.00, '[{"question": "Solve for x: 2x + 5 = 15", "options": ["x = 5", "x = 10", "x = 15", "x = 20"], "correct": 0}]'),
('159a2222-2222-2222-2222-159a22222222', 'Geometry Fundamentals', 'Basic geometry concepts and calculations', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 45, 2, 60.00, '[{"question": "What is the area of a triangle with base 10 and height 6?", "options": ["30", "60", "16", "20"], "correct": 0}]');

-- Insert fresh lessons
INSERT INTO lessons (id, title, description, content, subject_id, lesson_order) VALUES
('ce33fe11-1111-1111-1111-ce33fe111111', 'Introduction to Linear Equations', 'Understanding variables and linear relationships', 'A linear equation is an equation where the highest power of the variable is 1. Examples include x + 5 = 10 and 2y - 3 = 7.', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 1),
('ce33fe22-2222-2222-2222-ce33fe222222', 'Solving Linear Equations', 'Step-by-step methods for solving linear equations', 'To solve linear equations: 1) Isolate the variable term, 2) Perform inverse operations, 3) Check your solution.', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 2),
('ce33fe33-3333-3333-3333-ce33fe333333', 'Basic Geometric Shapes', 'Properties of triangles, squares, and circles', 'Triangles have 3 sides and angles that sum to 180°. Squares have 4 equal sides and 4 right angles.', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 1);

-- Insert fresh notifications
INSERT INTO notifications (id, user_id, title, message, type, read) VALUES
('ef49f111-1111-1111-1111-ef49f1111111', '11111111-1111-1111-1111-111111111111', 'Welcome Teacher', 'Your account has been set up successfully!', 'info', false),
('ef49f222-2222-2222-2222-ef49f2222222', '44444444-4444-4444-4444-444444444444', 'New Assignment', 'Linear Equations Practice is available', 'assignment', false),
('ef49f333-3333-3333-3333-ef49f3333333', '55555555-5555-5555-5555-555555555555', 'Quiz Reminder', 'Algebra Basics Quiz is due tomorrow', 'info', false),
('ef49f444-4444-4444-4444-ef49f4444444', '22222222-2222-2222-2222-222222222222', 'System Update', 'New features have been added to the dashboard', 'info', true);

-- Insert some pending enrollment requests for testing
INSERT INTO subject_enrollment_requests (id, student_id, subject_id, invitation_code, status) VALUES
('2e15e341-1111-1111-1111-2e15e3411111', '77777777-7777-7777-7777-777777777777', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'ALG2024', 'pending'),
('2e15e342-2222-2222-2222-2e15e3422222', '66666666-6666-6666-6666-666666666666', '88888888-8888-8888-8888-888888888888', 'LIT2024', 'pending');

-- Insert sample assignment submissions
INSERT INTO assignment_submissions (id, student_id, assignment_id, submission_text, score, attempt_number) VALUES
('35bd9411-1111-1111-1111-35bd94111111', '44444444-4444-4444-4444-444444444444', 'a3397e11-1111-1111-1111-a3397e111111', 'x = 5, 2x + 10 = 20, x = 5; 3y - 6 = 9, 3y = 15, y = 5', 85.0, 1),
('35bd9422-2222-2222-2222-35bd94222222', '55555555-5555-5555-5555-555555555555', 'a3397e11-1111-1111-1111-a3397e111111', 'Solved all 15 equations correctly with detailed work shown.', 95.0, 1),
('35bd9433-3333-3333-3333-35bd94333333', '44444444-4444-4444-4444-444444444444', 'a3397e22-2222-2222-2222-a3397e222222', 'Completed geometric proofs for triangles using properties of congruent triangles.', 78.0, 1);

-- Insert quiz attempts
INSERT INTO quiz_attempts (id, student_id, quiz_id, answers, score, attempt_number, completed_at) VALUES
('35111111-1111-1111-1111-351111111111', '44444444-4444-4444-4444-444444444444', '159a1111-1111-1111-1111-159a11111111', '{"0": 0}'::jsonb, 50.0, 1, NOW()),
('35222222-2222-2222-2222-352222222222', '55555555-5555-5555-5555-555555555555', '159a1111-1111-1111-1111-159a11111111', '{"0": 0}'::jsonb, 50.0, 1, NOW());
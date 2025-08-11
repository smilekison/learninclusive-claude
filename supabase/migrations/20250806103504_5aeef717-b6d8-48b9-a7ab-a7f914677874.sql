-- Create demo school
INSERT INTO public.schools (id, name, principal_id) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'Riverside Academy', NULL);

-- Insert demo profiles (these will be linked to auth users)
INSERT INTO public.profiles (id, user_id, first_name, last_name, role, school_name) VALUES
('11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Sarah', 'Johnson', 'principal', 'Riverside Academy'),
('22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Michael', 'Chen', 'teacher', NULL),
('33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'Emma', 'Davis', 'student', NULL);

-- Update school with principal
UPDATE public.schools SET principal_id = '11111111-1111-1111-1111-111111111111' 
WHERE id = '550e8400-e29b-41d4-a716-446655440000';

-- Create demo classes
INSERT INTO public.classes (id, name, description, teacher_id, school_id, enrollment_code) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Grade 10 Mathematics', 'Advanced mathematics for grade 10 students', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', 'MATH10A'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Grade 10 Science', 'Introduction to physics, chemistry, and biology', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', 'SCI10B'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Grade 9 English', 'Literature and writing skills development', '22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', 'ENG9C');

-- Enroll student in classes
INSERT INTO public.student_enrollments (student_id, class_id) VALUES
('33333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
('33333333-3333-3333-3333-333333333333', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');

-- Create subjects for each class
INSERT INTO public.subjects (id, name, description, class_id) VALUES
-- Math subjects
('sub11111-1111-1111-1111-111111111111', 'Algebra', 'Linear equations and polynomial functions', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
('sub22222-2222-2222-2222-222222222222', 'Geometry', 'Shapes, angles, and spatial reasoning', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
('sub33333-3333-3333-3333-333333333333', 'Trigonometry', 'Sine, cosine, and tangent functions', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
-- Science subjects
('sub44444-4444-4444-4444-444444444444', 'Physics', 'Motion, forces, and energy', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
('sub55555-5555-5555-5555-555555555555', 'Chemistry', 'Atoms, molecules, and chemical reactions', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
('sub66666-6666-6666-6666-666666666666', 'Biology', 'Living organisms and life processes', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
-- English subjects
('sub77777-7777-7777-7777-777777777777', 'Literature', 'Reading and analyzing literary works', 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
('sub88888-8888-8888-8888-888888888888', 'Writing', 'Essay writing and composition skills', 'cccccccc-cccc-cccc-cccc-cccccccccccc');

-- Create lessons for subjects
INSERT INTO public.lessons (id, title, description, content, subject_id, lesson_order) VALUES
-- Algebra lessons
('les11111-1111-1111-1111-111111111111', 'Introduction to Linear Equations', 'Understanding the basics of linear equations', 'Linear equations are equations where the highest power of the variable is 1. In this lesson, we will explore how to solve simple linear equations like 2x + 3 = 7.', 'sub11111-1111-1111-1111-111111111111', 1),
('les22222-2222-2222-2222-222222222222', 'Solving Systems of Equations', 'Methods for solving multiple equations simultaneously', 'When we have multiple equations with multiple variables, we can use substitution or elimination methods to find the solution.', 'sub11111-1111-1111-1111-111111111111', 2),
-- Physics lessons
('les33333-3333-3333-3333-333333333333', 'Newton''s Laws of Motion', 'Understanding the fundamental laws of motion', 'Newton''s three laws describe the relationship between forces acting on a body and its motion. The first law states that an object at rest stays at rest.', 'sub44444-4444-4444-4444-444444444444', 1),
('les44444-4444-4444-4444-444444444444', 'Energy and Work', 'Exploring kinetic and potential energy', 'Energy is the capacity to do work. Kinetic energy is the energy of motion, while potential energy is stored energy.', 'sub44444-4444-4444-4444-444444444444', 2);

-- Create assignments
INSERT INTO public.assignments (id, title, description, subject_id, due_date, max_score, max_attempts) VALUES
('asn11111-1111-1111-1111-111111111111', 'Linear Equations Practice', 'Solve 20 linear equations with varying difficulty levels', 'sub11111-1111-1111-1111-111111111111', NOW() + INTERVAL '7 days', 100, 3),
('asn22222-2222-2222-2222-222222222222', 'Geometry Proofs', 'Complete geometric proofs for triangles and quadrilaterals', 'sub22222-2222-2222-2222-222222222222', NOW() + INTERVAL '10 days', 80, 2),
('asn33333-3333-3333-3333-333333333333', 'Physics Lab Report', 'Write a lab report on pendulum motion experiment', 'sub44444-4444-4444-4444-444444444444', NOW() + INTERVAL '14 days', 120, 1),
('asn44444-4444-4444-4444-444444444444', 'Chemistry Worksheet', 'Balance chemical equations and identify reaction types', 'sub55555-5555-5555-5555-555555555555', NOW() + INTERVAL '5 days', 90, 3);

-- Create assignment submissions
INSERT INTO public.assignment_submissions (id, assignment_id, student_id, submission_text, score, attempt_number, graded_by, feedback) VALUES
('sbm11111-1111-1111-1111-111111111111', 'asn11111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'I solved all 20 equations step by step. Here are my solutions: 1) x = 2, 2) y = -3, 3) z = 5...', 85, 1, '22222222-2222-2222-2222-222222222222', 'Good work! You got most answers correct. Review question 15 for the correct approach.'),
('sbm22222-2222-2222-2222-222222222222', 'asn22222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', 'Triangle ABC proof: Given that angle A = angle B, we can prove that triangle ABC is isosceles...', 75, 1, '22222222-2222-2222-2222-222222222222', 'Your proof logic is sound. Work on cleaner presentation and notation.');

-- Create quizzes
INSERT INTO public.quizzes (id, title, description, subject_id, questions, time_limit, max_attempts, max_score) VALUES
('qz111111-1111-1111-1111-111111111111', 'Algebra Basics Quiz', 'Test your understanding of basic algebraic concepts', 'sub11111-1111-1111-1111-111111111111', 
'[
  {
    "question": "Solve for x: 2x + 5 = 13",
    "type": "multiple_choice",
    "options": ["x = 3", "x = 4", "x = 5", "x = 6"],
    "correct_answer": "x = 4",
    "points": 10
  },
  {
    "question": "What is the slope of the line y = 3x + 2?",
    "type": "multiple_choice", 
    "options": ["2", "3", "5", "-2"],
    "correct_answer": "3",
    "points": 10
  }
]'::jsonb, 30, 2, 20),
('qz222222-2222-2222-2222-222222222222', 'Physics Forces Quiz', 'Assessment on Newton''s laws and forces', 'sub44444-4444-4444-4444-444444444444',
'[
  {
    "question": "Which of Newton''s laws states that for every action there is an equal and opposite reaction?",
    "type": "multiple_choice",
    "options": ["First Law", "Second Law", "Third Law", "Fourth Law"],
    "correct_answer": "Third Law",
    "points": 15
  }
]'::jsonb, 45, 3, 30);

-- Create quiz attempts
INSERT INTO public.quiz_attempts (id, quiz_id, student_id, answers, score, attempt_number, completed_at) VALUES
('qa111111-1111-1111-1111-111111111111', 'qz111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 
'{"0": "x = 4", "1": "3"}'::jsonb, 20, 1, NOW() - INTERVAL '2 days');

-- Create notifications
INSERT INTO public.notifications (id, user_id, title, message, type, read) VALUES
('not11111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'New Assignment Posted', 'A new assignment "Linear Equations Practice" has been posted in Algebra', 'assignment', false),
('not22222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', 'Quiz Graded', 'Your Algebra Basics Quiz has been graded. Score: 20/20', 'grade', false),
('not33333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'Student Submission', 'Emma Davis submitted Linear Equations Practice assignment', 'submission', true),
('not44444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'New Teacher Added', 'Michael Chen has been added as a teacher to your school', 'system', false);
-- Clear existing data and add proper demo data with disability support

-- Clear all existing data
TRUNCATE TABLE public.student_enrollments CASCADE;
TRUNCATE TABLE public.subjects CASCADE;
TRUNCATE TABLE public.classes CASCADE;
TRUNCATE TABLE public.profiles CASCADE;

-- Insert demo users with proper structure
INSERT INTO public.profiles (id, user_id, first_name, last_name, email, role, school_name, disability_type, accessibility_needs) VALUES
-- Principal
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Sarah', 'Johnson', 'principal@school.edu', 'principal', 'Lincoln Elementary School', NULL, NULL),

-- Teachers
('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'Michael', 'Davis', 'mdavis@school.edu', 'teacher', 'Lincoln Elementary School', NULL, NULL),
('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', 'Emily', 'Rodriguez', 'erodriguez@school.edu', 'teacher', 'Lincoln Elementary School', NULL, NULL),
('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440004', 'David', 'Thompson', 'dthompson@school.edu', 'teacher', 'Lincoln Elementary School', NULL, NULL),

-- Students with various disabilities
('550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440005', 'Alex', 'Smith', 'alex.smith@student.edu', 'student', 'Lincoln Elementary School', 'dyslexia', 'text-to-speech,high-contrast,large-text'),
('550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440006', 'Maria', 'Garcia', 'maria.garcia@student.edu', 'student', 'Lincoln Elementary School', 'visual_impairment', 'screen-reader,high-contrast,large-text'),
('550e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440007', 'James', 'Wilson', 'james.wilson@student.edu', 'student', 'Lincoln Elementary School', 'adhd', 'reduced-animations,focus-indicators'),
('550e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440008', 'Emma', 'Brown', 'emma.brown@student.edu', 'student', 'Lincoln Elementary School', NULL, NULL),
('550e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440009', 'Joshua', 'Miller', 'joshua.miller@student.edu', 'student', 'Lincoln Elementary School', 'hearing_impairment', 'captions,visual-alerts'),
('550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440010', 'Sophia', 'Davis', 'sophia.davis@student.edu', 'student', 'Lincoln Elementary School', 'autism', 'reduced-animations,clear-navigation,consistent-layout'),

-- Parents
('550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440011', 'Robert', 'Smith', 'robert.smith@parent.edu', 'parent', 'Lincoln Elementary School', NULL, NULL),
('550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440012', 'Jennifer', 'Garcia', 'jennifer.garcia@parent.edu', 'parent', 'Lincoln Elementary School', NULL, NULL),
('550e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440013', 'William', 'Wilson', 'william.wilson@parent.edu', 'parent', 'Lincoln Elementary School', NULL, NULL);

-- Insert demo classes
INSERT INTO public.classes (id, name, grade_level, teacher_id, school_year, description) VALUES
('class-550e8400-e29b-41d4-a716-446655440001', '5th Grade Math', '5th', '550e8400-e29b-41d4-a716-446655440002', '2024-2025', 'Advanced mathematics for 5th grade students'),
('class-550e8400-e29b-41d4-a716-446655440002', '5th Grade Science', '5th', '550e8400-e29b-41d4-a716-446655440003', '2024-2025', 'Earth science and basic physics'),
('class-550e8400-e29b-41d4-a716-446655440003', '4th Grade English', '4th', '550e8400-e29b-41d4-a716-446655440004', '2024-2025', 'Reading comprehension and writing skills'),
('class-550e8400-e29b-41d4-a716-446655440004', '4th Grade Art', '4th', '550e8400-e29b-41d4-a716-446655440003', '2024-2025', 'Creative arts and expression');

-- Insert demo subjects
INSERT INTO public.subjects (id, name, class_id, description) VALUES
('subject-550e8400-e29b-41d4-a716-446655440001', 'Algebra Basics', 'class-550e8400-e29b-41d4-a716-446655440001', 'Introduction to algebraic concepts'),
('subject-550e8400-e29b-41d4-a716-446655440002', 'Geometry', 'class-550e8400-e29b-41d4-a716-446655440001', 'Shapes, angles, and spatial reasoning'),
('subject-550e8400-e29b-41d4-a716-446655440003', 'Earth Systems', 'class-550e8400-e29b-41d4-a716-446655440002', 'Weather, geology, and climate'),
('subject-550e8400-e29b-41d4-a716-446655440004', 'Physics Fundamentals', 'class-550e8400-e29b-41d4-a716-446655440002', 'Motion, force, and energy'),
('subject-550e8400-e29b-41d4-a716-446655440005', 'Creative Writing', 'class-550e8400-e29b-41d4-a716-446655440003', 'Story writing and narrative skills'),
('subject-550e8400-e29b-41d4-a716-446655440006', 'Reading Comprehension', 'class-550e8400-e29b-41d4-a716-446655440003', 'Understanding and analyzing texts'),
('subject-550e8400-e29b-41d4-a716-446655440007', 'Drawing Techniques', 'class-550e8400-e29b-41d4-a716-446655440004', 'Basic drawing and sketching skills'),
('subject-550e8400-e29b-41d4-a716-446655440008', 'Color Theory', 'class-550e8400-e29b-41d4-a716-446655440004', 'Understanding colors and their relationships');

-- Insert demo student enrollments
INSERT INTO public.student_enrollments (id, student_id, class_id, enrollment_date, status) VALUES
('enroll-550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440005', 'class-550e8400-e29b-41d4-a716-446655440001', '2024-08-15', 'active'),
('enroll-550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440006', 'class-550e8400-e29b-41d4-a716-446655440001', '2024-08-15', 'active'),
('enroll-550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440007', 'class-550e8400-e29b-41d4-a716-446655440002', '2024-08-15', 'active'),
('enroll-550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440008', 'class-550e8400-e29b-41d4-a716-446655440003', '2024-08-15', 'active'),
('enroll-550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440009', 'class-550e8400-e29b-41d4-a716-446655440003', '2024-08-15', 'active'),
('enroll-550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440010', 'class-550e8400-e29b-41d4-a716-446655440004', '2024-08-15', 'active'),
('enroll-550e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440005', 'class-550e8400-e29b-41d4-a716-446655440002', '2024-08-15', 'active'),
('enroll-550e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440006', 'class-550e8400-e29b-41d4-a716-446655440004', '2024-08-15', 'active');

-- Add RLS policies to allow teachers to manage student disabilities
CREATE POLICY "Teachers can update student profiles for disability management" 
ON public.profiles 
FOR UPDATE 
USING (get_user_role() = 'teacher' AND role = 'student');

CREATE POLICY "Teachers can view student profiles for disability management" 
ON public.profiles 
FOR SELECT 
USING (get_user_role() = 'teacher' OR user_id = auth.uid());
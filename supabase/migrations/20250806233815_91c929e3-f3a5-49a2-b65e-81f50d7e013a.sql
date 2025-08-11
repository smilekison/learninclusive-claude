-- Clear existing data and add proper demo data with disability support

-- Clear all existing data
TRUNCATE TABLE public.student_enrollments CASCADE;
TRUNCATE TABLE public.subjects CASCADE;
TRUNCATE TABLE public.classes CASCADE;
TRUNCATE TABLE public.profiles CASCADE;

-- Insert demo users with proper structure using existing table columns
INSERT INTO public.profiles (id, user_id, first_name, last_name, role, school_name, disabilities, parent_email) VALUES
-- Principal
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Sarah', 'Johnson', 'principal', 'Lincoln Elementary School', '{}', NULL),

-- Teachers
('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'Michael', 'Davis', 'teacher', 'Lincoln Elementary School', '{}', NULL),
('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', 'Emily', 'Rodriguez', 'teacher', 'Lincoln Elementary School', '{}', NULL),
('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440004', 'David', 'Thompson', 'teacher', 'Lincoln Elementary School', '{}', NULL),

-- Students with various disabilities
('550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440005', 'Alex', 'Smith', 'student', 'Lincoln Elementary School', '{"dyslexia", "reading_difficulty"}', 'robert.smith@parent.edu'),
('550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440006', 'Maria', 'Garcia', 'student', 'Lincoln Elementary School', '{"visual_impairment", "low_vision"}', 'jennifer.garcia@parent.edu'),
('550e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440007', 'James', 'Wilson', 'student', 'Lincoln Elementary School', '{"adhd", "attention_deficit"}', 'william.wilson@parent.edu'),
('550e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440008', 'Emma', 'Brown', 'student', 'Lincoln Elementary School', '{}', 'emma.brown.parent@parent.edu'),
('550e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440009', 'Joshua', 'Miller', 'student', 'Lincoln Elementary School', '{"hearing_impairment", "partial_hearing_loss"}', 'joshua.miller.parent@parent.edu'),
('550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440010', 'Sophia', 'Davis', 'student', 'Lincoln Elementary School', '{"autism", "social_communication_needs"}', 'sophia.davis.parent@parent.edu'),

-- Parents
('550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440011', 'Robert', 'Smith', 'parent', 'Lincoln Elementary School', '{}', NULL),
('550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440012', 'Jennifer', 'Garcia', 'parent', 'Lincoln Elementary School', '{}', NULL),
('550e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440013', 'William', 'Wilson', 'parent', 'Lincoln Elementary School', '{}', NULL);

-- Insert demo classes
INSERT INTO public.classes (id, name, teacher_id, description) VALUES
('class-550e8400-e29b-41d4-a716-446655440001', '5th Grade Math', '550e8400-e29b-41d4-a716-446655440002', 'Advanced mathematics for 5th grade students'),
('class-550e8400-e29b-41d4-a716-446655440002', '5th Grade Science', '550e8400-e29b-41d4-a716-446655440003', 'Earth science and basic physics'),
('class-550e8400-e29b-41d4-a716-446655440003', '4th Grade English', '550e8400-e29b-41d4-a716-446655440004', 'Reading comprehension and writing skills'),
('class-550e8400-e29b-41d4-a716-446655440004', '4th Grade Art', '550e8400-e29b-41d4-a716-446655440003', 'Creative arts and expression');

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
INSERT INTO public.student_enrollments (id, student_id, class_id) VALUES
('enroll-550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440005', 'class-550e8400-e29b-41d4-a716-446655440001'),
('enroll-550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440006', 'class-550e8400-e29b-41d4-a716-446655440001'),
('enroll-550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440007', 'class-550e8400-e29b-41d4-a716-446655440002'),
('enroll-550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440008', 'class-550e8400-e29b-41d4-a716-446655440003'),
('enroll-550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440009', 'class-550e8400-e29b-41d4-a716-446655440003'),
('enroll-550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440010', 'class-550e8400-e29b-41d4-a716-446655440004'),
('enroll-550e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440005', 'class-550e8400-e29b-41d4-a716-446655440002'),
('enroll-550e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440006', 'class-550e8400-e29b-41d4-a716-446655440004');

-- Add RLS policies to allow teachers to manage student disabilities
CREATE POLICY "Teachers can update student profiles for disability management" 
ON public.profiles 
FOR UPDATE 
USING (get_user_role() = 'teacher' AND role = 'student');

CREATE POLICY "Teachers can view student profiles for disability management" 
ON public.profiles 
FOR SELECT 
USING (get_user_role() = 'teacher' OR user_id = auth.uid());
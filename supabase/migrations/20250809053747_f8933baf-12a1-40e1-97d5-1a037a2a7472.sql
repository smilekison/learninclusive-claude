-- Clear existing data first
DELETE FROM public.profiles;

-- Insert users into auth.users table
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
(
  '00000000-0000-0000-0000-000000000000'::uuid,
  '11111111-1111-1111-1111-111111111111'::uuid,
  'authenticated',
  'authenticated',
  'principal@school.edu',
  '$2a$10$demo.password.hash.for.testing.purposes.only',
  NOW(),
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  '{"first_name": "Dr. Sarah", "last_name": "Johnson", "role": "principal"}'::jsonb,
  FALSE,
  NOW(),
  NOW()
),
-- Teachers
(
  '00000000-0000-0000-0000-000000000000'::uuid,
  '22222222-2222-2222-2222-222222222222'::uuid,
  'authenticated',
  'authenticated',
  'teacher1@school.edu',
  '$2a$10$demo.password.hash.for.testing.purposes.only',
  NOW(),
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  '{"first_name": "John", "last_name": "Smith", "role": "teacher"}'::jsonb,
  FALSE,
  NOW(),
  NOW()
),
(
  '00000000-0000-0000-0000-000000000000'::uuid,
  '33333333-3333-3333-3333-333333333333'::uuid,
  'authenticated',
  'authenticated',
  'teacher2@school.edu',
  '$2a$10$demo.password.hash.for.testing.purposes.only',
  NOW(),
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  '{"first_name": "Emily", "last_name": "Davis", "role": "teacher"}'::jsonb,
  FALSE,
  NOW(),
  NOW()
),
(
  '00000000-0000-0000-0000-000000000000'::uuid,
  '44444444-4444-4444-4444-444444444444'::uuid,
  'authenticated',
  'authenticated',
  'teacher3@school.edu',
  '$2a$10$demo.password.hash.for.testing.purposes.only',
  NOW(),
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  '{"first_name": "Michael", "last_name": "Brown", "role": "teacher"}'::jsonb,
  FALSE,
  NOW(),
  NOW()
),
(
  '00000000-0000-0000-0000-000000000000'::uuid,
  '55555555-5555-5555-5555-555555555555'::uuid,
  'authenticated',
  'authenticated',
  'teacher4@school.edu',
  '$2a$10$demo.password.hash.for.testing.purposes.only',
  NOW(),
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  '{"first_name": "Lisa", "last_name": "Wilson", "role": "teacher"}'::jsonb,
  FALSE,
  NOW(),
  NOW()
),
(
  '00000000-0000-0000-0000-000000000000'::uuid,
  '66666666-6666-6666-6666-666666666666'::uuid,
  'authenticated',
  'authenticated',
  'teacher5@school.edu',
  '$2a$10$demo.password.hash.for.testing.purposes.only',
  NOW(),
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  '{"first_name": "David", "last_name": "Anderson", "role": "teacher"}'::jsonb,
  FALSE,
  NOW(),
  NOW()
);

-- Insert corresponding profiles
INSERT INTO public.profiles (user_id, first_name, last_name, role, school_name) VALUES
('11111111-1111-1111-1111-111111111111', 'Dr. Sarah', 'Johnson', 'principal', 'Riverside Elementary School'),
('22222222-2222-2222-2222-222222222222', 'John', 'Smith', 'teacher', 'Riverside Elementary School'),
('33333333-3333-3333-3333-333333333333', 'Emily', 'Davis', 'teacher', 'Riverside Elementary School'),
('44444444-4444-4444-4444-444444444444', 'Michael', 'Brown', 'teacher', 'Riverside Elementary School'),
('55555555-5555-5555-5555-555555555555', 'Lisa', 'Wilson', 'teacher', 'Riverside Elementary School'),
('66666666-6666-6666-6666-666666666666', 'David', 'Anderson', 'teacher', 'Riverside Elementary School');

-- Insert school
INSERT INTO public.schools (id, name, principal_id) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Riverside Elementary School', 
 (SELECT id FROM profiles WHERE user_id = '11111111-1111-1111-1111-111111111111'));

-- Insert classes with different teachers
INSERT INTO public.classes (id, name, description, teacher_id, school_id) VALUES
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Grade 3A', 'Third Grade Class A', 
 (SELECT id FROM profiles WHERE user_id = '22222222-2222-2222-2222-222222222222'),
 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Grade 4B', 'Fourth Grade Class B', 
 (SELECT id FROM profiles WHERE user_id = '33333333-3333-3333-3333-333333333333'),
 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Grade 5C', 'Fifth Grade Class C', 
 (SELECT id FROM profiles WHERE user_id = '44444444-4444-4444-4444-444444444444'),
 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');

-- Insert subjects (3 per class = 9 total)
INSERT INTO public.subjects (id, name, description, class_id) VALUES
-- Class 1 subjects
('e1111111-1111-1111-1111-111111111111', 'Mathematics 3A', 'Third grade mathematics curriculum', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
('e2222222-2222-2222-2222-222222222222', 'English Language Arts 3A', 'Reading, writing, and language skills', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
('e3333333-3333-3333-3333-333333333333', 'Science 3A', 'Elementary science exploration', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),

-- Class 2 subjects
('e4444444-4444-4444-4444-444444444444', 'Mathematics 4B', 'Fourth grade mathematics curriculum', 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
('e5555555-5555-5555-5555-555555555555', 'English Language Arts 4B', 'Advanced reading and writing skills', 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
('e6666666-6666-6666-6666-666666666666', 'Social Studies 4B', 'History and geography studies', 'cccccccc-cccc-cccc-cccc-cccccccccccc'),

-- Class 3 subjects
('e7777777-7777-7777-7777-777777777777', 'Mathematics 5C', 'Fifth grade mathematics curriculum', 'dddddddd-dddd-dddd-dddd-dddddddddddd'),
('e8888888-8888-8888-8888-888888888888', 'English Language Arts 5C', 'Comprehensive language arts program', 'dddddddd-dddd-dddd-dddd-dddddddddddd'),
('e9999999-9999-9999-9999-999999999999', 'Science 5C', 'Advanced elementary science concepts', 'dddddddd-dddd-dddd-dddd-dddddddddddd');
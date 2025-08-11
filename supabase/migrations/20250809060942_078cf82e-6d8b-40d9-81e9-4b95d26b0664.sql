-- Simple clean start with step-by-step creation
-- Clear all data first
TRUNCATE public.assignment_submissions CASCADE;
TRUNCATE public.assignments CASCADE;
TRUNCATE public.quiz_attempts CASCADE;
TRUNCATE public.quizzes CASCADE;
TRUNCATE public.materials CASCADE;
TRUNCATE public.lessons CASCADE;
TRUNCATE public.video_progress CASCADE;
TRUNCATE public.video_materials CASCADE;
TRUNCATE public.subject_enrollment_requests CASCADE;
TRUNCATE public.student_subject_enrollments CASCADE;
TRUNCATE public.student_enrollments CASCADE;
TRUNCATE public.subjects CASCADE;
TRUNCATE public.classes CASCADE;
TRUNCATE public.schools CASCADE;
TRUNCATE public.notifications CASCADE;
TRUNCATE public.deleted_items CASCADE;
TRUNCATE public.email_invitations CASCADE;
TRUNCATE public.profiles CASCADE;
DELETE FROM auth.users WHERE email LIKE '%@riverside.edu' OR email LIKE '%@school.edu';

-- Create demo users with proper credentials
-- Principal
INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change_token_current, phone_change_token
) VALUES (
    '00000000-0000-0000-0000-000000000000'::uuid, 
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid, 
    'authenticated', 'authenticated',
    'principal@riverside.edu', 
    crypt('demo123', gen_salt('bf')), 
    NOW(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    jsonb_build_object('first_name', 'Dr. Emily', 'last_name', 'Carter', 'role', 'principal'),
    FALSE, NOW(), NOW(), '', '', '', '', ''
);

-- Teacher 1
INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change_token_current, phone_change_token
) VALUES (
    '00000000-0000-0000-0000-000000000000'::uuid, 
    'b2c3d4e5-f6a7-8901-bcde-f23456789012'::uuid,
    'authenticated', 'authenticated',
    'teacher1@riverside.edu', 
    crypt('demo123', gen_salt('bf')), 
    NOW(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    jsonb_build_object('first_name', 'Michael', 'last_name', 'Thompson', 'role', 'teacher'),
    FALSE, NOW(), NOW(), '', '', '', '', ''
);

-- Teacher 2
INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change_token_current, phone_change_token
) VALUES (
    '00000000-0000-0000-0000-000000000000'::uuid, 
    'c3d4e5f6-a7b8-9012-cdef-345678901234'::uuid,
    'authenticated', 'authenticated',
    'teacher2@riverside.edu', 
    crypt('demo123', gen_salt('bf')), 
    NOW(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    jsonb_build_object('first_name', 'Sarah', 'last_name', 'Johnson', 'role', 'teacher'),
    FALSE, NOW(), NOW(), '', '', '', '', ''
);

-- Students
INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change_token_current, phone_change_token
) VALUES 
(
    '00000000-0000-0000-0000-000000000000'::uuid, 
    'd4e5f6a7-b8c9-0123-def4-56789012345'::uuid,
    'authenticated', 'authenticated',
    'student1@riverside.edu', 
    crypt('demo123', gen_salt('bf')), 
    NOW(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    jsonb_build_object('first_name', 'Alex', 'last_name', 'Martinez', 'role', 'student'),
    FALSE, NOW(), NOW(), '', '', '', '', ''
),
(
    '00000000-0000-0000-0000-000000000000'::uuid, 
    'e5f6a7b8-c9d0-1234-ef56-789012345678'::uuid,
    'authenticated', 'authenticated',
    'student2@riverside.edu', 
    crypt('demo123', gen_salt('bf')), 
    NOW(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    jsonb_build_object('first_name', 'Emma', 'last_name', 'Davis', 'role', 'student'),
    FALSE, NOW(), NOW(), '', '', '', '', ''
),
(
    '00000000-0000-0000-0000-000000000000'::uuid, 
    'f6a7b8c9-d0e1-2345-f678-90123456789a'::uuid,
    'authenticated', 'authenticated',
    'student3@riverside.edu', 
    crypt('demo123', gen_salt('bf')), 
    NOW(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    jsonb_build_object('first_name', 'Jordan', 'last_name', 'Wilson', 'role', 'student'),
    FALSE, NOW(), NOW(), '', '', '', '', ''
);

-- Create corresponding profiles with fixed IDs
INSERT INTO public.profiles (user_id, first_name, last_name, role, school_name) VALUES
('a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid, 'Dr. Emily', 'Carter', 'principal', 'Riverside Academy'),
('b2c3d4e5-f6a7-8901-bcde-f23456789012'::uuid, 'Michael', 'Thompson', 'teacher', NULL),
('c3d4e5f6-a7b8-9012-cdef-345678901234'::uuid, 'Sarah', 'Johnson', 'teacher', NULL),
('d4e5f6a7-b8c9-0123-def4-56789012345'::uuid, 'Alex', 'Martinez', 'student', NULL),
('e5f6a7b8-c9d0-1234-ef56-789012345678'::uuid, 'Emma', 'Davis', 'student', NULL),
('f6a7b8c9-d0e1-2345-f678-90123456789a'::uuid, 'Jordan', 'Wilson', 'student', NULL);
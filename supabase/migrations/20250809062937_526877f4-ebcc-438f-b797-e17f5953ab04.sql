-- Create demo users with simple approach
DO $$
DECLARE
    principal_user_id UUID := gen_random_uuid();
    teacher1_user_id UUID := gen_random_uuid();
    teacher2_user_id UUID := gen_random_uuid();
    student1_user_id UUID := gen_random_uuid();
    student2_user_id UUID := gen_random_uuid();
    student3_user_id UUID := gen_random_uuid();
BEGIN
    -- Clear existing demo data
    DELETE FROM public.profiles WHERE user_id IN (
        SELECT id FROM auth.users WHERE email LIKE '%@riverside.edu'
    );
    DELETE FROM auth.users WHERE email LIKE '%@riverside.edu';

    -- Create demo users with proper password hashing
    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at,
        confirmation_token, recovery_token, email_change_token_new, email_change_token_current, phone_change_token
    ) VALUES 
    ('00000000-0000-0000-0000-000000000000'::uuid, principal_user_id, 'authenticated', 'authenticated',
     'principal@riverside.edu', crypt('demo123', gen_salt('bf')), NOW(),
     '{"provider": "email", "providers": ["email"]}'::jsonb,
     jsonb_build_object('first_name', 'Dr. Emily', 'last_name', 'Carter', 'role', 'principal'),
     FALSE, NOW(), NOW(), '', '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000'::uuid, teacher1_user_id, 'authenticated', 'authenticated',
     'teacher1@riverside.edu', crypt('demo123', gen_salt('bf')), NOW(),
     '{"provider": "email", "providers": ["email"]}'::jsonb,
     jsonb_build_object('first_name', 'Michael', 'last_name', 'Thompson', 'role', 'teacher'),
     FALSE, NOW(), NOW(), '', '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000'::uuid, teacher2_user_id, 'authenticated', 'authenticated',
     'teacher2@riverside.edu', crypt('demo123', gen_salt('bf')), NOW(),
     '{"provider": "email", "providers": ["email"]}'::jsonb,
     jsonb_build_object('first_name', 'Sarah', 'last_name', 'Johnson', 'role', 'teacher'),
     FALSE, NOW(), NOW(), '', '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000'::uuid, student1_user_id, 'authenticated', 'authenticated',
     'student1@riverside.edu', crypt('demo123', gen_salt('bf')), NOW(),
     '{"provider": "email", "providers": ["email"]}'::jsonb,
     jsonb_build_object('first_name', 'Alex', 'last_name', 'Martinez', 'role', 'student'),
     FALSE, NOW(), NOW(), '', '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000'::uuid, student2_user_id, 'authenticated', 'authenticated',
     'student2@riverside.edu', crypt('demo123', gen_salt('bf')), NOW(),
     '{"provider": "email", "providers": ["email"]}'::jsonb,
     jsonb_build_object('first_name', 'Emma', 'last_name', 'Davis', 'role', 'student'),
     FALSE, NOW(), NOW(), '', '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000'::uuid, student3_user_id, 'authenticated', 'authenticated',
     'student3@riverside.edu', crypt('demo123', gen_salt('bf')), NOW(),
     '{"provider": "email", "providers": ["email"]}'::jsonb,
     jsonb_build_object('first_name', 'Jordan', 'last_name', 'Wilson', 'role', 'student'),
     FALSE, NOW(), NOW(), '', '', '', '', '');

    -- Create corresponding profiles (one by one to avoid issues)
    INSERT INTO public.profiles (user_id, first_name, last_name, role, school_name) 
    VALUES (principal_user_id, 'Dr. Emily', 'Carter', 'principal', 'Riverside Academy');
    
    INSERT INTO public.profiles (user_id, first_name, last_name, role) 
    VALUES (teacher1_user_id, 'Michael', 'Thompson', 'teacher');
    
    INSERT INTO public.profiles (user_id, first_name, last_name, role) 
    VALUES (teacher2_user_id, 'Sarah', 'Johnson', 'teacher');
    
    INSERT INTO public.profiles (user_id, first_name, last_name, role) 
    VALUES (student1_user_id, 'Alex', 'Martinez', 'student');
    
    INSERT INTO public.profiles (user_id, first_name, last_name, role) 
    VALUES (student2_user_id, 'Emma', 'Davis', 'student');
    
    INSERT INTO public.profiles (user_id, first_name, last_name, role) 
    VALUES (student3_user_id, 'Jordan', 'Wilson', 'student');

END $$;
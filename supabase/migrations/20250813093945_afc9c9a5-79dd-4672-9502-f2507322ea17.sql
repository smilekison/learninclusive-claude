-- Create demo parent and student users with proper auth records
DO $$
DECLARE
    parent_user_id UUID := 'f47ac10b-58cc-4372-a567-0e02b2c3d479'::uuid;
    student_user_id UUID := 'e47ac10b-58cc-4372-a567-0e02b2c3d478'::uuid;
    parent_profile_id UUID;
    student_profile_id UUID;
    existing_count INTEGER;
BEGIN
    -- Create parent auth user if doesn't exist
    SELECT COUNT(*) INTO existing_count FROM auth.users WHERE email = 'parent@riverside.edu';
    IF existing_count = 0 THEN
        INSERT INTO auth.users (
          instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
          raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at
        ) VALUES (
          '00000000-0000-0000-0000-000000000000'::uuid, parent_user_id,
          'authenticated', 'authenticated', 'parent@riverside.edu',
          '$2a$10$X.5Qw9Qg2yMbZf3Rg8YM9uJ7hL4rZn3kP2fH8vW1xN6jS4dG9cE8a',
          NOW(),
          '{"provider": "email", "providers": ["email"]}'::jsonb,
          '{"first_name": "Sarah", "last_name": "Thompson", "role": "parent"}'::jsonb,
          FALSE, NOW(), NOW()
        );
    END IF;

    -- Create student auth user if doesn't exist
    SELECT COUNT(*) INTO existing_count FROM auth.users WHERE email = 'emma.thompson@riverside.edu';
    IF existing_count = 0 THEN
        INSERT INTO auth.users (
          instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
          raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at
        ) VALUES (
          '00000000-0000-0000-0000-000000000000'::uuid, student_user_id,
          'authenticated', 'authenticated', 'emma.thompson@riverside.edu',
          '$2a$10$X.5Qw9Qg2yMbZf3Rg8YM9uJ7hL4rZn3kP2fH8vW1xN6jS4dG9cE8a',
          NOW(),
          '{"provider": "email", "providers": ["email"]}'::jsonb,
          '{"first_name": "Emma", "last_name": "Thompson", "role": "student"}'::jsonb,
          FALSE, NOW(), NOW()
        );
    END IF;

    -- Create parent profile if doesn't exist
    SELECT COUNT(*) INTO existing_count FROM public.profiles WHERE user_id = parent_user_id;
    IF existing_count = 0 THEN
        INSERT INTO public.profiles (user_id, first_name, last_name, role)
        VALUES (parent_user_id, 'Sarah', 'Thompson', 'parent')
        RETURNING id INTO parent_profile_id;
    ELSE
        SELECT id INTO parent_profile_id FROM public.profiles WHERE user_id = parent_user_id;
    END IF;

    -- Create student profile if doesn't exist
    SELECT COUNT(*) INTO existing_count FROM public.profiles WHERE user_id = student_user_id;
    IF existing_count = 0 THEN
        INSERT INTO public.profiles (user_id, first_name, last_name, role, parent_email)
        VALUES (student_user_id, 'Emma', 'Thompson', 'student', 'parent@riverside.edu')
        RETURNING id INTO student_profile_id;
    ELSE
        SELECT id INTO student_profile_id FROM public.profiles WHERE user_id = student_user_id;
    END IF;

    -- Create parent-student relationship if it doesn't exist
    SELECT COUNT(*) INTO existing_count 
    FROM public.parent_student_relationships 
    WHERE parent_id = parent_profile_id AND student_id = student_profile_id;
    
    IF existing_count = 0 THEN
        INSERT INTO public.parent_student_relationships (parent_id, student_id, relationship_type)
        VALUES (parent_profile_id, student_profile_id, 'parent');
    END IF;

    RAISE NOTICE 'Demo users created successfully';
END $$;
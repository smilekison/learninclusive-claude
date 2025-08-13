-- Create demo parent user step by step
DO $$
DECLARE
    parent_user_id UUID := 'f47ac10b-58cc-4372-a567-0e02b2c3d479'::uuid;
    student_user_id UUID := gen_random_uuid();
    parent_profile_id UUID;
    student_profile_id UUID;
    existing_parent_count INTEGER;
    existing_student_count INTEGER;
BEGIN
    -- Check if parent user already exists
    SELECT COUNT(*) INTO existing_parent_count 
    FROM auth.users 
    WHERE email = 'parent@riverside.edu';
    
    -- Create parent user if doesn't exist
    IF existing_parent_count = 0 THEN
        INSERT INTO auth.users (
          instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
          raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at
        ) VALUES (
          '00000000-0000-0000-0000-000000000000'::uuid,
          parent_user_id,
          'authenticated', 'authenticated', 'parent@riverside.edu',
          '$2a$10$X.5Qw9Qg2yMbZf3Rg8YM9uJ7hL4rZn3kP2fH8vW1xN6jS4dG9cE8a',
          NOW(),
          '{"provider": "email", "providers": ["email"]}'::jsonb,
          '{"first_name": "Sarah", "last_name": "Thompson", "role": "parent"}'::jsonb,
          FALSE, NOW(), NOW()
        );
    END IF;

    -- Check if parent profile exists
    SELECT COUNT(*) INTO existing_parent_count 
    FROM public.profiles 
    WHERE user_id = parent_user_id;
    
    -- Create parent profile if doesn't exist
    IF existing_parent_count = 0 THEN
        INSERT INTO public.profiles (user_id, first_name, last_name, role)
        VALUES (parent_user_id, 'Sarah', 'Thompson', 'parent')
        RETURNING id INTO parent_profile_id;
    ELSE
        SELECT id INTO parent_profile_id 
        FROM public.profiles 
        WHERE user_id = parent_user_id;
    END IF;

    -- Check if Emma Thompson student exists
    SELECT COUNT(*) INTO existing_student_count 
    FROM public.profiles 
    WHERE first_name = 'Emma' AND last_name = 'Thompson' AND role = 'student';
    
    -- Create Emma Thompson student if doesn't exist
    IF existing_student_count = 0 THEN
        INSERT INTO public.profiles (user_id, first_name, last_name, role, parent_email)
        VALUES (student_user_id, 'Emma', 'Thompson', 'student', 'parent@riverside.edu')
        RETURNING id INTO student_profile_id;
    ELSE
        SELECT id INTO student_profile_id 
        FROM public.profiles 
        WHERE first_name = 'Emma' AND last_name = 'Thompson' AND role = 'student'
        LIMIT 1;
    END IF;

    -- Create parent-student relationship if it doesn't exist
    INSERT INTO public.parent_student_relationships (parent_id, student_id, relationship_type)
    SELECT parent_profile_id, student_profile_id, 'parent'
    WHERE NOT EXISTS (
        SELECT 1 FROM public.parent_student_relationships 
        WHERE parent_id = parent_profile_id AND student_id = student_profile_id
    );

    RAISE NOTICE 'Created parent user: %, profile: %, student: %, relationship created', 
                 parent_user_id, parent_profile_id, student_profile_id;
END $$;
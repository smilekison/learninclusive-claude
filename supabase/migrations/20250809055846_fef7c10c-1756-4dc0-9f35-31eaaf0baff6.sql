-- Complete cleanup and recreation of demo users
DO $$
DECLARE
    user_record RECORD;
    principal_id UUID;
    teacher_id UUID;
    i INTEGER;
BEGIN
    -- Delete all profiles for school.edu users first
    FOR user_record IN SELECT id FROM auth.users WHERE email LIKE '%@school.edu' LOOP
        DELETE FROM public.profiles WHERE user_id = user_record.id;
    END LOOP;
    
    -- Delete all school.edu auth users
    DELETE FROM auth.users WHERE email LIKE '%@school.edu';
    
    -- Create principal user with @riverside.edu
    principal_id := gen_random_uuid();
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
        updated_at,
        confirmation_token,
        recovery_token,
        email_change_token_new,
        email_change_token_current,
        phone_change_token
    ) VALUES (
        '00000000-0000-0000-0000-000000000000'::uuid,
        principal_id,
        'authenticated',
        'authenticated',
        'principal@riverside.edu',
        crypt('demo123', gen_salt('bf')),
        NOW(),
        '{"provider": "email", "providers": ["email"]}'::jsonb,
        jsonb_build_object(
            'first_name', 'Dr. Sarah',
            'last_name', 'Johnson',
            'role', 'principal',
            'school_name', 'Riverside Elementary'
        ),
        FALSE,
        NOW(),
        NOW(),
        '',
        '',
        '',
        '',
        ''
    );

    -- Create principal profile
    INSERT INTO public.profiles (user_id, first_name, last_name, role, school_name)
    VALUES (principal_id, 'Dr. Sarah', 'Johnson', 'principal', 'Riverside Elementary');

    -- Create 5 teacher users
    FOR i IN 1..5 LOOP
        teacher_id := gen_random_uuid();
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
            updated_at,
            confirmation_token,
            recovery_token,
            email_change_token_new,
            email_change_token_current,
            phone_change_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000'::uuid,
            teacher_id,
            'authenticated',
            'authenticated',
            'teacher' || i || '@riverside.edu',
            crypt('demo123', gen_salt('bf')),
            NOW(),
            '{"provider": "email", "providers": ["email"]}'::jsonb,
            jsonb_build_object(
                'first_name', 'Teacher',
                'last_name', 'User ' || i,
                'role', 'teacher'
            ),
            FALSE,
            NOW(),
            NOW(),
            '',
            '',
            '',
            '',
            ''
        );

        -- Create teacher profile
        INSERT INTO public.profiles (user_id, first_name, last_name, role)
        VALUES (teacher_id, 'Teacher', 'User ' || i, 'teacher');
    END LOOP;
END $$;
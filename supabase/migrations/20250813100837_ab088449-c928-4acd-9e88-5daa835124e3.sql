-- Fix parent login credentials and ensure demo users exist
DO $$
DECLARE
    parent_auth_id UUID;
    teacher_auth_id UUID;
    student_auth_id UUID;
BEGIN
    -- Update parent@riverside.edu password hash for demo123
    UPDATE auth.users 
    SET encrypted_password = crypt('demo123', gen_salt('bf'))
    WHERE email = 'parent@riverside.edu';
    
    -- Ensure teacher1@riverside.edu exists with demo123 password
    SELECT id INTO teacher_auth_id FROM auth.users WHERE email = 'teacher1@riverside.edu';
    IF teacher_auth_id IS NULL THEN
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
            confirmation_token, recovery_token, email_change_token_new, email_change,
            phone_change, phone_change_token, email_change_token_current,
            reauthentication_token, raw_app_meta_data, raw_user_meta_data,
            is_super_admin, created_at, updated_at, is_anonymous
        ) VALUES (
            '00000000-0000-0000-0000-000000000000'::uuid, gen_random_uuid(),
            'authenticated', 'authenticated', 'teacher1@riverside.edu',
            crypt('demo123', gen_salt('bf')), NOW(),
            '', '', '', '', '', '', '', '',
            '{"provider": "email", "providers": ["email"]}'::jsonb,
            jsonb_build_object('first_name', 'John', 'last_name', 'Smith', 'role', 'teacher'),
            FALSE, NOW(), NOW(), FALSE
        ) RETURNING id INTO teacher_auth_id;
        
        -- Create teacher profile
        INSERT INTO profiles (user_id, first_name, last_name, role, is_active)
        VALUES (teacher_auth_id, 'John', 'Smith', 'teacher', true);
    ELSE
        -- Update existing teacher password
        UPDATE auth.users 
        SET encrypted_password = crypt('demo123', gen_salt('bf'))
        WHERE id = teacher_auth_id;
    END IF;
    
    -- Ensure student1@riverside.edu exists with demo123 password
    SELECT id INTO student_auth_id FROM auth.users WHERE email = 'student1@riverside.edu';
    IF student_auth_id IS NULL THEN
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
            confirmation_token, recovery_token, email_change_token_new, email_change,
            phone_change, phone_change_token, email_change_token_current,
            reauthentication_token, raw_app_meta_data, raw_user_meta_data,
            is_super_admin, created_at, updated_at, is_anonymous
        ) VALUES (
            '00000000-0000-0000-0000-000000000000'::uuid, gen_random_uuid(),
            'authenticated', 'authenticated', 'student1@riverside.edu',
            crypt('demo123', gen_salt('bf')), NOW(),
            '', '', '', '', '', '', '', '',
            '{"provider": "email", "providers": ["email"]}'::jsonb,
            jsonb_build_object('first_name', 'Alex', 'last_name', 'Johnson', 'role', 'student'),
            FALSE, NOW(), NOW(), FALSE
        ) RETURNING id INTO student_auth_id;
        
        -- Create student profile
        INSERT INTO profiles (user_id, first_name, last_name, role, is_active)
        VALUES (student_auth_id, 'Alex', 'Johnson', 'student', true);
    ELSE
        -- Update existing student password
        UPDATE auth.users 
        SET encrypted_password = crypt('demo123', gen_salt('bf'))
        WHERE id = student_auth_id;
    END IF;
    
    RAISE NOTICE 'Demo credentials updated for all user types';
END $$;
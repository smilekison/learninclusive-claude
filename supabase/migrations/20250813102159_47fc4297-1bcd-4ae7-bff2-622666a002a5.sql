-- Link Sarah Thompson (parent) with Alex Martinez (student) - Fixed version
DO $$
DECLARE
    parent_profile_id UUID;
    student_profile_id UUID;
    class_id_var UUID;
BEGIN
    -- Get Sarah Thompson's profile ID (parent@riverside.edu)
    SELECT p.id INTO parent_profile_id 
    FROM profiles p
    JOIN auth.users u ON p.user_id = u.id
    WHERE u.email = 'parent@riverside.edu' AND p.role = 'parent';
    
    -- Find Alex Johnson and update to Alex Martinez
    SELECT p.id INTO student_profile_id 
    FROM profiles p
    WHERE p.first_name = 'Alex' AND p.role = 'student';
    
    -- Update Alex's last name to Martinez if found
    IF student_profile_id IS NOT NULL THEN
        UPDATE profiles 
        SET last_name = 'Martinez', 
            parent_email = 'parent@riverside.edu',
            updated_at = NOW()
        WHERE id = student_profile_id;
    END IF;
    
    -- If still no student found, create Alex Martinez
    IF student_profile_id IS NULL THEN
        -- First, create auth user for Alex Martinez
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
            confirmation_token, recovery_token, email_change_token_new, email_change,
            phone_change, phone_change_token, email_change_token_current,
            reauthentication_token, raw_app_meta_data, raw_user_meta_data,
            is_super_admin, created_at, updated_at, is_anonymous
        ) VALUES (
            '00000000-0000-0000-0000-000000000000'::uuid, gen_random_uuid(),
            'authenticated', 'authenticated', 'alex.martinez@riverside.edu',
            crypt('demo123', gen_salt('bf')), NOW(),
            '', '', '', '', '', '', '', '',
            '{"provider": "email", "providers": ["email"]}'::jsonb,
            jsonb_build_object('first_name', 'Alex', 'last_name', 'Martinez', 'role', 'student'),
            FALSE, NOW(), NOW(), FALSE
        );
        
        -- Create student profile
        INSERT INTO profiles (user_id, first_name, last_name, role, parent_email, is_active)
        SELECT u.id, 'Alex', 'Martinez', 'student', 'parent@riverside.edu', true
        FROM auth.users u
        WHERE u.email = 'alex.martinez@riverside.edu'
        RETURNING id INTO student_profile_id;
    END IF;
    
    -- Create or update parent-student relationship
    INSERT INTO parent_student_relationships (parent_id, student_id, relationship_type)
    VALUES (parent_profile_id, student_profile_id, 'parent')
    ON CONFLICT DO NOTHING;
    
    -- Get a class ID for enrollment
    SELECT id INTO class_id_var FROM classes LIMIT 1;
    
    -- Ensure Alex is enrolled in a class for demo data
    IF class_id_var IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM student_enrollments 
        WHERE student_id = student_profile_id AND class_id = class_id_var
    ) THEN
        INSERT INTO student_enrollments (student_id, class_id, status, enrolled_at)
        VALUES (student_profile_id, class_id_var, 'active', NOW());
    END IF;
    
    RAISE NOTICE 'Alex Martinez linked to Sarah Thompson successfully. Parent ID: %, Student ID: %', parent_profile_id, student_profile_id;
END $$;
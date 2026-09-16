-- Clear existing data in proper order to avoid foreign key constraints
DELETE FROM subjects;
DELETE FROM classes;
DELETE FROM schools;
DELETE FROM profiles;
DELETE FROM auth.users WHERE email LIKE '%@school.edu';

-- Step 1: Create Principal
DO $$
DECLARE
    principal_user_id UUID := gen_random_uuid();
    principal_profile_id UUID;
    school_id UUID;
    teacher_ids UUID[] := ARRAY[]::UUID[];
    class_ids UUID[] := ARRAY[]::UUID[];
    teacher_user_id UUID;
    teacher_profile_id UUID;
    class_id UUID;
    i INTEGER;
    j INTEGER;
BEGIN
    -- Insert Principal into auth.users
    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password,
        email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
        is_super_admin, created_at, updated_at
    ) VALUES (
        '00000000-0000-0000-0000-000000000000'::uuid,
        principal_user_id, 'authenticated', 'authenticated',
        'principal@school.edu', '$2a$10$demo.password.hash.for.testing.purposes.only',
        NOW(), '{"provider": "email", "providers": ["email"]}'::jsonb,
        jsonb_build_object('first_name', 'Sarah', 'last_name', 'Johnson', 'role', 'principal', 'school_name', 'Demo Elementary School'),
        FALSE, NOW(), NOW()
    ) ON CONFLICT DO NOTHING;

    -- Insert Principal profile
    INSERT INTO profiles (user_id, first_name, last_name, role, school_name)
    VALUES (principal_user_id, 'Sarah', 'Johnson', 'principal', 'Demo Elementary School')
    ON CONFLICT (user_id) DO NOTHING
    RETURNING id INTO principal_profile_id;

    -- If principal already exists, get the ID
    IF principal_profile_id IS NULL THEN
        SELECT id INTO principal_profile_id FROM profiles WHERE user_id = principal_user_id;
    END IF;

    -- Create school
    INSERT INTO schools (name, principal_id)
    VALUES ('Demo Elementary School', principal_profile_id)
    ON CONFLICT DO NOTHING
    RETURNING id INTO school_id;

    -- If school already exists, get the ID
    IF school_id IS NULL THEN
        SELECT id INTO school_id FROM schools WHERE name = 'Demo Elementary School';
    END IF;

    -- Create 5 Teachers
    FOR i IN 1..5 LOOP
        teacher_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password,
            email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
            is_super_admin, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000'::uuid,
            teacher_user_id, 'authenticated', 'authenticated',
            'teacher' || i || '@school.edu', '$2a$10$demo.password.hash.for.testing.purposes.only',
            NOW(), '{"provider": "email", "providers": ["email"]}'::jsonb,
            jsonb_build_object('first_name', 'Teacher', 'last_name', 'Name' || i, 'role', 'teacher'),
            FALSE, NOW(), NOW()
        ) ON CONFLICT DO NOTHING;

        INSERT INTO profiles (user_id, first_name, last_name, role)
        VALUES (teacher_user_id, 'Teacher', 'Name' || i, 'teacher')
        ON CONFLICT (user_id) DO NOTHING
        RETURNING id INTO teacher_profile_id;
        
        -- If teacher already exists, get the ID
        IF teacher_profile_id IS NULL THEN
            SELECT id INTO teacher_profile_id FROM profiles WHERE user_id = teacher_user_id;
        END IF;
        
        teacher_ids := array_append(teacher_ids, teacher_profile_id);
    END LOOP;

    -- Create 3 Classes
    FOR i IN 1..3 LOOP
        INSERT INTO classes (name, description, teacher_id, school_id)
        VALUES (
            'Class ' || i || 'A',
            'Description for Class ' || i || 'A',
            teacher_ids[i],
            school_id
        )
        RETURNING id INTO class_id;
        
        class_ids := array_append(class_ids, class_id);
    END LOOP;

    -- Create 3 subjects per class (9 total)
    FOR i IN 1..3 LOOP
        FOR j IN 1..3 LOOP
            INSERT INTO subjects (name, description, class_id)
            VALUES (
                CASE j
                    WHEN 1 THEN 'Mathematics'
                    WHEN 2 THEN 'English Language Arts'
                    WHEN 3 THEN 'Science'
                END || ' - Class ' || i || 'A',
                'Course description for ' || 
                CASE j
                    WHEN 1 THEN 'Mathematics'
                    WHEN 2 THEN 'English Language Arts'
                    WHEN 3 THEN 'Science'
                END || ' in Class ' || i || 'A',
                class_ids[i]
            );
        END LOOP;
    END LOOP;

    -- Validation
    IF (SELECT COUNT(*) FROM profiles WHERE role = 'principal') = 0 THEN
        RAISE EXCEPTION 'Failed to create principal';
    END IF;
    
    IF (SELECT COUNT(*) FROM profiles WHERE role = 'teacher') < 5 THEN
        RAISE EXCEPTION 'Failed to create all teachers';
    END IF;
    
    IF (SELECT COUNT(*) FROM classes) < 3 THEN
        RAISE EXCEPTION 'Failed to create all classes';
    END IF;
    
    IF (SELECT COUNT(*) FROM subjects) < 9 THEN
        RAISE EXCEPTION 'Failed to create all subjects';
    END IF;

    RAISE NOTICE 'Successfully created: 1 principal, 5 teachers, 3 classes, and 9 subjects';
END $$;
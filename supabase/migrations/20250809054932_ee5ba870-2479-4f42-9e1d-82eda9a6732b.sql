-- Use the existing create_demo_user function to populate the database
DO $$
DECLARE
    principal_profile_id UUID;
    school_id UUID;
    teacher_ids UUID[] := ARRAY[]::UUID[];
    class_ids UUID[] := ARRAY[]::UUID[];
    teacher_profile_id UUID;
    class_id UUID;
    i INTEGER;
    j INTEGER;
BEGIN
    -- Create Principal using existing function
    PERFORM create_demo_user(
        'principal@school.edu',
        'password123',
        'Sarah',
        'Johnson',
        'principal',
        'Demo Elementary School'
    );

    -- Get principal profile ID
    SELECT id INTO principal_profile_id FROM profiles WHERE role = 'principal' LIMIT 1;

    -- Create school
    INSERT INTO schools (name, principal_id)
    VALUES ('Demo Elementary School', principal_profile_id)
    RETURNING id INTO school_id;

    -- Create 5 Teachers using existing function
    FOR i IN 1..5 LOOP
        PERFORM create_demo_user(
            'teacher' || i || '@school.edu',
            'password123',
            'Teacher',
            'Name' || i,
            'teacher'
        );
        
        -- Get the teacher profile ID
        SELECT id INTO teacher_profile_id FROM profiles 
        WHERE role = 'teacher' AND first_name = 'Teacher' AND last_name = 'Name' || i;
        
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

    RAISE NOTICE 'Successfully created: 1 principal, 5 teachers, 1 school, 3 classes, and 9 subjects';
END $$;
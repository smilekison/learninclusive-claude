-- Link Alex Johnson (student1) to parent account for demo
DO $$
DECLARE
    parent_profile_id UUID;
    student_profile_id UUID;
BEGIN
    -- Get parent profile ID
    SELECT p.id INTO parent_profile_id 
    FROM profiles p
    JOIN auth.users u ON p.user_id = u.id
    WHERE u.email = 'parent@riverside.edu';
    
    -- Get Alex Johnson's profile ID
    SELECT p.id INTO student_profile_id 
    FROM profiles p
    JOIN auth.users u ON p.user_id = u.id
    WHERE u.email = 'student1@riverside.edu';
    
    -- Update Alex's profile to have the parent email
    UPDATE profiles 
    SET parent_email = 'parent@riverside.edu'
    WHERE id = student_profile_id;
    
    -- Create parent-student relationship
    INSERT INTO parent_student_relationships (parent_id, student_id, relationship_type)
    VALUES (parent_profile_id, student_profile_id, 'parent')
    ON CONFLICT DO NOTHING;
    
    -- Ensure Alex is enrolled in a class for demo data
    INSERT INTO student_enrollments (student_id, class_id, status, enrolled_at)
    SELECT student_profile_id, c.id, 'active', NOW()
    FROM classes c
    WHERE c.name ILIKE '%math%' OR c.name ILIKE '%science%'
    LIMIT 1
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Alex Johnson linked to parent account successfully';
END $$;
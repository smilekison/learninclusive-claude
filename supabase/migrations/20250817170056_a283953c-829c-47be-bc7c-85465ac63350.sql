-- Create parent-student relationship with existing user and Alex Smith (student with most analytics)
DO $$
DECLARE
    parent_profile_id UUID;
BEGIN
    -- Get the profile ID for the existing parent user
    SELECT p.id INTO parent_profile_id 
    FROM profiles p
    JOIN auth.users u ON p.user_id = u.id
    WHERE u.email = 'sarah.smith@parent.com';

    -- If no profile exists, create one
    IF parent_profile_id IS NULL THEN
        INSERT INTO profiles (user_id, first_name, last_name, role)
        SELECT u.id, 'Sarah', 'Smith', 'parent'
        FROM auth.users u
        WHERE u.email = 'sarah.smith@parent.com'
        RETURNING id INTO parent_profile_id;
    END IF;

    -- Create parent-student relationship with Alex Smith (who has the most analytics data: 14 submissions)
    INSERT INTO parent_student_relationships (parent_id, student_id, relationship_type)
    VALUES (
        parent_profile_id,
        '2930cd5c-69c2-4e0d-9d43-82a9887ac39e'::uuid,
        'parent'
    )
    ON CONFLICT (parent_id, student_id) DO NOTHING;

    -- Also update the student's parent_email to match
    UPDATE profiles 
    SET parent_email = 'sarah.smith@parent.com'
    WHERE id = '2930cd5c-69c2-4e0d-9d43-82a9887ac39e';
    
END $$;
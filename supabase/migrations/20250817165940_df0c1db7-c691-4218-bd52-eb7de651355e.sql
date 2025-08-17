-- Create a new parent using the existing demo user function and assign Alex Smith (student with most analytics)
DO $$
DECLARE
    new_user_id UUID;
    parent_profile_id UUID;
BEGIN
    -- Create the demo parent user
    SELECT create_demo_user(
        'sarah.smith@parent.com',
        'demo123',
        'Sarah',
        'Smith',
        'parent',
        NULL
    ) INTO new_user_id;

    -- Get the profile ID for this parent
    SELECT id INTO parent_profile_id 
    FROM profiles 
    WHERE user_id = new_user_id;

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
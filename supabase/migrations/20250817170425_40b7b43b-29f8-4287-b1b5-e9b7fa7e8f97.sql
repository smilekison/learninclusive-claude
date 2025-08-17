-- Use the existing working parent user and create relationship with Alex Smith
-- Clean up and use the existing parent@riverside.edu user that we know works
DO $$
DECLARE
    existing_parent_profile_id UUID;
BEGIN
    -- Get the existing parent profile that we know works (from the network logs, parent@riverside.edu is working)
    SELECT id INTO existing_parent_profile_id 
    FROM profiles 
    WHERE user_id = (SELECT id FROM auth.users WHERE email = 'parent@riverside.edu')
    AND role = 'parent';

    -- Create parent-student relationship with Alex Smith (who has the most analytics data)
    INSERT INTO parent_student_relationships (parent_id, student_id, relationship_type)
    VALUES (
        existing_parent_profile_id,
        '2930cd5c-69c2-4e0d-9d43-82a9887ac39e'::uuid,
        'parent'
    )
    ON CONFLICT (parent_id, student_id) DO NOTHING;

    -- Update Alex Smith's parent_email to match the working parent
    UPDATE profiles 
    SET parent_email = 'parent@riverside.edu'
    WHERE id = '2930cd5c-69c2-4e0d-9d43-82a9887ac39e';
    
    -- Let's also make sure Alex Smith has some demo assignment data
    -- Check if we need to create some sample data for this student
    
END $$;
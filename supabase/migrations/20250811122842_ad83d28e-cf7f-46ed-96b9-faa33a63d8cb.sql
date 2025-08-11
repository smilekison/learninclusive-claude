-- Check if Alex Martinez already exists
DO $$
DECLARE
    alex_profile_id uuid;
    testing_class_id uuid := 'b9e573e1-d724-43b9-a88d-031c1405e62c';
BEGIN
    -- Try to find existing Alex Martinez profile
    SELECT id INTO alex_profile_id 
    FROM profiles 
    WHERE first_name = 'Alex' AND last_name = 'Martinez' AND role = 'student';
    
    -- If not found, create the profile
    IF alex_profile_id IS NULL THEN
        INSERT INTO profiles (first_name, last_name, role, user_id)
        VALUES ('Alex', 'Martinez', 'student', gen_random_uuid())
        RETURNING id INTO alex_profile_id;
    END IF;
    
    -- Check if already enrolled
    IF NOT EXISTS (
        SELECT 1 FROM student_enrollments 
        WHERE student_id = alex_profile_id AND class_id = testing_class_id
    ) THEN
        -- Enroll Alex in the testing class
        INSERT INTO student_enrollments (student_id, class_id, status)
        VALUES (alex_profile_id, testing_class_id, 'active');
    END IF;
END $$;
-- Create demo assignments and grades for Emma Thompson (fixed)
DO $$
DECLARE
    emma_id UUID;
    teacher_id UUID;
    demo_class_id UUID;
    subject_math_id UUID;
    subject_science_id UUID;
    assignment1_id UUID;
    assignment2_id UUID;
BEGIN
    -- Get Emma's profile ID
    SELECT id INTO emma_id 
    FROM profiles 
    WHERE first_name = 'Emma' AND last_name = 'Thompson' AND role = 'student'
    LIMIT 1;
    
    -- Get a teacher ID
    SELECT id INTO teacher_id 
    FROM profiles 
    WHERE role = 'teacher' 
    LIMIT 1;
    
    -- Create a class if none exists for Emma
    SELECT id INTO demo_class_id FROM classes WHERE is_active = true LIMIT 1;
    IF demo_class_id IS NULL THEN
        INSERT INTO classes (name, description, teacher_id, is_active)
        VALUES ('Grade 5A', 'Grade 5 Advanced Class', teacher_id, true)
        RETURNING id INTO demo_class_id;
    END IF;
    
    -- Enroll Emma in the class
    INSERT INTO student_enrollments (student_id, class_id, status)
    SELECT emma_id, demo_class_id, 'active'
    WHERE NOT EXISTS (
        SELECT 1 FROM student_enrollments se
        WHERE se.student_id = emma_id AND se.class_id = demo_class_id
    );
    
    -- Create Math subject
    INSERT INTO subjects (name, description, class_id, is_active)
    VALUES ('Mathematics', 'Grade 5 Mathematics', demo_class_id, true)
    RETURNING id INTO subject_math_id;
    
    -- Create Science subject  
    INSERT INTO subjects (name, description, class_id, is_active)
    VALUES ('Science', 'Grade 5 Science', demo_class_id, true)
    RETURNING id INTO subject_science_id;
    
    -- Create Math assignment
    INSERT INTO assignments (title, description, subject_id, max_score, due_date, is_active)
    VALUES (
        'Fractions Worksheet', 
        'Practice problems on adding and subtracting fractions',
        subject_math_id,
        100,
        CURRENT_DATE + INTERVAL '3 days',
        true
    ) RETURNING id INTO assignment1_id;
    
    -- Create Science assignment
    INSERT INTO assignments (title, description, subject_id, max_score, due_date, is_active)
    VALUES (
        'Plant Growth Lab Report',
        'Document observations from the plant growth experiment', 
        subject_science_id,
        100,
        CURRENT_DATE - INTERVAL '2 days',
        true
    ) RETURNING id INTO assignment2_id;
    
    -- Create submissions with grades
    INSERT INTO assignment_submissions (
        assignment_id, student_id, submission_text, score, feedback,
        submitted_at, graded_at, graded_by, submission_quality
    ) VALUES (
        assignment2_id, emma_id,
        'I observed that the plants in sunlight grew 3 inches in the first week, while plants in shade only grew 1 inch. The leaves were greener in the sunlight group...',
        95, 'Excellent observation skills and detailed documentation! Great work on recording measurements daily.',
        CURRENT_DATE - INTERVAL '1 day',
        CURRENT_DATE,
        teacher_id,
        'excellent'
    );
    
    -- Create pending assignment submission
    INSERT INTO assignment_submissions (
        assignment_id, student_id, submission_text, submitted_at
    ) VALUES (
        assignment1_id, emma_id,
        'I completed all 20 fraction problems. For problem 1: 1/4 + 1/4 = 2/4 = 1/2. For problem 2: 3/8 + 1/8 = 4/8 = 1/2...',
        CURRENT_DATE
    );
    
    RAISE NOTICE 'Demo assignments and grades created for Emma Thompson';
END $$;
-- Create demo assignments and submissions for existing students to test parent portal
DO $$
DECLARE
    demo_student_id UUID;
    demo_teacher_id UUID;
    demo_class_id UUID;
    demo_subject_id UUID;
    demo_assignment_id UUID;
BEGIN
    -- Get an existing student (Alex Martinez)
    SELECT id INTO demo_student_id 
    FROM profiles 
    WHERE first_name = 'Alex' AND last_name = 'Martinez' AND role = 'student'
    LIMIT 1;
    
    -- Get an existing teacher
    SELECT id INTO demo_teacher_id 
    FROM profiles 
    WHERE role = 'teacher'
    LIMIT 1;
    
    -- Create or get a demo class
    INSERT INTO classes (name, description, teacher_id, is_active)
    VALUES ('Grade 5A - Advanced', 'Advanced Grade 5 mathematics class', demo_teacher_id, true)
    ON CONFLICT DO NOTHING;
    
    SELECT id INTO demo_class_id 
    FROM classes 
    WHERE name = 'Grade 5A - Advanced'
    LIMIT 1;
    
    -- Enroll the student in the class
    INSERT INTO student_enrollments (student_id, class_id, status)
    VALUES (demo_student_id, demo_class_id, 'active')
    ON CONFLICT DO NOTHING;
    
    -- Create a demo subject
    INSERT INTO subjects (name, description, class_id, is_active)
    VALUES ('Mathematics', 'Advanced mathematics for grade 5', demo_class_id, true)
    ON CONFLICT DO NOTHING;
    
    SELECT id INTO demo_subject_id 
    FROM subjects 
    WHERE name = 'Mathematics' AND class_id = demo_class_id
    LIMIT 1;
    
    -- Create demo assignments
    INSERT INTO assignments (title, description, subject_id, max_score, due_date, is_active)
    VALUES 
    ('Fractions Worksheet', 'Practice problems on adding and subtracting fractions', demo_subject_id, 100, NOW() + INTERVAL '3 days', true),
    ('Geometry Quiz', 'Quiz on basic geometric shapes and properties', demo_subject_id, 50, NOW() + INTERVAL '1 week', true)
    ON CONFLICT DO NOTHING;
    
    -- Get the first assignment ID
    SELECT id INTO demo_assignment_id 
    FROM assignments 
    WHERE subject_id = demo_subject_id 
    LIMIT 1;
    
    -- Create demo submission
    INSERT INTO assignment_submissions (
        assignment_id, student_id, submission_text, score, feedback, 
        submitted_at, graded_at, graded_by, submission_quality
    )
    VALUES (
        demo_assignment_id, demo_student_id,
        'I completed all fraction problems. For 1/2 + 1/4, I found common denominator 4, so 2/4 + 1/4 = 3/4.',
        95, 'Excellent work! Your method is correct and clearly explained.',
        NOW() - INTERVAL '1 day', NOW() - INTERVAL '6 hours', demo_teacher_id, 'excellent'
    )
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Created demo data for student %, class %, subject %, assignment %', 
                 demo_student_id, demo_class_id, demo_subject_id, demo_assignment_id;
END $$;
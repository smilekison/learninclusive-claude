-- Create demo assignments and submissions for Alex Martinez
DO $$
DECLARE
    student_profile_id UUID;
    subject_id_var UUID;
    assignment_id_var UUID;
BEGIN
    -- Get Alex Martinez's profile ID
    SELECT p.id INTO student_profile_id 
    FROM profiles p
    WHERE p.first_name = 'Alex' AND p.last_name = 'Martinez' AND p.role = 'student';
    
    -- Get a subject ID
    SELECT s.id INTO subject_id_var FROM subjects s LIMIT 1;
    
    -- Create demo assignments if student exists
    IF student_profile_id IS NOT NULL AND subject_id_var IS NOT NULL THEN
        -- Create Math Assignment
        INSERT INTO assignments (title, description, subject_id, due_date, max_score, is_active)
        VALUES (
            'Algebra Fundamentals Quiz',
            'Test your understanding of basic algebraic concepts including variables, equations, and factoring.',
            subject_id_var,
            NOW() + INTERVAL '7 days',
            100,
            true
        ) RETURNING id INTO assignment_id_var;
        
        -- Create submission for this assignment
        INSERT INTO assignment_submissions (
            assignment_id, 
            student_id, 
            submission_text, 
            submitted_at, 
            attempt_number,
            late_submission
        ) VALUES (
            assignment_id_var,
            student_profile_id,
            'Completed all algebraic problems. Showed work for equations 1-15. Applied FOIL method for factoring problems.',
            NOW() - INTERVAL '2 hours',
            1,
            false
        );
        
        -- Create Science Assignment
        INSERT INTO assignments (title, description, subject_id, due_date, max_score, is_active)
        VALUES (
            'Chemistry Lab Report',
            'Write a detailed lab report on the chemical reactions observed during the acid-base neutralization experiment.',
            subject_id_var,
            NOW() + INTERVAL '5 days',
            100,
            true
        ) RETURNING id INTO assignment_id_var;
        
        -- Create submission for science assignment
        INSERT INTO assignment_submissions (
            assignment_id, 
            student_id, 
            submission_text, 
            submitted_at, 
            attempt_number,
            late_submission
        ) VALUES (
            assignment_id_var,
            student_profile_id,
            'Lab Report: Observed color changes during neutralization. pH changed from 2 to 7. Heat was released indicating exothermic reaction.',
            NOW() - INTERVAL '1 day',
            1,
            false
        );
        
        RAISE NOTICE 'Demo assignments and submissions created for Alex Martinez';
    END IF;
END $$;
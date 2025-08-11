-- Complete clean slate approach
DO $$
DECLARE
    principal_id UUID;
    teacher1_id UUID;
    teacher2_id UUID;
    student1_id UUID;
    student2_id UUID;
    student3_id UUID;
    school_id UUID;
    class1_id UUID;
    class2_id UUID;
    subject1_id UUID;
    subject2_id UUID;
    subject3_id UUID;
    assignment1_id UUID;
    assignment2_id UUID;
BEGIN
    -- Disable trigger temporarily to avoid auto-creation of profiles
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

    -- Complete data wipe
    TRUNCATE public.assignment_submissions CASCADE;
    TRUNCATE public.assignments CASCADE;
    TRUNCATE public.quiz_attempts CASCADE;
    TRUNCATE public.quizzes CASCADE;
    TRUNCATE public.materials CASCADE;
    TRUNCATE public.lessons CASCADE;
    TRUNCATE public.video_progress CASCADE;
    TRUNCATE public.video_materials CASCADE;
    TRUNCATE public.subject_enrollment_requests CASCADE;
    TRUNCATE public.student_subject_enrollments CASCADE;
    TRUNCATE public.student_enrollments CASCADE;
    TRUNCATE public.subjects CASCADE;
    TRUNCATE public.classes CASCADE;
    TRUNCATE public.schools CASCADE;
    TRUNCATE public.notifications CASCADE;
    TRUNCATE public.deleted_items CASCADE;
    TRUNCATE public.email_invitations CASCADE;
    TRUNCATE public.profiles CASCADE;
    DELETE FROM auth.users WHERE email LIKE '%@riverside.edu' OR email LIKE '%@school.edu';

    -- Create fresh demo users
    principal_id := gen_random_uuid();
    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at,
        confirmation_token, recovery_token, email_change_token_new, email_change_token_current, phone_change_token
    ) VALUES (
        '00000000-0000-0000-0000-000000000000'::uuid, principal_id, 'authenticated', 'authenticated',
        'principal@riverside.edu', crypt('demo123', gen_salt('bf')), NOW(),
        '{"provider": "email", "providers": ["email"]}'::jsonb,
        jsonb_build_object('first_name', 'Dr. Emily', 'last_name', 'Carter', 'role', 'principal', 'school_name', 'Riverside Academy'),
        FALSE, NOW(), NOW(), '', '', '', '', ''
    );

    teacher1_id := gen_random_uuid();
    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at,
        confirmation_token, recovery_token, email_change_token_new, email_change_token_current, phone_change_token
    ) VALUES (
        '00000000-0000-0000-0000-000000000000'::uuid, teacher1_id, 'authenticated', 'authenticated',
        'teacher1@riverside.edu', crypt('demo123', gen_salt('bf')), NOW(),
        '{"provider": "email", "providers": ["email"]}'::jsonb,
        jsonb_build_object('first_name', 'Michael', 'last_name', 'Thompson', 'role', 'teacher'),
        FALSE, NOW(), NOW(), '', '', '', '', ''
    );

    teacher2_id := gen_random_uuid();
    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at,
        confirmation_token, recovery_token, email_change_token_new, email_change_token_current, phone_change_token
    ) VALUES (
        '00000000-0000-0000-0000-000000000000'::uuid, teacher2_id, 'authenticated', 'authenticated',
        'teacher2@riverside.edu', crypt('demo123', gen_salt('bf')), NOW(),
        '{"provider": "email", "providers": ["email"]}'::jsonb,
        jsonb_build_object('first_name', 'Sarah', 'last_name', 'Johnson', 'role', 'teacher'),
        FALSE, NOW(), NOW(), '', '', '', '', ''
    );

    student1_id := gen_random_uuid();
    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at,
        confirmation_token, recovery_token, email_change_token_new, email_change_token_current, phone_change_token
    ) VALUES (
        '00000000-0000-0000-0000-000000000000'::uuid, student1_id, 'authenticated', 'authenticated',
        'student1@riverside.edu', crypt('demo123', gen_salt('bf')), NOW(),
        '{"provider": "email", "providers": ["email"]}'::jsonb,
        jsonb_build_object('first_name', 'Alex', 'last_name', 'Martinez', 'role', 'student'),
        FALSE, NOW(), NOW(), '', '', '', '', ''
    );

    student2_id := gen_random_uuid();
    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at,
        confirmation_token, recovery_token, email_change_token_new, email_change_token_current, phone_change_token
    ) VALUES (
        '00000000-0000-0000-0000-000000000000'::uuid, student2_id, 'authenticated', 'authenticated',
        'student2@riverside.edu', crypt('demo123', gen_salt('bf')), NOW(),
        '{"provider": "email", "providers": ["email"]}'::jsonb,
        jsonb_build_object('first_name', 'Emma', 'last_name', 'Davis', 'role', 'student'),
        FALSE, NOW(), NOW(), '', '', '', '', ''
    );

    student3_id := gen_random_uuid();
    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at,
        confirmation_token, recovery_token, email_change_token_new, email_change_token_current, phone_change_token
    ) VALUES (
        '00000000-0000-0000-0000-000000000000'::uuid, student3_id, 'authenticated', 'authenticated',
        'student3@riverside.edu', crypt('demo123', gen_salt('bf')), NOW(),
        '{"provider": "email", "providers": ["email"]}'::jsonb,
        jsonb_build_object('first_name', 'Jordan', 'last_name', 'Wilson', 'role', 'student'),
        FALSE, NOW(), NOW(), '', '', '', '', ''
    );

    -- Create profiles manually
    INSERT INTO public.profiles (user_id, first_name, last_name, role, school_name) VALUES
    (principal_id, 'Dr. Emily', 'Carter', 'principal', 'Riverside Academy'),
    (teacher1_id, 'Michael', 'Thompson', 'teacher', NULL),
    (teacher2_id, 'Sarah', 'Johnson', 'teacher', NULL),
    (student1_id, 'Alex', 'Martinez', 'student', NULL),
    (student2_id, 'Emma', 'Davis', 'student', NULL),
    (student3_id, 'Jordan', 'Wilson', 'student', NULL);

    -- Create school
    school_id := gen_random_uuid();
    INSERT INTO public.schools (id, name, principal_id) VALUES
    (school_id, 'Riverside Academy', principal_id);

    -- Create classes
    class1_id := gen_random_uuid();
    INSERT INTO public.classes (id, name, description, teacher_id, school_id) VALUES
    (class1_id, '5th Grade Math', 'Advanced mathematics for 5th grade students', teacher1_id, school_id);

    class2_id := gen_random_uuid();
    INSERT INTO public.classes (id, name, description, teacher_id, school_id) VALUES
    (class2_id, '5th Grade Science', 'Earth and space science exploration', teacher2_id, school_id);

    -- Enroll students in classes
    INSERT INTO public.student_enrollments (student_id, class_id) VALUES
    (student1_id, class1_id),
    (student1_id, class2_id),
    (student2_id, class1_id),
    (student3_id, class2_id);

    -- Create subjects
    subject1_id := gen_random_uuid();
    INSERT INTO public.subjects (id, name, description, class_id, invitation_code) VALUES
    (subject1_id, 'Algebra Fundamentals', 'Introduction to algebraic concepts and problem solving', class1_id, 'MATH5A');

    subject2_id := gen_random_uuid();
    INSERT INTO public.subjects (id, name, description, class_id, invitation_code) VALUES
    (subject2_id, 'Geometry Basics', 'Basic geometric shapes and measurements', class1_id, 'MATH5G');

    subject3_id := gen_random_uuid();
    INSERT INTO public.subjects (id, name, description, class_id, invitation_code) VALUES
    (subject3_id, 'Solar System', 'Exploring planets, moons, and space phenomena', class2_id, 'SCI5S');

    -- Create assignments
    assignment1_id := gen_random_uuid();
    INSERT INTO public.assignments (id, title, description, subject_id, due_date, max_score) VALUES
    (assignment1_id, 'Linear Equations Practice', 'Solve 10 linear equations showing your work', subject1_id, NOW() + INTERVAL '7 days', 100);

    assignment2_id := gen_random_uuid();
    INSERT INTO public.assignments (id, title, description, subject_id, due_date, max_score) VALUES
    (assignment2_id, 'Planet Research Project', 'Choose a planet and create a presentation about its characteristics', subject3_id, NOW() + INTERVAL '14 days', 150);

    -- Create some sample submissions
    INSERT INTO public.assignment_submissions (student_id, assignment_id, submission_text, score, feedback) VALUES
    (student1_id, assignment1_id, 'Completed all 10 problems with detailed work shown.', 95, 'Excellent work! Minor calculation error on problem 7.'),
    (student2_id, assignment1_id, 'Solved 8 out of 10 problems correctly.', 80, 'Good understanding, but review solving for negative coefficients.');

    -- Recreate the trigger
    CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

END $$;
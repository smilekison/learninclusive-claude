-- Final clean approach with generated UUIDs
DO $$
DECLARE
    principal_user_id UUID := gen_random_uuid();
    teacher1_user_id UUID := gen_random_uuid();
    teacher2_user_id UUID := gen_random_uuid();
    student1_user_id UUID := gen_random_uuid();
    student2_user_id UUID := gen_random_uuid();
    student3_user_id UUID := gen_random_uuid();
    
    principal_profile_id UUID;
    teacher1_profile_id UUID;
    teacher2_profile_id UUID;
    student1_profile_id UUID;
    student2_profile_id UUID;
    student3_profile_id UUID;
    
    school_id UUID := gen_random_uuid();
    class1_id UUID := gen_random_uuid();
    class2_id UUID := gen_random_uuid();
    subject1_id UUID := gen_random_uuid();
    subject2_id UUID := gen_random_uuid();
    assignment1_id UUID := gen_random_uuid();
BEGIN
    -- Clear all data first
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

    -- Temporarily drop trigger to prevent auto-creation
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

    -- Create users
    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at,
        confirmation_token, recovery_token, email_change_token_new, email_change_token_current, phone_change_token
    ) VALUES 
    ('00000000-0000-0000-0000-000000000000'::uuid, principal_user_id, 'authenticated', 'authenticated',
     'principal@riverside.edu', crypt('demo123', gen_salt('bf')), NOW(),
     '{"provider": "email", "providers": ["email"]}'::jsonb,
     jsonb_build_object('first_name', 'Dr. Emily', 'last_name', 'Carter', 'role', 'principal'),
     FALSE, NOW(), NOW(), '', '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000'::uuid, teacher1_user_id, 'authenticated', 'authenticated',
     'teacher1@riverside.edu', crypt('demo123', gen_salt('bf')), NOW(),
     '{"provider": "email", "providers": ["email"]}'::jsonb,
     jsonb_build_object('first_name', 'Michael', 'last_name', 'Thompson', 'role', 'teacher'),
     FALSE, NOW(), NOW(), '', '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000'::uuid, teacher2_user_id, 'authenticated', 'authenticated',
     'teacher2@riverside.edu', crypt('demo123', gen_salt('bf')), NOW(),
     '{"provider": "email", "providers": ["email"]}'::jsonb,
     jsonb_build_object('first_name', 'Sarah', 'last_name', 'Johnson', 'role', 'teacher'),
     FALSE, NOW(), NOW(), '', '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000'::uuid, student1_user_id, 'authenticated', 'authenticated',
     'student1@riverside.edu', crypt('demo123', gen_salt('bf')), NOW(),
     '{"provider": "email", "providers": ["email"]}'::jsonb,
     jsonb_build_object('first_name', 'Alex', 'last_name', 'Martinez', 'role', 'student'),
     FALSE, NOW(), NOW(), '', '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000'::uuid, student2_user_id, 'authenticated', 'authenticated',
     'student2@riverside.edu', crypt('demo123', gen_salt('bf')), NOW(),
     '{"provider": "email", "providers": ["email"]}'::jsonb,
     jsonb_build_object('first_name', 'Emma', 'last_name', 'Davis', 'role', 'student'),
     FALSE, NOW(), NOW(), '', '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000'::uuid, student3_user_id, 'authenticated', 'authenticated',
     'student3@riverside.edu', crypt('demo123', gen_salt('bf')), NOW(),
     '{"provider": "email", "providers": ["email"]}'::jsonb,
     jsonb_build_object('first_name', 'Jordan', 'last_name', 'Wilson', 'role', 'student'),
     FALSE, NOW(), NOW(), '', '', '', '', '');

    -- Create profiles
    INSERT INTO public.profiles (user_id, first_name, last_name, role, school_name) VALUES
    (principal_user_id, 'Dr. Emily', 'Carter', 'principal', 'Riverside Academy'),
    (teacher1_user_id, 'Michael', 'Thompson', 'teacher', NULL),
    (teacher2_user_id, 'Sarah', 'Johnson', 'teacher', NULL),
    (student1_user_id, 'Alex', 'Martinez', 'student', NULL),
    (student2_user_id, 'Emma', 'Davis', 'student', NULL),
    (student3_user_id, 'Jordan', 'Wilson', 'student', NULL)
    RETURNING id INTO principal_profile_id;

    -- Get profile IDs for foreign key references
    SELECT id INTO principal_profile_id FROM public.profiles WHERE user_id = principal_user_id;
    SELECT id INTO teacher1_profile_id FROM public.profiles WHERE user_id = teacher1_user_id;
    SELECT id INTO teacher2_profile_id FROM public.profiles WHERE user_id = teacher2_user_id;
    SELECT id INTO student1_profile_id FROM public.profiles WHERE user_id = student1_user_id;
    SELECT id INTO student2_profile_id FROM public.profiles WHERE user_id = student2_user_id;
    SELECT id INTO student3_profile_id FROM public.profiles WHERE user_id = student3_user_id;

    -- Create school with principal reference
    INSERT INTO public.schools (id, name, principal_id) VALUES
    (school_id, 'Riverside Academy', principal_profile_id);

    -- Create classes
    INSERT INTO public.classes (id, name, description, teacher_id, school_id) VALUES
    (class1_id, '5th Grade Math', 'Advanced mathematics for 5th grade students', teacher1_profile_id, school_id),
    (class2_id, '5th Grade Science', 'Earth and space science exploration', teacher2_profile_id, school_id);

    -- Enroll students in classes
    INSERT INTO public.student_enrollments (student_id, class_id) VALUES
    (student1_profile_id, class1_id),
    (student1_profile_id, class2_id),
    (student2_profile_id, class1_id),
    (student3_profile_id, class2_id);

    -- Create subjects
    INSERT INTO public.subjects (id, name, description, class_id, invitation_code) VALUES
    (subject1_id, 'Algebra Fundamentals', 'Introduction to algebraic concepts', class1_id, 'MATH5A'),
    (subject2_id, 'Solar System', 'Exploring planets and space', class2_id, 'SCI5S');

    -- Create assignments
    INSERT INTO public.assignments (id, title, description, subject_id, due_date, max_score) VALUES
    (assignment1_id, 'Linear Equations Practice', 'Solve 10 linear equations showing your work', subject1_id, NOW() + INTERVAL '7 days', 100);

    -- Create sample submission
    INSERT INTO public.assignment_submissions (student_id, assignment_id, submission_text, score, feedback) VALUES
    (student1_profile_id, assignment1_id, 'Completed all 10 problems with work shown.', 95, 'Excellent work!');

    -- Recreate the trigger
    CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

END $$;
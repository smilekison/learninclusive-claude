-- Simple fix: just create working demo users
BEGIN;

-- Clear all existing riverside.edu data completely
DELETE FROM public.assignment_submissions WHERE student_id IN (
    SELECT id FROM public.profiles WHERE user_id IN (
        SELECT id FROM auth.users WHERE email LIKE '%@riverside.edu'
    )
);
DELETE FROM public.assignments WHERE subject_id IN (
    SELECT id FROM public.subjects WHERE class_id IN (
        SELECT id FROM public.classes WHERE teacher_id IN (
            SELECT id FROM public.profiles WHERE user_id IN (
                SELECT id FROM auth.users WHERE email LIKE '%@riverside.edu'
            )
        )
    )
);
DELETE FROM public.student_enrollments WHERE student_id IN (
    SELECT id FROM public.profiles WHERE user_id IN (
        SELECT id FROM auth.users WHERE email LIKE '%@riverside.edu'
    )
);
DELETE FROM public.subjects WHERE class_id IN (
    SELECT id FROM public.classes WHERE teacher_id IN (
        SELECT id FROM public.profiles WHERE user_id IN (
            SELECT id FROM auth.users WHERE email LIKE '%@riverside.edu'
        )
    )
);
DELETE FROM public.classes WHERE teacher_id IN (
    SELECT id FROM public.profiles WHERE user_id IN (
        SELECT id FROM auth.users WHERE email LIKE '%@riverside.edu'
    )
);
DELETE FROM public.schools WHERE principal_id IN (
    SELECT id FROM public.profiles WHERE user_id IN (
        SELECT id FROM auth.users WHERE email LIKE '%@riverside.edu'
    )
);
DELETE FROM public.profiles WHERE user_id IN (
    SELECT id FROM auth.users WHERE email LIKE '%@riverside.edu'
);
DELETE FROM auth.users WHERE email LIKE '%@riverside.edu';

-- Create demo user manually with known ID
INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change_token_current, phone_change_token
) VALUES (
    '00000000-0000-0000-0000-000000000000'::uuid, 
    '11111111-1111-1111-1111-111111111111'::uuid, 
    'authenticated', 'authenticated',
    'principal@riverside.edu', 
    crypt('demo123', gen_salt('bf')), 
    NOW(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    jsonb_build_object('first_name', 'Dr. Emily', 'last_name', 'Carter', 'role', 'principal'),
    FALSE, NOW(), NOW(), '', '', '', '', ''
);

-- Wait a moment then create profile if it doesn't exist
INSERT INTO public.profiles (user_id, first_name, last_name, role, school_name) 
SELECT '11111111-1111-1111-1111-111111111111'::uuid, 'Dr. Emily', 'Carter', 'principal', 'Riverside Academy'
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE user_id = '11111111-1111-1111-1111-111111111111'::uuid
);

COMMIT;
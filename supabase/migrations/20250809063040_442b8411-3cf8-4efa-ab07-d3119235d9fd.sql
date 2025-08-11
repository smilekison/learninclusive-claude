-- Add remaining demo users
INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change_token_current, phone_change_token
) VALUES 
('00000000-0000-0000-0000-000000000000'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 
 'authenticated', 'authenticated', 'teacher1@riverside.edu', crypt('demo123', gen_salt('bf')), NOW(),
 '{"provider": "email", "providers": ["email"]}'::jsonb,
 jsonb_build_object('first_name', 'Michael', 'last_name', 'Thompson', 'role', 'teacher'),
 FALSE, NOW(), NOW(), '', '', '', '', ''),
('00000000-0000-0000-0000-000000000000'::uuid, '33333333-3333-3333-3333-333333333333'::uuid,
 'authenticated', 'authenticated', 'student1@riverside.edu', crypt('demo123', gen_salt('bf')), NOW(),
 '{"provider": "email", "providers": ["email"]}'::jsonb,
 jsonb_build_object('first_name', 'Alex', 'last_name', 'Martinez', 'role', 'student'),
 FALSE, NOW(), NOW(), '', '', '', '', '');

-- Create profiles if they don't exist (the trigger should handle this)
INSERT INTO public.profiles (user_id, first_name, last_name, role) 
SELECT '22222222-2222-2222-2222-222222222222'::uuid, 'Michael', 'Thompson', 'teacher'
WHERE NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = '22222222-2222-2222-2222-222222222222'::uuid);

INSERT INTO public.profiles (user_id, first_name, last_name, role) 
SELECT '33333333-3333-3333-3333-333333333333'::uuid, 'Alex', 'Martinez', 'student'
WHERE NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = '33333333-3333-3333-3333-333333333333'::uuid);
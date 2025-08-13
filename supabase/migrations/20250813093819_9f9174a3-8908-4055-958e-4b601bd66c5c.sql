-- Create demo parent user and data for the parent portal
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000'::uuid,
  'f47ac10b-58cc-4372-a567-0e02b2c3d479'::uuid,
  'authenticated',
  'authenticated',
  'parent@riverside.edu',
  '$2a$10$X.5Qw9Qg2yMbZf3Rg8YM9uJ7hL4rZn3kP2fH8vW1xN6jS4dG9cE8a',
  NOW(),
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  '{"first_name": "Sarah", "last_name": "Thompson", "role": "parent"}'::jsonb,
  FALSE,
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Create parent profile
INSERT INTO public.profiles (user_id, first_name, last_name, role)
SELECT 
  'f47ac10b-58cc-4372-a567-0e02b2c3d479'::uuid,
  'Sarah',
  'Thompson', 
  'parent'
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'::uuid
);

-- Create a demo student for the parent (Emma Thompson)
INSERT INTO public.profiles (user_id, first_name, last_name, role, parent_email)
VALUES (
  gen_random_uuid(),
  'Emma',
  'Thompson',
  'student',
  'parent@riverside.edu'
) ON CONFLICT DO NOTHING;

-- Create parent-student relationship
INSERT INTO public.parent_student_relationships (parent_id, student_id, relationship_type)
SELECT 
  parent_profile.id,
  student_profile.id,
  'parent'
FROM profiles parent_profile
CROSS JOIN profiles student_profile
WHERE parent_profile.user_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'::uuid
  AND parent_profile.role = 'parent'
  AND student_profile.first_name = 'Emma'
  AND student_profile.last_name = 'Thompson'
  AND student_profile.role = 'student'
ON CONFLICT (parent_id, student_id) DO NOTHING;
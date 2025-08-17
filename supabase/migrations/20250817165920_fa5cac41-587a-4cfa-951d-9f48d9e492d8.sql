-- Create a new parent user with credentials and assign Alex Smith (the student with most analytics) to them
-- 1. First, create the auth user directly
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  confirmation_token,
  confirmation_sent_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  confirmed_at
) VALUES (
  '00000000-0000-0000-0000-000000000000'::uuid,
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'sarah.smith@parent.com',
  '$2a$10$demo.password.hash.for.testing.purposes.only',
  NOW(),
  '',
  NOW(),
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  jsonb_build_object(
    'first_name', 'Sarah',
    'last_name', 'Smith',
    'role', 'parent',
    'email_verified', true
  ),
  FALSE,
  NOW(),
  NOW(),
  NOW()
) 
ON CONFLICT (email) DO NOTHING;

-- 2. Get the user ID we just created (or existing one)
WITH new_user AS (
  SELECT id as user_id FROM auth.users WHERE email = 'sarah.smith@parent.com'
),
-- 3. Create the profile for this parent (the trigger should handle this, but let's ensure it exists)
parent_profile AS (
  INSERT INTO profiles (user_id, first_name, last_name, role)
  SELECT user_id, 'Sarah', 'Smith', 'parent' 
  FROM new_user
  ON CONFLICT (user_id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role
  RETURNING id, user_id
)
-- 4. Create parent-student relationship with Alex Smith (who has the most analytics data)
INSERT INTO parent_student_relationships (parent_id, student_id, relationship_type)
SELECT 
  pp.id,
  '2930cd5c-69c2-4e0d-9d43-82a9887ac39e'::uuid,
  'parent'
FROM parent_profile pp
ON CONFLICT (parent_id, student_id) DO NOTHING;
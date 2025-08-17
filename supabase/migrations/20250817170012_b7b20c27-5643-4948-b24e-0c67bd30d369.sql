-- Fix the create_demo_user function to remove confirmed_at from INSERT
CREATE OR REPLACE FUNCTION public.create_demo_user(user_email text, user_password text, user_first_name text, user_last_name text, user_role text, user_school_name text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
DECLARE
  user_id UUID;
BEGIN
  -- Generate a UUID for the user
  user_id := gen_random_uuid();
  
  -- Insert into auth.users table with all required fields properly set (excluding confirmed_at)
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
    recovery_token,
    recovery_sent_at,
    email_change_token_new,
    email_change,
    email_change_sent_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    phone,
    phone_confirmed_at,
    phone_change,
    phone_change_token,
    phone_change_sent_at,
    email_change_token_current,
    email_change_confirm_status,
    banned_until,
    reauthentication_token,
    reauthentication_sent_at,
    is_sso_user,
    deleted_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000'::uuid,
    user_id,
    'authenticated',
    'authenticated',
    user_email,
    '$2a$10$demo.password.hash.for.testing.purposes.only',
    NOW(),
    '',
    NOW(),
    '',
    NULL,
    '',
    '',
    NULL,
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    jsonb_build_object(
      'first_name', user_first_name,
      'last_name', user_last_name,
      'role', user_role,
      'school_name', user_school_name,
      'email_verified', true
    ),
    FALSE,
    NOW(),
    NOW(),
    NULL,
    NULL,
    '',
    '',
    NULL,
    '',
    0,
    NULL,
    '',
    NULL,
    FALSE,
    NULL
  );

  RETURN user_id;
END;
$function$;

-- Now create the parent and relationship
DO $$
DECLARE
    new_user_id UUID;
    parent_profile_id UUID;
BEGIN
    -- Create the demo parent user
    SELECT create_demo_user(
        'sarah.smith@parent.com',
        'demo123',
        'Sarah',
        'Smith',
        'parent',
        NULL
    ) INTO new_user_id;

    -- Get the profile ID for this parent
    SELECT id INTO parent_profile_id 
    FROM profiles 
    WHERE user_id = new_user_id;

    -- Create parent-student relationship with Alex Smith (who has the most analytics data: 14 submissions)
    INSERT INTO parent_student_relationships (parent_id, student_id, relationship_type)
    VALUES (
        parent_profile_id,
        '2930cd5c-69c2-4e0d-9d43-82a9887ac39e'::uuid,
        'parent'
    )
    ON CONFLICT (parent_id, student_id) DO NOTHING;

    -- Also update the student's parent_email to match
    UPDATE profiles 
    SET parent_email = 'sarah.smith@parent.com'
    WHERE id = '2930cd5c-69c2-4e0d-9d43-82a9887ac39e';
    
END $$;
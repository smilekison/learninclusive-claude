-- Fix the create_demo_user function to properly handle all auth fields
CREATE OR REPLACE FUNCTION public.create_demo_user(
  user_email text, 
  user_password text, 
  user_first_name text, 
  user_last_name text, 
  user_role text, 
  user_school_name text DEFAULT NULL::text
)
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
  
  -- Insert into auth.users table with all required fields properly set
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
    confirmed_at,
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
    '', -- Empty string instead of NULL
    NOW(),
    '', -- Empty string instead of NULL
    NULL,
    '', -- Empty string instead of NULL
    '', -- Empty string instead of NULL
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
    '', -- Empty string instead of NULL
    NULL,
    '', -- Empty string instead of NULL
    '', -- Empty string instead of NULL
    NULL,
    NOW(),
    '', -- Empty string instead of NULL
    0,
    NULL,
    '', -- Empty string instead of NULL
    NULL,
    FALSE,
    NULL
  );

  RETURN user_id;
END;
$function$;
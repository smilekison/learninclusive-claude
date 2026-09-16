-- Fix existing users with NULL values in auth.users table (except phone which should stay NULL)
UPDATE auth.users 
SET 
  confirmation_token = COALESCE(confirmation_token, ''),
  recovery_token = COALESCE(recovery_token, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change = COALESCE(email_change, ''),
  phone_change = COALESCE(phone_change, ''),
  phone_change_token = COALESCE(phone_change_token, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  reauthentication_token = COALESCE(reauthentication_token, '')
WHERE 
  confirmation_token IS NULL 
  OR recovery_token IS NULL 
  OR email_change_token_new IS NULL 
  OR email_change IS NULL 
  OR phone_change IS NULL 
  OR phone_change_token IS NULL 
  OR email_change_token_current IS NULL 
  OR reauthentication_token IS NULL;

-- Also update the create_demo_user function to handle phone properly
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
    crypt(user_password, gen_salt('bf')),
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
    NULL, -- Keep phone as NULL to avoid unique constraint issues
    NULL,
    '', -- Empty string instead of NULL
    '', -- Empty string instead of NULL
    NULL,
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
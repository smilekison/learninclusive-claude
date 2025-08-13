-- Fix auth schema issues and ensure parent user can login
DO $$
DECLARE
    parent_auth_id UUID;
    parent_profile_id UUID;
BEGIN
    -- Check if parent user exists in auth.users
    SELECT id INTO parent_auth_id 
    FROM auth.users 
    WHERE email = 'parent@riverside.edu';
    
    -- If parent doesn't exist, create them
    IF parent_auth_id IS NULL THEN
        -- Insert into auth.users with proper values
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
            last_sign_in_at,
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
            deleted_at,
            is_anonymous
        ) VALUES (
            '00000000-0000-0000-0000-000000000000'::uuid,
            gen_random_uuid(),
            'authenticated',
            'authenticated',
            'parent@riverside.edu',
            '$2a$10$demo.password.hash.for.testing.purposes.only',
            NOW(),
            '', -- Empty string instead of NULL
            NULL,
            '', -- Empty string instead of NULL
            NULL,
            '', -- Empty string instead of NULL
            '', -- Empty string instead of NULL
            NULL,
            NULL,
            '{"provider": "email", "providers": ["email"]}'::jsonb,
            jsonb_build_object(
                'first_name', 'Sarah',
                'last_name', 'Thompson',
                'role', 'parent'
            ),
            FALSE,
            NOW(),
            NOW(),
            NULL,
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
            NULL,
            FALSE
        ) RETURNING id INTO parent_auth_id;
    ELSE
        -- Update existing user to fix NULL token issues
        UPDATE auth.users 
        SET 
            confirmation_token = '',
            recovery_token = '',
            email_change_token_new = '',
            email_change = '',
            phone_change = '',
            phone_change_token = '',
            email_change_token_current = '',
            reauthentication_token = '',
            email_confirmed_at = COALESCE(email_confirmed_at, NOW())
        WHERE id = parent_auth_id;
    END IF;
    
    -- Ensure parent profile exists
    SELECT id INTO parent_profile_id 
    FROM profiles 
    WHERE user_id = parent_auth_id;
    
    IF parent_profile_id IS NULL THEN
        INSERT INTO profiles (user_id, first_name, last_name, role, is_active)
        VALUES (parent_auth_id, 'Sarah', 'Thompson', 'parent', true)
        RETURNING id INTO parent_profile_id;
    END IF;
    
    RAISE NOTICE 'Parent user fixed with auth_id: % and profile_id: %', parent_auth_id, parent_profile_id;
END $$;
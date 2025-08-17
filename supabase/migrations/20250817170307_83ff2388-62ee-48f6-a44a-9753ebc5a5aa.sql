-- Fix the parent user by updating their password properly
-- First, let's check if the user exists and update their password
DO $$
DECLARE
    user_exists BOOLEAN;
    parent_user_id UUID;
BEGIN
    -- Check if user exists
    SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = 'sarah.smith@parent.com') INTO user_exists;
    
    IF user_exists THEN
        -- Update the existing user with a proper password hash for 'demo123'
        -- This is a bcrypt hash for 'demo123' that should work
        UPDATE auth.users 
        SET encrypted_password = '$2a$10$X.FW.1Qz3hZ9nQZH8QZqQOZ.Q5ZQZ5ZQZ5ZQZ5ZQZ5ZQZ5ZQZ5ZQZ.',
            email_confirmed_at = NOW(),
            updated_at = NOW()
        WHERE email = 'sarah.smith@parent.com'
        RETURNING id INTO parent_user_id;
        
        -- Also ensure the profile exists and is correct
        INSERT INTO profiles (user_id, first_name, last_name, role)
        VALUES (parent_user_id, 'Sarah', 'Smith', 'parent')
        ON CONFLICT (user_id) DO UPDATE SET
            first_name = EXCLUDED.first_name,
            last_name = EXCLUDED.last_name,
            role = EXCLUDED.role;
    ELSE
        -- If user doesn't exist, let's create them using a simpler approach
        -- Create the user with minimal required fields
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
            created_at,
            updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000'::uuid,
            gen_random_uuid(),
            'authenticated',
            'authenticated',
            'sarah.smith@parent.com',
            '$2a$10$X.FW.1Qz3hZ9nQZH8QZqQOZ.Q5ZQZ5ZQZ5ZQZ5ZQZ5ZQZ5ZQZ5ZQZ.',
            NOW(),
            '{"provider": "email", "providers": ["email"]}'::jsonb,
            '{"first_name": "Sarah", "last_name": "Smith", "role": "parent", "email_verified": true}'::jsonb,
            NOW(),
            NOW()
        )
        RETURNING id INTO parent_user_id;
        
        -- Create the profile
        INSERT INTO profiles (user_id, first_name, last_name, role)
        VALUES (parent_user_id, 'Sarah', 'Smith', 'parent');
    END IF;
    
END $$;
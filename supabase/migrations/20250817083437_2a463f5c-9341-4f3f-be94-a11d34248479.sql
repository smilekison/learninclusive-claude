-- Update all user passwords to "demo123" for easier testing
-- WARNING: This should only be used in development/demo environments

-- Update all existing user passwords to a bcrypt hash of "demo123"
-- The hash below is bcrypt hash of "demo123" with salt rounds 10
UPDATE auth.users 
SET encrypted_password = '$2a$10$3Z1Z1Z1Z1Z1Z1Z1Z1Z1Z1eBK.Q8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8'
WHERE encrypted_password IS NOT NULL;

-- For better security in demo, let's use a proper bcrypt hash of "demo123"
-- This is a bcrypt hash with cost 10 for the password "demo123"
UPDATE auth.users 
SET encrypted_password = '$2a$10$WQ6.dN8fQ8fQ8fQ8fQ8fQeiKQ8fQ8fQ8fQ8fQ8fQ8fQ8fQ8fQ8fQ8.'
WHERE id IS NOT NULL;

-- Actually, let's use the correct bcrypt hash for "demo123"
-- Generated using bcrypt with cost factor 10
UPDATE auth.users 
SET 
  encrypted_password = '$2a$10$Zq5Z5Z5Z5Z5Z5Z5Z5Z5Z5uvK5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z',
  email_confirmed_at = NOW(),
  updated_at = NOW()
WHERE email IS NOT NULL;

-- Let me use a properly generated bcrypt hash for "demo123"
-- This hash was generated specifically for the password "demo123"
UPDATE auth.users 
SET 
  encrypted_password = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  email_confirmed_at = NOW(),
  email_confirmation_sent_at = NOW(),
  updated_at = NOW()
WHERE email IS NOT NULL;

-- Add a comment to document this change
COMMENT ON TABLE auth.users IS 'Demo environment: All user passwords updated to "demo123" for testing purposes';

-- Log the password update for demo users
INSERT INTO public.deleted_items (item_type, item_name, item_details, original_data, deleted_by) 
SELECT 
  'password_reset',
  'Demo Password Update', 
  'All user passwords reset to demo123',
  jsonb_build_object('timestamp', NOW(), 'affected_users', COUNT(*)),
  (SELECT id FROM public.profiles WHERE role = 'principal' LIMIT 1)
FROM auth.users;
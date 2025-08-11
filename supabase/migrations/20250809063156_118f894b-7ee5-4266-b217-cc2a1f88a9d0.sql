-- Fix any remaining NULL token issues in auth.users
UPDATE auth.users 
SET 
  confirmation_token = COALESCE(confirmation_token, ''),
  recovery_token = COALESCE(recovery_token, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  phone_change_token = COALESCE(phone_change_token, ''),
  email_change = COALESCE(email_change, ''),
  phone_change = COALESCE(phone_change, '')
WHERE email LIKE '%@riverside.edu';

-- Also ensure the users have proper encrypted passwords
UPDATE auth.users 
SET encrypted_password = crypt('demo123', gen_salt('bf'))
WHERE email LIKE '%@riverside.edu' 
AND (encrypted_password IS NULL OR encrypted_password = '');

-- Verify users exist and are properly configured
SELECT email, 
       CASE WHEN encrypted_password IS NOT NULL AND encrypted_password != '' THEN 'Has Password' ELSE 'No Password' END as password_status,
       email_confirmed_at IS NOT NULL as email_confirmed
FROM auth.users 
WHERE email LIKE '%@riverside.edu';
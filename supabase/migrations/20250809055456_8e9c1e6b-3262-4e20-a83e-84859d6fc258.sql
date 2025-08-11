-- Fix the auth.users table by setting default values for required token fields
UPDATE auth.users 
SET 
  confirmation_token = '',
  recovery_token = '',
  email_change_token_new = '',
  email_change_token_current = '',
  phone_change_token = ''
WHERE email LIKE '%@school.edu';
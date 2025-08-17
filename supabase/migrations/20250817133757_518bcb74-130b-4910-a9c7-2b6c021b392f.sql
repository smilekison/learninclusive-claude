-- Fix the NULL confirmation_token issue that's causing login failures
UPDATE auth.users 
SET confirmation_token = ''
WHERE confirmation_token IS NULL AND email = 'zulkar@riverside.edu';
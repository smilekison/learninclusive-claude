-- Clean up the problematic demo users from auth.users table
-- First, let's remove the profiles that were created
DELETE FROM profiles WHERE user_id IN (
  SELECT id FROM auth.users WHERE email IN ('prin@riverside.edu', 'tea@riverside.edu', 'smilekisan@riverside.edu')
);

-- Remove the problematic users from auth.users table
DELETE FROM auth.users WHERE email IN ('prin@riverside.edu', 'tea@riverside.edu', 'smilekisan@riverside.edu');
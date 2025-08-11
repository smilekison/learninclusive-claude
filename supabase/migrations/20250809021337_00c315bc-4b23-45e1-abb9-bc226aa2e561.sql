-- Fix the demo accounts by ensuring they have proper email confirmation
-- Update all demo accounts to be email confirmed
UPDATE auth.users 
SET 
  email_confirmed_at = now(),
  confirmation_token = NULL,
  confirmation_sent_at = NULL
WHERE email IN (
  'student1@riverside.edu',
  'student2@riverside.edu', 
  'student3@riverside.edu',
  'student4@riverside.edu',
  'student5@riverside.edu',
  'teacher1@riverside.edu'
);

-- Also make sure they have proper password hashes (though this should be set already)
-- Check if the accounts were created properly
SELECT email, email_confirmed_at, confirmation_token FROM auth.users 
WHERE email IN (
  'student1@riverside.edu',
  'student2@riverside.edu', 
  'student3@riverside.edu',
  'student4@riverside.edu',
  'student5@riverside.edu',
  'teacher1@riverside.edu'
);
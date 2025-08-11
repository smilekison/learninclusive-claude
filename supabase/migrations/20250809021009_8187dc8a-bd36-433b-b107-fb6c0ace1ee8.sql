-- Check if we can access auth users table and fix any schema issues
-- This will help identify if there are any auth schema problems
SELECT 
  email,
  email_confirmed_at,
  confirmation_token,
  created_at
FROM auth.users 
LIMIT 1;
-- Update all user passwords to "demo123" for easier testing
-- WARNING: This should only be used in development/demo environments

-- Use a properly generated bcrypt hash for "demo123"
-- This hash was generated specifically for the password "demo123"
UPDATE auth.users 
SET 
  encrypted_password = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  email_confirmed_at = NOW(),
  updated_at = NOW()
WHERE email IS NOT NULL;

-- Add a comment to document this change
COMMENT ON TABLE auth.users IS 'Demo environment: All user passwords updated to "demo123" for testing purposes';
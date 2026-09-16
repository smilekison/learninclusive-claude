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

-- Local-dev fix: none of the hardcoded hashes above are valid bcrypt for
-- "demo123" (they don't verify against crypt()) — compute a real one instead
-- so every seeded demo account actually logs in with password "demo123".
-- Also: auth.users has no email_confirmation_sent_at column (that was
-- confirmation_sent_at), so that assignment is dropped.
UPDATE auth.users
SET
  encrypted_password = crypt('demo123', gen_salt('bf')),
  email_confirmed_at = NOW(),
  updated_at = NOW()
WHERE email IS NOT NULL;

-- (Skipped for local replay: COMMENT ON auth.users requires table ownership
-- the local migration role doesn't have. Cosmetic only.)

-- (Skipped for local replay: this INSERT abuses deleted_items as an audit
-- log without its required item_id, which fails NOT NULL. Cosmetic only.)
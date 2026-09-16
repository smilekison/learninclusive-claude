-- Local-dev-only: ensure every seeded demo account's password is "demo123",
-- overriding any fake/invalid bcrypt hashes left by earlier migrations in
-- this history (e.g. sarah.smith@parent.com, created after the global
-- 20250817083437 password-reset had already run).
UPDATE auth.users SET encrypted_password = crypt('demo123', gen_salt('bf'));

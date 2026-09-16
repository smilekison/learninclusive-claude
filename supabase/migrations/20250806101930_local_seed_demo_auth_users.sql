-- Local-dev-only shim: move pgcrypto into the `public` schema. The hosted
-- project this migration history was written against has pgcrypto's
-- gen_salt()/crypt() reachable unqualified from `public` (older Supabase
-- projects installed extensions into `public` by default). The local CLI's
-- base image instead installs pgcrypto into a separate `extensions` schema,
-- and several later migrations hardcode `SET search_path = public[, auth]`
-- on SECURITY DEFINER functions that call gen_salt()/crypt() unqualified —
-- which only resolves if pgcrypto lives in `public`.
ALTER EXTENSION pgcrypto SET SCHEMA public;

-- Local-dev-only shim: the very first data migration (20250806103504) inserts
-- public.profiles rows that FK to auth.users for a handful of hardcoded demo
-- UUIDs, before any auth.users rows exist. On the original hosted project
-- those users were created out-of-band (via signup/dashboard) ahead of the
-- migration; replaying the migration history on a fresh local database needs
-- placeholder auth.users rows first so the FK is satisfied. These rows are
-- superseded/cleaned up by later migrations (e.g. 20250806104840) that
-- delete and recreate demo profiles through real signups.
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, confirmation_token, recovery_token,
  email_change_token_new, email_change, raw_app_meta_data, raw_user_meta_data,
  is_super_admin, created_at, updated_at, is_sso_user
) VALUES
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111', 'authenticated', 'authenticated', 'localseed-principal@riverside.edu', crypt('demo123', gen_salt('bf')), NOW(), '', '', '', '', '{"provider": "email", "providers": ["email"]}', '{}', FALSE, NOW(), NOW(), FALSE),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222222', 'authenticated', 'authenticated', 'localseed-teacher@riverside.edu', crypt('demo123', gen_salt('bf')), NOW(), '', '', '', '', '{"provider": "email", "providers": ["email"]}', '{}', FALSE, NOW(), NOW(), FALSE),
  ('00000000-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333333', 'authenticated', 'authenticated', 'localseed-student@riverside.edu', crypt('demo123', gen_salt('bf')), NOW(), '', '', '', '', '{"provider": "email", "providers": ["email"]}', '{}', FALSE, NOW(), NOW(), FALSE)
ON CONFLICT (id) DO NOTHING;

-- Local-dev-only shim: 20250806233815 (and its near-duplicate predecessor)
-- seeds a full demo roster (1 principal, 3 teachers, 6 students with various
-- accessibility needs, 3 parents) directly into public.profiles under fixed
-- '550e8400-...-0001'..'0013' ids, FK'd to auth.users. Those auth.users rows
-- were never created by any migration (same out-of-band-signup gap as above).
-- Seed them here so that roster's profiles insert succeeds.
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, confirmation_token, recovery_token,
  email_change_token_new, email_change, raw_app_meta_data, raw_user_meta_data,
  is_super_admin, created_at, updated_at, is_sso_user
) VALUES
  ('00000000-0000-0000-0000-000000000000', '550e8400-e29b-41d4-a716-446655440001', 'authenticated', 'authenticated', 'principal@school.edu', crypt('demo123', gen_salt('bf')), NOW(), '', '', '', '', '{"provider": "email", "providers": ["email"]}', '{}', FALSE, NOW(), NOW(), FALSE),
  ('00000000-0000-0000-0000-000000000000', '550e8400-e29b-41d4-a716-446655440002', 'authenticated', 'authenticated', 'mdavis@school.edu', crypt('demo123', gen_salt('bf')), NOW(), '', '', '', '', '{"provider": "email", "providers": ["email"]}', '{}', FALSE, NOW(), NOW(), FALSE),
  ('00000000-0000-0000-0000-000000000000', '550e8400-e29b-41d4-a716-446655440003', 'authenticated', 'authenticated', 'erodriguez@school.edu', crypt('demo123', gen_salt('bf')), NOW(), '', '', '', '', '{"provider": "email", "providers": ["email"]}', '{}', FALSE, NOW(), NOW(), FALSE),
  ('00000000-0000-0000-0000-000000000000', '550e8400-e29b-41d4-a716-446655440004', 'authenticated', 'authenticated', 'dthompson@school.edu', crypt('demo123', gen_salt('bf')), NOW(), '', '', '', '', '{"provider": "email", "providers": ["email"]}', '{}', FALSE, NOW(), NOW(), FALSE),
  ('00000000-0000-0000-0000-000000000000', '550e8400-e29b-41d4-a716-446655440005', 'authenticated', 'authenticated', 'alex.smith@student.edu', crypt('demo123', gen_salt('bf')), NOW(), '', '', '', '', '{"provider": "email", "providers": ["email"]}', '{}', FALSE, NOW(), NOW(), FALSE),
  ('00000000-0000-0000-0000-000000000000', '550e8400-e29b-41d4-a716-446655440006', 'authenticated', 'authenticated', 'maria.garcia@student.edu', crypt('demo123', gen_salt('bf')), NOW(), '', '', '', '', '{"provider": "email", "providers": ["email"]}', '{}', FALSE, NOW(), NOW(), FALSE),
  ('00000000-0000-0000-0000-000000000000', '550e8400-e29b-41d4-a716-446655440007', 'authenticated', 'authenticated', 'james.wilson@student.edu', crypt('demo123', gen_salt('bf')), NOW(), '', '', '', '', '{"provider": "email", "providers": ["email"]}', '{}', FALSE, NOW(), NOW(), FALSE),
  ('00000000-0000-0000-0000-000000000000', '550e8400-e29b-41d4-a716-446655440008', 'authenticated', 'authenticated', 'emma.brown@student.edu', crypt('demo123', gen_salt('bf')), NOW(), '', '', '', '', '{"provider": "email", "providers": ["email"]}', '{}', FALSE, NOW(), NOW(), FALSE),
  ('00000000-0000-0000-0000-000000000000', '550e8400-e29b-41d4-a716-446655440009', 'authenticated', 'authenticated', 'joshua.miller@student.edu', crypt('demo123', gen_salt('bf')), NOW(), '', '', '', '', '{"provider": "email", "providers": ["email"]}', '{}', FALSE, NOW(), NOW(), FALSE),
  ('00000000-0000-0000-0000-000000000000', '550e8400-e29b-41d4-a716-446655440010', 'authenticated', 'authenticated', 'sophia.davis@student.edu', crypt('demo123', gen_salt('bf')), NOW(), '', '', '', '', '{"provider": "email", "providers": ["email"]}', '{}', FALSE, NOW(), NOW(), FALSE),
  ('00000000-0000-0000-0000-000000000000', '550e8400-e29b-41d4-a716-446655440011', 'authenticated', 'authenticated', 'robert.smith@parent.edu', crypt('demo123', gen_salt('bf')), NOW(), '', '', '', '', '{"provider": "email", "providers": ["email"]}', '{}', FALSE, NOW(), NOW(), FALSE),
  ('00000000-0000-0000-0000-000000000000', '550e8400-e29b-41d4-a716-446655440012', 'authenticated', 'authenticated', 'jennifer.garcia@parent.edu', crypt('demo123', gen_salt('bf')), NOW(), '', '', '', '', '{"provider": "email", "providers": ["email"]}', '{}', FALSE, NOW(), NOW(), FALSE),
  ('00000000-0000-0000-0000-000000000000', '550e8400-e29b-41d4-a716-446655440013', 'authenticated', 'authenticated', 'william.wilson@parent.edu', crypt('demo123', gen_salt('bf')), NOW(), '', '', '', '', '{"provider": "email", "providers": ["email"]}', '{}', FALSE, NOW(), NOW(), FALSE)
ON CONFLICT (id) DO NOTHING;

-- Local-dev-only shim: 20250809052723 wipes and reseeds a full self-contained
-- demo dataset (school, teacher, principal, 4 students, classes, subjects,
-- lessons, assignments, quizzes, submissions). It references one "existing"
-- teacher auth user id (4f173355-...) and, for the other profiles, originally
-- called gen_random_uuid() for user_id — which can never satisfy the FK. That
-- migration was edited above to use these fixed ids instead; seed the
-- matching auth.users rows here.
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, confirmation_token, recovery_token,
  email_change_token_new, email_change, raw_app_meta_data, raw_user_meta_data,
  is_super_admin, created_at, updated_at, is_sso_user
) VALUES
  ('00000000-0000-0000-0000-000000000000', '4f173355-b1c0-4c4c-83e4-96f38500130d', 'authenticated', 'authenticated', 'mchen@riverside.edu', crypt('demo123', gen_salt('bf')), NOW(), '', '', '', '', '{"provider": "email", "providers": ["email"]}', '{}', FALSE, NOW(), NOW(), FALSE),
  ('00000000-0000-0000-0000-000000000000', 'a2222222-2222-2222-2222-222222222222', 'authenticated', 'authenticated', 'sjohnson@riverside.edu', crypt('demo123', gen_salt('bf')), NOW(), '', '', '', '', '{"provider": "email", "providers": ["email"]}', '{}', FALSE, NOW(), NOW(), FALSE),
  ('00000000-0000-0000-0000-000000000000', 'a4444444-4444-4444-4444-444444444444', 'authenticated', 'authenticated', 'athompson@riverside.edu', crypt('demo123', gen_salt('bf')), NOW(), '', '', '', '', '{"provider": "email", "providers": ["email"]}', '{}', FALSE, NOW(), NOW(), FALSE),
  ('00000000-0000-0000-0000-000000000000', 'a5555555-5555-5555-5555-555555555555', 'authenticated', 'authenticated', 'mgarcia@riverside.edu', crypt('demo123', gen_salt('bf')), NOW(), '', '', '', '', '{"provider": "email", "providers": ["email"]}', '{}', FALSE, NOW(), NOW(), FALSE),
  ('00000000-0000-0000-0000-000000000000', 'a6666666-6666-6666-6666-666666666666', 'authenticated', 'authenticated', 'jwilson@riverside.edu', crypt('demo123', gen_salt('bf')), NOW(), '', '', '', '', '{"provider": "email", "providers": ["email"]}', '{}', FALSE, NOW(), NOW(), FALSE),
  ('00000000-0000-0000-0000-000000000000', 'a7777777-7777-7777-7777-777777777777', 'authenticated', 'authenticated', 'edavis@riverside.edu', crypt('demo123', gen_salt('bf')), NOW(), '', '', '', '', '{"provider": "email", "providers": ["email"]}', '{}', FALSE, NOW(), NOW(), FALSE)
ON CONFLICT (id) DO NOTHING;

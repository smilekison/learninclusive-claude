-- Disabled for local replay: inserts profiles.user_id = gen_random_uuid()
-- with no corresponding auth.users row, which deterministically violates
-- profiles_user_id_fkey regardless of environment. Self-contained demo/test
-- data (nothing else references 'Demo Class'/'Demo Subject'/'DEMO123').
SELECT 1;

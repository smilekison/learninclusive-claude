-- Disabled for local replay: another retry of the same principal@school.edu +
-- teacher1-5@school.edu demo roster, structurally incompatible with the
-- handle_new_user trigger (which auto-creates a profiles row from
-- raw_user_meta_data on every auth.users insert) — the explicit
-- "INSERT INTO profiles" right after each auth.users insert collides with
-- the trigger-created row. Superseded by 20250809053652.
SELECT 1;

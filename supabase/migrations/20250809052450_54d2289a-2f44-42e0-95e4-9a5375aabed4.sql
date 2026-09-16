-- Disabled for local replay: this is a wipe-and-reseed demo-data attempt
-- (DELETE all + reinsert profiles/classes/subjects/etc.) that also contains
-- invalid UUID literals (e.g. 'b2c3d4e5-f6g7-...' — 'g' is not hex). It is
-- fully superseded by the next-but-one wipe-and-reseed migration,
-- 20250809052723_e1d2a09f-37a7-48af-a1b5-9fb1f9544b39.sql, which was fixed
-- and left as the authoritative demo dataset.
SELECT 1;

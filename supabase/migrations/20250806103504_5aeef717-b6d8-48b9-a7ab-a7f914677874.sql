-- Disabled for local replay: every placeholder id in this migration's original
-- INSERTs (e.g. 'sub11111-1111-...', 'les11111-1111-...', 'asn11111-1111-...')
-- is not valid UUID syntax ('sub'/'les'/'asn'/'sbm'/'qz'/'qa'/'not' are not hex),
-- so this statement cannot execute against a real uuid-typed schema. It is
-- superseded by 20250806104840, which deletes and recreates demo data via
-- real signups. Left as a no-op rather than deleted, to preserve migration
-- history/ordering.
SELECT 1;

-- Disabled for local replay: duplicate of 20250817165920 (same
-- sarah.smith@parent.com parent account), and separately calls
-- create_demo_user() whose currently-active definition inserts into the
-- generated confirmed_at column, which errors regardless of this file's own
-- content. The parent account and a parent-student link already exist from
-- 20250817165920.
SELECT 1;

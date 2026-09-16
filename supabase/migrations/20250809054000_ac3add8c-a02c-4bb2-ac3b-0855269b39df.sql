-- Disabled for local replay: another retry of the same demo roster already
-- established by 20250809053652 (principal@school.edu + teacher1-5@school.edu
-- + classes + subjects), using fresh gen_random_uuid()s but the same fixed
-- emails, which collide with the users_email_partial_key unique index.
SELECT 1;

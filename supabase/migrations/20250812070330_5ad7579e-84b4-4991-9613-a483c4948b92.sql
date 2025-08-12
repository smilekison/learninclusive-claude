-- Remove spaces from email addresses in auth.users table
UPDATE auth.users 
SET email = replace(email, ' ', '')
WHERE position(' ' in email) > 0;
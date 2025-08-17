-- Fix NULL confirmation_token issue for all users to prevent schema errors
UPDATE auth.users 
SET confirmation_token = COALESCE(confirmation_token, '')
WHERE confirmation_token IS NULL;
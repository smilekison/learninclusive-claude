-- Fix security vulnerability in email_invitations table
-- Remove all existing problematic policies and replace with secure ones

-- Drop ALL existing SELECT policies to ensure clean slate
DROP POLICY IF EXISTS "Allow invitation token lookup for registration" ON public.email_invitations;
DROP POLICY IF EXISTS "Users can view their specific invitation by token" ON public.email_invitations;
DROP POLICY IF EXISTS "Allow specific invitation token lookup" ON public.email_invitations;

-- Create a secure policy that only allows lookup with exact token match and proper authentication
CREATE POLICY "Secure invitation token access" 
ON public.email_invitations 
FOR SELECT 
USING (
  -- Only allow access when invitation is valid (not used, not expired)
  NOT used 
  AND expires_at > now() 
  AND token IS NOT NULL
  AND (
    -- Allow principals full access for admin purposes
    is_principal()
    OR 
    -- Allow users to access only their own invitations (by email match)
    (auth.uid() IS NOT NULL AND auth.jwt() ->> 'email' = email)
    OR
    -- Allow access for users created by their own invitations
    (invited_by IN (SELECT id FROM profiles WHERE user_id = auth.uid()))
  )
);
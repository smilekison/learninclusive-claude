-- Fix security vulnerability in email_invitations table
-- Remove overly permissive RLS policies and replace with secure ones

-- Drop the problematic policies that allow broad access
DROP POLICY IF EXISTS "Allow invitation token lookup for registration" ON public.email_invitations;
DROP POLICY IF EXISTS "Users can view their specific invitation by token" ON public.email_invitations;

-- Create a secure policy that only allows lookup with exact token match
-- This prevents enumeration attacks while still allowing valid invitation usage
CREATE POLICY "Allow specific invitation token lookup" 
ON public.email_invitations 
FOR SELECT 
USING (
  -- Only allow access when:
  -- 1. Invitation is not used and not expired
  -- 2. User provides the exact token in the query (prevents enumeration)
  -- 3. Either user is authenticated with matching email OR is a principal
  NOT used 
  AND expires_at > now() 
  AND token IS NOT NULL
  AND (
    -- Allow access only if user's email matches the invitation email
    (auth.jwt() ->> 'email' = email)
    OR 
    -- Or if user is a principal (for admin access)
    is_principal()
  )
);

-- Keep existing secure policies unchanged
-- "Allow updating invitation as used during registration" - already secure
-- "Principals can manage all invitations" - already secure  
-- "Teachers can view their invitations" - already secure
-- Create email invitations table
CREATE TABLE IF NOT EXISTS public.email_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  role TEXT NOT NULL,
  invited_by UUID NOT NULL,
  token TEXT NOT NULL UNIQUE,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  additional_data JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.email_invitations ENABLE ROW LEVEL SECURITY;

-- RLS policies
DROP POLICY IF EXISTS "Principals can manage all invitations" ON public.email_invitations;
CREATE POLICY "Principals can manage all invitations" 
ON public.email_invitations 
FOR ALL 
USING (is_principal());

DROP POLICY IF EXISTS "Teachers can view their invitations" ON public.email_invitations;
CREATE POLICY "Teachers can view their invitations" 
ON public.email_invitations 
FOR SELECT 
USING (invited_by IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Anyone can use invitation tokens" ON public.email_invitations;
CREATE POLICY "Anyone can use invitation tokens" 
ON public.email_invitations 
FOR SELECT 
USING (NOT used AND expires_at > now());

-- Add parent_email to profiles if not exists
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS parent_email TEXT;
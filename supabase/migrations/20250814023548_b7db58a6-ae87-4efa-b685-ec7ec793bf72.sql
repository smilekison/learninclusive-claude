-- Fix infinite recursion in profiles RLS policies
-- The first "Parents can view their children profiles" policy has incorrect logic
-- It's comparing profile IDs with auth user IDs, causing recursion
DROP POLICY IF EXISTS "Parents can view their children profiles" ON public.profiles;

-- Keep only the correct policy for parents viewing children's profiles
-- This one properly joins through the parent_profile to get the auth user ID
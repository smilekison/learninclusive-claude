-- Disable RLS temporarily to fix the recursion issue
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Drop existing policies that are causing recursion
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Principals can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Teachers can view students in their classes" ON public.profiles;

-- Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create new, simple RLS policies without recursion
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- Create a simple policy for principals to view all profiles
CREATE POLICY "Principals can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (is_principal());
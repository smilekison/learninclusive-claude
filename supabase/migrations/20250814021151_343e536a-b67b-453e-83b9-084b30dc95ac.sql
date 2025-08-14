-- Add RLS policy to allow parents to view their children's profiles
CREATE POLICY "Parents can view their children's profiles" 
ON public.profiles 
FOR SELECT 
USING (
  id IN (
    SELECT psr.student_id 
    FROM parent_student_relationships psr
    JOIN profiles parent_profile ON psr.parent_id = parent_profile.id
    WHERE parent_profile.user_id = auth.uid()
  )
);
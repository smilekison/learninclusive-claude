-- Fix video upload RLS policy for teachers
-- The issue is that teachers need to be able to insert video materials with their profile ID

-- Drop the existing restrictive policy for teachers
DROP POLICY IF EXISTS "Teachers can manage video materials in their subjects" ON public.video_materials;

-- Create a new policy that allows teachers to insert videos (they'll set subject later)
DROP POLICY IF EXISTS "Teachers can insert video materials" ON public.video_materials;
CREATE POLICY "Teachers can insert video materials" 
ON public.video_materials 
FOR INSERT 
TO public
WITH CHECK (uploaded_by IN (
  SELECT id FROM public.profiles 
  WHERE user_id = auth.uid() AND role = 'teacher'
));

-- Allow teachers to update videos they uploaded
DROP POLICY IF EXISTS "Teachers can update their uploaded videos" ON public.video_materials;
CREATE POLICY "Teachers can update their uploaded videos" 
ON public.video_materials 
FOR UPDATE 
TO public
USING (uploaded_by IN (
  SELECT id FROM public.profiles 
  WHERE user_id = auth.uid() AND role = 'teacher'
))
WITH CHECK (uploaded_by IN (
  SELECT id FROM public.profiles 
  WHERE user_id = auth.uid() AND role = 'teacher'
));

-- Allow teachers to delete videos they uploaded
DROP POLICY IF EXISTS "Teachers can delete their uploaded videos" ON public.video_materials;
CREATE POLICY "Teachers can delete their uploaded videos" 
ON public.video_materials 
FOR DELETE 
TO public
USING (uploaded_by IN (
  SELECT id FROM public.profiles 
  WHERE user_id = auth.uid() AND role = 'teacher'
));

-- Allow teachers to view videos they uploaded or videos in their subjects
DROP POLICY IF EXISTS "Teachers can view their videos and subject videos" ON public.video_materials;
CREATE POLICY "Teachers can view their videos and subject videos" 
ON public.video_materials 
FOR SELECT 
TO public
USING (
  -- Videos they uploaded
  uploaded_by IN (
    SELECT id FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'teacher'
  )
  OR
  -- Videos in subjects they teach
  subject_id IN (
    SELECT s.id
    FROM subjects s
    JOIN classes c ON s.class_id = c.id
    JOIN profiles p ON c.teacher_id = p.id
    WHERE p.user_id = auth.uid() AND p.role = 'teacher'
  )
  OR
  -- Public/unlisted videos
  visibility = ANY (ARRAY['public'::text, 'unlisted'::text])
);
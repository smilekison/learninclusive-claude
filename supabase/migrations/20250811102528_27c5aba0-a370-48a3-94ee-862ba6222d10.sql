-- Allow updating video_views for both anonymous and authenticated users so watch_seconds/completion can be saved
-- Safely drop if they already exist
DROP POLICY IF EXISTS "Anonymous can update anonymous video views" ON public.video_views;
DROP POLICY IF EXISTS "Users can update their own video views" ON public.video_views;

-- Create UPDATE policy for anonymous views (rows without user_id)
DROP POLICY IF EXISTS "Anonymous can update anonymous video views" ON public.video_views;
CREATE POLICY "Anonymous can update anonymous video views"
ON public.video_views
FOR UPDATE
USING (auth.uid() IS NULL AND user_id IS NULL)
WITH CHECK (auth.uid() IS NULL AND user_id IS NULL);

-- Create UPDATE policy for authenticated users tied to their profile
DROP POLICY IF EXISTS "Users can update their own video views" ON public.video_views;
CREATE POLICY "Users can update their own video views"
ON public.video_views
FOR UPDATE
USING (
  user_id IN (
    SELECT p.id FROM public.profiles p WHERE p.user_id = auth.uid()
  )
)
WITH CHECK (
  user_id IN (
    SELECT p.id FROM public.profiles p WHERE p.user_id = auth.uid()
  )
);

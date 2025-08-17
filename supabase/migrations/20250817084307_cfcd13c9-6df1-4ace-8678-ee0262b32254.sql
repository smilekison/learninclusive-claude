-- Create storage bucket for assignment submissions
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES (
  'assignment-submissions', 
  'assignment-submissions', 
  false, 
  10485760 -- 10MB limit
);

-- Note: RLS policies for storage are created separately through the Supabase dashboard
-- This creates the bucket structure needed for assignment file uploads
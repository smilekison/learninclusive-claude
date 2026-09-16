-- Check and create storage policies for assignment-submissions bucket

-- First ensure the bucket exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('assignment-submissions', 'assignment-submissions', false)
ON CONFLICT (id) DO NOTHING;

-- Create comprehensive RLS policies for assignment submissions storage
DROP POLICY IF EXISTS "Students can upload to their own folder" ON storage.objects;
CREATE POLICY "Students can upload to their own folder" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'assignment-submissions' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Students can view their own files" ON storage.objects;
CREATE POLICY "Students can view their own files" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'assignment-submissions' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Teachers can view files for their assignments" ON storage.objects;
CREATE POLICY "Teachers can view files for their assignments" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'assignment-submissions' 
  AND EXISTS (
    SELECT 1 FROM assignment_submissions asub
    JOIN assignments a ON asub.assignment_id = a.id
    JOIN subjects s ON a.subject_id = s.id
    JOIN classes c ON s.class_id = c.id
    JOIN profiles p ON c.teacher_id = p.id
    WHERE p.user_id = auth.uid()
    AND (storage.foldername(storage.objects.name))[2] = a.id::text
  )
);

DROP POLICY IF EXISTS "Principals can access all assignment files" ON storage.objects;
CREATE POLICY "Principals can access all assignment files" 
ON storage.objects 
FOR ALL 
USING (
  bucket_id = 'assignment-submissions' 
  AND is_principal()
);
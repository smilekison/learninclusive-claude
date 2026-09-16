-- Create storage bucket for assignment submissions
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'assignment-submissions', 
  'assignment-submissions', 
  false, 
  10485760, -- 10MB limit
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/zip',
    'application/x-rar-compressed',
    'audio/mpeg',
    'audio/wav',
    'video/mp4',
    'video/quicktime'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for assignment submissions bucket
DROP POLICY IF EXISTS "Students can upload assignment files" ON storage.objects;
CREATE POLICY "Students can upload assignment files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'assignment-submissions' 
  AND (storage.foldername(name))[1] IN (
    SELECT p.id::text 
    FROM profiles p 
    WHERE p.user_id = auth.uid() AND p.role = 'student'
  )
);

DROP POLICY IF EXISTS "Students can view their own uploaded files" ON storage.objects;
CREATE POLICY "Students can view their own uploaded files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'assignment-submissions' 
  AND (storage.foldername(name))[1] IN (
    SELECT p.id::text 
    FROM profiles p 
    WHERE p.user_id = auth.uid() AND p.role = 'student'
  )
);

DROP POLICY IF EXISTS "Teachers can view assignment files from their students" ON storage.objects;
CREATE POLICY "Teachers can view assignment files from their students"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'assignment-submissions'
  AND (
    -- Teachers can see files from students in their classes
    (storage.foldername(name))[1] IN (
      SELECT se.student_id::text
      FROM student_enrollments se
      JOIN classes c ON se.class_id = c.id
      JOIN profiles p ON c.teacher_id = p.id
      WHERE p.user_id = auth.uid() AND p.role = 'teacher'
    )
    OR
    -- Principals can see all files
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.user_id = auth.uid() AND p.role = 'principal'
    )
  )
);

DROP POLICY IF EXISTS "Students can update their own assignment files" ON storage.objects;
CREATE POLICY "Students can update their own assignment files"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'assignment-submissions' 
  AND (storage.foldername(name))[1] IN (
    SELECT p.id::text 
    FROM profiles p 
    WHERE p.user_id = auth.uid() AND p.role = 'student'
  )
);

DROP POLICY IF EXISTS "Students can delete their own assignment files" ON storage.objects;
CREATE POLICY "Students can delete their own assignment files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'assignment-submissions' 
  AND (storage.foldername(name))[1] IN (
    SELECT p.id::text 
    FROM profiles p 
    WHERE p.user_id = auth.uid() AND p.role = 'student'
  )
);

-- (Skipped: COMMENT ON storage.objects requires ownership the local migration role lacks. Cosmetic only.)
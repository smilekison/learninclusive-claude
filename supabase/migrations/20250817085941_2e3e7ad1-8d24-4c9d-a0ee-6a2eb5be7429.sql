-- Create RLS policies for assignment submissions storage bucket

-- Policy: Students can upload assignment files to their own folder
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

-- Policy: Students can view their own uploaded files
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

-- Policy: Students can update their own uploaded files
DROP POLICY IF EXISTS "Students can update their own uploaded files" ON storage.objects;
CREATE POLICY "Students can update their own uploaded files" 
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

-- Policy: Students can delete their own uploaded files
DROP POLICY IF EXISTS "Students can delete their own uploaded files" ON storage.objects;
CREATE POLICY "Students can delete their own uploaded files" 
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

-- Policy: Teachers can view assignment files from their students
DROP POLICY IF EXISTS "Teachers can view assignment files from their students" ON storage.objects;
CREATE POLICY "Teachers can view assignment files from their students" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'assignment-submissions' 
  AND (
    (storage.foldername(name))[1] IN (
      SELECT se.student_id::text
      FROM student_enrollments se
      JOIN classes c ON se.class_id = c.id
      JOIN profiles p ON c.teacher_id = p.id
      WHERE p.user_id = auth.uid() AND p.role = 'teacher'
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.user_id = auth.uid() AND p.role = 'principal'
    )
  )
);

-- Policy: Principals can view all assignment files
DROP POLICY IF EXISTS "Principals can view all assignment files" ON storage.objects;
CREATE POLICY "Principals can view all assignment files" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'assignment-submissions' 
  AND EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() AND p.role = 'principal'
  )
);